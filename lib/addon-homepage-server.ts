import 'server-only'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {canonicalAddonPlacementEnabled} from './addon-placement-server'
import {getPublicListingById} from './public-listings-server'
import {resolveMarketAnalyticalContext} from './market-analytical-context'
import {projectPublicListingMonetaryValue} from './public-listing-monetary-projection'
import type {AddonHomepageItem} from './addon-homepage-contract'
export async function loadAddonHomepage():Promise<AddonHomepageItem[]>{
 if(!canonicalAddonPlacementEnabled())return []
 const pools=await Promise.all([loadAdvertisingPlacements('sale'),loadAdvertisingPlacements('rent')])
 return pools.flatMap(pool=>[...pool.spotlight.map(item=>({...item,behavior:'homepage_carousel' as const})),...pool.featured.map(item=>({...item,behavior:'featured_collection' as const}))])
}

// One bounded acquisition per market view. The SQL reader supplies paid authority;
// presentation examples are selected separately and never enter this result.
export async function loadAdvertisingPlacements(market:'sale'|'rent'):Promise<{spotlight:AddonHomepageItem[];featured:AddonHomepageItem[]}>{
 if(!canonicalAddonPlacementEnabled())return {spotlight:[],featured:[]}
 const {data,error}=await supabaseAdmin.rpc('read_advertising_listing_ids',{p_market:market})
 if(error||!data||!Array.isArray(data.spotlight)||!Array.isArray(data.featured)||data.spotlight.length>5||data.featured.length>12)throw Error('Advertising placement unavailable')
 const ids=[...new Set<string>([...data.spotlight,...data.featured])]
 if(ids.some(id=>typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)))throw Error('Invalid advertising identity')
 if(!ids.length)return {spotlight:[],featured:[]}
 const context=await resolveMarketAnalyticalContext()
 const rows=await Promise.all(ids.map(id=>getPublicListingById(id)))
 const map=new Map(rows.flatMap(row=>row&&row.transaction_type===market?[[row.id,{id:row.id,title:row.title||'',transaction:market,image:null,listing:projectPublicListingMonetaryValue(row,context)}]as const]:[]))
 return {spotlight:data.spotlight.map((id:string)=>map.get(id)).filter(Boolean),featured:data.featured.map((id:string)=>map.get(id)).filter(Boolean)}
}
