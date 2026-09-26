import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { hydrateCanonicalPopulation } from './canonical-population'
import { getExplorerOptions } from './explorer-options-engine'
import { parsePriceMeterComparisonRequest } from './price-meter-comparison-request-parser'
import type { PriceMeterComparisonRequest } from './price-meter-comparison-request'
import type { PriceMeterOntologyMembership } from './price-meter-ontology-membership'
import { buildPositionObservations,resolvePositionFx } from './price-meter-property-position-execution'
import type { PositionRow } from './price-meter-property-position-loader'
import type { EstablishedExecution } from './price-meter-property-difference-context-adapter'
import type { ContextSelection } from './price-meter-property-difference-context-request'
import { PROPERTY_AREA_RANGE_OPTIONS,CONSTRUCTION_AREA_RANGE_OPTIONS } from './market-intelligence-area-ranges'
import { PRICE_METER_CONSTRUCTION_LAND_COHORTS } from './price-meter-construction-land-cohorts'
import type { ContextOptions } from './price-meter-property-difference-context-browser-contract'
export type ResolvedComparison={index:number;request:PriceMeterComparisonRequest}
export function comparisonIdentity(request:PriceMeterComparisonRequest) {
 const c=(d:PriceMeterComparisonRequest['cohortA'])=>[d.geography.term_type,String(d.geography.id),String(d.propertyType.ontologyTermId),d.characteristics.map(t=>String(t.ontologyTermId)).sort(),d.propertyAreaRange,d.constructionAreaRange,d.constructionLandCohortKey]
 return JSON.stringify([c(request.cohortA),c(request.cohortB),request.referenceCohort])
}
function safeTerm(id:number) {if(!Number.isSafeInteger(id)||id<=0)throw new Error('Unsupported ontology identity.');return String(id)}
export async function resolveComparisons(e:EstablishedExecution,selections:ContextSelection[]) {
 const selected=selections.flatMap((s,index)=>s.questionKey==='characteristic_comparison'?[{index,params:s.params}]:[])
 if(!selected.length)return {resolved:[] as ResolvedComparison[],invalid:[] as number[]}
 const options=await getExplorerOptions(),resolved:ResolvedComparison[]=[],invalid:number[]=[],seen=new Set<string>()
 for(const s of selected) {
  try {
   const r=e.result.reference
   const request=parsePriceMeterComparisonRequest({params:{...s.params,transaction_type:r.transactionType,property_basis:r.propertyBasis,normalization_basis:r.normalizationBasis},options})
   for(const c of [request.cohortA,request.cohortB]){safeTerm(c.geography.id);[c.propertyType,...c.characteristics].forEach(t=>safeTerm(t.ontologyTermId))}
   const key=comparisonIdentity(request)
   if(seen.has(key)){invalid.push(s.index);continue}
   seen.add(key);resolved.push({index:s.index,request})
  } catch {invalid.push(s.index)}
 }
 return {resolved,invalid}
}
// Every selected A/B boundary is resolved before additional listing/membership I/O.
// Shared rows are only acquisition resources, never a merged analytical population.
export async function acquireComparisons(e:EstablishedExecution,definitions:ResolvedComparison[]) {
 const cohorts=definitions.flatMap(d=>[d.request.cohortA,d.request.cohortB])
 const rowsById=new Map(e.working.rows.map(r=>[r.id,r]))
 const evidence=new Map<string,Set<string>>()
 // Reuse only the foundation's proven positive type membership; its rows are
 // not a substitute for the population of a different geographic/type question.
 for(const row of e.working.rows){
  const type=row.canonicalEvidence.selections.filter(t=>t.dimension==='property_type')
  if(type.length!==1||type[0].ontology_term_id!==e.result.reference.propertyType.id)throw new Error('Incoherent foundation type proof.')
  evidence.set(row.id,new Set([type[0].ontology_term_id]))
 }
 const candidatesByBoundary=new Map<string,string[]>()
 const boundary=(c:typeof cohorts[number])=>String(c.geography.id)+':'+String(c.propertyType.ontologyTermId)
 const query=()=>supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)',{count:'exact'})
  .eq('listings.canonical_domain_version',1).eq('listings.listing_status','active').eq('listings.transaction_type',e.result.reference.transactionType)
 type Assignment={listing_id:string;ontology_term_id:string}
 async function complete<T>(factory:()=>any,key:(r:T)=>string):Promise<T[]> {
  const rows:T[]=[],seen=new Set<string>();let expected:number|null=null
  do {
   const {data,count,error}=await factory().range(rows.length,rows.length+499)
   if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||(expected!==null&&count!==expected)||rows.length+data.length>count||(!data.length&&rows.length<count))throw new Error('Incomplete context acquisition.')
   expected=count
   for(const row of data){const k=key(row);if(!k||seen.has(k))throw new Error('Duplicate context evidence.');seen.add(k);rows.push(row)}
  }while(rows.length<expected!)
  return rows
 }
 const record=(rows:Assignment[])=>{for(const row of rows){if(typeof row.listing_id!=='string'||typeof row.ontology_term_id!=='string')throw new Error('Invalid membership identity.');const set=evidence.get(row.listing_id)??new Set<string>();set.add(row.ontology_term_id);evidence.set(row.listing_id,set)}}
 const geoCache=new Map<string,string[]>()
 for(const c of cohorts) {
  const key=boundary(c);if(candidatesByBoundary.has(key))continue
  const geo=safeTerm(c.geography.id)
  if(geo===e.result.reference.geography.id&&safeTerm(c.propertyType.ontologyTermId)===e.result.reference.propertyType.id){
   candidatesByBoundary.set(key,e.working.rows.map(r=>r.id));continue
  }
  if(!geoCache.has(geo)){
   const rows=await complete<Assignment>(()=>query().eq('ontology_term_id',geo).order('listing_id').order('ontology_term_id'),r=>r.listing_id)
   if(rows.some(r=>r.ontology_term_id!==geo))throw new Error('Unexpected geography membership.')
   record(rows);geoCache.set(geo,rows.map(r=>r.listing_id))
  }
  candidatesByBoundary.set(key,geoCache.get(geo)!)
 }
 const ids=[...new Set([...candidatesByBoundary.values()].flat())].sort()
 const terms=[...new Set(cohorts.flatMap(c=>[c.propertyType,...c.characteristics].map(t=>safeTerm(t.ontologyTermId))))]
 const pendingGroups=new Map<string,{terms:string[];ids:string[]}>()
 for(const id of ids){const needed=terms.filter(term=>!evidence.get(id)?.has(term));if(!needed.length)continue
  const key=JSON.stringify(needed),group=pendingGroups.get(key)??{terms:needed,ids:[]};group.ids.push(id);pendingGroups.set(key,group)}
 for(const group of pendingGroups.values())for(let offset=0;offset<group.ids.length;offset+=25){
  const batch=group.ids.slice(offset,offset+25),needed=group.terms
  const rows=await complete<Assignment>(()=>query().in('listing_id',batch).in('ontology_term_id',needed).order('listing_id').order('ontology_term_id'),r=>r.listing_id+':'+r.ontology_term_id)
  if(rows.some(r=>!batch.includes(r.listing_id)||!needed.includes(r.ontology_term_id)))throw new Error('Unexpected membership.')
  record(rows)
 }
 const required=[...new Set(cohorts.flatMap(c=>candidatesByBoundary.get(boundary(c))!.filter(id=>[c.propertyType,...c.characteristics].every(t=>evidence.get(id)?.has(String(t.ontologyTermId))))))].sort()
 const missing=required.filter(id=>!rowsById.has(id))
 for(let offset=0;offset<missing.length;offset+=25){
  const batch=missing.slice(offset,offset+25)
  const rows=await complete<PositionRow>(()=>supabaseAdmin.from('listings').select('id,canonical_domain_version,listing_status,transaction_type,property_area,construction_area,current_price,monthly_price,currency',{count:'exact'})
   .in('id',batch).eq('canonical_domain_version',1).eq('listing_status','active').eq('transaction_type',e.result.reference.transactionType).order('id'),r=>r.id)
  if(rows.length!==batch.length||rows.some(r=>!batch.includes(r.id)))throw new Error('Missing context listing.')
  const hydrated=await hydrateCanonicalPopulation(rows,undefined,[]) as PositionRow[]
  hydrated.forEach(row=>rowsById.set(row.id,row))
 }
 const rows=required.map(id=>rowsById.get(id)!)
 // Membership and hydration must agree; disagreement is incomplete evidence, not exclusion.
 for(const row of rows){const type=row.canonicalEvidence.selections.find(t=>t.dimension==='property_type')!;if(!evidence.get(row.id)?.has(type.ontology_term_id))throw new Error('Incoherent context type.')}
 const fx=e.result.fx??await resolvePositionFx(rows,e.result.analyticalDate)
 const observedById=new Map(e.working.observations.map(o=>[o.listingId,o]))
 const newObservations=buildPositionObservations(rows.filter(r=>!observedById.has(r.id)),e.result.analyticalDate,fx)
 for(const o of newObservations)if(o.propertyBasis===e.result.reference.propertyBasis&&o.normalizationBasis===e.result.reference.normalizationBasis)observedById.set(o.listingId,o)
 const observations=required.flatMap(id=>observedById.has(id)?[observedById.get(id)!]:[])
 const termDefinitions=new Map(cohorts.flatMap(c=>[c.propertyType,...c.characteristics].map(t=>[String(t.ontologyTermId),t] as const)))
 const memberships:PriceMeterOntologyMembership[]=required.map(listingId=>{const characteristics=[...(evidence.get(listingId)??[])].flatMap(id=>termDefinitions.has(id)?[termDefinitions.get(id)!]:[]);return {listingId,characteristics,ontologyTermIds:characteristics.map(t=>t.ontologyTermId)}})
 return {observations,memberships,fx}
}
export async function contextOptions():Promise<ContextOptions> {
 const options=await getExplorerOptions()
 const terms:ContextOptions['terms']={}
 for(const [type,values] of Object.entries(options))terms[type]=values.filter(v=>Number.isSafeInteger(v.id)&&v.id>0&&(v.parent_id===null||Number.isSafeInteger(v.parent_id))).map(v=>({id:v.id,parentId:v.parent_id,value:['province','canton','district'].includes(type)?v.official_code||v.slug:v.slug,label:v.term_name,labelEn:v.term_name_en,labelEs:v.term_name_es}))
 return {terms,propertyAreas:PROPERTY_AREA_RANGE_OPTIONS.map(v=>({value:v.value,label:v.label})),constructionAreas:CONSTRUCTION_AREA_RANGE_OPTIONS.map(v=>({value:v.value,label:v.label})),ratios:PRICE_METER_CONSTRUCTION_LAND_COHORTS.map(v=>({value:v.key,label:v.label}))}
}
