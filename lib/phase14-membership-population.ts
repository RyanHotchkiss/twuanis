import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14FundamentalPopulationForExecution, type Phase14FundamentalAcquisition, type Phase14FundamentalPopulation } from './phase14-fundamental-population'
import type { Phase14SemanticDimension } from './phase14-question-contract'

const SEMANTIC_ORDER = ['environment','terrain','utility','accessibility','legal_status'] as const satisfies readonly Phase14SemanticDimension[]
// Conservative membership request budgets, following existing membership acquisition.
// These are transport controls, unrelated to the canonical hydration RPC limit.
const MAX_IDS_PER_CHUNK = 25, MAX_ENCODED_PREDICATE = 1500, PAGE_SIZE = 500
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type Dimension = 'property_type' | Phase14SemanticDimension
type Completeness = Readonly<{ contract: 'bounded_exact_count_membership_pages_v1'; pagesRead: number; snapshotGuaranteed: false }>
export type Phase14MembershipStage = Readonly<{
  dimension: Dimension
  selectedTermIds: readonly string[]
  withinDimension: 'OR'
  inputCount: number
  survivorCount: number
  excludedCount: number
  execution: 'queried' | 'empty_input'
  acquiredMembershipCount: number
  completeness: Completeness
}>
type Provenance = Readonly<{
  kind: 'pre_hydration_canonical_membership_filtered_population'
  executionId: string
  canonicalQuestionSerialization: string
  fundamentalPopulation: Phase14FundamentalPopulation
  fundamentalStartingCount: number
  propertyType: Phase14ExecutionEnvelope['question']['propertyType']
}>
export type Phase14MembershipPopulation = Provenance & Readonly<{
  state: 'complete'
  acrossDimensions: 'AND'
  propertyTypeSurvivorCount: number
  trail: readonly Phase14MembershipStage[]
  listingIds: readonly string[]
  survivingListingCount: number
  excludedListingCount: number
  completeness: Completeness
}>
type IncompleteReason = 'invalid_page' | 'invalid_membership' | 'duplicate_or_unordered'
export type Phase14MembershipAcquisition = Phase14MembershipPopulation
  | (Provenance & Readonly<{ state: 'incomplete'; dimension: Dimension; reason: IncompleteReason }>)
  | (Provenance & Readonly<{ state: 'execution_failed'; dimension: Dimension; reason: 'membership_query_failed' }>)
  | Readonly<{ state: 'invalid_execution' }>
const owners = new WeakMap<object, Readonly<{ envelope: Phase14ExecutionEnvelope; fundamental: Phase14FundamentalPopulation }>>()
function chunks(values: readonly string[]): string[][] {
  const result:string[][]=[];let part:string[]=[],length=0
  for (const value of values) {
    const cost=encodeURIComponent(JSON.stringify(value)).length+3
    // Authentic UUID/bigint input is far below this bound; never truncate input.
    if (cost>MAX_ENCODED_PREDICATE) throw new Error('Membership identity exceeds transport budget.')
    if (part.length&&(part.length>=MAX_IDS_PER_CHUNK||length+cost>MAX_ENCODED_PREDICATE)) {result.push(part);part=[];length=0}
    part.push(value);length+=cost
  }
  if(part.length)result.push(part)
  return result
}
function complete(pagesRead:number):Completeness {
  return Object.freeze({contract:'bounded_exact_count_membership_pages_v1',pagesRead,snapshotGuaranteed:false})
}

