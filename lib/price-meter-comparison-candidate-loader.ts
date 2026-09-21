import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hydrateCanonicalPopulation } from '@/lib/canonical-population'
import type { PriceMeterComparisonRequest } from '@/lib/price-meter-comparison-request'
import type { PriceMeterOntologyMembership } from '@/lib/price-meter-ontology-membership'

// Same completeness contract as the shared population reader: a short page is not EOF.
async function complete<T>(page: (from: number, to: number) => PromiseLike<{data: unknown[] | null; error: unknown; count: number | null}>): Promise<T[]> {
  const result: T[] = []
  let expected: number | null = null
  do {
    const {data, error, count} = await page(result.length, result.length + 499)
    if (error) throw error
    if (count === null || !Number.isSafeInteger(count) || count < 0 || (expected !== null && count !== expected)) throw new Error('Incomplete comparison population evidence.')
    expected = count
    const rows = data ?? []
    if (result.length + rows.length > count || (!rows.length && result.length < count)) throw new Error('Incomplete comparison population page.')
    result.push(...rows as T[])
  } while (result.length < expected)
  return result
}
function chunks(ids: string[]) {
  const result: string[][] = []
  let chunk: string[] = [], size = 0
  for (const id of new Set(ids)) {
    const length = encodeURIComponent(JSON.stringify(id)).length + 3
    if (length > 1500) throw new Error('Comparison identity exceeds request budget.')
    if (chunk.length && (chunk.length >= 25 || size + length > 1500)) {result.push(chunk); chunk = []; size = 0}
    chunk.push(id); size += length
  }
  if (chunk.length) result.push(chunk)
  return result
}
function termId(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid or lossy comparison term identity.')
  return String(value)
}
type Assignment = {listing_id: string; ontology_term_id: string}

export async function loadPriceMeterComparisonCandidates(request: PriceMeterComparisonRequest) {
  const evidence = new Map<string, Set<string>>()
  const query = () => supabaseAdmin.from('listings_ontology_terms')
    .select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version)', {count:'exact'})
    .eq('listings.canonical_domain_version', 1)
  const record = (rows: Assignment[]) => {
    for (const row of rows) {
      const terms = evidence.get(row.listing_id) ?? new Set<string>()
      terms.add(row.ontology_term_id); evidence.set(row.listing_id, terms)
    }
    return [...new Set(rows.map(row => row.listing_id))]
  }
  const cohorts = [request.cohortA, request.cohortB]
  const requirements = cohorts.map(cohort => ({
    geography: termId(cohort.geography.id),
    terms: [cohort.propertyType, ...cohort.characteristics].map(t => termId(t.ontologyTermId))
  }))
  const geographyCandidates = new Map<string, string[]>()
  for (const geography of new Set(requirements.map(r => r.geography))) {
    geographyCandidates.set(geography, record(await complete<Assignment>((from,to) => query()
      .eq('ontology_term_id', geography).order('listing_id').order('ontology_term_id').range(from,to))))
  }
  // One bounded union serves both definitions. Each requested semantic membership
  // is acquired once, even when A and B partially overlap or use the same geography.
  const candidates = [...new Set([...geographyCandidates.values()].flat())].sort()
  const requiredTerms = [...new Set(requirements.flatMap(r => r.terms))]
  for (const chunk of chunks(candidates)) {
    record(await complete<Assignment>((from,to) => query().in('ontology_term_id', requiredTerms)
      .in('listing_id',chunk).order('listing_id').order('ontology_term_id').range(from,to)))
  }
  const ids = [...new Set(requirements.flatMap(r =>
    geographyCandidates.get(r.geography)!.filter(id => r.terms.every(term => evidence.get(id)?.has(term)))))].sort()
  const rows: any[] = []
  for (const chunk of chunks(ids)) rows.push(...await complete<any>((from,to) => supabaseAdmin.from('listings')
    .select('id,title,images,canonical_domain_version,transaction_type,currency,monthly_price,current_price,price_millions,property_area,construction_area,created_at', {count:'exact'})
    .eq('canonical_domain_version',1).eq('listing_status','active').eq('transaction_type',request.transactionType)
    .in('id',chunk).order('id').range(from,to)))
  if (new Set(rows.map(row=>row.id)).size !== rows.length) throw new Error('Duplicate comparison listing evidence.')
  const listings = await hydrateCanonicalPopulation(rows, undefined, [])
  const definitions = new Map([request.cohortA, request.cohortB].flatMap(cohort =>
    [cohort.propertyType,...cohort.characteristics].map(term => [String(term.ontologyTermId),term] as const)))
  const memberships: PriceMeterOntologyMembership[] = listings.map(listing => {
    const characteristics = [...(evidence.get(listing.id) ?? [])].flatMap(id => definitions.has(id) ? [definitions.get(id)!] : [])
    return {listingId:listing.id, characteristics, ontologyTermIds:characteristics.map(term=>term.ontologyTermId)}
  })
  return {listings, memberships}
}
