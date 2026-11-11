import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { CANONICAL_READER_BATCH, readCanonicalListingEvidence, type CanonicalEvidence } from './canonical-listing-reader'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14FactPopulationForExecution, type Phase14FactAcquisition, type Phase14FactPopulation } from './phase14-fact-population'

type Area = 'property_area' | 'construction_area'
type Scalars = Readonly<{
  id: string; canonical_domain_version: 1; listing_status: 'active'; transaction_type: 'sale' | 'rent'
  property_area: string | null; construction_area: string | null
  current_price?: string | null; monthly_price?: string | null; currency: 'CRC' | 'USD' | null
}>
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
export type Phase14HydratedEvidence = Readonly<{ scalars: Scalars; canonical: DeepReadonly<CanonicalEvidence> }>
type Request = Readonly<{ source: 'read_canonical_listing_evidence' | 'public.listings'; listingIds: readonly string[]; fields: readonly string[]; offset: number }>
type Reuse = Readonly<{ source: 'step5'; stage: number; field: Area; listingIds: readonly string[] }>
type Provenance = Readonly<{
  kind: 'canonically_hydrated_survivor_population'; executionId: string; canonicalQuestionSerialization: string
  factPopulation: Phase14FactPopulation; step5SurvivorCount: number
}>
export type Phase14HydratedPopulation = Provenance & Readonly<{
  state: 'complete'; listingIds: readonly string[]; hydratedListingCount: number
  evidenceByListingId: Readonly<Record<string, Phase14HydratedEvidence>>
  provenance: Readonly<{ requests: readonly Request[]; reused: readonly Reuse[]; factDimensions: readonly string[]; semanticDimensions: readonly string[] }>
  completeness: Readonly<{ exactRequestedIdCoverage: true; snapshotGuaranteed: false; requests: number }>
}>
export type Phase14Hydration = Phase14HydratedPopulation
  | (Provenance & Readonly<{ state: 'incomplete'; reason: 'incomplete_or_incoherent_evidence' }>)
  | (Provenance & Readonly<{ state: 'execution_failed'; reason: 'hydration_query_failed' }>)
  | Readonly<{ state: 'invalid_execution' }>
const owners = new WeakMap<object, { envelope: Phase14ExecutionEnvelope; facts: Phase14FactPopulation }>()
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
class QueryFailure extends Error {}
function fail(): never { throw new Error('Incomplete hydration.') }
function freeze<T>(v: T): T {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const child of Object.values(v)) freeze(child)
    Object.freeze(v)
  }
  return v
}
// Preserve decimal evidence losslessly. Null is established absence, not a missing response field.
function positiveDecimal(v: unknown): string | null {
  if (v === null) return null
  if (typeof v !== 'string' || !/^\d+(\.\d+)?$/.test(v)) fail()
  const [whole, fraction = ''] = v.split('.')
  const w = whole.replace(/^0+(?=\d)/, ''), f = fraction.replace(/0+$/, '')
  if (w === '0' && !f) fail()
  return w + (f ? '.' + f : '')
}
function geographyIdentity(e: DeepReadonly<CanonicalEvidence>): string {
  return JSON.stringify(e.geography.map(g => [g.term_type,g.id,g.parent_id,g.official_code,g.level]).sort((a,b) => String(a[0]).localeCompare(String(b[0]))))
}

