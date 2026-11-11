'use server'
import {onvoReadiness,readMyCommercial} from '@/app/commercial/actions'
import {readMySinpe} from '@/app/payments/actions'

// Owned display reads only. Preparation and payment authority stay in their existing actions.
export async function readSinpeCheckoutDisplay(order:string,language:'en'|'es'){
 try{
  if(!/^[a-f0-9-]{36}$/i.test(order)||!['en','es'].includes(language))return null
  const detail=await readMyCommercial('orders',null,order),row=detail.ok?detail.items[0]:null
  if(!row||row.kind!=='package'||row.currency!=='CRC'||!Number.isFinite(Number(row.amount))||Number(row.amount)<=0||!Number.isFinite(Date.parse(row.deadline)))return null
  const receiving=await readMySinpe(order)
  const account=receiving.ok?receiving.data?.accounts?.find((a:{id:string})=>a.id===process.env.ONVO_RECEIVING_ACCOUNT_ID):null
  const text=language==='es'?account?.instructionsES:account?.instructionsEN
  const instructions=typeof text==='string'&&await onvoReadiness()?text:''
  return {order,product:row.product,amount:String(row.amount),currency:'CRC' as const,deadline:row.deadline,name:(language==='es'?row.nameES:row.nameEN)||row.product,instructions,termQuantity:row.termQuantity,termUnit:row.termUnit}
 }catch{return null}
}
