import 'server-only'
import { ENGINE, type Response, type Result, type Fx } from './asking-price-contract'
import { validateQuestion, InvalidQuestion } from './asking-price-question'
import { resolveReferences, acquireMarketIds, constrainMarket, acquireMoney } from './asking-price-data'
import { resolveListingOriginalMonetaryValue } from './listing-monetary-value'
import { normalizeAmountToCrc } from './currency-conversion'
import { getHistoricalUsdToCrcRate } from './fx/fx-service'
import { getCurrentAnalyticalDate } from './analysis-date'
import { buildNumericalDistribution } from './numerical-distribution'
// Engine-specific public capability. No identity/entitlement is accepted from the browser.
function authorizePublicExecution(){return Object.freeze({engine:ENGINE,allowed:true as const})}
function project(result:Result):Result {
 const s=result.statistics
 return {schemaVersion:1,engine:ENGINE,question:result.question,questionIdentity:result.questionIdentity,labels:result.labels,outcome:result.outcome,
 marketPopulation:result.marketPopulation,askingPricePopulation:result.askingPricePopulation,
 exclusions:{missingAmount:result.exclusions.missingAmount,invalidAmount:result.exclusions.invalidAmount,unsupportedCurrency:result.exclusions.unsupportedCurrency},
 currency:'CRC',unit:result.unit,analyticalDate:result.analyticalDate,fx:result.fx?{baseCurrency:'USD',quoteCurrency:'CRC',rate:result.fx.rate,rateType:'reference_sale',source:'BCCR',analyticalDate:result.fx.analyticalDate,effectiveDate:result.fx.effectiveDate,resolutionMode:result.fx.resolutionMode}:null,
 methodology:'linear_interpolation_n_minus_1_p',statistics:{minimum:s.minimum,p10:s.p10,p25:s.p25,median:s.median,average:s.average,p75:s.p75,p90:s.p90,maximum:s.maximum,iqr:s.iqr},completeness:{complete:true,snapshotGuaranteed:false}}
}
export async function executeAskingPrice(input:unknown):Promise<Response>{
 try{
  const capability=authorizePublicExecution();if(!capability.allowed)throw Error()
  let q;try{q=validateQuestion(input)}catch{throw new InvalidQuestion()}
  const {geoId,labels}=await resolveReferences(q)
  const ids=await constrainMarket(q,await acquireMarketIds(q,geoId))
  const rows=await acquireMoney(q,ids),exclusions={missingAmount:0,invalidAmount:0,unsupportedCurrency:0}
  const monetary=[]
  for(const row of rows){const raw=q.transaction==='sale'?row.current_price:row.monthly_price
   if(raw===null||raw===undefined){exclusions.missingAmount++;continue}
   if(row.currency!=='CRC'&&row.currency!=='USD'){exclusions.unsupportedCurrency++;continue}
   const value=resolveListingOriginalMonetaryValue(row);if(!value){exclusions.invalidAmount++;continue}monetary.push(value)
  }
  const analyticalDate=getCurrentAnalyticalDate();let fx:Fx|null=null
  if(monetary.some(m=>m.currency==='USD')){const r=await getHistoricalUsdToCrcRate(analyticalDate)
   if(r.analyticalDate!==analyticalDate||r.baseCurrency!=='USD'||r.quoteCurrency!=='CRC'||r.source!=='BCCR'||r.rateType!=='reference_sale'||!Number.isFinite(r.rate)||r.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.effectiveDate)||r.effectiveDate>analyticalDate||!['exact','latest_applicable_prior_observation'].includes(r.resolutionMode)||(r.resolutionMode==='exact'?r.effectiveDate!==analyticalDate:r.effectiveDate>=analyticalDate))throw Error('Incoherent FX')
   fx=r
  }
  const values=monetary.map(m=>normalizeAmountToCrc({amount:m.amount,currency:m.currency,usdToCrcRate:fx?.rate??1}))
  if(values.some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid normalization')
  const distribution=buildNumericalDistribution(values)
  if(distribution.sampleSize!==values.length||Object.values(distribution).some(v=>v!==null&&!Number.isFinite(v)))throw Error('Invalid aggregate')
  return {ok:true,result:project({schemaVersion:1,engine:ENGINE,question:q,questionIdentity:JSON.stringify(q),labels,outcome:!ids.length?'empty_market':!values.length?'no_eligible_prices':'complete',marketPopulation:ids.length,askingPricePopulation:values.length,exclusions,currency:'CRC',unit:q.transaction==='sale'?'total_asking_price':'monthly_asking_price',analyticalDate,fx,methodology:'linear_interpolation_n_minus_1_p',statistics:distribution,completeness:{complete:true,snapshotGuaranteed:false}})}
 }catch(e){return {ok:false,code:e instanceof InvalidQuestion?'invalid_question':'execution_failed'}}
}
