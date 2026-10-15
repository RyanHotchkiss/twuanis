import 'server-only'
import {canonicalAcquisitionPlan} from './canonical-acquisition-plan'
import {resolveCanonicalMarketRequest} from './canonical-market-request'
import {compactOrchestratorReport} from './orchestrator-report-delivery'
import {recordAnalyticalEvidence} from './orchestrator-evidence-v2'
import {claimWitnessedExecution} from './orchestrator-execution-witness'
import {supabase as dictionaryClient} from './supabase'
import {getHistoricalUsdToCrcRate} from './fx/fx-service'
import {orchestratorMethodologyEvidence} from './orchestrator-methodology'
import {validateGeographicRow} from './geography/dta-identity'
import {PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS} from './price-meter-cross-dimensional-question'
import {PROPERTY_AREA_RANGE_OPTIONS,CONSTRUCTION_AREA_RANGE_OPTIONS} from './market-intelligence-area-ranges'
import {createHash,randomUUID} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {supabaseAdmin} from './supabase-admin'
import {executionCreditServerContext,readMyCompletedExecutionReport,releaseExecutionCredit} from './execution-credits-server'
import {POPULATION_ENGINES,type PopulationEngineId} from './population-engine-registry'
import {executePopulationEngine,validatePopulationEngineRequest,type PopulationEngineRequest,type PopulationEngineResult} from './population-engine-execution'
import {acquireCanonicalPopulation,deliverCanonicalPopulation,type AcquisitionResult} from './canonical-population-acquisition'
import {withOrchestratorContext,type OrchestratorContext} from './orchestrator-execution-context'
import {noAnalyticalResults,type OrchestratorRequest,type OrchestratorReport,type OrchestratorReply,type SavedOrchestratorReport} from './orchestrator-contract'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const seven=['summary','composition','market-asking-price-distribution','matching','comparison','geography','discovery'] as const
export function orchestratorMembers(id:string):PopulationEngineId[]{if(id==='orchestrator-market-comparison')return [...seven];if(id==='orchestrator-markets-current-valuation-of-property')return POPULATION_ENGINES.map(e=>e[0]);throw Error('Unknown orchestrator.')}
const identity=(account:string,request:string,kind:string)=>{const h=createHash('sha256').update(account+':'+request+':'+kind).digest('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-8'+h.slice(17,20)+'-'+h.slice(20,32)}
export function validateOrchestratorRequest(raw:unknown):OrchestratorRequest{
 if(!raw||typeof raw!=='object'||JSON.stringify(raw).length>14000)throw Error('Bounded request required.')
 const r=JSON.parse(JSON.stringify(raw)) as OrchestratorRequest
 if(Object.keys(r).sort().join()!=='confirmed,filters,language,options,orchestrator,population,requestId,scope,subject'||r.confirmed!==true||!uuid.test(r.requestId)||!['en','es'].includes(r.language)||!['PRIVATE','BANK','COMBINED'].includes(r.population))throw Error('Confirmed exact request required.')
 const members=orchestratorMembers(r.orchestrator)
 if(!r.scope||Object.keys(r.scope).sort().join()!=='areaBasis,geography,propertyBasis,propertyType,transaction'||!['sale','rent'].includes(r.scope.transaction)||!['land_only','improved_property'].includes(r.scope.propertyBasis)||!['land','construction'].includes(r.scope.areaBasis)||r.scope.propertyBasis==='land_only'&&r.scope.areaBasis!=='land'||!r.scope.geography||Object.keys(r.scope.geography).sort().join()!=='canton,district,province')throw Error('Canonical scope required.')
 for(const value of [r.scope.propertyType,...Object.values(r.scope.geography).filter(x=>x!==null)])if(typeof value!=='string'||! /^-?\d{1,19}$/.test(value))throw Error('Canonical term identity required.')
 if(r.scope.geography.district&&!r.scope.geography.canton||r.scope.geography.canton&&!r.scope.geography.province)throw Error('Canonical geographic ancestry required.')
 if(!r.filters||typeof r.filters!=='object'||!r.options||Array.isArray(r.options)||typeof r.options!=='object'||Object.keys(r.options).some(k=>!['questionKey','referencePopulation','geographyLevel','activeDimensions','cohortA','cohortB','referenceCohort','ratioQuestion'].includes(k)))throw Error('Supported engine options required.')
 if(r.subject?.kind==='CANONICAL'){if(Object.keys(r.subject).sort().join()!=='kind,listingId,population'||!uuid.test(r.subject.listingId)||!['PRIVATE','BANK'].includes(r.subject.population)||r.population!=='COMBINED'&&r.subject.population!==r.population)throw Error('Canonical subject identity required.')}
 else if(r.subject?.kind==='HYPOTHETICAL'){
  if(Object.keys(r.subject).sort().join()!=='attributes,kind'||!r.subject.attributes||Array.isArray(r.subject.attributes)||Object.entries(r.subject.attributes).some(([k,v])=>!['property_area','construction_area','bedrooms','bathrooms','parking','asking_price','currency','year_built'].includes(k)||typeof v!=='string'||(k==='currency'?!['USD','CRC'].includes(v):! /^(0|[1-9]\d{0,10})(\.\d{1,6})?$/.test(v))))throw Error('Customer-provided supported attributes required.')
 }else throw Error('Subject type required.')
 for(const key of ['cohortA','cohortB'] as const){const c=r.options[key] as {characteristicIds?:unknown}|undefined;if(c&&(!Array.isArray(c.characteristicIds)||c.characteristicIds.length!==2||c.characteristicIds.some((id:unknown)=>typeof id!=='string'||! /^-?\d{1,19}$/.test(id))))throw Error('Complete both canonical cohort characteristics or clear the cohort.')}
 for(const engine of members)validatePopulationEngineRequest(engineRequest(r,engine))
 return r
}
// Forward only options consumed by this engine. The immutable request still records all supplied evidence.
function engineOptions(options:OrchestratorRequest['options'],engine:PopulationEngineId){
 const keys:Record<string,string[]>={geography:['geographyLevel'],'cohort-comparison':['geographyLevel','cohortA','cohortB','referenceCohort'],'cross-dimensional':['questionKey'],comparables:['geographyLevel','activeDimensions','referencePopulation'],position:['referencePopulation'],'asking-area-ratio':['ratioQuestion'],'weighted-price':['ratioQuestion']}
 return Object.fromEntries(Object.entries(options).filter(([key])=>(keys[engine]??[]).includes(key)))
}
function engineRequest(r:OrchestratorRequest,engine:PopulationEngineId):PopulationEngineRequest{return {engine,scope:{...r.scope,population:r.population},language:r.language,filters:r.filters,...engineOptions(r.options,engine),...(r.subject.kind==='CANONICAL'?{subject:{population:r.subject.population,listingId:r.subject.listingId}}:engine==='weighted-price'&&r.options.ratioQuestion&&r.subject.attributes.property_area&&r.subject.attributes.construction_area&&r.scope.geography.province&&r.scope.geography.canton?{hypotheticalSubject:{kind:'hypothetical',propertyArea:r.subject.attributes.property_area,constructionArea:r.subject.attributes.construction_area,province:r.scope.geography.province,canton:r.scope.geography.canton,district:r.scope.geography.district,askingPrice:r.subject.attributes.asking_price?{amount:r.subject.attributes.asking_price,currency:r.subject.attributes.currency}:null}}:{})} as PopulationEngineRequest}
export function substantiveEngineResult(value:PopulationEngineResult):boolean{
 const parts=[value.private,value.bank].filter(Boolean) as {n:number;result:any}[]
 return parts.some(p=>{
  const v=p.result;if(!p.n||!v||typeof v!=='object'||v.state&& !['ESTABLISHED','established','complete','subject_position','distribution_only'].includes(v.state))return false
  if(Array.isArray(v))return value.engine==='matching'?v.some(x=>x.matchState==='ESTABLISHED'):value.engine==='geography'?v.some(x=>x.distribution?.sampleSize>0&&Number.isFinite(x.distribution?.median)):v.length>0
  switch(value.engine){
   case 'composition':return v.n>0
   case 'size':return v.population?.bands?.some((b:any)=>b.observationCount>0)??false
   case 'construction-land':return v.cohorts?.some((c:any)=>c.n>0)??false
   case 'cross-dimensional':return v.establishedSecondaryCohortCount>0
   case 'market-asking-price-distribution':return v.askingPricePopulation>0&&v.outcome==='complete'
   case 'distribution':return v.sampleSize>0&&Number.isFinite(v.median)
   case 'discovery':return v.n>0&&v.statistics!==null
   case 'asking-area-ratio':return v.state==='established'
   case 'weighted-price':return ['subject_position','distribution_only'].includes(v.state)&&v.weighting?.state==='established'
   case 'comparison':return value.population==='COMBINED'&&((value.private?.result as any)?.prevalence?.n??0)>0&&((value.bank?.result as any)?.prevalence?.n??0)>0
   case 'cohort-comparison':return v.cohortA?.sampleSize>0&&v.cohortB?.sampleSize>0
   case 'comparables':return v.sampleSize>0
   default:return Object.keys(v).length>0
  }
 })
}
function ensureFinite(v:unknown):void{if(typeof v==='number'&&!Number.isFinite(v))throw Error('Nonfinite engine evidence.');if(v&&typeof v==='object')Object.values(v).forEach(ensureFinite)}
async function authority(orchestrator:string,population:string){const {db}=await executionCreditServerContext();const v=await db.rpc('read_execution_credit_authority',{p_orchestrator:orchestrator,p_population:population});if(v.error||!v.data?.accountId||!Array.isArray(v.data.capabilities))throw Error('Orchestrator authority required.');return v.data as Record<string,any>}
function scopedContext(r:Pick<OrchestratorRequest,'orchestrator'|'population'|'scope'>&{requestId?:string},expected:Record<string,any>):OrchestratorContext{const requestId=r.requestId??randomUUID();return {
 identity:{executionId:identity(expected.accountId,requestId,'execution'),accountId:expected.accountId,requestId,orchestrator:r.orchestrator,population:r.population},phase:'execution',plan:canonicalAcquisitionPlan({...r.scope,population:r.population},orchestratorMembers(r.orchestrator),expected.capabilities),
 cache:new Map(),acquisitions:new Set(),metrics:{hits:0,misses:0},
 authorize:async scope=>{const a=await authority(r.orchestrator,r.population);if(JSON.stringify(a)!==JSON.stringify(expected)||!a.capabilities.includes(scope.capability)||scope.population!==r.population)throw Error('Analytical authorization changed.');const {db}=await executionCreditServerContext();if(a.kind==='OWNER_UNMETERED'||scope.population==='PRIVATE')return {accountId:a.accountId,capability:scope.capability,population:scope.population,terms:[]};const v=await db.rpc('read_analytical_population_authority',{p_capability:scope.capability,p_population:scope.population});if(v.error||v.data?.accountId!==a.accountId)throw Error('Same-term Bank authority required.');return v.data},
 bankRead:async(scope,after)=>{const {claims}=await executionCreditServerContext();return supabaseAdmin.rpc('read_orchestrator_bank_evidence',{p_claims:claims,p_orchestrator:r.orchestrator,p_capability:scope.capability,p_population:scope.population,p_scope:{transaction:scope.transaction,geography:scope.geography,propertyType:scope.propertyType},p_after:after})}
}}
function subjectEvidence(r:OrchestratorRequest,inventory:AcquisitionResult):Record<string,unknown>{
 if(r.subject.kind==='HYPOTHETICAL')return {kind:'HYPOTHETICAL',attributes:r.subject.attributes,scope:r.scope,provenance:'CUSTOMER_PROVIDED',canonicalEvidence:null,limitations:['Canonical-subject-only sections remain unsupported. Compatible hypothetical weighted-price inputs reuse the established contract. Optional customer asking price is not an observed listing price.']}
 const s=r.subject
 if(s.population==='PRIVATE'){const p=inventory.private.find(x=>x.listingId===s.listingId);if(!p)throw Error('Subject is outside eligible canonical scope.');return {...s,sourceIdentity:{population:'PRIVATE',listingId:p.listingId},propertyBasis:p.propertyBasis,areaBasis:p.areaBasis,attributes:p.row,classification:p.evidence,revision:inventory.sourceDataRevision}}
 const b=inventory.bank.find(x=>x.listingId===s.listingId);if(!b)throw Error('Subject is outside eligible canonical scope.');return {...s,sourceIdentity:{sourceId:b.sourceId,namespace:b.sourceNamespace,recordKey:b.recordKey,propertyId:b.propertyId,offeringId:b.offeringId},geography:b.geography,propertyType:b.propertyType,propertyBasis:b.propertyBasis,areaBasis:b.areaBasis,areaSelection:b.areaSelection,price:b.price,land:b.land,construction:b.construction,facts:b.otherFacts,semantics:b.semantics,revisions:b.revisions,observedAt:b.observedAt,revision:inventory.sourceDataRevision}
}
async function validateScope(r:OrchestratorRequest){const ids=[r.scope.propertyType,...Object.values(r.scope.geography).filter((v):v is string=>v!==null)];const v=await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,term_type,level,official_code').in('id',ids);if(v.error||v.data?.length!==new Set(ids).size)throw Error('Canonical scope unavailable.');const type=v.data.find(t=>t.id===r.scope.propertyType);if(type?.term_type!=='property_type'||type.level!==1)throw Error('Canonical property type required.');for(const [level,id]of Object.entries(r.scope.geography)){if(id===null)continue;const t=v.data.find(t=>t.id===id);if(t)validateGeographicRow(t,level as 'province'|'canton'|'district');if(t?.term_type!==level||level==='canton'&&t.parent_id!==r.scope.geography.province||level==='district'&&t.parent_id!==r.scope.geography.canton)throw Error('Canonical geography mismatch.')}}
export async function executeOrchestrator(raw:unknown):Promise<OrchestratorReply>{
 const result=await executeEvidenceOrchestrator(raw)
 return result.report?{...result,report:compactOrchestratorReport(result.report)}:result
}
async function executeEvidenceOrchestrator(raw:unknown):Promise<OrchestratorReply>{
 const r=validateOrchestratorRequest(raw),a=await authority(r.orchestrator,r.population);await validateScope(r)
 const execution=identity(a.accountId,r.requestId,'execution'),reportId=identity(a.accountId,r.requestId,'report'),settlement=identity(a.accountId,r.requestId,'settlement'),worker=randomUUID();const {claims}=await executionCreditServerContext()
 const witness=await claimWitnessedExecution({claims,request:r,execution,worker,reportId,settlement});const claim=witness.claim
 if(claim.error)throw Error('Execution reservation unavailable.')
 if(claim.data.state==='WORKING')return {state:'WORKING',execution}
 if(claim.data.state==='RELEASED')return {state:'RELEASED',execution,message:claim.data.reason==='ENTIRELY_UNDEFINED'?noAnalyticalResults[r.language]:(r.language==='es'?'Reserva liberada; consulte Contabilidad.':'Reservation released; check Accounting.')}
 if(claim.data.state==='COMPLETED')return {state:'COMPLETED',execution,report:await readMyCompletedExecutionReport(reportId) as unknown as OrchestratorReport}
 if(claim.data.resumeCommit){const v=await supabaseAdmin.rpc('orchestrator_execution_commit',{p_claims:claims,p_execution:execution,p_worker:worker,p_report:reportId,p_body:null,p_settlement:settlement});if(v.error)throw Error('Report recovery unavailable.');return v.data.state==='COMPLETED'?{state:'COMPLETED',execution,report:await readMyCompletedExecutionReport(reportId)as unknown as OrchestratorReport}:{state:'RELEASED',execution,message:noAnalyticalResults[r.language]}}
 const context=scopedContext(r,a),started=performance.now(),cpu=process.cpuUsage()
 try{const report=await witness.capture(()=>withOrchestratorContext(context,async()=>{
  recordAnalyticalEvidence('canonical-acquisition-plan',context.plan)
  const filters=await resolveCanonicalMarketRequest({...r.filters,transaction_type:r.scope.transaction,property_type:r.scope.propertyType},r.language)
  context.cache.set(JSON.stringify([context.identity,context.phase,'request',JSON.stringify([r.filters,r.scope.transaction,r.scope.propertyType,r.language])]),Promise.resolve(filters))
  const inventory=await acquireCanonicalPopulation({...r.scope,population:r.population,capability:'cap-market-summary',profile:'inventory'}),subject=subjectEvidence(r,inventory),engines:OrchestratorReport['engines']=[]
  for(const id of orchestratorMembers(r.orchestrator)){
   if(performance.now()-started>120000)throw Object.assign(new Error('Bounded execution time exceeded.'),{name:'OrchestratorResourceLimit'})
   const at=performance.now(),result=await executePopulationEngine(engineRequest(r,id));ensureFinite(result);if(performance.now()-started>120000)throw Object.assign(new Error('Bounded execution time exceeded.'),{name:'OrchestratorResourceLimit'})
   const substantive=substantiveEngineResult(result)
   engines.push({id,state:substantive?'SUBSTANTIVE':'UNDEFINED',...(substantive?{result}:{reason:id==='comparison'&&r.population!=='COMBINED'?'independent_comparison_populations_required':r.subject.kind==='HYPOTHETICAL'&&['position','comparables'].includes(id)?'canonical_subject_required':'no_established_engine_result',result}),executed:true,durationMs:performance.now()-at,methodology:result.methodology})
  }
  const acquisitions=[...context.acquisitions];context.cache.clear();context.phase='freshness'
  for(const snapshot of acquisitions)await deliverCanonicalPopulation(snapshot)
  const fxSnapshots=new Map<string,PopulationEngineResult['fx']>();for(const e of engines){const value=e.result as PopulationEngineResult;if(value.fx)fxSnapshots.set(value.analyticalDate,value.fx)}
  for(const [date,fx]of fxSnapshots){const fresh=await getHistoricalUsdToCrcRate(date);if(JSON.stringify({...fresh,conversionApplied:true})!==JSON.stringify(fx))throw Error('BCCR evidence changed before commitment.')}
  const composedAt=performance.now(),report:OrchestratorReport={format:'twuanis-orchestrator-evidence-v2',executionId:execution,reportId,accountId:a.accountId,orchestrator:r.orchestrator,population:r.population,language:r.language,request:r as unknown as Record<string,unknown>,createdAt:new Date().toISOString(),authority:a,subject,engines,evidence:{executionStartedAt:claim.data.createdAt,methodology:orchestratorMethodologyEvidence,revisions:acquisitions.map(v=>v.sourceDataRevision),financialBasis:{PRIVATE:'ADVERTISED_ASKING_PRICE',BANK:'SELLING_PRICE'},originalPrices:{PRIVATE:inventory.private.map(v=>({listingId:v.listingId,currency:v.row.currency,amount:r.scope.transaction==='sale'?v.row.current_price:v.row.monthly_price,land:v.row.property_area,construction:v.row.construction_area,createdAt:v.row.created_at,geography:v.evidence.geography.map(g=>g.id),semantics:v.evidence.selections.map(t=>({dimension:t.dimension,termId:t.ontology_term_id})),facts:v.evidence.facts})),BANK:inventory.bank.map(v=>({listingId:v.listingId,sourceId:v.sourceId,recordKey:v.recordKey,price:v.price,namespace:v.sourceNamespace,observedAt:v.observedAt,contentHash:v.contentHash,revisions:v.revisions,land:v.land,construction:v.construction,geography:v.geography.map(g=>g.id)}))},metrics:{wallMs:performance.now()-started,cpu:process.cpuUsage(cpu),memory:process.memoryUsage(),cache:context.metrics,compositionMs:performance.now()-composedAt}},accounting:{executionId:execution,settlementRequestId:settlement,expectedUnits:engines.some(e=>e.state==='SUBSTANTIVE')&&a.kind!=='OWNER_UNMETERED'?1:0},limitations:['Asking-market evidence only; not appraisal or predicted transaction price.','PRIVATE and BANK remain separate; only existing crossMarket evidence is presented.','Final report presentation and branded downloadable hypothetical example require Owner review.']}
  recordAnalyticalEvidence('execution-identity',{execution,reportId,accountId:a.accountId,request:r,authority:a,createdAt:report.createdAt,methodology:orchestratorMethodologyEvidence})
  ensureFinite(report)
  return report
 }));
  if(performance.now()-started>120000)throw Object.assign(new Error('Bounded execution time exceeded.'),{name:'OrchestratorResourceLimit'})
  const fresh=await executionCreditServerContext(),committed=await supabaseAdmin.rpc('orchestrator_execution_commit',{p_claims:fresh.claims,p_execution:execution,p_worker:worker,p_report:reportId,p_body:report,p_settlement:settlement});if(committed.error)throw Error('Durable report commitment failed.')
  if(committed.data.state!=='COMPLETED')return {state:'RELEASED',execution,message:noAnalyticalResults[r.language]}
  if(JSON.stringify(await authority(r.orchestrator,r.population))!==JSON.stringify(a))throw Error('Execution authority changed before delivery.')
  return {state:'COMPLETED',execution,report:await readMyCompletedExecutionReport(reportId)as unknown as OrchestratorReport}
 }catch(error){
  let released=false
  try{const receipt=await releaseExecutionCredit(identity(a.accountId,r.requestId,'release'),execution,'SYSTEM_FAILURE');released=receipt?.state==='RELEASED'}catch{/* Existing lease expiration recovers a disconnected/expired canonical session. */}
  if(released&&error instanceof Error&&(error.name==='OrchestratorResourceLimit'||error.message==='Bounded execution time exceeded.'))return {state:'RELEASED',execution,message:error.message==='Bounded execution time exceeded.'?(r.language==='es'?'No se pudo completar el análisis de toda la población dentro del tiempo disponible. No se generó un informe ni se consumió un token.':'The analysis could not finish the complete population within the available time. No report was created and no token was consumed.'):error.message}
  throw error
 }
}
export async function orchestratorCatalog(){const {claims,db}=await executionCreditServerContext();const credits=await db.rpc('read_execution_credits',{});if(credits.error||!credits.data)throw Error('Execution-credit prerequisites unavailable.');const accounting=credits.data,available=[];for(const orchestrator of ['orchestrator-markets-current-valuation-of-property','orchestrator-market-comparison']){for(const population of ['PRIVATE','BANK','COMBINED']){try{const a=await authority(orchestrator,population);available.push({orchestrator,population,engineCount:orchestratorMembers(orchestrator).length,ownerUnmetered:a.kind==='OWNER_UNMETERED'})}catch{}}}const catalog=await db.rpc('read_intelligence_package_catalog',{});if(catalog.error)throw Error('Package catalog unavailable.');return {packages:catalog.data,accountId:claims.sub,balance:accounting.balance,ownerUnmetered:accounting.ownerUnmetered,available,inputs:{questions:PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS.map(q=>({key:q.key,question:q.question})),propertyArea:PROPERTY_AREA_RANGE_OPTIONS,constructionArea:CONSTRUCTION_AREA_RANGE_OPTIONS}}}
export async function savedOrchestratorReports(after:string|null=null):Promise<SavedOrchestratorReport[]>{if(after!==null&&!uuid.test(after))throw Error('Invalid cursor.');const {db}=await executionCreditServerContext(),v=await db.rpc('read_orchestrator_reports',{p_after:after});if(v.error||!Array.isArray(v.data)||v.data.length>26)throw Error('Reports unavailable.');return v.data}
export async function selectOrchestratorSubjects(r:Omit<OrchestratorRequest,'requestId'|'subject'|'filters'|'options'|'confirmed'>,after:string|null=null){if(after!==null&&! /^(BANK|PRIVATE):[0-9a-f-]{36}$/i.test(after))throw Error('Invalid subject cursor.');const a=await authority(r.orchestrator,r.population);const context=scopedContext(r,a);return withOrchestratorContext(context,async()=>{const inventory=await acquireCanonicalPopulation({...r.scope,population:r.population,capability:'cap-market-summary',profile:'inventory'});await deliverCanonicalPopulation(inventory);const rows=[...inventory.private.map(v=>({population:'PRIVATE' as const,listingId:v.listingId,preview:{propertyType:v.evidence.selections.find(x=>x.dimension==='property_type')?.term_name??null,geography:v.evidence.geography.map(x=>({id:x.id,name:r.language==='es'?x.term_name_es??x.term_name:x.term_name_en??x.term_name})),landArea:v.row.property_area==null?null:String(v.row.property_area),constructionArea:v.row.construction_area==null?null:String(v.row.construction_area),characteristics:v.evidence.facts.map(x=>({dimension:x.dimension,value:x.exact_value}))}})),...inventory.bank.map(v=>({population:'BANK' as const,listingId:v.listingId,preview:{propertyType:null as string|null,geography:v.geography.map(x=>({id:x.id,name:r.language==='es'?x.term_name_es??x.term_name:x.term_name_en??x.term_name})),landArea:v.land?.value??null,constructionArea:v.construction?.value??null,characteristics:[] as {dimension:string;value:string|null}[]}}))].sort((a,b)=>a.population+':'+a.listingId<b.population+':'+b.listingId?-1:a.population+':'+a.listingId>b.population+':'+b.listingId?1:0).filter(v=>after===null||v.population+':'+v.listingId>after).slice(0,201);return {items:rows.slice(0,200),next:rows.length>200?rows[199].population+':'+rows[199].listingId:null}})}
export async function orchestratorTerms(orchestrator:string,population:string,dimension:string,parent:string|null,after:string|null=null){
 // Reference browsing uses the existing dictionary RLS, never analytical authority or accounting.
 const db=dictionaryClient
 if(!['property_type','province','canton','district','bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status'].includes(dimension)||parent!==null&&! /^-?\d{1,19}$/.test(parent)||after!==null&&! /^-?\d{1,19}$/.test(after))throw Error('Canonical dimension required.')
 let q=db.from('ontology_terms').select('id::text,parent_id::text,term_name,term_name_en,term_name_es').eq('term_type',dimension).order('id').limit(101)
 if(parent!==null)q=q.eq('parent_id',parent)
 if(after!==null)q=q.gt('id',after)
 const v=await q;if(v.error||!v.data)throw Error('Canonical choices unavailable.');return {items:v.data.slice(0,100),next:v.data.length>100?v.data[99].id:null}
}
