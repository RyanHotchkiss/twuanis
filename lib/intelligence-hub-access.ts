'use server'
import {unstable_cache} from 'next/cache'
import {POPULATION_ENGINES} from './population-engine-registry'
import {canonicalPackageEnforcement,authorizePreviouslyPublicCapability,authorizePopulationCapability} from './package-capability-authorization'
import {authorizePriceMeterIntelligenceExecution} from './price-meter-authorization'
import {createServerSupabaseClient} from './supabase-server'
import {supabaseAdmin} from './supabase-admin'
import {HUB_PACKAGE_NUMBERS,lowestHubPackages,type HubPackageAccess,type HubPopulation} from './intelligence-hub-access-contract'
const readMembership=unstable_cache(async()=>{
 const {data,error}=await supabaseAdmin.rpc('read_customer_package_catalog',{p_after:null})
 if(error||!Array.isArray(data)||data.length!==3||data.some(p=>!Array.isArray(p.capabilities)||p.capabilities.some((c:unknown)=>typeof c!=='string')))throw Error('Canonical Package membership unavailable')
 return {packages:lowestHubPackages(data,POPULATION_ENGINES),products:data}
},['intelligence-hub-package-membership-v2'],{revalidate:60})
export async function readHubPackageAccess(engine:string,population:HubPopulation='PRIVATE'):Promise<HubPackageAccess>{
 if(typeof engine!=='string'||engine.length>80||!['PRIVATE','BANK'].includes(population))throw Error('Invalid Hub access request')
 const now=Date.now(),out:HubPackageAccess={engine,population,accountId:null,allowed:false,state:'unavailable',checkedAt:now,recheckAt:now+30000,packages:{}}
 const entry=POPULATION_ENGINES.find(e=>e[0]===engine||e[1]===engine)
 if(!entry||!['PRIVATE','BANK'].includes(population))return out
 try{
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();out.accountId=auth.data.user?.id??null
  if(!auth.error&&out.accountId){const owner=await db.rpc('is_current_user_owner');if(!owner.error&&owner.data===true){out.allowed=true;out.state='authorized';return out}}
  const catalog=await readMembership();out.packages=catalog.packages
  if(auth.error&&!out.accountId){out.state='signed_out'}
  const capability=entry[3]
  try{
   if(population!=='PRIVATE'){
    await authorizePopulationCapability(capability,'BANK')
   }else if(entry[5]==='inventory'||entry[5]==='asking_price')await authorizePreviouslyPublicCapability(capability)
   else await authorizePriceMeterIntelligenceExecution(capability)
   out.allowed=true;out.state=!canonicalPackageEnforcement()&&(entry[5]==='inventory'||entry[5]==='asking_price')?'public':'authorized'
  }catch{
   out.state=out.accountId?'locked':'signed_out'
   const entryNumber=out.packages[engine],dailyNumber=entryNumber===3?3:2
   const base=catalog.products.find(p=>HUB_PACKAGE_NUMBERS[p.id]===entryNumber),daily=catalog.products.find(p=>HUB_PACKAGE_NUMBERS[p.id]===dailyNumber)
   if(base&&daily){
    out.offer={entryNumber,entryEN:base.name_en,entryES:base.name_es,dailyNumber,dailyEN:daily.name_en,dailyES:daily.name_es,USD:null,CRC:null}
    if(population==='PRIVATE'){
     const monthly=entryNumber===1,product=monthly?base:daily
     const quotes=await Promise.all((['USD','CRC'] as const).map(async currency=>{
      const reader=monthly?(out.accountId?'read_customer_commercial_prices':'read_offer_prices'):'read_package_daily_prices'
      const pricingDB=monthly&&out.accountId?db:supabaseAdmin
      const r=await pricingDB.rpc(reader,{...(monthly?{p_kind:'package'}:{}),p_products:[product.id],p_currency:currency})
      const quote=!r.error&&Array.isArray(r.data)&&r.data.length===1&&r.data[0].productId===product.id&&r.data[0].currency===currency?r.data[0]:null
      const amount=quote&&(monthly?quote.available===true:quote.unit==='day'&&Number(quote.quantity)===1)?Number(monthly?quote.effectivePrice:quote.amount):NaN
      return {currency,amount:Number.isFinite(amount)&&amount>0?amount:null,standard:monthly&&quote?Number(quote.standardPrice):null,source:monthly?quote?.source:null,offerEnd:monthly?quote?.offerEnd:null}
     }))
     for(const quote of quotes)out.offer[quote.currency]=quote.amount
     if(monthly){
      out.offer.term='month'
      out.offer.standardUSD=quotes[0].standard;out.offer.standardCRC=quotes[1].standard
      if(quotes[0].source===quotes[1].source&&quotes[0].offerEnd===quotes[1].offerEnd){out.offer.priceSource=quotes[0].source;out.offer.offerEnd=quotes[0].offerEnd}
      else {out.offer.USD=null;out.offer.CRC=null}
     }else out.offer.term='day' 
    }
   }
   return out
  }
  // Deadlines trigger revalidation only; this projection never grants execution.
  if(out.accountId){const [rights,legacy]=await Promise.all([db.rpc('read_customer_commercial',{p_area:'rights',p_after:null,p_id:null,p_listing:null,p_history:false}),db.rpc('read_customer_commercial',{p_area:'legacy',p_after:null,p_id:null,p_listing:null,p_history:false})]);const ends=[...(Array.isArray(rights.data)?rights.data:[]),...(Array.isArray(legacy.data)?legacy.data:[])].map(t=>Date.parse(t.endsAt)).filter(t=>Number.isFinite(t)&&t>now);if(ends.length){out.expiresAt=Math.min(...ends);out.recheckAt=Math.min(out.recheckAt,out.expiresAt)}}
  return out
 }catch{return out}
}
