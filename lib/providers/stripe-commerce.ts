import 'server-only'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {StripeAdapter,type StripeConfiguration,verifyStripeSignature} from './stripe'
type Command=(operation:string,payload:Record<string,unknown>)=>Promise<any>
const execute:Command=async(operation,payload)=>{const r=await supabaseAdmin.rpc('stripe_service_command',{p_operation:operation,p_command:payload});if(r.error)throw Error('Stripe commerce unavailable');return r.data}
export class StripeCommerce{
 constructor(readonly config:StripeConfiguration,readonly adapter=new StripeAdapter(config),readonly command:Command=execute){}
 call(operation:string,payload:Record<string,unknown>){return this.command(operation,{...payload,providerAccount:this.config.accountId,mode:this.config.mode})}
 async start(orderId:string,accountId:string,language:'en'|'es',productName?:string){
  await this.adapter.verifyAccount();const order=await this.call('reserve',{orderId,accountId})
  const session=order.sessionId?await this.adapter.session(order.sessionId):await this.adapter.checkout(order,language,productName)
  if(session.client_reference_id!==orderId||session.metadata?.orderId!==orderId||session.metadata?.accountId!==accountId||session.livemode!==(this.config.mode==='live')||session.currency!=='usd'||session.amount_total!==Math.round(Number(order.amount)*100))throw Error('Stripe Session mismatch')
  await this.call('bind',{orderId,sessionId:session.id})
  if(typeof session.url!=='string'||new URL(session.url).origin!=='https://checkout.stripe.com')throw Error('Stripe Checkout unavailable')
  return session.url
 }
 async startEmbedded(orderId:string,accountId:string,language:'en'|'es',productName:string){
  await this.adapter.verifyAccount();const order=await this.call('reserve',{orderId,accountId})
  if(order.sessionId&&!/^cs_(test|live)_[A-Za-z0-9]+$/.test(order.sessionId))throw Error('Invalid existing Session')
  // Same Order idempotency key as hosted Checkout: incompatible simultaneous modes
  // fail at Stripe rather than creating a second Session for the same Order.
  const session=order.sessionId?await this.adapter.request('checkout/sessions/'+order.sessionId+'?expand[]=payment_intent',undefined,undefined,'2025-02-24.acacia'):await this.adapter.checkout(order,language,productName,true)
  if(!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session.id??'')||session.client_reference_id!==orderId||session.metadata?.orderId!==orderId||session.metadata?.accountId!==accountId||session.livemode!==(this.config.mode==='live')||session.currency!=='usd'||session.amount_total!==Math.round(Number(order.amount)*100)||session.ui_mode!=='embedded'||session.redirect_on_completion!=='never'||typeof session.client_secret!=='string'||!session.client_secret.startsWith(session.id+'_secret_'))throw Error('Embedded Stripe Session mismatch; recover the existing Order')
  await this.call('bind',{orderId,sessionId:session.id});return session.client_secret as string
 }
 async webhook(raw:string,signature:string|null){
  verifyStripeSignature(raw,signature,this.config.webhookSecret)
  const event=JSON.parse(raw)
  if(!/^evt_[A-Za-z0-9]+$/.test(event.id??'')||event.livemode!==(this.config.mode==='live')||(event.account&&event.account!==this.config.accountId))throw Error('Stripe event mismatch')
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return{state:'IGNORED'}
  await this.adapter.verifyAccount()
  const session=await this.adapter.session(event.data?.object?.id),orderId=session.metadata?.orderId
  if(!/^[a-f0-9-]{36}$/i.test(orderId??'')||session.client_reference_id!==orderId||session.livemode!==(this.config.mode==='live'))throw Error('Stripe Session mismatch')
  const order=await this.call('status',{orderId})
  if(session.metadata?.accountId!==order.accountId)throw Error('Stripe account association mismatch')
  if(!order.sessionId)await this.call('bind',{orderId,sessionId:session.id})
  else if(order.sessionId!==session.id)throw Error('Stripe binding mismatch')
  if(session.payment_status!=='paid'||session.status!=='complete')return{state:'PENDING'}
  const pi=session.payment_intent
  if(!pi||typeof pi!=='object'||pi.status!=='succeeded'||pi.livemode!==(this.config.mode==='live')||pi.currency!=='usd'||pi.amount_received!==session.amount_total||pi.metadata?.orderId!==orderId||session.currency!=='usd'||!Number.isSafeInteger(session.amount_total)||!Number.isSafeInteger(event.created))throw Error('Stripe paid evidence mismatch')
  const receipt=await this.call('receipt',{orderId,eventId:event.id,paymentIntent:pi.id,sessionId:session.id,paymentStatus:session.payment_status,status:session.status,currency:'USD',amount:(session.amount_total/100).toFixed(2),paidAt:new Date(event.created*1000).toISOString()})
  if(receipt.disposition!=='APPROVED')return{state:'RECEIVED_UNMATCHED'}
  return this.call('fulfill',{orderId})
 }
}
