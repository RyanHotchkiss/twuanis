import 'server-only'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14AnalyticalPopulationForExecution, type Phase14Analysis, type Phase14AnalyticalPopulation } from './phase14-analytical-population'
import { assertPhase14HydratedPopulationForExecution, type Phase14HydratedPopulation } from './phase14-hydrated-population'
import { assertPhase14FactPopulationForExecution } from './phase14-fact-population'
import { assertPhase14MembershipPopulationForExecution } from './phase14-membership-population'
import { assertPhase14FundamentalPopulationForExecution } from './phase14-fundamental-population'
import { assertPhase14GeographicPopulationForExecution } from './phase14-geographic-population'

type LedgerStage = Readonly<{
  stage: 'canonical_geographic_starting_population' | 'fundamentally_eligible_population' | 'canonical_membership_filter' | 'fact_scalar_filter' | 'canonically_hydrated_survivor_population' | 'authorized_observation_population'
  inputCount: number; outputCount: number; excludedCount: number | null
  execution: 'complete' | 'queried' | 'empty_input'
  evidence: object
}>
export type Phase14CompletePopulation = Readonly<{
  state:'complete'; contractVersion:1; marketExecution:Phase14ExecutionEnvelope
  analyticalQuestionIdentity:string; executionAttemptId:string
  normalizationBasis:Phase14AnalyticalPopulation['normalizationBasis']
  analyticalDate:Phase14AnalyticalPopulation['analyticalDate']; fx:Phase14AnalyticalPopulation['fx']
  source:Phase14AnalyticalPopulation; ledger:readonly LedgerStage[]
  observations:Phase14AnalyticalPopulation['observations']; finalListingIds:readonly string[]; finalAnalyticalN:number
  analyticalExclusions:readonly Extract<Phase14AnalyticalPopulation['decisions'][number],{state:'excluded'}>[]
  completeness:Readonly<{stagedPopulationComplete:true;snapshotGuaranteed:false}>
}>
export type Phase14PopulationComposition = Phase14CompletePopulation | Readonly<{state:'invalid_execution'}>
  | Readonly<{state:'incomplete';reason:'population_chain_incoherent'}>
const owners=new WeakMap<object,{envelope:Phase14ExecutionEnvelope;source:Phase14AnalyticalPopulation}>()
function requireEvidence(condition:unknown):asserts condition {if(!condition)throw new Error('Incoherent Phase 14 population chain.')}
function count(n:number){requireEvidence(Number.isSafeInteger(n)&&n>=0)}
function same(a:unknown,b:unknown){requireEvidence(JSON.stringify(a)===JSON.stringify(b))} // Small constraint/context identities only, never whole populations.
function ids(values:readonly string[],expected:number):Set<string>{
  count(expected);requireEvidence(Array.isArray(values)&&values.length===expected)
  const result=new Set<string>();let previous=''
  for(const id of values){requireEvidence(typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)&&id>previous);result.add(id);previous=id}
  return result
}
function subset(child:Set<string>,parent:Set<string>){for(const id of child)requireEvidence(parent.has(id))}
function reduction(input:number,output:number,excluded:number){count(input);count(output);count(excluded);requireEvidence(input===output+excluded)}
function snapshot(e:{snapshotGuaranteed:false}){requireEvidence(e.snapshotGuaranteed===false)}
function freeze<T>(v:T):T {if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const c of Object.values(v))freeze(c);Object.freeze(v)}return v}

