import 'server-only'
import {privacyRightsEnabled} from './rights'
import type {Rpc} from '@/lib/measurement/durable-outcomes'
import {rpc} from '@/lib/measurement/durable-outcomes'
// Canonical account_deletion_requests is the durable recovery obligation. A
// measurement failure never changes the existing account-deletion result.
export async function suppressDeletedAccount(db:Rpc,account:string){
 if(!privacyRightsEnabled())return{state:'DISABLED'}
 let cursor:string|null=null
 try{for(let page=0;page<3;page++){
  const result=await rpc(db,'ka10_account_erasure',{p_account:account,p_after:cursor})
  if(result?.state!=='PAGING')return result
  if(typeof result.next_cursor!=='string'||!/^[a-f0-9]{64}$/.test(result.next_cursor))return{state:'UNAVAILABLE'}
  cursor=result.next_cursor
 }return{state:'PAGING',recoveryRequired:true}}catch{return{state:'PENDING',recoveryRequired:true}}
}
