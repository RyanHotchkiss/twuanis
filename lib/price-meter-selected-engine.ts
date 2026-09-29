import 'server-only'
import {validateGeographicCommand,validateGeographicApply} from './price-meter-geographic-command'
import {consumePriceMeterApplyPermit,type PriceMeterApplyPermit} from './price-meter-apply-permit'
import {validateSelectedPriceMeterEngines,validateDistributionIdentity} from './price-meter-selected-contract'
import {loadPriceMeterObservations,type PriceMeterMarketFilters} from './price-meter-observation-loader'
import {buildPriceMeterTransactionCohorts} from './price-meter-transaction-cohort'
import {buildPriceMeterAnalyticalCohort} from './price-meter-analytical-cohort'
import {buildPriceMeterDistribution} from './price-meter-distribution'
import {buildPriceMeterGeographicLevel} from './price-meter-geographic-distribution'
import {buildPriceMeterGeographicStatistics} from './price-meter-geographic-statistics'
import {buildPriceMeterGeographicConclusions} from './price-meter-geographic-conclusions'
import {resolvePriceMeterGeographicScope} from './price-meter-geographic-scope'
import {buildPriceMeterSizeRelationshipPopulation} from './price-meter-size-relationship-population'
import {buildPriceMeterDescriptiveSizeRelationshipResult as buildPriceMeterSizeRelationshipResult} from './price-meter-size-relationship-math'
import {getPriceMeterSizeRelationshipDefinition} from './price-meter-size-relationship'
import {buildSelectedConstructionLand} from './price-meter-construction-land-selected'
import {validateConstructionLandNormalization} from './price-meter-construction-land-command'

