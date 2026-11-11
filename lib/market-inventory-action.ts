'use server'
import { PackageCapabilityDenied } from './package-capability-authorization'
import { getMarketSummary,getMarketComposition } from './market-inventory-engine'
import { getMarketMatches } from './market-matching-engine'
import { getMarketScarcity } from './market-scarcity-engine'
import { getMarketComparison } from './market-comparison-engine'
import { PRICE_METER_APPLY_FILTER_KEYS } from './price-meter-apply-contract'
export async function executeMarketQuestion(engine:unknown,input:unknown,language:'en'|'es'){
 if(!['summary','composition','matching','configuration','comparison'].includes(String(engine))||!['en','es'].includes(language)||!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid market command.')
 const keys=engine==='comparison'?['a_','b_'].flatMap(p=>[...PRICE_METER_APPLY_FILTER_KEYS,'price_range'].map(k=>p+k)):[...PRICE_METER_APPLY_FILTER_KEYS]
 const supplied=input as Record<string,unknown>
 if(engine!=='comparison'&&supplied.population!==undefined&&supplied.population!==(supplied.transaction_type==='sale'?'SALE':supplied.transaction_type==='rent'?'RENT':null))throw Error('Conflicting ordinary analytical universe.')
 const filters:Record<string,string|undefined>={}
 if(engine==='comparison'&&(input as Record<string,unknown>).population!==undefined){const p=(input as Record<string,unknown>).population;const t=(input as Record<string,unknown>).a_transaction_type;if(p!==(t==='sale'?'SALE':t==='rent'?'RENT':null))throw Error('Conflicting comparison universe.')} 
 for(const key of keys){const value=(input as Record<string,unknown>)[key];if(value===undefined||value==='')continue;if(typeof value!=='string'||value.length>4096)throw Error('Invalid market filter.');filters[key]=value}
 try{
 switch(engine){
  case 'summary':return await getMarketSummary(filters)
  case 'composition':return await getMarketComposition(filters)
  case 'matching':return await getMarketMatches(filters,language)
  case 'configuration':return await getMarketScarcity(filters,language)
  case 'comparison':return await getMarketComparison(filters,filters,language)
  default:throw Error('Invalid market command.')
 }
 }catch(error){
  // Expected access denials are an explicit outcome, never analytical data.
  if(error instanceof PackageCapabilityDenied)return {access:'entitlement_required' as const}
  throw error
 }
}
