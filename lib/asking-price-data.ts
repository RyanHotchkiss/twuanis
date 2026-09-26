import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { resolveDtaGeography } from './geography/resolve-dta-geography'
import { readCanonicalListingEvidence, type CanonicalFact } from './canonical-listing-reader'
import { resolvePropertyAreaConstraint, resolveConstructionAreaConstraint } from './market-intelligence-area-ranges'
import { referenceTerms, decimal, compare, inside, contained } from './asking-price-question'
import { FACTS, SEMANTICS, type Question, type Label, type Catalog, type Option, type Constraint, type Fact } from './asking-price-contract'
const PAGE=500
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
function fail():never {throw new Error('Incomplete or incoherent market evidence')}
export function chunks<T>(xs:T[]):T[][]{const out:T[][]=[];for(let i=0;i<xs.length;i+=25)out.push(xs.slice(i,i+25));return out}
// Transport pages are never a population cap. Count drift/duplicates/order failures abort.
async function pages(query:(a:number,b:number)=>any,accept:(r:any)=>void):Promise<any[]> {
 let expected:number|null=null,offset=0;const rows:any[]=[]
 for(;;){const {data,count,error}=await query(offset,offset+PAGE-1)
  if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||expected!==null&&expected!==count||data.length>PAGE||offset+data.length>count||!data.length&&offset<count)fail()
  expected=count;for(const row of data){if(!row||typeof row!=='object')fail();accept(row);rows.push(row)}offset+=data.length;if(offset===count)return rows
 }
}
function label(r:any):Label {const fallback=typeof r.term_name==='string'?r.term_name.trim():'';const en=typeof r.term_name_en==='string'&&r.term_name_en.trim()||fallback,es=typeof r.term_name_es==='string'&&r.term_name_es.trim()||fallback;if(!en||!es)fail();return {en,es}}
const termColumns='id::text,term_type,level,official_code,parent_id::text,term_name,term_name_en,term_name_es'
export async function readAskingPriceCatalog():Promise<Catalog>{
 try{let last=BigInt(0);const types=['province','canton','district','property_type',...SEMANTICS,...FACTS]
 const rows=await pages((a,b)=>supabaseAdmin.from('ontology_terms').select(termColumns,{count:'exact'}).in('term_type',types).order('id').range(a,b),r=>{if(typeof r.id!=='string'||!/^[1-9]\d*$/.test(r.id)||BigInt(r.id)<=last||!types.includes(r.term_type))fail();last=BigInt(r.id)})
 const options:Option[]=rows.filter(r=>['province','canton','district'].includes(r.term_type)||r.level===1).map(r=>{
  const geo=['province','canton','district'].includes(r.term_type);if(geo&&typeof r.official_code!=='string'||r.parent_id!==null&&(typeof r.parent_id!=='string'||!/^\d+$/.test(r.parent_id)))fail()
  return {id:r.id,type:r.term_type,code:r.official_code??null,parentId:r.parent_id,...label(r)}
 });return {state:'ready',options}
 }catch{return {state:'unavailable'}}
}
export async function resolveReferences(q:Question):Promise<{geoId:string;labels:Record<string,Label>}>{
 const resolved=await resolveDtaGeography({[q.geography.level]:[q.geography.officialCode]},async()=>supabaseAdmin)
 const entity=resolved[q.geography.level]?.[0];if(!entity||entity.officialCode!==q.geography.officialCode)fail()
 const wanted=referenceTerms(q),labels:Record<string,Label>={},all=[entity.ontologyTermId,...wanted.keys()];const seen=new Set<string>()
 for(const ids of chunks(all)){let previous=BigInt(0);await pages((a,b)=>supabaseAdmin.from('ontology_terms').select(termColumns,{count:'exact'}).in('id',ids).order('id').range(a,b),r=>{
  if(typeof r.id!=='string'||!ids.includes(r.id)||seen.has(r.id)||BigInt(r.id)<=previous)fail();previous=BigInt(r.id);seen.add(r.id)
  if(r.id===entity.ontologyTermId){if(r.term_type!==q.geography.level||r.official_code!==q.geography.officialCode)fail();labels.geography=label(r)}
  else {if(r.term_type!==wanted.get(r.id)||r.level!==1)fail();labels[r.id]=label(r)}
 })}
 if(seen.size!==all.length)fail();return {geoId:entity.ontologyTermId,labels}
}
export async function acquireMarketIds(q:Question,geoId:string):Promise<string[]>{
 let previous='';const rows=await pages((a,b)=>supabaseAdmin.from('listings_ontology_terms')
 .select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)',{count:'exact'})
 .eq('ontology_term_id',geoId).eq('listings.canonical_domain_version',1).eq('listings.listing_status','active').eq('listings.transaction_type',q.transaction)
 .order('listing_id').order('ontology_term_id').range(a,b),r=>{
 if(typeof r.listing_id!=='string'||!UUID.test(r.listing_id)||r.listing_id<=previous||r.ontology_term_id!==geoId||r.listings?.canonical_domain_version!==1||r.listings?.listing_status!=='active'||r.listings?.transaction_type!==q.transaction)fail();previous=r.listing_id
 });return rows.map(r=>r.listing_id)
}
async function membership(ids:string[],terms:string[]):Promise<Set<string>>{
 const matched=new Set<string>()
 for(const batch of chunks(ids))for(const ts of chunks(terms)){let lastId='',lastTerm=BigInt(0)
 await pages((a,b)=>supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text',{count:'exact'}).in('listing_id',batch).in('ontology_term_id',ts).order('listing_id').order('ontology_term_id').range(a,b),r=>{
 if(!batch.includes(r.listing_id)||typeof r.ontology_term_id!=='string'||!ts.includes(r.ontology_term_id)||r.listing_id<lastId||r.listing_id===lastId&&BigInt(r.ontology_term_id)<=lastTerm)fail()
 lastId=r.listing_id;lastTerm=BigInt(r.ontology_term_id);matched.add(r.listing_id)
 })}return matched
}
export function matchesFact(f:CanonicalFact|undefined,dimension:Fact,cs:Constraint[]):boolean{
 if(!f)return false;if(f.dimension!==dimension)fail();if(f.kind==='category')return false
 const dec=(v:unknown)=>{const s=decimal(v);if(dimension!=='bathrooms'&&s.includes('.')||dimension==='year_built'&&(compare(s,'1')<0||compare(s,'9999')>0))fail();return s}
 if(f.kind==='exact'){const v=dec(f.exact_value);if(dimension==='bathrooms'&&v==='0')fail();return cs.some(c=>c.kind==='exact'?compare(v,c.value)===0:c.kind==='interval'&&inside(v,c.interval))}
 if(f.kind!=='range')fail();const r={lower:f.range_lower===null?null:dec(f.range_lower),upper:f.range_upper===null?null:dec(f.range_upper),lowerInclusive:f.lower_inclusive!,upperInclusive:f.upper_inclusive!}
 if(typeof r.lowerInclusive!=='boolean'||typeof r.upperInclusive!=='boolean'||r.lower===null&&r.lowerInclusive||r.upper===null&&r.upperInclusive||r.lower===null&&r.upper===null||r.lower!==null&&r.upper!==null&&(compare(r.lower,r.upper)>0||compare(r.lower,r.upper)===0&&!(r.lowerInclusive&&r.upperInclusive)))fail()
 return cs.some(c=>c.kind==='interval'&&contained(r,c.interval))
}
export async function constrainMarket(q:Question,starting:string[]):Promise<string[]>{
 let ids=starting
 const groups=[...(q.propertyType?[[q.propertyType]]:[]),...SEMANTICS.map(d=>q.filters.semantics[d]??[]).filter(x=>x.length)]
 for(const terms of groups){if(!ids.length)break;const matched=await membership(ids,terms);ids=ids.filter(id=>matched.has(id))}
 for(const d of FACTS){const cs=q.filters.facts[d];if(!cs?.length||!ids.length)continue;const matched=new Set<string>()
  if(cs.some(c=>c.kind!=='category')){const evidence=await readCanonicalListingEvidence(ids,{facts:[d],semantics:[]});for(const [id,row]of evidence)if(matchesFact(row.facts[0],d,cs))matched.add(id)}
  const terms=cs.flatMap(c=>c.kind==='category'?[c.termId]:[]);if(terms.length)for(const id of await membership(ids,terms))matched.add(id)
  ids=ids.filter(id=>matched.has(id))
 }
 for(const [key,field,resolve]of [['propertyArea','property_area',resolvePropertyAreaConstraint],['constructionArea','construction_area',resolveConstructionAreaConstraint]] as const){
  const selected=q.filters[key];if(!selected||!ids.length)continue;const bounds=resolve(selected);if(!bounds)fail();const kept=new Set<string>()
  for(const batch of chunks(ids)){let last='';const seen=new Set<string>();await pages((a,b)=>supabaseAdmin.from('listings').select('id,'+field+'::text',{count:'exact'}).in('id',batch).order('id').range(a,b),r=>{
   if(!batch.includes(r.id)||r.id<=last||seen.has(r.id))fail();last=r.id;seen.add(r.id)
   if(r[field]===null)return;const v=decimal(r[field]);if(compare(v,'0')<=0)fail()
   if((bounds.min===null||compare(v,String(bounds.min))>=0)&&(bounds.max===null||compare(v,String(bounds.max))<0))kept.add(r.id)
  });if(seen.size!==batch.length)fail()}ids=ids.filter(id=>kept.has(id))
 }return ids
}
export async function acquireMoney(q:Question,ids:string[]):Promise<any[]>{
 const result:any[]=[];const field=q.transaction==='sale'?'current_price':'monthly_price'
 for(const batch of chunks(ids)){let last='';const rows=await pages((a,b)=>supabaseAdmin.from('listings').select('id,canonical_domain_version,listing_status,transaction_type,currency,'+field+'::text',{count:'exact'}).in('id',batch).order('id').range(a,b),r=>{
 if(!batch.includes(r.id)||r.id<=last||r.canonical_domain_version!==1||r.listing_status!=='active'||r.transaction_type!==q.transaction)fail();last=r.id
 });if(rows.length!==batch.length)fail();result.push(...rows)}return result
}
