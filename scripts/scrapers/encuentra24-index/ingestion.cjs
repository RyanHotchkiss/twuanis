'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Papa = require('papaparse')
const { execFileSync } = require('child_process')

function normalizedRow(row) {
  // Source provenance must be supplied by acquisition, never inferred from
  // the mere presence of a telephone number.
  return { ...row }
}

// Bind the reported asking-price pair to the exact retained source ad. Do not
// infer an eligible price from prose, a different listing, or a different scope.
function priceEvidence(row) {
  let ad
  try { ad = JSON.parse(row.raw_index_ad || '{}') } catch { ad = {} }
  const tx = row.transaction_type
  const reasons = []
  let url, adUrl
  try { url = new URL(row.source_url); adUrl = new URL(ad.link, url) } catch { reasons.push('SOURCE_URL_INVALID') }
  if (!url || url.protocol !== 'https:' || !(url.hostname === 'encuentra24.com' || url.hostname.endsWith('.encuentra24.com')) || !adUrl || adUrl.href !== url.href || String(ad.id || '') !== String(row.source_listing_id || '')) reasons.push('SOURCE_IDENTITY_MISMATCH')
  const scope = String(ad.publishSelectors?.subCategory || '').toLowerCase()
  if (!['sale', 'rent'].includes(tx) || scope !== (tx === 'sale' ? 'venta' : 'alquiler')) reasons.push('SOURCE_TRANSACTION_UNVERIFIED')
  const expected = String(tx === 'rent' ? row.monthly_price || '' : row.current_price || '').trim()
  const candidates = tx === 'rent' ? [['rent', ad.rent], ['price', ad.price]] : [['price', ad.price]]
  const currencyCode = value => ({ '$': 'USD', 'US$': 'USD', '₡': 'CRC' }[String(value || '').toUpperCase()] || String(value || '').toUpperCase())
  const matching = candidates.filter(([, value]) => Number.isFinite(Number(value?.amount?.value)) && Number(value.amount.value) > 0 && expected && Number(expected) === Number(value.amount.value) && ['USD', 'CRC'].includes(currencyCode(value.currency?.symbol)) && currencyCode(value.currency?.symbol) === String(row.currency || '').toUpperCase())
  const [field, selected] = matching[0] || []
  const amount = selected?.amount?.value
  const currency = currencyCode(selected?.currency?.symbol)
  if (!matching.length) reasons.push('EXACT_SOURCE_PRICE_UNAVAILABLE')
  if (!row.observed_at || !Number.isFinite(Date.parse(row.observed_at))) reasons.push('SOURCE_TIMESTAMP_INVALID')
  const evidence = { source_url: String(row.source_url || ''), observed_at: String(row.observed_at || ''), flight_price: { amount: { value: amount == null ? '' : String(amount) }, currency, source_label: field ? `${field}.amount.value` : '', source_value: amount == null ? '' : String(amount) } }
  return { collection_eligibility: JSON.stringify({ status: reasons.length ? 'REJECTED' : 'ELIGIBLE', reasons }), raw_price_evidence: JSON.stringify(evidence), raw_collected_price: amount == null ? '' : String(amount), raw_collected_currency: currency }
}

function normalizeObservations(raw, directory) {
  const output = []
  for (const transaction of ['sale', 'rent']) {
    const group = raw.filter(row => row.transaction_type === transaction)
    if (!group.length) continue
    const input = path.join(directory, `${transaction}-raw-with-whatsapp.csv`)
    fs.writeFileSync(input, Papa.unparse(group.map(normalizedRow)), { mode: 0o600 })
    execFileSync(process.execPath, [`scripts/scrapers/normalizers/encuentra24-${transaction}-normalizer.js`, input], { cwd: process.cwd(), stdio: 'inherit' })
    const normalized = Papa.parse(fs.readFileSync(input.replace('-raw-with-whatsapp.csv', '-normalized.csv'), 'utf8'), { header: true, skipEmptyLines: true }).data
    if (normalized.length !== group.length) throw new Error(`Normalizer row count mismatch for ${transaction}`)
    for (let i = 0; i < group.length; i += 1) output.push({ raw: group[i], normalized: { ...group[i], ...normalized[i] } })
  }
  if (output.length !== raw.length) throw new Error('Invalid or missing transaction_type in observations')
  return output
}

