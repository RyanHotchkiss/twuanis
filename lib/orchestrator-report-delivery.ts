import 'server-only'
import type {OrchestratorReport} from './orchestrator-contract'
import {readMyCompletedExecutionReport,executionCreditServerContext} from './execution-credits-server'

/** Presentation is a derived view; authoritative evidence remains unchanged. */
export function compactOrchestratorReport(report:OrchestratorReport):OrchestratorReport {
 if(report.format!=='twuanis-orchestrator-evidence-v2')return report
 const sections:{path:string[];total:number}[]=[]
 const project=(v:unknown,path:string[]):unknown=>{
  if(Array.isArray(v)){if(v.length>50){sections.push({path,total:v.length});return {evidenceSection:path,totalObservations:v.length,preview:v.slice(0,50).map((x,i)=>project(x,[...path,String(i)]))}}return v.map((x,i)=>project(x,[...path,String(i)]))}
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,project(x,[...path,k])]))
  return v
 }
 const {immutableEvidence:_,authority:__,evidence,...rest}=report
 const out={...rest,authority:{},engines:project(report.engines,['engines']),evidence:{revisions:evidence.revisions,methodology:{sourceDigest:(evidence.methodology as {sourceDigest?:string})?.sourceDigest},financialBasis:evidence.financialBasis,presentationVersion:2,sections,completeEvidenceAvailable:true}} as OrchestratorReport
 if(Buffer.byteLength(JSON.stringify(out))>1048576)throw Error('Bounded report presentation exceeded.')
 return out
}
export async function readMyOrchestratorPresentation(id:string){return compactOrchestratorReport(await readMyCompletedExecutionReport(id) as unknown as OrchestratorReport)}
export async function createMyOrchestratorEvidenceReader(){
 const {db}=await executionCreditServerContext()
 return async function readChunk(id:string,offset=0,identity:string|null=null){
 if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isSafeInteger(offset)||offset<0||offset%65536!==0||identity!==null&&!/^[0-9a-f]{64}$/.test(identity))throw Error('Invalid evidence cursor.')
 const v=await db.rpc('read_orchestrator_evidence_chunk',{p_report:id,p_offset:offset,p_identity:identity})
 if(v.error||!v.data||v.data.reportId!==id||v.data.offset!==offset||typeof v.data.text!=='string'||v.data.text.length>524288)throw Error('Evidence section unavailable.')
 return v.data as {reportId:string;offset:number;next:number|null;totalCharacters:number;identity:string;text:string}
}

}
export async function readMyOrchestratorEvidenceChunk(id:string,offset=0,identity:string|null=null){
 return (await createMyOrchestratorEvidenceReader())(id,offset,identity)
}
