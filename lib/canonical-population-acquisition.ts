import 'server-only'
import {assertAcquisitionPlan} from './canonical-acquisition-plan'
import {recordAnalyticalEvidence} from './orchestrator-evidence-v2'
import {currentOrchestratorContext,orchestratorMemo} from './orchestrator-execution-context'
import {createHash} from 'node:crypto'
import {supabaseAdmin} from './supabase-admin'
import {createServerSupabaseClient} from './supabase-server'
import {authorizePopulationCapability, ANALYTICAL_CAPABILITIES, PackageCapabilityDenied, type AnalyticalCapability} from './package-capability-authorization'
import {readCanonicalMarketScalars, type CanonicalMarketBoundary} from './canonical-market-population'
import {readCanonicalListingEvidence, type CanonicalEvidence} from './canonical-listing-reader'
import {validateGeographicRow, validateOntologyTermId} from './geography/dta-identity'
import {resolvePriceMeterAreaIdentity, resolvePriceMeterPropertyBasis, type PriceMeterPropertyBasis} from './price-meter-identity'

export type AcquisitionPopulation='PRIVATE'|'BANK'|'COMBINED'
export type AcquisitionRequest=Readonly<{
 capability:AnalyticalCapability; population:AcquisitionPopulation; profile?:'inventory'|'asking_price'|'ppm2'; transaction:'sale'|'rent';
 geography:Readonly<{province:string|null;canton:string|null;district:string|null}>;
 propertyType:string;propertyBasis:Exclude<PriceMeterPropertyBasis,'unknown'>;areaBasis:'land'|'construction'
}>
type Authority={accountId:string;capability:AnalyticalCapability;population:AcquisitionPopulation;terms:{id:string;startsAt:string;endsAt:string}[]}
type Measurement={dimension:'property_area'|'construction_area';kind:'exact';value:string;observationId:string;fieldPath:string;ordinal:number;unit:string;validation:string;fieldValue:string;observedAt:string;sourceId:string;recordKey:string;contentHash:string;page:number|null;selector:string|null}
export type BankAnalyticalObservation=Readonly<{
 population:'BANK';listingId:string;propertyId:string;offeringId:string;sourceId:string;sourceNamespace:string;recordKey:string;
 transaction:'sale';propertyType:string;propertyBasis:PriceMeterPropertyBasis;
 geography:CanonicalEvidence['geography'];price:Readonly<{amount:string;currency:'CRC'|'USD';kind:'SELLING_PRICE';evidenceId:string;observationId:string;eventId:string;fieldPath:string;ordinal:number}>|null;
 land:Measurement|null;construction:Measurement|null;registryMeasurements:readonly Record<string,unknown>[];
 areaBasis:'land'|'construction';areaSelection:Record<string,string>;observedAt:string;publicationStatus:'PUBLISHED';
 freshness:Readonly<{policyId:string;policyRevision:string;freshSeconds:string;lastSeen:string}>;
 revisions:Readonly<{source:string;binding:string;classification:string;publication:string;financial:string}>;
 contentHash:string;otherFacts:readonly Record<string,unknown>[];semantics:readonly Record<string,unknown>[]
}>
export type PrivateAnalyticalObservation=Readonly<{population:'PRIVATE';listingId:string;row:Record<string,any>;evidence:CanonicalEvidence;propertyBasis:PriceMeterPropertyBasis;areaBasis:'land'|'construction'}>
export type AcquisitionResult=Readonly<{
 population:AcquisitionPopulation;private:readonly PrivateAnalyticalObservation[];bank:readonly BankAnalyticalObservation[];
 excluded:readonly {listingId:string;propertyId:string;reasons:readonly string[]}[];
 cacheIdentity:string;sourceDataRevision:string;priceNormalization:'ORIGINAL_CURRENCY';methodologyVersion:'canonical-population-acquisition-v1'
}>
const INVENTORY_CAPABILITIES=['cap-market-summary','cap-market-composition','cap-property-matching','cap-market-comparison','cap-property-configuration-frequency'] as const
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const decimal=/^(0|[1-9]\d*)(\.\d{1,18})?$/
const hash=/^[0-9a-f]{64}$/
function positive(v:unknown):v is string{return typeof v==='string'&&decimal.test(v)&&BigInt(v.replace('.',''))>BigInt(0)}
function validTime(v:unknown):v is string{return typeof v==='string'&&Number.isFinite(Date.parse(v))}
function fail():never{throw Error('Incomplete canonical analytical acquisition contract.')}
function request(r:AcquisitionRequest){
 if(!r||Object.keys(r).filter(k=>k!=='profile').sort().join()!==['areaBasis','capability','geography','population','propertyBasis','propertyType','transaction'].sort().join()||
 !ANALYTICAL_CAPABILITIES.includes(r.capability)||!['PRIVATE','BANK','COMBINED'].includes(r.population)||!['sale','rent'].includes(r.transaction)||
 !['land_only','improved_property'].includes(r.propertyBasis)||!['land','construction'].includes(r.areaBasis)||r.propertyBasis==='land_only'&&r.areaBasis!=='land')fail()
 if(r.profile!==undefined&&(!['inventory','asking_price','ppm2'].includes(r.profile)||r.profile==='inventory'&&!(INVENTORY_CAPABILITIES as readonly string[]).includes(r.capability)||r.profile==='asking_price'&&r.capability!=='cap-market-asking-price-distribution'))fail()
 validateOntologyTermId(r.propertyType)
 if(!r.geography||Object.keys(r.geography).sort().join()!=='canton,district,province')fail()
 for(const id of Object.values(r.geography))if(id!==null)validateOntologyTermId(id)
 if(r.geography.district&&!r.geography.canton||r.geography.canton&&!r.geography.province)fail()
}
function matchesScope(terms:any[],r:AcquisitionRequest){
 return Object.entries(r.geography).every(([type,id])=>id===null||terms.some(t=>t.term_type===type&&t.id===id))&&terms.some(t=>t.term_type==='property_type'&&t.id===r.propertyType)
}
function geography(terms:any[]):CanonicalEvidence['geography']{
 const geo=terms.filter(t=>['province','canton','district'].includes(t.term_type));if(geo.length!==3)fail()
 const p=geo.find(t=>t.term_type==='province'),c=geo.find(t=>t.term_type==='canton'),d=geo.find(t=>t.term_type==='district')
 for(const t of geo)validateGeographicRow(t,t.term_type)
 if(p.parent_id!=='9'||c.parent_id!==p.id||d.parent_id!==c.id||c.official_code.slice(0,1)!==p.official_code||d.official_code.slice(0,3)!==c.official_code)fail()
 return geo
}
// Pure eligibility reduction. It neither acquires evidence nor grants rights.
export function reduceCanonicalBankObservation(raw:any,r:AcquisitionRequest,atTime:string):{observation:BankAnalyticalObservation|null;reasons:string[]}{
 request(r);const quantitative=(r.profile??'ppm2')==='ppm2',needsPrice=quantitative;const reasons:string[]=[];const deny=(reason:string)=>{reasons.push(reason)}
 if(!raw||typeof raw!=='object')return {observation:null,reasons:['MISSING_EVIDENCE']}
 for(const k of ['listingId','propertyId','offeringId','sourceId','bindingId','classificationId','observationId','policyId'])if(!uuid.test(raw[k]||''))deny('CANONICAL_IDENTITY_REQUIRED')
 for(const k of ['sourceRevision','bindingRevision','publicationRevision','classificationRevision','policyRevision'])if(!/^[1-9]\d*$/.test(raw[k]||''))deny('CANONICAL_REVISION_REQUIRED')
 if(typeof raw.sourceNamespace!=='string'||!raw.sourceNamespace||typeof raw.recordKey!=='string'||!raw.recordKey||!hash.test(raw.contentHash||''))deny('SOURCE_IDENTITY_REQUIRED')
 if(raw.population!=='BANK')deny('POPULATION_IDENTITY_MISMATCH')
 const f=raw.financial
 const validPrice=!!f&&uuid.test(f.id||'')&&uuid.test(f.eventId||'')&&uuid.test(f.observationId||'')&&f.kind==='SELLING_PRICE'&&f.status==='VALID'&&f.selectionValid===true&&positive(f.amount)&&['CRC','USD'].includes(f.currency)&&f.sourceId===raw.sourceId&&f.offeringId===raw.offeringId&&!!f.fieldPath&&Number.isInteger(f.ordinal)&&/^[1-9]\d*$/.test(f.eventRevision||'')
 if(needsPrice&&(!f||!uuid.test(f.id||'')||!uuid.test(f.eventId||'')||!uuid.test(f.observationId||'')||f.kind!=='SELLING_PRICE'||f.status!=='VALID'||f.selectionValid!==true||!positive(f.amount)||!['CRC','USD'].includes(f.currency)||f.sourceId!==raw.sourceId||f.offeringId!==raw.offeringId||!f.fieldPath||!Number.isInteger(f.ordinal)||!/^[1-9]\d*$/.test(f.eventRevision||'')))deny('ELIGIBLE_SELLING_PRICE_REQUIRED')
 const tx=raw.transactionEvidence
 // DIRECT_SALE is the existing canonical disposal mechanism; require its exact
 // independently retained advertisement transaction too. Auction/unknown fail closed.
 if(r.transaction!=='sale'||raw.mechanism!=='DIRECT_SALE'||!Array.isArray(tx)||tx.length!==1||tx[0].value!=='sale'||tx[0].validation!=='RETAINED_RAW'||tx[0].path!=='raw.transaction_type')deny('TRANSACTION_IDENTITY_UNRESOLVED')
 if(raw.publicationStatus!=='PUBLISHED'||raw.lifecycle?.eligible!==true)deny('PUBLICATION_OR_LIFECYCLE_INELIGIBLE')
 const now=Date.parse(atTime),seen=Date.parse(raw.observedAt)
 if(!Number.isFinite(now)||!validTime(raw.observedAt)||!/^[1-9]\d*$/.test(raw.freshSeconds||'')||now<seen||now-seen>Number(raw.freshSeconds)*1000||raw.lifecycle?.last_seen!==raw.observedAt)deny('SOURCE_UNCONFIRMED')
 let geo:CanonicalEvidence['geography']=[];const terms=raw.terms
 try{if(!Array.isArray(terms))fail();geo=geography(terms);const pt=terms.filter(t=>t.term_type==='property_type');if(pt.length!==1||pt[0].level!==1)fail();validateOntologyTermId(pt[0].id);if(!matchesScope(terms,r))deny('SCOPE_MISMATCH')}catch{deny('CANONICAL_GEOGRAPHY_OR_TYPE_REQUIRED')}
 const measurements=Array.isArray(raw.measurements)?raw.measurements:[]
 const selected=(dimension:string):Measurement|null=>{
  const values=measurements.filter((m:any)=>m.dimension===dimension);if(!values.length)return null
  if(values.length!==1){deny('CONFLICTING_MEASUREMENT_IDENTITY');return null}
  const m=values[0];if(m.kind!=='exact'||!positive(m.value)||m.fieldValue!==m.value||!['m2','m²'].includes(m.unit)||m.validation!=='VALID'||!uuid.test(m.observationId||'')||m.sourceId!==raw.sourceId||m.recordKey!==raw.recordKey||!hash.test(m.contentHash||'')||!validTime(m.observedAt)||Date.parse(m.observedAt)>now||now-Date.parse(m.observedAt)>Number(raw.freshSeconds)*1000||!m.fieldPath||!Number.isInteger(m.ordinal)){if(quantitative)deny('INVALID_AREA_EVIDENCE');return null}
  return m
 }
 const land=selected('property_area'),construction=selected('construction_area'),pt=Array.isArray(terms)?terms.find(t=>t.term_type==='property_type'):null
 const basis=resolvePriceMeterPropertyBasis({propertyType:pt?.slug,constructionArea:resolvePriceMeterAreaIdentity(construction?Number(construction.value):null)})
 if(quantitative&&(basis==='unknown'||basis!==r.propertyBasis))deny('PROPERTY_BASIS_UNRESOLVED')
 if(quantitative&&(r.areaBasis==='land'&&!land||r.areaBasis==='construction'&&(!construction||basis!=='improved_property')))deny('AREA_BASIS_UNAVAILABLE')
 const selection=raw.areaSelection
 if(land?.fieldPath.startsWith('pdf.')||construction?.fieldPath.startsWith('pdf.')){
  if(selection?.property_area!=='PLAN_AREA'||selection?.construction_area!=='CONSTRUCTION_TOTAL'||selection?.registry!=='PRESERVED_SEPARATELY'||land!==null&&land.fieldPath!=='pdf.normalized_plan_area'||construction!==null&&construction.fieldPath!=='pdf.normalized_construction_total')deny('UNSUPPORTED_AREA_SELECTION')
 }
 const registry=raw.registryMeasurements
 if(!Array.isArray(registry)||registry.some((m:any)=>!positive(m.value)||!uuid.test(m.observationId||'')||m.fieldPath!=='pdf.normalized_registry_area'||m.validation!=='VALID'||m.unit!=='m2'))deny('REGISTRY_PROVENANCE_REQUIRED')
 if(selection?.registry==='PRESERVED_SEPARATELY'&&registry?.length!==1)deny('REGISTRY_PROVENANCE_REQUIRED')
 if(!Array.isArray(raw.otherFacts)||!Array.isArray(raw.semantics))deny('CANONICAL_ATTRIBUTE_EVIDENCE_REQUIRED')
 else {
  const dimensions=new Set<string>();for(const v of raw.otherFacts){if(!['bedrooms','bathrooms','parking','year_built','distance_to_paved_road'].includes(v.dimension)||dimensions.has(v.dimension)||!['exact','category','range'].includes(v.kind)||!uuid.test(v.observationId||''))deny('INVALID_CANONICAL_ATTRIBUTE');dimensions.add(v.dimension)}
  for(const v of raw.semantics){if(!['property_type','utility','environment','terrain','accessibility','legal_status'].includes(v.dimension)||!uuid.test(v.observationId||''))deny('INVALID_CANONICAL_ATTRIBUTE');try{validateOntologyTermId(v.termId)}catch{deny('INVALID_CANONICAL_ATTRIBUTE')}}
 }
 if(reasons.length)return {observation:null,reasons:[...new Set(reasons)]}
 return {reasons:[],observation:{population:'BANK',listingId:raw.listingId,propertyId:raw.propertyId,offeringId:raw.offeringId,sourceId:raw.sourceId,sourceNamespace:raw.sourceNamespace,recordKey:raw.recordKey,transaction:'sale',propertyType:pt.id,propertyBasis:basis as Exclude<PriceMeterPropertyBasis,'unknown'>,geography:geo,price:validPrice?{amount:f.amount,currency:f.currency,kind:'SELLING_PRICE',evidenceId:f.id,observationId:f.observationId,eventId:f.eventId,fieldPath:f.fieldPath,ordinal:f.ordinal}:null,land,construction,registryMeasurements:registry,areaBasis:r.areaBasis,areaSelection:selection??{property_area:'CANONICAL_EXACT',construction_area:'CANONICAL_EXACT'},observedAt:raw.observedAt,publicationStatus:'PUBLISHED',freshness:{policyId:raw.policyId,policyRevision:raw.policyRevision,freshSeconds:raw.freshSeconds,lastSeen:raw.observedAt},revisions:{source:raw.sourceRevision,binding:raw.bindingRevision,classification:raw.classificationRevision,publication:raw.publicationRevision,financial:f?.eventRevision??'0'},contentHash:raw.contentHash,otherFacts:raw.otherFacts,semantics:raw.semantics}}
}
async function authorize(r:AcquisitionRequest):Promise<Authority>{
 request(r)
 const orchestrator=currentOrchestratorContext();if(orchestrator){assertAcquisitionPlan(orchestrator.plan,r);return orchestrator.authorize(r)}
 if(r.population==='PRIVATE')return {accountId:await authorizePopulationCapability(r.capability,'PRIVATE'),capability:r.capability,population:'PRIVATE',terms:[]}
 const expectedAccount=await authorizePopulationCapability(r.capability,'BANK')
 const db=await createServerSupabaseClient(),{data,error}=await db.rpc('read_analytical_population_authority',{p_capability:r.capability,p_population:r.population})
 if(error||!data||!uuid.test(data.accountId)||data.accountId!==expectedAccount||data.capability!==r.capability||data.population!==r.population||!Array.isArray(data.terms)||!data.terms.length||data.terms.some((t:any)=>!uuid.test(t.id)||!validTime(t.startsAt)||!validTime(t.endsAt)))throw new PackageCapabilityDenied()
 return data
}
const tickets=new WeakMap<AcquisitionResult,{request:AcquisitionRequest;authority:Authority}>()
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
// PostgREST JSONB object-key order is not an authorization identity.
const authorityIdentity=(a:Authority)=>digest([a.accountId,a.capability,a.population,a.terms.map(t=>[t.id,t.startsAt,t.endsAt])])
async function acquireUnsharedPopulation(r:AcquisitionRequest):Promise<AcquisitionResult>{
 // Freeze owned request state; callers cannot mutate scope after a grant/cache key.
 r=JSON.parse(JSON.stringify(r));request(r);r={...r,geography:{province:r.geography.province,canton:r.geography.canton,district:r.geography.district}};let bankRevision:string|null=null;const auth=await authorize(r),privateRows:PrivateAnalyticalObservation[]=[],bank:BankAnalyticalObservation[]=[],excluded:AcquisitionResult['excluded'][number][]=[]
 if(r.population!=='BANK'){
  const boundary:CanonicalMarketBoundary={transaction:r.transaction,membershipGroups:[...Object.values(r.geography).filter((id):id is string=>id!==null).map(id=>[id]),[r.propertyType]]}
  const raw=await orchestratorMemo('private-raw',JSON.stringify([auth.accountId,auth.population,auth.terms,boundary,!!r.profile]),async()=>{
  const rows=await readCanonicalMarketScalars(boundary,['canonical_domain_version','listing_status','transaction_type','currency','current_price','monthly_price','property_area','construction_area','created_at'])
  const evidence=await readCanonicalListingEvidence(rows.map(x=>x.id),r.profile?{facts:['bedrooms','bathrooms','parking','year_built','distance_to_paved_road'],semantics:['property_type','utility','environment','terrain','accessibility','legal_status']}:{facts:[],semantics:['property_type']})
  return recordAnalyticalEvidence('private-raw-snapshot',{rows,evidence,revision:digest({rows,evidence:[...evidence]})})
  });const {rows,evidence}=raw
  recordAnalyticalEvidence('private-acquisition-candidates',{request:r,authority:auth,rows,evidence})
  for(const row of rows){const e=evidence.get(row.id)!;if(row.canonical_domain_version!==1||row.listing_status!=='active'||row.transaction_type!==r.transaction||!matchesScope([...e.geography,...e.selections.map(t=>({id:t.ontology_term_id,term_type:t.term_type}))],r))continue;const basis=resolvePriceMeterPropertyBasis({propertyType:e.selections.find(t=>t.dimension==='property_type')?.slug,constructionArea:resolvePriceMeterAreaIdentity(row.construction_area)})
   const price=r.transaction==='sale'?row.current_price:row.monthly_price;if((r.profile??'ppm2')==='ppm2'&&(!['CRC','USD'].includes(row.currency)||typeof price!=='number'||!Number.isFinite(price)||price<=0))continue
   if((r.profile??'ppm2')==='ppm2'&&(basis!==r.propertyBasis||r.areaBasis==='land'&&resolvePriceMeterAreaIdentity(row.property_area).kind!=='exact'||r.areaBasis==='construction'&&basis!=='improved_property'))continue
   privateRows.push({population:'PRIVATE',listingId:row.id,row,evidence:e,propertyBasis:basis,areaBasis:r.areaBasis})
  }
 }
 if(r.population!=='PRIVATE'){
  const db=supabaseAdmin;let after:string|null=null;const ids=new Set<string>();const atTime=new Date().toISOString()
  for(;;){const scoped=currentOrchestratorContext();const response:any=scoped?await orchestratorMemo('bank-raw-page',JSON.stringify([auth.accountId,auth.population,auth.terms.map(t=>[t.id,t.startsAt,t.endsAt]),r.transaction,r.geography,r.propertyType,after]),async()=>{
    const page=await scoped.bankRead(r,after)
    // The original canonical page authority remains retained. Each consuming
    // profile independently authorized above; item content is capability-neutral.
    if(page.error||!page.data?.authority||authorityIdentity(page.data.authority)!==authorityIdentity(auth))fail()
    return page
   }):await db.rpc('read_canonical_bank_analytical_evidence',{p_account:auth.accountId,p_capability:r.capability,p_population:r.population,p_after:after});
   if(scoped){
    const manifest=response.data?.scopeEvidence
    if(!manifest||manifest.schema!=='bank-scoped-population-v1'||JSON.stringify(manifest.scope)!==JSON.stringify({transaction:r.transaction,geography:r.geography,propertyType:r.propertyType})) {
     if(!manifest||manifest.schema!=='bank-scoped-population-v1'||manifest.scope?.transaction!==r.transaction||manifest.scope?.propertyType!==r.propertyType||Object.entries(r.geography).some(([k,v])=>manifest.scope?.geography?.[k]!==v))fail()
    }
    recordAnalyticalEvidence('bank-scope-evidence',{phase:scoped.phase,request:r,authority:auth,after,manifest,dataRevision:response.data.dataRevision})
    const original=response.data?.authority
    if(!original||authorityIdentity({...original,capability:auth.capability})!==authorityIdentity(auth))fail()
    recordAnalyticalEvidence('bank-page-authority',{request:r,authority:auth,originalAuthority:original,after,dataRevision:response.data.dataRevision})
   }
   const pageSize=scoped?100:25
   const pageAuthority=scoped?{...response.data?.authority,capability:auth.capability}:response.data?.authority;const data:any=response.data,error=response.error
   if(error||!data||!/^[0-9a-f]{32}$/.test(data.dataRevision||'')||bankRevision!==null&&data.dataRevision!==bankRevision||!Array.isArray(data.items)||data.items.length>pageSize+1||!data.authority||!Array.isArray(data.authority.terms)||authorityIdentity(pageAuthority)!==authorityIdentity(auth))fail()
   bankRevision=data.dataRevision;for(const raw of data.items.slice(0,pageSize)){if(!uuid.test(raw.listingId)||ids.has(raw.listingId)||after&&raw.listingId<=after)fail();ids.add(raw.listingId);after=raw.listingId
    const value=reduceCanonicalBankObservation(raw,r,atTime);recordAnalyticalEvidence('bank-acquisition-decision',{phase:scoped?.phase??null,request:r,authority:auth,atTime,raw,value});if(value.observation)bank.push(value.observation);else excluded.push({listingId:raw.listingId,propertyId:raw.propertyId,reasons:value.reasons})
   }
   if(data.items.length<=pageSize)break
  }
 }
 const output={population:r.population,private:privateRows,bank,excluded,priceNormalization:'ORIGINAL_CURRENCY' as const,methodologyVersion:'canonical-population-acquisition-v1' as const,
 sourceDataRevision:digest({privateRows,bankRevision}),cacheIdentity:digest({bankRevision,profile:r.profile??'ppm2',capability:r.capability,population:r.population,geography:r.geography,propertyType:r.propertyType,propertyBasis:r.propertyBasis,transaction:r.transaction,financialBasis:r.population==='PRIVATE'?'PRIVATE_ASKING_PRICE':'SELLING_PRICE',areaBasis:r.areaBasis,methodology:'canonical-population-acquisition-v1',currency:'ORIGINAL_CURRENCY',authority:auth,privateRows,bank,excluded})}
 recordAnalyticalEvidence('acquisition-result',{request:r,authority:auth,output})
 // Request-local ownership follows existing analytical execution boundaries.
 // No legacy/shared cache is repurposed. Engine adapters remain Phase 4.3.
 const freeze=(v:any):any=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};const result=freeze(output) as AcquisitionResult;tickets.set(result,{request:r,authority:auth});return result
}
export async function acquireCanonicalPopulation(r:AcquisitionRequest):Promise<AcquisitionResult>{
 if(!currentOrchestratorContext())return acquireUnsharedPopulation(r)
 await authorize(r)
 const key=JSON.stringify({...r,capability:undefined})
 const result=await orchestratorMemo('population',key,()=>acquireUnsharedPopulation(r));currentOrchestratorContext()?.acquisitions.add(result);return result
}
export async function deliverCanonicalPopulation(result:AcquisitionResult):Promise<AcquisitionResult>{
 const ticket=tickets.get(result);if(!ticket)throw new PackageCapabilityDenied()
 const auth=await authorize(ticket.request);if(authorityIdentity(auth)!==authorityIdentity(ticket.authority))throw new PackageCapabilityDenied()
 // Reacquisition rechecks source revisions, source freshness and publication before
 // delivery. Possession of a cache identity grants no rights.
 const fresh=await acquireCanonicalPopulation(ticket.request);if(fresh.cacheIdentity!==result.cacheIdentity)throw Error('Stale analytical acquisition.')
 return fresh
}
