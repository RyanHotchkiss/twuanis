import 'server-only'
import {lookup} from 'node:dns/promises'
import {isIP} from 'node:net'
import {request} from 'node:https'
import {createHash} from 'node:crypto'
import {TextDecoder} from 'node:util'
import {sourceUrl,parseFixture,observationDraft} from './adapters/core'
import {profiles,limits,type AdapterId,type SourceFixture} from './adapters/contracts'
import {extractBankPdf,pdfLimits} from './adapters/pdf'
import {validateEvidenceLocator} from './source-locator'

export const retrievalLimits=Object.freeze({pages:8,htmlBytes:65536,totalHtmlBytes:131072,pdfBytes:pdfLimits.bytes,timeoutMs:10000,runMs:60000,retries:2,concurrency:2})
export type RetrievalPlan={adapter:AdapterId;urls:string[];sourceRevision:string;authorizationExpiresAt:string}
export type SyntheticTransport={destination:(url:string,attempt:number)=>{url:URL;headers:Record<string,string>};validate:()=>void;beforeRequest?:(attempt:number)=>void;noteResponse?:(status:number)=>void;trace?:()=>string[]}
export type RetrievedPage={url:string;contentType:string;bytes:Buffer;sha256:string;retrievedAt:string}
export type RetrievalResult={startedAt:string;endedAt:string;outcome:'PARTIAL'|'FAILED';pages:{key:string;status:'RETAINED'|'FAILED'}[];observations:Record<string,unknown>[];diagnostics:string[];publicationEnabled:false;inventoryComplete:false}
/** Conservative public-unicast filter: DNS is validated once and pinned into the TLS connection.
 * IPv6 is deliberately denied until equivalent address classification is reviewed. */
