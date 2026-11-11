import {createClient} from '@/lib/staging-supabase-client'
import {invalidatePublicListingRepresentations} from '@/lib/semantic-invalidation'
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { customerEditDomains } from '@/lib/canonical-customer-edit'
import { resolveUserPackageUsage } from '@/lib/package-usage'


// Reuse authenticated account authority; delivery never accepts a recipient from the browser.
export async function publicationAccount(request:Request){
 const accessToken=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
 if(!accessToken)return null
 const customer=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:`Bearer ${accessToken}`}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error}=await customer.auth.getUser(accessToken)
 return error||!user?.email||!user.email_confirmed_at?null:{customer,user}
}
export function assertPublicationToken(row:{created_at:string;verified?:boolean;published_at?:string|null;listing_data:Record<string,any>},ownerId:string,canonicalOperation=false){
 const binding=row.listing_data?.publication_delivery
 if(binding&&binding.account_id!==ownerId)throw Error('This publishing session belongs to another account.')
 // Preserve the existing 24-hour abandoned-session lifetime; completed operations remain idempotent.
 if(!canonicalOperation&&!row.verified&&!row.published_at&&(!Number.isFinite(Date.parse(row.created_at))||Date.now()-Date.parse(row.created_at)>=24*60*60*1000))throw Error('This publishing session has expired.')
}

export async function tokenCreationInput(db: SupabaseClient, data: Record<string, any>, phone: string) {
  if (!['sale','rent'].includes(data.transaction_type)) throw new Error('Explicit sale or rent required.')
  const changes: Record<string,unknown> = { province:data.province,canton:data.canton,district:data.district??null,whatsapp:phone }
  for (const key of ['property_type','utility','environment','terrain','accessibility','legal_status','bedrooms','bathrooms','parking','year_built_range','distance_to_paved_road_range','title','description']) {
    if (data[key]!==undefined&&data[key]!==null&&data[key]!=='') changes[key]=data[key]
  }
  for(const key of ['property_area','construction_area']) if(data[key]!==undefined&&data[key]!==null&&data[key]!=='') changes[key]={kind:'set',value:String(data[key])}
  changes.currency=data.currency
  if(data.transaction_type==='sale') {
    // This NEW customer form explicitly displays CRC millions; never read legacy listing evidence.
    const millions=String(data.priceMillions)
    if(data.currency!=='CRC'||!/^\d+(\.\d{1,6})?$/.test(millions)) throw new Error('Explicit CRC-million customer price required.')
    const [whole,fraction='']=millions.split('.')
    changes.current_price=(BigInt(whole)*BigInt('1000000')+BigInt(fraction.padEnd(6,'0'))).toString()
  } else changes.monthly_price=String(data.monthly_price)
  // Reuse the approved equivalents for retained form labels; never edit the token snapshot.
  const utilityNames: Record<string,string> = {
    'Municipal / ASADA Water': 'Municipal Water',
    'Grid Electricity': 'Electricity',
    'Septic System': 'Septic',
  }
  if (Array.isArray(changes.utility)) {
    changes.utility = changes.utility.map(value => typeof value === 'string' ? utilityNames[value] ?? value : value)
  }
  if (changes.accessibility === 'Paved Road to Property') changes.accessibility = 'Paved Road'
  const {domains,content}=await customerEditDomains(db,changes,{transaction_type:data.transaction_type})
  return {transaction:data.transaction_type,...domains,content}
}

