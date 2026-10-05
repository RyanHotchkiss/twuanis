'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export async function adminRead(query:Record<string,unknown>) {
 try {await assertAdministrativePermission('listings.read');const db=await createServerSupabaseClient();const {data,error}=await db.rpc('admin_listing_read',{p_query:query});if(error) return {ok:false as const};return {ok:true as const,data}}catch{return {ok:false as const}}
}
export async function adminCommand(requestId:string,command:Record<string,unknown>) {
 try {await assertAdministrativePermission('listings.manage');const db=await createServerSupabaseClient();const {data,error}=await db.rpc('admin_listing_command',{p_request:requestId,p_command:command});if(error)return {ok:false as const};return {ok:true as const,data}}catch{return {ok:false as const}}
}

export async function adminEdit(requestId:string,listingId:string,expected:string,prior:string,changes:Record<string,unknown>,reason:string){
 try{
  await assertAdministrativePermission('listings.manage')
  await assertAdministrativePermission('listings.read')
  const db=await createServerSupabaseClient()
  const read=await db.rpc('admin_listing_read',{p_query:{mode:'detail',listing:listingId}})
  if(read.error||!read.data)return {ok:false as const}
  const {customerEditDomains}=await import('@/lib/canonical-customer-edit')
  const {supabaseAdmin}=await import('@/lib/supabase-admin')
  const {domains,content}=await customerEditDomains(supabaseAdmin,changes,read.data)
  const result=await db.rpc('admin_listing_command',{p_request:requestId,p_command:{operation:'edit',listing:listingId,expected,prior_updated_at:prior,domains,content,reason}})
  return result.error?{ok:false as const}:{ok:true as const,data:result.data}
 }catch{return {ok:false as const}}
}
