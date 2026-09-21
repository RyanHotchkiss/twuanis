import 'server-only'
import { resolvePriceMeterConstructionLandIdentity } from './price-meter-construction-land'
import { buildPriceMeterConstructionLandPopulation } from './price-meter-construction-land-population'
import { buildPriceMeterConstructionLandStatistics } from './price-meter-construction-land-statistics'
import { buildPriceMeterConstructionLandLandRelationship,buildPriceMeterConstructionLandConstructionRelationship } from './price-meter-construction-land-relationship'
import { contextBase,distribution,metric,type EstablishedExecution } from './price-meter-property-difference-context-adapter'
import type { ContextKey } from './price-meter-property-difference-context-request'
export function constructionLandContext(e:EstablishedExecution,key:ContextKey,index:number) {
 const item=contextBase(e,key,index,9),r=e.result.reference,subject=e.result.evidence.constructionToLandContext
 if(key!==('construction_land_'+r.normalizationBasis)){item.state='invalid_request';item.reason='normalization_mismatch';return item}
 if(!subject){item.state='not_applicable';item.reason='exact_subject_ratio_not_established';return item}
 const subjectIdentity=subject.constructionToLandIdentity
 const observations=e.working.observations.flatMap(o=>{const identity=o.listingId===e.result.subject.listingId?subjectIdentity:resolvePriceMeterConstructionLandIdentity(o.analyticalIdentity);return identity?[identity]:[]})
 const population=buildPriceMeterConstructionLandPopulation({transactionType:r.transactionType,observations})
 const statistics=buildPriceMeterConstructionLandStatistics(population)
 const relationship=(r.normalizationBasis==='land'?buildPriceMeterConstructionLandLandRelationship:buildPriceMeterConstructionLandConstructionRelationship)(statistics)
 item.privateEvidence={population,statistics,relationship};item.populations[0].representedN=statistics.representedObservationCount
 item.populations.push({...item.populations[0],key:'ratio_eligible',constructionLand:'exact_ratio_required',n:statistics.representedObservationCount,representedN:statistics.representedObservationCount,subjectIncluded:observations.includes(subjectIdentity)})
 item.metrics=[metric('subject_construction_land_ratio',subject.constructionToLandRatio),metric('populated_cohorts',relationship.evidence.populatedCohortCount),metric('represented_observations',statistics.representedObservationCount),metric('spearman_rho',relationship.spearmanRho,'',relationship.evidence.hasSufficientEvidence?'mathematical_degeneracy':'requires_three_cohorts_and_twelve_observations'),metric('regression',null,'',relationship.regressionWithheldReason),metric('log_log_beta',null,'',relationship.regressionWithheldReason),metric('modeled_ten_percent_area_change',null,'%',relationship.regressionWithheldReason),metric('r_squared',null,'',relationship.regressionWithheldReason)]
 const lens=r.normalizationBasis==='land'?'landNormalized':'constructionNormalized'
 item.groups=statistics.cohorts.map(c=>{
  const adjacent=statistics.adjacentComparisons.find(a=>a.higherCohort.key===c.definition.key)
  return {key:c.definition.key,label:c.definition.label,n:c.observationCount,subjectIncluded:population.cohorts.find(p=>p.definition.key===c.definition.key)!.observations.includes(subjectIdentity),coordinate:c.medianExactRatio,rank:null,distribution:distribution(c[lens]),difference:adjacent?.[lens].absoluteDifference??null,percentDifference:adjacent?.[lens].percentageDifference??null,percentageReference:adjacent?'lower_ratio_cohort:'+adjacent.lowerCohort.key:null}
 })
 if(!statistics.representedObservationCount){item.state='not_established';item.reason='no_represented_observations'}
 else if(relationship.spearmanRho===null){item.state='withheld';item.reason=relationship.evidence.hasSufficientEvidence?'mathematical_degeneracy':'requires_three_cohorts_and_twelve_observations'}
 return item
}
