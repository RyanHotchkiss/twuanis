import 'server-only'
import { supabaseAdmin } from './supabase-admin'
// Only selected classification identities are acquired, once per bounded chunk.
export async function positiveClassifications(ids:string[],terms:string[]){
  const result=new Map(ids.map(id=>[id,new Set<string>()]));if(!terms.length)return result
  for(let a=0;a<ids.length;a+=25)for(let b=0;b<terms.length;b+=25){
    const batch=ids.slice(a,a+25),selected=terms.slice(b,b+25);let offset=0,total:number|null=null;const seen=new Set<string>()
    do{
      const {data,error,count}=await supabaseAdmin.from('listings_ontology_terms')
        .select('listing_id,ontology_term_id::text',{count:'exact'}).in('listing_id',batch).in('ontology_term_id',selected)
        .order('listing_id').order('ontology_term_id').range(offset,offset+499)
      if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count===null||count<0||total!==null&&count!==total||data.length>500||offset+data.length>count||!data.length&&offset<count)throw Error('Incomplete selected classification evidence.')
      total=count
      for(const r of data){const key=r.listing_id+':'+r.ontology_term_id
        if(!batch.includes(r.listing_id)||!selected.includes(r.ontology_term_id)||seen.has(key))throw Error('Invalid selected classification evidence.')
        seen.add(key);result.get(r.listing_id)!.add(r.ontology_term_id)
      }
      offset+=data.length
    }while(offset<total!)
  }return result
}
