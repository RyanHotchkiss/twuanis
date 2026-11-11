'use server'
import {previewAdapter} from '@/lib/remates/adapters/preview'
import type {AdapterId} from '@/lib/remates/adapters/contracts'
export async function adapterPreview(institution:string,source:string,expected:string,id:AdapterId,raw:string){try{return {ok:true as const,data:await previewAdapter(institution,source,expected,id,raw)}}catch(e){return {ok:false as const,error:e instanceof Error&&['AUTHORITY_DENIED','STALE_REVISION','SOURCE_CONFIGURATION_MISMATCH'].includes(e.message)?e.message:'INVALID_FIXTURE'}}}
