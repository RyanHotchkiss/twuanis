import 'server-only'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {stableJSON} from '@/lib/publisher-identity/validation'
import content from './explanations.json'
import manifest from './explanation-manifest.json'
import type {Category} from './core'
export type DefinitionTerm={id:string;parent_id:string|null;term_type:string;term_name:string;term_name_en:string;term_name_es:string;slug:string;slug_en:string;slug_es:string;official_code:string|null;level:number|null;description:string|null}
const fields=['id','parent_id','term_type','term_name','term_name_en','term_name_es','slug','slug_en','slug_es','official_code','level','description'] as const
const hash=(v:unknown)=>createHash('sha256').update(stableJSON(v)).digest('hex')
function freeze(value:unknown):void{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}}
// Bundled immutable documentation is checked once; current canonical dependencies are checked per read.
const integrityValid=hash(content)===manifest.contentDigest&&content.revision===manifest.revision
freeze(content);freeze(manifest)
const recordsByTerm=new Map(content.records.map(r=>[r.termId,r]))
function artifact(){if(!integrityValid)throw Error('Definition documentation unavailable');return content}
export function sourceDependencyDigest(term:DefinitionTerm,all:ReadonlyMap<string,DefinitionTerm>){
 const pick=(t:DefinitionTerm)=>Object.fromEntries(fields.map(k=>[k,t[k]??null])),ancestors:Record<string,unknown>[]=[],seen=new Set([term.id]);let parent=term.parent_id
 while(parent){if(seen.has(parent)||ancestors.length>=64)throw Error('Definition dependency unavailable');seen.add(parent);const p=all.get(parent);if(!p)throw Error('Definition dependency unavailable');ancestors.push(pick(p));parent=p.parent_id}
 return hash({term:pick(term),ancestors})
}
export function termDocumentation(term:DefinitionTerm,all:ReadonlyMap<string,DefinitionTerm>){
 try{
  artifact();const record=recordsByTerm.get(term.id);if(!record)return {status:'INCOMPLETE' as const}
  if(sourceDependencyDigest(term,all)!==record.sourceDependencyDigest)return {status:'SOURCE_MISMATCH' as const}
  if('additionalAuthority'in record&&record.additionalAuthority)for(const [file,expected]of Object.entries(record.additionalAuthority)){if(createHash('sha256').update(readFileSync(path.join(process.cwd(),file))).digest('hex')!==expected)return {status:'SOURCE_MISMATCH' as const}}
  if(record.verificationStatus!=='VERIFIED_LOCAL')return {status:'BLOCKED' as const}
  return {status:'VERIFIED_LOCAL' as const,definitions:record.definitions,version:record.documentationRevision,rootDisposition:record.rootDisposition,record}
 }catch{return {status:'INCOMPLETE' as const}}
}
/** Metadata for approved organizational views; labels and hierarchy still come from current terms. */
export function publicRootCategory(term:DefinitionTerm,all:ReadonlyMap<string,DefinitionTerm>):Category|null{
 const doc=termDocumentation(term,all);return doc.status==='VERIFIED_LOCAL'&&doc.rootDisposition?.public?doc.rootDisposition.category as Category:null
}
export function relationshipDocumentation(){try{return artifact().predicates.filter(p=>p.verificationStatus==='VERIFIED_LOCAL')}catch{return []}}
/** Internal inspection metadata; exported only through the separately authenticated allowlist. */
export function definitionReviewMetadata(){return {revision:manifest.revision,contentDigest:manifest.contentDigest,evidenceRef:manifest.evidenceRef,reviewer:manifest.reviewer,OwnerAcceptance:manifest.OwnerAcceptance,releaseState:manifest.releaseState}}
