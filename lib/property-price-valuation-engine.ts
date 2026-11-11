import 'server-only'
import {authorizeLegacyPropertyValuationExecution,PriceMeterComparableAuthenticationError,PriceMeterComparableAuthorizationError} from './price-meter-authorization'
import {validateValuationQuestion,InvalidValuationQuestion} from './property-price-valuation-question'
import {establishSubject,establishStructuralQuestion,acquireStructuralPeers,acquirePeerMoney,ValuationSubjectUnavailable,IncompleteValuationEvidence,InsufficientValuationEvidence} from './property-price-valuation-data'
import {resolveListingOriginalMonetaryValue} from './listing-monetary-value'
import {normalizeAmountToCrc} from './currency-conversion'
import {getHistoricalUsdToCrcRate} from './fx/fx-service'
import {getCurrentAnalyticalDate} from './analysis-date'
import {buildNumericalDistribution} from './numerical-distribution'
import {calculatePropertyPositionCounts,calculatePropertyPositionDifference,classifyPropertyPositionInterval,calculatePropertyPositionTail} from './price-meter-property-position-math'
import { PRICE_METER_CONSTRUCTION_LAND_COHORTS } from './price-meter-construction-land-cohorts'
import {VALUATION_ENGINE,type Response,type Result} from './property-price-valuation-contract'