export async function acquirePhase14MembershipPopulation(
  envelope:Phase14ExecutionEnvelope,fundamental:Phase14FundamentalAcquisition,
):Promise<Phase14MembershipAcquisition> {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    if (!fundamental||fundamental.state!=='complete') return Object.freeze({state:'invalid_execution'})
    assertPhase14FundamentalPopulationForExecution(fundamental,envelope,fundamental.geographicPopulation)
  } catch {return Object.freeze({state:'invalid_execution'})}
  const provenance:Provenance=Object.freeze({kind:'pre_hydration_canonical_membership_filtered_population',
    executionId:envelope.executionId,canonicalQuestionSerialization:envelope.canonicalQuestionSerialization,
    fundamentalPopulation:fundamental,fundamentalStartingCount:fundamental.survivingListingCount,propertyType:envelope.question.propertyType})
  const stages:Readonly<{dimension:Dimension;terms:readonly string[]}>[]=[{dimension:'property_type',terms:[envelope.question.propertyType.termId]}]
  for(const dimension of SEMANTIC_ORDER) {
    const terms=envelope.question.filters.semantics?.[dimension]
    if(terms?.length)stages.push({dimension,terms})
  }
  let current:readonly string[]=fundamental.listingIds,totalPages=0
  const trail:Phase14MembershipStage[]=[]
  for(const {dimension,terms} of stages) {
    const inputCount=current.length,matched=new Set<string>(),pairs=new Set<string>()
    let stagePages=0
    const incomplete=(reason:IncompleteReason):Phase14MembershipAcquisition=>Object.freeze({...provenance,state:'incomplete',dimension,reason})
    for(const ids of chunks(current)) for(const selected of chunks(terms)) {
      let expected:number|null=null,offset=0,previousId:string|null=null,previousTerm:bigint|null=null
      do {
        let response
        try {
          response=await supabaseAdmin.from('listings_ontology_terms')
            .select('listing_id,ontology_term_id::text',{count:'exact'})
            .in('listing_id',ids).in('ontology_term_id',selected)
            .order('listing_id').order('ontology_term_id').range(offset,offset+PAGE_SIZE-1)
        } catch {return Object.freeze({...provenance,state:'execution_failed',dimension,reason:'membership_query_failed'})}
        if(response?.error)return Object.freeze({...provenance,state:'execution_failed',dimension,reason:'membership_query_failed'})
        stagePages++
        const data=response?.data,count=response?.count
        if(!Array.isArray(data)||!Number.isSafeInteger(count)||count!<0||count!>ids.length*selected.length||
           (expected!==null&&expected!==count)||data.length>PAGE_SIZE||offset+data.length>count!||
           (!data.length&&offset<count!))return incomplete('invalid_page')
        expected=count!
        for(const row of data) {
          if(!row||typeof row.listing_id!=='string'||!uuid.test(row.listing_id)||!ids.includes(row.listing_id)||
             typeof row.ontology_term_id!=='string'||!selected.includes(row.ontology_term_id))return incomplete('invalid_membership')
          const id=row.listing_id,term=BigInt(row.ontology_term_id),pair=id+':'+row.ontology_term_id
          // PostgreSQL orders bigint numerically, not by its lossless text projection.
          if(pairs.has(pair)||(previousId!==null&&(id<previousId||(id===previousId&&term<=previousTerm!)))) return incomplete('duplicate_or_unordered')
          pairs.add(pair);matched.add(id);previousId=id;previousTerm=term
        }
        offset+=data.length
      } while(offset<expected!)
    }
    // Preserve canonical input ordering across term chunks without making it ranking.
    current=Object.freeze(current.filter(id=>matched.has(id)))
    totalPages+=stagePages
    trail.push(Object.freeze({dimension,selectedTermIds:Object.freeze([...terms]),withinDimension:'OR',inputCount,
      survivorCount:current.length,excludedCount:inputCount-current.length,execution:inputCount?'queried':'empty_input',
      acquiredMembershipCount:pairs.size,completeness:complete(stagePages)}))
    // Selected later stages retain zero-input provenance, but perform zero queries.
  }
  const result:Phase14MembershipPopulation=Object.freeze({...provenance,state:'complete',acrossDimensions:'AND',
    propertyTypeSurvivorCount:trail[0].survivorCount,trail:Object.freeze(trail),listingIds:current,
    survivingListingCount:current.length,excludedListingCount:fundamental.survivingListingCount-current.length,completeness:complete(totalPages)})
  owners.set(result,Object.freeze({envelope,fundamental}));return result
}
export function assertPhase14MembershipPopulationForExecution(
  value:Phase14MembershipAcquisition,envelope:Phase14ExecutionEnvelope,fundamental:Phase14FundamentalAcquisition,
):asserts value is Phase14MembershipPopulation {
  assertPhase14ExecutionEnvelope(envelope)
  if(!fundamental||fundamental.state!=='complete')throw new Error('Invalid Phase 14 fundamental population.')
  assertPhase14FundamentalPopulationForExecution(fundamental,envelope,fundamental.geographicPopulation)
  const owner=value&&owners.get(value)
  if(!value||value.state!=='complete'||owner?.envelope!==envelope||owner.fundamental!==fundamental)throw new Error('Invalid Phase 14 membership population execution association.')
}
