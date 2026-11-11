import 'server-only'
import {assertUniverseScope} from './analytical-universe'
import type {OrchestratorReport} from './orchestrator-contract'
import {readMyCompletedExecutionReport,executionCreditServerContext} from './execution-credits-server'

/** Working evidence stays server-only until Assignment 3 supplies complete safe DTO adapters. */
export function compactOrchestratorReport(report:OrchestratorReport):OrchestratorReport {
 assertUniverseScope(report.population,(report.request.scope as {transaction?:string})?.transaction)
 throw Error('Qualified analytical result projection required.')
}
export async function readMyOrchestratorPresentation(id:string){return compactOrchestratorReport(await readMyCompletedExecutionReport(id) as unknown as OrchestratorReport)}
export async function createMyOrchestratorEvidenceReader(){
 await executionCreditServerContext()
 return async function readChunk(_id:string,_offset=0,_identity:string|null=null):Promise<{reportId:string;offset:number;next:number|null;totalCharacters:number;identity:string;text:string}>{
  // An evidence archive/closure download is not an authorized population result DTO.
  throw Error('Qualified analytical evidence projection required.')
 }
}
export async function readMyOrchestratorEvidenceChunk(id:string,offset=0,identity:string|null=null){
 return (await createMyOrchestratorEvidenceReader())(id,offset,identity)
}
