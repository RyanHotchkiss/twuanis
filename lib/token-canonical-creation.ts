import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { customerEditDomains } from '@/lib/canonical-customer-edit'
import { resolveUserPackageUsage } from '@/lib/package-usage'

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
  const {domains,content}=await customerEditDomains(db,changes,{transaction_type:data.transaction_type})
  return {transaction:data.transaction_type,...domains,content}
}

export async function completeTokenCreation(admin:SupabaseClient,customer:SupabaseClient,ownerId:string,token:string) {
  const {data:prior,error:priorError}=await admin.rpc('get_token_canonical_operation',{p_token:token,p_owner:ownerId})
  if(priorError)throw new Error(priorError.message)
  let plan=prior
  if(!plan) {
    const {data:row,error}=await admin.from('listing_publish_tokens').select('phone,listing_data').eq('token',token).single()
    if(error||!row||!row.listing_data)throw new Error('Publishing token could not be confirmed.')
    const input=await tokenCreationInput(customer,row.listing_data,row.phone)
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
  // Server-owned publication request and result are recorded atomically with the existing lifecycle call.
  try {
    const published=await customer.rpc('publish_token_canonical_listing',{p_token:token})
    if(published.error||published.data?.listing_id!==listingId)throw Error(published.error?.message||'Publication result uncertain')
    return {success:true,listingId,mediaStatus:'complete' as const,redirectTo:plan.transaction==='rent'?`/en/rent-lease/listing/${listingId}`:`/en/buy/listing/${listingId}`}
  } catch {
    return incomplete('complete','Your listing media is complete, but publication was not confirmed. Retry this token; the same listing will be used.')
  }
}
