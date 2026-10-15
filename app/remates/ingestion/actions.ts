'use server'
import {commandIngestion,readIngestion,type IngestionCommand,type IngestionQuery} from '@/lib/remates/ingestion'
export async function ingestionRead(q:IngestionQuery){try{return {ok:true as const,data:await readIngestion(q)}}catch{return {ok:false as const}}}
export async function ingestionCommand(request:string,c:IngestionCommand){try{return {ok:true as const,data:await commandIngestion(request,c)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','EVIDENCE_REQUIRED','REQUEST_CONFLICT'].includes(e.message)?e.message:'INVALID_REQUEST'}}}
