import 'server-only'
import { assertPhase14AnalyticalExecution, type Phase14AnalyticalExecution, type Phase14Normalization } from './phase14-analytical-execution'
import { assertPhase14HydratedPopulationForExecution, type Phase14Hydration, type Phase14HydratedPopulation, type Phase14HydratedEvidence } from './phase14-hydrated-population'
import { authorizePriceMeterIntelligenceExecution } from './price-meter-authorization'
import { getCurrentAnalyticalDate } from './analysis-date'
import { getHistoricalUsdToCrcRate } from './fx/fx-service'
import { resolvePriceMeterAnalyticalIdentity, type PriceMeterAnalyticalIdentity, type PriceMeterIdentityListing, type PriceMeterFxIdentity } from './price-meter-identity'
import { buildPriceMeterObservations, type PriceMeterObservation } from './price-meter-observation-builder'
import { resolvePriceMeterConstructionLandIdentity, type PriceMeterConstructionLandIdentity } from './price-meter-construction-land'

type DeepReadonly<T> = T extends object ? {readonly [K in keyof T]: DeepReadonly<T[K]>} : T
export type Phase14ExclusionReason = 'property_basis_unknown' | 'normalization_not_applicable' | 'missing_exact_denominator' | 'invalid_denominator'
  | 'transaction_type_unresolved' | 'transaction_price_missing_or_invalid' | 'currency_unresolved' | 'analytical_price_unusable' | 'canonical_observation_not_established'
type Decision = {listingId:string;state:'authorized';analyticalIdentity:PriceMeterAnalyticalIdentity}
  | {listingId:string;state:'excluded';reasons:Phase14ExclusionReason[];analyticalIdentity:PriceMeterAnalyticalIdentity}
type Observation = {observation:PriceMeterObservation;constructionToLand:PriceMeterConstructionLandIdentity|null;unit:'CRC/m²'|'CRC/m²/month'}
type Base = {contractVersion:1;execution:Phase14AnalyticalExecution;hydratedPopulation:Phase14HydratedPopulation;hydratedInputCount:number}
export type Phase14AnalyticalPopulation = DeepReadonly<Base & {
  state:'complete';normalizationBasis:Phase14Normalization;analyticalDate:string|null;fx:PriceMeterFxIdentity|null
  observations:Observation[];authorizedObservationCount:number;excludedListingCount:number;decisions:Decision[]
  gateCounts:{evaluation:'independent_not_sequential';propertyBasis:{land_only:number;improved_property:number;unknown:number};normalizationEligibleCount:number;denominatorEligibleCount:number;monetaryEligibleCount:number;monetaryNotEstablishedCount:number}
  completeness:{everyHydratedListingAccountedFor:true;snapshotGuaranteed:false}
}>
export type Phase14Analysis = Phase14AnalyticalPopulation
  | DeepReadonly<Base & {state:'execution_failed';reason:'authorization_unavailable'|'analytical_context_unavailable'|'monetary_context_unavailable'|'analysis_unavailable'}>
  | DeepReadonly<Base & {state:'incomplete';reason:'observation_identity_incoherent'}>
  | Readonly<{state:'invalid_execution'}>