export async function completeTokenCreation(admin:SupabaseClient,customer:SupabaseClient,ownerId:string,token:string,prepareOnly=false) {
  const {data:session,error:sessionError}=await admin.from('listing_publish_tokens').select('created_at,verified,published_at,listing_data').eq('token',token).single()
  if(sessionError||!session)throw Error('Publishing token could not be confirmed.')
  const {data:prior,error:priorError}=await admin.rpc('get_token_canonical_operation',{p_token:token,p_owner:ownerId})
  if(priorError)throw new Error(priorError.message)
  assertPublicationToken(session,ownerId,!!prior)
  let plan=prior
  if(!plan) {
    const {data:row,error}=await admin.from('listing_publish_tokens').select('phone,listing_data').eq('token',token).single()
    if(error||!row||!row.listing_data)throw new Error('Publishing token could not be confirmed.')
    // Dictionary reads use the existing server client; customer RLS exposes no ontology rows.
    const input=await tokenCreationInput(admin,row.listing_data,row.phone)
    const prepared=await admin.rpc('prepare_token_canonical_listing',{p_token:token,p_owner:ownerId,p_snapshot:row.listing_data,p_input:input})
    if(prepared.error)throw new Error(prepared.error.message)
    plan=prepared.data
  }
  if(!plan||typeof plan.listing_id!=='string')throw new Error('Creation result is uncertain. Retry the same token.')
  const listingId=plan.listing_id
  const incomplete=(mediaStatus:'incomplete'|'complete',warning:string)=>({success:false,listingId,mediaStatus,warning,error:warning})
  if(!plan.completed) {
    try {
      if(!Array.isArray(plan.media)||plan.media.length>25)throw Error('Invalid media plan')
      const bucket=admin.storage.from('listings-images')
      for(const entry of plan.media) {
        if(typeof entry.source!=='string'||typeof entry.destination!=='string'||
          !new RegExp(`^temporary/${token}/[a-zA-Z0-9_-]+[.]jpg$`).test(entry.source)||
          !entry.destination.startsWith(`${ownerId}/${listingId}/token-`))throw Error('Invalid media provenance')
        const existing=await bucket.info(entry.destination)
        if(!existing.error&&existing.data)continue
        if(String(existing.error?.statusCode)!=='404')throw Error('Uncertain destination')
        const source=await bucket.info(entry.source)
        if(source.error||!source.data||typeof source.data.size!=='number'||!Number.isSafeInteger(source.data.size)||source.data.size<0)throw Error('Uncertain source')
        const usage=await resolveUserPackageUsage({supabase:admin,userId:ownerId})
        if(usage.storageLimitBytes!==null&&usage.storageUsedBytes+source.data.size>usage.storageLimitBytes)throw Error('Storage allowance exceeded')
        const copied=await bucket.copy(entry.source,entry.destination)
        if(copied.error)throw Error('Copy incomplete')
      }
      const attached=await admin.rpc('attach_token_canonical_media',{p_token:token,p_owner:ownerId})
      if(attached.error||attached.data?.completed!==true||attached.data.listing_id!==listingId)throw Error('Attachment uncertain')
    } catch {
      return incomplete('incomplete','Your draft was created, but media completion is incomplete. Retry this token to finish the same draft.')
    }
  }
  if(prepareOnly)return {success:true,listingId,mediaStatus:'complete' as const,prepared:true}
  // Server-owned publication request and result are recorded atomically with the existing lifecycle call.
  try {
    const published=await customer.rpc('publish_token_canonical_listing',{p_token:token})
    if(published.error||published.data?.listing_id!==listingId)throw Error(published.error?.message||'Publication result uncertain')
    if(published.data.admission==='REVIEW_REQUIRED'||published.data.admission==='AUTOMATIC_REJECTION')return {success:true,listingId,admission:published.data.admission as 'REVIEW_REQUIRED'|'AUTOMATIC_REJECTION',caseId:published.data.caseId,mediaStatus:'complete' as const}
    invalidatePublicListingRepresentations(listingId)
    return {success:true,listingId,mediaStatus:'complete' as const,redirectTo:plan.transaction==='rent'?`/en/rent-lease/listing/${listingId}`:`/en/buy/listing/${listingId}`}
  } catch {
    return incomplete('complete','Your listing media is complete, but publication was not confirmed. Retry this token; the same listing will be used.')
  }
}
