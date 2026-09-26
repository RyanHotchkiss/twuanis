import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { validateOntologyTermId } from './geography/dta-identity'
export const COMPOSITION_DIMENSIONS=['province','canton','district','property_type','bedrooms','bathrooms','parking','year_built','utility','environment','terrain','accessibility','legal_status'] as const
async function complete(query:(a:number,b:number)=>any){const rows:any[]=[];let n:number|null=null
 do{const {data,error,count}=await query(rows.length,rows.length+499)
 if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||n!==null&&count!==n||data.length>500||rows.length+data.length>count||!data.length&&rows.length<count)throw Error('Incomplete composition evidence.')
 n=count;rows.push(...data)
 }while(rows.length<n!);return rows
}
export async function canonicalMarketPrevalence(listingIds:string[],dimensions:readonly string[]=COMPOSITION_DIMENSIONS){
 const ids=[...new Set(listingIds)];if(ids.length!==listingIds.length||dimensions.some(d=>!(COMPOSITION_DIMENSIONS as readonly string[]).includes(d))||new Set(dimensions).size!==dimensions.length)throw Error('Invalid composition identity.')
 const counts=new Map<string,{dimension:string;ids:Set<string>}>(),represented=new Map(dimensions.map(d=>[d,new Set<string>()]))
 if(!dimensions.length)return {n:ids.length,dimensions:[]}
 for(let a=0;a<ids.length;a+=25){const batch=ids.slice(a,a+25),seen=new Set<string>()
 const rows=await complete((from,to)=>supabaseAdmin.from('listings_ontology_terms')
   .select('listing_id,ontology_term_id::text,ontology_terms!inner(id::text,term_type,level)',{count:'exact'})
   .in('listing_id',batch).in('ontology_terms.term_type',[...dimensions]).order('listing_id').order('ontology_term_id').range(from,to))
 for(const row of rows){const term=row.ontology_terms;validateOntologyTermId(row.ontology_term_id)
  if(!batch.includes(row.listing_id)||!term||Array.isArray(term)||term.id!==row.ontology_term_id||!dimensions.includes(term.term_type))throw Error('Invalid composition evidence.')
  // Flat semantic roots are taxonomy, not property evidence.
  if(!['province','canton','district'].includes(term.term_type)&&term.level!==1)continue
  const key=row.listing_id+':'+row.ontology_term_id;if(seen.has(key))throw Error('Duplicate composition evidence.');seen.add(key)
  const entry=counts.get(row.ontology_term_id)??{dimension:term.term_type,ids:new Set<string>()}
  if(entry.dimension!==term.term_type)throw Error('Conflicting composition identity.')
  entry.ids.add(row.listing_id);counts.set(row.ontology_term_id,entry);represented.get(term.term_type)!.add(row.listing_id)
 }
 }
 // Labels are attached only after every numerator has been established by ID.
 const termIds=[...counts.keys()],labels=new Map<string,{en:string;es:string}>()
 for(let a=0;a<termIds.length;a+=25){const batch=termIds.slice(a,a+25)
 const rows=await complete((from,to)=>supabaseAdmin.from('ontology_terms').select('id::text,term_type,term_name,term_name_en,term_name_es',{count:'exact'}).in('id',batch).order('id').range(from,to))
 for(const r of rows){if(!batch.includes(r.id)||labels.has(r.id)||counts.get(r.id)!.dimension!==r.term_type)throw Error('Incomplete composition labels.')
 labels.set(r.id,{en:r.term_name_en||r.term_name||'',es:r.term_name_es||r.term_name||''})}
 if(batch.some(id=>!labels.has(id)))throw Error('Missing composition label identity.')
 }
 return {n:ids.length,dimensions:dimensions.map(d=>({dimension:d,denominatorN:ids.length,representedN:represented.get(d)!.size,
   unrepresentedN:ids.length-represented.get(d)!.size,terms:[...counts].filter(([,v])=>v.dimension===d)
   .map(([id,v])=>({termId:id,count:v.ids.size,percentage:ids.length?v.ids.size/ids.length*100:null,label:labels.get(id)!}))
   .sort((a,b)=>b.count-a.count||(BigInt(a.termId)<BigInt(b.termId)?-1:1))}))}
}
