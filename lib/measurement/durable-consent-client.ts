'use client'
import {state} from './runtime'
import {bindGa4Session} from '@/app/measurement/journey-actions'
import {registerOutcomeConsent,revokeOutcomeConsent} from '@/app/measurement/actions'
type Handle={id:string;revision:number;token:string;epoch:string;expiresAt:string}
const key='tw_local_outcome_grant_v1';let current:Handle|null=null,inFlight=false
function read(){try{const v=JSON.parse(sessionStorage.getItem(key)||'null');return v&&typeof v.id==='string'&&typeof v.token==='string'&&typeof v.epoch==='string'?v as Handle:null}catch{return null}}
function activeHandle(){return current}
function save(v:Handle|null){current=v;try{if(v)sessionStorage.setItem(key,JSON.stringify(v));else sessionStorage.removeItem(key)}catch{}}
export function durablePointer(){const v=current;if(!v||state().consent!=='granted'||state().auth!=='authenticated'||state().epoch!==v.epoch||Date.parse(v.expiresAt)<=Date.now())return;return {id:v.id,revision:v.revision}}
export async function withdrawDurable(){const v=current??read();if(!v)return 'NONE';current=null
 try{const r=await revokeOutcomeConsent({id:v.id,token:v.token,reason:'withdrawal'});if(r.state==='REVOKED'){if(read()?.id===v.id&&(!activeHandle()||activeHandle()?.id===v.id))save(null);return 'REVOKED'}}catch{}
 // Retain only the revoke handle for a later explicit retry; no event/payload queue.
 return 'PENDING'
}
export async function grantDurable(){
 const start=state();if(inFlight||!['local','google'].includes(start.mode)||start.consent!=='granted'||start.auth!=='authenticated')return 'INELIGIBLE'
 const old=current??read();if(old&&old.epoch===start.epoch&&Date.parse(old.expiresAt)>Date.now()){current=old;return 'GRANTED'}if(old){const revoked=await withdrawDurable();if(revoked==='PENDING')return 'REVOCATION_PENDING'}
 const raw=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('_ga='))?.slice(4);const client=raw?.match(/^GA\d+\.\d+\.(\d{1,20}\.\d{1,20})$/)?.[1];if(!client)return 'MISSING_CONSENTED_CLIENT_ID'
 inFlight=true;try{const bytes=crypto.getRandomValues(new Uint8Array(32)),token=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join(''),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('')
 const r=await registerOutcomeConsent({epoch:start.epoch,clientId:client,tokenDigest:digest,notice:start.mode==='google'?'ka09-v1':'ka09-local-v1'});if(r.state!=='GRANTED')return r.state
 let nativeSession:number|undefined
 if(start.mode==='google'){try{nativeSession=await new Promise<number|undefined>(resolve=>{let complete=false;const done=(v:unknown)=>{if(complete)return;complete=true;const n=Number(v);resolve(Number.isSafeInteger(n)&&n>0?n:undefined)};setTimeout(()=>done(undefined),500);const g=(window as any).__twMeasurementGoogle;if(typeof g==='function')g('get','G-XPKD8XE7FD','session_id',done);else done(undefined)})}catch{}}
 const v:Handle={id:r.id,revision:r.revision,token,epoch:start.epoch,expiresAt:r.expiresAt};save(v)
 if(state().epoch!==start.epoch||state().auth!=='authenticated'||state().consent!=='granted')return await withdrawDurable()
 if(nativeSession!==undefined)await bindGa4Session({id:v.id,revision:v.revision},nativeSession)
 return 'GRANTED'
 }catch{return 'UNAVAILABLE'}finally{inFlight=false}
}
export async function reconcileDurable(){const v=current??read();if(v&&(state().epoch!==v.epoch||state().consent!=='granted'||state().auth!=='authenticated'||Date.parse(v.expiresAt)<=Date.now()))return withdrawDurable();return 'NONE'}
