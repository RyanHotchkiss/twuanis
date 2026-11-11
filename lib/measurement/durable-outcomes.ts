import 'server-only'
import {journeyMaintenanceEnabled} from './journey-enabled'
import {measurementOwnerExcluded} from './owner-exclusion'
import {createHash} from 'node:crypto'
import {admit} from './admission'
import {opaqueOutcome} from './server-projection'
import type {EventName,EventPayloads} from './types'
export type Rpc={rpc:(name:string,args:Record<string,unknown>)=>PromiseLike<{data:any;error:any}>}
export type GrantPointer={id:string;revision:number}
export type Event='purchase'|'tw_payment_state'|'tw_entitlement_state'|'tw_execution_result'|'tw_report_ready'
export function localPersistenceEnabled(){try{return process.env.TWUANIS_MEASUREMENT_DURABLE_LOCAL==='1'&&['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'').hostname)}catch{return false}}
export function productionBasicMeasurementEnabled(){return process.env.VERCEL_ENV==='production'&&process.env.TWUANIS_MEASUREMENT_BASIC_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED==='1'&&process.env.NEXT_PUBLIC_SUPABASE_URL==='https://szhpqemhjyvvqgjgsmsw.supabase.co'}
export function productionMaintenanceEnabled(){return process.env.TWUANIS_MEASUREMENT_DURABLE_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_MAINTENANCE_ENABLED==='1'&&process.env.NEXT_PUBLIC_SUPABASE_URL==='https://szhpqemhjyvvqgjgsmsw.supabase.co'}
export function productionPersistenceEnabled(){return productionMaintenanceEnabled()&&process.env.TWUANIS_MEASUREMENT_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED==='1'&&process.env.TWUANIS_MEASUREMENT_CLEANUP_READY==='1'&&process.env.NEXT_PUBLIC_SUPABASE_URL==='https://szhpqemhjyvvqgjgsmsw.supabase.co'}
export function persistenceEnabled(){return localPersistenceEnabled()||productionPersistenceEnabled()}
export async function rpc(db:Rpc,name:string,args:Record<string,unknown>){
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined
 try{let request=db.rpc(name,args);const cancellable=request as typeof request & {abortSignal?:(signal:AbortSignal)=>typeof request};if(cancellable.abortSignal)request=cancellable.abortSignal(controller.signal)
 const r=await Promise.race([request,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('measurement_timeout'))},500)})]);if(r.error)throw Error('measurement_unavailable');return r.data
 }finally{if(timer)clearTimeout(timer)}
}
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
// Source metadata is read by the private SQL authority adapter, never supplied by the browser.
export function projected(r:any){
 if(r?.state!=='CLAIMED'||!['isolated_test','production'].includes(r.environment)||!['en','es'].includes(r.locale)||!/^\d{1,20}\.\d{1,20}$/.test(r.clientId)||!/^e[a-f0-9]{64}$/.test(r.eventId))return
 const a=r.authority,base={schema_v:'1-proposed',event_id:r.eventId,locale:r.locale,page_instance:r.page,consent_epoch:r.epoch,environment:r.environment};let p:Record<string,unknown>
 if(Number.isSafeInteger(r.gaSessionId)&&r.gaSessionId>0)Object.assign(base,{session_id:r.gaSessionId,engagement_time_msec:1})
 if(r.event==='purchase'){
  if(!a||typeof a.amount!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(a.amount)||!['USD','CRC'].includes(a.currency)||!Number.isSafeInteger(Math.round(Number(a.amount)*100)))return
  p={...base,transaction_id:opaqueOutcome('purchase',r.subject),currency:a.currency,value:Number(a.amount),items:[{item_id:a.product_id,quantity:1,price:Number(a.amount)}]}
 }else if(r.event==='tw_payment_state')p={...base,payment_measurement_key:opaqueOutcome('payment',a.receipt_ref),state:'verified',package_id:a.product_id}
 else if(r.event==='tw_entitlement_state')p={...base,entitlement_measurement_key:opaqueOutcome('entitlement',a.receipt_ref),package_id:a.product_id,market_variant:'unknown',duration_kind:'unknown',state:'active'}
 else if(r.event==='tw_report_ready')p={...base,report_measurement_key:opaqueOutcome('report',a.receipt_ref),execution_measurement_key:opaqueOutcome('execution',r.subject),report_kind:'orchestrator'}
 else if(r.event==='tw_execution_result')p={...base,execution_measurement_key:opaqueOutcome('execution',r.subject),outcome:a.status,result_grain:'orchestrator',capability_kind:'orchestrator',capability_id:a.capability_id}
 else return
 if(!admit(r.event as EventName,p as unknown as EventPayloads[EventName],'server'))return
 const micros=Date.parse(a.outcome_at)*1000;if(!Number.isSafeInteger(micros)||micros>Date.now()*1000||Date.now()*1000-micros>=72*3600*1000000)return
 return {client_id:r.clientId,timestamp_micros:micros,consent:{ad_user_data:'DENIED',ad_personalization:'DENIED'},events:[{name:r.event,params:p}]}
}
export type Transport=(body:NonNullable<ReturnType<typeof projected>>,signal:AbortSignal)=>Promise<{status:number}>
// No fetch, API secret, retry, worker or provider configuration is installed.
// An explicitly supplied local test transport exercises commitment/uncertainty only.
export async function deliverBoundOutcome(db:Rpc,id:string,account:string,transport?:Transport,testEnvelope?:'debug'){
 if(measurementOwnerExcluded(account))return {state:'SUPPRESSED_OWNER'}
 if(!transport||!persistenceEnabled())return {state:'DISABLED'}
 let reservation:any,attempted=false,commitRequested=false
 try{
  reservation=await rpc(db,process.env.TWUANIS_MEASUREMENT_R4_GA4_ENABLED==='1'||journeyMaintenanceEnabled()?'ka10_outcome_reserve_r4':'ka09_outcome_reserve',{p_id:id,p_account:account});if(reservation?.state!=='CLAIMED')return reservation
  const body=projected(reservation);if(!body)return {state:'SUPPRESSED_INVALID_PROJECTION'}
  // Explicit fixed debug envelope for an authorized isolated local test only.
  // Normal schema admission precedes decoration; the exact wire body is hashed.
  if(testEnvelope==='debug'&&!localPersistenceEnabled())return {state:'DISABLED'}
  if(testEnvelope==='debug')Object.assign(body.events[0].params,{debug_mode:1,engagement_time_msec:1})
  commitRequested=true;const begin=await rpc(db,'ka09_outcome_begin',{p_id:id,p_account:account,p_reservation:reservation.reservation,p_authority_digest:reservation.authorityDigest,p_payload_digest:hash(body)})
  if(begin?.state!=='ATTEMPTED')return begin
  attempted=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined
  try{
   const response=await Promise.race([transport(body,controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'))},1000)})]);if(timer)clearTimeout(timer)
   return await rpc(db,'ka09_outcome_finish',{p_id:id,p_reservation:reservation.reservation,p_result:response.status>=200&&response.status<300?'http_accepted':'rejected',p_http:response.status})
  }catch{if(timer)clearTimeout(timer);controller.abort();return await rpc(db,'ka09_outcome_finish',{p_id:id,p_reservation:reservation.reservation,p_result:'timeout',p_http:null})}
 }catch{return {state:attempted||commitRequested?'UNKNOWN':'UNAVAILABLE'}}
}

// Explicit maintenance invocation only. No route, timer, worker or purchase hook.
// The SQL operation handles one eligible grant and at most forty associated claims.
export async function cleanupBoundOutcomeRecords(db:Rpc){
 if(!localPersistenceEnabled()&&!productionMaintenanceEnabled())return {state:'DISABLED' as const}
 try{
  const result=await rpc(db,'ka09_measurement_cleanup',{})
  if(!result||!Number.isInteger(result.claims)||result.claims<0||result.claims>40||!Number.isInteger(result.grants)||result.grants<0||result.grants>1)return {state:'UNAVAILABLE' as const}
  return {state:'CHECKED' as const,claimsPurged:result.claims,grantsPurged:result.grants,identifiersScrubbed:result.identifiers===1?1:0,backlog:'NOT_ESTABLISHED' as const}
 }catch{return {state:'UNAVAILABLE' as const}}
}
