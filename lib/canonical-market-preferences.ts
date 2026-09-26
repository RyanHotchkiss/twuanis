import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { readCanonicalListingEvidence, type CanonicalEvidence } from './canonical-listing-reader'
import type { CanonicalMarketRequest } from './canonical-market-request'
import { evaluateMarketYearBuilt } from './market-year-built-constraint'
import { evaluateMarketRoadDistance, type EvidenceState } from './canonical-market-numerical-evidence'
export type AtomicPreferenceEvidence=Readonly<{dimension:string;identity:string;label:string;state:EvidenceState}>
const numericalCategories=new Set(['bedrooms','bathrooms','parking'])
// Only selected classification identities are acquired, once per bounded chunk.
async function positiveClassifications(ids:string[],terms:string[]){
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
export async function acquireMarketPreferenceEvidence(request:CanonicalMarketRequest,ids:string[]){
  const selected=request.terms.filter(t=>t.dimension!=='property_type')
  const facts=[...new Set([...selected.filter(t=>numericalCategories.has(t.dimension)).map(t=>t.dimension),...(request.year?['year_built']:[]),...(request.road?['distance_to_paved_road']:[])])]
  const semantics=[...new Set(selected.filter(t=>!numericalCategories.has(t.dimension)).map(t=>t.dimension))]
  const canonical=facts.length||semantics.length?await readCanonicalListingEvidence(ids,{facts,semantics}):new Map<string,CanonicalEvidence>()
  const classifications=await positiveClassifications(ids,selected.filter(t=>numericalCategories.has(t.dimension)).map(t=>t.id))
  return {canonical,classifications}
}
export function evaluateMarketPreferences(request:CanonicalMarketRequest,row:Record<string,any>,evidence:Awaited<ReturnType<typeof acquireMarketPreferenceEvidence>>):AtomicPreferenceEvidence[]{
  const facts=evidence.canonical.get(row.id)?.facts??[],selections=evidence.canonical.get(row.id)?.selections??[]
  const output:AtomicPreferenceEvidence[]=request.terms.filter(t=>t.dimension!=='property_type').map(t=>{
    let state:EvidenceState='UNKNOWN'
    if(numericalCategories.has(t.dimension)){
      const fact=facts.find(f=>f.dimension===t.dimension)
      if(evidence.classifications.get(row.id)?.has(t.id)||fact?.kind==='category'&&fact.category_term_id===t.id)state='MATCH'
      else if(fact?.kind==='category')state='NONMATCH'
    }else{
      const actual=selections.filter(s=>s.dimension===t.dimension)
      if(actual.some(s=>s.ontology_term_id===t.id))state='MATCH'
      // Legal status is the only selected soft semantic dimension whose frozen
      // canonical contract establishes one exclusive current selection.
      else if(t.dimension==='legal_status'&&actual.length===1)state='NONMATCH'
    }
    return {dimension:t.dimension,identity:t.id,label:t.label,state}
  })
  for(const [dimension,r]of [['property_area',request.propertyArea],['construction_area',request.constructionArea]]as const)if(r){
    const value=row[dimension];const numeric=(typeof value==='number'||typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value))?Number(value):null
    const state:EvidenceState=numeric===null||!Number.isFinite(numeric)||numeric<=0?'UNKNOWN':
      (r.min===null||numeric>=r.min)&&(r.max===null||numeric<r.max)?'MATCH':'NONMATCH'
    output.push({dimension,identity:JSON.stringify(r),label:dimension,state})
  }
  if(request.year)output.push({dimension:'year_built',identity:JSON.stringify(request.year.interval),label:'year_built',state:evaluateMarketYearBuilt(request.year,facts.find(f=>f.dimension==='year_built')).state})
  if(request.road)output.push({dimension:'distance_to_paved_road',identity:JSON.stringify(request.road),label:'distance_to_paved_road',state:evaluateMarketRoadDistance(request.road,facts.find(f=>f.dimension==='distance_to_paved_road'))})
  return output
}
export function rankMarketPreferences(rows:readonly {id:string;preferences:readonly AtomicPreferenceEvidence[]}[]){
  return rows.map(row=>{
    const confirmedMatches=row.preferences.filter(p=>p.state==='MATCH').length
    const confirmedNonmatches=row.preferences.filter(p=>p.state==='NONMATCH').length
    const unknown=row.preferences.length-confirmedMatches-confirmedNonmatches
    const known=confirmedMatches+confirmedNonmatches
    return {...row,confirmedMatches,confirmedNonmatches,unknown,matchScore:known?confirmedMatches/known*100:null,
      matchState:known?'ESTABLISHED':'NO_EVALUABLE_MATCH_EVIDENCE'}
  }).sort((a,b)=>(b.matchScore??-1)-(a.matchScore??-1)||b.confirmedMatches-a.confirmedMatches||(a.id<b.id?-1:a.id>b.id?1:0))
}