function normalizeInventoryProperty(inventory, propertyId, directory) {
  const property = inventory.get('properties', propertyId)
  if (!property?.raw_observation) return { status: 'not_captured' }
  const agency = property.agency_id ? inventory.get('agencies', property.agency_id) : null
  const agent = property.agent_id ? inventory.get('agents', property.agent_id) : null
  const raw = { ...property.raw_observation, agency_profile_id: property.agency_id || '', agency_name: agency?.name || '', agency_logo_url: agency?.logo_url || property.agency_logo_url || '', agency_whatsapp: agency?.whatsapp || property.agency_whatsapp || '', agent_id: property.agent_id || '', agent_name: agent?.name || '', agent_photo_url: agent?.photo_url || '', listing_agent_name: agent?.name || '', listing_agent_photo_url: agent?.photo_url || '', agent_whatsapp: agent?.whatsapp || '' }
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ raw, priceEvidenceVersion: 1 })).digest('hex')
  if (property.normalization_status === 'complete' && property.normalization_fingerprint === fingerprint) return { status: 'complete', normalized: property.normalized_observation }
  try {
    const workDir = path.join(directory, 'normalization', String(propertyId).replace(/[^a-zA-Z0-9_-]/g, '_'))
    fs.mkdirSync(workDir, { recursive: true, mode: 0o700 })
    const normalized = normalizeObservations([raw], workDir)[0].normalized
    if (raw.raw_price_evidence && raw.collection_eligibility) {
      Object.assign(normalized, { raw_price_evidence: raw.raw_price_evidence, collection_eligibility: raw.collection_eligibility, raw_collected_price: raw.raw_collected_price || raw.raw_collected_monthly_price || '', raw_collected_currency: raw.raw_collected_currency || '' })
    } else Object.assign(normalized, priceEvidence(raw))
    inventory.record('properties', propertyId, { normalization_status: 'complete', normalization_error: '', normalization_fingerprint: fingerprint, normalized_observation: normalized })
    return { status: 'complete', normalized }
  } catch (error) {
    inventory.record('properties', propertyId, { normalization_status: 'failed', normalization_error: error.message })
    return { status: 'failed', error: error.message }
  }
}

