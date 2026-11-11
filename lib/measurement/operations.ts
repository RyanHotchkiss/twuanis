import 'server-only'
import {journeyCollectionEnabled,journeyMaintenanceEnabled} from '@/lib/measurement/journey-enabled'
import {cleanupBoundOutcomeRecords,deliverBoundOutcome,persistenceEnabled,productionPersistenceEnabled,productionMaintenanceEnabled,localPersistenceEnabled,rpc,type Rpc} from './durable-outcomes'
// Fixed server-only destination. No logging, redirect, retry or browser credential.
export async function measurementProtocolTransport(body:Parameters<NonNullable<Parameters<typeof deliverBoundOutcome>[3]>>[0],signal:AbortSignal){
 if(!productionPersistenceEnabled()||body.events.some(e=>e.params.environment!=='production'))throw Error('measurement_disabled')
 const secret=process.env.TWUANIS_GA4_MP_API_SECRET
 if(!secret||secret.length<8||secret.length>512)throw Error('measurement_unconfigured')
 const url=new URL('https://www.google-analytics.com/mp/collect');url.searchParams.set('measurement_id','G-XPKD8XE7FD');url.searchParams.set('api_secret',secret)
 const response=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});return {status:response.status}
}
// Reuses existing attended/cron execution paths; never starts a new worker/timer.
export async function maintainMeasurement(db:Rpc){
 let journey:any=null;if(journeyMaintenanceEnabled()){try{journey=await rpc(db,'ka10_journey_maintenance',{})}catch{journey={state:'UNAVAILABLE'}}}
 if(!localPersistenceEnabled()&&!productionMaintenanceEnabled())return {state:journey?(journey.state==='CHECKED'&&!['CAPACITY','POLICY_REQUIRED'].includes(journey.capacityState)&&!journey.privacyBacklog?'CHECKED':'PARTIAL'):'DISABLED',journey}
 let sourceMaintenance:unknown=null
 if(process.env.TWUANIS_KA10_MAINTENANCE_ENABLED==='1'){try{sourceMaintenance=await rpc(db,'ka10_privacy_maintenance',{})}catch{return{state:'PARTIAL',sourceMaintenance:'UNAVAILABLE'}}}
 const started=Date.now();let purgedGrants=0,purgedClaims=0,scrubbed=0,checked=0,failures=journey&&(journey.state!=='CHECKED'||['CAPACITY','POLICY_REQUIRED'].includes(journey.capacityState)||journey.privacyBacklog)?1:0
 for(let i=0;i<10&&Date.now()-started<4000;i++){const r=await cleanupBoundOutcomeRecords(db);if(r.state!=='CHECKED'){failures++;break}purgedGrants+=r.grantsPurged;purgedClaims+=r.claimsPurged;scrubbed+=r.identifiersScrubbed;checked++;if(r.grantsPurged===0&&r.claimsPurged===0&&r.identifiersScrubbed===0)break}
 let backlog:any=null
 try{const raw=await rpc(db,'ka09_measurement_backlog',{});if(!raw||!['dueGrantsCapped','expiredIdentifiersCapped'].every(k=>Number.isInteger(raw[k])&&raw[k]>=0&&raw[k]<=100)||!Number.isFinite(raw.oldestOverdueSeconds)||raw.oldestOverdueSeconds<0)throw Error('invalid_metrics');backlog={dueGrantsCapped:raw.dueGrantsCapped,expiredIdentifiersCapped:raw.expiredIdentifiersCapped,dueGrantsOver100:raw.dueGrantsOver100===true,expiredIdentifiersOver100:raw.expiredIdentifiersOver100===true,oldestOverdueSeconds:raw.oldestOverdueSeconds}}catch{failures++}
 if(backlog?.dueGrantsCapped>0||backlog?.expiredIdentifiersCapped>0)failures++
 return {state:failures?'PARTIAL':'CHECKED',journey,sourceMaintenance,checked,purgedGrants,purgedClaims,scrubbed,backlog,failures,elapsedMs:Date.now()-started}
}
export async function dispatchPendingMeasurement(db:Rpc,transport=measurementProtocolTransport){
 let journey:any=null;if(journeyCollectionEnabled()){try{journey=await rpc(db,'ka10_journey_reconcile',{})}catch{journey={state:'UNAVAILABLE'}}}
 if(!productionPersistenceEnabled()||!process.env.TWUANIS_GA4_MP_API_SECRET)return {state:journey?(journey.state==='CHECKED'?'CHECKED':'UNAVAILABLE'):'DISABLED',journey}
 const {dispatchJourneyStages}=await import('./journey-ga4');const stages=await dispatchJourneyStages(db,transport)
 const started=Date.now();let checked=0,attempts=0,unavailable=(journey&&journey.state!=='CHECKED'?1:0)+(['PARTIAL','UNAVAILABLE'].includes(stages.state)?1:0)
 try{const rows=await rpc(db,'ka09_pending_outcomes',{});if(!Array.isArray(rows)||rows.length>3)throw Error('invalid_batch')
 for(const row of rows){if(Date.now()-started>4500)break;if(!/^[0-9a-f-]{36}$/i.test(row.id)||!/^[0-9a-f-]{36}$/i.test(row.account))throw Error('invalid_identity');checked++;const r=await deliverBoundOutcome(db,row.id,row.account,transport);if(['UNKNOWN','FAILED','ACKNOWLEDGED'].includes(r?.state))attempts++;if(r?.state==='UNAVAILABLE')unavailable++}
 return {state:unavailable?'PARTIAL':'CHECKED',journey,stages,checked,attempts,unavailable,elapsedMs:Date.now()-started}
 }catch{return {state:'UNAVAILABLE',checked,attempts,unavailable:unavailable+1}}
}
