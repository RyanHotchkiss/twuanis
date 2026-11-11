import {canonicalEngineAlias} from './analytical'
// Relay only the minimal result of existing acknowledged first-party writes.
// Never accepts a payment, entitlement, execution or arbitrary event name.
import {context,emitAcknowledged,state} from './runtime'
export function favoriteReceipt(listingId:string,action:'save'|'remove'){
 if(typeof window==='undefined')return ()=>{};
 const start=state();const locale=typeof location!=='undefined'&&location.pathname.startsWith('/es')?'es':'en';const ctx=context(locale),key=ctx.event_id
 return ()=>{if(start.consent!=='granted'||state().epoch!==start.epoch)return;emitAcknowledged('tw_save_change',{...ctx,listing_id:listingId,action,outcome:'success',operation_key:key},'favorite:'+key)}
}

// Only a returned own-account saved-analysis acknowledgement is projected.
export function analysisSavedReceipt(locale:'en'|'es'){
 if(typeof window==='undefined')return async(_id:string,_alias:string)=>{}
 const start=state(),ctx=context(locale)
 return async(id:string,alias:string)=>{try{
  const engine=canonicalEngineAlias(alias)
  if(!engine||! /^[0-9a-f-]{36}$/i.test(id)||start.consent!=='granted'||state().epoch!==start.epoch||state().page!==start.page)return
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('tw-ka09:analysis:'+id))
  if(state().epoch!==start.epoch||state().consent!=='granted')return
  const key='m'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')
  emitAcknowledged('tw_analysis_save',{...ctx,analysis_measurement_key:key,engine_id:engine,outcome:'success'},'analysis-save:'+key)
 }catch{}}
}
