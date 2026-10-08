import 'server-only'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {canonicalAddonPlacementEnabled} from './addon-placement-server'
import type {AddonHomepageItem} from './addon-homepage-contract'
export async function loadAddonHomepage():Promise<AddonHomepageItem[]>{
 if(!canonicalAddonPlacementEnabled())return []
 const {data:ids,error}=await supabaseAdmin.rpc('read_addon_homepage_ids')
 if(error||!Array.isArray(ids)||ids.length>10||new Set(ids).size!==ids.length)throw Error('Homepage placement unavailable')
 if(!ids.length)return []
 const {data,error:readError}=await supabaseAdmin.from('listings').select('id,title,images,transaction_type').in('id',ids).eq('listing_status','active').eq('canonical_domain_version',1).limit(10)
 if(readError||!data||data.length>10)throw Error('Homepage presentation unavailable')
 const byId=new Map(data.map(row=>[row.id,row]))
 return ids.flatMap(id=>{
  const row=byId.get(id);if(!row||!['sale','rent'].includes(row.transaction_type))return []
  let images:unknown=row.images
  if(typeof images==='string'){const text=images;try{images=JSON.parse(text)}catch{images=text.split('|')}}
  const first=Array.isArray(images)&&typeof images[0]==='string'?images[0]:null
  const image=first?( /^https?:\/\//i.test(first)?first:supabaseAdmin.storage.from('listings-images').getPublicUrl(first).data.publicUrl):null
  return [{id,title:typeof row.title==='string'?row.title:'',transaction:row.transaction_type as 'sale'|'rent',image}]
 })
}
