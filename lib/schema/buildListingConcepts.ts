import 'server-only'
import {validateCanonicalEvidence,type CanonicalEvidence} from '@/lib/canonical-listing-reader'
import {conceptGraph,type readPublishedKnowledge} from '@/lib/knowledge-public/knowledge-page'
import {ontologyId} from './buildOntologyNode'
export type ListingConceptProjection={classification:{'@id':string}|null;properties:Record<string,unknown>[];references:{'@id':string}[];nodes:Record<string,unknown>[]}
/** Direct canonical evidence only. Public eligibility is shared with Knowledge pages. */
export function buildListingConcepts(evidence:CanonicalEvidence|undefined,source:Awaited<ReturnType<typeof readPublishedKnowledge>>,lang:'en'|'es'):ListingConceptProjection{
 const result:ListingConceptProjection={classification:null,properties:[],references:[],nodes:[]}
 if(!evidence||!source)return result
 try{validateCanonicalEvidence(evidence)}catch{return result}
 const byId=new Map(source.eligible.map(x=>[x.term.id,x])),selected=new Map<string,typeof source.eligible[number]>()
 for(const s of evidence.selections){
  const item=byId.get(s.ontology_term_id)
  if(!item||item.term.term_type!==s.dimension||item.term.level!==s.level||item.term.slug!==s.slug||item.term.term_name!==s.term_name)continue
  const ref={'@id':ontologyId(item.term)};selected.set(item.term.id,item)
  if(s.dimension==='property_type')result.classification=ref
  else result.properties.push({'@type':'PropertyValue',propertyID:s.dimension,value:item.entry.names[lang],valueReference:ref})
 }
 for(const f of evidence.facts){
  if(f.kind!=='category'||!f.category_term_id)continue
  const item=byId.get(f.category_term_id)
  if(!item||item.term.term_type!==f.dimension)continue
  selected.set(item.term.id,item)
  result.properties.push({'@type':'PropertyValue',propertyID:f.dimension,value:item.entry.names[lang],valueReference:{'@id':ontologyId(item.term)}})
 }
 for(const g of evidence.geography){
  const item=byId.get(g.id)
  if(!item||item.term.term_type!==g.term_type||item.term.official_code!==g.official_code||item.term.parent_id!==g.parent_id)continue
  selected.set(item.term.id,item)
 }
 // Only directly referenced concepts and their existing bounded page/set representations.
 const nodes=new Map<string,Record<string,unknown>>()
 for(const item of selected.values()){
  result.references.push({'@id':ontologyId(item.term)})
  for(const node of conceptGraph({...source,selected:item},lang)['@graph'])nodes.set(node['@id'],node)
 }
 result.nodes=[...nodes.values()]
 return result
}
