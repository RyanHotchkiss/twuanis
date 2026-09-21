import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { customerEditDomains } from '@/lib/canonical-customer-edit'

export function csvEvidenceEnvelope(row: Record<string, unknown>) {
  if(typeof row.source_observation_input!=='string'||typeof row.unresolved_normalizer_review!=='string')throw Error('Original observation evidence is required; historical CSV cannot be promoted.')
  if(row.source_observation_input.length>262144||row.unresolved_normalizer_review.length>65536)throw Error('Observation exceeds evidence bounds.')
  const raw=JSON.parse(row.source_observation_input),review=JSON.parse(row.unresolved_normalizer_review)
  if(!raw||Array.isArray(raw)||typeof raw!=='object'||!review||Array.isArray(review)||review.status!=='unresolved'||review.canonical_authority!==false||!review.values||Array.isArray(review.values)||typeof review.values!=='object')throw Error('Separate raw and noncanonical review objects required.')
  // The surviving CSV parser emits strings. Reject numeric/object coercion that could lose source precision.
  if(Object.values(raw).some(value=>typeof value!=='string'))throw Error('Lossless original CSV string fields required.')
  for(const key of ['source_name','source_listing_id','observation_id','observed_at'])if(typeof raw[key]!=='string'||!raw[key].trim()||row[key]!==raw[key])throw Error('Genuine observation metadata is missing or inconsistent.')
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(raw.observed_at)||!Number.isFinite(Date.parse(raw.observed_at)))throw Error('Explicit genuine observation timestamp required.')
  return {raw,review}
}

export async function ingestCsvObservation(admin:SupabaseClient, row:Record<string,unknown>) {
  const {raw,review}=csvEvidenceEnvelope(row)
  // Separate RPC transaction: retain the observation even when creation fails below.
  const retained=await admin.rpc('retain_csv_source_evidence',{p_raw:raw,p_review:review})
  if(retained.error||typeof retained.data!=='string')throw Error(retained.error?.message||'Evidence retention not confirmed.')
  const evidenceId=retained.data
  try {
    // Only the explicit raw source property_type can establish this evidence.
    // Never reconstruct it from legacy raw_property_type titles or normalizer output.
    if(typeof raw.property_type!=='string'||!raw.property_type.trim())throw Error('Source-supported property type is missing; inferred type remains unresolved.')
    if(!['sale','rent'].includes(raw.transaction_type))throw Error('Explicit original transaction required.')
    const changes:Record<string,unknown>={property_type:raw.property_type,province:raw.province,canton:raw.canton,district:raw.district??null}
    // Frozen source alias, upstream of exact parent-scoped DTA resolution.
    if(raw.province==='Cartago'&&raw.canton==='Jiménez'&&raw.district==='Pejibaye')changes.district='Pejivalle'
    const money=raw.transaction_type==='sale'?'current_price':'monthly_price'
    if(/^\d+(\.\d+)?$/.test(String(raw[money]))&&Number(raw[money])>0&&['CRC','USD'].includes(raw.currency)) {
      changes[money]=String(raw[money]);changes.currency=raw.currency
    }
    for(const key of ['title','description','whatsapp'])if(typeof raw[key]==='string')changes[key]=raw[key]
    const {domains,content}=await customerEditDomains(admin,changes,{transaction_type:raw.transaction_type})
    const facts:Record<string,unknown>={}
    for(const [dimension,key] of [['bedrooms','raw_bedrooms'],['bathrooms','raw_bathrooms'],['parking','raw_parking'],['year_built','raw_year_built']]) {
      const value=raw[key]
      if((typeof value==='string'||typeof value==='number')&&/^\d+(\.\d+)?$/.test(String(value)))facts[dimension]={kind:'exact',value:String(value),reference:`csv-source-evidence:${evidenceId}:${key}`}
    }
    // Source strings with explicit square-meter units can supply exact measurements.
    // Bare/ambiguous numbers, ranges and heuristic normalized areas remain absent.
    const measurements:Record<string,unknown>={}
    for(const dim of ['property_area','construction_area']) {
      const m=typeof raw[`raw_${dim}`]==='string'?raw[`raw_${dim}`].match(/^(\d+(?:\.\d+)?)\s*(?:m²|m2)$/):null
      if(m&&Number(m[1])>0)measurements[dim]={value:m[1]}
    }
    const input={transaction:raw.transaction_type,...domains,facts,measurements,content}
    const applied=await admin.rpc('ingest_canonical_source_observation',{p_evidence:evidenceId,p_input:input})
    if(applied.error||typeof applied.data?.listing_id!=='string')throw Error(applied.error?.message||'Canonical ingestion not confirmed; retry same observation.')
    const listingId=applied.data.listing_id
    if(!['accepted','succeeded'].includes(applied.data.outcome))return {success:false,evidenceId,listingId,error:`Source observation ${applied.data.outcome}; evidence retained.`}
    return {success:true,evidenceId,listingId}
  }catch(error){return {success:false,evidenceId,error:error instanceof Error?error.message:'Canonical creation rejected; evidence retained.'}}
}
