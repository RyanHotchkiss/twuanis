import 'server-only'
import {after} from 'next/server'
import {verifiedMeasurementEligibility} from './verified-eligibility'
import {randomUUID} from 'node:crypto'
import {projectOutcome,opaqueOutcome,type Eligibility} from './server-projection'
import type {EventName,EventPayloads} from './types'
import type {ObservationSignal,Projection,MeasuredResult} from './action-receipt'
export type {ObservationSignal,Projection} from './action-receipt'
export type ProjectionSink=(event:Projection)=>Promise<void>
export function eligible(signal:ObservationSignal|undefined):Eligibility|undefined{
 if(!signal||Object.keys(signal).filter(k=>k!=='journey').sort().join(',')!=='at,consent,environment,epoch,locale,page,request'||signal.consent!=='granted'||!['en','es'].includes(signal.locale)||!['isolated_test','production'].includes(signal.environment)||!Number.isFinite(signal.at)||[signal.epoch,signal.page,signal.request].some(x=>typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(x)))return
 if(signal.environment==='isolated_test'&&process.env.TWUANIS_MEASUREMENT_LOCAL!=='1')return
 if(signal.environment==='production'&&(process.env.TWUANIS_MEASUREMENT_ENABLED!=='1'||process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED!=='1'))return
 return {analyticsConsent:'granted',epoch:signal.epoch,observedAt:signal.at,locale:signal.locale,environment:signal.environment}
}
export async function collectAction<T>(signal:ObservationSignal|undefined,work:(sink:ProjectionSink)=>Promise<T>,population:'PRIVATE'|'BANK'|'SALE'|'RENT'|'UNKNOWN'='PRIVATE'):Promise<MeasuredResult<T>>{
 const measurementAllowed=!!signal&&(await verifiedMeasurementEligibility())==='eligible'
 const events:Projection[]=[]
 const value=await work(async event=>{
  // Metadata is response-local and bounded. No provider call or outcome logging.
  if(measurementAllowed&&eligible(signal)&&events.length<3&&JSON.stringify(event).length<=8192){events.push(event);if(signal?.journey){const proof=signal.journey,locale=signal.locale;try{after(async()=>{const {persistServerJourney}=await import('./journey-server');await persistServerJourney(proof,event.name,{...event.parameters,population},locale)})}catch{}}}
 })
 return {value,measurement:events.length&&signal?{request:signal.request,events}:null}
}
export async function observeExecution<T>(engine:EventPayloads['tw_execution_request']['capability_id'],kind:'engine'|'orchestrator',signal:ObservationSignal|undefined,work:()=>Promise<T>,sink?:ProjectionSink,population:'PRIVATE'|'BANK'|'SALE'|'RENT'|'UNKNOWN'='PRIVATE'):Promise<T>{
 const eligibility=eligible(signal);const deliver=sink;const key=signal?opaqueOutcome('request',signal.request):''
 const base=()=>({observed_at_ms:Date.now(),schema_v:'1-proposed' as const,event_id:'e'+randomUUID().replaceAll('-',''),locale:signal!.locale,page_instance:signal!.page,consent_epoch:signal!.epoch,environment:signal!.environment})
 const send=async<N extends EventName>(name:N,payload:EventPayloads[N])=>{if(!eligibility||!deliver)return;await projectOutcome(name,payload,eligibility,async(n,p)=>deliver({name:n,parameters:p as Record<string,unknown>}))}
 // Local journey request is not a paid execution or a canonical credit receipt.
 if(signal?.journey){const proof=signal.journey,locale=signal.locale,p={event_id:'e'+randomUUID().replaceAll('-',''),capability_id:engine,outcome:'intent',population,observed_at_ms:Date.now(),request_measurement_key:key};try{after(async()=>{const {persistServerJourney}=await import('./journey-server');await persistServerJourney(proof,'tw_execution_request',p,locale)})}catch{}}
 try{
  const result=await work();if(kind==='orchestrator')return result;const value=result as any
  let outcome:'success'|'failure'|'rejected'='success';let reason='existing_boundary_permitted'
  const access=value?.access??value?.analysis?.code??(value?.state==='access_required'?'entitlement_required':null)
  if(access==='authentication_required'||access==='entitlement_required'){outcome='rejected';reason=access}
  else if(value?.ok===false||value?.invalidRequest===true||value?.state==='error'||value?.state==='undefined'||value?.analysis?.state==='error'||value?.error||value?.result?.state==='execution_unavailable'||(engine==='position'&&typeof value?.result?.state==='string'&&value.result.state!=='ok')||value===null||value===undefined){outcome='failure';reason='existing_action_failed'}
  try{if(eligibility){if(outcome!=='failure')await send('tw_authorization',{...base(),request_measurement_key:key,outcome:outcome==='rejected'?'rejected':'success',reason_class:reason});await send('tw_execution_result',{...base(),execution_measurement_key:key,capability_id:engine,capability_kind:kind,result_grain:kind,...kind==='engine'?{engine_id:engine as EventPayloads['tw_execution_result']['engine_id']}:{},outcome})}}catch{}
  return result
 }catch(error){
  try{if(eligibility){const denied=error instanceof Error&&['PackageCapabilityDenied','PriceMeterComparableAuthenticationError','PriceMeterComparableAuthorizationError'].includes(error.name);if(denied)await send('tw_authorization',{...base(),request_measurement_key:key,outcome:'rejected',reason_class:'existing_authority_denied'});await send('tw_execution_result',{...base(),execution_measurement_key:key,capability_id:engine,capability_kind:kind,result_grain:kind,...kind==='engine'?{engine_id:engine as EventPayloads['tw_execution_result']['engine_id']}:{},outcome:denied?'rejected':'failure'})}}catch{}
  throw error
 }
}

