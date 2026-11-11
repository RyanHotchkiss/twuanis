'use server'
import {directSinpeReadiness} from '@/lib/direct-sinpe-readiness'
import type {PaymentQuote} from '@/lib/package-payment-price'
import {commercialQuoteCurrencyMatches} from '@/lib/commercial-price-consistency'
import {packageDisplayLabel,commercialDisplayNames} from '@/lib/package-display'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {convertUsdToCrc,convertCrcToUsd} from '@/lib/currency-conversion'
import {resolveMarketAnalyticalContext} from '@/lib/market-analytical-context'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {onvoAutomationEnabled,onvoConfiguration} from '@/lib/providers/onvo-automation'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function onvoReadiness(){try{onvoConfiguration();return onvoAutomationEnabled()&&uuid.test(process.env.ONVO_RECEIVING_ACCOUNT_ID??'')&&!!process.env.ONVO_WORKER_SECRET&&process.env.ONVO_WORKER_SECRET.length>=32&&(onvoConfiguration().evidenceMode==='standard-intent'||Number.isFinite(Date.parse(process.env.ONVO_RECONCILIATION_START??'')))}catch{return false}}
const enabled=()=>process.env.TWUANIS_SINPE_PAYMENTS==='canonical'&&process.env.TWUANIS_PACKAGE_ENFORCEMENT==='canonical'
export async function commercialCatalog(kind:'package'|'addon',currency:'USD'|'CRC',after:string|null=null,listing?:string){
 try{
  if(!['package','addon'].includes(kind)||!['USD','CRC'].includes(currency)||(after!==null&&after.length>150))throw Error()
  const c=await supabaseAdmin.rpc(kind==='package'?'read_customer_package_catalog':'read_addon_catalog',{p_after:after})
  if(c.error||!Array.isArray(c.data)||c.data.length>26)throw Error()
  const rows=c.data.slice(0,25)
  const customer=await createServerSupabaseClient(),session=await customer.auth.getUser();const pricingDB=session.data.user?customer:supabaseAdmin;let priceReader=session.data.user?'read_customer_commercial_prices':'read_offer_prices';let pricingContractReady=true
  let p=rows.length?await pricingDB.rpc(priceReader,{p_kind:kind,p_products:rows.map(x=>x.id),p_currency:currency}):{data:[],error:null}
  // Preserve the installed catalog reader when the prepared account-pricing contract is absent.
  // Display fallback must never authorize a purchase without account-specific price protection.
  if(p.error?.code==='PGRST202'&&priceReader==='read_customer_commercial_prices'&&p.error.message.includes('read_customer_commercial_prices')){pricingContractReady=false;priceReader='read_offer_prices';p=await supabaseAdmin.rpc(priceReader,{p_kind:kind,p_products:rows.map(x=>x.id),p_currency:currency})}
  if(p.error||!Array.isArray(p.data)||p.data.length!==rows.length||new Set(p.data.map((v:{productId:string})=>v.productId)).size!==rows.length||rows.some(x=>!p.data.some((v:{productId:string})=>v.productId===x.id)))throw Error()
  const secondary=rows.length?await pricingDB.rpc(priceReader,{p_kind:kind,p_products:rows.map(x=>x.id),p_currency:currency==='USD'?'CRC':'USD'}):{data:[],error:null}
  if(secondary.error||!Array.isArray(secondary.data)||secondary.data.length!==rows.length)throw Error()
  const crcQuotes=currency==='CRC'?p.data:secondary.data;const usdQuotes=currency==='USD'?p.data:secondary.data;if(crcQuotes.some((quote:any)=>quote.fx)){const {fx}=await resolveMarketAnalyticalContext();for(const quote of crcQuotes){const usd=usdQuotes.find((u:any)=>u.productId===quote.productId);if(quote.fx&&Number(quote.fx.rate)!==fx.rate)throw Error();for(const key of ['standardPrice','effectivePrice']as const){if(quote[key]!=null&&usd?.[key]!=null&&!commercialQuoteCurrencyMatches(kind,quote.productId,key,quote,usd,fx.rate))throw Error()}}}
  const daily=kind==='package'&&rows.length?await supabaseAdmin.rpc('read_package_daily_prices',{p_products:rows.map(x=>x.id),p_currency:currency}):{data:[],error:null}
  if(daily.error||!Array.isArray(daily.data)||daily.data.length>25)throw Error()
  const secondaryDaily=kind==='package'&&rows.length?await supabaseAdmin.rpc('read_package_daily_prices',{p_products:rows.map(x=>x.id),p_currency:currency==='USD'?'CRC':'USD'}):{data:[],error:null}
  if(secondaryDaily.error||!Array.isArray(secondaryDaily.data))throw Error()
  const paymentPrices=kind==='package'&&rows.length?await pricingDB.rpc('read_package_payment_quotes',{p_products:rows.map(x=>x.id)}):{data:[],error:null}
  const canonicalPaymentPrices:PaymentQuote[]|null=!paymentPrices.error&&Array.isArray(paymentPrices.data)&&paymentPrices.data.length<=8?paymentPrices.data:null
  const readiness=await supabaseAdmin.rpc('customer_commerce_ready')
  if(readiness.error)throw Error()
  let availability:{products:{id:string;available:boolean;reason:string|null}[];order:string|null}|null=null
  if(listing){
   if(!uuid.test(listing)||kind!=='addon')throw Error()
   const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)throw Error()
   const a=await db.rpc('read_listing_addon_acquisition',{p_listing:listing,p_currency:'CRC'});if(a.error||!Array.isArray(a.data?.products)||a.data.products.length>26)throw Error();availability=a.data
  }
  return {ok:true as const,enabled:(kind==='package'?await directSinpeReadiness():await onvoReadiness())&&readiness.data===true&&pricingContractReady,availability,next:c.data.length>25?rows[24].id:null,products:rows.map(x=>({id:x.id,nameEN:packageDisplayLabel(x.name_en),nameES:packageDisplayLabel(x.name_es),...(kind==='addon'?{descriptionEN:x.description_en,descriptionES:x.description_es,behavior:x.behavior,target:x.target,placementMarket:x.placementMarket}:{}),questionEN:x.question_en,questionES:x.question_es,secondaryDailyPrice:secondaryDaily.data.find((v:{productId:string})=>v.productId===x.id)?.amount??null,dailyPrice:daily.data.find((v:{productId:string})=>v.productId===x.id)?.amount??null,termQuantity:x.termQuantity,termUnit:x.termUnit,durationDays:x.durationDays,termKind:x.termKind,marketPopulations:x.marketPopulations??x.populations??null,allCapabilities:x.capabilityLabels??[],capabilities:x.additionalCapabilityLabels??x.capabilityLabels??[],secondaryPricing:secondary.data.find((v:{productId:string})=>v.productId===x.id),paymentPricing:kind==='package'?(canonicalPaymentPrices?.filter(q=>q.product===x.id)??null):null,pricing:p.data.find((v:{productId:string})=>v.productId===x.id)}))}
 }catch{return {ok:false as const}}
}
export async function readMyCommercial(area:string,after:string|null=null,id:string|null=null,listing:string|null=null,history=false){
 try{
  if(!['orders','rights','payments','listings','legacy'].includes(area)||[after,id,listing].some(x=>x!==null&&!uuid.test(x))||typeof history!=='boolean')throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const,reason:'authentication'}
  const r=area==='payments'?await db.rpc('read_customer_payment_activity',{p_after:after,p_id:id,p_listing:listing}):await db.rpc('read_customer_commercial',{p_area:area,p_after:after,p_id:id,p_listing:listing,p_history:history})
  if(r.error||!Array.isArray(r.data)||r.data.length>26)throw Error()
  return {ok:true as const,items:r.data.slice(0,25).map(commercialDisplayNames),next:r.data.length>25?r.data[24].id:null}
 }catch{return {ok:false as const,reason:'unavailable'}}
}
export async function purchaseCommercial(input:{request:string;kind:'package'|'addon';product:string;currency:'USD'|'CRC';listing?:string;job?:string;duration?:'day'|'month';bankUpgrade?:boolean}){
 try{
  if(!(input?.kind==='package'?await directSinpeReadiness():await onvoReadiness()))return {ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','kind','product','currency','listing','job','duration','bankUpgrade'].includes(k))||!uuid.test(input.request)||!['package','addon'].includes(input.kind)||typeof input.product!=='string'||input.product.length>150||!['USD','CRC'].includes(input.currency)||(input.listing!==undefined&&!uuid.test(input.listing))||(input.job!==undefined&&!uuid.test(input.job)))throw Error()
  if((input.bankUpgrade!==undefined&&typeof input.bankUpgrade!=='boolean')||(input.kind!=='package'&&input.bankUpgrade!==undefined)||(input.bankUpgrade===true&&input.duration==='day'))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const,reason:'authentication'}
  if((input.kind==='package'&&(input.listing!==undefined||input.job!==undefined))||(input.kind==='addon'&&input.duration!==undefined))throw Error()
  if((input.kind==='package'||process.env.TWUANIS_ONVO_AUTOMATION==='canonical')&&input.currency!=='CRC')return {ok:false as const,reason:'unsupported_currency'}
  if(input.kind==='package'&&(!auth.data.user.email_confirmed_at||!['day','month'].includes(input.duration??'month')))throw Error()
  const r=input.kind==='package'?await db.rpc('create_customer_package_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_duration:input.duration??'month',...(input.bankUpgrade===undefined?{}:{p_bank_upgrade:input.bankUpgrade})}):await db.rpc('create_customer_addon_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_listing:input.listing??null,p_job:input.job??null})
  if(r.error||!uuid.test(r.data?.id))return {ok:false as const,reason:'ineligible'}
  return {ok:true as const,id:r.data.id as string}
 }catch{return {ok:false as const,reason:'unavailable'}}
}

