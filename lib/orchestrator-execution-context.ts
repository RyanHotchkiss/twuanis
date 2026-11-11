import 'server-only'
import {AsyncLocalStorage} from 'node:async_hooks'
import type {CanonicalAcquisitionPlan} from './canonical-acquisition-plan'
import type {AcquisitionRequest,AcquisitionResult} from './canonical-population-acquisition'
export type OrchestratorContext={identity:{executionId:string;accountId:string;requestId:string;orchestrator:string;population:string};phase:'execution'|'freshness';plan:CanonicalAcquisitionPlan;authorize:(r:AcquisitionRequest)=>Promise<{accountId:string;capability:AcquisitionRequest['capability'];population:AcquisitionRequest['population'];terms:{id:string;startsAt:string;endsAt:string}[]}>,bankRead:(r:AcquisitionRequest,after:string|null)=>Promise<any>;cache:Map<string,Promise<any>>;acquisitions:Set<AcquisitionResult>;metrics:{hits:number;misses:number}}
const storage=new AsyncLocalStorage<OrchestratorContext>()
export const currentOrchestratorContext=()=>storage.getStore()
export const withOrchestratorContext=<T>(context:OrchestratorContext,run:()=>Promise<T>)=>storage.run(context,run)
export async function orchestratorMemo<T>(kind:string,key:string,run:()=>Promise<T>):Promise<T>{
 const c=storage.getStore();if(!c)return run();const k=JSON.stringify([c.identity,c.phase,kind,key])
 const previous=c.cache.get(k);if(previous){c.metrics.hits++;return previous}
 c.metrics.misses++;const value=run();c.cache.set(k,value);try{return await value}catch(e){c.cache.delete(k);throw e}
}
