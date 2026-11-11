import 'server-only'
import {randomUUID} from 'node:crypto'
import {eligible,type ObservationSignal,type ProjectionSink} from './server-observation'
import {projectOutcome} from './server-projection'

// A fresh acknowledged order can establish checkout, never payment or activation.
// The existing own-account reader supplies canonical product/value/currency.
export async function observeCheckout<T extends {ok:boolean;id?:string}>(
 signal:ObservationSignal|undefined,work:()=>Promise<T>,
 read:(id:string)=>Promise<unknown>,sink:ProjectionSink,
):Promise<T>{
 const result=await work()
 try{
  const authority=eligible(signal)
  if(!authority||!signal||Date.now()<signal.at||Date.now()-signal.at>600000||!result.ok||
   typeof result.id!=='string'||!/^[0-9a-f-]{36}$/i.test(result.id))return result
  const projection=await read(result.id) as {ok?:boolean;items?:Record<string,unknown>[]}|null
  if(!projection?.ok||!Array.isArray(projection.items)||projection.items.length!==1)return result
  const order=projection.items[0],created=Date.parse(String(order.createdAt))
  if(order.id!==result.id||order.kind!=='package'||typeof order.product!=='string'||
   !/^[a-z0-9][a-z0-9_-]{0,99}$/.test(order.product)||!['USD','CRC'].includes(String(order.currency))||
   !Number.isFinite(created)||created<signal.at||created>Date.now()||order.state!=='pending'||order.paid!==false||
   typeof order.amount!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(order.amount))return result
  const value=Number(order.amount)
  if(!Number.isFinite(value)||value<0||!Number.isSafeInteger(Math.round(value*100)))return result
  const duration=order.durationDays===1?'daily':order.termUnit==='month'?'monthly':'unknown'
  await projectOutcome('begin_checkout',{
   schema_v:'1-proposed',event_id:'e'+randomUUID().replaceAll('-',''),locale:signal.locale,
   page_instance:signal.page,consent_epoch:signal.epoch,environment:signal.environment,
   package_id:order.product,market_variant:'unknown',duration_kind:duration,
   currency:order.currency as 'USD'|'CRC',value,items:[{item_id:order.product,quantity:1,price:value}],
  },authority,async(name,parameters)=>sink({name,parameters}))
 }catch{/* A missing projection cannot undo an already acknowledged order. */}
 return result
}
