'use server'
import {readInstitutionAuthority,commandInstitutionAuthority,type AuthorityQuery,type AuthorityCommand} from '@/lib/remates/authority'
export async function authorityRead(query:AuthorityQuery){try{return {ok:true as const,data:await readInstitutionAuthority(query)}}catch{return {ok:false as const}}}
export async function authorityCommand(request:string,command:AuthorityCommand){try{return {ok:true as const,data:await commandInstitutionAuthority(request,command)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','INVALID_REQUEST'].includes(e.message)?e.message:'COMMAND_UNAVAILABLE'}}}
