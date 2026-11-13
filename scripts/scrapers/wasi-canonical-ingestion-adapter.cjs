'use strict'

// Generic Wasi-to-canonical bridge.  The scraper's original observation is
// retained first; all listing admission and publication decisions remain in
// the existing canonical authority.
const { createClient, resolveOntology } = require('./encuentra24-canonical-ingestion-adapter.cjs')

const typeMap = { Casa:'House','Casa de Playa':'House','Casa de Campo':'House',Lote:'Land',Terreno:'Land','Lote Comercial':'Land',Apartamento:'Condo',Apartaestudio:'Condo',Finca:'Farm','Campos, Chacras y Quintas':'Farm',Local:'Commercial Property',Edificio:'Commercial Property',Oficina:'Commercial Property','Cabaña':'Cabin' }
const iso = value => new Date(value).toISOString()
const area = value => { const match = String(value || '').trim().match(/^(\d+(?:[.,]\d+)?)\s*m(?:²|2)$/iu); return match ? match[1].replace(',','.') : null }
const eligible = row => { try { return JSON.parse(row.collection_eligibility || '{}').status === 'ELIGIBLE' } catch { return false } }

function rawObservation(row) {
  const tx = row.transaction
  const price = tx === 'rent' ? row.rental_asking_price : row.sale_asking_price
  const source = row.source_evidence || {}
  const capturedAt = source.detail_retrieved_at
  const whatsapp = String(row.whatsapp_numbers?.[0] || '').replace(/\D/g, '')
  return {
    source_name: String(row.source_name), source_listing_id: String(row.source_listing_id),
    observation_id: `${String(row.source_name).toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${row.source_listing_id}-${Date.parse(capturedAt)}`,
    observed_at: capturedAt, source_type: 'realtor', source_url: String(row.source_url),
    transaction_type: tx, property_type: String(row.property_type || ''),
    province: String(row.geography?.province || ''), canton: String(row.geography?.canton || ''), district: String(row.geography?.district || ''),
    title: String(row.title || ''), description: String(row.description || ''),
    [tx === 'rent' ? 'monthly_price' : 'current_price']: String(price?.amount || ''), currency: String(price?.currency || ''),
    whatsapp: whatsapp ? `+${whatsapp}` : '', raw_property_area: String(row.property_area?.source_value || ''), raw_construction_area: String(row.construction_area?.source_value || ''),
    images: Array.isArray(row.image_urls) ? row.image_urls.join('|') : '',
    agency_logo_url: String(row.agency?.logo_url || ''), agency_name: String(row.agency?.name || ''),
    listing_agent_photo_url: String(row.listing_agent?.photo_url || ''), listing_agent_name: String(row.listing_agent?.name || ''),
    raw_source_attributes: JSON.stringify(row.attributes || {}), raw_geography: JSON.stringify(row.geography?.source_fields || {}),
    collection_eligibility: String(row.collection_eligibility || ''), raw_jsonld: String(row.raw_jsonld || ''), raw_price_evidence: String(row.raw_price_evidence || '')
  }
}

function qualifying(row) {
  const type = typeMap[row.property_type]; const tx = row.transaction; const price = tx === 'rent' ? row.rental_asking_price : row.sale_asking_price
  if (!type) return 'UNSUPPORTED_SOURCE_PROPERTY_TYPE'
  if (row.source_transaction !== tx) return 'SOURCE_TRANSACTION_MISMATCH'
  if (!row.geography?.exact_pcd_published) return 'UNRESOLVED_GEOGRAPHY'
  if (!eligible(row)) return 'SOURCE_COLLECTION_INELIGIBLE'
  if (!price?.amount || !price?.currency) return 'MISSING_EXACT_PRICE'
  if (!row.whatsapp_numbers?.[0]) return 'MISSING_WHATSAPP'
  const property = area(row.property_area?.source_value), construction = area(row.construction_area?.source_value)
  if ((type === 'House' || type === 'Cabin') && (!property || !construction)) return 'MISSING_REQUIRED_EXPLICIT_MEASUREMENT'
  if ((type === 'Condo' || type === 'Commercial Property') && !construction) return 'MISSING_REQUIRED_EXPLICIT_MEASUREMENT'
  if ((type === 'Land' || type === 'Farm') && !property) return 'MISSING_REQUIRED_EXPLICIT_MEASUREMENT'
  return null
}

async function ingestWasiObservation(client, row, { runId, startedAt }) {
  const raw = rawObservation(row); const review = { status:'unresolved', canonical_authority:false, values:{} }
  const evidence = await client.rpc('retain_csv_source_evidence', { p_raw: raw, p_review: review })
  const normalized = { province:raw.province,canton:raw.canton,district:raw.district,property_type:typeMap[row.property_type] }
  const ontology = await resolveOntology(client, normalized)
  const tx = raw.transaction_type, moneyField = tx === 'rent' ? 'monthly_price' : 'current_price'
  const measurements = {}; const property = area(raw.raw_property_area), construction = area(raw.raw_construction_area)
  if (property) measurements.property_area = { value:property }; if (construction) measurements.construction_area = { value:construction }
  const input = { transaction:tx, geography:{province:String(ontology.province.official_code),canton:String(ontology.canton.official_code),district:String(ontology.district.official_code)}, semantics:{property_type:[String(ontology.propertyType.id)]}, facts:{}, measurements, money:{amount:String(raw[moneyField]),currency:raw.currency}, content:{whatsapp:raw.whatsapp} }
  const result = await client.rpc('ingest_canonical_source_observation_in_run', { p_evidence:evidence, p_input:input, p_run:runId, p_started_at:iso(startedAt) })
  return { evidence, result }
}

async function completeSourceRun(client, { sourceName, transaction, runId, startedAt, completion, observedIds }) {
  return client.rpc('complete_canonical_source_run_scoped', {
    p_source: sourceName, p_transaction: transaction, p_run: runId,
    p_started_at: iso(startedAt), p_completion: completion, p_observed_ids: observedIds,
  })
}

module.exports = { createClient, qualifying, ingestWasiObservation, completeSourceRun, rawObservation, iso }
