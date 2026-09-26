import 'server-only'
import { randomUUID } from 'node:crypto'
import { commitPhase14Question, assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { DtaResolutionError } from './geography/dta-request'
import { Phase14QuestionError } from './phase14-question'
import { PriceMeterComparableAuthenticationError, PriceMeterComparableAuthorizationError } from './price-meter-authorization'
import { acquirePhase14GeographicPopulation, assertPhase14GeographicPopulationForExecution } from './phase14-geographic-population'
import { acquirePhase14FundamentalPopulation, assertPhase14FundamentalPopulationForExecution } from './phase14-fundamental-population'
import { acquirePhase14MembershipPopulation, assertPhase14MembershipPopulationForExecution } from './phase14-membership-population'
import { acquirePhase14FactPopulation, assertPhase14FactPopulationForExecution } from './phase14-fact-population'
import { hydratePhase14Survivors, assertPhase14HydratedPopulationForExecution } from './phase14-hydrated-population'
import { commitPhase14AnalyticalExecution, assertPhase14AnalyticalExecution, type Phase14AnalyticalExecution, type Phase14Normalization } from './phase14-analytical-execution'
import { executePhase14AnalyticalEligibility, assertPhase14AnalyticalPopulationForExecution } from './phase14-analytical-population'
import { composePhase14CompletePopulation, assertPhase14CompletePopulation } from './phase14-complete-analytical-population'
import { analyzePhase14Population, assertPhase14DiscoveryForPopulation } from './phase14-comparative-discovery'
import { composePhase14DiscoveryResults, assertPhase14ResultsForDiscovery, type Phase14ComparativeDiscoveryResults } from './phase14-discovery-results'

const sequence = ['1','2','3','4','5','6','analytical_execution','7','8','9','10'] as const
type Stage = typeof sequence[number] | 'request'
type FailureState = 'invalid_execution' | 'incomplete' | 'execution_failed'
type TraceEntry = Readonly<{stage:Stage;state:'complete'|FailureState;inputCount:number|null;outputCount:number|null;reason?:string;dimension?:string}>
export type Phase14ServerExecution = Readonly<{
  state:'complete';contractVersion:1
  invocationId:string
  executionAttemptId:string
  marketExecution:Phase14ExecutionEnvelope
  analyticalExecution:Phase14AnalyticalExecution
  normalization:Phase14Normalization
  transaction:Phase14ExecutionEnvelope['question']['transaction']
  result:Phase14ComparativeDiscoveryResults
  trace:readonly TraceEntry[]
  completeness:Readonly<{allStagesComplete:true;snapshotGuaranteed:false}>
}>
export type Phase14ServerOutcome = Phase14ServerExecution | Readonly<{
  state:FailureState;contractVersion:1;invocationId:string
  executionAttemptId:string|null;marketExecutionId:string|null
  marketQuestionIdentity:string|null;analyticalQuestionIdentity:string|null
  normalization:Phase14Normalization|null;failedStage:Stage
  reason:string;dimension?:string;trace:readonly TraceEntry[]
}>
const owners = new WeakMap<object, Phase14ComparativeDiscoveryResults>()
const failures = new WeakSet<object>()
class StageFailure {
  constructor(readonly state:FailureState, readonly reason:string, readonly dimension?:string) {}
}
function requireEvidence(condition:unknown):asserts condition {
  if(!condition)throw new Error('Invalid Phase 14 orchestration provenance.')
}
function validateCompletion(value:Phase14ServerExecution) {
  const {marketExecution:e,analyticalExecution:a,result:r}=value
  assertPhase14ExecutionEnvelope(e)
  assertPhase14AnalyticalExecution(a)
  assertPhase14ResultsForDiscovery(r,r.source)
  requireEvidence(a.marketExecution===e && r.source.population.marketExecution===e && r.source.population.source.execution===a)
  requireEvidence(value.executionAttemptId===a.analyticalExecutionId && r.executionAttemptId===a.analyticalExecutionId)
  requireEvidence(value.normalization===a.normalizationBasis && value.normalization===r.normalization && value.transaction===e.question.transaction && value.transaction===r.transaction)
  requireEvidence(value.trace.length===sequence.length && value.trace.every((entry,i)=>entry.stage===sequence[i]&&entry.state==='complete'))
  requireEvidence(value.completeness.allStagesComplete===true&&value.completeness.snapshotGuaranteed===r.completeness.snapshotGuaranteed)
}
// Internal entry point only. No supplied user identity, clients, dependencies, or intermediate evidence.
export async function executePhase14ComparativeDiscovery(rawRequest:unknown, normalization:unknown):Promise<Phase14ServerOutcome> {
  const invocationId=randomUUID(),trace:TraceEntry[]=[]
  let current:Stage='request',inputCount:number|null=null
  let market:Phase14ExecutionEnvelope|undefined,analytical:Phase14AnalyticalExecution|undefined
  const validNormalization=normalization==='land'||normalization==='construction'?normalization:null
  async function run<T>(stage:Stage, input:number|null, call:()=>T|Promise<T>, verify:(value:T)=>number|null):Promise<T> {
    current=stage;inputCount=input
    const value=await call()
    if(value && typeof value==='object' && 'state' in value && value.state!=='complete') {
      if(value.state!=='invalid_execution'&&value.state!=='incomplete'&&value.state!=='execution_failed')throw new Error('Unexpected stage state.')
      const reason='reason' in value&&typeof value.reason==='string'?value.reason:'invalid_execution'
      const dimension='dimension' in value&&typeof value.dimension==='string'?value.dimension:undefined
      throw new StageFailure(value.state,reason,dimension)
    }
    const outputCount=verify(value)
    trace.push(Object.freeze({stage,state:'complete',inputCount:input,outputCount}))
    return value
  }
  try {
    // Syntax gate only; the authoritative analytical commitment remains after Step 6.
    if(validNormalization===null)throw new StageFailure('invalid_execution','invalid_normalization')
    const e=await run('1',null,()=>commitPhase14Question(rawRequest),v=>{assertPhase14ExecutionEnvelope(v);return null});market=e
    const g=await run('2',null,()=>acquirePhase14GeographicPopulation(e),v=>{assertPhase14GeographicPopulationForExecution(v,e);return v.acquiredUniqueListingCount})
    if(g.state!=='complete')throw new Error('Unreachable stage state.')
    const f=await run('3',g.acquiredUniqueListingCount,()=>acquirePhase14FundamentalPopulation(e,g),v=>{assertPhase14FundamentalPopulationForExecution(v,e,g);return v.survivingListingCount})
    if(f.state!=='complete')throw new Error('Unreachable stage state.')
    const m=await run('4',f.survivingListingCount,()=>acquirePhase14MembershipPopulation(e,f),v=>{assertPhase14MembershipPopulationForExecution(v,e,f);return v.survivingListingCount})
    if(m.state!=='complete')throw new Error('Unreachable stage state.')
    const p=await run('5',m.survivingListingCount,()=>acquirePhase14FactPopulation(e,m),v=>{assertPhase14FactPopulationForExecution(v,e,m);return v.survivingListingCount})
    if(p.state!=='complete')throw new Error('Unreachable stage state.')
    const h=await run('6',p.survivingListingCount,()=>hydratePhase14Survivors(e,p),v=>{assertPhase14HydratedPopulationForExecution(v,e,p);return v.hydratedListingCount})
    if(h.state!=='complete')throw new Error('Unreachable stage state.')
    const a=await run('analytical_execution',null,()=>commitPhase14AnalyticalExecution(e,validNormalization),v=>{assertPhase14AnalyticalExecution(v);requireEvidence(v.marketExecution===e&&v.normalizationBasis===validNormalization);return null});analytical=a
    const observations=await run('7',h.hydratedListingCount,()=>executePhase14AnalyticalEligibility(a,h),v=>{assertPhase14AnalyticalPopulationForExecution(v,a,h);return v.authorizedObservationCount})
    if(observations.state!=='complete')throw new Error('Unreachable stage state.')
    const population=await run('8',observations.authorizedObservationCount,()=>composePhase14CompletePopulation(e,observations),v=>{assertPhase14CompletePopulation(v);requireEvidence(v.source===observations);return v.finalAnalyticalN})
    if(population.state!=='complete')throw new Error('Unreachable stage state.')
    const evidence=await run('9',population.finalAnalyticalN,()=>analyzePhase14Population(e,population),v=>{assertPhase14DiscoveryForPopulation(v,population);return v.n})
    if(evidence.state!=='complete')throw new Error('Unreachable stage state.')
    const result=await run('10',evidence.n,()=>composePhase14DiscoveryResults(e,evidence),v=>{assertPhase14ResultsForDiscovery(v,evidence);return v.resultCount})
    if(result.state!=='complete')throw new Error('Unreachable stage state.')
    const complete:Phase14ServerExecution={state:'complete',contractVersion:1,invocationId,executionAttemptId:a.analyticalExecutionId,
      marketExecution:e,analyticalExecution:a,normalization:a.normalizationBasis,transaction:e.question.transaction,result,
      trace:Object.freeze(trace),completeness:Object.freeze({allStagesComplete:true,snapshotGuaranteed:result.completeness.snapshotGuaranteed})}
    validateCompletion(complete)
    Object.freeze(complete);owners.set(complete,result);return complete
  } catch(error) {
    const failure=error instanceof StageFailure?error:
      error instanceof DtaResolutionError?new StageFailure(['INVALID_REQUEST','MALFORMED_CODE','REQUEST_TOO_LARGE','INVALID_ONTOLOGY_ID','EMPTY_SELECTION'].includes(error.code)?'invalid_execution':'execution_failed',error.code):
      error instanceof Phase14QuestionError?new StageFailure('invalid_execution','invalid_question'):
      error instanceof PriceMeterComparableAuthenticationError?new StageFailure('invalid_execution','authentication_required'):
      error instanceof PriceMeterComparableAuthorizationError?new StageFailure('invalid_execution','entitlement_required'):
      new StageFailure('execution_failed','unexpected_stage_failure')
    // A final postcondition failure replaces the last success entry, not a duplicate logical call.
    const entries=trace.at(-1)?.stage===current?trace.slice(0,-1):[...trace]
    entries.push(Object.freeze({stage:current,state:failure.state,inputCount,outputCount:null,reason:failure.reason,...(failure.dimension?{dimension:failure.dimension}:{})}))
    const outcome = Object.freeze({state:failure.state,contractVersion:1 as const,invocationId,executionAttemptId:analytical?.analyticalExecutionId??null,
      marketExecutionId:market?.executionId??null,marketQuestionIdentity:market?.canonicalQuestionSerialization??null,
      analyticalQuestionIdentity:analytical?.analyticalIdentity??null,normalization:validNormalization,failedStage:current,
      reason:failure.reason,...(failure.dimension?{dimension:failure.dimension}:{}),trace:Object.freeze(entries)})
    failures.add(outcome)
    return outcome
  }
}
export function assertPhase14ServerExecution(value:Phase14ServerOutcome):asserts value is Phase14ServerExecution {
  if(value.state!=='complete'||owners.get(value)!==value.result)throw new Error('Invalid Phase 14 server execution.')
  validateCompletion(value)
}

// Identity proves origin; copying or serializing an outcome never confers authority.
export function assertPhase14ServerOutcome(value: unknown): asserts value is Phase14ServerOutcome {
  if (!value || typeof value !== 'object') throw new Error('Invalid Phase 14 server outcome.')
  if (failures.has(value)) return
  assertPhase14ServerExecution(value as Phase14ServerOutcome)
}
