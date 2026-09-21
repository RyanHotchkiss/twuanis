import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { hydrateCanonicalPopulation } from './canonical-population'
import type { CanonicalEvidence } from './canonical-listing-reader'
import type { PriceMeterIdentityListing } from './price-meter-identity'
import type { PositionReference } from './price-meter-property-position-result-contract'

const SELECT = 'id,canonical_domain_version,transaction_type,listing_status,property_area,construction_area,current_price,monthly_price,currency'
export type PositionRow = PriceMeterIdentityListing & { id: string; canonical_domain_version: number; listing_status: string; transaction_type: string; canonicalEvidence: CanonicalEvidence }
export class PositionAcquisitionError extends Error {}
function incomplete(): never { throw new PositionAcquisitionError('Incomplete canonical reference acquisition.') }

// Exact-count traversal advances by actual rows, including server-capped pages.
async function pages<T>(query: () => any, key: (row: T) => string): Promise<T[]> {
  const rows: T[] = [], seen = new Set<string>(); let expected: number | null = null
  do {
    const { data, error, count } = await query().range(rows.length, rows.length + 499)
    if (error || !Array.isArray(data) || !Number.isSafeInteger(count) || count < 0 ||
        (expected !== null && count !== expected) || rows.length + data.length > count ||
        (!data.length && rows.length < count)) incomplete()
    expected = count
    for (const row of data) {
      const id = key(row)
      if (!id || seen.has(id)) incomplete()
      seen.add(id); rows.push(row)
    }
  } while (rows.length < expected!)
  return rows
}
const validId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

export async function loadPositionSubject(listingId: string): Promise<PositionRow | null> {
  const { data, error } = await supabaseAdmin.from('listings').select(SELECT)
    .eq('id', listingId).eq('listing_status','active').eq('canonical_domain_version',1).maybeSingle()
  if (error) throw error
  if (!data) return null
  return (await hydrateCanonicalPopulation([data], undefined, []))[0] as PositionRow
}

export async function loadPositionReference(reference: PositionReference): Promise<PositionRow[]> {
  try {
    const memberships = (termId: string) => supabaseAdmin.from('listings_ontology_terms')
      .select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)', {count:'exact'})
      .eq('ontology_term_id',termId).eq('listings.canonical_domain_version',1)
      .eq('listings.listing_status','active').eq('listings.transaction_type',reference.transactionType)
    type Member = { listing_id: string; ontology_term_id: string }
    const key = (termId: string) => (row: Member) => {
      if (!validId(row.listing_id) || row.ontology_term_id !== termId) incomplete()
      return row.listing_id
    }
    const geographic = await pages<Member>(() => memberships(reference.geography.id).order('listing_id').order('ontology_term_id'), key(reference.geography.id))
    const result: PositionRow[] = []
    // 25 UUIDs bound both encoded predicate size and canonical RPC batch size.
    for (let offset=0; offset<geographic.length; offset+=25) {
      const boundedIds = geographic.slice(offset,offset+25).map(row => row.listing_id)
      const typed = await pages<Member>(() => memberships(reference.propertyType.id).in('listing_id',boundedIds).order('listing_id').order('ontology_term_id'), key(reference.propertyType.id))
      if (typed.some(row => !boundedIds.includes(row.listing_id))) incomplete()
      const ids = typed.map(row => row.listing_id)
      if (!ids.length) continue
      const listings = await pages<PositionRow>(() => supabaseAdmin.from('listings').select(SELECT,{count:'exact'})
        .in('id',ids).eq('canonical_domain_version',1).eq('listing_status','active').eq('transaction_type',reference.transactionType).order('id'), row => validId(row.id) ? row.id : '')
      if (listings.length !== ids.length || listings.some(row => !ids.includes(row.id))) incomplete()
      const hydrated = await hydrateCanonicalPopulation(listings, undefined, []) as PositionRow[]
      for (const row of hydrated) {
        if (row.canonical_domain_version !== 1 || row.listing_status !== 'active' || row.transaction_type !== reference.transactionType ||
            !row.canonicalEvidence.geography.some(g => g.term_type === reference.geographyLevel && g.id === reference.geography.id) ||
            row.canonicalEvidence.selections.filter(s => s.dimension === 'property_type' && s.ontology_term_id === reference.propertyType.id).length !== 1) incomplete()
      }
      result.push(...hydrated)
    }
    if (new Set(result.map(row => row.id)).size !== result.length) incomplete()
    return result
  } catch (error) {
    if (error instanceof PositionAcquisitionError) throw error
    throw new PositionAcquisitionError('Canonical reference acquisition failed.', { cause: error })
  }
}
