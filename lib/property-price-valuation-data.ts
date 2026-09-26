import 'server-only'
import {supabaseAdmin} from './supabase-admin'
import {readCanonicalListingEvidence} from './canonical-listing-reader'
import {validateGeographicRow} from './geography/dta-identity'
import {resolvePriceMeterAreaIdentity,resolvePriceMeterPropertyBasis} from './price-meter-identity'
import {resolveSingleRange} from './price-meter-comparable-subject-identity'
import {PRICE_METER_COMPARABLE_DIMENSION_ORDER} from './price-meter-comparable-dimensions'
import {matchesStructuralComparableBase,matchesStructuralComparableDimension,resolveStructuralComparableDimensions,intersectStructuralComparables} from './structural-comparable-population'
import type {StructuralComparableQuestion,PriceMeterComparableActiveDimension} from './structural-comparable-population'
import type {PriceMeterCharacteristicIdentity} from './price-meter-characteristic-identity'
import type {CanonicalGeographyTerm} from './geography/canonical-geography'
import type {Question,Option,Level,Dimension} from './property-price-valuation-contract'
import {listingIdPattern,invalid} from './property-price-valuation-question'
export class ValuationSubjectUnavailable extends Error{}
export class IncompleteValuationEvidence extends Error{}
export class InsufficientValuationEvidence extends Error{}
const PAGE=500
const TYPES=['province','canton','district','property_type',...PRICE_METER_COMPARABLE_DIMENSION_ORDER.filter(d=>d!=='construction_land')]
const TERM_COLUMNS='id::text,parent_id::text,term_type,level,official_code,term_name,term_name_en,term_name_es,slug,slug_en,slug_es'
function fail():never{throw new IncompleteValuationEvidence('Incomplete or incoherent comparable evidence')}
export function batches<T>(xs:T[]):T[][]{const out:T[][]=[];for(let i=0;i<xs.length;i+=25)out.push(xs.slice(i,i+25));return out}
export async function completeValuationRows(query:(a:number,b:number)=>any,accept:(r:any)=>void):Promise<any[]>{
 let expected:number|null=null,offset=0;const rows:any[]=[]
 for(;;){const {data,count,error}=await query(offset,offset+PAGE-1)
  if(error)throw error
  if(!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||expected!==null&&expected!==count||data.length>PAGE||offset+data.length>count||!data.length&&offset<count)fail()
  expected=count;for(const row of data){if(!row||typeof row!=='object')fail();accept(row);rows.push(row)}offset+=data.length;if(offset===count)return rows
 }
}
function safeId(v:any):number{if(typeof v!=='string'||!/^[1-9]\d*$/.test(v)||!Number.isSafeInteger(Number(v)))fail();return Number(v)}
function term(r:any):any{
 safeId(r.id);if(r.parent_id!==null)safeId(r.parent_id)
 if(!TYPES.includes(r.term_type)||typeof r.term_name!=='string'||!r.term_name.trim())fail()
 if(['province','canton','district'].includes(r.term_type))validateGeographicRow(r,r.term_type)
 else if(r.level!==1)fail()
 return r
}
export async function valuationTerms(ids?:number[]):Promise<any[]>{
 const rows:any[]=[]
 for(const batch of ids?batches([...new Set(ids)].sort((a,b)=>a-b)):[null]){
  let last=0
  rows.push(...await completeValuationRows((a,b)=>{let q=supabaseAdmin.from('ontology_terms').select(TERM_COLUMNS,{count:'exact'}).in('term_type',TYPES);if(batch)q=q.in('id',batch);return q.order('id').range(a,b)},r=>{const id=safeId(r.id);if(id<=last||batch&&!batch.includes(id))fail();last=id;if(batch||['province','canton','district'].includes(r.term_type)||r.level===1)term(r)}))
  if(batch&&rows.filter(r=>batch.includes(Number(r.id))).length!==batch.length)fail()
 }return rows.filter(r=>['province','canton','district'].includes(r.term_type)||r.level===1)
}
export function option(r:any):Option{return {id:safeId(r.id),parentId:r.parent_id===null?null:safeId(r.parent_id),type:r.term_type,slug:r.slug??'',en:r.term_name_en||r.term_name,es:r.term_name_es||r.term_name}}
function geo(r:any):CanonicalGeographyTerm{return {...r,id:safeId(r.id),parent_id:r.parent_id===null?null:safeId(r.parent_id),slug:r.slug??''}}
function characteristic(r:any):PriceMeterCharacteristicIdentity{return {ontologyTermId:safeId(r.id),termType:r.term_type,termName:r.term_name,termNameEn:r.term_name_en,termNameEs:r.term_name_es,slug:r.slug??'',slugEn:r.slug_en,slugEs:r.slug_es}}
function area(v:any):number|null {if(v===null)return null;if(typeof v!=='number'&&typeof v!=='string')fail();const n=Number(v);if(!Number.isFinite(n)||n<=0)return null;return n}
export type StructuralRow={id:string;title:string;transaction:'sale'|'rent';propertyArea:number|null;constructionArea:number|null;constructionMissing:boolean;propertyBasis:'land_only'|'improved_property'|'unknown';geography:{province:CanonicalGeographyTerm|null;canton:CanonicalGeographyTerm|null;district:CanonicalGeographyTerm|null};characteristics:PriceMeterCharacteristicIdentity[];memberships:Set<number>}
async function memberships(ids:string[],dimensions:Dimension[]):Promise<Map<string,PriceMeterCharacteristicIdentity[]>>{
 const result=new Map(ids.map(id=>[id,[] as PriceMeterCharacteristicIdentity[]]))
 for(const batch of batches(ids)){let last='',lastTerm=0
 await completeValuationRows((a,b)=>supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,ontology_terms!inner('+TERM_COLUMNS+')',{count:'exact'}).in('listing_id',batch).in('ontology_terms.term_type',['property_type',...dimensions.filter(d=>d!=='construction_land')]).order('listing_id').order('ontology_term_id').range(a,b),r=>{
  const id=safeId(r.ontology_term_id);if(!batch.includes(r.listing_id)||r.listing_id<last||r.listing_id===last&&id<=lastTerm||Array.isArray(r.ontology_terms)||r.ontology_terms?.id!==r.ontology_term_id)fail();last=r.listing_id;lastTerm=id;term(r.ontology_terms);result.get(r.listing_id)!.push(characteristic(r.ontology_terms))
 })}return result
}
async function structuralRows(ids:string[],transaction:'sale'|'rent',requireActive:boolean,dimensions:Dimension[]):Promise<StructuralRow[]>{
 if(!ids.length)return []
 const chars=await memberships(ids,dimensions),evidence=await readCanonicalListingEvidence(ids,{facts:[],semantics:['property_type']});const rows:StructuralRow[]=[]
 for(const batch of batches(ids)){let last='';const raw=await completeValuationRows((a,b)=>supabaseAdmin.from('listings').select('id,'+(requireActive?'':'title,')+'canonical_domain_version,listing_status,transaction_type,property_area::text,construction_area::text',{count:'exact'}).in('id',batch).order('id').range(a,b),r=>{
  if(!batch.includes(r.id)||r.id<=last||r.canonical_domain_version!==1||r.transaction_type!==transaction||r.listing_status==='deleted'||requireActive&&r.listing_status!=='active')fail();last=r.id
 });if(raw.length!==batch.length)fail()
 for(const r of raw){const ev=evidence.get(r.id)!,cs=chars.get(r.id)!,pt=cs.filter(c=>c.termType==='property_type');if(pt.length!==1||ev.selections[0]?.ontology_term_id!==String(pt[0].ontologyTermId))fail()
  const geography={province:null,canton:null,district:null} as StructuralRow['geography'];for(const g of ev.geography)geography[g.term_type]=geo(g)
  const constructionArea=area(r.construction_area);const constructionIdentity=resolvePriceMeterAreaIdentity(r.construction_area===null?null:constructionArea??NaN)
  rows.push({id:r.id,title:!requireActive&&typeof r.title==='string'?r.title:'',transaction,propertyArea:area(r.property_area),constructionArea,constructionMissing:r.construction_area===null,propertyBasis:resolvePriceMeterPropertyBasis({propertyType:pt[0].slug,constructionArea:constructionIdentity}),geography,characteristics:cs,memberships:new Set(cs.map(c=>c.ontologyTermId))})
 }}return rows
}
export type Subject={row:Omit<StructuralRow,'id'>&{id:string|null};kind:'listing'|'hypothetical';listingId:string|null;money:any}
export async function establishSubject(q:Question,userId:string):Promise<Subject>{
 const s=q.subject
 if(s.kind==='listing'){
  const {data,error}=await supabaseAdmin.from('listings').select('id,owner_id,canonical_domain_version,listing_status,transaction_type,current_price::text,monthly_price::text,currency').eq('id',s.listingId).maybeSingle()
  if(error)throw error
  if(!data||data.id!==s.listingId||data.canonical_domain_version!==1||data.listing_status==='deleted'||data.listing_status!=='active'&&data.owner_id!==userId||!['sale','rent'].includes(data.transaction_type))throw new ValuationSubjectUnavailable()
  const row=(await structuralRows([s.listingId],data.transaction_type,false,q.activeDimensions))[0]
  return {row,kind:'listing',listingId:s.listingId,money:data}
 }
 const terms=await valuationTerms([s.province,s.canton,...(s.district===null?[]:[s.district]),s.propertyType,...Object.values(s.characteristics)])
 const byId=new Map(terms.map(t=>[Number(t.id),t]));const g=(id:number,type:string)=>{const t=byId.get(id);if(!t||t.term_type!==type)invalid();return geo(t)}
 const province=g(s.province,'province'),canton=g(s.canton,'canton'),district=s.district===null?null:g(s.district,'district')
 if(canton.parent_id!==province.id||canton.official_code?.slice(0,1)!==province.official_code||district&&(district.parent_id!==canton.id||district.official_code?.slice(0,3)!==canton.official_code))invalid()
 const pt=byId.get(s.propertyType);if(pt?.term_type!=='property_type')invalid()
 const characteristics=[characteristic(pt)]
 for(const [d,id]of Object.entries(s.characteristics)){const t=byId.get(id);if(t?.term_type!==d)invalid();characteristics.push(characteristic(t))}
 const row:Subject['row']={id:null,title:'',transaction:s.transaction,propertyArea:s.propertyArea,constructionArea:s.constructionArea,constructionMissing:s.constructionArea===null,propertyBasis:resolvePriceMeterPropertyBasis({propertyType:pt.slug,constructionArea:resolvePriceMeterAreaIdentity(s.constructionArea)}),geography:{province,canton,district},characteristics,memberships:new Set(characteristics.map(c=>c.ontologyTermId))}
 return {row,kind:'hypothetical',listingId:null,money:{canonical_domain_version:1,transaction_type:s.transaction,current_price:s.transaction==='sale'?s.askingPrice?.amount:null,monthly_price:s.transaction==='rent'?s.askingPrice?.amount:null,currency:s.askingPrice?.currency}}
}
export function establishStructuralQuestion(q:Question,subject:Subject):{base:StructuralComparableQuestion;dimensions:PriceMeterComparableActiveDimension[]}{
 const row=subject.row,g=row.geography[q.geographyLevel],pt=row.characteristics.filter(c=>c.termType==='property_type')
 const unavailable=():never=>{if(subject.kind==='listing')throw new InsufficientValuationEvidence();return invalid()}
 if(!g||pt.length!==1||row.propertyBasis==='unknown'||row.propertyArea===null||q.normalization==='construction'&&row.propertyBasis!=='improved_property')return unavailable()
 const base:StructuralComparableQuestion={transactionType:row.transaction,propertyBasis:row.propertyBasis,normalizationBasis:q.normalization,geography:g,propertyTypeOntologyTermId:pt[0].ontologyTermId,propertyAreaRange:resolveSingleRange({exactAreaM2:row.propertyArea,basis:'property'}),constructionAreaRange:row.propertyBasis==='improved_property'?resolveSingleRange({exactAreaM2:row.constructionArea!,basis:'construction'}):null}
 let dimensions:PriceMeterComparableActiveDimension[]
 try{dimensions=resolveStructuralComparableDimensions({subject:{characteristics:row.characteristics,constructionToLandIdentity:q.activeDimensions.includes('construction_land')&&row.propertyBasis==='improved_property'&&row.constructionArea!==null?{constructionToLandRatio:row.constructionArea/row.propertyArea}:null},activeDimensions:q.activeDimensions})}catch{unavailable()}
 return {base,dimensions:dimensions!}
}
export async function acquireStructuralPeers(subject:Subject,base:StructuralComparableQuestion,dimensions:PriceMeterComparableActiveDimension[]){
 let last='';const geoRows=await completeValuationRows((a,b)=>supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)',{count:'exact'}).eq('ontology_term_id',base.geography.id).eq('listings.canonical_domain_version',1).eq('listings.listing_status','active').eq('listings.transaction_type',base.transactionType).order('listing_id').order('ontology_term_id').range(a,b),r=>{
  if(!listingIdPattern.test(r.listing_id)||r.listing_id<=last||r.ontology_term_id!==String(base.geography.id)||r.listings?.canonical_domain_version!==1||r.listings?.listing_status!=='active'||r.listings?.transaction_type!==base.transactionType)fail();last=r.listing_id
 })
 // Exclusion precedes all subsequent peer acquisition; hypothetical subjects have no listing identity.
 let ids=geoRows.map(r=>r.listing_id as string).filter(id=>id!==subject.listingId);const typed=new Set<string>()
 for(const batch of batches(ids)){let previous='';await completeValuationRows((a,b)=>supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text',{count:'exact'}).in('listing_id',batch).eq('ontology_term_id',base.propertyTypeOntologyTermId).order('listing_id').range(a,b),r=>{if(!batch.includes(r.listing_id)||r.listing_id<=previous||r.ontology_term_id!==String(base.propertyTypeOntologyTermId))fail();previous=r.listing_id;typed.add(r.listing_id)})}
 ids=ids.filter(id=>typed.has(id))
 let peers=(await structuralRows(ids,subject.row.transaction,true,dimensions.map(d=>d.dimension))).filter(row=>matchesStructuralComparableBase({question:base,candidate:{transactionType:row.transaction,propertyBasis:row.propertyBasis,normalizationBasis:base.normalizationBasis,geography:row.geography,propertyAreaM2:row.propertyArea,constructionAreaM2:row.constructionArea,memberships:row.memberships}}))
 const intersection=intersectStructuralComparables({rows:peers,subjectId:subject.listingId,listingId:row=>row.id,dimensions,matches:(row,d)=>matchesStructuralComparableDimension(row.memberships,d.dimension==='construction_land'&&row.propertyBasis==='improved_property'&&row.propertyArea!==null&&row.constructionArea!==null?row.constructionArea/row.propertyArea:null,d)})
 return {peers:intersection.rows,trail:intersection.steps}
}
export async function acquirePeerMoney(ids:string[],transaction:'sale'|'rent'):Promise<any[]>{
 const rows:any[]=[]
 for(const batch of batches(ids)){let last='';const found=await completeValuationRows((a,b)=>supabaseAdmin.from('listings').select('id,title,canonical_domain_version,listing_status,transaction_type,current_price::text,monthly_price::text,currency',{count:'exact'}).in('id',batch).order('id').range(a,b),r=>{if(!batch.includes(r.id)||r.id<=last||r.canonical_domain_version!==1||r.listing_status!=='active'||r.transaction_type!==transaction)fail();last=r.id});if(found.length!==batch.length)fail();rows.push(...found)}return rows
}
