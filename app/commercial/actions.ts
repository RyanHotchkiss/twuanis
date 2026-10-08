'use server'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
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
export async function purchaseCommercial(input:{request:string;kind:'package'|'addon';product:string;currency:'USD'|'CRC';listing?:string;duration?:'day'|'month'}){
 try{
  if(!enabled())return {ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','kind','product','currency','listing','duration'].includes(k))||!uuid.test(input.request)||!['package','addon'].includes(input.kind)||typeof input.product!=='string'||input.product.length>150||!['USD','CRC'].includes(input.currency)||(input.listing!==undefined&&!uuid.test(input.listing)))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const,reason:'authentication'}
  if((input.kind==='package'&&input.listing!==undefined)||(input.kind==='addon'&&input.duration!==undefined))throw Error()
  if(input.kind==='package'&&process.env.TWUANIS_ONVO_AUTOMATION==='canonical'&&input.currency!=='CRC')return {ok:false as const,reason:'unsupported_currency'}
  if(input.kind==='package'&&(!auth.data.user.email_confirmed_at||!['day','month'].includes(input.duration??'month')))throw Error()
  const r=input.kind==='package'?await db.rpc('create_customer_package_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_duration:input.duration??'month'}):await db.rpc('create_customer_order',{p_request:input.request,p_kind:input.kind,p_product:input.product,p_currency:input.currency,p_listing:input.listing??null})
  if(r.error||!uuid.test(r.data?.id))return {ok:false as const,reason:'ineligible'}
  return {ok:true as const,id:r.data.id as string}
 }catch{return {ok:false as const,reason:'unavailable'}}
}

export async function customerCommerceMode(){const mode=process.env.TWUANIS_PACKAGE_ENFORCEMENT;if(mode===undefined||mode==='legacy')return false;if(mode==='canonical')return true;throw new Error('Invalid commercial mode')}
