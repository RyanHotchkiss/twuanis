'use client'
import {captureBehavior,revokeBehavior} from '@/app/measurement/source-actions'
import {state,setSourceReady} from './runtime'
type Handle={client:string;epoch:string;session:string;token:string;expiresAt:string;auth:string;confirmed:boolean}
const key='tw_measurement_source_revoke_v1';let pending:Promise<string>|null=null
function read():Handle|null{try{const v=JSON.parse(sessionStorage.getItem(key)||'null');return v&&/^\d{1,20}\.\d{1,20}$/.test(v.client)&&/^[a-f0-9]{32}$/.test(v.epoch)&&/^[a-f0-9]{64}$/.test(v.token)&&/^\d{1,20}$/.test(v.session)&&Number.isFinite(Date.parse(v.expiresAt))?v:null}catch{return null}}
function store(h:Handle|null){try{if(h)sessionStorage.setItem(key,JSON.stringify(h));else sessionStorage.removeItem(key);return true}catch{return false}}
export function nativeContext(cookies:string){
 const values=Object.fromEntries(cookies.split(';').map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),x.slice(i+1)]}))
 const client=values._ga?.match(/^GA\d+\.\d+\.(\d{1,20}\.\d{1,20})$/)?.[1],raw=values._ga_XPKD8XE7FD
 const session=raw?.match(/^GS1\.\d+\.(\d{1,20})\./)?.[1]??raw?.match(/^GS2\.\d+\.s(\d{1,20})(?:\$|$)/)?.[1]
 return client&&session?{client,session}:null
}
async function reconcile(){
 const s=state()
 setSourceReady('',0);const old=read()
 if(old&&(!old.confirmed||s.mode==='off'||old.epoch!==s.epoch||s.consent!=='granted'||old.auth!==s.auth)){
  const reason=s.consent!=='granted'?'withdrawal':s.auth==='anonymous'?'logout':'account_switch'
  const r=await revokeBehavior({client:old.client,epoch:old.epoch,token:old.token,reason});if(r.state!=='REVOKED')return'REVOCATION_PENDING';store(null)
 }
 if(s.consent!=='granted')return'INELIGIBLE'
 if(s.mode!=='google'&&process.env.NEXT_PUBLIC_KA10_SOURCE_CAPTURE_LOCAL!=='1')return'DISABLED'
 const existing=read();if(existing){if(Date.parse(existing.expiresAt)<=Date.now())return'EXPIRED';if(state().epoch!==s.epoch)return'ACCOUNT_CHANGED';setSourceReady(s.epoch,Date.parse(existing.expiresAt));return'GRANTED'}
 // A bounded startup wait for Google's actual consented native cookies. No
 // synthetic native/session IDs, automatic renewal, or recurring capture job.
 let native=nativeContext(document.cookie)
 for(let i=0;!native&&i<10;i++){await new Promise(resolve=>setTimeout(resolve,100));if(state().epoch!==s.epoch||state().consent!=='granted')return'ACCOUNT_CHANGED';native=nativeContext(document.cookie)}
 if(!native)return'MISSING_NATIVE_CONTEXT'
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('')
 const tentative:Handle={...native,epoch:s.epoch,token,expiresAt:new Date().toISOString(),auth:s.auth,confirmed:false};if(!store(tentative))return'UNAVAILABLE'
 const r=await captureBehavior({...native,epoch:s.epoch,digest});if(r.state!=='GRANTED')return String(r.state)
 const h:Handle={...tentative,expiresAt:r.expires_at,confirmed:true};if(!store(h))return'UNAVAILABLE'
 if(state().epoch!==s.epoch||state().consent!=='granted'){const ended=await revokeBehavior({client:h.client,epoch:h.epoch,token:h.token,reason:'account_switch'});if(ended.state==='REVOKED')store(null);return'ACCOUNT_CHANGED'}
 const expires=Date.parse(h.expiresAt);if(!Number.isFinite(expires)||expires<=Date.now())return'UNAVAILABLE';setSourceReady(s.epoch,expires);return'GRANTED'
}
export async function reconcileSource():Promise<string>{
 if(pending){await pending;return reconcileSource()}
 pending=reconcile();try{return await pending}catch{return'UNAVAILABLE'}finally{pending=null}
}
