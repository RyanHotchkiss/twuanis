import 'server-only'
import {createHash} from 'node:crypto'
import {stableJSON} from '@/lib/publisher-identity/validation'
import {sourceDependencyDigest,termDocumentation,type DefinitionTerm} from '@/lib/knowledge-repository/definitions'
import type {Entry} from '@/lib/knowledge-repository/core'
export const hash=(value:unknown)=>createHash('sha256').update(stableJSON(value)).digest('hex')
export type PublicRecord={id:string;reference:string;category:'classification'|'characteristics'|'geography';fields:string[];locales:('en'|'es')[];sourceDependencyDigest:string;representationRevision:string;representationDigest:string;status:'PUBLISHED'|'WITHDRAWN'}
export type PublicEdge={source:string;target:string;predicate:string;dependencyDigest:string;locales:('en'|'es')[];status:'PUBLISHED'|'WITHDRAWN'}
export type PublicationManifest={revision:string;state:'PENDING_OWNER_APPROVAL'|'APPROVED'|'WITHDRAWN';ownerApproval:null|{decision:string;evidence:string};records:PublicRecord[];edges:PublicEdge[]}
const fields=['canonicalId','reference','type','label','definition','officialCode','parentReference','provenance']
const predicates=['is_part_of','can_be_described_by','can_contain_property_type']
export function validateManifest(m:PublicationManifest){
 if(!m||!m.revision||!['PENDING_OWNER_APPROVAL','APPROVED','WITHDRAWN'].includes(m.state)||!Array.isArray(m.records)||m.records.length>750||!Array.isArray(m.edges)||m.edges.length>750)throw Error('PUBLICATION_UNAVAILABLE')
 if(m.state!=='APPROVED'||!m.ownerApproval?.decision||!m.ownerApproval.evidence)throw Error('PUBLICATION_UNAVAILABLE')
 const ids=new Set<string>(),refs=new Set<string>();
 for(const r of m.records){if(!/^\d+$/.test(r.id)||ids.has(r.id)||refs.has(r.reference)||!r.reference.startsWith('term:')||!['classification','characteristics','geography'].includes(r.category)||!['PUBLISHED','WITHDRAWN'].includes(r.status)||!r.fields?.length||r.fields.some(f=>!fields.includes(f))||!['canonicalId','reference','type','label','provenance'].every(f=>r.fields.includes(f))||r.locales?.join(',')!=='en,es'||!r.representationRevision||![r.sourceDependencyDigest,r.representationDigest].every(h=>/^[a-f0-9]{64}$/.test(h)))throw Error('PUBLICATION_UNAVAILABLE');ids.add(r.id);refs.add(r.reference)}
 const edges=new Set<string>();for(const edge of m.edges){const key=hash([edge.source,edge.target,edge.predicate]);if(!ids.has(edge.source)||!ids.has(edge.target)||!predicates.includes(edge.predicate)||edges.has(key)||edge.dependencyDigest!==key||edge.locales?.join(',')!=='en,es'||!['PUBLISHED','WITHDRAWN'].includes(edge.status))throw Error('PUBLICATION_UNAVAILABLE');edges.add(key)}
 for(const id of ids)if(m.edges.filter(e=>e.source===id).length>25)throw Error('PUBLICATION_UNAVAILABLE')
 return m
}
export function eligibleEntries(entries:Entry[],terms:DefinitionTerm[],m:PublicationManifest){
 validateManifest(m);const byId=new Map(terms.map(t=>[t.id,t]));
 return m.records.flatMap(record=>{
  const term=byId.get(record.id),entry=entries.find(e=>e.termId===record.id&&e.key===record.reference);
  if(record.status!=='PUBLISHED'||!term||!entry||entry.category!==record.category)return [];
  const doc=termDocumentation(term,byId);
  if(doc.status!=='VERIFIED_LOCAL'||doc.version!==record.representationRevision||sourceDependencyDigest(term,byId)!==record.sourceDependencyDigest||hash({names:entry.names,definitions:doc.definitions})!==record.representationDigest)return [];
  return [{entry:{...entry,definitions:doc.definitions},term,record}]
 })
}
