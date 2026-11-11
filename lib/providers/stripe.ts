import 'server-only'
import {createHmac,timingSafeEqual} from 'node:crypto'
export type StripeConfiguration={accountId:string;mode:'test'|'live';secretKey:string;webhookSecret:string;origin:string}
export function stripeConfiguration():StripeConfiguration{
 const mode=process.env.STRIPE_MODE,origin=process.env.TWUANIS_APP_ORIGIN??''
 if(process.env.TWUANIS_STRIPE_PAYMENTS!=='canonical'||!['test','live'].includes(mode??''))throw Error('Stripe unavailable')
 const c={accountId:process.env.STRIPE_ACCOUNT_ID??'',mode:mode as 'test'|'live',secretKey:process.env.STRIPE_SECRET_KEY??'',webhookSecret:process.env.STRIPE_WEBHOOK_SECRET??'',origin}
 if(!/^acct_[A-Za-z0-9]+$/.test(c.accountId)||!c.secretKey.startsWith(`sk_${mode}_`)||!c.webhookSecret.startsWith('whsec_')||!origin||!['http:','https:'].includes(new URL(origin).protocol)||(mode==='live'&&new URL(origin).protocol!=='https:'))throw Error('Stripe unavailable')
 return c
}
export function verifyStripeSignature(raw:string,header:string|null,secret:string,now=Date.now()){
 if(!header||header.length>4096)throw Error('Invalid Stripe signature')
 const parts=header.split(',').map(v=>v.split('=')),times=parts.filter(v=>v[0]==='t');if(times.length!==1||!/^\d+$/.test(times[0][1]))throw Error('Invalid Stripe signature')
 const time=times[0][1];if(Math.abs(now/1000-Number(time))>300)throw Error('Expired Stripe signature')
 const expected=createHmac('sha256',secret).update(time+'.'+raw).digest();if(!parts.some(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/.test(v)&&timingSafeEqual(Buffer.from(v,'hex'),expected)))throw Error('Invalid Stripe signature')
}
export class StripeAdapter{
 constructor(readonly config:StripeConfiguration,readonly transport:typeof fetch=fetch){}
 async request(path:string,body?:URLSearchParams,key?:string,apiVersion?:string):Promise<any>{
  const response=await this.transport('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+this.config.secretKey,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(key?{'Idempotency-Key':key}:{}),...(apiVersion?{'Stripe-Version':apiVersion}:{})},body,cache:'no-store',signal:AbortSignal.timeout(15000)})
  if(!response.ok)throw Error('Stripe request unavailable');return response.json()
 }
 async verifyAccount(){const a=await this.request('account');if(a.id!==this.config.accountId||a.charges_enabled!==true)throw Error('Stripe account unavailable')}
 async checkout(order:{orderId:string;accountId:string;productId:string;amount:string;deadline:string},language:'en'|'es',productName:string=order.productId,embedded=false){
  if(!productName.trim()||productName.length>300)throw Error('Canonical product name required')
  const cents=Math.round(Number(order.amount)*100);if(!Number.isSafeInteger(cents)||cents<200||Math.abs(cents/100-Number(order.amount))>0.000001)throw Error('Minimum Stripe purchase is USD 2')
  const remaining=Date.parse(order.deadline)-Date.now();if(remaining<30*60*1000)throw Error('Order requires a new quote')
  const base=this.config.origin+'/commercial/'+order.orderId+'?lang='+language
  const b=new URLSearchParams({mode:'payment','adaptive_pricing[enabled]':'false',locale:language,client_reference_id:order.orderId,'metadata[orderId]':order.orderId,'metadata[accountId]':order.accountId,'payment_intent_data[metadata][orderId]':order.orderId,'line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(cents),'line_items[0][price_data][product_data][name]':productName,'line_items[0][quantity]':'1',success_url:base+'&stripe=return',cancel_url:base+'&stripe=canceled',expires_at:String(Math.floor(Date.parse(order.deadline)/1000)),'payment_method_types[0]':'card'})
  if(embedded){b.delete('success_url');b.delete('cancel_url');b.set('ui_mode','embedded');b.set('redirect_on_completion','never')}
  return this.request('checkout/sessions',b,'twuanis:stripe:'+this.config.mode+':'+order.orderId,embedded?'2025-02-24.acacia':undefined)
 }
 async session(id:string){if(!/^cs_[A-Za-z0-9_]+$/.test(id))throw Error('Invalid Session');return this.request('checkout/sessions/'+id+'?expand[]=payment_intent')}
}
export async function boundedStripeBody(request:Request){const r=request.body?.getReader();if(!r)throw Error();let n=0;const chunks:Uint8Array[]=[];try{for(;;){const p=await r.read();if(p.done)break;n+=p.value.length;if(n>262144){await r.cancel();throw Error()}chunks.push(p.value)}}finally{r.releaseLock()}return Buffer.concat(chunks).toString('utf8')}
