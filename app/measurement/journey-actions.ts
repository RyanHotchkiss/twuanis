'use server'
import {journeyCollectionEnabled,journeyMaintenanceEnabled} from '@/lib/measurement/journey-enabled'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {verifiedMeasurementEligibility} from '@/lib/measurement/verified-eligibility'
import {validJourneyProof,validJourneyEvent,validJourneyPolicy,type JourneyPolicy,type JourneyProof} from '@/lib/measurement/journey-contract'
import {rpc} from '@/lib/measurement/durable-outcomes'
import {createHash} from 'node:crypto'
export async function ingestJourney(input:unknown){
 try{if(!journeyCollectionEnabled())return{state:'DISABLED'};if(!input||typeof input!=='object')return{state:'INVALID'};const v=input as any;if(Object.keys(v).sort().join(',')!=='events,proof'||!validJourneyProof(v.proof)||!Array.isArray(v.events)||v.events.length>20||!v.events.every(validJourneyEvent)||JSON.stringify(v.events).length>20000)return{state:'INVALID'}
 if((await verifiedMeasurementEligibility())!=='eligible')return{state:'SUPPRESSED'}
 const db=await createServerSupabaseClient();const r=await rpc(db,'ka10_journey_ingest',{p_journey:v.proof.journey,p_token_digest:createHash('sha256').update(v.proof.token).digest('hex'),p_events:v.events});return r as {state:string}
 }catch{return{state:'UNAVAILABLE'}}
}
export async function endJourney(proof:JourneyProof,reason:'withdrawal'|'owner'|'logout'|'switch'|'expiry'='withdrawal'){try{if(!journeyMaintenanceEnabled()||!validJourneyProof(proof)||!['withdrawal','owner','logout','switch','expiry'].includes(reason))return{state:'DISABLED'};const db=await createServerSupabaseClient();const r=await rpc(db,'ka10_journey_end',{p_reason:reason,p_journey:proof.journey,p_token_digest:createHash('sha256').update(proof.token).digest('hex')});return r}catch{return{state:'UNAVAILABLE'}}}
export async function attachJourneyOrder(proof:JourneyProof,order:string){if(!validJourneyProof(proof)||typeof order!=='string'||!/^[0-9a-f-]{36}$/i.test(order))return;const {bindJourneyOrder}=await import('@/lib/measurement/journey-server');return await bindJourneyOrder(proof,order)}

export async function startJourney(proof:JourneyProof){try{if(!journeyCollectionEnabled()||!validJourneyProof(proof))return{state:'DISABLED'};if((await verifiedMeasurementEligibility())!=='eligible')return{state:'SUPPRESSED'};const db=await createServerSupabaseClient();return await rpc(db,'ka10_journey_start',{p_journey:proof.journey,p_token_digest:createHash('sha256').update(proof.token).digest('hex'),p_notice:proof.notice,p_expires:new Date(Math.min(proof.expires,Date.now()+86400000-60000)).toISOString()})}catch{return{state:'UNAVAILABLE'}}}

// Public policy metadata only. No identifier, proof, credential or account state.
export async function getJourneyPolicy():Promise<JourneyPolicy|null>{try{if(!journeyCollectionEnabled())return null;const db=await createServerSupabaseClient();const policy=await rpc(db,'ka10_journey_policy',{});return validJourneyPolicy(policy)?policy:null}catch{return null}}

export async function bindGa4Session(grant:{id:string;revision:number},session:number){try{if(process.env.TWUANIS_MEASUREMENT_R4_GA4_ENABLED!=='1'||!journeyCollectionEnabled()||!grant||!/^[a-f0-9-]{36}$/i.test(grant.id)||!Number.isSafeInteger(grant.revision)||grant.revision<1||!Number.isSafeInteger(session)||session<=0)return{state:'DISABLED'};const db=await createServerSupabaseClient();return await rpc(db,'ka10_ga4_session',{p_grant:grant.id,p_revision:grant.revision,p_session:session})}catch{return{state:'UNAVAILABLE'}}}
