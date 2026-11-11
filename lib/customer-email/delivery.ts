import {renderCustomerEmail,type CustomerEmailClaim,type CustomerEmailEnvelope} from './templates'
type Command=(operation:string,command:Record<string,unknown>)=>Promise<any>
type Transport=(envelope:CustomerEmailEnvelope,idempotencyKey:string)=>Promise<{id:string}>
export function customerEmailConfiguration(env:Record<string,string|undefined>){
 if(env.TWUANIS_CUSTOMER_EMAIL!=='canonical')return null
 const from=env.EMAIL_FROM,replyTo=env.EMAIL_REPLY_TO
 const valid=(s:string|undefined)=>!!s&&s.length<=320&&!/[\r\n]/.test(s)&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)
 const fromAddress=from?.match(/<([^<>]+)>$/)?.[1]??from
 if(!env.RESEND_API_KEY||!env.RESEND_WEBHOOK_SECRET||!valid(fromAddress)||!from||/[\r\n]/.test(from)||!valid(replyTo))return null
 return {from,replyTo:replyTo!}
}
// Same bounded claim/lease/finish pattern as the existing Owner notification worker.
// Transport injection is used only by isolated verification. No UI handler sends customer email.
export async function deliverCustomerEmails(command:Command,send:Transport,config:{from:string;replyTo:string}|null,limit=5){
 if(!config)return {state:'DISABLED_OR_UNCONFIGURED',attempted:0}
 if(!Number.isInteger(limit)||limit<1||limit>5)throw Error('BOUNDED_DELIVERY_REQUIRED')
 const capture=await command('capture',{});if(capture.state==='DISABLED')return {state:'DISABLED',attempted:0}
 let attempted=0
 for(let i=0;i<limit;i++){
  const claim=await command('claim',{}) as CustomerEmailClaim|null;if(!claim)break
  let outcome:'ACCEPTED'|'RETRY'|'FAILED'='RETRY',messageId:string|undefined,error='TRANSPORT_UNAVAILABLE'
  try{
   const envelope=claim.envelope??renderCustomerEmail(claim,config)
   const prepared=await command('prepare',{id:claim.id,token:claim.token,envelope}) as CustomerEmailEnvelope|null
   if(!prepared)continue
   const result=await send(prepared,'customer-email-'+claim.id)
   if(typeof result?.id!=='string'||!result.id||result.id.length>200)throw Error('PROVIDER_ACK_MISSING')
   messageId=result.id;outcome='ACCEPTED'
  }catch(e){
   // Never persist raw provider errors: they may contain addresses or message contents.
   const code=e instanceof Error?e.message:''
   if(['UNKNOWN_TEMPLATE','INVALID_CANONICAL_DATE','INVALID_CANONICAL_AMOUNT'].includes(code)){outcome='FAILED';error=code}
   const provider=code.startsWith('RESEND_')?code.slice(7):''
   if(['invalid_idempotency_key','validation_error','missing_api_key','restricted_api_key','invalid_api_key','invalid_idempotent_request','invalid_from_address','invalid_access','invalid_parameter','invalid_region','missing_required_field','security_error'].includes(provider)){outcome='FAILED';error=code}
   else if(['concurrent_idempotent_requests','monthly_quota_exceeded','daily_quota_exceeded','rate_limit_exceeded','application_error','internal_server_error'].includes(provider))error=code
  }
  await command('finish',{id:claim.id,token:claim.token,outcome,messageId,error:outcome==='ACCEPTED'?undefined:error});attempted++
 }
 return {state:'PROCESSED',attempted}
}
