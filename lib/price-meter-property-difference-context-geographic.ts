import 'server-only'
import { resolvePriceMeterGeographicScope } from './price-meter-geographic-scope'
import { buildPriceMeterGeographicDistributions } from './price-meter-geographic-distribution'
import { buildPriceMeterGeographicStatistics } from './price-meter-geographic-statistics'
import { contextBase,distribution,type EstablishedExecution } from './price-meter-property-difference-context-adapter'
export function geographicContext(e:EstablishedExecution,index:number) {
 const item=contextBase(e,'geographic_children',index,7),r=e.result.reference
 const scope=resolvePriceMeterGeographicScope({[r.geographyLevel]:r.geography.id})
 if(!scope.comparisonLevel){item.state='not_applicable';item.reason='district_has_no_child_level';return item}
 const level=scope.comparisonLevel
 const groups=buildPriceMeterGeographicDistributions({observations:e.working.observations,transactionType:r.transactionType})[level]
 const statistics=buildPriceMeterGeographicStatistics({selectedMarketDistribution:e.working.distribution,geographicDistributions:groups,comparisonLevel:level})
 item.privateEvidence=statistics
 item.populations[0].representedN=statistics.reduce((n,s)=>n+s.distribution.sampleSize,0)
 item.groups=statistics.map(s=>{
  const g=s.geography[level]!,subjectIncluded=String(e.result.subject.geography[level]?.id)===String(g.id)
  item.populations.push({...item.populations[0],key:String(g.id),geography:{id:String(g.id),level,label:g.term_name},n:s.distribution.sampleSize,representedN:s.distribution.sampleSize,subjectIncluded})
  return {key:String(g.id),label:g.term_name,n:s.distribution.sampleSize,subjectIncluded,coordinate:null,rank:s.rank,distribution:distribution(s.distribution),difference:s.medianDifferenceFromSelectedMarket,percentDifference:s.medianPercentAboveOrBelowSelectedMarket,percentageReference:'selected_market_median'}
 })
 if(!statistics.length){item.state='not_established';item.reason='no_child_observations'}
 return item
}
