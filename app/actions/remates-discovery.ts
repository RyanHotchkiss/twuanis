'use server'
import {readIndependentDiscovery,commandIndependentDiscovery} from '@/lib/remates/discovery'
async function result<T>(work:()=>Promise<T>){try{return {ok:true as const,data:await work()}}catch(e){return {ok:false as const,error:e instanceof Error?e.message:'DISCOVERY_UNAVAILABLE'}}}
export async function independentDiscoveryState(){return result(readIndependentDiscovery)}
export async function independentDiscoveryCommand(request:string,input:Parameters<typeof commandIndependentDiscovery>[1]){return result(()=>commandIndependentDiscovery(request,input))}
