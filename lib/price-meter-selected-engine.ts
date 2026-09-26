import 'server-only'
import {consumePriceMeterApplyPermit,type PriceMeterApplyPermit} from './price-meter-apply-permit'
import {validateSelectedPriceMeterEngines} from './price-meter-selected-contract'
import {loadPriceMeterObservations,type PriceMeterMarketFilters} from './price-meter-observation-loader'
import {buildPriceMeterTransactionCohorts} from './price-meter-transaction-cohort'
import {buildPriceMeterAnalyticalCohort} from './price-meter-analytical-cohort'
import {buildPriceMeterDistribution} from './price-meter-distribution'
import {buildPriceMeterGeographicDistributions} from './price-meter-geographic-distribution'
import {buildPriceMeterGeographicStatistics} from './price-meter-geographic-statistics'
import {buildPriceMeterGeographicConclusions} from './price-meter-geographic-conclusions'
import {resolvePriceMeterGeographicScope} from './price-meter-geographic-scope'
import {buildPriceMeterSizeRelationshipPopulation} from './price-meter-size-relationship-population'
import {buildPriceMeterSizeRelationshipResult} from './price-meter-size-relationship-math'
import {buildPriceMeterConstructionLandAnalysis} from './price-meter-construction-land-analysis'

export async function getSelectedPriceMeterAnalysis(filters:PriceMeterMarketFilters,language:'en'|'es',permit:PriceMeterApplyPermit,selected:unknown){
 const engines=validateSelectedPriceMeterEngines(selected)
 consumePriceMeterApplyPermit(permit,filters,language)
 if(filters.transaction_type!=='sale'&&filters.transaction_type!=='rent')throw Error('Explicit transaction required.')
 const transaction=filters.transaction_type
 // One acquisition/normalization is shared only inside this committed request.
 const {analyticalDate,observations,listings}=await loadPriceMeterObservations(filters)
 const transactionCohort=buildPriceMeterTransactionCohorts(observations)[transaction]
 const geographicScope=resolvePriceMeterGeographicScope({province:filters.province,canton:filters.canton,district:filters.district})
 const definitions={vacantLandLandNormalized:['land_only','land'],improvedLandNormalized:['improved_property','land'],improvedConstructionNormalized:['improved_property','construction']}as const
 type Key=keyof typeof definitions
 const cohorts=new Map<Key,ReturnType<typeof buildPriceMeterAnalyticalCohort>>()
 const cohort=(key:Key)=>{let value=cohorts.get(key);if(!value){const [propertyBasis,normalizationBasis]=definitions[key];value=buildPriceMeterAnalyticalCohort({transactionCohort,propertyBasis,normalizationBasis});cohorts.set(key,value)}return value}
 const distributions=new Map<Key,ReturnType<typeof buildPriceMeterDistribution>>()
 const distribution=(key:Key)=>{let value=distributions.get(key);if(!value){value=buildPriceMeterDistribution(cohort(key));distributions.set(key,value)}return value}
 const intelligence:any={distributions:{},geographicStatistics:{},geographicConclusions:{},sizeRelationships:{},constructionToLand:null}
 if(engines.includes('distribution'))for(const key of Object.keys(definitions)as Key[])intelligence.distributions[key]=distribution(key)
 if(engines.includes('geography'))for(const key of Object.keys(definitions)as Key[]){
  const geo=buildPriceMeterGeographicDistributions({observations:cohort(key).observations,transactionType:transaction})
  const statistics=geographicScope.comparisonLevel?buildPriceMeterGeographicStatistics({selectedMarketDistribution:distribution(key),geographicDistributions:geo[geographicScope.comparisonLevel],comparisonLevel:geographicScope.comparisonLevel}):[]
  intelligence.geographicStatistics[key]=statistics
  intelligence.geographicConclusions[key]=buildPriceMeterGeographicConclusions({statistics,scope:geographicScope,language})
 }
 for(const [engine,key,kind,output]of [
  ['property-area','improvedLandNormalized','property_area_to_land_normalized_ratio','propertyArea'],
  ['construction-area','improvedConstructionNormalized','construction_area_to_construction_normalized_ratio','constructionArea'],
 ]as const)if(engines.includes(engine)){
  const population=buildPriceMeterSizeRelationshipPopulation({cohort:cohort(key),relationshipKind:kind})
  const result=buildPriceMeterSizeRelationshipResult({coordinates:population.coordinates,representedObservationCount:population.representedObservationCount})
  intelligence.sizeRelationships[output]={population,result}
 }
 if(engines.includes('construction-land')){
  const analysis=buildPriceMeterConstructionLandAnalysis({transactionType:transaction,analyticalIdentities:listings.map(l=>l.analyticalIdentity)})
  const fxObservations = Array.from(new Map(analysis.identities.flatMap(identity => {
   const fx = identity.price.fx
   if (!fx || !fx.conversionApplied) return []
   const key = [fx.baseCurrency, fx.quoteCurrency, fx.rateType, fx.effectiveDate, fx.source, fx.rate].join('|')
   return [[key, {baseCurrency:'USD',quoteCurrency:'CRC',rate:fx.rate,rateType:'reference_sale',effectiveDate:fx.effectiveDate,source:'BCCR'}] as const]
  })).values())
  intelligence.constructionToLand={identity:{transactionType:transaction,propertyBasis:'improved_property',geography:{province:filters.province??null,canton:filters.canton??null,district:filters.district??null},
    monetary:{analyticalDate,analyticalCurrency:'CRC',fxObservations}},
    // Explicit browser projection: raw identities and working populations stay server-side.
    analysis:{transactionType:analysis.transactionType,distribution:analysis.distribution,statistics:analysis.statistics,relationships:analysis.relationships,representedObservationCount:analysis.representedObservationCount}}
 }
 return {selectedEngines:engines,analyticalDate,geographicScope,[transaction==='sale'?'saleIntelligence':'rentIntelligence']:intelligence}
}
