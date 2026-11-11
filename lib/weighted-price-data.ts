import 'server-only'
import {supabaseAdmin} from './supabase-admin'
import {readCanonicalListingEvidence} from './canonical-listing-reader'
import {resolveListingOriginalMonetaryValue} from './listing-monetary-value'
import {resolvePriceMeterAreaIdentity,resolvePriceMeterPropertyBasis} from './price-meter-identity'
import {validateGeographicRow} from './geography/dta-identity'
import {canonicalDecimal} from './asking-area-ratio-contract'
import type {WeightedQuestion} from './weighted-price-contract'
export class WeightedQuestionError extends Error {}
function invalid():never{throw new WeightedQuestionError('Subject incompatible with question')}
export async function establishWeightedSubject(q:WeightedQuestion,userId:string){
 const s=q.subject,c=q.cohort
 let L:number,C:number,money:ReturnType<typeof resolveListingOriginalMonetaryValue>,listingId:string|undefined
 if(s.kind==='listing'){
  const {data:r,error}=await supabaseAdmin.from('listings').select('id,owner_id,canonical_domain_version,listing_status,transaction_type,property_area::text,construction_area::text,current_price::text,monthly_price::text,currency').eq('id',s.listingId).maybeSingle()
  if(error)throw Error('Subject read unavailable')
  if(!r||r.id!==s.listingId||r.canonical_domain_version!==1||r.listing_status==='deleted'||r.listing_status!=='active'&&r.owner_id!==userId||r.transaction_type!==c.transaction)invalid()
  try{L=Number(canonicalDecimal(r.property_area));C=Number(canonicalDecimal(r.construction_area))}catch{invalid()}
  const evidence=(await readCanonicalListingEvidence([r.id],{facts:[],semantics:['property_type']})).get(r.id)
  if(!evidence||evidence.selections.length!==1||evidence.selections[0].ontology_term_id!==c.propertyType||!evidence.geography.some(g=>g.id===c.geography.termId&&g.term_type===c.geography.level))invalid()
  if(resolvePriceMeterPropertyBasis({propertyType:evidence!.selections[0].slug,constructionArea:resolvePriceMeterAreaIdentity(C!)})!=='improved_property')invalid()
  money=resolveListingOriginalMonetaryValue(r);listingId=r.id
 }else{
  L=Number(s.propertyArea);C=Number(s.constructionArea)
  const ids=[s.province,s.canton,...(s.district?[s.district]:[]),c.propertyType]
  if(new Set(ids).size!==ids.length)invalid()
  const {data,error}=await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,official_code,term_type,level,slug').in('id',ids)
  if(error)throw Error('Subject geography unavailable')
  if(!Array.isArray(data)||data.length!==ids.length||new Set(data.map(r=>r.id)).size!==ids.length)invalid()
  const p=data!.find(r=>r.id===s.province),t=data!.find(r=>r.id===s.canton),d=s.district?data!.find(r=>r.id===s.district):null,pt=data!.find(r=>r.id===c.propertyType)
  if(!p||!t||!pt||s.district&&!d)invalid()
  try{validateGeographicRow(p,'province');validateGeographicRow(t,'canton');if(d)validateGeographicRow(d,'district')}catch{invalid()}
  if(t.parent_id!==p.id||t.official_code.slice(0,1)!==p.official_code||d&&(d.parent_id!==t.id||d.official_code.slice(0,3)!==t.official_code)||![p,t,...(d?[d]:[])].some(g=>g.id===c.geography.termId&&g.term_type===c.geography.level)||!pt||pt.term_type!=='property_type'||pt.level!==1)invalid()
  if(resolvePriceMeterPropertyBasis({propertyType:pt.slug,constructionArea:resolvePriceMeterAreaIdentity(C)})!=='improved_property')invalid()
  money=resolveListingOriginalMonetaryValue({canonical_domain_version:1,transaction_type:c.transaction,current_price:c.transaction==='sale'?s.askingPrice?.amount:null,monthly_price:c.transaction==='rent'?s.askingPrice?.amount:null,currency:s.askingPrice?.currency})
  if(s.askingPrice&&!money)invalid()
 }
 if(![L!,C!].every(v=>Number.isFinite(v)&&v>0)||L!<Number(c.propertyArea.min)||L!>Number(c.propertyArea.max)||C!<Number(c.constructionArea.min)||C!>Number(c.constructionArea.max))invalid()
 return{L:L!,C:C!,money:money!,listingId}
}