// Private invariant checker; authentication is performed before this is reached.
function validateChain(envelope:Phase14ExecutionEnvelope,s7:Phase14AnalyticalPopulation){
  const s6=s7.hydratedPopulation,s5=s6.factPopulation,s4=s5.membershipPopulation,s3=s4.fundamentalPopulation,s2=s3.geographicPopulation
  const q=envelope.question,ledger:LedgerStage[]=[]
  requireEvidence(s7.state==='complete'&&s7.execution.marketExecution===envelope)
  for(const stage of[s2,s3,s4,s5,s6]){
    requireEvidence(stage.state==='complete'&&stage.executionId===envelope.executionId&&stage.canonicalQuestionSerialization===envelope.canonicalQuestionSerialization)
    snapshot(stage.completeness)
  }
  snapshot(s7.completeness)
  same(s2.geography,q.geography);same(s3.geography,q.geography);same(s4.propertyType,q.propertyType)
  same(s3.predicates,{listingStatus:'active',canonicalDomainVersion:1,transaction:q.transaction})
  requireEvidence(s3.transaction===q.transaction&&s7.normalizationBasis===s7.execution.normalizationBasis&&['land','construction'].includes(s7.normalizationBasis))
  requireEvidence(s7.execution.analyticalIdentity===JSON.stringify({version:1,question:envelope.canonicalQuestionSerialization,normalizationBasis:s7.normalizationBasis}))
  const g=ids(s2.listingIds,s2.acquiredUniqueListingCount),f=ids(s3.listingIds,s3.survivingListingCount),m=ids(s4.listingIds,s4.survivingListingCount),v=ids(s5.listingIds,s5.survivingListingCount),h=ids(s6.listingIds,s6.hydratedListingCount)
  requireEvidence(s2.expectedMembershipCount===g.size&&s3.geographicStartingCount===g.size&&s3.expectedSurvivorCount===f.size)
  subset(f,g);subset(m,f);subset(v,m);subset(h,v);requireEvidence(h.size===v.size)
  reduction(g.size,f.size,s3.excludedListingCount)
  ledger.push({stage:s2.kind,inputCount:g.size,outputCount:g.size,excludedCount:null,execution:'complete',evidence:s2})
  ledger.push({stage:s3.kind,inputCount:g.size,outputCount:f.size,excludedCount:s3.excludedListingCount,execution:'complete',evidence:s3})
  const semantic=[{dimension:'property_type',terms:[q.propertyType.termId]},...(['environment','terrain','utility','accessibility','legal_status'] as const).flatMap(d=>q.filters.semantics?.[d]?.length?[{dimension:d,terms:q.filters.semantics[d]!}]:[])]
  requireEvidence(s4.trail.length===semantic.length&&s4.fundamentalStartingCount===f.size)
  let prior=f.size
  for(const [i,stage]of s4.trail.entries()){
    requireEvidence(stage.dimension===semantic[i].dimension&&stage.inputCount===prior&&stage.withinDimension==='OR');same(stage.selectedTermIds,semantic[i].terms)
    reduction(prior,stage.survivorCount,stage.excludedCount);snapshot(stage.completeness)
    requireEvidence(stage.execution===(prior?'queried':'empty_input'));count(stage.completeness.pagesRead)
    requireEvidence(prior?stage.completeness.pagesRead>0:stage.completeness.pagesRead===0)
    ledger.push({stage:'canonical_membership_filter',inputCount:prior,outputCount:stage.survivorCount,excludedCount:stage.excludedCount,execution:stage.execution,evidence:stage});prior=stage.survivorCount
  }
  requireEvidence(s4.completeness.pagesRead===s4.trail.reduce((sum,stage)=>sum+stage.completeness.pagesRead,0))
  requireEvidence(prior===m.size&&s4.propertyTypeSurvivorCount===s4.trail[0].survivorCount);reduction(f.size,m.size,s4.excludedListingCount)
  requireEvidence(s4.acrossDimensions==='AND'&&s5.acrossDimensions==='AND'&&s5.withinDimension==='OR')
  const selections:object[]=(['bedrooms','bathrooms','parking','year_built'] as const).flatMap(d=>q.filters.facts?.[d]?.length?[{dimension:d,constraints:q.filters.facts[d]}]:[])
  if(q.filters.propertyArea)selections.push({dimension:'propertyArea',rangeKey:q.filters.propertyArea})
  if(q.filters.constructionArea)selections.push({dimension:'constructionArea',rangeKey:q.filters.constructionArea})
  requireEvidence(s5.trail.length===selections.length&&s5.membershipStartingCount===m.size);prior=m.size
  for(const [i,stage]of s5.trail.entries()){
    same(stage.selection,selections[i]);requireEvidence(stage.inputCount===prior);reduction(prior,stage.survivorCount,stage.excludedCount);snapshot(stage.completeness)
    requireEvidence(stage.execution===(prior?'queried':'empty_input'));count(stage.completeness.requests)
    requireEvidence(prior?stage.completeness.requests>0:stage.completeness.requests===0)
    ledger.push({stage:'fact_scalar_filter',inputCount:prior,outputCount:stage.survivorCount,excludedCount:stage.excludedCount,execution:stage.execution,evidence:stage});prior=stage.survivorCount
  }
  requireEvidence(s5.completeness.requests===s5.trail.reduce((sum,stage)=>sum+stage.completeness.requests,0))
  requireEvidence(prior===v.size);reduction(m.size,v.size,s5.excludedListingCount)
  requireEvidence(s6.step5SurvivorCount===v.size&&s6.completeness.exactRequestedIdCoverage===true&&Object.keys(s6.evidenceByListingId).length===h.size)
  for(const id of h){const e=s6.evidenceByListingId[id];requireEvidence(e&&e.scalars.id===id&&e.canonical.listing_id===id&&e.scalars.transaction_type===q.transaction&&e.scalars.canonical_domain_version===1&&e.scalars.listing_status==='active')
    const types=e.canonical.selections.filter(t=>t.dimension==='property_type');requireEvidence(types.length===1&&types[0].ontology_term_id===q.propertyType.termId)
    requireEvidence(e.canonical.geography.some(t=>t.term_type===q.geography.level&&t.id===q.geography.termId&&t.official_code===q.geography.officialCode))
  }
  ledger.push({stage:'canonically_hydrated_survivor_population',inputCount:v.size,outputCount:h.size,excludedCount:null,execution:'complete',evidence:s6})
  requireEvidence(s7.hydratedInputCount===h.size&&s7.completeness.everyHydratedListingAccountedFor===true)
  requireEvidence(s7.decisions.length===h.size&&s7.decisions.every((d,i)=>d.listingId===s6.listingIds[i]))
  const excluded=s7.decisions.filter((d):d is Extract<typeof d,{state:'excluded'}>=>d.state==='excluded')
  const authorized=s7.decisions.filter(d=>d.state==='authorized'),a=new Set(authorized.map(d=>d.listingId)),e=new Set(excluded.map(d=>d.listingId))
  requireEvidence(a.size===authorized.length&&e.size===excluded.length&&a.size+e.size===h.size)
  subset(a,h);subset(e,h);for(const id of a)requireEvidence(!e.has(id))
  requireEvidence(excluded.every(d=>d.reasons.length>0)&&s7.excludedListingCount===e.size&&s7.authorizedObservationCount===a.size&&s7.observations.length===a.size)
  const finalListingIds=s7.observations.map(x=>x.observation.listingId)
  requireEvidence(finalListingIds.every((id):id is string=>typeof id==='string'))
  const observed=ids(finalListingIds as string[],a.size);subset(observed,a)
  const decisions=new Map(s7.decisions.map(d=>[d.listingId,d]))
  requireEvidence(h.size?s7.analyticalDate!==null:s7.analyticalDate===null)
  for(const item of s7.observations){
    const o=item.observation,id=o.listingId!,identity=o.analyticalIdentity,hydrated=s6.evidenceByListingId[id]
    requireEvidence(decisions.get(id)?.analyticalIdentity===identity&&identity.eligibility.eligible&&identity.priceIntegrity.analyticallyAdmissible)
    requireEvidence(o.transactionType===q.transaction&&identity.transactionType===q.transaction&&o.normalizationBasis===s7.normalizationBasis&&item.unit===(q.transaction==='sale'?'CRC/m²':'CRC/m²/month'))
    requireEvidence(identity.propertyBasis!=='unknown'&&o.propertyBasis===identity.propertyBasis&&identity.availableNormalizationBases.includes(o.normalizationBasis))
    requireEvidence(o.areaM2===(o.normalizationBasis==='land'?identity.propertyArea.exactM2:identity.constructionArea.exactM2)&&Number.isFinite(o.areaM2)&&o.areaM2>0)
    requireEvidence(Number.isFinite(o.pricePerM2)&&o.pricePerM2>0&&o.analyticalPrice===identity.price.analyticalAmount&&identity.analyticalCurrency==='CRC'&&identity.price.analyticalCurrency==='CRC')
    requireEvidence(identity.originalCurrency===hydrated.scalars.currency&&identity.price.originalCurrency===hydrated.scalars.currency&&o.fx===identity.price.fx&&o.geography===identity.geography)
    for(const level of ['province','canton','district'] as const){const term=identity.geography[level],raw=hydrated.canonical.geography.find(t=>t.term_type===level)
      // Legacy compatibility TS type uses numeric IDs; runtime canonical IDs remain lossless strings.
      requireEvidence(raw ? term!==null&&String(term.id)===raw.id&&term.official_code===raw.official_code : term===null)
    }
    requireEvidence(o.fx&&o.fx.analyticalDate===s7.analyticalDate)
    if(identity.originalCurrency==='USD')same(o.fx,s7.fx)
    else requireEvidence(o.fx.conversionApplied===false&&o.fx.rate===1&&o.fx.source==='native_crc'&&o.fx.effectiveDate===s7.analyticalDate)
  }
  ledger.push({stage:'authorized_observation_population',inputCount:h.size,outputCount:a.size,excludedCount:e.size,execution:'complete',evidence:s7})
  return {ledger,finalListingIds:finalListingIds as string[],excluded}
}
export function composePhase14CompletePopulation(envelope:Phase14ExecutionEnvelope,source:Phase14Analysis):Phase14PopulationComposition {
  try{
    assertPhase14ExecutionEnvelope(envelope)
    if(!source||source.state!=='complete'||source.execution.marketExecution!==envelope)return Object.freeze({state:'invalid_execution'})
    const s6=source.hydratedPopulation as Phase14HydratedPopulation,s5=s6.factPopulation,s4=s5.membershipPopulation,s3=s4.fundamentalPopulation,s2=s3.geographicPopulation
    assertPhase14AnalyticalPopulationForExecution(source,source.execution,s6)
    assertPhase14HydratedPopulationForExecution(s6,envelope,s5)
    assertPhase14FactPopulationForExecution(s5,envelope,s4)
    assertPhase14MembershipPopulationForExecution(s4,envelope,s3)
    assertPhase14FundamentalPopulationForExecution(s3,envelope,s2)
    assertPhase14GeographicPopulationForExecution(s2,envelope)
  }catch{return Object.freeze({state:'invalid_execution'})}
  try{
    const checked=validateChain(envelope,source)
    const result:Phase14CompletePopulation=freeze({state:'complete',contractVersion:1,marketExecution:envelope,
      analyticalQuestionIdentity:source.execution.analyticalIdentity,executionAttemptId:source.execution.analyticalExecutionId,
      normalizationBasis:source.normalizationBasis,analyticalDate:source.analyticalDate,fx:source.fx,source,
      ledger:checked.ledger,observations:source.observations,finalListingIds:checked.finalListingIds,finalAnalyticalN:source.authorizedObservationCount,
      analyticalExclusions:checked.excluded,completeness:{stagedPopulationComplete:true,snapshotGuaranteed:false}})
    owners.set(result,{envelope,source});return result
  }catch{return Object.freeze({state:'incomplete',reason:'population_chain_incoherent'})}
}
export function assertPhase14CompletePopulation(value:Phase14PopulationComposition):asserts value is Phase14CompletePopulation {
  const owner=value&&owners.get(value)
  if(!value||value.state!=='complete'||!owner||owner.envelope!==value.marketExecution||owner.source!==value.source)throw new Error('Invalid Phase 14 complete population.')
}
// Analytical-question equality is inherited, not a cross-date cache/history equivalence rule.
export function equalPhase14PopulationQuestions(a:Phase14PopulationComposition,b:Phase14PopulationComposition):boolean {
  assertPhase14CompletePopulation(a);assertPhase14CompletePopulation(b);return a.analyticalQuestionIdentity===b.analyticalQuestionIdentity
}
// Exact immutable evidence identity remains separate from equality of the analytical question.
export function samePhase14PopulationEvidence(a:Phase14PopulationComposition,b:Phase14PopulationComposition):boolean {
  assertPhase14CompletePopulation(a);assertPhase14CompletePopulation(b);return a.source===b.source
}
