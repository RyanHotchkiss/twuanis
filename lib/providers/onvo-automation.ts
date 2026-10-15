import 'server-only'
import {createHash,timingSafeEqual} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {OnvoSinpeAdapter,OnvoUnavailable,authenticateOnvoWebhook,onvoEvent,verifyOnvoReceipt,onvoMinorUnits,type OnvoContext,type OnvoOrder} from './onvo-sinpe'
import {sendSinpePurchaseNotification} from '@/lib/email'
type RecordValue=Record<string,any>
type Command=(operation:string,command:RecordValue)=>Promise<any>
export function onvoAutomationEnabled(){return process.env.TWUANIS_ONVO_AUTOMATION==='canonical'&&process.env.TWUANIS_SINPE_PAYMENTS==='canonical'&&process.env.TWUANIS_PACKAGE_ENFORCEMENT==='canonical'}
export function onvoConfiguration():OnvoContext{
 const mode=process.env.ONVO_MODE;if(mode!=='test'&&mode!=='live')throw new OnvoUnavailable()
 const context:OnvoContext={mode,accountId:process.env.ONVO_ACCOUNT_ID??'',secretKey:process.env.ONVO_SECRET_KEY??'',webhookSecret:process.env.ONVO_WEBHOOK_SECRET??''}
 if(!context.accountId||!context.secretKey.startsWith(`onvo_${mode}_secret_key_`)||!context.webhookSecret.startsWith('webhook_secret_'))throw new OnvoUnavailable();return context
}
export function workerAuthorized(header:string|null){const expected=process.env.ONVO_WORKER_SECRET;if(!expected||expected.length<32||!header||header.length>1024)return false;return timingSafeEqual(createHash('sha256').update(header).digest(),createHash('sha256').update('Bearer '+expected).digest())}
export async function boundedOnvoBody(request:Request){const reader=request.body?.getReader();if(!reader)throw new OnvoUnavailable();let size=0,text='';const decoder=new TextDecoder();try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>262144){await reader.cancel();throw new OnvoUnavailable()}text+=decoder.decode(v.value,{stream:true})}return text+decoder.decode()}finally{reader.releaseLock()}}
const command:Command=async(operation,payload)=>{const r=await supabaseAdmin.rpc('onvo_service_command',{p_operation:operation,p_command:payload});if(r.error)throw new OnvoUnavailable();return r.data}
const reconcile:Command=async(operation,payload)=>{const r=await supabaseAdmin.rpc('onvo_reconciliation_service',{p_operation:operation,p_command:payload});if(r.error)throw new OnvoUnavailable();return r.data}
export class OnvoAutomation{
 constructor(readonly context:OnvoContext,readonly adapter:OnvoSinpeAdapter=new OnvoSinpeAdapter(context),readonly execute:Command=command,readonly cursor:Command=reconcile){}
 async initiate(orderId:string,accountId:string,payer:{identification:string;identificationType:number;number:string},receivingAccount:string){
  if(!payer||![0,1,2,3,4,5,9].includes(payer.identificationType)||typeof payer.identification!=='string'||payer.identification.length>30||! /^[A-Za-z0-9-]+$/.test(payer.identification)||! /^\+506\d{8}$/.test(payer.number))throw new OnvoUnavailable()
  const reservation=await this.execute('reserve',{orderId,accountId,providerAccount:this.context.accountId,mode:this.context.mode,receivingAccount});let intentId=reservation.intentId
  if(reservation.create){const intent=await this.adapter.createIntent(reservation.order) as RecordValue;if(typeof intent.id!=='string'||intent.accountId!==this.context.accountId||intent.mode!==this.context.mode||intent.amount!==onvoMinorUnits(reservation.order.amount)||intent.currency!=='CRC')throw new OnvoUnavailable();intentId=intent.id;await this.execute('bind',{orderId,intentId})}
  if(!intentId)return{state:'NEEDS_RESOLUTION',reason:'intent_creation_uncertain'}
  const confirmation=await this.execute('confirmation',{orderId});if(confirmation.confirm){const method=await this.adapter.createMethod(payer) as RecordValue;if(typeof method.id!=='string')throw new OnvoUnavailable();await this.adapter.confirm(intentId,method.id)}
  return{state:'PENDING'}
 }
 async ingest(raw:string,secret:string|null){if(!authenticateOnvoWebhook(secret,this.context.webhookSecret))throw new OnvoUnavailable();const event=onvoEvent(JSON.parse(raw));return this.execute('inbox',{digest:createHash('sha256').update(raw).digest('hex'),event})}
 async processTransfer(input:RecordValue){
  if(typeof input.SINPERefNumber!=='string')throw new OnvoUnavailable()
  // Reconciliation/webhook bodies are hints. Re-fetch exact provider transaction evidence.
  const transfer=await this.adapter.readTransfer(input.SINPERefNumber) as RecordValue
  if(transfer.id!==input.id||transfer.paymentIntentId!==input.paymentIntentId)throw new OnvoUnavailable()
  if(typeof transfer.paymentIntentId!=='string')return this.unassociated(transfer)
  const intent=await this.adapter.readIntent(transfer.paymentIntentId) as RecordValue
  let bound=await this.execute('lookup',{intentId:transfer.paymentIntentId})
  if(!bound&&typeof intent.metadata?.orderId==='string'){
   bound=await this.execute('lookup_order',{orderId:intent.metadata.orderId})
   if(bound&&bound.providerAccount===this.context.accountId&&bound.mode===this.context.mode&&intent.accountId===this.context.accountId&&intent.mode===this.context.mode&&intent.currency==='CRC'&&intent.amount===onvoMinorUnits(bound.order.amount)){
    await this.execute('bind',{orderId:bound.order.id,intentId:transfer.paymentIntentId});bound=await this.execute('lookup',{intentId:transfer.paymentIntentId})
   }else bound=null
  }
  if(!bound)return this.unassociated(transfer)
  if(bound.providerAccount!==this.context.accountId||bound.mode!==this.context.mode)throw new OnvoUnavailable()
  const evidence=verifyOnvoReceipt(this.context,bound.order as OnvoOrder,transfer.paymentIntentId,intent,transfer)
  if(evidence.disposition==='PENDING')return{state:'PENDING'}
  if(!Number.isSafeInteger(transfer.amount)||transfer.amount<=0||typeof transfer.currency!=='string')throw new OnvoUnavailable()
  const minor=BigInt(transfer.amount),amount=`${minor/BigInt(100)}.${String(minor%BigInt(100)).padStart(2,'0')}`
  const result=await this.execute('receipt',{orderId:bound.order.id,intentId:transfer.paymentIntentId,providerAccount:this.context.accountId,mode:this.context.mode,transactionId:evidence.transaction,reference:evidence.externalReference,receivedAt:'receivedAt'in evidence?evidence.receivedAt:null,amount,currency:transfer.currency})
  if(result.disposition==='APPROVED')await this.execute('fulfill',{orderId:bound.order.id})
  return result
 }
 async unassociated(transfer:RecordValue){
  const receivingAccount=process.env.ONVO_RECEIVING_ACCOUNT_ID
  if(!receivingAccount||transfer.mode!==this.context.mode||transfer.status!=='received'||!Number.isSafeInteger(transfer.amount)||transfer.amount<=0)throw new OnvoUnavailable()
  return this.execute('unassociated',{receivingAccount,providerAccount:this.context.accountId,mode:this.context.mode,transactionId:transfer.id,reference:transfer.SINPERefNumber,amount:String(transfer.amount/100),currency:transfer.currency,receivedAt:transfer.createdAt??null,digest:createHash('sha256').update(`${this.context.accountId}:${this.context.mode}:${transfer.id}`).digest('hex')})
 }
 async processEvent(event:RecordValue){
  if(event.reference){const transfer=await this.adapter.readTransfer(event.reference) as RecordValue;return this.processTransfer(transfer)}
  if(!event.intentId)return{state:'NEEDS_RESOLUTION'}
  const bound=await this.execute('lookup',{intentId:event.intentId});if(!bound)throw new OnvoUnavailable()
  const page=await this.adapter.transferPage(bound.order.createdAt,new Date(Date.now()+1000).toISOString());if(page.hasMore)throw new OnvoUnavailable()
  const matching=page.data.filter((x:any)=>x.paymentIntentId===event.intentId)
  if(!matching.length)throw new OnvoUnavailable()
  for(const transfer of matching)await this.processTransfer(transfer as RecordValue)
  return{state:'PROCESSED'}
 }
 async run(){const work=await this.execute('work',{});let processed=0,failed=0
  for(const row of work.events){try{const result=await this.processEvent(row.event);await this.execute('inbox_done',{id:row.id,result});processed++}catch{failed++;await this.execute('inbox_fail',{id:row.id})}}
  for(const orderId of work.fulfillments){try{await this.execute('fulfill',{orderId})}catch{failed++}}
  const from=process.env.ONVO_RECONCILIATION_START
  if(from&&Number.isFinite(Date.parse(from))){try{const c=await this.cursor('read',{providerAccount:this.context.accountId,mode:this.context.mode,from});const page=await this.adapter.transferPage(c.window_start,c.window_end,c.cursor??undefined);for(const t of page.data)await this.processTransfer(t as RecordValue);await this.cursor('advance',{providerAccount:this.context.accountId,mode:this.context.mode,expectedCursor:c.cursor,start:c.window_start,end:c.window_end,hasMore:page.hasMore,cursor:page.cursor})}catch{failed++}}
  return{processed,failed,reconciliation:from?'configured':'unavailable'}
 }
}
export async function deliverSinpeNotification(){
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return{state:'UNCONFIGURED'}
 const claim=await supabaseAdmin.rpc('sinpe_notification_service',{p_operation:'claim',p_command:{}});if(claim.error)throw new OnvoUnavailable();if(!claim.data)return{state:'EMPTY'}
 let outcome='RETRY',messageId:string|null=null
 try{messageId=await sendSinpePurchaseNotification(claim.data.orderId,claim.data.payload);outcome='ACCEPTED'}catch{}
 const finish=await supabaseAdmin.rpc('sinpe_notification_service',{p_operation:'finish',p_command:{orderId:claim.data.orderId,token:claim.data.token,outcome,messageId}});if(finish.error)throw new OnvoUnavailable()
 return{state:outcome}
}
