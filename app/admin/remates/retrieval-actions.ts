'use server'
import {retrievalInventory,configureRetrieval,type RetrievalConfiguration} from '@/lib/remates/retrieval-admin'
export async function retrievalRead(){try{return {ok:true as const,items:await retrievalInventory()}}catch{return {ok:false as const}}}
export async function retrievalConfigure(request:string,source:string,expected:string,configuration:RetrievalConfiguration,reason:string){try{return {ok:true as const,data:await configureRetrieval(request,source,expected,configuration,reason)}}catch(e){return {ok:false as const,error:e instanceof Error&&e.message==='STALE_REVISION'?'STALE_REVISION':'RETRIEVAL_UNAVAILABLE'}}}