// No injectable authority, raw-ID entry point, analytical machinery, or cross-request evidence cache.
export async function hydratePhase14Survivors(envelope: Phase14ExecutionEnvelope, facts: Phase14FactAcquisition): Promise<Phase14Hydration> {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    if (!facts || facts.state !== 'complete') return freeze({state:'invalid_execution'})
    assertPhase14FactPopulationForExecution(facts,envelope,facts.membershipPopulation)
    if (facts.listingIds.length !== facts.survivingListingCount || new Set(facts.listingIds).size !== facts.listingIds.length ||
        facts.listingIds.some((id,i) => !uuid.test(id) || i > 0 && id <= facts.listingIds[i-1])) return freeze({state:'invalid_execution'})
  } catch { return freeze({state:'invalid_execution'}) }
  const base: Provenance = {kind:'canonically_hydrated_survivor_population',executionId:envelope.executionId,
    canonicalQuestionSerialization:envelope.canonicalQuestionSerialization,factPopulation:facts,step5SurvivorCount:facts.survivingListingCount}
  const ids = facts.listingIds, selected = new Set(ids), requests: Request[] = [], reused: Reuse[] = []
  const areas: Record<Area,Map<string,string|null>> = {property_area:new Map(),construction_area:new Map()}
  const priorGeography = new Map<string,string>()
  const evidenceByListingId: Record<string,Phase14HydratedEvidence> = Object.create(null)
  try {
    for (const [stageIndex,stage] of facts.trail.entries()) for (const evidence of stage.evidence) {
      if (evidence.kind === 'exact_area_scalar') {
        const field: Area = evidence.dimension === 'propertyArea' ? 'property_area' : 'construction_area'
        const covered: string[] = []
        for (const row of evidence.rows) if (selected.has(row.listingId)) {
          const value = positiveDecimal(row.value)
          if (areas[field].has(row.listingId) && areas[field].get(row.listingId) !== value) fail()
          areas[field].set(row.listingId,value); covered.push(row.listingId)
        }
        if (covered.length !== ids.length || new Set(covered).size !== ids.length) fail()
        if (covered.length) reused.push({source:'step5',stage:stageIndex,field,listingIds:[...ids]})
      } else if (evidence.kind === 'canonical_fact_reader') {
        // The fact dimensions are not eligibility inputs. Compare only the overlapping geography identity.
        for (const row of evidence.records) if (selected.has(row.listing_id)) {
          const identity = geographyIdentity(row)
          if (priorGeography.has(row.listing_id) && priorGeography.get(row.listing_id) !== identity) fail()
          priorGeography.set(row.listing_id,identity)
        }
      }
    }
    const priceField = envelope.question.transaction === 'sale' ? 'current_price' : 'monthly_price'
    const missingAreas = (['property_area','construction_area'] as const).filter(field => areas[field].size !== ids.length)
    const fields = ['id','canonical_domain_version','listing_status','transaction_type','currency',priceField,...missingAreas]
    const columns = fields.map(field => field === priceField || missingAreas.includes(field as Area) ? field+'::text' : field).join(',')
    for (let start = 0; start < ids.length; start += CANONICAL_READER_BATCH) {
      const batch = ids.slice(start,start+CANONICAL_READER_BATCH), scalarRows = new Map<string,Scalars>()
      let offset = 0, previous: string | null = null
      do {
        requests.push({source:'public.listings',listingIds:batch,fields,offset})
        let response
        try { response = await supabaseAdmin.from('listings').select(columns,{count:'exact'}).in('id',[...batch]).order('id').range(offset,offset+CANONICAL_READER_BATCH-1) }
        catch { throw new QueryFailure() }
        if (response?.error) throw new QueryFailure()
        const {data,count} = response
        if (!Array.isArray(data) || count !== batch.length || !data.length || data.length > CANONICAL_READER_BATCH || offset+data.length > batch.length) fail()
        for (const item of data as unknown[]) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) fail()
          const raw = item as Record<string,unknown>
          if (!raw || typeof raw.id !== 'string' || !batch.includes(raw.id) || scalarRows.has(raw.id) || previous !== null && raw.id <= previous) fail()
          previous = raw.id
          if (raw.canonical_domain_version !== 1 || raw.listing_status !== 'active' || raw.transaction_type !== envelope.question.transaction ||
              raw.currency !== null && raw.currency !== 'CRC' && raw.currency !== 'USD') fail()
          const areaValues = {} as Record<Area,string|null>
          for (const field of ['property_area','construction_area'] as const) {
            const retained = areas[field]
            if (retained.has(raw.id)) {
              areaValues[field] = retained.get(raw.id)!
              if (Object.prototype.hasOwnProperty.call(raw,field) && positiveDecimal(raw[field]) !== areaValues[field]) fail()
            } else areaValues[field] = positiveDecimal(raw[field])
          }
          scalarRows.set(raw.id,{id:raw.id,canonical_domain_version:1,listing_status:'active',transaction_type:envelope.question.transaction,
            currency:raw.currency,[priceField]:positiveDecimal(raw[priceField]),...areaValues})
        }
        offset += data.length
      } while (offset < batch.length)
      const canonical = await readCanonicalListingEvidence([...batch],{facts:[],semantics:['property_type']},{rpc:(name,args,options) => {
        requests.push({source:'read_canonical_listing_evidence',listingIds:[...batch],fields:['property_type','geography'],offset:0})
        let query
        try { query = supabaseAdmin.rpc(name,args,options) } catch { throw new QueryFailure() }
        return new Proxy(query,{get(target,key,receiver) {
          if (key !== 'then') return Reflect.get(target,key,receiver)
          return (resolve:(value:unknown)=>unknown,reject:(reason:unknown)=>unknown) => Promise.resolve(target).then(response => {
            if (response.error) throw new QueryFailure()
            return response
          },() => {throw new QueryFailure()}).then(resolve,reject)
        }})
      }})
      if (canonical.size !== batch.length) fail()
      for (const id of batch) {
        const e = canonical.get(id), scalars = scalarRows.get(id)
        if (!e || !scalars) fail()
        const type = e.selections.find(s => s.dimension === 'property_type')
        if (!type || type.ontology_term_id !== envelope.question.propertyType.termId || typeof type.term_name !== 'string' ||
            type.slug !== null && typeof type.slug !== 'string' ||
            !e.geography.some(g => g.term_type === envelope.question.geography.level && g.id === envelope.question.geography.termId && g.official_code === envelope.question.geography.officialCode)) fail()
        if (priorGeography.has(id) && priorGeography.get(id) !== geographyIdentity(e)) fail()
        evidenceByListingId[id] = {scalars,canonical:e}
      }
    }
    if (Object.keys(evidenceByListingId).length !== ids.length || ids.some(id => !evidenceByListingId[id])) fail()
    const result: Phase14HydratedPopulation = freeze({...base,state:'complete',listingIds:ids,hydratedListingCount:ids.length,evidenceByListingId,
      provenance:{requests,reused,factDimensions:[],semanticDimensions:['property_type']},
      completeness:{exactRequestedIdCoverage:true,snapshotGuaranteed:false,requests:requests.length}})
    owners.set(result,{envelope,facts}); return result
  } catch (error) {
    return error instanceof QueryFailure ? freeze({...base,state:'execution_failed',reason:'hydration_query_failed'}) :
      freeze({...base,state:'incomplete',reason:'incomplete_or_incoherent_evidence'})
  }
}
export function assertPhase14HydratedPopulationForExecution(value: Phase14Hydration, envelope: Phase14ExecutionEnvelope, facts: Phase14FactAcquisition): asserts value is Phase14HydratedPopulation {
  assertPhase14ExecutionEnvelope(envelope)
  if (!facts || facts.state !== 'complete') throw new Error('Invalid Phase 14 fact population.')
  assertPhase14FactPopulationForExecution(facts,envelope,facts.membershipPopulation)
  const owner = value && owners.get(value)
  if (!value || value.state !== 'complete' || owner?.envelope !== envelope || owner.facts !== facts) throw new Error('Invalid Phase 14 hydration association.')
}
