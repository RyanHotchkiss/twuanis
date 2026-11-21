'use strict'

// Durable, local-only source-observation archive.  The newline-delimited JSON
// checkpoint is written synchronously per observation, so an interrupted
// process still leaves a replayable source record behind.  The CSV is a
// review projection; it never replaces the original observation evidence.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { createClient } = require('@supabase/supabase-js')

// Workers launched outside Next do not automatically receive .env.local.
// Load it only when a caller has not already supplied the service credentials.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try { require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true }) } catch { /* local archive remains available */ }
}

// Checkpoints are intentionally small and immutable-in-practice batches.  A
// source observation is first written synchronously to local disk, then queued
// for private remote persistence.  The queue is flushed every 10 records or
// 15 seconds (whichever comes first), with a final forced flush at run end.
// A remote outage never discards local evidence or stops collection.
const REMOTE_BUCKET = process.env.TWUANIS_SCRAPER_ARCHIVE_BUCKET || 'twuanis-scraper-archives'
const REMOTE_BATCH_SIZE = 10
const REMOTE_FLUSH_MS = 15_000
const safeSegment = value => String(value || 'unknown').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown'

function createRemoteArchive(meta = {}) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { enabled: false, status: 'unavailable', reason: 'SUPABASE_STORAGE_CREDENTIALS_UNAVAILABLE', enqueue() {}, flush: async () => ({ uploaded: 0 }), finalize: async () => ({ uploaded: 0 }), summary: () => ({ enabled: false, status: 'unavailable', reason: 'SUPABASE_STORAGE_CREDENTIALS_UNAVAILABLE' }) }
  }
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const runId = safeSegment(meta.commandId || meta.runId || meta.extractedAt || crypto.randomUUID())
  const prefix = [safeSegment(meta.sourceName), safeSegment(meta.transaction), runId].join('/')
  let pending = [], sequence = 0, uploaded = 0, lastError = null, flushing = null, closed = false
  const errors = []
  async function upload(objectPath, body, contentType) {
    // Bounded retries make transient Storage failures observable but do not
    // turn a collection worker into an unbounded retry loop.
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await client.storage.from(REMOTE_BUCKET).upload(objectPath, body, { contentType, upsert: true })
      if (!error) return
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 250))
    }
    throw lastError
  }
  async function flush(force = false) {
    if (flushing) return flushing
    if (!pending.length) return { uploaded: 0 }
    if (!force && pending.length < REMOTE_BATCH_SIZE) return { uploaded: 0 }
    const batch = pending.splice(0, force ? pending.length : REMOTE_BATCH_SIZE)
    const body = `${batch.join('\n')}\n`
    const hash = crypto.createHash('sha256').update(body).digest('hex')
    const objectPath = `${prefix}/checkpoints/${String(++sequence).padStart(8, '0')}-${hash}.ndjson`
    flushing = upload(objectPath, Buffer.from(body), 'application/x-ndjson')
      .then(() => { uploaded += batch.length; lastError = null; return { uploaded: batch.length, objectPath } })
      .catch(error => {
        pending = [...batch, ...pending]
        lastError = String(error?.message || error)
        errors.push({ at: new Date().toISOString(), objectPath, error: lastError })
        return { uploaded: 0, error: lastError }
      })
      .finally(() => { flushing = null })
    return flushing
  }
  const timer = setInterval(() => { void flush(true) }, REMOTE_FLUSH_MS)
  timer.unref?.()
  return {
    enabled: true,
    enqueue(preserved) { if (!closed) { pending.push(JSON.stringify(preserved)); void flush(false) } },
    flush,
    async finalize(files = []) {
      // A batch may still be uploading while a few final observations arrive.
      // Drain sequentially so the final manifest never claims remote success
      // while a locally captured checkpoint remains pending.
      while (flushing || pending.length) {
        if (flushing) await flushing
        if (pending.length) await flush(true)
      }
      closed = true
      clearInterval(timer)
      const final = []
      for (const file of files) {
        if (!file || !fs.existsSync(file)) continue
        const body = fs.readFileSync(file)
        const objectPath = `${prefix}/final/${path.basename(file)}`
        try { await upload(objectPath, body, path.extname(file) === '.json' ? 'application/json' : path.extname(file) === '.csv' ? 'text/csv' : 'application/x-ndjson'); final.push(objectPath) }
        catch (error) { lastError = String(error?.message || error); errors.push({ at: new Date().toISOString(), objectPath, error: lastError }) }
      }
      return { uploaded, final, pending: pending.length, lastError }
    },
    summary: () => ({ enabled: true, bucket: REMOTE_BUCKET, prefix, uploaded, pending: pending.length, lastError, errors: [...errors] })
  }
}

