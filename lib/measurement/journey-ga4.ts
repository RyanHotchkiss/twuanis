import 'server-only'
import {createHash} from 'node:crypto'
import {admit} from './admission'
import {opaqueOutcome} from './server-projection'
import {rpc,productionPersistenceEnabled,localPersistenceEnabled,type Rpc,type Transport} from './durable-outcomes'
export function projectJourneyStage(r:any){
 if(!r||!/^\d{1,20}\.\d{1,20}$/.test(r.clientId)||!/^[a-f0-9]{32}$/.test(r.journey)||typeof r.eventId!=='string'||r.eventId.length>100||!['production','isolated_test'].includes(r.environment)||!['en','es'].includes(r.locale)||!/^[a-f0-9-]{36}$/i.test(r.order)||typeof r.product!=='string'||!['tw_order_created','tw_payment_observed','tw_fulfillment','tw_access_active'].includes(r.name))return
 const at=Date.parse(r.observedAt);if(!Number.isFinite(at)||at>Date.now()||Date.now()-at>=72*3600000)return
 const base={schema_v:'1-proposed',event_id:'e'+createHash('sha256').update(r.journey+':'+r.eventId).digest('hex'),locale:r.locale,page_instance:r.journey,consent_epoch:r.epoch,environment:r.environment}
 if(Number.isSafeInteger(r.gaSessionId)&&r.gaSessionId>0)Object.assign(base,{session_id:r.gaSessionId,engagement_time_msec:1})
 let name:'tw_payment_state'|'tw_entitlement_state',params:Record<string,unknown>
 if(r.name==='tw_order_created'||r.name==='tw_payment_observed'){
 const state=r.name==='tw_order_created'?'initiated':['pending','failed','expired'].includes(r.outcome)?r.outcome:null;if(!state)return
 name='tw_payment_state';params={...base,payment_measurement_key:opaqueOutcome('payment',r.order),state,package_id:r.product}
 }else{
 name='tw_entitlement_state';params={...base,entitlement_measurement_key:opaqueOutcome('entitlement',r.term||r.order),package_id:r.product,market_variant:'unknown',duration_kind:'unknown',state:r.name==='tw_access_active'?'active':r.outcome==='scheduled'?'pending':r.outcome==='fulfilled'?'verified':'unknown'}
 }
 if(!admit(name,params as never,'server'))return
 return{client_id:r.clientId,timestamp_micros:at*1000,consent:{ad_user_data:'DENIED',ad_personalization:'DENIED'},events:[{name,params}]}
}
export async function dispatchJourneyStages(db:Rpc,transport:Transport){
 if(process.env.TWUANIS_MEASUREMENT_R4_GA4_ENABLED!=='1'||!productionPersistenceEnabled()&&!localPersistenceEnabled())return{state:'DISABLED'}
 let attempted=0,accepted=0,uncertain=0,rejected=0
 try{const rows=await rpc(db,'ka10_ga4_stage_reserve',{});if(!Array.isArray(rows)||rows.length>3)throw Error('invalid_batch')
 for(const row of rows){const body=projectJourneyStage(row);if(!body){rejected++;await rpc(db,'ka10_ga4_stage_finish',{p_journey:row.journey,p_event:row.eventId,p_status:422});continue}
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let status:number|null=null;attempted++
 try{const r=await Promise.race([transport(body as Parameters<Transport>[0],controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'))},1000)})]);status=r.status;if(status>=200&&status<300)accepted++;else rejected++}catch{uncertain++}finally{if(timer)clearTimeout(timer)}
 await rpc(db,'ka10_ga4_stage_finish',{p_journey:row.journey,p_event:row.eventId,p_status:status})
 }return{state:uncertain||rejected?'PARTIAL':'CHECKED',attempted,httpAccepted:accepted,uncertain,rejected,reportingAppearance:'NOT_VERIFIED'}
 }catch{return{state:'UNAVAILABLE',attempted,httpAccepted:accepted,uncertain,rejected,reportingAppearance:'NOT_VERIFIED'}}
}
