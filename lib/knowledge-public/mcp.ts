import 'server-only'
import {CONTRACT_VERSION} from '@/lib/knowledge-machine/contracts'
import {PublicError,type createPublicKnowledge} from './service'
export const MCP_VERSION='2026-07-28'
export const resourceUri=(reference:string,locale:'en'|'es',representation='definition')=>'twuanis-knowledge:'+encodeURIComponent(reference)+'?locale='+locale+'&representation='+representation
export function parseResourceUri(uri:unknown){
 if(typeof uri!=='string'||Buffer.byteLength(uri)>1024)throw new PublicError('RESOURCE_UNAVAILABLE',404)
 const match=/^twuanis-knowledge:([^?]+)\?locale=(en|es)&representation=(definition|relationships)$/.exec(uri);if(!match)throw new PublicError('RESOURCE_UNAVAILABLE',404)
 let reference:string;try{reference=decodeURIComponent(match[1])}catch{throw new PublicError('RESOURCE_UNAVAILABLE',404)}
 if(!reference.startsWith('term:')||Buffer.byteLength(reference)>240||resourceUri(reference,match[2] as 'en'|'es',match[3])!==uri)throw new PublicError('RESOURCE_UNAVAILABLE',404)
 return {reference,locale:match[2] as 'en'|'es',operation:match[3]==='relationships'?'getRelationships':'lookupDefinition'}
}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)
export type McpOutcome={status:number;body:Record<string,unknown>;items:number;queryCount:number;operation:string;locale:string;sourceRevision?:string;publicationRevision?:string}
export async function handleMcp(value:unknown,headers:Headers,service:ReturnType<typeof createPublicKnowledge>,signal:AbortSignal):Promise<McpOutcome>{
 const fail=(code:number,message:string,status=400,data?:unknown):McpOutcome=>({status,body:{jsonrpc:'2.0',...object(value)&&(typeof value.id==='string'&&value.id.length<=128||typeof value.id==='number'&&Number.isSafeInteger(value.id))?{id:value.id}:{},error:{code,message,...data?{data}:{}}},items:0,queryCount:0,operation:'invalid',locale:'unknown'})
 if(!object(value)||Object.keys(value).some(k=>!['jsonrpc','id','method','params'].includes(k))||value.jsonrpc!=='2.0'||!(typeof value.id==='string'&&value.id.length<=128||typeof value.id==='number'&&Number.isSafeInteger(value.id))||typeof value.method!=='string'||!object(value.params))return fail(-32600,'Invalid request')
 const params=value.params,meta=params._meta;if(!object(meta)||Object.keys(meta).some(k=>!['io.modelcontextprotocol/protocolVersion','io.modelcontextprotocol/clientInfo','io.modelcontextprotocol/clientCapabilities','twuanis/locale','twuanis/pageSize'].includes(k))||!object(meta['io.modelcontextprotocol/clientCapabilities']))return fail(-32602,'Invalid request metadata')
 if(meta['twuanis/locale']!==undefined&&!['en','es'].includes(String(meta['twuanis/locale']))||meta['twuanis/pageSize']!==undefined&&(!Number.isSafeInteger(meta['twuanis/pageSize'])||Number(meta['twuanis/pageSize'])<1||Number(meta['twuanis/pageSize'])>25))return fail(-32602,'Invalid public retrieval metadata');
 const info=meta['io.modelcontextprotocol/clientInfo'];if(info!==undefined&&(!object(info)||typeof info.name!=='string'||!info.name||typeof info.version!=='string'||!info.version))return fail(-32602,'Invalid client metadata')
 const version=meta['io.modelcontextprotocol/protocolVersion'];if(typeof version!=='string')return fail(-32602,'Protocol version required')
 if(headers.get('mcp-protocol-version')!==version||headers.get('mcp-method')!==value.method)return fail(-32020,'Header mismatch')
 if(version!==MCP_VERSION)return fail(-32022,'Unsupported protocol version',400,{requested:version,supported:[MCP_VERSION]})
 const accept=headers.get('accept')||'';if(!accept.includes('application/json')||!accept.includes('text/event-stream'))return fail(-32020,'Required Accept types missing')
 let result:Record<string,unknown>,items=0,queryCount=0,locale:'en'|'es'=meta['twuanis/locale']==='es'?'es':'en',sourceRevision:string|undefined,publicationRevision:string|undefined;
 try{
  if(value.method==='server/discover'){
   if(Object.keys(params).some(k=>k!=='_meta'))return fail(-32602,'Invalid parameters')
   result={resultType:'complete',supportedVersions:[MCP_VERSION],capabilities:{resources:{}},_meta:{'io.modelcontextprotocol/serverInfo':{name:'Twuanis Public Knowledge',version:'KA06-PUBLIC-1'}},ttlMs:0,cacheScope:'public'}
  }else if(value.method==='resources/list'){
   if(Object.keys(params).some(k=>!['_meta','cursor'].includes(k))||params.cursor!==undefined&&typeof params.cursor!=='string')return fail(-32602,'Invalid parameters')
   const page=await service.listResources(locale,params.cursor as string|undefined,signal,meta['twuanis/pageSize']===undefined?20:Number(meta['twuanis/pageSize']));items=page.items.length;queryCount=page.queryCount;sourceRevision=page.sourceRevision;publicationRevision=page.publicationRevision;
   // One resource per approved entity, containing explicitly paired locale locators.
   result={resultType:'complete',resources:page.items.map(item=>({uri:resourceUri(String(item.reference),locale),name:String(item.reference),title:String(item.label),mimeType:'application/json',_meta:{'twuanis/esUri':resourceUri(String(item.reference),'es'),'twuanis/relationshipsEn':resourceUri(String(item.reference),'en','relationships'),'twuanis/relationshipsEs':resourceUri(String(item.reference),'es','relationships')}})),...page.nextCursor?{nextCursor:page.nextCursor}:{},ttlMs:0,cacheScope:'public'}
  }else if(value.method==='resources/read'){
   if(Object.keys(params).some(k=>!['_meta','uri'].includes(k)))return fail(-32602,'Invalid parameters')
   if(headers.get('mcp-name')!==params.uri)return fail(-32020,'Header mismatch')
   const parsed=parseResourceUri(params.uri);locale=parsed.locale;
   const page=await service.retrieve({contractVersion:CONTRACT_VERSION,operation:parsed.operation,reference:parsed.reference,locale,pageSize:25,...parsed.operation==='getRelationships'?{depth:1}:{}},signal);items=page.items.length;queryCount=page.queryCount;sourceRevision=page.sourceRevision;publicationRevision=page.publicationRevision;
   result={resultType:'complete',contents:[{uri:params.uri,mimeType:'application/json',text:JSON.stringify(page)}],ttlMs:0,cacheScope:'public'}
  }else return fail(-32601,'Method not found',404)
 }catch(error){if(error instanceof PublicError){const code=error.status===404||error.status===400?-32602:error.status===409?-32001:-32603;return fail(code,locale==='es'?'Recurso no disponible':'Resource unavailable',error.status===404?400:error.status)}throw error}
 return {status:200,body:{jsonrpc:'2.0',id:value.id,result},items,queryCount,operation:value.method,locale,sourceRevision,publicationRevision}
}
