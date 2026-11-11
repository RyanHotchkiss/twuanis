'use server'
import {verifiedMeasurementEligibility} from '@/lib/measurement/verified-eligibility'
import {after} from 'next/server'
import {observeExecution,observeJourneyOperation,collectAction,type ObservationSignal} from '@/lib/measurement/server-observation'
import {executeMarketQuestion} from '@/lib/market-inventory-action'
import {executePriceMeterApply} from '@/lib/price-meter-apply-action'
import {executePositionHub} from '@/lib/position-hub-action'
import {executeComparablesHub} from '@/lib/comparables-hub-action'
import {executeAskingAreaRatio} from '@/lib/asking-area-ratio-action'
import {executeWeightedPrice} from '@/lib/weighted-price-action'
export async function measuredMarketQuestion(engine:unknown,input:unknown,language:'en'|'es',signal?:ObservationSignal){
 if(!['summary','composition','matching','configuration','comparison'].includes(String(engine)))return {value:await executeMarketQuestion(engine,input,language),measurement:null}
 return collectAction(signal,sink=>observeExecution(engine as 'summary'|'composition'|'matching'|'configuration'|'comparison','engine',signal,()=>executeMarketQuestion(engine,input,language),sink))
}
export async function measuredPriceMeterApply(args:Parameters<typeof executePriceMeterApply>,signal?:ObservationSignal){
 const selected=args[3];if(!Array.isArray(selected)||selected.length!==1)return {value:await observeJourneyOperation('price_meter_apply',signal,()=>executePriceMeterApply(...args)),measurement:null}
 const name=({'distribution':'distribution','geography':'geography','property-area':'size','construction-area':'size','construction-land':'construction-land'}as const)[selected[0] as 'distribution'];if(!name)return {value:await executePriceMeterApply(...args),measurement:null}
 return collectAction(signal,sink=>observeExecution(name,'engine',signal,()=>executePriceMeterApply(...args),sink))
}
export async function measuredPosition(input:unknown,signal?:ObservationSignal){return collectAction(signal,sink=>observeExecution('position','engine',signal,()=>executePositionHub(input),sink))}
export async function measuredComparables(input:unknown,signal?:ObservationSignal){return collectAction(signal,sink=>observeExecution('comparables','engine',signal,()=>executeComparablesHub(input),sink))}
export async function measuredRatio(input:unknown,signal?:ObservationSignal){return collectAction(signal,sink=>observeExecution('asking-area-ratio','engine',signal,()=>executeAskingAreaRatio(input),sink))}
export async function measuredWeighted(input:unknown,signal?:ObservationSignal){return collectAction(signal,sink=>observeExecution('weighted-price','engine',signal,()=>executeWeightedPrice(input),sink))}

export async function measuredAskingPrice(input:unknown,signal?:ObservationSignal){const {analyzeAskingPrice}=await import('@/lib/asking-price-action');return collectAction(signal,sink=>observeExecution('market-asking-price-distribution','engine',signal,()=>analyzeAskingPrice(input),sink))}
export async function measuredCohort(input:unknown,language:'en'|'es',signal?:ObservationSignal){const {executePriceMeterCohortComparison}=await import('@/lib/price-meter-cohort-action');return collectAction(signal,sink=>observeExecution('cohort-comparison','engine',signal,()=>executePriceMeterCohortComparison(input,language),sink))}
export async function measuredCross(input:unknown,signal?:ObservationSignal){const {executeCrossDimensionalHub}=await import('@/lib/price-meter-cross-dimensional-action');return collectAction(signal,sink=>observeExecution('cross-dimensional','engine',signal,()=>executeCrossDimensionalHub(input),sink))}
export async function measuredDiscovery(input:unknown,signal?:ObservationSignal){const {executeDiscoveryHub}=await import('@/lib/discovery-hub-action');return collectAction(signal,sink=>observeExecution('discovery','engine',signal,()=>executeDiscoveryHub(input),sink))}

export async function measuredReadReport(id:string,signal?:ObservationSignal){const {readOrchestratorReport}=await import('@/app/actions/orchestrator');const {observeReportRetrieval}=await import('@/lib/measurement/server-observation');return collectAction(signal,sink=>observeReportRetrieval(id,signal,()=>readOrchestratorReport(id),sink))}

