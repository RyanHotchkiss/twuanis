import 'server-only'
import {orchestratorMemo} from './orchestrator-execution-context'
import {recordAnalyticalEvidence} from './orchestrator-evidence-v2'
import { supabaseAdmin } from './supabase-admin'
import { validateOntologyTermId } from './geography/dta-identity'
import {readCanonicalListingEvidence,type CanonicalEvidence,type CanonicalFact} from './canonical-listing-reader'
import {COMPOSITION_NUMERICAL_CATEGORIES,type CompositionNumericalDimension} from './market-composition-category-contract'
import {evaluateCompositionNumericalCategory} from './canonical-market-numerical-evidence'
export const COMPOSITION_DIMENSIONS=['province','canton','district','property_type','bedrooms','bathrooms','parking','year_built','utility','environment','terrain','accessibility','legal_status'] as const
async function complete(query:(a:number,b:number)=>any){const rows:any[]=[];let n:number|null=null
 do{const {data,error,count}=await query(rows.length,rows.length+499)
 if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||n!==null&&count!==n||data.length>500||rows.length+data.length>count||!data.length&&rows.length<count)throw Error('Incomplete composition evidence.')
 n=count;rows.push(...data)
 }while(rows.length<n!);return rows
}
async function acquirePrevalenceInput(listingIds:string[],dimensions:readonly string[]){
 const ids=[...new Set(listingIds)];if(ids.length!==listingIds.length||dimensions.some(d=>!(COMPOSITION_DIMENSIONS as readonly string[]).includes(d))||new Set(dimensions).size!==dimensions.length)throw Error('Invalid composition identity.')
 if(!dimensions.length)return {ids,dimensions,counts:new Map<string,{dimension:string;ids:Set<string>}>(),represented:new Map<string,Set<string>>(),labels:new Map<string,{en:string;es:string}>()}
 const raw=await orchestratorMemo('private-prevalence-raw',JSON.stringify([ids,dimensions]),async()=>{
 const counts=new Map<string,{dimension:string;ids:Set<string>}>(),represented=new Map(dimensions.map(d=>[d,new Set<string>()]))

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
 return {ids,dimensions,counts,represented,labels}
 });return recordAnalyticalEvidence('private-prevalence-input',raw)
}
export async function canonicalMarketPrevalence(listingIds:string[],dimensions:readonly string[]=COMPOSITION_DIMENSIONS){
 const input=await acquirePrevalenceInput(listingIds,dimensions)
 return projectCanonicalPrevalence(input.ids,input.dimensions,input.counts,input.represented,input.labels)
}

export function projectCanonicalPrevalence(ids:readonly string[],dimensions:readonly string[],counts:Map<string,{dimension:string;ids:Set<string>}>,represented:Map<string,Set<string>>,labels:Map<string,{en:string;es:string}>){
 return {n:ids.length,dimensions:dimensions.map(d=>({dimension:d,denominatorN:ids.length,representedN:represented.get(d)!.size,
   unrepresentedN:ids.length-represented.get(d)!.size,terms:[...counts].filter(([,v])=>v.dimension===d)
   .map(([id,v])=>({termId:id,count:v.ids.size,percentage:ids.length?v.ids.size/ids.length*100:null,label:labels.get(id)!}))
   .sort((a,b)=>b.count-a.count||(BigInt(a.termId)<BigInt(b.termId)?-1:1))}))}
}


