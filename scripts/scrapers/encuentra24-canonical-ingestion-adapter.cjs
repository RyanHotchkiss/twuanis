'use strict'

// Service-only bridge. It contains no duplicate or lifecycle decision: those
// remain exclusively in the canonical SQL functions.
const crypto = require('node:crypto')

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function positive(value, name) {
  const text = String(value ?? '').trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d+)?$/.test(text) || Number(text) <= 0) throw new Error(`Invalid ${name}`)
  return text
}

function positiveArea(value, name) {
  const text = String(value ?? '').trim()
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*m(?:²|2)$/iu)
  if (!match) throw new Error(`Invalid ${name}`)
  return positive(match[1], name)
}

function iso(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid observed_at')
  return date.toISOString()
}

function first(rows, label) {
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error(`Unresolved canonical ${label}`)
  return rows[0]
}

function authorizedDistrictAbsence(row) {
  return !String(row.district || '').trim()
    && !String(row.district_code || '').trim()
    && row.geography_admission === 'EXACT_PROVINCE_CANTON_DISTRICT_UNRESOLVED'
    && ['ABSENT', 'UNRESOLVED'].includes(row.district_resolution)
}

function createClient(fetchImpl = fetch) {
  const base = required('SUPABASE_URL').replace(/\/$/, '')
  const key = required('SUPABASE_SERVICE_ROLE_KEY')
  const request = async (path, options = {}) => {
    const response = await fetchImpl(`${base}${path}`, {
      ...options,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    })
    const body = await response.text()
    if (!response.ok) throw new Error(`Canonical service request failed (${response.status}): ${body.slice(0, 300)}`)
    return body ? JSON.parse(body) : null
  }
  return {
    rpc(name, parameters) { return request(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(parameters) }) },
    select(table, query) { return request(`/rest/v1/${table}?${query}`, { headers: { Accept: 'application/json' } }) }
  }
}

async function resolveOntology(client, row) {
  const quote = value => encodeURIComponent(String(value))
  const exactTerm = async ({ type, parentId, code, name, label }) => {
    const parent = parentId ? `&parent_id=eq.${parentId}` : ''
    const canonicalCode = String(code || '').trim()
    if (canonicalCode) {
      return first(await client.select('ontology_terms', `select=id,official_code,term_name&term_type=eq.${type}${parent}&official_code=eq.${quote(canonicalCode)}`), label)
    }
    const canonicalName = String(name || '').trim()
    if (!canonicalName) throw new Error(`Missing canonical ${label}`)
    const candidates = await client.select('ontology_terms', `select=id,official_code,term_name&term_type=eq.${type}${parent}&or=(term_name.eq.${quote(canonicalName)},term_name_en.eq.${quote(canonicalName)},term_name_es.eq.${quote(canonicalName)})`)
    return first(candidates, label)
  }
  const province = await exactTerm({ type: 'province', code: row.province_code, name: row.province, label: 'province' })
  const canton = await exactTerm({ type: 'canton', parentId: province.id, code: row.canton_code, name: row.canton, label: 'canton' })
  const districtName = String(row.district || '').trim()
  const district = districtName
    ? await exactTerm({ type: 'district', parentId: canton.id, code: row.district_code, name: districtName, label: 'district' })
    : authorizedDistrictAbsence(row) ? null : (() => { throw new Error('District is not an authorized unresolved geography state') })()
  const propertyType = await exactTerm({ type: 'property_type', name: row.property_type, label: 'property type' })
  return { province, canton, district, propertyType }
}

async function ingestObservation(client, row, { runId, startedAt }) {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new Error('A UUID ENCUENTRA24_RUN_ID is required')
  const transaction = String(row.transaction_type || '')
  if (!['sale', 'rent'].includes(transaction)) throw new Error('Invalid transaction_type')
  const moneyField = transaction === 'rent' ? 'monthly_price' : 'current_price'
  const ontology = await resolveOntology(client, row)
  const propertyArea = positiveArea(row.raw_property_area, 'property_area')
  const isLand = ontology.propertyType.term_name === 'Land'
  const rawConstruction = String(row.raw_construction_area || '').trim()
  const construction = rawConstruction ? positiveArea(rawConstruction, 'construction_area') : ''
  if (!isLand && !construction) throw new Error('Invalid construction_area')

  const observedAt = iso(row.observed_at)
  const raw = {
    source_name: 'encuentra24', source_listing_id: String(row.source_listing_id),
    observation_id: String(row.observation_id || crypto.randomUUID()), observed_at: observedAt,
    source_url: String(row.source_url), title: String(row.title || ''), description: String(row.description || ''),
    images: String(row.images || ''), whatsapp: String(row.whatsapp || ''),
    whatsapp_profile_url: String(row.whatsapp_profile_url || ''), whatsapp_profile_id: String(row.whatsapp_profile_id || ''),
    whatsapp_destination: String(row.whatsapp_destination || ''), whatsapp_sha256: String(row.whatsapp_sha256 || ''),
    whatsapp_authority: String(row.whatsapp_authority || ''), raw_property_area: propertyArea,
    raw_construction_area: construction, transaction, transaction_type: transaction,
    [moneyField]: String(row[moneyField] || ''), currency: String(row.currency || ''),
    raw_jsonld: String(row.raw_jsonld || ''), raw_price_evidence: String(row.raw_price_evidence || ''),
    raw_collected_price: String(row.raw_collected_price || row.raw_collected_monthly_price || ''),
    raw_collected_currency: String(row.raw_collected_currency || row.currency || ''),
    collection_eligibility: String(row.collection_eligibility || '')
  }
  const review = { status: 'unresolved', canonical_authority: false, values: {
    advertiser_profile_whatsapp: { authority: raw.whatsapp_authority, profile_url: raw.whatsapp_profile_url, destination: raw.whatsapp_destination }
  } }
  const evidence = await client.rpc('retain_csv_source_evidence', { p_raw: raw, p_review: review })
  await client.rpc('accept_source_profile_whatsapp_evidence', {
    p_evidence: evidence,
    p_proof: { source_name: raw.source_name, source_listing_id: raw.source_listing_id, source_url: raw.source_url,
      profile_url: raw.whatsapp_profile_url, profile_id: raw.whatsapp_profile_id, destination: raw.whatsapp,
      raw_destination: raw.whatsapp_destination, sha256: raw.whatsapp_sha256, observed_at: raw.observed_at }
  })
  const measurements = { property_area: { value: propertyArea } }
  if (construction) measurements.construction_area = { value: construction }
  const input = {
    transaction,
    geography: { province: String(ontology.province.official_code), canton: String(ontology.canton.official_code), district: ontology.district ? String(ontology.district.official_code) : null },
    semantics: { property_type: [String(ontology.propertyType.id)] }, facts: {}, measurements,
    money: { amount: positive(row[moneyField], moneyField), currency: String(row.currency) },
    content: { whatsapp: raw.whatsapp }
  }
  return client.rpc('ingest_canonical_source_observation_in_run', {
    p_evidence: evidence, p_input: input, p_run: runId, p_started_at: iso(startedAt)
  })
}

async function completeScopedSourceRun(client, { sourceName, transaction, runId, startedAt, completion, observedIds }) {
  return client.rpc('complete_canonical_source_run_scoped', { p_source: sourceName, p_transaction: transaction, p_run: runId, p_started_at: iso(startedAt), p_completion: completion, p_observed_ids: observedIds })
}

module.exports = { createClient, resolveOntology, ingestObservation, completeScopedSourceRun, authorizedDistrictAbsence }
