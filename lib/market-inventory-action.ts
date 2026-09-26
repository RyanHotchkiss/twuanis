'use server'
import { getMarketSummary,getMarketComposition } from './market-inventory-engine'
import { getMarketMatches } from './market-matching-engine'
import { getMarketScarcity } from './market-scarcity-engine'
import { getMarketComparison } from './market-comparison-engine'
import { PRICE_METER_APPLY_FILTER_KEYS } from './price-meter-apply-contract'
export async function executeMarketQuestion(engine:unknown,input:unknown,language:'en'|'es'){
 if(!['summary','composition','matching','configuration','comparison'].includes(String(engine))||!['en','es'].includes(language)||!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid market command.')
 const keys=engine==='comparison'?['a_','b_'].flatMap(p=>[...PRICE_METER_APPLY_FILTER_KEYS,'price_range'].map(k=>p+k)):[...PRICE_METER_APPLY_FILTER_KEYS]
 const filters:Record<string,string|undefined>={}
 for(const key of keys){const value=(input as Record<string,unknown>)[key];if(value===undefined||value==='')continue;if(typeof value!=='string'||value.length>4096)throw Error('Invalid market filter.');filters[key]=value}
 switch(engine){
  case 'summary':return getMarketSummary(filters)
  case 'composition':return getMarketComposition(filters)
  case 'matching':return getMarketMatches(filters,language)
  case 'configuration':return getMarketScarcity(filters,language)
  case 'comparison':return getMarketComparison(filters,filters,language)
  default:throw Error('Invalid market command.')
 }
}
