import 'server-only'
import { buildPriceMeterComparison } from './price-meter-comparison-orchestrator'
import type { PriceMeterComparisonRequest } from './price-meter-comparison-request'
import type { PriceMeterObservation } from './price-meter-observation-builder'
import type { PriceMeterOntologyMembership } from './price-meter-ontology-membership'
import type { PriceMeterFxIdentity } from './price-meter-identity'
import { contextBase,distribution,metric,type EstablishedExecution } from './price-meter-property-difference-context-adapter'
export async function characteristicContext(e:EstablishedExecution,index:number,request:PriceMeterComparisonRequest,observations:PriceMeterObservation[],memberships:PriceMeterOntologyMembership[],fx:PriceMeterFxIdentity|null) {
 const item=contextBase(e,'characteristic_comparison',index,10)
 const analysis=await buildPriceMeterComparison({analyticalCohort:{transactionType:request.transactionType,propertyBasis:request.propertyBasis,normalizationBasis:request.normalizationBasis,observations},memberships,cohortA:request.cohortA,cohortB:request.cohortB,referenceCohort:request.referenceCohort,language:'en'})
 item.privateEvidence={request,analysis}
 const usesFx=[...analysis.cohortA.population.observations,...analysis.cohortB.population.observations].some(o=>o.fx?.conversionApplied===true)
 item.monetaryProvenance=usesFx?fx:null
 item.universe!.monetaryMethod=usesFx?'bccr_reference_sale':'native_crc'
 item.populations=(['A','B'] as const).map(key=>{
  const c=key==='A'?analysis.cohortA:analysis.cohortB,d=c.population.definition
  return {key,geography:{id:String(d.geography.id),level:d.geography.term_type,label:d.geography.term_name},propertyType:{id:String(d.propertyType.ontologyTermId),label:d.propertyType.termName},propertyArea:d.propertyAreaRange??'unconstrained',constructionArea:d.constructionAreaRange??'unconstrained',constructionLand:d.constructionLandCohortKey,characteristics:d.characteristics.map(t=>({id:String(t.ontologyTermId),type:t.termType,label:t.termName})),n:c.distribution.sampleSize,representedN:c.distribution.sampleSize,subjectIncluded:c.population.matchingListingIds.includes(e.result.subject.listingId)}
 })
 item.groups=([analysis.cohortA,analysis.cohortB]).map((c,i)=>({key:i===0?'A':'B',label:i===0?'A':'B',n:c.distribution.sampleSize,subjectIncluded:item.populations[i].subjectIncluded!,coordinate:null,rank:null,distribution:distribution(c.distribution),difference:null,percentDifference:null,percentageReference:null}))
 const d=analysis.medianDifference
 item.metrics=[metric('median_a',d.cohortAMedian,e.result.unit,'empty_cohort'),metric('median_b',d.cohortBMedian,e.result.unit,'empty_cohort'),metric('median_a_minus_b',d.absoluteDifference,e.result.unit,'requires_eight_per_cohort'),metric('percent_difference',d.percentageDifference,'%','requires_eight_per_cohort')]
 item.groups.forEach(g=>{g.percentageReference='cohort_'+d.referenceCohort})
 if(!analysis.evidence.comparisonSufficient){item.state='withheld';item.reason='requires_eight_per_cohort'}
 return item
}