export function publicAddress(address:string):boolean{
 if(isIP(address)!==4)return false
 const [a,b,c]=address.split('.').map(Number)
 return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113)
}
export function validateRetrievalPlan(plan:RetrievalPlan){
 if(!plan||Object.keys(plan).some(k=>!['adapter','urls','sourceRevision','authorizationExpiresAt'].includes(k))||!Object.hasOwn(profiles,plan.adapter)||!Array.isArray(plan.urls)||plan.urls.length<1||plan.urls.length>retrievalLimits.pages||new Set(plan.urls).size!==plan.urls.length||!/^[1-9][0-9]{0,18}$/.test(plan.sourceRevision)||!Number.isFinite(Date.parse(plan.authorizationExpiresAt))||Date.parse(plan.authorizationExpiresAt)<=Date.now())throw Error('RETRIEVAL_AUTHORIZATION_REQUIRED')
 for(const raw of plan.urls){sourceUrl(raw,profiles[plan.adapter]);validateEvidenceLocator(raw,profiles[plan.adapter].host)}
 if(profiles[plan.adapter].mechanism==='LAYOUT_TEXT'&&plan.urls.length!==1)throw Error('ONE_DOCUMENT_REQUIRED')
}
export async function retrievePage(plan:RetrievalPlan,raw:string,signal:AbortSignal,synthetic?:SyntheticTransport,attempt=0):Promise<RetrievedPage>{
 validateRetrievalPlan(plan)
 if(!plan.urls.includes(raw)||signal.aborted)throw Error('RETRIEVAL_CANCELLED')
 const logical=sourceUrl(raw,profiles[plan.adapter]);synthetic?.validate();synthetic?.beforeRequest?.(attempt);const target=synthetic?.destination(raw,attempt);const url=target?.url||logical;
 const addresses=await new Promise<Awaited<ReturnType<typeof lookup>>>((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(Error('RETRIEVAL_CANCELLED'))},timer=setTimeout(()=>{signal.removeEventListener('abort',abort);reject(Error('SOURCE_TIMEOUT'))},retrievalLimits.timeoutMs);signal.addEventListener('abort',abort,{once:true});lookup(url.hostname,{all:true,family:4,verbatim:true}).then(value=>{clearTimeout(timer);signal.removeEventListener('abort',abort);resolve(value as never)},()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(Error('SOURCE_DNS_FAILED'))});if(signal.aborted)abort()}) as unknown as {address:string;family:number}[]
 if(!addresses.length||addresses.some(x=>!publicAddress(x.address)))throw Error('UNSAFE_SOURCE_ADDRESS')
 if(signal.aborted)throw Error('RETRIEVAL_CANCELLED')
 const address=addresses[0],pdf=profiles[plan.adapter].mechanism==='LAYOUT_TEXT',max=pdf?retrievalLimits.pdfBytes:retrievalLimits.htmlBytes
 return new Promise((resolve,reject)=>{
  let completed=false
  const fail=(error:Error)=>{if(completed)return;completed=true;clearTimeout(timer);req.destroy();reject(error)}
  const req=request(url,{method:'GET',agent:false,signal,rejectUnauthorized:true,minVersion:'TLSv1.2',servername:url.hostname,family:4,
   // Exact pinned address prevents a second DNS lookup / rebinding at connection time.
   lookup:((_host:unknown,options:{all?:boolean},callback:(...args:unknown[])=>void)=>options.all?callback(null,[address]):callback(null,address.address,address.family)) as never,
   headers:{Accept:pdf?'application/pdf':'text/html','Accept-Encoding':'identity','User-Agent':'Twuanis-Authorized-Source-Retrieval/1',...target?.headers}},response=>{
    synthetic?.noteResponse?.(response.statusCode||0)
    const type=(response.headers['content-type']||'').split(';')[0].trim().toLowerCase()
    if(response.statusCode!==200){response.resume();fail(Error(response.statusCode===429||response.statusCode===503?'RETRYABLE_SOURCE_FAILURE':'SOURCE_HTTP_REJECTED'));return}
    if(type!==(pdf?'application/pdf':'text/html')||response.headers['content-encoding']&&response.headers['content-encoding']!=='identity'){response.resume();fail(Error('SOURCE_CONTENT_TYPE_CHANGED'));return}
    const length=response.headers['content-length'];if(length&&(!/^\d+$/.test(length)||Number(length)>max)){response.resume();fail(Error('SOURCE_BYTE_LIMIT'));return}
    let size=0;const chunks:Buffer[]=[]
    response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>max)fail(Error('SOURCE_BYTE_LIMIT'));else chunks.push(Buffer.from(chunk))})
    response.on('error',()=>fail(Error('SOURCE_STREAM_FAILED')))
    response.on('aborted',()=>fail(Error('SOURCE_STREAM_FAILED')))
    response.on('end',()=>{if(completed)return;if(!response.complete||length&&Number(length)!==size){fail(Error('SOURCE_STREAM_FAILED'));return}completed=true;clearTimeout(timer);const bytes=Buffer.concat(chunks);resolve({url:raw,contentType:type,bytes,sha256:createHash('sha256').update(bytes).digest('hex'),retrievedAt:new Date().toISOString()})})
  })
  const timer=setTimeout(()=>fail(Error('SOURCE_TIMEOUT')),retrievalLimits.timeoutMs)
  req.on('error',()=>fail(Error(signal.aborted?'RETRIEVAL_CANCELLED':'SOURCE_CONNECTION_FAILED')));req.end()
 })
}
/** All coverage remains SAMPLE. Retention never establishes disappearance or publishes an offering. */
export async function acquireSource(plan:RetrievalPlan,run:string,authorize:()=>Promise<void>,signal:AbortSignal=new AbortController().signal,synthetic?:SyntheticTransport):Promise<RetrievalResult>{
 validateRetrievalPlan(plan);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(run))throw Error('INVALID_RUN');const startedAt=new Date().toISOString(),end=Date.now()+retrievalLimits.runMs
 const controller=new AbortController(),cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)controller.abort()
 const timer=setTimeout(cancel,retrievalLimits.runMs),pages:RetrievalResult['pages']=[],observations:Record<string,unknown>[]=[],diagnostics:string[]=[];let total=0
 try{
  for(const [index,url] of plan.urls.entries()){
   await authorize();validateRetrievalPlan(plan);if(controller.signal.aborted||Date.now()>=end)throw Error('RETRIEVAL_CANCELLED')
   let page:RetrievedPage|undefined
   for(let attempt=0;attempt<=retrievalLimits.retries;attempt++){
    try{page=await retrievePage(plan,url,controller.signal,synthetic,attempt);break}catch(e){const code=e instanceof Error?e.message:'SOURCE_FAILURE';if(code!=='RETRYABLE_SOURCE_FAILURE'||attempt===retrievalLimits.retries)throw Error(code);await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>{controller.signal.removeEventListener('abort',abort);resolve()},(attempt+1)*1000);const abort=()=>{clearTimeout(t);reject(Error('RETRIEVAL_CANCELLED'))};controller.signal.addEventListener('abort',abort,{once:true});if(controller.signal.aborted)abort()});await authorize()}
   }
   if(!page)throw Error('SOURCE_FAILURE');await authorize()
   if(profiles[plan.adapter].mechanism==='LAYOUT_TEXT'){
    const parsed=await extractBankPdf(page.bytes,{mechanism:plan.adapter as 'bp-catalog'|'bp-auctions',url,capturedAt:page.retrievedAt,documentComplete:false});
    diagnostics.push(...parsed.issues);for(const record of parsed.records){try{observations.push(observationDraft(parsed.result,record,parsed.fixture,run))}catch{diagnostics.push('UNRESOLVED_RECORD')}}
   }else{
    total+=page.bytes.length;if(total>retrievalLimits.totalHtmlBytes)throw Error('SOURCE_TOTAL_BYTE_LIMIT')
    const body=new TextDecoder('utf-8',{fatal:true}).decode(page.bytes)
    const fixture:SourceFixture={capturedAt:page.retrievedAt,scope:'SAMPLE',pages:[{url,finalUrl:url,status:200,contentType:'text/html',body,number:1,terminal:true,next:null}]}
    const parsed=parseFixture(plan.adapter,fixture);diagnostics.push(...parsed.issues);for(const record of parsed.records){try{observations.push(observationDraft(parsed,record,fixture,run))}catch{diagnostics.push('UNRESOLVED_RECORD')}}
   }
   if(observations.length>limits.records)throw Error('SOURCE_RECORD_LIMIT')
   if(synthetic){const physical=synthetic.destination(url,0).url.href;for(const observation of observations){observation.raw=JSON.stringify({synthetic:true,physicalOrigin:physical,responseSha256:page.sha256,acquiredAt:page.retrievedAt,registeredSourceLocator:url,record:observation.raw});}diagnostics.push('SYNTHETIC_HTTP_NOT_BANK_ACQUISITION')}
   pages.push({key:`p${index+1}:${page.sha256}`,status:'RETAINED'})
  }
 }catch(e){diagnostics.push(e instanceof Error?e.message:'SOURCE_FAILURE');pages.push({key:`p${pages.length+1}:failed`,status:'FAILED'})}
 finally{clearTimeout(timer);signal.removeEventListener('abort',cancel)}
 await authorize()
 if(synthetic?.trace)diagnostics.push(...synthetic.trace())
 const seen=new Map<string,string>(),conflicts=new Set<string>();for(const obs of observations){const key=String(obs.record_key),hash=createHash('sha256').update(String(obs.raw)).digest('hex');if(seen.has(key)&&seen.get(key)!==hash)conflicts.add(key);seen.set(key,hash)}
 const retained=new Set<string>(),safeObservations=observations.filter(obs=>{const key=String(obs.record_key);if(conflicts.has(key))return false;if(retained.has(key)){diagnostics.push('DUPLICATE_OBSERVATION');return false}retained.add(key);return true});if(conflicts.size)diagnostics.push('CONFLICTING_SOURCE_ID')
 return {startedAt,endedAt:new Date().toISOString(),outcome:pages.some(p=>p.status==='FAILED')||!safeObservations.length?'FAILED':'PARTIAL',pages,observations:safeObservations,diagnostics:[...new Set(diagnostics)].slice(0,32),publicationEnabled:false,inventoryComplete:false}
}
