'use server'
import {commandIdentity,readIdentity,type IdentityCommand,type IdentityQuery} from '@/lib/remates/identity'
export async function identityRead(query:IdentityQuery){try{return {ok:true as const,data:await readIdentity(query)}}catch{return {ok:false as const}}}
export async function identityCommand(request:string,command:IdentityCommand){try{return {ok:true as const,data:await commandIdentity(request,command)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','INVALID_REQUEST'].includes(e.message)?e.message:'COMMAND_UNAVAILABLE'}}}