export async function customerCommerceMode(){const mode=process.env.TWUANIS_PACKAGE_ENFORCEMENT;if(mode===undefined||mode==='legacy')return false;if(mode==='canonical')return true;throw new Error('Invalid commercial mode')}

// Prepared token sales remain unavailable in live mode until separate ONVO acceptance.
async function executionCreditPurchaseReady(){return onvoReadiness()}
export async function executionCreditCatalog(currency:'USD'|'CRC'){
 try{
  if(!['USD','CRC'].includes(currency))throw Error()
  const r=await supabaseAdmin.rpc('read_execution_credit_catalog',{p_currency:currency})
  if(r.error||!Array.isArray(r.data)||r.data.length!==5||r.data.some((x:any,i:number)=>!x||x.productId!=='execution-credit-v1'||x.quantity!==[2,5,10,20,50][i]||x.currency!==currency||!Number.isFinite(Number(x.unitPrice))||Number(x.unitPrice)<=0||typeof x.total!=='string'||!x.priceVersionId))throw Error()
  const counterpart=await supabaseAdmin.rpc('read_execution_credit_catalog',{p_currency:currency==='USD'?'CRC':'USD'});if(counterpart.error||!Array.isArray(counterpart.data)||counterpart.data.length!==5)throw Error();const {fx}=await resolveMarketAnalyticalContext();for(const row of [...r.data,...counterpart.data]){const expected=row.currency==='USD'?1:Math.round(convertUsdToCrc(1,fx.rate));if(Number(row.unitPrice)!==expected||Number(row.total)!==expected*row.quantity)throw Error()}
  const ready=await supabaseAdmin.rpc('execution_credit_commerce_ready')
  return {ok:true as const,enabled:await executionCreditPurchaseReady()&&ready.data===true&&currency==='CRC',prices:r.data.map((row:any)=>({...row,currencyQuotes:{[currency]:row.total,[currency==='USD'?'CRC':'USD']:counterpart.data.find((x:any)=>x.quantity===row.quantity)?.total}})) as {currencyQuotes:Record<'USD'|'CRC',string>;productId:string;quantity:number;unitPrice:string;total:string;currency:'USD'|'CRC';priceVersionId:string}[]}
 }catch{return {ok:false as const}}
}
export async function purchaseExecutionCredits(input:{request:string;product:string;quantity:number;currency:'USD'|'CRC'}){
 try{
  if(!await executionCreditPurchaseReady())return {ok:false as const,reason:'inactive'}
  if(!input||Object.keys(input).some(k=>!['request','product','quantity','currency'].includes(k))||!uuid.test(input.request)||input.product!=='execution-credit-v1'||!Number.isSafeInteger(input.quantity)||![2,5,10,20,50].includes(input.quantity)||input.currency!=='CRC')throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return {ok:false as const,reason:'authentication'}
  const r=await db.rpc('create_execution_credit_order',{p_request:input.request,p_product:input.product,p_currency:input.currency,p_quantity:input.quantity})
  if(r.error||!uuid.test(r.data?.id))throw Error()
  return {ok:true as const,id:r.data.id as string}
 }catch{return {ok:false as const,reason:'unavailable'}}
}

export async function readActiveListingAddonCount(){
 const seen=new Set<string>();let after:string|null=null,count=0
 try{do{const page=await readMyCommercial('rights',after,null,null,false);if(!page.ok)return {ok:false as const};for(const term of page.items){if(term.class==='LISTING_ADDON'&&term.listing&&term.state==='ACTIVE'&&!seen.has(term.id)){seen.add(term.id);count++}}if(page.next===after&&page.next!==null)throw Error();after=page.next}while(after);return {ok:true as const,count}}catch{return {ok:false as const}}
}
