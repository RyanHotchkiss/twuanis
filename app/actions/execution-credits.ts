'use server'
import {readMyExecutionCreditAccounting} from '@/lib/execution-credits-server'
export async function readExecutionCreditAccounting(afterAllocation:string|null=null,afterEvent:string|null=null,afterPurchase:string|null=null){
 try{return {ok:true as const,data:await readMyExecutionCreditAccounting(afterAllocation,afterEvent,afterPurchase)}}catch{return {ok:false as const}}
}