const numericalCompositionDimensions=['bedrooms','bathrooms','parking','year_built'] as const
// Canonical decimal identity only: trim insignificant zeros, never round or convert to Number.
function compositionDecimalIdentity(value:string|null):string {
 if(typeof value!=='string'||!/^\d+(?:\.\d+)?$/.test(value))throw Error('Invalid composition numerical identity.')
 const [whole,fraction='']=value.split('.'),w=whole.replace(/^0+(?=\d)/,''),f=fraction.replace(/0+$/,'')
 return w+(f?'.'+f:'')
}
function compositionShare(count:number,n:number):number|null{return n?count/n*100:null}
function distributionOrder(a:{key:string;count:number},b:{key:string;count:number}){return b.count-a.count||(a.key<b.key?-1:a.key>b.key?1:0)}
/** Pure server projection over one already authorized final population. All row groups overlap explicitly. */
export function projectCompositionNumericalDimension(dimension:CompositionNumericalDimension,ids:readonly string[],facts:ReadonlyMap<string,readonly CanonicalFact[]>,memberships:ReadonlyMap<string,ReadonlySet<string>>){
 if(new Set(ids).size!==ids.length||!numericalCompositionDimensions.includes(dimension))throw Error('Invalid composition numerical population.')
 const categories=COMPOSITION_NUMERICAL_CATEGORIES.filter(c=>c.dimension===dimension)
 const categoryRows=categories.map(c=>({termId:c.termId,label:c.label,count:0,percentage:null as number|null,nonmatchCount:0,unknownCount:0}))
 const exact=new Map<string,{value:string;ids:Set<string>}>()
 const ranges=new Map<string,{lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean;ids:Set<string>}>()
 let recordedEvidenceN=0,exactFactN=0,rangeFactN=0,categoryFactN=0,positiveMembershipN=0,categoryEstablishedN=0,recordedButUnclassifiedN=0
 for(const id of ids){
  const evidence=facts.get(id);if(!evidence)throw Error('Incomplete composition numerical evidence.')
  const selected=evidence.filter(f=>f.dimension===dimension)
  if(selected.length>1)throw Error('Duplicate composition numerical fact.')
  const fact=selected[0],positive=[...(memberships.get(id)??[])];let established=false
  if(fact||positive.length)recordedEvidenceN++
  if(positive.length)positiveMembershipN++
  if(fact?.kind==='exact'){
   exactFactN++;const value=compositionDecimalIdentity(fact.exact_value)
   const entry=exact.get(value)??{value,ids:new Set<string>()};entry.ids.add(id);exact.set(value,entry)
  }else if(fact?.kind==='range'){
   rangeFactN++
   if(typeof fact.lower_inclusive!=='boolean'||typeof fact.upper_inclusive!=='boolean')throw Error('Invalid composition range identity.')
   const lower=fact.range_lower===null?null:compositionDecimalIdentity(fact.range_lower),upper=fact.range_upper===null?null:compositionDecimalIdentity(fact.range_upper)
   const key=JSON.stringify([lower,upper,fact.lower_inclusive,fact.upper_inclusive])
   const entry=ranges.get(key)??{lower,upper,lowerInclusive:fact.lower_inclusive,upperInclusive:fact.upper_inclusive,ids:new Set<string>()};entry.ids.add(id);ranges.set(key,entry)
  }else if(fact?.kind==='category')categoryFactN++
  else if(fact)throw Error('Invalid composition fact kind.')
  for(const row of categoryRows){
   const outcome=evaluateCompositionNumericalCategory(row.termId,fact,positive.includes(row.termId)?[row.termId]:[]).state
   if(outcome==='MATCH'){row.count++;established=true}else if(outcome==='NONMATCH')row.nonmatchCount++;else row.unknownCount++
  }
  if(established)categoryEstablishedN++;else if(fact||positive.length)recordedButUnclassifiedN++
 }
 for(const row of categoryRows)row.percentage=compositionShare(row.count,ids.length)
 categoryRows.sort((a,b)=>b.count-a.count||(BigInt(a.termId)<BigInt(b.termId)?-1:1))
 return {dimension,denominatorN:ids.length,representedN:categoryEstablishedN,unrepresentedN:ids.length-categoryEstablishedN,terms:categoryRows,
  numerical:{overlappingGroups:true as const,exactValues:[...exact].map(([key,x])=>({key,kind:'exact' as const,value:x.value,count:x.ids.size,percentage:compositionShare(x.ids.size,ids.length)})).sort(distributionOrder),
   ranges:[...ranges].map(([key,x])=>({key,kind:'range' as const,lower:x.lower,upper:x.upper,lowerInclusive:x.lowerInclusive,upperInclusive:x.upperInclusive,count:x.ids.size,percentage:compositionShare(x.ids.size,ids.length)})).sort(distributionOrder),
   coverage:{recordedEvidenceN,missingEvidenceN:ids.length-recordedEvidenceN,exactFactN,rangeFactN,categoryFactN,positiveMembershipN,categoryEstablishedN,categoryUnestablishedN:ids.length-categoryEstablishedN,recordedButUnclassifiedN,recordedEvidencePercentage:compositionShare(recordedEvidenceN,ids.length),missingEvidencePercentage:compositionShare(ids.length-recordedEvidenceN,ids.length),categoryEstablishedPercentage:compositionShare(categoryEstablishedN,ids.length),categoryUnestablishedPercentage:compositionShare(ids.length-categoryEstablishedN,ids.length)}}}
}
/** Composition-only acquisition/projection. No new population query, persistent cache or derived write. */
export async function canonicalNumericalMarketComposition(listingIds:string[],prior:Readonly<{evidence:ReadonlyMap<string,CanonicalEvidence>;factDimensions:readonly string[]}>){
 if(new Set(listingIds).size!==listingIds.length||new Set(prior.factDimensions).size!==prior.factDimensions.length)throw Error('Invalid composition acquisition identity.')
 const needed=numericalCompositionDimensions.filter(d=>!prior.factDimensions.includes(d))
 // An absent fact in a complete envelope is genuinely unrecorded; an absent envelope is a failed read.
 if(prior.factDimensions.some(d=>numericalCompositionDimensions.includes(d as CompositionNumericalDimension))&&listingIds.some(id=>!prior.evidence.has(id)))throw Error('Incomplete reused composition evidence.')
 const additional=needed.length&&listingIds.length?await readCanonicalListingEvidence(listingIds,{facts:[...needed],semantics:[]}):new Map<string,CanonicalEvidence>()
 const facts=new Map<string,readonly CanonicalFact[]>()
 for(const id of listingIds){
  if(needed.length&&!additional.has(id))throw Error('Incomplete additional composition evidence.')
  const reused=prior.evidence.get(id)?.facts.filter(f=>prior.factDimensions.includes(f.dimension)&&numericalCompositionDimensions.includes(f.dimension as CompositionNumericalDimension))??[]
  facts.set(id,[...reused,...(additional.get(id)?.facts??[])])
 }
 const input=await acquirePrevalenceInput(listingIds,COMPOSITION_DIMENSIONS)
 const original=projectCanonicalPrevalence(input.ids,input.dimensions,input.counts,input.represented,input.labels)
 return {n:original.n,dimensions:original.dimensions.map(d=>{
  if(!numericalCompositionDimensions.includes(d.dimension as CompositionNumericalDimension))return d
  const membership=new Map(listingIds.map(id=>[id,new Set<string>()]))
  for(const [termId,count]of input.counts)if(count.dimension===d.dimension)for(const id of count.ids)membership.get(id)!.add(termId)
  return projectCompositionNumericalDimension(d.dimension as CompositionNumericalDimension,listingIds,facts,membership)
 })}
}
