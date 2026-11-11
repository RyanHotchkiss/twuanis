import 'server-only'
import {createHash,timingSafeEqual} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {OnvoSinpeAdapter,OnvoUnavailable,authenticateOnvoWebhook,onvoEvent,verifyOnvoReceipt,verifyOnvoStandardReceipt,verifyOnvoMerchant,onvoMinorUnits,type OnvoContext,type OnvoOrder} from './onvo-sinpe'
import {sendSinpePurchaseNotification} from '@/lib/email'
type RecordValue=Record<string,any>
type Command=(operation:string,command:RecordValue)=>Promise<any>
export function onvoAutomationEnabled(){return process.env.TWUANIS_ONVO_AUTOMATION==='canonical'&&process.env.TWUANIS_SINPE_PAYMENTS==='canonical'&&process.env.TWUANIS_PACKAGE_ENFORCEMENT==='canonical'}
export function onvoConfiguration():OnvoContext{
 const mode=process.env.ONVO_MODE;if(mode!=='test'&&mode!=='live')throw new OnvoUnavailable()
 const context:OnvoContext={mode,accountId:process.env.ONVO_ACCOUNT_ID??'',secretKey:process.env.ONVO_SECRET_KEY??'',webhookSecret:process.env.ONVO_WEBHOOK_SECRET??''}
 const evidenceMode=process.env.ONVO_EVIDENCE_MODE;if(evidenceMode&&evidenceMode!=='standard-intent'&&evidenceMode!=='custom-mobile')throw new OnvoUnavailable();context.evidenceMode=evidenceMode==='standard-intent'?'standard-intent':'custom-mobile';
 if(!context.accountId||!context.secretKey.startsWith(`onvo_${mode}_secret_key_`)||!context.webhookSecret.startsWith('webhook_secret_'))throw new OnvoUnavailable();return context
}
export function workerAuthorized(header:string|null){const expected=process.env.ONVO_WORKER_SECRET;if(!expected||expected.length<32||!header||header.length>1024)return false;return timingSafeEqual(createHash('sha256').update(header).digest(),createHash('sha256').update('Bearer '+expected).digest())}
export async function boundedOnvoBody(request:Request){const reader=request.body?.getReader();if(!reader)throw new OnvoUnavailable();let size=0,text='';const decoder=new TextDecoder();try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>262144){await reader.cancel();throw new OnvoUnavailable()}text+=decoder.decode(v.value,{stream:true})}return text+decoder.decode()}finally{reader.releaseLock()}}
const command:Command=async(operation,payload)=>{const r=await supabaseAdmin.rpc('onvo_service_command',{p_operation:operation,p_command:payload}).abortSignal(AbortSignal.timeout(3000));if(r.error)throw new OnvoUnavailable();return r.data}
const reconcile:Command=async(operation,payload)=>{const r=await supabaseAdmin.rpc('onvo_reconciliation_service',{p_operation:operation,p_command:payload}).abortSignal(AbortSignal.timeout(3000));if(r.error)throw new OnvoUnavailable();return r.data}
export class OnvoAutomation{
 constructor(readonly context:OnvoContext,readonly adapter:OnvoSinpeAdapter=new OnvoSinpeAdapter(context),readonly execute:Command=command,readonly cursor:Command=reconcile,readonly now:()=>number=Date.now){}
 async initiate(orderId:string,accountId:string,payer:{identification:string;identificationType:number;number:string},receivingAccount:string){
  if(!payer||![0,1,2,3,4,5,9].includes(payer.identificationType)||typeof payer.identification!=='string'||payer.identification.length>30||! /^[A-Za-z0-9-]+$/.test(payer.identification)||! /^\+506\d{8}$/.test(payer.number))throw new OnvoUnavailable()
  const reservation=await this.execute('reserve',{orderId,accountId,providerAccount:this.context.accountId,mode:this.context.mode,receivingAccount});let intentId=reservation.intentId
  if(reservation.create){const intent=await this.adapter.createIntent(reservation.order) as RecordValue;if(typeof intent.id!=='string'||intent.mode!==this.context.mode||intent.amount!==onvoMinorUnits(reservation.order.amount)||intent.currency!=='CRC')throw new OnvoUnavailable();verifyOnvoMerchant(this.context,intent,this.context.evidenceMode==='standard-intent');intentId=intent.id;await this.execute('bind',{orderId,intentId})}
  if(!intentId)return{state:'NEEDS_RESOLUTION',reason:'intent_creation_uncertain'}
  const confirmation=await this.execute('confirmation',{orderId});if(confirmation.confirm){const method=await this.adapter.createMethod(payer) as RecordValue;if(typeof method.id!=='string')throw new OnvoUnavailable();if(this.context.evidenceMode==='standard-intent'){verifyOnvoMerchant(this.context,method);if(method.mode!==this.context.mode)throw new OnvoUnavailable()}const result=await this.adapter.confirm(intentId,method.id) as RecordValue;if(result.id!==intentId||result.mode!==this.context.mode||result.amount!==onvoMinorUnits(reservation.order.amount)||result.currency!=='CRC')throw new OnvoUnavailable();verifyOnvoMerchant(this.context,result);if(result.status==='processing'){await this.execute('provider_status',{orderId,intentId,providerAccount:this.context.accountId,mode:this.context.mode,status:'processing'});return {state:'AWAITING_TRANSFER'}}return {state:'NEEDS_RESOLUTION'}}
  return{state:'NEEDS_RESOLUTION',reason:'confirmation_already_claimed'}
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
 async processStandardIntent(intentId:string){
  if(this.context.evidenceMode!=='standard-intent')throw new OnvoUnavailable()
  const bound=await this.execute('lookup',{intentId});if(!bound||bound.intentId!==intentId||bound.providerAccount!==this.context.accountId||bound.mode!==this.context.mode)throw new OnvoUnavailable()
  const intent=await this.adapter.readIntent(intentId)
  const evidence=verifyOnvoStandardReceipt(this.context,bound.order as OnvoOrder,intentId,intent)
  if(evidence.disposition==='NOT_PAID')await this.execute('provider_status',{orderId:bound.order.id,intentId,providerAccount:this.context.accountId,mode:this.context.mode,status:'failed'})
  if(evidence.disposition!=='PAID_AWAITING_RECEIPT_QUALIFICATION')return evidence
  const amount=(BigInt(evidence.amountMinor)/BigInt(100)).toString()+'.'+String(BigInt(evidence.amountMinor)%BigInt(100)).padStart(2,'0')
  const receipt=await this.execute('standard_receipt',{orderId:bound.order.id,intentId,providerAccount:this.context.accountId,mode:this.context.mode,evidenceType:evidence.evidenceType,status:'succeeded',chargeStatus:'succeeded',paymentMethodType:'mobile_number',providerPaymentId:evidence.providerPaymentId,amount,receivedAmount:amount,chargeAmount:amount,currency:evidence.currency,evidenceDigest:createHash('sha256').update(JSON.stringify(intent)).digest('hex')})
  if(receipt.disposition==='APPROVED'){const fulfillment=await this.execute('fulfill',{orderId:bound.order.id});return{...receipt,fulfillment,paidEvidence:evidence}}
  return{...receipt,paidEvidence:evidence}

 }
 async processEvent(event:RecordValue){
  if(this.context.evidenceMode==='standard-intent'){if(event.reference||!event.intentId)throw new OnvoUnavailable();return this.processStandardIntent(event.intentId)}
  if(event.reference){const transfer=await this.adapter.readTransfer(event.reference) as RecordValue;return this.processTransfer(transfer)}
  if(!event.intentId)return{state:'NEEDS_RESOLUTION'}
  const bound=await this.execute('lookup',{intentId:event.intentId});if(!bound)throw new OnvoUnavailable()
  if(bound.providerAccount!==this.context.accountId||bound.mode!==this.context.mode)throw new OnvoUnavailable()
  const intent=await this.adapter.readIntent(event.intentId) as RecordValue
  if(intent.id!==event.intentId||intent.accountId!==this.context.accountId||intent.mode!==this.context.mode||intent.currency!=='CRC'||intent.amount!==onvoMinorUnits(bound.order.amount))throw new OnvoUnavailable()
  if(intent.status==='failed'){
   await this.execute('provider_status',{orderId:bound.order.id,intentId:event.intentId,providerAccount:this.context.accountId,mode:this.context.mode,status:'failed'})
   return{state:'PROCESSED'}
  }
  const page=await this.adapter.transferPage(bound.order.createdAt,new Date(Date.now()+1000).toISOString());if(page.hasMore)throw new OnvoUnavailable()
  const matching=page.data.filter((x:any)=>x.paymentIntentId===event.intentId)
  if(!matching.length)throw new OnvoUnavailable()
  for(const transfer of matching)await this.processTransfer(transfer as RecordValue)
  return{state:'PROCESSED'}
 }
 async health(){return this.execute('health',{})}
 async run(){
  const started=this.now(),standard=this.context.evidenceMode==='standard-intent'
  const work=await this.execute('work',standard?{evidenceMode:'standard-intent',providerAccount:this.context.accountId,mode:this.context.mode}:{})
  const summary={processed:0,failed:0,pending:0,attention:0,fulfilled:0,deferred:0,reconciliation:standard?'standard-intent':'configured'}
  if(!Array.isArray(work.events)||!Array.isArray(work.fulfillments)||(standard&&!Array.isArray(work.intents)))throw new OnvoUnavailable()
  const queues=[work.events,work.fulfillments,standard?work.intents:[]]
  if(queues.some(q=>q.length>20))throw new OnvoUnavailable()
  // Interleave existing queues. A slow provider cannot consume all the time
  // before fulfillment or newly discovered intents receive a turn.
  const jobs:Array<{kind:number;row:any}>=[]
  const firstQueue=Math.floor(started/60000)%queues.length
  for(let i=0;i<20;i++)for(let offset=0;offset<queues.length;offset++){const kind=(firstQueue+offset)%queues.length;if(i<queues[kind].length)jobs.push({kind,row:queues[kind][i]})}
  const account=(result:any)=>{
   if(result?.disposition==='PENDING'||result?.state==='PENDING'){summary.pending++;return}
   const fulfillment=result?.fulfillment
   if(fulfillment?.state==='COMPLETE'||result?.state==='COMPLETE')summary.fulfilled++
   else if(fulfillment?.state==='PENDING')summary.pending++
   if(['NEEDS_RESOLUTION','RECEIVED_UNMATCHED'].includes(result?.disposition??result?.state)||fulfillment?.state==='NEEDS_RESOLUTION')summary.attention++
   summary.processed++
  }
  for(let n=0;n<jobs.length;n++){
   // Stop starting work at 8 seconds. A discovered standard intent can use
   // one 10-second GET and six 3-second RPC waits including error recording.
   // Notification/health retain 12 seconds within the 50-second route.
   // The first queue rotates each minute so slow calls cannot starve a class.
   if(this.now()-started>=8000){summary.deferred=jobs.length-n;break}
   const {kind,row}=jobs[n];let inboxId:string|undefined=kind===0?row.id:undefined
   try{
    if(kind===1){account(await this.execute('fulfill',{orderId:row}));continue}
    if(kind===2){
     // Persist recovery before network I/O. A failed GET now rotates into the
     // delayed inbox instead of starving later undiscovered intents forever.
     const digest=createHash('sha256').update(JSON.stringify(['ONVO_STANDARD_RECOVERY_V2',this.context.accountId,this.context.mode,row.intentId])).digest('hex')
     inboxId=(await this.execute('inbox',{digest,event:{type:'STANDARD_INTENT_RECONCILIATION',intentId:row.intentId}})).id
    }
    const result=kind===0?await this.processEvent(row.event):await this.processStandardIntent(row.intentId)
    if(result.disposition==='PENDING'||result.state==='PENDING')await this.execute('inbox_fail',{id:inboxId,reason:'verified_pending'})
    else await this.execute('inbox_done',{id:inboxId,result})
    account(result)
   }catch{
    summary.failed++
    if(inboxId)try{await this.execute('inbox_fail',{id:inboxId})}catch{/* Retained inbox remains due; failure stays visible. */}
   }
  }
  if(!standard){
   const from=process.env.ONVO_RECONCILIATION_START
   summary.reconciliation=from?'configured':'unavailable'
   if(from&&Number.isFinite(Date.parse(from))&&this.now()-started<8000){try{const c=await this.cursor('read',{providerAccount:this.context.accountId,mode:this.context.mode,from});const page=await this.adapter.transferPage(c.window_start,c.window_end,c.cursor??undefined);for(const t of page.data)await this.processTransfer(t as RecordValue);await this.cursor('advance',{providerAccount:this.context.accountId,mode:this.context.mode,expectedCursor:c.cursor,start:c.window_start,end:c.window_end,hasMore:page.hasMore,cursor:page.cursor})}catch{summary.failed++}}
  }
  return summary
 }
}
export async function deliverSinpeNotification(){
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return{state:'UNCONFIGURED'}
 const claim=await supabaseAdmin.rpc('sinpe_notification_service',{p_operation:'claim',p_command:{}}).abortSignal(AbortSignal.timeout(3000));if(claim.error)throw new OnvoUnavailable();if(!claim.data)return{state:'EMPTY'}
 let outcome='RETRY',messageId:string|null=null
 let timeout:ReturnType<typeof setTimeout>|undefined
 try{messageId=await Promise.race([sendSinpePurchaseNotification(claim.data.orderId,claim.data.payload),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(new OnvoUnavailable()),3000)})]);outcome='ACCEPTED'}catch{}finally{if(timeout)clearTimeout(timeout)}
 // A timed-out send is uncertain, not rejected. Retry retains the same
 // provider idempotency key and the existing 23h50m exhaustion boundary.
 const finish=await supabaseAdmin.rpc('sinpe_notification_service',{p_operation:'finish',p_command:{orderId:claim.data.orderId,token:claim.data.token,outcome,messageId}}).abortSignal(AbortSignal.timeout(3000));if(finish.error)throw new OnvoUnavailable()
 return{state:outcome}
}
