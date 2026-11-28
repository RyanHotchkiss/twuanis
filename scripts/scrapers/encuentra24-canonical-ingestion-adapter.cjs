'use strict'

// Service-only bridge. It contains no duplicate or lifecycle decision: those
// remain exclusively in the canonical SQL functions.
const crypto = require('node:crypto')
const { generateListingTitle, generateListingDescription } = require('../../app/utils/listing-content-generator.cjs')
const { normalizeEncuentra24RowGeography } = require('./encuentra24-sale-geography.cjs')

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

function sourcePropertyType(row) {
  const category = String(row.property_type || '').trim()
  const mapping = { Apartamento: 'Condo', Apartamentos: 'Condo', Casa: 'House', Casas: 'House', 'Lotes y Terrenos': 'Land', 'Fincas en Costa Rica': 'Farm', 'Locales comerciales y bodegas': 'Commercial Property', Oficina: 'Commercial Property' }
  if (mapping[category]) return mapping[category]
  const title = String(row.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (category === 'Propiedades de playa') {
    const matches = [['House', /\b(casa|casas)\b/], ['Condo', /\b(apartamento|apartamentos|penthouse|pent-house)\b/], ['Land', /\b(lote|lotes|terreno|terrenos)\b/]].filter(([, pattern]) => pattern.test(title))
    if (matches.length === 1) return matches[0][0]
  }
  if (category === 'Edificio' && /\b(comercial|oficinas|consultorios|negocios|locales)\b/.test(`${title} ${String(row.description || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}`)) return 'Commercial Property'
  return category
}

function createClient(fetchImpl = fetch) {
  const base = required('SUPABASE_URL').replace(/\/$/, '')
  const key = required('SUPABASE_SERVICE_ROLE_KEY')
  const request = async (path, options = {}) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Number(process.env.TWUANIS_SCRAPER_CANONICAL_TIMEOUT_MS || 30000))
    let response
    try {
      response = await fetchImpl(`${base}${path}`, {
        ...options, signal: controller.signal,
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
      })
    } catch (error) {
      throw new Error(error?.name === 'AbortError' ? `Canonical service request timed out: ${path}` : `Canonical service request failed: ${error.message || error}`)
    } finally { clearTimeout(timeout) }
    const body = await response.text()
    if (!response.ok) throw new Error(`Canonical service request failed (${response.status}): ${body}`)
    return body ? JSON.parse(body) : null
  }
  return {
    rpc(name, parameters) { return request(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(parameters) }) },
    select(table, query) { return request(`/rest/v1/${table}?${query}`, { headers: { Accept: 'application/json' } }) }
  }
}

async function resolveOntology(client, row, { allowPartialDistrict = false } = {}) {
  // Reapply breadcrumb normalization when replaying retained Sale or Rent
  // evidence. This repairs source serialization, not canonical strictness.
  const sourceRow = normalizeEncuentra24RowGeography(row)
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
  const province = await exactTerm({ type: 'province', code: sourceRow.province_code, name: sourceRow.province, label: 'province' })
  const canton = await exactTerm({ type: 'canton', parentId: province.id, code: sourceRow.canton_code, name: sourceRow.canton, label: 'canton' })
  const districtName = String(sourceRow.district || '').trim()
  let district = null
  if (districtName) {
    try {
      district = await exactTerm({ type: 'district', parentId: canton.id, code: sourceRow.district_code, name: districtName, label: 'district' })
    } catch (error) {
      // Encuentra24 preserves the observed district text in its source
      // evidence, but may publish through the existing P+C partial-geography
      // path when that text has no exact canonical district match.
      if (!allowPartialDistrict || error.message !== 'Unresolved canonical district') throw error
    }
  } else if (!allowPartialDistrict && !authorizedDistrictAbsence(sourceRow)) {
    throw new Error('District is not an authorized unresolved geography state')
  }
  // These are explicit Encuentra24 category labels, mapped to the existing
  // ontology terms. Ambiguous categories continue through exact resolution.
  const propertyType = await exactTerm({ type: 'property_type', name: sourcePropertyType(sourceRow), label: 'property type' })
  return { province, canton, district, propertyType }
}

