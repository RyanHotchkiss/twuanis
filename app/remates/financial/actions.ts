'use server'
import {commandFinancial,readFinancial,type FinancialCommand,type FinancialQuery} from '@/lib/remates/financial-evidence'
export async function financialRead(query:FinancialQuery){try{return {ok:true as const,data:await readFinancial(query)}}catch{return {ok:false as const}}}
export async function financialCommand(request:string,command:FinancialCommand){try{return {ok:true as const,data:await commandFinancial(request,command)}}catch(e){return {ok:false as const,error:e instanceof Error&&['STALE_REVISION','AUTHORITY_DENIED','INVALID_REQUEST'].includes(e.message)?e.message:'COMMAND_UNAVAILABLE'}}}
