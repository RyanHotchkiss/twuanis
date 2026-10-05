'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {resolveUserPackageUsage} from '@/lib/package-usage'
export async function adminUpload(form:FormData){
 try{
  const actor=await assertAdministrativePermission('listings.manage')
  const request=String(form.get('request')||''),listing=String(form.get('listing')||''),file=form.get('file')
  if(!(file instanceof File)||file.type!=='image/jpeg'||file.size<1||file.size>614400)return {ok:false}
  const bytes=new Uint8Array(await file.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return {ok:false}
  const db=await createServerSupabaseClient()
  const prepared=await db.rpc('admin_prepare_media',{p_request:request,p_listing:listing,p_bytes:file.size})
  if(prepared.error||!prepared.data||prepared.data.actor_id!==actor.actorId||prepared.data.listing_id!==listing)return {ok:false}
  const op=prepared.data;const path=op.path
  if(typeof path!=='string'||!(op.owner_id?path.startsWith(`${op.owner_id}/${listing}/upload-`):path.startsWith(`system/listings/${listing}/upload-`)))return {ok:false}
  if(!op.completed){
   const bucket=supabaseAdmin.storage.from('listings-images'),existing=await bucket.info(path)
   if(existing.error){
    // A missing object may be uploaded; an uncertain lookup must retain operation identity.
    if(String((existing.error as {statusCode?:string}).statusCode)!=='404'&&(existing.error as {code?:string}).code!=='not_found')return {ok:false,requestId:request}
    if(op.owner_id){const usage=await resolveUserPackageUsage({supabase:supabaseAdmin,userId:op.owner_id});if(usage.storageLimitBytes!==null&&usage.storageUsedBytes+file.size>usage.storageLimitBytes)return {ok:false,requestId:request}}
    const uploaded=await bucket.upload(path,bytes,{contentType:'image/jpeg',upsert:false});if(uploaded.error)return {ok:false,requestId:request}
   }else if(existing.data.size!==file.size||existing.data.contentType!=='image/jpeg')return {ok:false,requestId:request}
  }
  const attached=await db.rpc('admin_attach_media',{p_request:request})
  return attached.error?{ok:false,requestId:request}:{ok:true,requestId:request}
 }catch{return {ok:false}}
}
export async function adminMediaControl(request:string,listing:string,prior:string|null,operation:'reorder'|'remove',values:string[]){
 try{
  await assertAdministrativePermission('listings.manage');const db=await createServerSupabaseClient();const r=await db.rpc('admin_control_media',{p_request:request,p_listing:listing,p_prior:prior,p_operation:operation,p_values:values});
  if(r.error)return {ok:false}
  // Customer cleanup reuses the existing durable detach receipt and rechecks attachment state.
  const result=r.data
  if(operation==='remove'&&result?.managed===true&&typeof result.owner_id==='string'&&typeof result.id==='string'){
   const check=await supabaseAdmin.rpc('get_image_detach_operation',{p_owner:result.owner_id,p_operation:result.id})
   if(check.error||check.data?.listing_id!==listing||check.data?.image_value!==values[0])return {ok:true,cleanupPending:true}
   if(!check.data.cleanup_completed){
    const removed=await supabaseAdmin.storage.from('listings-images').remove([check.data.image_value])
    if(removed.error)return {ok:true,cleanupPending:true}
    const confirmed=await supabaseAdmin.rpc('confirm_image_cleanup',{p_owner:result.owner_id,p_operation:result.id})
    if(confirmed.error)return {ok:true,cleanupPending:true}
   }
  }
  return {ok:true}
 }catch{return {ok:false}}
}
export async function adminResumeMedia(request:string){
 try{await assertAdministrativePermission('listings.manage');const db=await createServerSupabaseClient();const r=await db.rpc('admin_attach_media',{p_request:request});return {ok:!r.error}}catch{return {ok:false}}
}