async function ingestObservation(client, row, { runId, startedAt }) {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new Error('A UUID ENCUENTRA24_RUN_ID is required')
  const transaction = String(row.transaction_type || '')
  if (!['sale', 'rent'].includes(transaction)) throw new Error('Invalid transaction_type')
  const moneyField = transaction === 'rent' ? 'monthly_price' : 'current_price'
  // This adapter is Encuentra24-only. Province and canton remain mandatory;
  // district is deliberately optional for this imported source alone.
  const ontology = await resolveOntology(client, row, { allowPartialDistrict: true })
  const type = ontology.propertyType.term_name
  const rawProperty = String(row.raw_property_area || '').trim()
  const requiredProperty = ['House', 'Land', 'Farm', 'Cabin'].includes(type)
  let propertyArea = ''
  if (rawProperty) { try { propertyArea = positiveArea(rawProperty, 'property_area') } catch (error) { if (requiredProperty) throw error } }
  if (['House', 'Land', 'Farm', 'Cabin'].includes(type) && !propertyArea) throw new Error('Invalid property_area')
  const rawConstruction = String(row.raw_construction_area || '').trim()
  const requiredConstruction = ['House', 'Condo', 'Cabin', 'Commercial Property'].includes(type)
  let construction = ''
  if (rawConstruction) { try { construction = positiveArea(rawConstruction, 'construction_area') } catch (error) { if (requiredConstruction) throw error } }
  if (['House', 'Condo', 'Cabin', 'Commercial Property'].includes(type) && !construction) throw new Error('Invalid construction_area')

  const observedAt = iso(row.observed_at)
  const agencyWhatsapp = String(row.agency_whatsapp || '').trim()
  const agentWhatsapp = String(row.agent_whatsapp || '').trim()
  // Agent contact is used only for an explicitly associated agent; the
  // advertiser's contact remains available independently as source evidence.
  const contact = (row.agent_id && agentWhatsapp) || (row.agency_profile_id && agencyWhatsapp) || ''
  if (contact && !/^\+[1-9][0-9]{7,14}$/.test(contact)) throw new Error('Invalid advertiser WhatsApp number')
  const raw = {
    source_name: 'encuentra24', source_listing_id: String(row.source_listing_id),
    observation_id: String(row.observation_id || crypto.randomUUID()), observed_at: observedAt,
    source_url: String(row.source_url), title: String(row.title || ''), description: String(row.description || ''),
    images: String(row.images || ''), whatsapp: contact,
    whatsapp_evidence_origin: contact ? (contact === agentWhatsapp && row.agent_id ? 'encuentra24_assigned_agent_profile' : 'encuentra24_agency_profile') : '', raw_property_area: propertyArea,
    raw_construction_area: construction, transaction, transaction_type: transaction,
    [moneyField]: String(row[moneyField] || ''), currency: String(row.currency || ''),
    raw_jsonld: String(row.raw_jsonld || ''), raw_price_evidence: String(row.raw_price_evidence || ''),
    raw_collected_price: String(row.raw_collected_price || row.raw_collected_monthly_price || ''),
    raw_collected_currency: String(row.raw_collected_currency || row.currency || ''),
    collection_eligibility: String(row.collection_eligibility || '')
  }
  // Only add supplied fields: existing immutable evidence must replay exactly.
  for (const field of ['agency_whatsapp', 'agent_whatsapp', 'agency_profile_id', 'agent_id', 'agency_name', 'agent_name', 'listing_agent_name', 'agency_profile_url', 'agent_profile_url', 'agency_logo_url', 'agent_photo_url', 'listing_agent_photo_url']) {
    if (row[field]) raw[field] = String(row[field])
  }
  const review = { status: 'unresolved', canonical_authority: false, values: {
    advertiser_contacts: { agency_whatsapp: agencyWhatsapp, agent_whatsapp: agentWhatsapp, agency_profile_id: String(row.agency_profile_id || ''), agent_id: String(row.agent_id || '') }
  } }
  const evidence = await client.rpc('retain_csv_source_evidence', { p_raw: raw, p_review: review })
  const measurements = {}
  if (propertyArea) measurements.property_area = { value: propertyArea }
  if (construction) measurements.construction_area = { value: construction }
  // Preserve the publisher's prose in retained source evidence while using
  // Twuanis's shared deterministic generator for source-managed publication.
  const generated = {
    property_type: ontology.propertyType.term_name,
    province: ontology.province.term_name,
    canton: ontology.canton.term_name,
    district: ontology.district?.term_name,
    property_area: propertyArea,
    ...(construction ? { construction_area: construction } : {}),
  }
  const title = generateListingTitle(generated)
  const description = generateListingDescription(generated)
  const input = {
    transaction,
    geography: { province: String(ontology.province.official_code), canton: String(ontology.canton.official_code), district: ontology.district ? String(ontology.district.official_code) : null },
    semantics: { property_type: [String(ontology.propertyType.id)] }, facts: {}, measurements,
    money: { amount: positive(row[moneyField], moneyField), currency: String(row.currency) },
    content: { ...(title ? { title } : {}), ...(description ? { description } : {}), whatsapp: raw.whatsapp }
  }
  return client.rpc('ingest_canonical_source_observation_in_run', {
    p_evidence: evidence, p_input: input, p_run: runId, p_started_at: iso(startedAt)
  })
}

async function completeScopedSourceRun(client, { sourceName, transaction, runId, startedAt, completion, observedIds }) {
  return client.rpc('complete_canonical_source_run_scoped', { p_source: sourceName, p_transaction: transaction, p_run: runId, p_started_at: iso(startedAt), p_completion: completion, p_observed_ids: observedIds })
}

// Encuentra24 absence is a review signal only.  This records candidates after
// a scraper has proven a complete inventory; it never invokes reconciliation
// or a lifecycle transition.
async function recordRemovedListingCandidates(client, { transaction, runId, startedAt, completion, observedIds }) {
  return client.rpc('record_encuentra24_removed_listing_candidates', { p_transaction: transaction, p_run: runId, p_started_at: iso(startedAt), p_completion: completion, p_observed_ids: observedIds })
}

module.exports = { createClient, resolveOntology, ingestObservation, completeScopedSourceRun, recordRemovedListingCandidates, authorizedDistrictAbsence, sourcePropertyType }
