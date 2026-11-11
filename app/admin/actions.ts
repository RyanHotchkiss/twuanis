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
  return result.error||result.data?.ok===false?{ok:false as const}:{ok:true as const,data:result.data}
 }catch{return {ok:false as const}}
}

export async function duplicateRead(query:Record<string,unknown>){
 try{const {assertOwner}=await import('@/lib/administrative-control');await assertOwner();const db=await createServerSupabaseClient();const r=await db.rpc('read_owner_listing_duplicates',{p_query:query});return r.error||r.data?.ok===false?{ok:false as const}:{ok:true as const,data:r.data}}catch{return {ok:false as const}}
}
export async function admissionRead(query:Record<string,unknown>){
 try{const {assertOwner}=await import('@/lib/administrative-control');await assertOwner();const db=await createServerSupabaseClient();const r=await db.rpc('read_owner_listing_admissions',{p_query:query});return r.error||!r.data?{ok:false as const}:{ok:true as const,data:r.data}}catch{return {ok:false as const}}
}
export async function duplicateDecision(request:string,id:string,version:number,decision:string,reason:string){
 try{
  const {assertOwner}=await import('@/lib/administrative-control')
  await assertOwner()
  const db=await createServerSupabaseClient()
  const r=await db.rpc('command_owner_listing_duplicate',{p_request:request,p_case:id,p_expected:version,p_decision:decision,p_reason:reason})
  if(r.error)return {ok:false as const,error:r.error.message}
  if(r.data?.ok===false)return {ok:false as const,error:typeof r.data?.error==='string'?r.data.error:'Decision was not completed',data:r.data}

  // This is a confirmation read, not a second decision.  It lets the UI state
  // exactly which persisted review state the command produced.
  const read=await db.rpc('read_owner_listing_duplicates',{p_query:{case:id,status:'all'}})
  const item=Array.isArray((read.data as any)?.items)?(read.data as any).items.find((value:any)=>value?.id===id):null
  return {ok:true as const,data:r.data,review:item?{status:item.status,version:item.version,historyCount:Array.isArray(item.history)?item.history.length:null}:null,readbackError:read.error?.message||undefined}
 }catch(error){return {ok:false as const,error:error instanceof Error&&error.message?error.message:'Decision request failed'}}
}
