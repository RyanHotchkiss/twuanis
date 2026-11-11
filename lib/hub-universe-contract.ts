import {analyticalUniverse,type AnalyticalUniverse} from './analytical-universe'
export const universeLabels={en:{SALE:'Sale',RENT:'Rent / Lease',BANK:'Bank / Remates'},es:{SALE:'Venta',RENT:'Alquiler / Arrendamiento',BANK:'Bancos / Remates'}}
export function hubUniverse(params:URLSearchParams):AnalyticalUniverse|null{
 const raw=params.get('population'),explicit=params.get('transaction_type')
 const nested:string[]=[]
 for(const key of ['weighted_request','ratio_request','discovery_request']){const serialized=params.get(key);if(!serialized)continue;try{const q=JSON.parse(serialized),v=q.transaction??q.cohort?.transaction??q.request?.question?.transaction;if(v)nested.push(v)}catch{return null}}
 if(nested.some(t=>!['sale','rent'].includes(t))||new Set(nested).size>1||explicit&&nested.some(t=>t!==explicit))return null
 const transaction=explicit??nested[0]??null
 if(raw!==null){try{const p=analyticalUniverse(raw);if(transaction&&transaction!==(p==='SALE'?'sale':p==='RENT'?'rent':'bank'))return null;return p}catch{return null}}
 if(transaction&&transaction!=='sale'&&transaction!=='rent')return null
 const a=params.get('a_transaction_type'),b=params.get('b_transaction_type');if([a,b].some(t=>t!==null&&!['sale','rent'].includes(t))||a&&b&&a!==b||transaction&&[a,b].some(t=>t&&t!==transaction))return null
 return transaction==='rent'||!transaction&&a==='rent'?'RENT':'SALE'
}
export function hubUniverseUrl(base:string,query:string,population:AnalyticalUniverse){
 analyticalUniverse(population)
 const old=new URLSearchParams(query),next=new URLSearchParams()
 for(const key of ['tab','analysis_question'])if(old.get(key))next.set(key,old.get(key)!)
 next.set('population',population);next.set('transaction_type',population==='SALE'?'sale':population==='RENT'?'rent':'bank')
 if(population!=='BANK'){next.set('a_transaction_type',population==='SALE'?'sale':'rent');next.set('b_transaction_type',population==='SALE'?'sale':'rent')}
 return `${base}?${next}`
}
export function savedEngine(engine:string,normalization?:string):{engineType:'explorer'|'matching'|'comparison'|'scarcity'|'price-meter';question:string}{
 if(engine==='summary'||engine==='composition')return {engineType:'explorer',question:engine}
 if(engine==='matching'||engine==='comparison')return {engineType:engine,question:engine}
 if(engine==='configuration')return {engineType:'scarcity',question:engine}
 if(['market-asking-price-distribution','distribution','geography','size','construction-land','cohort-comparison','cross-dimensional','discovery','position','comparables','asking-area-ratio','weighted-price'].includes(engine))return {engineType:'price-meter',question:engine==='size'?(normalization==='construction'?'construction-area':'property-area'):engine}
 throw Error('Unsupported saved algorithm.')
}

export function bankListingHref(id:string,language:'en'|'es'){const value=id.startsWith('BANK:')?id.slice(5):id;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))return '#';return `${language==='es'?'/es/remates':'/en/bank-properties'}/${value}`}
