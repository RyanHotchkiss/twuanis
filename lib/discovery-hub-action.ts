'use server'
import {executePhase14HubApplication} from './phase14-application'
import {preparePhase14Question} from './phase14-question'
import type {Phase14ApplicationRequest} from './comparative-discovery-contract'

export async function executeDiscoveryHub(input:unknown){return executePhase14HubApplication(input)}

// Restore draft syntax only. This grants no execution authority and loads no market.
export async function restoreDiscoveryDraft(serialized:string):Promise<Phase14ApplicationRequest|null>{
 try{
  if(typeof serialized!=='string')return null
  const value:unknown=JSON.parse(serialized)
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='normalization,request'||!('normalization'in value)||!('request'in value))return null
  if(value.normalization!=='land'&&value.normalization!=='construction')return null
  return {request:preparePhase14Question(value.request),normalization:value.normalization}
 }catch{return null}
}
