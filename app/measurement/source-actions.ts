'use server'
import {verifiedMeasurementEligibility} from '@/lib/measurement/verified-eligibility'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {sourceCaptureEnabled} from '@/lib/measurement/source-capture'
import {rpc} from '@/lib/measurement/durable-outcomes'
export async function captureBehavior(input:unknown){
 try{if(!sourceCaptureEnabled())return{state:'DISABLED'};if(!input||typeof input!=='object'||Array.isArray(input))return{state:'INVALID'};const v=input as Record<string,unknown>
 if(Object.keys(v).sort().join(',')!=='client,digest,epoch,session'||typeof v.client!=='string'||!/^\d{1,20}\.\d{1,20}$/.test(v.client)||typeof v.epoch!=='string'||!/^[a-f0-9]{32}$/.test(v.epoch)||typeof v.session!=='string'||!/^\d{1,20}$/.test(v.session)||typeof v.digest!=='string'||!/^[a-f0-9]{64}$/.test(v.digest))return{state:'INVALID'}
 if((await verifiedMeasurementEligibility())!=='eligible')return{state:'SUPPRESSED'}
 return await rpc(await createServerSupabaseClient(),'ka10_behavior_grant',{p_client:v.client,p_epoch:v.epoch,p_native_session:v.session,p_digest:v.digest,p_notice:'ka10-behavior-v1-proposed'})
 }catch{return{state:'UNAVAILABLE'}}
}
export async function revokeBehavior(input:unknown){
 try{if(!sourceCaptureEnabled())return{state:'DISABLED'};if(!input||typeof input!=='object'||Array.isArray(input))return{state:'INVALID'};const v=input as Record<string,unknown>
 if(Object.keys(v).sort().join(',')!=='client,epoch,reason,token'||typeof v.client!=='string'||!/^\d{1,20}\.\d{1,20}$/.test(v.client)||typeof v.epoch!=='string'||!/^[a-f0-9]{32}$/.test(v.epoch)||typeof v.token!=='string'||!/^[a-f0-9]{64}$/.test(v.token)||!['withdrawal','logout','account_switch','erasure'].includes(String(v.reason)))return{state:'INVALID'}
 return await rpc(await createServerSupabaseClient(),'ka10_behavior_revoke',{p_client:v.client,p_epoch:v.epoch,p_token:v.token,p_reason:v.reason})
 }catch{return{state:'UNAVAILABLE'}}
}
