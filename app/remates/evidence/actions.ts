'use server'
import {commandEvidence,readEvidence,type EvidenceCommand,type EvidenceQuery} from '@/lib/remates/evidence'
export async function evidenceRead(query:EvidenceQuery){try{return {ok:true as const,data:await readEvidence(query)}}catch{return {ok:false as const}}}
export async function evidenceCommand(request:string,command:EvidenceCommand){try{return {ok:true as const,data:await commandEvidence(request,command)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','INVALID_REQUEST'].includes(e.message)?e.message:'COMMAND_UNAVAILABLE'}}}
