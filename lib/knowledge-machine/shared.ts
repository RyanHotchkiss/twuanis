import 'server-only'
import {assertOwner} from '@/lib/administrative-control'
import {readKnowledge,canonicalRelationships} from '@/lib/knowledge-repository/server'
import {CONTRACT_VERSION as BASE_CONTRACT_VERSION,validateKnowledgeRequest,KnowledgeContractError,type RequestLimits} from './contracts'

export const INTERNAL_CONTRACT_VERSION='KA06-2026-10-16-R2-INTERNAL'
const CONTRACT_VERSION=INTERNAL_CONTRACT_VERSION

/** Uninstalled non-publishing composition candidate. No HTTP route or Server Action. */
export type InternalRequest={contractVersion:typeof CONTRACT_VERSION;operation:'lookupDefinition'|'getRelationships';locale:'en'|'es';identity:{authority:'ontology_terms';id:string};representation:'entity'|'definition'|'relationships';pageSize:number;depth?:number;sourceRevision?:string}
export type InternalContext={purpose:'OWNER_INSPECTION';limits:RequestLimits&{maxResponseBytes:number}}
type Identity={authority:'ontology_terms';id:string;type:string}
type Edge={source:string;target:string;predicate:string}
export type InternalResponse={contractVersion:typeof CONTRACT_VERSION;locale:'en'|'es';identity:Identity;representation:InternalRequest['representation'];label:string;definition?:string;relationships?:Edge[];provenance:{authority:'ontology_terms'|'ontology_relationships';sourceRevision:string;documentationRevision:string;observedAt:string};publication:'OWNER_INSPECTION_ONLY';pagination:{effectiveSize:number;nextCursor:null;truncated:boolean}}
export type Result={ok:true;data:InternalResponse}|{ok:false;error:{code:'INVALID_REQUEST'|'BOUNDS_EXCEEDED'|'DENIED'|'UNAVAILABLE'|'STALE_SNAPSHOT'}}
const allowed=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).every(k=>keys.includes(k))
const finite=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>0
const digest=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0
const id=(v:unknown):v is string=>typeof v==='string'&&/^[1-9][0-9]*$/.test(v)
function request(value:unknown,context:unknown):{input:InternalRequest;context:InternalContext}{
 if(!allowed(context,['purpose','limits'])||context.purpose!=='OWNER_INSPECTION'||!allowed(context.limits,['maxRequestBytes','maxPageSize','maxDepth','maxReferenceBytes','maxResponseBytes'])||Object.keys(context.limits).length!==5||Object.values(context.limits).some(v=>!finite(v)))throw Error('DENIED')
 const l=context.limits as InternalContext['limits']
 if(!allowed(value,['contractVersion','operation','locale','identity','representation','pageSize','depth','sourceRevision'])||value.contractVersion!==CONTRACT_VERSION||!allowed(value.identity,['authority','id'])||Object.keys(value.identity).length!==2||value.identity.authority!=='ontology_terms'||!id(value.identity.id)||!['lookupDefinition','getRelationships'].includes(value.operation as string)||!['entity','definition','relationships'].includes(value.representation as string)||value.sourceRevision!==undefined&&!digest(value.sourceRevision))throw Error('INVALID_REQUEST')
 if((value.operation==='getRelationships')!==(value.representation==='relationships'))throw Error('INVALID_REQUEST')
 const {maxResponseBytes:_,...baseLimits}=l
 validateKnowledgeRequest({contractVersion:BASE_CONTRACT_VERSION,operation:value.operation,locale:value.locale,reference:value.identity.id,pageSize:value.pageSize,...value.depth!==undefined?{depth:value.depth}:{}},baseLimits)
 // Existing canonical edge reader is a fixed first-page 25-edge reader. No recursive traversal or new paginator.
 if(value.operation==='getRelationships'&&(value.depth!==1||value.pageSize!==25))throw Error('BOUNDS_EXCEEDED')
 if(value.operation==='lookupDefinition'&&value.pageSize!==1)throw Error('BOUNDS_EXCEEDED')
 if(Buffer.byteLength(JSON.stringify(value),'utf8')>l.maxRequestBytes)throw Error('BOUNDS_EXCEEDED')
 return {input:value as unknown as InternalRequest,context:context as unknown as InternalContext}
}
/** Output validation uses the already acquired corpus identity set, never a second identity authority. */
export function validateInternalResponse(value:unknown,input:InternalRequest,knownIds:ReadonlyMap<string,string>,maxBytes:number):value is InternalResponse{
 if(!finite(maxBytes)||!allowed(value,['contractVersion','locale','identity','representation','label','definition','relationships','provenance','publication','pagination']))return false
 if(value.contractVersion!==CONTRACT_VERSION||value.locale!==input.locale||value.representation!==input.representation||value.publication!=='OWNER_INSPECTION_ONLY'||!text(value.label)||!allowed(value.identity,['authority','id','type'])||value.identity.authority!=='ontology_terms'||value.identity.id!==input.identity.id||!id(value.identity.id)||!knownIds.has(value.identity.id)||!text(value.identity.type)||knownIds.get(value.identity.id)!==value.identity.type)return false
 if(!allowed(value.provenance,['authority','sourceRevision','documentationRevision','observedAt'])||value.provenance.authority!==(input.representation==='relationships'?'ontology_relationships':'ontology_terms')||!digest(value.provenance.sourceRevision)||!text(value.provenance.documentationRevision)||!text(value.provenance.observedAt)||!/^\d{4}-\d\d-\d\dT/.test(value.provenance.observedAt)||!Number.isFinite(Date.parse(value.provenance.observedAt)))return false
 if(input.sourceRevision&&value.provenance.sourceRevision!==input.sourceRevision)return false
 if(!allowed(value.pagination,['effectiveSize','nextCursor','truncated'])||value.pagination.effectiveSize!==input.pageSize||value.pagination.nextCursor!==null||typeof value.pagination.truncated!=='boolean')return false
 if(input.representation==='definition'){if(!text(value.definition)||'relationships' in value||value.pagination.truncated)return false}
 else if('definition' in value)return false
 if(input.representation==='relationships'){
  if(!Array.isArray(value.relationships)||value.relationships.length>input.pageSize)return false
  const seen=new Set<string>()
  for(const edge of value.relationships){if(!allowed(edge,['source','target','predicate'])||!id(edge.source)||!id(edge.target)||edge.source!==input.identity.id||!knownIds.has(edge.source)||!knownIds.has(edge.target)||!['is_part_of','can_be_described_by','can_contain_property_type'].includes(edge.predicate as string))return false;const key=JSON.stringify(edge);if(seen.has(key))return false;seen.add(key)}
 }else if('relationships' in value||value.pagination.truncated)return false
 try{return Buffer.byteLength(JSON.stringify(value),'utf8')<=maxBytes}catch{return false}
}
/** Context describes purpose only; fresh canonical Owner assertion is still mandatory on every invocation.
 * Machine/public purposes are unsupported and denied before any canonical acquisition. */