export async function getSelectedPriceMeterAnalysis(filters:PriceMeterMarketFilters,language:'en'|'es',permit:PriceMeterApplyPermit,selected:unknown,distributionIdentity?:unknown,geographicCommand?:unknown,constructionLandNormalization?:unknown){
 const engines=validateSelectedPriceMeterEngines(selected)
 const clMode=engines.includes('construction-land')
 const clNormalization=clMode?validateConstructionLandNormalization(constructionLandNormalization):undefined
 if(clMode&&(engines.length!==1||distributionIdentity!==undefined||geographicCommand!==undefined))throw Error('Select one Construction-to-Land question.')
 if(!clMode&&constructionLandNormalization!==undefined)throw Error('Unexpected Construction-to-Land identity.')
 const clDefinition=clNormalization?{propertyBasis:'improved_property' as const,normalizationBasis:clNormalization}:undefined
 const sizeMode=engines.find(e=>e==='property-area'||e==='construction-area')
 if(sizeMode&&(engines.length!==1||distributionIdentity!==undefined||geographicCommand!==undefined))throw Error('Select one server-defined size relationship.')
 const sizeKind=sizeMode==='property-area'?'property_area_to_land_normalized_ratio':'construction_area_to_construction_normalized_ratio'
 const sizeDefinition=sizeMode?{propertyBasis:'improved_property' as const,normalizationBasis:getPriceMeterSizeRelationshipDefinition(sizeKind).normalizationBasis}:undefined
 const requested=engines.includes('distribution')?validateDistributionIdentity(distributionIdentity):null
 const geography=engines.includes('geography')?validateGeographicCommand(geographicCommand):undefined
 if(geography){if(engines.length!==1)throw Error('Geographic comparison requires one explicit question.');validateGeographicApply(filters,geography)}
 consumePriceMeterApplyPermit(permit,filters,language,geography)
 if(filters.transaction_type!=='sale'&&filters.transaction_type!=='rent')throw Error('Explicit transaction required.')
 const transaction=filters.transaction_type
 // One acquisition/normalization is shared only inside this committed request.
 const {analyticalDate,observations,listings,fxIdentity}=await loadPriceMeterObservations(filters,clDefinition??sizeDefinition??geography?.definition??(engines.length===1&&requested?requested:undefined))
 const transactionCohort=buildPriceMeterTransactionCohorts(observations)[transaction]
 const geographicScope=resolvePriceMeterGeographicScope({province:filters.province,canton:filters.canton,district:filters.district})
 const definitions={vacantLandLandNormalized:['land_only','land'],improvedLandNormalized:['improved_property','land'],improvedConstructionNormalized:['improved_property','construction']}as const
 type Key=keyof typeof definitions
 const cohorts=new Map<Key,ReturnType<typeof buildPriceMeterAnalyticalCohort>>()
 const cohort=(key:Key)=>{let value=cohorts.get(key);if(!value){const [propertyBasis,normalizationBasis]=definitions[key];value=buildPriceMeterAnalyticalCohort({transactionCohort,propertyBasis,normalizationBasis});cohorts.set(key,value)}return value}
 const distributions=new Map<Key,ReturnType<typeof buildPriceMeterDistribution>>()
 const distribution=(key:Key)=>{let value=distributions.get(key);if(!value){value=buildPriceMeterDistribution(cohort(key));distributions.set(key,value)}return value}
 const intelligence:any={distributions:{},geographicStatistics:{},geographicConclusions:{},sizeRelationships:{},constructionToLand:null}
 if(requested){
  const key:Key=requested.propertyBasis==='land_only'?'vacantLandLandNormalized':requested.normalizationBasis==='land'?'improvedLandNormalized':'improvedConstructionNormalized'
  intelligence.distributions[key]=distribution(key)
 }

 let geographicResult: any
 if(geography){
  const {propertyBasis,normalizationBasis}=geography.definition
  const key:Key=propertyBasis==='land_only'?'vacantLandLandNormalized':normalizationBasis==='land'?'improvedLandNormalized':'improvedConstructionNormalized'
  const reference=distribution(key)
  const geo=buildPriceMeterGeographicLevel({observations:cohort(key).observations,transactionType:transaction,level:geography.comparisonLevel})
  const statistics=buildPriceMeterGeographicStatistics({selectedMarketDistribution:reference,geographicDistributions:geo,comparisonLevel:geography.comparisonLevel})
  const term=(t:any)=>t?{id:String(t.id),label:language==='es'?(t.term_name_es??t.term_name):(t.term_name_en??t.term_name)}:null
  // Explicit aggregate projection; no observations, listing IDs or working cohorts.
  geographicResult={...geography,explanation:buildPriceMeterGeographicConclusions({statistics,scope:geographicScope,language}).explanation,transactionType:transaction,analyticalCurrency:'CRC',analyticalDate,marketListingCount:listings.length,
   boundary:{province:filters.province??null,canton:filters.canton??null},
   fx:fxIdentity?{baseCurrency:fxIdentity.baseCurrency,quoteCurrency:fxIdentity.quoteCurrency,rate:fxIdentity.rate,rateType:fxIdentity.rateType,effectiveDate:fxIdentity.effectiveDate,source:fxIdentity.source,resolutionMode:fxIdentity.resolutionMode}:null,
   reference:{median:reference.median,n:reference.sampleSize},
   rows:statistics.map(s=>({geography:term(s.geography[s.level]),rank:s.rank,n:s.distribution.sampleSize,median:s.distribution.median,difference:s.medianDifferenceFromSelectedMarket,percentDifference:s.medianPercentAboveOrBelowSelectedMarket}))}
 }

 if(sizeMode&&sizeDefinition){
  const key=sizeDefinition.normalizationBasis==='land'?'improvedLandNormalized':'improvedConstructionNormalized'
  const population=buildPriceMeterSizeRelationshipPopulation({cohort:cohort(key),relationshipKind:sizeKind})
  const result=buildPriceMeterSizeRelationshipResult({coordinates:population.coordinates,representedObservationCount:population.representedObservationCount})
  intelligence.sizeRelationships[sizeMode==='property-area'?'propertyArea':'constructionArea']={population,result}
 }
 const constructionLandResult=clDefinition?{
  ...buildSelectedConstructionLand(listings.map(l=>l.analyticalIdentity),transaction,clNormalization),
  context:{...clDefinition,transactionType:transaction,analyticalCurrency:'CRC' as const,analyticalDate,marketListingCount:listings.length,fx:fxIdentity?{rate:fxIdentity.rate,source:fxIdentity.source,effectiveDate:fxIdentity.effectiveDate,rateType:fxIdentity.rateType,resolutionMode:fxIdentity.resolutionMode}:null}
 }:undefined
 const sizeContext=sizeMode&&sizeDefinition?{mode:sizeMode,...sizeDefinition,transactionType:transaction,analyticalCurrency:'CRC' as const,analyticalDate,marketListingCount:listings.length,fx:fxIdentity?{rate:fxIdentity.rate,source:fxIdentity.source,effectiveDate:fxIdentity.effectiveDate,rateType:fxIdentity.rateType,resolutionMode:fxIdentity.resolutionMode}:null}:undefined
 return {constructionLandResult,sizeContext,geographicResult,selectedEngines:engines,analyticalDate,geographicScope,...(requested?{distributionContext:{...requested,transactionType:transaction,analyticalCurrency:'CRC' as const,analyticalDate,marketListingCount:listings.length,fx:fxIdentity?{baseCurrency:fxIdentity.baseCurrency,quoteCurrency:fxIdentity.quoteCurrency,rate:fxIdentity.rate,rateType:fxIdentity.rateType,effectiveDate:fxIdentity.effectiveDate,source:fxIdentity.source,resolutionMode:fxIdentity.resolutionMode}:null}}:{}),...(transaction==='sale'?{saleIntelligence:intelligence}:{rentIntelligence:intelligence})}
}
