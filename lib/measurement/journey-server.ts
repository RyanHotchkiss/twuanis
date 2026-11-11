import 'server-only'
import {journeyCollectionEnabled} from '@/lib/measurement/journey-enabled'
import {rpc} from './durable-outcomes'
import {createHash} from 'node:crypto'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {verifiedMeasurementEligibility} from './verified-eligibility'
import {validJourneyProof,type JourneyProof} from './journey-contract'
// Called only from verified existing server observations; never accepts browser result claims.
export async function persistServerJourney(proof:JourneyProof,name:string,p:Record<string,unknown>,locale:'en'|'es'){
 try{if(!journeyCollectionEnabled()||!validJourneyProof(proof)||(await verifiedMeasurementEligibility())!=='eligible')return
 const allowed=['tw_execution_request','tw_authorization','tw_execution_result','tw_report_retrieve','begin_checkout'];if(!allowed.includes(name))return
 const outcome=p.outcome==='pending'?'pending':p.outcome==='unavailable'?'unavailable':p.outcome==='intent'?'intent':p.outcome==='rejected'?'denied':p.outcome==='failure'?'failed':'acknowledged'
 const {startJourney}=await import('@/app/measurement/journey-actions');const grant=await startJourney(proof);if(grant.state!=='GRANTED')return;const db=await createServerSupabaseClient();const auth=await db.auth.getUser();if(auth.error||!auth.data.user)return;const {supabaseAdmin}=await import('@/lib/supabase-admin');return await rpc(supabaseAdmin,'ka10_journey_server_event',{p_account:auth.data.user.id,p_journey:proof.journey,p_token_digest:createHash('sha256').update(proof.token).digest('hex'),p_id:String(p.event_id),p_name:name,p_control:typeof p.capability_id==='string'?p.capability_id:name,p_outcome:outcome,p_locale:locale,p_population:['PRIVATE','BANK','SALE','RENT'].includes(String(p.population))?p.population:'UNKNOWN',p_at:Number.isSafeInteger(p.observed_at_ms)?p.observed_at_ms:Date.now(),p_request:typeof (p.request_measurement_key??p.execution_measurement_key)==='string'?p.request_measurement_key??p.execution_measurement_key:null})
 }catch{console.warn('measurement_observation_unavailable');return {state:'UNAVAILABLE'}}
}
export async function bindJourneyOrder(proof:JourneyProof,order:string){try{if(!journeyCollectionEnabled()||!validJourneyProof(proof)||(await verifiedMeasurementEligibility())!=='eligible')return;const {startJourney}=await import('@/app/measurement/journey-actions');const grant=await startJourney(proof);if(grant.state!=='GRANTED')return;const db=await createServerSupabaseClient();return await rpc(db,'ka10_journey_order',{p_journey:proof.journey,p_token_digest:createHash('sha256').update(proof.token).digest('hex'),p_order:order})}catch{return {state:'UNAVAILABLE'}}}
