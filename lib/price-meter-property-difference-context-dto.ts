import 'server-only'
import { toPositionDTO } from './price-meter-property-position-dto'
import type { DifferenceResult } from './price-meter-property-difference-context-result-contract'
import type { DifferenceDTO } from './price-meter-property-difference-context-browser-contract'
import { COMPARISON_FIELDS } from './price-meter-property-difference-context-request'
export function toDifferenceDTO(result:DifferenceResult):DifferenceDTO {
 const p=result.request.positionRequest
 return {contractVersion:1,committedPositionRequest:{listingId:p.listingId,requestedGeographyLevel:p.requestedGeographyLevel,requestedNormalizationBasis:p.requestedNormalizationBasis},position:toPositionDTO(result.positionResult),boundary:'independent_non_causal',
  selections:result.request.contexts.map(s=>{
   if(s.questionKey!=='characteristic_comparison')return {questionKey:s.questionKey}
   const params:Record<string,string>={reference_cohort:s.params.reference_cohort}
   for(const prefix of ['a','b'])for(const field of COMPARISON_FIELDS){const k=prefix+'_'+field;if(s.params[k]!==undefined)params[k]=s.params[k]}
   return {questionKey:s.questionKey,params}
  }),
  items:result.items.map(i=>({questionKey:i.questionKey,index:i.index,phase:i.phase,state:i.state,reason:i.reason,
   universe:i.universe?{transactionType:i.universe.transactionType,propertyBasis:i.universe.propertyBasis,normalizationBasis:i.universe.normalizationBasis,unit:i.universe.unit,analyticalDate:i.universe.analyticalDate,monetaryMethod:i.universe.monetaryMethod}:null,
   populations:i.populations.map(p=>({key:p.key,geography:{id:p.geography.id,level:p.geography.level,label:p.geography.label},propertyType:{id:p.propertyType.id,label:p.propertyType.label},propertyArea:p.propertyArea,constructionArea:p.constructionArea,constructionLand:p.constructionLand,characteristics:p.characteristics.map(t=>({id:t.id,type:t.type,label:t.label})),n:p.n,representedN:p.representedN,subjectIncluded:p.subjectIncluded})),
   metrics:i.metrics.map(m=>({key:m.key,value:m.value,unit:m.unit,state:m.state,reason:m.reason})),
   groups:i.groups.map(g=>({key:g.key,label:g.label,n:g.n,subjectIncluded:g.subjectIncluded,coordinate:g.coordinate,rank:g.rank,distribution:{minimum:g.distribution.minimum,p10:g.distribution.p10,p25:g.distribution.p25,median:g.distribution.median,p75:g.distribution.p75,p90:g.distribution.p90,maximum:g.distribution.maximum,iqr:g.distribution.iqr},difference:g.difference,percentDifference:g.percentDifference,percentageReference:g.percentageReference}))
  }))}
}
