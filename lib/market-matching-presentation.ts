import 'server-only'
import { readCanonicalListingEvidence, type CanonicalEvidence } from './canonical-listing-reader'
import { supabaseAdmin } from './supabase-admin'
// Called only after complete ranking. Existing selected evidence is reused;
// missing card fields are acquired only for the displayed listing identities.
export async function matchingCardEvidence(ids:string[],existing:Map<string,CanonicalEvidence>,selectedFacts:readonly string[],language:'en'|'es'){
 if(!ids.length)return new Map<string,Record<string,string|null>>()
 const facts=['bedrooms','bathrooms'].filter(d=>!selectedFacts.includes(d))
 const evidence=await readCanonicalListingEvidence(ids,{facts,semantics:['property_type']})
 const terms=new Set<string>()
 for(const id of ids){const row=evidence.get(id);if(!row)throw Error('Missing matching card evidence.')
  row.selections.forEach(s=>terms.add(s.ontology_term_id))
  for(const f of [...row.facts,...(existing.get(id)?.facts??[])])if(['bedrooms','bathrooms'].includes(f.dimension)&&f.kind==='category')terms.add(f.category_term_id!)
 }
 const labels=new Map<string,string>(),all=[...terms]
 for(let i=0;i<all.length;i+=25){const batch=all.slice(i,i+25)
  const {data,error,count}=await supabaseAdmin.from('ontology_terms').select('id::text,term_name,term_name_en,term_name_es',{count:'exact'}).in('id',batch).order('id').limit(26)
  if(error||!data||count!==batch.length||data.length!==batch.length)throw Error('Incomplete matching card labels.')
  for(const row of data){if(!batch.includes(row.id)||labels.has(row.id))throw Error('Invalid matching card labels.');labels.set(row.id,(language==='es'?row.term_name_es:row.term_name_en)||row.term_name||'')}
 }
 return new Map(ids.map(id=>{const row=evidence.get(id)!,available=[...row.facts,...(existing.get(id)?.facts??[])]
  const fact=(dimension:string)=>{const f=available.find(f=>f.dimension===dimension);return f?.kind==='exact'?f.exact_value:f?.kind==='category'?labels.get(f.category_term_id!)??null:null}
  const geo=(dimension:string)=>{const t=row.geography.find(t=>t.term_type===dimension);return t?(language==='es'?t.term_name_es:t.term_name_en)||t.term_name:null}
  const property=row.selections.find(s=>s.dimension==='property_type')
  return[id,{province:geo('province'),canton:geo('canton'),property_type:property?labels.get(property.ontology_term_id)??null:null,bedrooms:fact('bedrooms'),bathrooms:fact('bathrooms')}]
 }))
}
