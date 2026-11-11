import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateGeographicRow, validateOntologyTermId } from '@/lib/geography/dta-identity'

export const CANONICAL_READER_BATCH = 25
export type CanonicalFact = {
  dimension: string
  kind: 'exact' | 'category' | 'range'
  exact_value: string | null
  category_term_id: string | null
  range_lower: string | null
  range_upper: string | null
  lower_inclusive: boolean | null
  upper_inclusive: boolean | null
}
export type CanonicalSelection = {
  dimension: string; ontology_term_id: string; term_type: string; level: number
  slug: string | null; term_name: string
}
export type CanonicalEvidence = {
  listing_id: string; canonical_domain_version: 1
  facts: CanonicalFact[]; selections: CanonicalSelection[]
  geography: Array<{
    id: string; parent_id: string | null; official_code: string
    term_type: 'province' | 'canton' | 'district'; level: number
    term_name: string; term_name_en: string | null; term_name_es: string | null
    slug: string | null; slug_en: string | null; slug_es: string | null
  }>
}
const factDimensions = ['bedrooms','bathrooms','parking','year_built','distance_to_paved_road']
const semanticDimensions = ['property_type','utility','environment','terrain','accessibility','legal_status']
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function fail(): never { throw new Error('Canonical reader evidence is incomplete or incoherent.') }

export function validateCanonicalEvidence(row: CanonicalEvidence) {
  if (!row || row.canonical_domain_version !== 1 || !uuid.test(row.listing_id) ||
      !Array.isArray(row.geography) || !Array.isArray(row.facts) || !Array.isArray(row.selections)) fail()
  const geography = new Map(row.geography.map(term => {
    if (!['province','canton','district'].includes(term.term_type)) fail()
    return [term.term_type, validateGeographicRow(term,term.term_type)]
  }))
  const province = geography.get('province'), canton = geography.get('canton'), district = geography.get('district')
  if (!province || !canton || geography.size !== row.geography.length ||
      canton.parentOntologyTermId !== province.ontologyTermId ||
      canton.officialCode.slice(0,1) !== province.officialCode ||
      (district && (district.parentOntologyTermId !== canton.ontologyTermId || district.officialCode.slice(0,3) !== canton.officialCode))) fail()
  const facts = new Set<string>()
  for (const f of row.facts) {
    if (!factDimensions.includes(f.dimension) || facts.has(f.dimension)) fail()
    facts.add(f.dimension)
    const numeric = (v: unknown) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && Number.isFinite(Number(v)) && Number(v) >= 0
    if (f.kind === 'exact') {
      if (!numeric(f.exact_value) || f.category_term_id !== null || f.range_lower !== null || f.range_upper !== null || f.lower_inclusive !== null || f.upper_inclusive !== null) fail()
    } else if (f.kind === 'category') {
      validateOntologyTermId(f.category_term_id)
      if (f.exact_value !== null || f.range_lower !== null || f.range_upper !== null || f.lower_inclusive !== null || f.upper_inclusive !== null) fail()
    } else if (f.kind === 'range') {
      if (f.exact_value !== null || f.category_term_id !== null ||
          (f.range_lower === null && f.range_upper === null) ||
          (f.range_lower !== null && !numeric(f.range_lower)) || (f.range_upper !== null && !numeric(f.range_upper)) ||
          typeof f.lower_inclusive !== 'boolean' || typeof f.upper_inclusive !== 'boolean') fail()
    } else fail()
  }
  const selections = new Set<string>()
  for (const s of row.selections) {
    validateOntologyTermId(s.ontology_term_id)
    const key = `${s.dimension}:${s.ontology_term_id}`
    if (!semanticDimensions.includes(s.dimension) || s.term_type !== s.dimension || s.level !== 1 || selections.has(key)) fail()
    selections.add(key)
  }
  for (const dimension of ['property_type','legal_status']) {
    if (row.selections.filter(s => s.dimension === dimension).length > 1) fail()
  }
  return row
}

// Only server-owned code supplies this dependency; never a browser/request parameter.
export async function readCanonicalListingEvidence(
  listingIds: string[], dimensions: { facts: string[]; semantics: string[] },
  client: Pick<typeof supabaseAdmin,'rpc'> = supabaseAdmin,
): Promise<Map<string,CanonicalEvidence>> {
  if (listingIds.some(id => !uuid.test(id)) ||
      dimensions.facts.some(d => !factDimensions.includes(d)) ||
      dimensions.semantics.some(d => !semanticDimensions.includes(d))) fail()
  const ids = [...new Set(listingIds)]
  const result = new Map<string,CanonicalEvidence>()
  for (let offset=0; offset<ids.length; offset+=CANONICAL_READER_BATCH) {
    const batch = ids.slice(offset,offset+CANONICAL_READER_BATCH)
    const {data,error} = await client.rpc('read_canonical_listing_evidence',{
      p_listing_ids:batch,p_fact_dimensions:dimensions.facts,p_semantic_dimensions:dimensions.semantics,
    })
    if (error) throw error
    if (!Array.isArray(data)) fail()
    for (const raw of data) {
      const row = validateCanonicalEvidence(raw)
      if (!batch.includes(row.listing_id) || result.has(row.listing_id) ||
          row.facts.some(f => !dimensions.facts.includes(f.dimension)) ||
          row.selections.some(s => !dimensions.semantics.includes(s.dimension))) fail()
      if (dimensions.semantics.includes('property_type') && row.selections.filter(s => s.dimension === 'property_type').length !== 1) fail()
      result.set(row.listing_id,row)
    }
    // This adapter is called with already-discriminated canonical identities.
    if (batch.some(id => !result.has(id))) fail()
  }
  return result
}
