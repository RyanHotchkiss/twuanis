import 'server-only'
import type {SupabaseClient} from '@supabase/supabase-js'

export const canonicalAddonCatalogEnabled = () => process.env.TWUANIS_ADDON_CATALOG === 'canonical'
export const canonicalAddonPlacementEnabled = () => process.env.TWUANIS_ADDON_PLACEMENT === 'canonical'
type Surface = 'buy'|'rent'|'swipe-buy'|'swipe-rent'
type Evidence = {listingId:string;behavior:string;activatedAt:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Legacy filter labels are resolved to one exact canonical term, never fuzzy geography.
// Ambiguous/missing labels cannot establish contextual commercial eligibility.
async function termId(db:SupabaseClient,type:'province'|'property_type',label:unknown){
 if(label===undefined||label===null||label==='')return null
 if(typeof label!=='string'||label.length>200)throw Error('Invalid context')
 const ids=new Set<string>()
 for(const column of ['slug','term_name','term_name_en','term_name_es']){
  const {data,error}=await db.from('ontology_terms').select('id').eq('term_type',type).eq('level',1).eq(column,label).limit(2)
  if(error)throw Error('Context unavailable')
  for(const row of data??[]){if(!(typeof row.id==='string'&&/^[1-9][0-9]*$/.test(row.id))&&!(typeof row.id==='number'&&Number.isSafeInteger(row.id)&&row.id>0))throw Error('Lossy context identity');ids.add(String(row.id))}
 }
 if(ids.size!==1)throw Error('Canonical context not uniquely established')
 return [...ids][0]
}

export async function resolveAddonPlacement(db:SupabaseClient,ids:string[],surface:Surface,province?:unknown,propertyType?:unknown){
 if(!Array.isArray(ids)||ids.length>10000||ids.some(id=>typeof id!=='string'||!uuid.test(id))||new Set(ids).size!==ids.length||!['buy','rent','swipe-buy','swipe-rent'].includes(surface))throw Error('Invalid bounded placement request')
 if(ids.length===0)return {orderedIds:[],featuredIds:[]}
 const contextual=surface==='buy'||surface==='rent'
 const [p,t]=await Promise.all([contextual?termId(db,'province',province):null,contextual?termId(db,'property_type',propertyType):null])
 const priority=new Map<string,number>(),featured=new Map<string,number>()
 const requested=new Set(ids)
 for(let start=0;start<ids.length;start+=512){
  const batch=ids.slice(start,start+512),batchIds=new Set(batch)
  const {data,error}=await db.rpc('read_addon_placement',{p_ids:batch,p_surface:surface,p_province:p,p_property_type:t})
  if(error||!Array.isArray(data)||data.length>batch.length*4)throw Error('Placement unavailable')
  for(const row of data as Evidence[]){
   const at=Date.parse(row.activatedAt)
   if(!requested.has(row.listingId)||!batchIds.has(row.listingId)||!Number.isFinite(at))throw Error('Invalid placement evidence')
   const map=row.behavior==='featured_collection'?featured:['priority_over_organic','province_contextual_priority','property_type_contextual_priority'].includes(row.behavior)?priority:null
   if(!map)throw Error('Unexpected placement behavior')
   map.set(row.listingId,Math.max(map.get(row.listingId)??-Infinity,at))
  }
 }
 const compare=(map:Map<string,number>)=>(a:string,b:string)=>(map.get(b)!-map.get(a)!)||(a<b?-1:a>b?1:0)
 return {orderedIds:[...priority.keys()].sort(compare(priority)).concat(ids.filter(id=>!priority.has(id))),featuredIds:[...featured.keys()].sort(compare(featured))}
}