export async function observeReportRetrieval<T>(id:string,signal:ObservationSignal|undefined,work:()=>Promise<T>,sink?:ProjectionSink):Promise<T>{
 const report=await work();try{const eligibility=eligible(signal),deliver=sink,r=report as any
 if(eligibility&&deliver&&/^[0-9a-f-]{36}$/i.test(id)&&r?.reportId===id&&['twuanis-orchestrator-evidence-v1','twuanis-orchestrator-evidence-v2'].includes(r.format))await projectOutcome('tw_report_retrieve',{schema_v:'1-proposed',event_id:'e'+randomUUID().replaceAll('-',''),locale:signal!.locale,page_instance:signal!.page,consent_epoch:signal!.epoch,environment:signal!.environment,report_measurement_key:opaqueOutcome('report',id),outcome:'success'},eligibility,async(name,parameters)=>deliver({name,parameters}))
 }catch{}return report
}

// Aggregate operations have one customer request; never invent per-engine successes.
export async function observeJourneyOperation<T>(control:string,signal:ObservationSignal|undefined,work:()=>Promise<T>,population:'PRIVATE'|'BANK'|'SALE'|'RENT'|'UNKNOWN'='UNKNOWN'):Promise<T>{
 const proof=signal?.journey,locale=signal?.locale??'en',key=signal?opaqueOutcome('request',signal.request):''
 const note=(name:string,outcome:string)=>{if(!proof||!eligible(signal))return;const payload={event_id:'e'+randomUUID().replaceAll('-',''),capability_id:control,outcome,population,observed_at_ms:Date.now(),request_measurement_key:key};try{after(async()=>{const {persistServerJourney}=await import('./journey-server');await persistServerJourney(proof,name,payload,locale)})}catch{}}
 note('tw_execution_request','intent')
 try{const result=await work(),v=result as any;note('tw_execution_result',v?.state==='WORKING'?'pending':['RELEASED','ADAPTER_REQUIRED'].includes(v?.state)?'unavailable':v?.ok===false?'failure':'success');return result}catch(error){note('tw_execution_result',error instanceof Error&&error.name==='PackageCapabilityDenied'?'rejected':'failure');throw error}
}
