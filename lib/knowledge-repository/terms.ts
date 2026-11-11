import 'server-only'
import {createHash} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {validateGeographicRow} from '@/lib/geography/dta-identity'
import type {Category,Entry} from './core'
import {termDocumentation,publicRootCategory,relationshipDocumentation} from './definitions'
const TERM_FIELDS='id::text,parent_id::text,term_type,term_name,term_name_en,term_name_es,slug,slug_en,slug_es,official_code,level,description'
const TYPES=['root','country','province','canton','district','property_type','bedrooms','bathrooms','parking','year_built','property_area','construction_area','utility','environment','accessibility','terrain','legal_status']
export const PREDICATES=['is_part_of','can_be_described_by','can_contain_property_type']
export type Term={id:string;parent_id:string|null;term_type:string;term_name:string;term_name_en:string;term_name_es:string;slug:string;slug_en:string;slug_es:string;official_code:string|null;level:number|null;description:string|null}
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const names=(en:string,es:string)=>({en,es})
const termKey=(t:Term)=>'term:'+t.term_type+':'+(t.slug_en||t.slug)
export function goodTerm(t:Term){
 if(!t||typeof t.id!=='string'||!/^\d+$/.test(t.id)||!TYPES.includes(t.term_type)||!t.term_name_en||!t.term_name_es||!t.slug_en||!t.slug_es||!/^[-a-z0-9]+$/.test(t.slug_en))return false
 if(['province','canton','district'].includes(t.term_type))try{validateGeographicRow(t,t.term_type as 'province'|'canton'|'district')}catch{return false}
 return true
}
// A fresh signal also opts each consistency read out of Next GET request deduplication.
export async function terms(signal?:AbortSignal,client=supabaseAdmin){const r=await client.from('ontology_terms').select(TERM_FIELDS).abortSignal(signal??AbortSignal.timeout(5000)).order('id').range(0,750);if(r.error||!Array.isArray(r.data)||r.data.length>750)throw Error('SOURCE_UNAVAILABLE');const rows=r.data as unknown as Term[];const supported=rows.filter(t=>TYPES.includes(t.term_type));if(supported.some(t=>!goodTerm(t))||new Set(supported.map(t=>t.id)).size!==supported.length)throw Error('SOURCE_UNAVAILABLE');const map=new Map(rows.map(t=>[t.id,t]));for(const t of supported.filter(v=>['province','canton','district'].includes(v.term_type))){const p=t.parent_id?map.get(t.parent_id):undefined;const parentType={province:'country',canton:'province',district:'canton'}[t.term_type];if(!p||p.term_type!==parentType||(t.term_type!=='province'&&!t.official_code?.startsWith(p.official_code||'INVALID')))throw Error('SOURCE_UNAVAILABLE')}return rows}
/** One existing term projection shared by repository and public consumer. */
export function projectTerms(allTerms:Term[]){
 const sourceMap=new Map(allTerms.map(t=>[t.id,t]));const good=allTerms.filter(t=>goodTerm(t)&&(t.term_type!=='root'||publicRootCategory(t,sourceMap)!==null)),byId=new Map(good.map(t=>[t.id,t])),entries:Entry[]=[],byTerm=new Map<string,Entry>()
 const add=(e:Entry)=>{if(entries.some(x=>x.key===e.key))throw Error('DUPLICATE_REFERENCE');entries.push(e)}
 for(const t of good){
  const category:Category=t.term_type==='root'?publicRootCategory(t,sourceMap)!:['country','province','canton','district'].includes(t.term_type)?'geography':t.term_type==='property_type'?'classification':'characteristics'
  const doc=termDocumentation(t,sourceMap)
  const e:Entry={key:termKey(t),category,names:names(t.term_name_en,t.term_name_es),aliases:[t.term_name,t.slug,t.slug_en,t.slug_es,t.term_type].filter(Boolean),definitions:doc.status==='VERIFIED_LOCAL'?doc.definitions:{en:t.description||null,es:null},sourceText:t.description||undefined,authority:'ontology_terms',version:doc.status==='VERIFIED_LOCAL'?doc.version:'current',definitionStatus:doc.status,links:[],termId:t.id}
  if(t.official_code)e.sections=[{title:names('Official geographic code','Código geográfico oficial'),text:t.official_code,lang:'en'}]
  byTerm.set(t.id,e);add(e)
 }
 for(const t of good){const e=byTerm.get(t.id)!,parent=t.parent_id?byTerm.get(t.parent_id):undefined;if(parent)e.links.push({kind:'canonical',label:names('Parent: '+parent.names.en,'Superior: '+parent.names.es),target:parent.key});for(const child of good.filter(v=>v.parent_id===t.id)){const x=byTerm.get(child.id)!;e.links.push({kind:'canonical',label:names('Child: '+x.names.en,'Subordinado: '+x.names.es),target:x.key})}
  add({key:'relations:'+termKey(t),category:'relationships',names:names('Relationships: '+e.names.en,'Relaciones: '+e.names.es),aliases:e.aliases,definitions:names('Navigation view of separately verified canonical relationships for '+e.names.en+'. This view is not a relationship predicate or a new canonical entity.','Vista de navegación de relaciones canónicas verificadas por separado para '+e.names.es+'. Esta vista no es un predicado de relación ni una entidad canónica nueva.'),definitionStatus:'NAVIGATION_VIEW',authority:'ontology_relationships / ontology_terms',version:'current',links:[{kind:'navigation',label:e.names,target:e.key}],termId:t.id})
 }
 for(const predicate of relationshipDocumentation())add({key:'predicate:'+predicate.predicate,category:'relationships',names:predicate.names,aliases:[predicate.predicate],definitions:predicate.definitions,definitionStatus:'VERIFIED_LOCAL',authority:'ontology_relationships / ontology_terms',version:predicate.documentationRevision,links:[]})
 return {good,byId,entries,add}
}
/** Term-only composition: no methodology, Package, listing or analytical acquisition. */
export async function readTermKnowledge(signal:AbortSignal,client=supabaseAdmin){
 const allTerms=await terms(signal,client),{good,byId,entries}=projectTerms(allTerms)
 return {entries:entries.filter(e=>e.key.startsWith('term:')),terms:good,allTerms,byId,sourceFingerprint:digest(allTerms),observedAt:new Date().toISOString(),queryCount:1}
}
export async function verifyTermKnowledgeRevision(expected:string,signal:AbortSignal,client=supabaseAdmin){return digest(await terms(signal,client))===expected}
/** Exact approved tuple acquisition over existing canonical edge authority, bounded25. */
export async function readApprovedCanonicalEdges(termId:string,allowed:{source:string;target:string;predicate:string}[],signal:AbortSignal,client=supabaseAdmin){
 if(!/^\d+$/.test(termId)||allowed.length>25||allowed.some(e=>e.source!==termId||!/^\d+$/.test(e.target)||!PREDICATES.includes(e.predicate)))throw Error('INVALID_REFERENCE')
 if(!allowed.length)return []
 const filter=allowed.map(e=>'and(target_term_id.eq.'+e.target+',relationship_type.eq.'+e.predicate+')').join(',')
 const r=await client.from('ontology_relationships').select('source_term_id::text,target_term_id::text,relationship_type').eq('source_term_id',termId).or(filter).order('source_term_id').order('target_term_id').order('relationship_type').range(0,25).abortSignal(signal)
 if(r.error||!Array.isArray(r.data)||r.data.length>25)throw Error('RELATIONSHIPS_UNAVAILABLE')
 return r.data as unknown as {source_term_id:string;target_term_id:string;relationship_type:string}[]
}