const columns = [
  'scraper_command_id','source_name','source_platform','transaction','extracted_at',
  'source_listing_id','source_url','title','description','asking_price','currency','rental_period',
  'property_type','property_area','construction_area','source_province','source_canton','source_district',
  'canonical_province','canonical_canton','canonical_district','whatsapp_numbers','telephone_numbers',
  'email_addresses','listing_emails','agent_emails','agency_emails','agent_name','agent_photo_url',
  'agency_name','agency_logo_url','image_urls','ingestion_outcome','validation_reason'
]
const text = value => value === null || value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value)
const csv = value => `"${text(value).replace(/"/g, '""')}"`
const get = (row, key) => row?.[key]
const price = row => get(row, 'sale_asking_price') || get(row, 'rental_asking_price') || {}
const joined = value => Array.isArray(value) ? value.join(' | ') : text(value)

function csvRow(row, meta = {}, outcome = {}) {
  const geography = row.geography || {}, raw = geography.source_fields || {}
  const agency = row.agency || {}, agent = row.listing_agent || {}
  const asking = price(row)
  const values = {
    scraper_command_id: meta.commandId || '', source_name: row.source_name || meta.sourceName || '',
    source_platform: row.source_platform || '', transaction: row.transaction || row.transaction_type || meta.transaction || '',
    extracted_at: row.source_evidence?.detail_retrieved_at || meta.extractedAt || '',
    source_listing_id: row.source_listing_id, source_url: row.source_url, title: row.title,
    description: row.description, asking_price: asking.amount ?? asking.source_value ?? '', currency: asking.currency || '',
    rental_period: row.rental_period || row.rental_period_observed || '', property_type: row.property_type,
    property_area: row.property_area?.source_value || row.raw_property_area || '', construction_area: row.construction_area?.source_value || row.raw_construction_area || '',
    source_province: raw.province || geography.province || '', source_canton: raw.canton_district || geography.canton || '', source_district: raw.district || geography.district || '',
    canonical_province: geography.province || '', canonical_canton: geography.canton || '', canonical_district: geography.district || '',
    whatsapp_numbers: joined(row.whatsapp_numbers || row.whatsapp), telephone_numbers: joined(row.telephone_numbers),
    email_addresses: joined(row.email_addresses), listing_emails: joined(row.listing_emails), agent_emails: joined(row.agent_emails), agency_emails: joined(row.agency_emails),
    agent_name: agent.name || row.listing_agent_name || '', agent_photo_url: agent.photo_url || row.listing_agent_photo_url || '',
    agency_name: agency.name || row.agency_name || '', agency_logo_url: agency.logo_url || row.agency_logo_url || '',
    image_urls: joined(row.image_urls), ingestion_outcome: outcome.outcome || '', validation_reason: outcome.reason || ''
  }
  return columns.map(key => csv(values[key])).join(',') + '\n'
}

function createRunArchive(directory, meta = {}) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  const checkpoint = path.join(directory, 'source-observations.ndjson')
  const checkpointCsv = path.join(directory, 'listing-archive.csv')
  const outcomes = path.join(directory, 'canonical-outcomes.ndjson')
  if (!fs.existsSync(checkpointCsv)) fs.writeFileSync(checkpointCsv, `${columns.join(',')}\n`, { mode: 0o600 })
  const seen = new Set()
  const remote = createRemoteArchive(meta)
  return {
    directory, checkpoint, checkpointCsv, outcomes,
    append(row) {
      const id = String(row?.source_listing_id || '').trim()
      if (!id || seen.has(id)) return false
      seen.add(id)
      const preserved = { archived_at: new Date().toISOString(), archive: meta, observation: row }
      fs.appendFileSync(checkpoint, `${JSON.stringify(preserved)}\n`, { mode: 0o600, flag: 'a' })
      fs.appendFileSync(checkpointCsv, csvRow(row, meta), { mode: 0o600, flag: 'a' })
      remote.enqueue(preserved)
      return true
    },
    outcome(row, value) {
      fs.appendFileSync(outcomes, `${JSON.stringify({ recorded_at: new Date().toISOString(), source_listing_id: row?.source_listing_id || null, ...value })}\n`, { mode: 0o600, flag: 'a' })
    },
    async finalize() {
      const rows = fs.existsSync(checkpoint) ? fs.readFileSync(checkpoint, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line).observation) : []
      const outcomeById = new Map()
      if (fs.existsSync(outcomes)) for (const line of fs.readFileSync(outcomes, 'utf8').split(/\r?\n/).filter(Boolean)) {
        const value = JSON.parse(line)
        if (value.source_listing_id) outcomeById.set(String(value.source_listing_id), value)
      }
      fs.writeFileSync(checkpointCsv, `${columns.join(',')}\n${rows.map(row => csvRow(row, meta, outcomeById.get(String(row.source_listing_id)) || {})).join('')}`, { mode: 0o600 })
      const json = path.join(directory, 'source-observations.json')
      fs.writeFileSync(json, `${JSON.stringify(rows, null, 2)}\n`, { mode: 0o600 })
      const remoteResult = await remote.finalize([checkpoint, outcomes, checkpointCsv, json])
      return { observations: rows.length, json, csv: checkpointCsv, checkpoint, remote: { ...remote.summary(), ...remoteResult } }
    }
  }
}

module.exports = { createRunArchive }
