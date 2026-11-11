'use server'
import {listingOverlayPurchasesEnabled} from '@/lib/lpi-purchase-release'
import {readMyCommercial} from './actions'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {stripeConfiguration} from '@/lib/providers/stripe'
import {StripeCommerce} from '@/lib/providers/stripe-commerce'
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export async function stripeReadiness(){try{stripeConfiguration();const db=await createServerSupabaseClient();const r=await db.rpc('stripe_commerce_ready');return !r.error&&r.data===true}catch{return false}}
export async function createStripeOrder(input:{request:string;kind:'package'|'addon';product:string;duration?:'day'|'month';bankUpgrade?:boolean;listing?:string;job?:string}){
 try{
  if(!await stripeReadiness())return{ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','kind','product','duration','bankUpgrade','listing','job'].includes(k))||!uuid.test(input.request)||typeof input.product!=='string'||input.product.length>150||!['package','addon'].includes(input.kind)||[input.listing,input.job].some(v=>v!==undefined&&!uuid.test(v)))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return{ok:false as const,reason:'authentication'}
  if((input.duration!==undefined&&!['day','month'].includes(input.duration))||(input.bankUpgrade!==undefined&&typeof input.bankUpgrade!=='boolean'))throw Error()
  if(input.kind==='package'&&(input.listing||input.job)||input.kind==='addon'&&(input.duration!==undefined||input.bankUpgrade!==undefined))throw Error()
  const r=input.kind==='package'?await db.rpc('create_stripe_package_order',{p_request:input.request,p_product:input.product,p_duration:input.duration??'month',p_bank:input.bankUpgrade??false}):await db.rpc('create_stripe_addon_order',{p_request:input.request,p_product:input.product,p_currency:'USD',p_listing:input.listing??null,p_job:input.job??null})
  if(r.error||!uuid.test(r.data?.id))return{ok:false as const,reason:'ineligible'}
  return{ok:true as const,id:r.data.id as string}
 }catch{return{ok:false as const,reason:'unavailable'}}
}
export async function startStripeCheckout(orderId:string,language:'en'|'es'){
 try{
  if(!uuid.test(orderId)||!['en','es'].includes(language))throw Error()
  const c=stripeConfiguration(),db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return{ok:false as const,reason:'authentication'}
  const detail=await readMyCommercial('orders',null,orderId);if(!detail.ok||!detail.items[0])throw Error();const row=detail.items[0];if(row.paid||row.fulfilled)return{ok:false as const,reason:'completed'};if(Date.parse(row.deadline)<=Date.now())return{ok:false as const,reason:'expired'};const name=(language==='es'?(row.nameES||row.nameEN):row.nameEN)||(row.product==='execution-credit-v1'?(language==='es'?'Tokens de ejecución adicionales':'Additional execution tokens'):'');if(!name)throw Error();
  return{ok:true as const,url:await new StripeCommerce(c).start(orderId,auth.data.user.id,language,name)}
 }catch(error){return{ok:false as const,reason:error instanceof Error&&error.message==='Order requires a new quote'?'expired':'unavailable'}}
}

export async function createStripeCreditOrder(request:string,quantity:number){
 try{if(!uuid.test(request)||![2,5,10,20,50].includes(quantity)||!await stripeReadiness())return{ok:false as const};const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return{ok:false as const};const r=await db.rpc('create_stripe_credit_order',{p_request:request,p_quantity:quantity});if(r.error||!uuid.test(r.data?.id))return{ok:false as const};return{ok:true as const,id:r.data.id as string}}catch{return{ok:false as const}}
}

export async function stripeCreditReadiness(){return stripeReadiness()}

export async function readStripeListingAvailability(listing:string){try{if(!uuid.test(listing)||!await stripeReadiness())return null;const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return null;const r=await db.rpc('read_stripe_listing_addon_acquisition',{p_listing:listing,p_currency:'USD'});if(r.error||!Array.isArray(r.data?.products))return null;return r.data as {products:{id:string;available:boolean;reason:string|null}[];order:string|null}}catch{return null}}

export async function stripeEmbeddedReadiness(){if(!listingOverlayPurchasesEnabled())return false;try{const c=stripeConfiguration(),key=process.env.STRIPE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY??'';return key.startsWith('pk_'+c.mode+'_')&&await stripeReadiness()}catch{return false}}
export async function startEmbeddedStripeCheckout(orderId:string,language:'en'|'es'){
 if(!listingOverlayPurchasesEnabled())return{ok:false as const,reason:'embedded_checkout_unavailable' as const}
 try{if(!uuid.test(orderId)||!['en','es'].includes(language)||!await stripeEmbeddedReadiness())throw Error();const c=stripeConfiguration(),db=await createServerSupabaseClient(),a=await db.auth.getUser();if(a.error||!a.data.user?.email_confirmed_at)throw Error();const detail=await readMyCommercial('orders',null,orderId),row=detail.ok?detail.items[0]:null;if(!row||row.kind!=='package'||row.currency!=='USD'||row.paid)throw Error();const name=(language==='es'?row.nameES:row.nameEN)||row.product;return{ok:true as const,clientSecret:await new StripeCommerce(c).startEmbedded(orderId,a.data.user.id,language,name),publishableKey:process.env.STRIPE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}}
 catch{return{ok:false as const,reason:'embedded_checkout_unavailable' as const}}
}
