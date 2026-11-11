import {analyticalUniverse,assertUniverseScope} from './analytical-universe'
import 'server-only'
import {randomUUID} from 'node:crypto'
import {createServerSupabaseClient} from './supabase-server'
import {supabaseAdmin} from './supabase-admin'
import type {CreditAccounting,CreditAllocation,CreditEvent,CreditPurchase,OrchestratorIdentity,CreditPopulation} from './execution-credit-contract'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const unsigned=/^(0|[1-9]\d{0,18})$/
export class ExecutionCreditUnavailable extends Error {constructor(){super('Execution-credit accounting is unavailable.')}}
export async function executionCreditServerContext(){
 const db=await createServerSupabaseClient()
 const auth=await db.auth.getUser()
 if(auth.error||!auth.data.user)throw new ExecutionCreditUnavailable()
 const session=await db.auth.getSession()
 if(session.error||!session.data.session)throw new ExecutionCreditUnavailable()
 let raw:Record<string,unknown>
 try{raw=JSON.parse(Buffer.from(session.data.session.access_token.split('.')[1]??'','base64url').toString('utf8'))}catch{throw new ExecutionCreditUnavailable()}
 if(raw.sub!==auth.data.user.id||raw.role!=='authenticated'||typeof raw.session_id!=='string'||!uuid.test(raw.session_id)||typeof raw.exp!=='number'||!Number.isSafeInteger(raw.exp)||raw.exp<=Date.now()/1000||!['aal1','aal2'].includes(String(raw.aal)))throw new ExecutionCreditUnavailable()
 // getUser verified the current token. The database revalidates the exact live
 // canonical account/session and authority; no token or client role is forwarded.
 return {db,claims:{sub:auth.data.user.id,session_id:raw.session_id,role:'authenticated',aal:raw.aal,exp:raw.exp}}
}
async function command(request:string,body:Record<string,unknown>){
 if(!uuid.test(request)||JSON.stringify(body).length>16000)throw new ExecutionCreditUnavailable()
 const {claims}=await executionCreditServerContext()
 const r=await supabaseAdmin.rpc('execution_credit_service',{p_claims:claims,p_request:request,p_command:body})
 if(r.error||!r.data||typeof r.data!=='object')throw new ExecutionCreditUnavailable()
 return r.data as Record<string,unknown>
}
export async function readMyExecutionCreditAccounting(afterAllocation:string|null=null,afterEvent:string|null=null,afterPurchase:string|null=null):Promise<CreditAccounting>{
 if(afterPurchase!==null&&!uuid.test(afterPurchase))throw new ExecutionCreditUnavailable()
 if(afterAllocation!==null&&!uuid.test(afterAllocation)||afterEvent!==null&&(!unsigned.test(afterEvent)||afterEvent==='0'))throw new ExecutionCreditUnavailable()
 // Lazy synchronization derives allocations solely from already-effective,
 // verified monthly terms/current Admin authority. Customers cannot issue quantities.
 await command(randomUUID(),{operation:'sync'})
 const {db}=await executionCreditServerContext()
 const r=await db.rpc('read_execution_credits',{p_after_allocation:afterAllocation,p_after_event:afterEvent})
 const v=r.data
 if(r.error||!v||typeof v.ownerUnmetered!=='boolean'||typeof v.balance!=='string'||!unsigned.test(v.balance)||!Array.isArray(v.allocations)||v.allocations.length>26||!Array.isArray(v.events)||v.events.length>26||v.purchase?.enabled!==false||v.purchase?.usdUnit!=='1'||v.purchase?.crcUnit!=='500'||JSON.stringify(v.purchase?.quantities)!=='[2,5,10,20,50]')throw new ExecutionCreditUnavailable()
 if(v.allocations.some((a:CreditAllocation)=>!uuid.test(a.id)||!['INCLUDED_PACKAGE','PURCHASED','ADMIN_ALLOWANCE'].includes(a.kind)||typeof a.quantity!=='string'||!unsigned.test(a.quantity)||typeof a.remaining!=='string'||!unsigned.test(a.remaining)||typeof a.active!=='boolean')||v.events.some((e:CreditEvent)=>typeof e.id!=='string'||!unsigned.test(e.id)||typeof e.quantity!=='string'||! /^-?\d{1,19}$/.test(e.quantity)))throw new ExecutionCreditUnavailable()
 const orders=await db.rpc('read_customer_commercial',{p_area:'tokens',p_after:afterPurchase,p_id:null,p_listing:null,p_history:false})
 if(orders.error||!Array.isArray(orders.data)||orders.data.length>26||orders.data.some((x:CreditPurchase)=>!uuid.test(x.id)||typeof x.quantity!=='string'||!unsigned.test(x.quantity)||typeof x.paid!=='boolean'||typeof x.fulfilled!=='boolean'))throw new ExecutionCreditUnavailable()
 const purchases=orders.data.slice(0,25) as CreditPurchase[]
 const allocations=v.allocations.slice(0,25) as CreditAllocation[],events=v.events.slice(0,25) as CreditEvent[]
 return {purchases,nextPurchase:orders.data.length>25?purchases[24].id:null,ownerUnmetered:v.ownerUnmetered,balance:v.balance,allocations,events,nextAllocation:v.allocations.length>25?allocations[24].id:null,nextEvent:v.events.length>25?events[24].id:null,purchase:v.purchase}
}
// Internal integration interfaces. No browser action or orchestrator endpoint
// exposes reservation, settlement, purchase crediting, adjustment or report attestation.
export async function reserveExecutionCredit(input:{requestId:string;executionId:string;orchestrator:OrchestratorIdentity;population:CreditPopulation;question:Record<string,unknown>}){
 analyticalUniverse(input.population)
 if(!uuid.test(input.executionId))throw new ExecutionCreditUnavailable()
 return command(input.requestId,{operation:'reserve',execution:input.executionId,orchestrator:input.orchestrator,population:input.population,request:input.question})
}
export async function releaseExecutionCredit(requestId:string,executionId:string,reason:'REQUEST_REJECTED'|'REQUIRED_ENGINE_FAILED'|'REPORT_COMPOSITION_FAILED'|'PERSISTENCE_FAILED'|'ENTIRELY_UNDEFINED'|'AUTHORIZATION_LOST'|'SYSTEM_FAILURE'){
 if(!uuid.test(executionId))throw new ExecutionCreditUnavailable()
 return command(requestId,{operation:'release',execution:executionId,reason})
}
export async function recordDurableExecutionReport(executionId:string,reportId:string,body:Record<string,unknown>){
 if(!uuid.test(executionId)||!uuid.test(reportId)||Buffer.byteLength(JSON.stringify(body))>262144)throw new ExecutionCreditUnavailable()
 const {claims}=await executionCreditServerContext(),r=await supabaseAdmin.rpc('record_execution_credit_report',{p_claims:claims,p_execution:executionId,p_report:reportId,p_body:body})
 if(r.error)throw new ExecutionCreditUnavailable();return r.data
}
export async function settleExecutionCredit(requestId:string,executionId:string){
 if(!uuid.test(executionId))throw new ExecutionCreditUnavailable()
 return command(requestId,{operation:'settle',execution:executionId})
}
export async function readMyCompletedExecutionReport(reportId:string){
 if(!uuid.test(reportId))throw new ExecutionCreditUnavailable()
 const {db}=await executionCreditServerContext(),r=await db.rpc('read_completed_execution_report',{p_report:reportId})
 if(r.error)throw new ExecutionCreditUnavailable();analyticalUniverse(r.data?.population);return r.data as Record<string,unknown>
}
