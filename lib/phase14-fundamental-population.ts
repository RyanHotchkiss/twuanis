import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14GeographicPopulationForExecution, type Phase14GeographicAcquisition, type Phase14GeographicPopulation } from './phase14-geographic-population'

const PAGE_SIZE = 500 // Transport bound only; never an analytical population cap.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type Provenance = Readonly<{
  kind: 'fundamentally_eligible_population'
  executionId: string
  canonicalQuestionSerialization: string
  geography: Phase14ExecutionEnvelope['question']['geography']
  transaction: Phase14ExecutionEnvelope['question']['transaction']
  geographicPopulation: Phase14GeographicPopulation
  geographicStartingCount: number
  predicates: Readonly<{ listingStatus: 'active'; canonicalDomainVersion: 1; transaction: Phase14ExecutionEnvelope['question']['transaction'] }>
}>
export type Phase14FundamentalPopulation = Provenance & Readonly<{
  state: 'complete'
  expectedSurvivorCount: number
  survivingListingCount: number
  excludedListingCount: number
  listingIds: readonly string[]
  completeness: Readonly<{ contract: 'stable_order_exact_count_subset_pages_v1'; pagesRead: number; snapshotGuaranteed: false }>
}>
type IncompleteReason = 'invalid_page' | 'invalid_membership' | 'invalid_predicate_evidence' | 'outside_starting_population' | 'duplicate_or_unordered'
export type Phase14FundamentalAcquisition = Phase14FundamentalPopulation
  | (Provenance & Readonly<{ state: 'incomplete'; reason: IncompleteReason }>)
  | (Provenance & Readonly<{ state: 'execution_failed'; reason: 'predicate_query_failed' }>)
  | Readonly<{ state: 'invalid_execution' }>
const owners = new WeakMap<object, Readonly<{ envelope: Phase14ExecutionEnvelope; geographic: Phase14GeographicPopulation }>>()

export async function acquirePhase14FundamentalPopulation(
  envelope: Phase14ExecutionEnvelope, geographic: Phase14GeographicAcquisition,
): Promise<Phase14FundamentalAcquisition> {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    assertPhase14GeographicPopulationForExecution(geographic,envelope)
  } catch { return Object.freeze({state:'invalid_execution'}) }
  const transaction=envelope.question.transaction
  const provenance: Provenance=Object.freeze({kind:'fundamentally_eligible_population',executionId:envelope.executionId,
    canonicalQuestionSerialization:envelope.canonicalQuestionSerialization,geography:envelope.question.geography,
    transaction,geographicPopulation:geographic,geographicStartingCount:geographic.acquiredUniqueListingCount,
    predicates:Object.freeze({listingStatus:'active',canonicalDomainVersion:1,transaction})})
  const incomplete=(reason:IncompleteReason):Phase14FundamentalAcquisition=>Object.freeze({...provenance,state:'incomplete',reason})
  const sourceIds=new Set(geographic.listingIds),seen=new Set<string>(),ids:string[]=[]
  let expected:number|null=null,pagesRead=0,previous:string|null=null
  // Preserve complete empty input without an unnecessary population query.
  if (sourceIds.size===0) expected=0
  else do {
    let response
    try {
      response=await supabaseAdmin.from('listings_ontology_terms')
        .select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)',{count:'exact'})
        .eq('ontology_term_id',provenance.geography.termId)
        .eq('listings.canonical_domain_version',1)
        .eq('listings.listing_status','active')
        .eq('listings.transaction_type',transaction)
        .order('listing_id').order('ontology_term_id')
        .range(ids.length,ids.length+PAGE_SIZE-1)
    } catch { return Object.freeze({...provenance,state:'execution_failed',reason:'predicate_query_failed'}) }
    if (response?.error) return Object.freeze({...provenance,state:'execution_failed',reason:'predicate_query_failed'})
    const data=response?.data,count=response?.count
    pagesRead++
    if (!Array.isArray(data)||!Number.isSafeInteger(count)||count!<0||count!>sourceIds.size||
        (expected!==null&&expected!==count)||data.length>PAGE_SIZE||ids.length+data.length>count!||
        (!data.length&&ids.length<count!)) return incomplete('invalid_page')
    expected=count!
    for (const row of data) {
      if (!row||typeof row.listing_id!=='string'||!uuid.test(row.listing_id)||row.ontology_term_id!==provenance.geography.termId) return incomplete('invalid_membership')
      const id=row.listing_id
      if (!sourceIds.has(id)) return incomplete('outside_starting_population')
      if (seen.has(id)||(previous!==null&&id<=previous)) return incomplete('duplicate_or_unordered')
      // The database predicates own elimination. Contradictory returned evidence fails
      // the acquisition; it is never filtered locally into a seemingly complete result.
      const listing:unknown=row.listings
      if (!listing||typeof listing!=='object'||Array.isArray(listing)||
          !('canonical_domain_version' in listing)||!('listing_status' in listing)||!('transaction_type' in listing)||
          listing.canonical_domain_version!==1||listing.listing_status!=='active'||listing.transaction_type!==transaction) return incomplete('invalid_predicate_evidence')
      seen.add(id);ids.push(id);previous=id
    }
  } while(ids.length<expected!)
  const result:Phase14FundamentalPopulation=Object.freeze({...provenance,state:'complete',expectedSurvivorCount:expected!,
    survivingListingCount:ids.length,excludedListingCount:sourceIds.size-ids.length,listingIds:Object.freeze(ids),
    completeness:Object.freeze({contract:'stable_order_exact_count_subset_pages_v1',pagesRead,snapshotGuaranteed:false})})
  owners.set(result,Object.freeze({envelope,geographic}))
  return result
}
export function assertPhase14FundamentalPopulationForExecution(
  value:Phase14FundamentalAcquisition,envelope:Phase14ExecutionEnvelope,geographic:Phase14GeographicAcquisition,
):asserts value is Phase14FundamentalPopulation {
  assertPhase14GeographicPopulationForExecution(geographic,envelope)
  const owner=value&&owners.get(value)
  if (!value||value.state!=='complete'||owner?.envelope!==envelope||owner.geographic!==geographic) {
    throw new Error('Invalid Phase 14 fundamental population execution association.')
  }
}