export async function readInternalKnowledge(value:unknown,authorityContext:unknown):Promise<Result>{
 let parsed:ReturnType<typeof request>
 try{parsed=request(value,authorityContext)}catch(error){const code=error instanceof KnowledgeContractError?error.code:error instanceof Error?error.message:'';return {ok:false,error:{code:code==='BOUNDS_EXCEEDED'?'BOUNDS_EXCEEDED':code==='INVALID_REQUEST'?'INVALID_REQUEST':'DENIED'}}}
 try{await assertOwner()}catch{return {ok:false,error:{code:'DENIED'}}}
 const {input,context}=parsed
 try{
  const corpus=await readKnowledge()
  if(!digest(corpus.sourceFingerprint)||input.sourceRevision&&input.sourceRevision!==corpus.sourceFingerprint)return {ok:false,error:{code:'STALE_SNAPSHOT'}}
  const entries=corpus.entries.filter(e=>e.key.startsWith('term:')&&e.termId),matches=entries.filter(e=>e.termId===input.identity.id),terms=corpus.terms.filter(t=>t.id===input.identity.id)
  if(matches.length!==1||terms.length!==1)return {ok:false,error:{code:'UNAVAILABLE'}}
  const entry=matches[0],term=terms[0]
  if(!['geography','classification','characteristics'].includes(entry.category)||corpus.state[entry.category]!=='AVAILABLE')return {ok:false,error:{code:'UNAVAILABLE'}}
  const knownIds=new Map(corpus.terms.filter(t=>entries.some(e=>e.termId===t.id)).map(t=>[t.id,t.term_type]))
  const data:InternalResponse={contractVersion:CONTRACT_VERSION,locale:input.locale,identity:{authority:'ontology_terms',id:term.id,type:term.term_type},representation:input.representation,label:entry.names[input.locale],provenance:{authority:'ontology_terms',sourceRevision:corpus.sourceFingerprint,documentationRevision:entry.version,observedAt:corpus.observedAt},publication:'OWNER_INSPECTION_ONLY',pagination:{effectiveSize:input.pageSize,nextCursor:null,truncated:false}}
  if(input.representation==='definition'){
   if(entry.definitionStatus!=='VERIFIED_LOCAL'||!entry.definitions.en||!entry.definitions.es)return {ok:false,error:{code:'UNAVAILABLE'}}
   data.definition=entry.definitions[input.locale]!
  }
  if(input.representation==='relationships'){
   if(corpus.state.relationships!=='AVAILABLE')return {ok:false,error:{code:'UNAVAILABLE'}}
   const edges=await canonicalRelationships(term.id,1,corpus.sourceFingerprint,'outgoing')
   data.provenance.authority='ontology_relationships';data.relationships=edges.rows.map(e=>({source:e.source_term_id,target:e.target_term_id,predicate:e.relationship_type}));data.pagination.truncated=edges.hasMore
  }
  if(!validateInternalResponse(data,input,knownIds,context.limits.maxResponseBytes))return {ok:false,error:{code:'UNAVAILABLE'}}
  return {ok:true,data}
 }catch{return {ok:false,error:{code:'UNAVAILABLE'}}}
}
