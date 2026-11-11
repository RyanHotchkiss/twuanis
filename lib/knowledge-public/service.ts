import 'server-only'
import {validateKnowledgeRequest,CONTRACT_VERSION,type KnowledgeRequest} from '@/lib/knowledge-machine/contracts'
import {normalize,type Entry,type Locale} from '@/lib/knowledge-repository/core'
import type {DefinitionTerm} from '@/lib/knowledge-repository/definitions'
import {eligibleEntries,hash,validateManifest,type PublicationManifest} from './publication'
export const LIMITS=Object.freeze({maxRequestBytes:8192,maxPageSize:25,maxDepth:1,maxReferenceBytes:240,responseBytes:65536,cursorBytes:1024,deadlineMs:5000})
export const OPERATIONS=['lookupDefinition','listCategory','searchKnowledge','getRelationships'] as const
export const CATEGORIES=['classification','characteristics','geography','relationships'] as const
export class PublicError extends Error{constructor(readonly code:string,readonly status:number){super(code)}}
export type Snapshot={entries:Entry[];allTerms:DefinitionTerm[];sourceFingerprint:string;observedAt:string;queryCount:number}
export type PublicResponse={contractVersion:'KA06-PUBLIC-1';operation:string;locale:Locale;items:Record<string,unknown>[];nextCursor:string|null;sourceRevision:string;representationRevision:string;publicationRevision:string;observedAt:string;queryCount:number}
export type PublicDependencies={policy:()=>PublicationManifest;read:(signal:AbortSignal)=>Promise<Snapshot>;verify:(revision:string,signal:AbortSignal)=>Promise<boolean>;edges:(id:string,allowed:{source:string;target:string;predicate:string}[],signal:AbortSignal)=>Promise<{source_term_id:string;target_term_id:string;relationship_type:string}[]>}
export function parsePublicRequest(value:unknown){
 let q:KnowledgeRequest;try{if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&!('pageSize'in value))value={...value,pageSize:20};q=validateKnowledgeRequest(value,{maxRequestBytes:8192,maxPageSize:25,maxDepth:1,maxReferenceBytes:240})}catch{throw new PublicError('INVALID_REQUEST',400)}
 if(!OPERATIONS.includes(q.operation as typeof OPERATIONS[number])||q.category&&!CATEGORIES.includes(q.category as typeof CATEGORIES[number])||q.query&&q.query.length>120||q.cursor&&Buffer.byteLength(q.cursor)>1024)throw new PublicError('INVALID_REQUEST',400)
 return q
}
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0
export function createPublicKnowledge(deps:PublicDependencies){
 async function execute(q:KnowledgeRequest,signal:AbortSignal,resourceList=false):Promise<PublicResponse>{
  signal.throwIfAborted();let policy:PublicationManifest;try{policy=validateManifest(deps.policy())}catch{throw new PublicError('PUBLICATION_UNAVAILABLE',503)}
  const policyDigest=hash(policy),snapshot=await deps.read(signal),eligible=eligibleEntries(snapshot.entries,snapshot.allTerms,policy),representationRevision=hash(eligible.map(e=>[e.record.id,e.record.representationRevision,e.record.representationDigest]));
  const provenance={authority:'ontology_terms',sourceRevision:snapshot.sourceFingerprint,representationRevision};
  const termItem=(x:typeof eligible[number])=>{const item:Record<string,unknown>={kind:'term',reference:x.entry.key,canonicalId:x.term.id,type:x.term.term_type,label:x.entry.names[q.locale],provenance:{...provenance,sourceReference:x.term.id}};if(x.record.fields.includes('definition'))item.definition=x.entry.definitions[q.locale];if(x.record.fields.includes('officialCode'))item.officialCode=x.term.official_code;if(x.record.fields.includes('parentReference'))item.parentReference=eligible.find(e=>e.term.id===x.term.parent_id)?.entry.key??null;return item;};
  let candidates:Record<string,unknown>[]=[],queryCount=snapshot.queryCount;
  if(resourceList)candidates=eligible.map(termItem);
  else if(q.operation==='lookupDefinition'){const x=eligible.find(e=>e.entry.key===q.reference);if(!x)throw new PublicError('RESOURCE_UNAVAILABLE',404);candidates=[termItem(x)];}
  else if(q.operation==='getRelationships'){
   const x=eligible.find(e=>e.entry.key===q.reference);if(!x)throw new PublicError('RESOURCE_UNAVAILABLE',404);
   const allowed=policy.edges.filter(e=>e.source===x.term.id&&e.status==='PUBLISHED'&&eligible.some(t=>t.term.id===e.target));
   const rows=await deps.edges(x.term.id,allowed,signal);if(allowed.length)queryCount++;
   candidates=rows.filter(r=>allowed.some(a=>a.target===r.target_term_id&&a.predicate===r.relationship_type&&a.source===r.source_term_id)).map(r=>({kind:'edge',sourceReference:x.entry.key,targetReference:eligible.find(t=>t.term.id===r.target_term_id)!.entry.key,predicate:r.relationship_type,provenance:{authority:'ontology_relationships',sourceReference:hash([r.source_term_id,r.target_term_id,r.relationship_type]),sourceRevision:hash(rows),representationRevision}}));
   // A missing approved edge is withheld. Compare a second exact acquisition before disclosure.
   if(allowed.length){const current=await deps.edges(x.term.id,allowed,signal);queryCount++;if(hash(current)!==hash(rows))throw new PublicError('REVISION_CHANGED',409)}
  }else{
   const words=normalize(q.query||'').split(' ').filter(Boolean);
   candidates=eligible.filter(x=>(!q.category||x.entry.category===q.category)&&words.every(word=>normalize(x.entry.names[q.locale]+' '+(x.record.fields.includes('definition')?x.entry.definitions[q.locale]||'':'')).includes(word))).map(termItem)
  }
  const key=(x:Record<string,unknown>)=>x.kind==='edge'?String(x.sourceReference)+'|'+String(x.predicate)+'|'+String(x.targetReference):String(x.reference);
  candidates.sort((a,b)=>compare(key(a),key(b)));
  const requestDigest=hash({operation:q.operation,category:q.category??null,query:q.query??null,reference:q.reference??null,pageSize:q.pageSize,depth:q.depth??null,locale:q.locale,resourceList});let after='';
  const contentRevision=hash(candidates);
  if(q.cursor){try{const c=JSON.parse(Buffer.from(q.cursor,'base64url').toString('utf8'));if(Object.keys(c).sort().join(',')!=='after,content,policy,request,source'||typeof c.after!=='string'||c.request!==requestDigest)throw Error();if(c.source!==snapshot.sourceFingerprint||c.policy!==policyDigest||c.content!==contentRevision)throw new PublicError('REVISION_CHANGED',409);if(!candidates.some(i=>key(i)===c.after))throw Error();after=c.after}catch(error){if(error instanceof PublicError)throw error;throw new PublicError('INVALID_REQUEST',400)}}
  const rest=candidates.filter(x=>!after||compare(key(x),after)>0),items=rest.slice(0,q.pageSize),nextCursor=rest.length>items.length?Buffer.from(JSON.stringify({after:key(items[items.length-1]),content:contentRevision,policy:policyDigest,request:requestDigest,source:snapshot.sourceFingerprint})).toString('base64url'):null;
  if(nextCursor&&Buffer.byteLength(nextCursor)>1024)throw new PublicError('BOUNDS_EXCEEDED',413)
  const currentPolicy=deps.policy();if(hash(currentPolicy)!==policyDigest)throw new PublicError('REVISION_CHANGED',409);
  if(!await deps.verify(snapshot.sourceFingerprint,signal))throw new PublicError('REVISION_CHANGED',409);queryCount++;
  if(hash(deps.policy())!==policyDigest)throw new PublicError('REVISION_CHANGED',409);
  signal.throwIfAborted();const result:PublicResponse={contractVersion:'KA06-PUBLIC-1',operation:resourceList?'listResources':q.operation,locale:q.locale,items,nextCursor,sourceRevision:snapshot.sourceFingerprint,representationRevision,publicationRevision:policy.revision,observedAt:snapshot.observedAt,queryCount:0};
  Object.defineProperty(result,'queryCount',{value:queryCount,enumerable:false});
  if(Buffer.byteLength(JSON.stringify(result))>65536)throw new PublicError('BOUNDS_EXCEEDED',413);return result
 }
 return {retrieve:(value:unknown,signal:AbortSignal)=>execute(parsePublicRequest(value),signal),listResources:(locale:Locale,cursor:string|undefined,signal:AbortSignal,pageSize=20)=>execute(parsePublicRequest({contractVersion:CONTRACT_VERSION,operation:'listCategory',category:'classification',locale,pageSize,...cursor?{cursor}:{}}),signal,true)}
}
