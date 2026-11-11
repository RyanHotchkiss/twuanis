import {ordinaryUniverse,assertSameUniverse} from './analytical-universe'
import {savedEngine} from './hub-universe-contract'
export const BANK_SAVED_SCHEMA='bank-algorithm-result-v1'
export type BankCommitted={schema:typeof BANK_SAVED_SCHEMA;engine:string;language:'en'|'es';command:any;draft:Record<string,string|undefined>;labels:string[];output:any}
export function assertBankPresentation(engine:string,result:any){
 const count=(v:any)=>Number.isSafeInteger(v)&&v>=0
 const required:Record<string,()=>boolean>={
  summary:()=>count(result?.n)&&result.bankCount===result.n&&result.saleCount===0&&result.rentCount===0,
  composition:()=>count(result?.n)&&Array.isArray(result.dimensions),
  matching:()=>count(result?.totalListings)&&Array.isArray(result.listings),
  configuration:()=>count(result?.marketSize)&&count(result.matchingCount)&&result.matchingCount<=result.marketSize,
  comparison:()=>count(result?.sampleSize)&&!!result.metrics&&!!result.prevalence,
  'market-asking-price-distribution':()=>result?.ok===true&&count(result.result?.marketPopulation)&&count(result.result.askingPricePopulation)&&!!result.result.statistics,
  distribution:()=>!!result?.distributionContext&&!!(result.saleIntelligence??result.rentIntelligence)?.distributions,
  geography:()=>!!result?.geographicResult?.definition&&Array.isArray(result.geographicResult.rows),
  size:()=>!!result?.sizeContext&&!!(result.saleIntelligence??result.rentIntelligence)?.sizeRelationships,
  'construction-land':()=>!!result?.constructionLandResult?.context&&Array.isArray(result.constructionLandResult.cohorts),
  'cohort-comparison':()=>!!result?.request?.cohortA&&!!result.request.cohortB&&!!result.medianDifference&&!!result.evidence,
  'cross-dimensional':()=>result?.state==='complete'&&!!result.result?.evidence&&!!result.result.synthesis,
  discovery:()=>result?.analysis?.state==='complete'&&Array.isArray(result.analysis.results),
  position:()=>typeof result?.state==='string'&&(result.state!=='ok'||count(result.n)&&!!result.reference&&!!result.distribution),
  comparables:()=>!!result?.evidence&&!!result.presentation?.baseCohort,
  'asking-area-ratio':()=>!!result?.question&&['established','not_established'].includes(result.evidence?.state),
  'weighted-price':()=>!!result?.question&&['weighting_not_established','weighting_not_applicable','distribution_only','subject_position'].includes(result.evidence?.state)
 }
 if(!required[engine]?.())throw Error('Complete algorithm result is not established.')
}
export function assertBankCommitted(value:unknown):asserts value is BankCommitted{
 const v=value as BankCommitted
 if(!v||v.schema!==BANK_SAVED_SCHEMA||!['en','es'].includes(v.language)||!Array.isArray(v.labels)||v.labels.some(x=>typeof x!=='string')||!v.command||!v.output||v.output.population!=='BANK'||v.output.priceBasis!=='BANK_LISTED_SELLING_PRICE')throw Error('Invalid saved Bank result.')
 savedEngine(v.engine,(v.command.scope??v.command.left?.scope)?.areaBasis)
 const commands=v.engine==='comparison'?[v.command.left,v.command.right]:[v.command]
 const outputs=v.engine==='comparison'?[v.output.left,v.output.right]:[v.output]
 for(let i=0;i<commands.length;i++){const q=commands[i],r=outputs[i];if(!q||q.engine!==v.engine||q.language!==v.language||q.scope?.population!=='BANK'||q.scope?.transaction!=='bank'||!r||r.population!=='BANK'||r.engine!==v.engine||r.transaction!=='bank'||r.priceBasis!=='BANK_LISTED_SELLING_PRICE'||typeof r.questionIdentity!=='string'||!/^[0-9a-f]{64}$/.test(r.questionIdentity)||!r.result)throw Error('Conflicting saved Bank identity.');assertBankPresentation(v.engine,r.result)}
 if(!v.draft||Object.values(v.draft).some(x=>x!==undefined&&typeof x!=='string'))throw Error('Invalid saved draft.')
 const text=JSON.stringify(v)
 if(text.length>4000000||/"(?:immutableEvidence|sourceNamespace|recordKey|registryMeasurements|sourceEvidenceRevision|captureCapability)"\s*:/.test(text))throw Error('Protected evidence is not a saved browser result.')
}
export function normalizedSavedUniverse(engineType:string,filters:unknown,result?:unknown){
 const f=filters as Record<string,any>
 if(!f||typeof f!=='object'||Array.isArray(f))throw Error('Saved universe must be reselected.')
 if(f.population==='BANK'){
  assertBankCommitted(result)
  const mapped=savedEngine(result.engine,(result.command.scope??result.command.left?.scope).areaBasis)
  if(engineType!==mapped.engineType||f.analysis_question!==mapped.question||f.transaction_type!=='bank'||f.bank_schema!==BANK_SAVED_SCHEMA||JSON.stringify(f.bank_command)!==JSON.stringify(result.command))throw Error('Saved Bank command/result mismatch.')
  return {...f,population:'BANK' as const}
 }
 if(result&&typeof result==='object'&&((result as any).population==='BANK'||(result as any).schema===BANK_SAVED_SCHEMA))throw Error('Saved Bank result cannot be relabeled.')
 if(f.population!==undefined&&!['SALE','RENT'].includes(f.population))throw Error('Saved universe must be reselected.')
 const nested=Object.entries(f).filter(([k,v])=>k.endsWith('_request')&&typeof v==='string').flatMap(([,v])=>{try{const q=JSON.parse(v as string);const t=q.transaction??q.transactionType??q.cohort?.transaction;return t?[t]:[]}catch{return []}})
 const explicit=f.transaction_type??f.transaction??f.transactionType??nested[0]
 if([f.transaction_type,f.transaction,f.transactionType,...nested].filter(v=>v!==undefined).some(v=>v!==explicit))throw Error('Saved request has conflicting universes.')
 const universe=ordinaryUniverse(engineType==='comparison'?f.a_transaction_type:explicit)
 if(engineType==='comparison')assertSameUniverse(universe,ordinaryUniverse(f.b_transaction_type))
 if(f.population!==undefined&&f.population!==universe)throw Error('Saved universe mismatch.')
 return {...f,population:universe,...(engineType!=='comparison'?{transaction_type:universe==='SALE'?'sale':'rent'}:{})}
}

export function freezeCommitted<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value as object))freezeCommitted(child);Object.freeze(value)}return value}