const owners = new WeakMap<object,{execution:Phase14AnalyticalExecution;hydration:Phase14HydratedPopulation}>()
function freeze<T>(v:T):T {if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const c of Object.values(v))freeze(c);Object.freeze(v)}return v}
function listing(e:Phase14HydratedEvidence):PriceMeterIdentityListing & {id:string} {
  const g=e.canonical.geography,province=g.find(t=>t.term_type==='province')!,canton=g.find(t=>t.term_type==='canton')!,district=g.find(t=>t.term_type==='district')??null
  // Canonical semantic slug feeds the existing Property Basis authority; display labels are not a fallback.
  const type=e.canonical.selections.find(t=>t.dimension==='property_type')!
  const geography={source:{province:null,canton:null,district:null},province,canton,district,
    reasons:{province:'resolved',canton:'resolved',district:district?'resolved':'missing'},complete:true}
  return {...e.scalars,property_type:type.slug,
    property_area:e.scalars.property_area===null?null:Number(e.scalars.property_area),
    construction_area:e.scalars.construction_area===null?null:Number(e.scalars.construction_area),
    // The existing compatibility type uses numeric IDs. Preserve the actual canonical reader's lossless IDs.
    canonicalGeography:geography as unknown as PriceMeterIdentityListing['canonicalGeography']}
}
function reasons(identity:PriceMeterAnalyticalIdentity,basis:Phase14Normalization,afterFx:boolean):Phase14ExclusionReason[] {
  const result:Phase14ExclusionReason[]=[]
  if(identity.propertyBasis==='unknown')result.push('property_basis_unknown')
  if(identity.propertyBasis==='land_only'&&basis==='construction')result.push('normalization_not_applicable')
  const area=basis==='land'?identity.propertyArea:identity.constructionArea
  if(area.kind==='missing')result.push('missing_exact_denominator')
  else if(!area.analyticallyUsable)result.push('invalid_denominator')
  for(const reason of identity.priceIntegrity.reasons)if(afterFx||reason!=='analytical_price_unusable')result.push(reason)
  return [...new Set(result)]
}
// Inputs confer no authority unless authenticated by both private execution/result registries.
export async function executePhase14AnalyticalEligibility(execution:Phase14AnalyticalExecution,hydration:Phase14Hydration):Promise<Phase14Analysis> {
  try {
    assertPhase14AnalyticalExecution(execution)
    if(!hydration||hydration.state!=='complete')return freeze({state:'invalid_execution'})
    assertPhase14HydratedPopulationForExecution(hydration,execution.marketExecution,hydration.factPopulation)
  }catch{return freeze({state:'invalid_execution'})}
  const base:Base={contractVersion:1,execution,hydratedPopulation:hydration,hydratedInputCount:hydration.hydratedListingCount}
  try {if(await authorizePriceMeterIntelligenceExecution()!==execution.authenticatedUserId)return freeze({state:'invalid_execution'})}
  catch{return freeze({...base,state:'execution_failed',reason:'authorization_unavailable'})}
  const basis=execution.normalizationBasis
  const complete=(decisions:Decision[],observations:Observation[],date:string|null,fx:PriceMeterFxIdentity|null):Phase14Analysis=>{
    if(decisions.length!==hydration.hydratedListingCount||new Set(decisions.map(d=>d.listingId)).size!==decisions.length||
      decisions.some((d,i)=>d.listingId!==hydration.listingIds[i])||observations.length!==decisions.filter(d=>d.state==='authorized').length)
      return freeze({...base,state:'incomplete',reason:'observation_identity_incoherent'})
    const propertyBasis={land_only:0,improved_property:0,unknown:0}
    for(const d of decisions)propertyBasis[d.analyticalIdentity.propertyBasis]++
    const gateCounts={evaluation:'independent_not_sequential' as const,propertyBasis,
      normalizationEligibleCount:decisions.filter(d=>d.analyticalIdentity.propertyBasis!=='unknown'&&d.analyticalIdentity.availableNormalizationBases.includes(basis)).length,
      denominatorEligibleCount:decisions.filter(d=>(basis==='land'?d.analyticalIdentity.propertyArea:d.analyticalIdentity.constructionArea).analyticallyUsable).length,
      monetaryEligibleCount:decisions.filter(d=>d.analyticalIdentity.priceIntegrity.analyticallyAdmissible).length,
      monetaryNotEstablishedCount:decisions.filter(d=>!d.analyticalIdentity.priceIntegrity.analyticallyAdmissible).length}
    const result:Phase14AnalyticalPopulation=freeze({...base,state:'complete',normalizationBasis:basis,analyticalDate:date,fx,
      observations,authorizedObservationCount:observations.length,excludedListingCount:decisions.length-observations.length,decisions,gateCounts,
      completeness:{everyHydratedListingAccountedFor:true,snapshotGuaranteed:false}})
    owners.set(result,{execution,hydration});return result
  }
  if(!hydration.hydratedListingCount)return complete([],[],null,null)
  let date:string
  try{date=getCurrentAnalyticalDate()}catch{return freeze({...base,state:'execution_failed',reason:'analytical_context_unavailable'})}
  try {
    const rows=hydration.listingIds.map(id=>listing(hydration.evidenceByListingId[id]))
    const preliminary=rows.map(row=>resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:date,fxIdentity:null}))
    let fx:PriceMeterFxIdentity|null=null
    if(preliminary.some(identity=>!reasons(identity,basis,false).length&&identity.originalCurrency==='USD')){
      try{
        const rate=await getHistoricalUsdToCrcRate(date)
        if(rate.analyticalDate!==date||rate.baseCurrency!=='USD'||rate.quoteCurrency!=='CRC'||rate.source!=='BCCR'||rate.rateType!=='reference_sale'||
          !Number.isFinite(rate.rate)||rate.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(rate.effectiveDate)||rate.effectiveDate>date||
          !['exact','latest_applicable_prior_observation'].includes(rate.resolutionMode)||
          (rate.resolutionMode==='exact'?rate.effectiveDate!==date:rate.effectiveDate>=date))throw new Error('Incoherent FX context.')
        fx={conversionApplied:true,...rate}
      }catch{return freeze({...base,state:'execution_failed',reason:'monetary_context_unavailable'})}
    }
    const decisions:Decision[]=[],observations:Observation[]=[]
    for(const [index,row] of rows.entries()){
      const initial=preliminary[index],preReasons=reasons(initial,basis,false)
      const identity=preReasons.length||initial.originalCurrency!=='USD'?initial:resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:date,fxIdentity:fx})
      const exclusion=preReasons.length?preReasons:reasons(identity,basis,true)
      if(exclusion.length){decisions.push({listingId:row.id,state:'excluded',reasons:exclusion,analyticalIdentity:identity});continue}
      const built=buildPriceMeterObservations([{id:row.id,analyticalIdentity:identity}],basis)
      if(built.length!==1){decisions.push({listingId:row.id,state:'excluded',reasons:['canonical_observation_not_established'],analyticalIdentity:identity});continue}
      const observation=built[0]
      if(observation.listingId!==row.id||observation.transactionType!==execution.marketExecution.question.transaction||observation.normalizationBasis!==basis)
        return freeze({...base,state:'incomplete',reason:'observation_identity_incoherent'})
      if(!Number.isFinite(observation.pricePerM2)||observation.pricePerM2<=0){decisions.push({listingId:row.id,state:'excluded',reasons:['canonical_observation_not_established'],analyticalIdentity:identity});continue}
      decisions.push({listingId:row.id,state:'authorized',analyticalIdentity:identity})
      observations.push({observation,constructionToLand:resolvePriceMeterConstructionLandIdentity(identity),unit:observation.transactionType==='sale'?'CRC/m²':'CRC/m²/month'})
    }
    return complete(decisions,observations,date,fx)
  }catch{return freeze({...base,state:'execution_failed',reason:'analysis_unavailable'})}
}
export function assertPhase14AnalyticalPopulationForExecution(value:Phase14Analysis,execution:Phase14AnalyticalExecution,hydration:Phase14Hydration):asserts value is Phase14AnalyticalPopulation {
  assertPhase14AnalyticalExecution(execution)
  const owner=value&&owners.get(value)
  if(!value||value.state!=='complete'||owner?.execution!==execution||owner.hydration!==hydration)throw new Error('Invalid Phase 14 analytical population.')
}
