import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHash, randomUUID } from 'node:crypto'
import { ImageFailure, normalizeProfileImage, normalizeNavigationAvatar } from './image-validation'
const bucket='profile-images'
export async function imageCommand(user:string|null,request:string|null,operation:string,revision:number|null=null,evidence:Record<string,unknown>={}){
 const {data,error}=await supabaseAdmin.rpc('account_profile_image_service',{p_user:user,p_request:request,p_operation:operation,p_expected_revision:revision,p_evidence:evidence})
 if(error)throw new ImageFailure(error.code==='40001'?'conflict':error.code==='54000'?'rate':'storage')
 return data
}
export async function readProfileImage(user:string){
 const state=await imageCommand(user,null,'read')
 if(!state.hasImage)return {revision:state.revision,assetId:null,hasImage:false,url:null}
 const {data,error}=await supabaseAdmin.storage.from(bucket).createSignedUrl(state.path,300)
 if(error){
  // A confirmed missing object invalidates its DB reference; transient failures do not.
  if('statusCode' in error && String(error.statusCode)==='404'){
   await imageCommand(user,randomUUID(),'remove',state.revision)
   return {revision:state.revision+1,assetId:null,hasImage:false,url:null}
  }
  throw new ImageFailure('storage')
 }
 if(!data?.signedUrl)throw new ImageFailure('storage')
 return {revision:state.revision,assetId:state.assetId,hasImage:true,url:data.signedUrl}
}
export async function uploadProfileImage(user:string,request:string,revision:number,bytes:Buffer,mime:string,name:string){
 if(bytes.length>5*1024*1024)throw new ImageFailure('size')
 const sha256=createHash('sha256').update(bytes).digest('hex')
 // Reserve/rate-limit before expensive decoding. Invalid uploads remain inaccessible stages.
 const reservation=await imageCommand(user,request,'reserve',revision,{sha256})
 if(reservation.complete)return readProfileImage(user)
 const image=await normalizeProfileImage(bytes,mime,name)
 const store=supabaseAdmin.storage.from(bucket)
 // Immutable upload. Concurrent identical retries may observe the same existing object.
 const {error}=await store.upload(reservation.path,image.data,{contentType:'image/webp',upsert:false,cacheControl:'300'})
 if(error){
  const {data:existing,error:readError}=await store.download(reservation.path)
  if(readError||!existing||existing.size>5*1024*1024||createHash('sha256').update(Buffer.from(await existing.arrayBuffer())).digest('hex')!==image.outputHash)throw new ImageFailure('storage')
 }
 await storeAvatar(reservation.path,image.data)
 await imageCommand(user,request,'finalize',revision,{sha256:image.sha256,width:image.width,height:image.height,bytes:image.bytes})
 return readProfileImage(user)
}
export async function removeProfileImage(user:string,request:string,revision:number){await imageCommand(user,request,'remove',revision);return readProfileImage(user)}

// Derived solely from a server-authorized immutable image path; never client input.
const avatarPath=(path:string)=>`${path}.avatar-v1.webp`
async function storeAvatar(path:string,original:Buffer){
 const avatar=await normalizeNavigationAvatar(original)
 const store=supabaseAdmin.storage.from(bucket)
 const {error}=await store.upload(avatarPath(path),avatar.data,{contentType:'image/webp',upsert:false,cacheControl:'300'})
 if(error){
  const {data,error:readError}=await store.download(avatarPath(path))
  if(readError||!data||createHash('sha256').update(Buffer.from(await data.arrayBuffer())).digest('hex')!==createHash('sha256').update(avatar.data).digest('hex'))throw new ImageFailure('storage')
 }
}
const pendingAvatars=new Map<string,Promise<void>>()
async function ensureAvatar(path:string){
 let pending=pendingAvatars.get(path)
 if(!pending){
  pending=(async()=>{
   const store=supabaseAdmin.storage.from(bucket)
   const {data,error}=await store.download(path)
   if(error||!data||data.size>5*1024*1024)throw new ImageFailure('storage')
   await storeAvatar(path,Buffer.from(await data.arrayBuffer()))
  })().finally(()=>pendingAvatars.delete(path))
  pendingAvatars.set(path,pending)
 }
 await pending
}
export async function readNavigationAvatar(user:string){
 const state=await imageCommand(user,null,'read')
 if(!state.hasImage)return {revision:state.revision,assetId:null,url:null}
 const store=supabaseAdmin.storage.from(bucket)
 let result=await store.createSignedUrl(avatarPath(state.path),300)
 if(result.error){
  // Only established absence authorizes lazy processing; transient errors fail closed.
  if(!('statusCode' in result.error)||(String(result.error.statusCode)!=='404' && !(String(result.error.statusCode)==='400' && result.error.message==='Object not found')))throw new ImageFailure('storage')
  await ensureAvatar(state.path)
  result=await store.createSignedUrl(avatarPath(state.path),300)
 }
 if(result.error||!result.data?.signedUrl)throw new ImageFailure('storage')
 // Replacement/removal during lazy processing must not return the old association.
 const current=await imageCommand(user,null,'read')
 if(current.assetId!==state.assetId||current.revision!==state.revision){
  // Retired immutable assets cannot become active again; fence cleanup/lazy races.
  await store.remove([avatarPath(state.path)])
  return {revision:current.revision,assetId:null,url:null}
 }
 return {revision:state.revision,assetId:state.assetId,url:result.data.signedUrl}
}
