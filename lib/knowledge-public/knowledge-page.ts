import 'server-only'
import {cache} from 'react'
import type {Metadata, MetadataRoute} from 'next'
import {readPublicationPolicy} from '@/lib/knowledge-public/runtime'
import {eligibleEntries,validateManifest,hash} from '@/lib/knowledge-public/publication'
import {publicCanonicalClient} from '@/lib/knowledge-public/source'
import {readTermKnowledge,verifyTermKnowledgeRevision,readApprovedCanonicalEdges} from '@/lib/knowledge-repository/terms'
import {href,parseQuery,type Locale} from '@/lib/knowledge-repository/core'
import {ontologyId,termSetId} from '@/lib/schema/buildOntologyNode'
const SITE='https://twuanis.com'
export type KnowledgeInput=Record<string,string|string[]|undefined>
/** One request-scoped, fail-closed eligibility boundary for graph, metadata and sitemap. */
export const readPublishedKnowledge=cache(async()=>{
 try{
  const policy=validateManifest(readPublicationPolicy()),signal=AbortSignal.timeout(5000),client=publicCanonicalClient()
  const snapshot=await readTermKnowledge(signal,client)
  const eligible=eligibleEntries(snapshot.entries,snapshot.allTerms,policy)
  if(!await verifyTermKnowledgeRevision(snapshot.sourceFingerprint,signal,client)||hash(readPublicationPolicy())!==hash(policy))throw Error('SOURCE_CHANGED')
  return {eligible,policy}
 }catch{return null}
})
export function conceptReference(input:KnowledgeInput){
 const keys=Object.keys(input).filter(k=>input[k]!==undefined)
 // Search, relationship navigation and query aliases remain excluded from indexing.
 return keys.length===1&&keys[0]==='entry'&&typeof input.entry==='string'&&input.entry.length<=240?input.entry:null
}
export async function publishedConcept(input:KnowledgeInput){
 const reference=conceptReference(input);if(!reference)return null
 const source=await readPublishedKnowledge();if(!source)return null
 const selected=source.eligible.find(x=>x.entry.key===reference)
 return selected?{...source,selected}:null
}
const indexTitle=(l:Locale)=>l==='en'?'Knowledge Repository | Twuanis':'Repositorio de conocimiento | Twuanis'
function indexAlternates(values:Record<string,string|number|undefined>={}){return {languages:{en:SITE+href('en',values),es:SITE+href('es',values)}}}
/** Index only the public directory and individually approved concepts; browse variants remain crawlable. */
export async function knowledgeMetadata(l:Locale,input:KnowledgeInput):Promise<Metadata>{
 if(Object.keys(input).filter(k=>input[k]!==undefined).length===0)return {title:indexTitle(l),description:l==='en'?'Explore verified geography, property terminology and analytical knowledge from Twuanis.':'Explore la geografía, la terminología inmobiliaria y el conocimiento analítico verificados de Twuanis.',robots:{index:true,follow:true},alternates:{canonical:SITE+href(l),...indexAlternates()}}
 const concept=await publishedConcept(input)
 if(concept){const {entry}=concept.selected;return {title:entry.names[l]+' | Twuanis',description:entry.definitions[l]!,robots:{index:true,follow:true},alternates:{canonical:SITE+href(l,{entry:entry.key}),...indexAlternates({entry:entry.key})}}}
 try{
  const q=parseQuery(input)
  if(q.entry){
   const approved=await publishedConcept({entry:q.entry})
   return {title:indexTitle(l),robots:{index:false,follow:!!approved},alternates:approved?{canonical:SITE+href(l,{entry:q.entry}),...indexAlternates({entry:q.entry})}:{canonical:null,languages:{}}}
  }
  // Canonicalize equivalent defaults, but never canonicalize distinct result pages to page one.
  const values={q:q.q||undefined,category:q.category||undefined,view:q.view==='glossary'?'glossary':undefined,page:q.page>1?q.page:undefined}
  return {title:indexTitle(l),robots:{index:false,follow:true},alternates:{canonical:SITE+href(l,values),...indexAlternates(values)}}
 }catch{return {title:indexTitle(l),robots:{index:false,follow:false},alternates:{canonical:null,languages:{}}}}
}

export function conceptGraph(concept:NonNullable<Awaited<ReturnType<typeof publishedConcept>>>,l:Locale){
 const {entry,term,record}=concept.selected,id=ontologyId(term),url=SITE+href(l,{entry:entry.key}),set=termSetId(term.term_type)
 return {'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url,url,inLanguage:l,name:entry.names[l],mainEntity:{'@id':id}},
  {'@type':'DefinedTerm','@id':id,name:entry.names[l],...(record.fields.includes('definition')?{description:entry.definitions[l]}:{}),termCode:term.id,inDefinedTermSet:{'@id':set},subjectOf:record.locales.map(locale=>({'@id':SITE+href(locale,{entry:entry.key})}))},
  {'@type':'DefinedTermSet','@id':set}
 ]}
}
export async function conceptRelationships(concept:NonNullable<Awaited<ReturnType<typeof publishedConcept>>>){
 const {selected,eligible,policy}=concept,allowed=policy.edges.filter(e=>e.status==='PUBLISHED'&&e.source===selected.term.id&&eligible.some(x=>x.term.id===e.target))
 const signal=AbortSignal.timeout(5000),client=publicCanonicalClient()
 const first=await readApprovedCanonicalEdges(selected.term.id,allowed,signal,client)
 const second=allowed.length?await readApprovedCanonicalEdges(selected.term.id,allowed,signal,client):first
 const key=(rows:typeof first)=>JSON.stringify(rows)
 if(key(first)!==key(second))throw Error('RELATIONSHIPS_CHANGED')
 return first.filter(row=>allowed.some(e=>e.source===row.source_term_id&&e.target===row.target_term_id&&e.predicate===row.relationship_type)).map(row=>({predicate:row.relationship_type,target:eligible.find(x=>x.term.id===row.target_term_id)!.entry}))
}
export async function knowledgeSitemapEntries():Promise<MetadataRoute.Sitemap>{
 const indexes:MetadataRoute.Sitemap=(['en','es'] as Locale[]).map(l=>({url:SITE+href(l),changeFrequency:'weekly',priority:0.7,alternates:indexAlternates()}))
 const source=await readPublishedKnowledge();if(!source)return indexes
 return [...indexes,...source.eligible.flatMap(({entry,record})=>record.locales.map(l=>({url:SITE+href(l,{entry:entry.key}),changeFrequency:'weekly' as const,priority:0.6,alternates:{languages:{en:SITE+href('en',{entry:entry.key}),es:SITE+href('es',{entry:entry.key})}}})))]
}
