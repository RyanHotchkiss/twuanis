'use strict'

// Durable, local-only source-observation archive.  The newline-delimited JSON
// checkpoint is written synchronously per observation, so an interrupted
// process still leaves a replayable source record behind.  The CSV is a
// review projection; it never replaces the original observation evidence.
const fs = require('node:fs')
const path = require('node:path')

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
  return {
    directory, checkpoint, checkpointCsv, outcomes,
    append(row) {
      const id = String(row?.source_listing_id || '').trim()
      if (!id || seen.has(id)) return false
      seen.add(id)
      const preserved = { archived_at: new Date().toISOString(), archive: meta, observation: row }
      fs.appendFileSync(checkpoint, `${JSON.stringify(preserved)}\n`, { mode: 0o600, flag: 'a' })
      fs.appendFileSync(checkpointCsv, csvRow(row, meta), { mode: 0o600, flag: 'a' })
      return true
    },
    outcome(row, value) {
      fs.appendFileSync(outcomes, `${JSON.stringify({ recorded_at: new Date().toISOString(), source_listing_id: row?.source_listing_id || null, ...value })}\n`, { mode: 0o600, flag: 'a' })
    },
    finalize() {
      const rows = fs.existsSync(checkpoint) ? fs.readFileSync(checkpoint, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line).observation) : []
      const outcomeById = new Map()
      if (fs.existsSync(outcomes)) for (const line of fs.readFileSync(outcomes, 'utf8').split(/\r?\n/).filter(Boolean)) {
        const value = JSON.parse(line)
        if (value.source_listing_id) outcomeById.set(String(value.source_listing_id), value)
      }
      fs.writeFileSync(checkpointCsv, `${columns.join(',')}\n${rows.map(row => csvRow(row, meta, outcomeById.get(String(row.source_listing_id)) || {})).join('')}`, { mode: 0o600 })
      fs.writeFileSync(path.join(directory, 'source-observations.json'), `${JSON.stringify(rows, null, 2)}\n`, { mode: 0o600 })
      return { observations: rows.length, json: path.join(directory, 'source-observations.json'), csv: checkpointCsv, checkpoint }
    }
  }
}

module.exports = { createRunArchive }
