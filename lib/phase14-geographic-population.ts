import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'

const PAGE_SIZE = 500 // Transport page size, not a population limit.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type Provenance = Readonly<{
  kind: 'canonical_geographic_starting_population'
  geography: Phase14ExecutionEnvelope['question']['geography']
  executionId: string
  canonicalQuestionSerialization: string
}>
export type Phase14GeographicPopulation = Provenance & Readonly<{
  state: 'complete'
  expectedMembershipCount: number
  acquiredUniqueListingCount: number
  listingIds: readonly string[]
  completeness: Readonly<{
    contract: 'stable_order_exact_count_pages_v1'
    pagesRead: number
    snapshotGuaranteed: false
  }>
}>
export type Phase14GeographicAcquisition = Phase14GeographicPopulation
  | (Provenance & Readonly<{ state: 'incomplete'; reason: 'invalid_page' | 'invalid_membership' | 'duplicate_or_unordered' }>)
  | (Provenance & Readonly<{ state: 'execution_failed'; reason: 'membership_query_failed' }>)
  | Readonly<{ state: 'invalid_execution' }>
const owners = new WeakMap<object, Phase14ExecutionEnvelope>()

// Geography membership only. Step 3 will own status/version/transaction integration.
// No client dependency or second geographic selector is accepted.
export async function acquirePhase14GeographicPopulation(envelope: Phase14ExecutionEnvelope): Promise<Phase14GeographicAcquisition> {
  try { assertPhase14ExecutionEnvelope(envelope) }
  catch { return Object.freeze({state:'invalid_execution'}) }
  const provenance: Provenance = Object.freeze({
    kind:'canonical_geographic_starting_population',
    geography:envelope.question.geography,
    executionId:envelope.executionId,
    canonicalQuestionSerialization:envelope.canonicalQuestionSerialization,
  })
  const incomplete = (reason: 'invalid_page' | 'invalid_membership' | 'duplicate_or_unordered'): Phase14GeographicAcquisition =>
    Object.freeze({...provenance,state:'incomplete',reason})
  const ids: string[] = [], seen = new Set<string>()
  let expected: number | null = null, pagesRead = 0, previous: string | null = null
  do {
    let response
    try {
      response = await supabaseAdmin.from('listings_ontology_terms')
        .select('listing_id,ontology_term_id::text',{count:'exact'})
        .eq('ontology_term_id',provenance.geography.termId)
        .order('listing_id').order('ontology_term_id')
        .range(ids.length,ids.length+PAGE_SIZE-1)
    } catch {
      return Object.freeze({...provenance,state:'execution_failed',reason:'membership_query_failed'})
    }
    if (response?.error) return Object.freeze({...provenance,state:'execution_failed',reason:'membership_query_failed'})
    const data=response?.data, count=response?.count
    pagesRead++
    if (!Array.isArray(data) || !Number.isSafeInteger(count) || count!<0 ||
        (expected!==null && count!==expected) || data.length>PAGE_SIZE ||
        ids.length+data.length>count! || (!data.length && ids.length<count!)) return incomplete('invalid_page')
    expected=count!
    for (const row of data) {
      // PostgreSQL's UUID output is lowercase canonical text; accepting another spelling
      // would conceal duplicate identities or invalidate its stable UUID ordering.
      if (!row || typeof row.listing_id!=='string' || !uuid.test(row.listing_id) ||
          row.ontology_term_id!==provenance.geography.termId) return incomplete('invalid_membership')
      const id=row.listing_id
      if (seen.has(id) || (previous!==null && id<=previous)) return incomplete('duplicate_or_unordered')
      seen.add(id);ids.push(id);previous=id
    }
  } while (ids.length<expected!)
  const result: Phase14GeographicPopulation = Object.freeze({...provenance,state:'complete',
    expectedMembershipCount:expected!,acquiredUniqueListingCount:seen.size,
    listingIds:Object.freeze(ids),
    completeness:Object.freeze({contract:'stable_order_exact_count_pages_v1',pagesRead,snapshotGuaranteed:false}),
  })
  owners.set(result,envelope)
  return result
}
// Future consumers must establish provenance rather than trusting matching string fields.
export function assertPhase14GeographicPopulationForExecution(
  value: Phase14GeographicAcquisition, envelope: Phase14ExecutionEnvelope,
): asserts value is Phase14GeographicPopulation {
  assertPhase14ExecutionEnvelope(envelope)
  if (!value || value.state!=='complete' || owners.get(value)!==envelope) {
    throw new Error('Invalid Phase 14 geographic population execution association.')
  }
}