export async function measuredPurchase(input:Parameters<typeof import('@/app/commercial/actions').purchaseCommercial>[0],signal?:ObservationSignal,grant?:{id:string;revision:number}){
 const {purchaseCommercial,readMyCommercial}=await import('@/app/commercial/actions')
 const {observeCheckout}=await import('@/lib/measurement/checkout-observation')
 const result=await collectAction(signal,sink=>observeCheckout(signal,()=>purchaseCommercial(input),id=>readMyCommercial('orders',null,id),sink))
 try{if(signal?.journey&&result.value.ok&&result.value.id){const {bindJourneyOrder}=await import('@/lib/measurement/journey-server');const proof=signal.journey,id=result.value.id;after(async()=>{await bindJourneyOrder(proof,id)})}}catch{}
 try{const {persistenceEnabled,rpc}=await import('@/lib/measurement/durable-outcomes');if(grant&&signal&&result.value.ok&&persistenceEnabled()){const id=result.value.id;after(async()=>{try{const {createServerSupabaseClient}=await import('@/lib/supabase-server');const db=await createServerSupabaseClient();await rpc(db,'ka09_bind_order_outcomes',{p_grant:grant.id,p_revision:grant.revision,p_order:id,p_origin:new Date(signal.at).toISOString(),p_page:signal.page,p_locale:signal.locale})}catch{/* No callback/financial response changes. */}})}}catch{}
 return result
}

// Local-only durable consent surface. No production schema or transport is enabled.
export async function registerOutcomeConsent(input:{epoch:string;clientId:string;tokenDigest:string;notice:'ka09-local-v1'|'ka09-v1'}){
 try{if((await verifiedMeasurementEligibility())!=='eligible')return {state:'SUPPRESSED'};const {persistenceEnabled,rpc}=await import('@/lib/measurement/durable-outcomes');if(!persistenceEnabled())return {state:'DISABLED'}
 const {createServerSupabaseClient}=await import('@/lib/supabase-server');const db=await createServerSupabaseClient()
 const {sourceCaptureEnabled}=await import('@/lib/measurement/source-capture');return await rpc(db,sourceCaptureEnabled()?'ka10_outcome_consent_grant':'ka09_consent_grant',{p_epoch:input.epoch,p_client:input.clientId,p_token_digest:input.tokenDigest,p_notice:input.notice})
 }catch{return {state:'UNAVAILABLE'}}
}
export async function revokeOutcomeConsent(input:{id:string;token:string;reason:'withdrawal'|'logout'|'account_switch'|'erasure'}){
 try{const {persistenceEnabled,rpc}=await import('@/lib/measurement/durable-outcomes');const {sourceCaptureEnabled}=await import('@/lib/measurement/source-capture');if(!persistenceEnabled()&&!sourceCaptureEnabled())return {state:'DISABLED'}
 const {createServerSupabaseClient}=await import('@/lib/supabase-server');return await rpc(await createServerSupabaseClient(),sourceCaptureEnabled()?'ka10_outcome_revoke':'ka09_consent_revoke',{p_id:input.id,p_token:input.token,p_reason:input.reason})
 }catch{return {state:'UNAVAILABLE'}}
}
export async function bindOutcomeConsent(input:{grant:{id:string;revision:number};event:'purchase'|'tw_payment_state'|'tw_entitlement_state'|'tw_execution_result'|'tw_report_ready';kind:'order'|'execution';subject:string;origin:string;page:string;locale:'en'|'es'}){
 try{if((await verifiedMeasurementEligibility())!=='eligible')return {state:'SUPPRESSED'};const {persistenceEnabled,rpc}=await import('@/lib/measurement/durable-outcomes');if(!persistenceEnabled())return {state:'DISABLED'}
 const {createServerSupabaseClient}=await import('@/lib/supabase-server');return await rpc(await createServerSupabaseClient(),'ka09_outcome_bind',{p_grant:input.grant.id,p_revision:input.grant.revision,p_event:input.event,p_kind:input.kind,p_subject:input.subject,p_origin:input.origin,p_page:input.page,p_locale:input.locale})
 }catch{return {state:'UNAVAILABLE'}}
}

export async function measuredBank(input:unknown,comparison:boolean,signal?:ObservationSignal){
 const {executeBankAnalyticalQuestion,executeBankMarketComparison}=await import('@/lib/bank-analytical-action')
 const engine=comparison?'comparison':(input as {engine?:string}|null)?.engine
 const schema=await import('@/lib/measurement/schemas.json');const known=schema.default.tw_analytics_select.properties.engine_id.enum as readonly string[]
 const work=async()=>comparison?await executeBankMarketComparison(input):await executeBankAnalyticalQuestion(input)
 if(!engine||!known.includes(engine))return {value:await work(),measurement:null}
 return collectAction(signal,sink=>observeExecution<Awaited<ReturnType<typeof work>>>(engine as Parameters<typeof observeExecution>[0],'engine',signal,work,sink,'BANK'),'BANK')
}
export async function measuredListingLens(request:import('@/lib/lpi-contract').Request,signal?:ObservationSignal){
 const {runListingLens}=await import('@/lib/lpi-action');const engine=({asking:'market-asking-price-distribution',matching:'matching',frequency:'configuration',position:'position'} as const)[request?.lens]
 if(!engine)return {value:await runListingLens(request),measurement:null}
 return collectAction(signal,sink=>observeExecution(engine,'engine',signal,()=>runListingLens(request),sink))
}
