import 'server-only'
import {randomUUID} from 'node:crypto'
import {PublicError,LIMITS,CATEGORIES,OPERATIONS,type createPublicKnowledge} from './service'
import {handleMcp,MCP_VERSION} from './mcp'
import {validateManifest,type PublicationManifest} from './publication'
export type HttpDependencies={service:ReturnType<typeof createPublicKnowledge>;policy:()=>PublicationManifest;admit:(request:Request)=>Promise<void>;origins:()=>string[];log:(event:Record<string,unknown>)=>void}
const messages={en:{invalid:'Invalid request',unavailable:'Knowledge is unavailable',missing:'Resource unavailable',bounds:'Request or response exceeds the allowed size',timeout:'Request timed out'},es:{invalid:'Solicitud no válida',unavailable:'El conocimiento no está disponible',missing:'Recurso no disponible',bounds:'La solicitud o respuesta supera el tamaño permitido',timeout:'La solicitud agotó el tiempo disponible'}}
export async function readBoundedJson(request:Request,signal:AbortSignal){
 const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>8192))throw new PublicError('BOUNDS_EXCEEDED',413)
 const reader=request.body?.getReader();if(!reader)throw new PublicError('INVALID_REQUEST',400);let count=0;const chunks:Uint8Array[]=[];
 const stop=()=>{void reader.cancel().catch(()=>{})};signal.addEventListener('abort',stop,{once:true});
 try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;count+=value.byteLength;if(count>8192)throw new PublicError('BOUNDS_EXCEEDED',413);chunks.push(value)}const bytes=new Uint8Array(count);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch(error){stop();if(signal.aborted)throw new PublicError('REQUEST_TIMEOUT',504);if(error instanceof PublicError)throw error;throw new PublicError(error instanceof SyntaxError?'PARSE_ERROR':'INVALID_REQUEST',400)}finally{signal.removeEventListener('abort',stop);reader.releaseLock()}
}
export function createPublicHandlers(deps:HttpDependencies){
 return async function handle(request:Request,mode:'api'|'discovery'|'mcp'){
  const requestId=randomUUID(),started=performance.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000),disconnect=()=>controller.abort();request.signal.addEventListener('abort',disconnect,{once:true});
  let status=500,bytes=0,count=0,queryCount:number|null=null,operation:string=mode,locale:'en'|'es'='en',sourceRevision:string|null=null,publicationRevision:string|null=null,body:unknown,category:string|null=null;
  const respond=(payload:unknown,code:number)=>{const text=JSON.stringify(payload);if(Buffer.byteLength(text)>65536)throw new PublicError('BOUNDS_EXCEEDED',413);status=code;bytes=Buffer.byteLength(text);return new Response(text,{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Request-ID':requestId,...mode==='mcp'?{'MCP-Protocol-Version':MCP_VERSION}:{}}})};
  try{
   if(request.method!==(mode==='discovery'?'GET':'POST'))throw new PublicError('METHOD_NOT_ALLOWED',405)
   if(mode!=='discovery'&&request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new PublicError('INVALID_REQUEST',415)
   const origin=request.headers.get('origin');if(origin&&!deps.origins().includes(origin))throw new PublicError('ORIGIN_DENIED',403)
   await deps.admit(request);controller.signal.throwIfAborted();
   if(mode==='discovery'){
    const url=new URL(request.url);if([...url.searchParams.keys()].some(k=>k!=='locale')||url.searchParams.getAll('locale').length>1||!['en','es'].includes(url.searchParams.get('locale')||'en'))throw new PublicError('INVALID_REQUEST',400);locale=(url.searchParams.get('locale')||'en') as 'en'|'es';const p=validateManifest(deps.policy());publicationRevision=p.revision;
    return respond({contractVersion:'KA06-PUBLIC-1',locale,operations:OPERATIONS,categories:CATEGORIES,publicationRevision:p.revision,limits:{requestBytes:8192,responseBytes:65536,pageDefault:20,pageMax:25,depth:1,referenceBytes:240,cursorBytes:1024,deadlineMs:5000},publication:'Only current individually approved resources are returned; discovery is a capability description.'},200)
   }
   body=await readBoundedJson(request,controller.signal);
   if(mode==='mcp'){const outcome=await handleMcp(body,request.headers,deps.service,controller.signal);count=outcome.items;queryCount=outcome.queryCount;operation=outcome.operation;locale=outcome.locale==='es'?'es':'en';sourceRevision=outcome.sourceRevision||null;publicationRevision=outcome.publicationRevision||null;return respond(outcome.body,outcome.status)}
   if(body&&typeof body==='object'&&!Array.isArray(body)){const q=body as Record<string,unknown>;if(q.locale==='es')locale='es';if(typeof q.category==='string'&&CATEGORIES.includes(q.category as typeof CATEGORIES[number]))category=q.category;if(typeof q.operation==='string'&&OPERATIONS.includes(q.operation as typeof OPERATIONS[number]))operation=q.operation}
   const result=await deps.service.retrieve(body,controller.signal);count=result.items.length;queryCount=result.queryCount;sourceRevision=result.sourceRevision;publicationRevision=result.publicationRevision;return respond(result,200)
  }catch(error){const e=controller.signal.aborted?new PublicError('REQUEST_TIMEOUT',504):error instanceof PublicError?error:new PublicError('SOURCE_UNAVAILABLE',503);const m=messages[locale];const message=e.status===404?m.missing:e.status===413?m.bounds:e.status===504?m.timeout:e.status<500?m.invalid:m.unavailable;
   if(mode==='mcp')return respond({jsonrpc:'2.0',...body&&typeof body==='object'&&'id'in body&&(typeof (body as {id:unknown}).id==='string'&&String((body as {id:unknown}).id).length<=128||typeof (body as {id:unknown}).id==='number'&&Number.isSafeInteger((body as {id:unknown}).id))?{id:(body as {id:unknown}).id}:{},error:{code:e.code==='PARSE_ERROR'?-32700:e.status===400||e.status===404?-32602:-32603,message}},e.status===404?400:e.status)
   return respond({code:e.code==='PARSE_ERROR'?'INVALID_REQUEST':e.code,locale,message,requestId},e.status)
  }finally{clearTimeout(timeout);request.signal.removeEventListener('abort',disconnect);try{deps.log({kind:'public_knowledge_request',requestId,transport:mode,operation,category,locale,status,durationMs:Math.round((performance.now()-started)*1000)/1000,responseBytes:bytes,itemCount:count,queryCount,databaseEgressBytes:null,sourceRevision,publicationRevision})}catch{/* Logging outage does not expose request material or bypass admission. */}}
 }
}