async function ingest(result, dependencies = {}) {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const { openInventories } = require('./cycle-inventories.cjs')
  const inventory = openInventories(result.inventoryDirectory || result.runDir, result.cycleId || path.basename(result.runDir))
  const bounded = result.boundedSaleLimit || 0
  if (bounded && (result.transaction !== 'sale' || !Number.isSafeInteger(bounded) || bounded < 1)) throw new Error('Invalid bounded Sale ingestion scope')
  if (bounded && inventory.entries('properties').filter(([, value]) => value.bounded_sale_reserved === true).length > bounded) throw new Error('Bounded Sale reservation limit exceeded')
  const { createClient, ingestObservation } = require('../encuentra24-canonical-ingestion-adapter.cjs')
  const { projectAttribution } = require('../refresh-wasi-listing-attribution.js')
  const client = dependencies.client || createClient(), outcomes = []
  const submit = dependencies.ingestObservation || ingestObservation
  const project = dependencies.projectAttribution || projectAttribution
  const progressTimer = dependencies.control?.reportProgress ? setInterval(() => dependencies.control.reportProgress('canonical_ingestion', inventory), 15000) : null
  try {
  for (const [id, stored] of inventory.entries('properties')) {
    if (dependencies.control?.stopped() || dependencies.control?.expired()) break
    if (dependencies.allowedIds && !dependencies.allowedIds.has(String(id))) continue
    dependencies.control?.reportProgress?.('canonical_ingestion', inventory)
    if (bounded && (stored.bounded_sale_reserved !== true || stored.transaction_type !== 'sale')) continue
    if (stored.normalization_status !== 'complete' || !stored.normalized_observation) continue
    let property = stored
    const normalized = property.normalized_observation
    if (bounded && normalized.transaction_type !== 'sale') continue
    const agency = property.agency_id ? inventory.get('agencies', property.agency_id) : null
    if (!agency || agency.whatsapp_status !== 'acquired' || !/^\+[1-9][0-9]{7,14}$/.test(String(agency.whatsapp || ''))) {
      inventory.record('properties', id, { canonical_status: 'skipped', canonical_error: agency?.skip_reason || 'agency_whatsapp_unavailable', canonical_terminal: false })
      outcomes.push({ source_listing_id: id, canonical_status: 'skipped', error: agency?.skip_reason || 'agency_whatsapp_unavailable' }); continue
    }
    if (!property.canonical_terminal) {
      try {
        const runId = result.canonicalRunId
        const startedAt = result.canonicalStartedAt
        if (!/^[0-9a-f-]{36}$/i.test(runId || '') || !startedAt || !Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(normalized.observed_at)) || Date.parse(startedAt) > Date.parse(normalized.observed_at)) throw new Error('Original acquisition run identity and applicable start required')
        property = inventory.record('properties', id, { canonical_run_id: runId, canonical_started_at: startedAt })
        inventory.record('properties', id, { canonical_status: 'in_progress' })
        const admission = await submit(client, normalized, { runId, startedAt })
        const label = String(admission?.admission || admission?.outcome || '').toUpperCase()
        const status = /REVIEW|HELD/.test(label) ? 'review_required' : /REJECT/.test(label) ? 'rejected' : ['ACCEPTED', 'SUCCEEDED'].includes(label) || admission?.admission === 'ALLOW' ? 'admitted' : 'unrecognized'
        property = inventory.record('properties', id, { canonical_status: status, canonical_result: admission, canonical_terminal: status !== 'unrecognized', canonical_error: '' })
      } catch (error) {
        inventory.record('properties', id, { canonical_status: 'failed', canonical_error: error.message, canonical_terminal: false })
        outcomes.push({ source_listing_id: id, canonical_status: 'failed', error: error.message }); continue
      }
    }
    if (property.canonical_status === 'admitted' && !(dependencies.control?.stopped() || dependencies.control?.expired())) {
      try {
        const listingId = property.canonical_result?.listing_id
        if (!listingId) throw new Error('Canonical result did not include a listing ID')
        const rows = await client.select('listings', `select=id,listing_status&source_name=eq.encuentra24&source_listing_id=eq.${encodeURIComponent(id)}&id=eq.${encodeURIComponent(listingId)}&limit=2`)
        if (rows.length !== 1) throw new Error('Canonical listing status could not be verified uniquely')
        property = inventory.record('properties', id, { publication_status: rows[0].listing_status === 'active' ? 'published' : 'not_published', publication_listing_status: rows[0].listing_status, publication_error: '' })
      } catch (error) { property = inventory.record('properties', id, { publication_status: 'unknown', publication_error: error.message }) }
      if (!(dependencies.control?.stopped() || dependencies.control?.expired()) && !['updated', 'no_source_attribution'].includes(property.attribution_status)) {
        try {
          const projected = await project([{ source_name: 'encuentra24', source_listing_id: String(id), agency: { name: normalized.agency_name, logo_url: normalized.agency_logo_url }, listing_agent: { name: normalized.listing_agent_name || normalized.agent_name, photo_url: normalized.listing_agent_photo_url || normalized.agent_photo_url } }], 'encuentra24')
          property = inventory.record('properties', id, { attribution_status: projected.failed.length ? 'failed' : projected.unmatched.length ? 'unmatched' : projected.matched ? 'updated' : 'no_source_attribution', attribution_result: projected })
        } catch (error) { property = inventory.record('properties', id, { attribution_status: 'failed', attribution_error: error.message }) }
      }
    }
    outcomes.push({ source_listing_id: id, canonical_status: property.canonical_status, admission: property.canonical_result, publication_status: property.publication_status || 'not_published', attribution_status: property.attribution_status || 'not_admitted' })
    dependencies.control?.reportProgress?.('canonical_ingestion', inventory)
  }
  } finally { if (progressTimer) clearInterval(progressTimer) }
  const evidence = path.join(result.runDir, 'ten-listing-results.json')
  fs.writeFileSync(evidence, JSON.stringify({ inventory_complete: false, removal_review: 'not_invoked', outcomes }, null, 2), { mode: 0o600 })
  return { ...result, outcomes, evidence }
}
module.exports = { ingest, normalizeObservations, normalizeInventoryProperty, priceEvidence }
