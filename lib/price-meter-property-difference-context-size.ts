import 'server-only'
import { buildPriceMeterSizeRelationshipPopulation } from './price-meter-size-relationship-population'
import { buildPriceMeterSizeRelationshipResult } from './price-meter-size-relationship-math'
import { matchesPropertyAreaConstraint,matchesConstructionAreaConstraint } from './market-intelligence-area-ranges'
import { contextBase,emptyDistribution,metric,type EstablishedExecution } from './price-meter-property-difference-context-adapter'
import type { ContextKey } from './price-meter-property-difference-context-request'
export function sizeContext(e:EstablishedExecution,key:ContextKey,index:number) {
 const item=contextBase(e,key,index,8),r=e.result.reference
 const expected=r.normalizationBasis==='land'?'property_area_to_land_normalized_ratio':'construction_area_to_construction_normalized_ratio'
 if(key!==expected){item.state='invalid_request';item.reason='normalization_mismatch';return item}
 if(r.propertyBasis!=='improved_property'){item.state='not_applicable';item.reason='improved_property_required';return item}
 const population=buildPriceMeterSizeRelationshipPopulation({cohort:{transactionType:r.transactionType,propertyBasis:r.propertyBasis,normalizationBasis:r.normalizationBasis,observations:e.working.observations},relationshipKind:expected})
 const result=buildPriceMeterSizeRelationshipResult({coordinates:population.coordinates,representedObservationCount:population.representedObservationCount})
 item.privateEvidence={population,result};item.populations[0].representedN=population.representedObservationCount
 const sufficient=result.evidence.hasSufficientBandEvidence
 const reason=sufficient?'mathematical_degeneracy':'requires_three_populated_bands'
 item.metrics=[metric('populated_bands',result.evidence.populatedBandCount),metric('represented_observations',population.representedObservationCount),metric('spearman_rho',result.spearmanRho,'',reason),metric('log_log_alpha',result.regression?.alpha??null,'',reason),metric('log_log_beta',result.regression?.beta??null,'',reason),metric('modeled_ten_percent_area_change',result.regression?.modeledTenPercentAreaChange??null,'%',reason),metric('r_squared',result.regression?.rSquared??null,'',reason)]
 item.groups=population.bands.map(b=>({key:b.range,label:b.label,n:b.observationCount,subjectIncluded:(r.normalizationBasis==='land'?matchesPropertyAreaConstraint:matchesConstructionAreaConstraint)(e.result.subject.normalizationAreaM2,b.range),coordinate:b.medianExactArea,rank:null,distribution:{...emptyDistribution(),median:b.medianNormalizedRatio},difference:null,percentDifference:null,percentageReference:null}))
 if(!population.representedObservationCount){item.state='not_established';item.reason='no_represented_observations'}
 else if(!sufficient||result.spearmanRho===null||result.regression===null){item.state='withheld';item.reason=reason}
 return item
}
