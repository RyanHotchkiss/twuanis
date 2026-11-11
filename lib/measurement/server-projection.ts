import 'server-only'
import {createHash} from 'node:crypto'
import {admit} from './admission'
import type {EventName,EventPayloads} from './types'
export type Eligibility=Readonly<{analyticsConsent:'granted'|'denied'|'unknown';epoch:string;observedAt:number;locale:'en'|'es';environment:'isolated_test'|'staging'|'production'}>
// A transport is deliberately injected by an authorized server boundary, never by a browser endpoint.
// No payment state, auth lookup, database, persistent queue or provider credential is created here.
export function opaqueOutcome(namespace:string,id:string){return 'm'+createHash('sha256').update('tw-ka09:'+namespace+':'+id).digest('hex')}
export async function projectOutcome<N extends EventName>(name:N,payload:EventPayloads[N],eligibility:Eligibility|undefined,deliver:((name:N,payload:EventPayloads[N])=>Promise<void>)|undefined){
 try{if(!eligibility||eligibility.analyticsConsent!=='granted'||!eligibility.epoch||Date.now()-eligibility.observedAt>600000||Date.now()<eligibility.observedAt||!deliver)return {state:'SUPPRESSED' as const}
 const p=payload as Record<string,unknown>;if(p.consent_epoch!==eligibility.epoch||p.locale!==eligibility.locale||p.environment!==eligibility.environment)return {state:'REJECTED' as const}
 if(!admit(name,payload,'server'))return {state:'REJECTED' as const}
 // Provider receipt is not inferred from delivery completion; caller records only a bounded status.
 await deliver(name,structuredClone(payload));return {state:'ATTEMPTED' as const}
 }catch{return {state:'UNAVAILABLE' as const}}
}
