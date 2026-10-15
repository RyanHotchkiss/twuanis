'use server'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {onvoAutomationEnabled,onvoConfiguration} from '@/lib/providers/onvo-automation'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const enabled=()=>process.env.TWUANIS_SINPE_PAYMENTS==='canonical'&&process.env.TWUANIS_PACKAGE_ENFORCEMENT==='canonical'
export async function commercialCatalog(kind:'package'|'addon',currency:'USD'|'CRC',after:string|null=null,listing?:string){
 try{
  if(!['package','addon'].includes(kind)||!['USD','CRC'].includes(currency)||(after!==null&&after.length>150))throw Error()
  const c=await supabaseAdmin.rpc(kind==='package'?'read_customer_package_catalog':'read_addon_catalog',{p_after:after})
  if(c.error||!Array.isArray(c.data)||c.data.length>26)throw Error()
  const rows=c.data.slice(0,25)
  const p=rows.length?await supabaseAdmin.rpc('read_offer_prices',{p_kind:kind,p_products:rows.map(x=>x.id),p_currency:currency}):{data:[],error:null}
  if(p.error||!Array.isArray(p.data)||p.data.length!==rows.length||new Set(p.data.map((v:{productId:string})=>v.productId)).size!==rows.length||rows.some(x=>!p.data.some((v:{productId:string})=>v.productId===x.id)))throw Error()
  const daily=kind==='package'&&rows.length?await supabaseAdmin.rpc('read_package_daily_prices',{p_products:rows.map(x=>x.id),p_currency:currency}):{data:[],error:null}
  if(daily.error||!Array.isArray(daily.data)||daily.data.length>25)throw Error()
  const readiness=await supabaseAdmin.rpc('customer_commerce_ready')
  if(readiness.error)throw Error()
  let availability:{products:{id:string;available:boolean;reason:string|null}[];order:string|null}|null=null
  if(listing){
   if(!uuid.test(listing)||kind!=='addon')throw Error()
   const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)throw Error()
   const a=await db.rpc('read_listing_addon_acquisition',{p_listing:listing,p_currency:currency});if(a.error||!Array.isArray(a.data?.products)||a.data.products.length>26)throw Error();availability=a.data
  }
  return {ok:true as const,enabled:enabled()&&readiness.data===true,availability,next:c.data.length>25?rows[24].id:null,products:rows.map(x=>({id:x.id,nameEN:x.name_en,nameES:x.name_es,questionEN:x.question_en,questionES:x.question_es,dailyPrice:daily.data.find((v:{productId:string})=>v.productId===x.id)?.amount??null,termQuantity:x.termQuantity,termUnit:x.termUnit,durationDays:x.durationDays,termKind:x.termKind,capabilities:x.additionalCapabilityLabels??x.capabilityLabels??[],pricing:p.data.find((v:{productId:string})=>v.productId===x.id)}))}
 }catch{return {ok:false as const}}
}
export async function readMyCommercial(area:string,after:string|null=null,id:string|null=null,listing:string|null=null,history=false){
 try{
  if(!['orders','rights','payments','listings','legacy'].includes(area)||[after,id,listing].some(x=>x!==null&&!uuid.test(x))||typeof history!=='boolean')throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const,reason:'authentication'}
  const r=await db.rpc('read_customer_commercial',{p_area:area,p_after:after,p_id:id,p_listing:listing,p_history:history})
  if(r.error||!Array.isArray(r.data)||r.data.length>26)throw Error()
  return {ok:true as const,items:r.data.slice(0,25),next:r.data.length>25?r.data[24].id:null}
 }catch{return {ok:false as const,reason:'unavailable'}}
}
export async function purchaseCommercial(input:{request:string;kind:'package'|'addon';product:string;currency:'USD'|'CRC';listing?:string;duration?:'day'|'month';bankUpgrade?:boolean}){
 try{
  if(!enabled())return {ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','kind','product','currency','listing','duration','bankUpgrade'].includes(k))||!uuid.test(input.request)||!['package','addon'].includes(input.kind)||typeof input.product!=='string'||input.product.length>150||!['USD','CRC'].includes(input.currency)||(input.listing!==undefined&&!uuid.test(input.listing)))throw Error()
  if((input.bankUpgrade!==undefined&&typeof input.bankUpgrade!=='boolean')||(input.kind!=='package'&&input.bankUpgrade!==undefined)||(input.bankUpgrade===true&&input.duration==='day'))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const,reason:'authentication'}
  if((input.kind==='package'&&input.listing!==undefined)||(input.kind==='addon'&&input.duration!==undefined))throw Error()
  if(input.kind==='package'&&process.env.TWUANIS_ONVO_AUTOMATION==='canonical'&&input.currency!=='CRC')return {ok:false as const,reason:'unsupported_currency'}
  if(input.kind==='package'&&(!auth.data.user.email_confirmed_at||!['day','month'].includes(input.duration??'month')))throw Error()
  const r=input.kind==='package'?await db.rpc('create_customer_package_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_duration:input.duration??'month',...(input.bankUpgrade===undefined?{}:{p_bank_upgrade:input.bankUpgrade})}):await db.rpc('create_customer_order',{p_request:input.request,p_kind:input.kind,p_product:input.product,p_currency:input.currency,p_listing:input.listing??null})
  if(r.error||!uuid.test(r.data?.id))return {ok:false as const,reason:'ineligible'}
  return {ok:true as const,id:r.data.id as string}
 }catch{return {ok:false as const,reason:'unavailable'}}
}

export async function customerCommerceMode(){const mode=process.env.TWUANIS_PACKAGE_ENFORCEMENT;if(mode===undefined||mode==='legacy')return false;if(mode==='canonical')return true;throw new Error('Invalid commercial mode')}

// Prepared token sales remain unavailable in live mode until separate ONVO acceptance.
function executionCreditPurchaseReady(){try{return enabled()&&onvoAutomationEnabled()&&onvoConfiguration().mode==='test'}catch{return false}}
export async function executionCreditCatalog(currency:'USD'|'CRC'){
 try{
  if(!['USD','CRC'].includes(currency))throw Error()
  const r=await supabaseAdmin.rpc('read_execution_credit_catalog',{p_currency:currency})
  if(r.error||!Array.isArray(r.data)||r.data.length!==5||r.data.some((x:any,i:number)=>!x||x.productId!=='execution-credit-v1'||x.quantity!==[2,5,10,20,50][i]||x.currency!==currency||x.unitPrice!==(currency==='USD'?'1':'500')||typeof x.total!=='string'||!x.priceVersionId))throw Error()
  const ready=await supabaseAdmin.rpc('execution_credit_commerce_ready')
  return {ok:true as const,enabled:executionCreditPurchaseReady()&&ready.data===true&&currency==='CRC',prices:r.data as {productId:string;quantity:number;unitPrice:string;total:string;currency:'USD'|'CRC';priceVersionId:string}[]}
 }catch{return {ok:false as const}}
}
export async function purchaseExecutionCredits(input:{request:string;product:string;quantity:number;currency:'USD'|'CRC'}){
 try{
  if(!executionCreditPurchaseReady())return {ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','product','quantity','currency'].includes(k))||!uuid.test(input.request)||input.product!=='execution-credit-v1'||!Number.isSafeInteger(input.quantity)||![2,5,10,20,50].includes(input.quantity)||input.currency!=='CRC')throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return {ok:false as const,reason:'authentication'}
  const r=await db.rpc('create_execution_credit_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_quantity:input.quantity})
  if(r.error||!uuid.test(r.data?.id))throw Error()
  return {ok:true as const,id:r.data.id as string}
 }catch{return {ok:false as const,reason:'unavailable'}}
}
