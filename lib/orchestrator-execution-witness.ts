import 'server-only'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {supabaseAdmin} from './supabase-admin'
import {executionCreditServerContext} from './execution-credits-server'
import {captureAnalyticalEvidence} from './orchestrator-evidence-v2'
import type {OrchestratorRequest,OrchestratorReport} from './orchestrator-contract'
import {witnessRelease} from './orchestrator-witness-release'

// Only the execution coordinator may open capture. Report submission receives
// neither the attempt capability nor a callable standalone witness finalizer.
export async function claimWitnessedExecution(input:{claims:Record<string,unknown>;request:OrchestratorRequest;execution:string;worker:string;reportId:string;settlement:string}){
 const archive=readFileSync(join(process.cwd(),witnessRelease.archivePath))
 if(createHash('sha256').update(archive).digest('hex')!==witnessRelease.archiveSha256)throw Error('Reviewed historical archive unavailable.')
 const {request:r}=input
 const response=await supabaseAdmin.rpc('orchestrator_execution_claim_v2',{p_claims:input.claims,p_request:r.requestId,p_execution:input.execution,p_orchestrator:r.orchestrator,p_population:r.population,p_question:r,p_worker:input.worker,p_release:witnessRelease.id})
 let capability:string|null=response.data?.captureCapability??null
 const {captureCapability:_discard,...publicData}=response.data??{}
 // Remove the capability from the response object before returning it.
 if(response.data)delete response.data.captureCapability
 let used=false
 return {claim:{data:publicData,error:response.error},capture:async(run:()=>Promise<OrchestratorReport>):Promise<OrchestratorReport>=>{
  if(used||!capability||publicData.state!=='CLAIMED')throw Error('Fresh canonical execution capture required.')
  used=true
  try{
   // The graph comes from the private live call recorder, never run()'s report field.
   const captured=await captureAnalyticalEvidence(run,{executionId:input.execution,accountId:input.claims.sub,requestId:r.requestId,population:r.population,methodologyRelease:witnessRelease.id}),report=captured.result
   const transcript={schema:'twuanis-analytical-evidence-v2' as const,encoding:'ordered-content-graph-binary64-v1' as const,records:captured.records,nodes:captured.nodes}
   report.immutableEvidence=transcript
   const {claims}=await executionCreditServerContext()
   const sealed=await supabaseAdmin.rpc('orchestrator_witness_finalize',{p_claims:claims,p_execution:input.execution,p_worker:input.worker,p_attempt:publicData.attempt,p_capture:capability,p_report:input.reportId,p_settlement:input.settlement,p_transcript:transcript,p_envelope:Object.fromEntries(Object.entries(report).filter(([key])=>key!=='immutableEvidence'))})
   if(sealed.error||!sealed.data?.id){
    if(sealed.error?.code==='57014'||['WITNESS_RESOURCE_LIMIT','V2 qualification resource ceiling exceeded'].includes(sealed.error?.message??''))throw Object.assign(new Error(r.language==='es'?'No se pudo verificar la evidencia completa dentro de los recursos disponibles. No se generó un informe ni se consumió un token.':'The complete evidence could not be verified within the available resources. No report was created and no token was consumed.'),{name:'OrchestratorResourceLimit'})
    throw Error('Execution witness finalization failed.')
   }
   report.witnessId=sealed.data.id;report.methodologyRelease=witnessRelease.id
   return report
  }finally{capability=null}
 }}
}
