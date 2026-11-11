'use server'
import {journeyMaintenanceEnabled} from '@/lib/measurement/journey-enabled'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {privacyRightsEnabled,validCaseInput,issueCaseProof,verifyCaseProof} from '@/lib/privacy/rights'
async function account(){
 const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return null
 const r=await db.rpc('ka10_rights_account');if(r.error||r.data?.accountId!==auth.data.user.id||r.data?.state!=='VERIFIED_ACCOUNT')return null
 return {db,id:auth.data.user.id}
}
export async function readPrivacyAccount(){try{if(journeyMaintenanceEnabled()){const db=await createServerSupabaseClient(),u=await db.auth.getUser();if(u.error||!u.data.user)return{state:'AUTHENTICATION_REQUIRED'};const owner=await db.rpc('is_current_user_owner');return{state:'VERIFIED_ACCOUNT',accountId:u.data.user.id,owner:!owner.error&&owner.data===true}}if(!privacyRightsEnabled())return{state:'DISABLED'};const a=await account();if(!a)return{state:'AUTHENTICATION_REQUIRED'};const owner=await a.db.rpc('is_current_user_owner');return{state:'VERIFIED_ACCOUNT',accountId:a.id,owner:!owner.error&&owner.data===true}}catch{return{state:'UNAVAILABLE'}}}
export async function preparePrivacyCase(input:unknown){
 try{if(journeyMaintenanceEnabled()){if(!validCaseInput(input))return{state:'INVALID'};const db=await createServerSupabaseClient(),u=await db.auth.getUser();if(u.error||!u.data.user||u.data.user.id!==input.expectedAccount)return{state:'ACCOUNT_CHANGED'};if(input.kind!=='measurement_erasure')return{state:'IDENTITY_VERIFIED',caseId:input.caseId,receipt:'',anonymousHistoryComplete:false};const{ supabaseAdmin }=await import('@/lib/supabase-admin');const r=await supabaseAdmin.rpc('ka10_journey_erase_account',{p_account:u.data.user.id});if(r.error||r.data?.state!=='SUPPRESSED')return{state:'UNAVAILABLE'};return{state:r.data.remaining?'PAGING':'LOGICALLY_SUPPRESSED',caseId:input.caseId,receipt:'',nextCursor:r.data.remaining?'0'.repeat(64):null,remaining:r.data.remaining,anonymousHistoryComplete:false,providerErasure:'NOT_VERIFIED'}}if(!privacyRightsEnabled())return{state:'DISABLED'};if(!validCaseInput(input))return{state:'INVALID'};const a=await account();if(!a||a.id!==input.expectedAccount)return{state:'ACCOUNT_CHANGED'}
 const receipt=issueCaseProof(a.id,input.caseId,input.kind)
 if(input.kind!=='measurement_erasure')return{state:'IDENTITY_VERIFIED',caseId:input.caseId,receipt,anonymousHistoryComplete:false}
 const r=await a.db.rpc('ka10_rights_request',{p_request:input.caseId,p_expected_account:a.id,p_after:input.cursor??null})
 if(r.error||!['PAGING','LOGICALLY_SUPPRESSED','UNAVAILABLE','RESTART_REQUIRED'].includes(r.data?.state))return{state:'UNAVAILABLE'}
 // No native IDs, visitor histories, provider payloads or financial records.
 return{state:r.data.state,caseId:input.caseId,receipt,nextCursor:typeof r.data.next_cursor==='string'?r.data.next_cursor:null,remaining:r.data.remaining,anonymousHistoryComplete:false,providerErasure:'NOT_VERIFIED'}
 }catch{return{state:'UNAVAILABLE'}}
}
export async function reviewPrivacyCase(receipt:unknown){
 try{if(!privacyRightsEnabled())return{state:'DISABLED'};const a=await account();if(!a)return{state:'UNAVAILABLE'};const o=await a.db.rpc('is_current_user_owner');if(o.error||o.data!==true)return{state:'UNAVAILABLE'}
 const p=verifyCaseProof(receipt);if(!p)return{state:'UNAVAILABLE'};const scope=await a.db.rpc('ka10_owner_rights_scope',{p_account:p.accountId});if(scope.error||scope.data?.state!=='BOUND_SCOPE')return{state:'UNAVAILABLE'}
 return{state:'VERIFIED_CASE',caseId:p.caseId,kind:p.kind,accountId:p.accountId,retainedEpochs:scope.data.retained_epochs,anonymousHistoryComplete:false,verificationOnly:true}
 }catch{return{state:'UNAVAILABLE'}}
}