export async function executePropertyPriceValuation(input:unknown):Promise<Response>{
 try {
  // Gate precedes subject, dictionary, peer, monetary and FX acquisition.
  const userId=await authorizeLegacyPropertyValuationExecution()
  const q=validateValuationQuestion(input)
  const subject=await establishSubject(q,userId)
  const {base,dimensions}=establishStructuralQuestion(q,subject)
  const {peers,trail}=await acquireStructuralPeers(subject,base,dimensions)
  const rows=await acquirePeerMoney(peers.map(p=>p.id),subject.row.transaction)
  if(new Set(peers.map(p=>p.id)).size!==peers.length||rows.length!==peers.length||peers.some(p=>p.id===subject.listingId))throw Error('Population integrity')
  const peerTitles=new Map(rows.map(row=>[row.id,typeof row.title==='string'?row.title:row.id]))
  const exclusions={missingAmount:0,invalidAmount:0,unsupportedCurrency:0}
  const monetary=new Map<string,NonNullable<ReturnType<typeof resolveListingOriginalMonetaryValue>>>()
  for(const row of rows){
   const raw=subject.row.transaction==='sale'?row.current_price:row.monthly_price
   if(raw===null||raw===undefined){exclusions.missingAmount++;continue}
   if(row.currency!=='CRC'&&row.currency!=='USD'){exclusions.unsupportedCurrency++;continue}
   const m=resolveListingOriginalMonetaryValue(row)
   if(!m){exclusions.invalidAmount++;continue}monetary.set(row.id,m)
  }
  const subjectMoney=resolveListingOriginalMonetaryValue(subject.money)
  const analyticalDate=getCurrentAnalyticalDate();let fx:Result['fx']=null
  if(subjectMoney?.currency==='USD'||[...monetary.values()].some(m=>m.currency==='USD')){
   const r=await getHistoricalUsdToCrcRate(analyticalDate)
   if(r.analyticalDate!==analyticalDate||r.baseCurrency!=='USD'||r.quoteCurrency!=='CRC'||r.source!=='BCCR'||r.rateType!=='reference_sale'||!Number.isFinite(r.rate)||r.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.effectiveDate)||r.effectiveDate>analyticalDate||!['exact','latest_applicable_prior_observation'].includes(r.resolutionMode)||(r.resolutionMode==='exact'?r.effectiveDate!==analyticalDate:r.effectiveDate>=analyticalDate))throw Error('Incoherent FX')
   fx={rate:r.rate,effectiveDate:r.effectiveDate,analyticalDate:r.analyticalDate,source:'BCCR',rateType:'reference_sale',resolutionMode:r.resolutionMode}
  }
  const normalize=(m:NonNullable<typeof subjectMoney>)=>{const n=normalizeAmountToCrc({amount:m.amount,currency:m.currency,usdToCrcRate:fx?.rate??1});if(!Number.isFinite(n)||n<=0)throw Error('Invalid normalized price');return n}
  const amounts=new Map([...monetary].map(([id,m])=>[id,normalize(m)])),values=[...amounts.values()]
  const askingPriceCrc=subjectMoney?normalize(subjectMoney):null
  const stats=buildNumericalDistribution(values)
  if(stats.sampleSize!==values.length||Object.values(stats).some(v=>v!==null&&!Number.isFinite(v))||values.length+Object.values(exclusions).reduce((a,b)=>a+b,0)!==peers.length)throw Error('Invalid aggregate')
  let position:Result['position']=null
  if(values.length&&askingPriceCrc!==null){
   const interval=classifyPropertyPositionInterval(askingPriceCrc,stats),tail=calculatePropertyPositionTail(askingPriceCrc,stats,interval)
   position={...calculatePropertyPositionCounts(askingPriceCrc,values,values.length),...calculatePropertyPositionDifference(askingPriceCrc,stats.median),interval,tail:tail?{thresholdPercentile:tail.thresholdPercentile,thresholdPrice:tail.thresholdPricePerM2,differenceFromThreshold:tail.differenceFromThreshold,percentDifferenceFromThreshold:tail.percentDifferenceFromThreshold}:null}
  }
  const pt=subject.row.characteristics.find(c=>c.termType==='property_type')!,g=base.geography
  // Allowlisted browser projection; no raw canonical evidence or execution authority escapes.
  const result:Result={engine:VALUATION_ENGINE,schemaVersion:1,
   questionIdentity:JSON.stringify({engine:VALUATION_ENGINE,question:q,subject:subject.listingId??q.subject,transaction:base.transactionType,propertyBasis:base.propertyBasis,geographyId:g.id,propertyTypeId:pt.ontologyTermId,propertyAreaRange:base.propertyAreaRange,constructionAreaRange:base.constructionAreaRange,dimensions:dimensions.map(d=>({dimension:d.dimension,termId:d.characteristic?.ontologyTermId??null,cohort:d.constructionLandCohortKey}))}),
   subject:{kind:subject.kind,listingId:subject.listingId,title:subject.kind==='listing'?subject.row.title:'',propertyArea:subject.row.propertyArea!,constructionArea:subject.row.constructionArea,askingPriceCrc,originalPrice:subjectMoney?.amount??null,currency:subjectMoney?.currency??null},
   population:{transaction:subject.row.transaction,propertyBasis:base.propertyBasis as 'land_only'|'improved_property',normalization:q.normalization,geography:{en:g.term_name_en||g.term_name,es:g.term_name_es||g.term_name},geographyLevel:q.geographyLevel,propertyType:{en:pt.termNameEn||pt.termName,es:pt.termNameEs||pt.termName},propertyAreaRange:base.propertyAreaRange,constructionAreaRange:base.constructionAreaRange,subjectExcluded:true,constraints:dimensions.map(d=>({dimension:d.dimension,label:d.characteristic?{en:d.characteristic.termNameEn||d.characteristic.termName,es:d.characteristic.termNameEs||d.characteristic.termName}:{en:PRICE_METER_CONSTRUCTION_LAND_COHORTS.find(c=>c.key===d.constructionLandCohortKey)!.label,es:PRICE_METER_CONSTRUCTION_LAND_COHORTS.find(c=>c.key===d.constructionLandCohortKey)!.label}}))},
   structuralComparablePopulationN:peers.length,totalPricePopulationN:values.length,exclusions,trail,
   outcome:!peers.length?'no_structural_peers':!values.length?'no_eligible_prices':askingPriceCrc===null?'distribution_only':'complete',
   statistics:{minimum:stats.minimum,p10:stats.p10,p25:stats.p25,median:stats.median,average:stats.average,p75:stats.p75,p90:stats.p90,maximum:stats.maximum,iqr:stats.iqr},position,
   peers:peers.map(p=>({id:p.id,title:peerTitles.get(p.id)!,transaction:p.transaction,propertyArea:p.propertyArea!,constructionArea:p.constructionArea,priceCrc:amounts.get(p.id)??null,originalPrice:monetary.get(p.id)?.amount??null,currency:monetary.get(p.id)?.currency??null})),
   currency:'CRC',unit:subject.row.transaction==='sale'?'total_asking_price':'monthly_asking_price',analyticalDate,fx,methodology:'linear_interpolation_n_minus_1_p',completeness:{complete:true,snapshotGuaranteed:false}}
  return {ok:true,result}
 }catch(e){return {ok:false,code:e instanceof PriceMeterComparableAuthenticationError?'authentication_required':e instanceof PriceMeterComparableAuthorizationError?'entitlement_required':e instanceof InvalidValuationQuestion?'invalid_question':e instanceof ValuationSubjectUnavailable?'subject_unavailable':e instanceof InsufficientValuationEvidence?'insufficient_evidence':e instanceof IncompleteValuationEvidence?'incomplete_evidence':'execution_failed'}}
}
