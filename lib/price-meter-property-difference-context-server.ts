import 'server-only'
import { authorizePriceMeterIntelligenceExecution } from './price-meter-authorization'
import { parseDifferenceRequest,type ContextSelection } from './price-meter-property-difference-context-request'
import { executePropertyPositionWithWorkingEvidence } from './price-meter-property-position-execution'
import { contextBase,type EstablishedExecution } from './price-meter-property-difference-context-adapter'
import { resolveComparisons,acquireComparisons } from './price-meter-property-difference-context-acquisition'
import { geographicContext } from './price-meter-property-difference-context-geographic'
import { sizeContext } from './price-meter-property-difference-context-size'
import { constructionLandContext } from './price-meter-property-difference-context-construction-land'
import { characteristicContext } from './price-meter-property-difference-context-characteristic'
import type { DifferenceResult,ContextItem } from './price-meter-property-difference-context-result-contract'
export class DifferenceRequestError extends Error {}
const phase=(s:ContextSelection):7|8|9|10=>s.questionKey==='geographic_children'?7:s.questionKey.includes('_area_to_')?8:s.questionKey==='characteristic_comparison'?10:9
export async function executeDifferenceContext(input:unknown):Promise<DifferenceResult> {
 await authorizePriceMeterIntelligenceExecution('cap-property-price-m2-position')
 let request
 try {request=parseDifferenceRequest(input)}catch{throw new DifferenceRequestError('Invalid context request.')}
 const execution=await executePropertyPositionWithWorkingEvidence(request.positionRequest)
 if(execution.result.state!=='ok'||!execution.working)return {contractVersion:1,request,positionResult:execution.result,items:request.contexts.map((s,index)=>({questionKey:s.questionKey,index,phase:phase(s),state:'not_established',reason:'position_prerequisite_failed',populations:[],universe:null,metrics:[],groups:[]}))}
 const e=execution as EstablishedExecution
 const items:ContextItem[]=request.contexts.map((s,index)=>contextBase(e,s.questionKey,index,phase(s)))
 let comparisons:Awaited<ReturnType<typeof resolveComparisons>>={resolved:[],invalid:[]}
 try {comparisons=await resolveComparisons(e,request.contexts)}catch(cause){items.forEach(i=>{if(i.phase===10){i.state='execution_unavailable';i.reason='comparison_resolution_unavailable';i.populations=[];i.cause=cause}})}
 for(const index of comparisons.invalid){items[index].state='invalid_request';items[index].reason='invalid_comparison_definition';items[index].populations=[]}
 let acquired:Awaited<ReturnType<typeof acquireComparisons>>|null=null
 if(comparisons.resolved.length)try {acquired=await acquireComparisons(e,comparisons.resolved)}catch(cause){for(const d of comparisons.resolved){items[d.index].state='execution_unavailable';items[d.index].reason='context_evidence_incomplete';items[d.index].populations=[];items[d.index].cause=cause}}
 for(let index=0;index<request.contexts.length;index++){
  const s=request.contexts[index]
  try {
   if(s.questionKey==='geographic_children')items[index]=geographicContext(e,index)
   else if(s.questionKey.includes('_area_to_'))items[index]=sizeContext(e,s.questionKey,index)
   else if(s.questionKey.startsWith('construction_land_'))items[index]=constructionLandContext(e,s.questionKey,index)
   else {const d=comparisons.resolved.find(d=>d.index===index);if(d&&acquired)items[index]=await characteristicContext(e,index,d.request,acquired.observations,acquired.memberships,acquired.fx)}
  }catch(cause){items[index].state='execution_unavailable';items[index].reason='context_execution_unavailable';items[index].cause=cause}
 }
 return {contractVersion:1,request,positionResult:e.result,items}
}
