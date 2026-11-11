'use server'
import {commandClassification,readClassification,type ClassificationCommand,type ClassificationQuery} from '@/lib/remates/classification'
export async function classificationRead(query:ClassificationQuery){try{return {ok:true as const,data:await readClassification(query)}}catch{return {ok:false as const}}}
export async function classificationCommand(request:string,command:ClassificationCommand){try{return {ok:true as const,data:await commandClassification(request,command)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','INVALID_REQUEST'].includes(e.message)?e.message:'COMMAND_UNAVAILABLE'}}}
