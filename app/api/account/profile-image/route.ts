import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ImageFailure, readImageBody } from '@/lib/account-identity/image-validation'
import { readProfileImage, removeProfileImage, uploadProfileImage } from '@/lib/account-identity/profile-image-server'
export const runtime='nodejs'
export const maxDuration=60
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
async function handle(request:Request){
 try{
  if(request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return response({ok:false,reason:'auth'},403)
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser()
  if(auth.error||!auth.data.user)return response({ok:false,reason:'auth'},401)
  const user=auth.data.user.id
  if(request.method==='GET')return response({ok:true,...await readProfileImage(user)})
  const id=request.headers.get('x-image-request'),rawRevision=request.headers.get('x-profile-revision'),revision=Number(rawRevision)
  if(!id||!uuid.test(id)||rawRevision===null||!/^\d+$/.test(rawRevision)||!Number.isSafeInteger(revision))throw new ImageFailure('invalid')
  if(request.method==='DELETE')return response({ok:true,...await removeProfileImage(user,id,revision)})
  let name:string;try{name=decodeURIComponent(request.headers.get('x-image-name')??'')}catch{throw new ImageFailure('format')}
  if(name.length>255)throw new ImageFailure('format')
  return response({ok:true,...await uploadProfileImage(user,id,revision,await readImageBody(request),request.headers.get('content-type')??'',name)})
 }catch(e){const reason=e instanceof ImageFailure?e.reason:'storage';return response({ok:false,reason},reason==='conflict'?409:reason==='rate'?429:reason==='storage'?503:400)}
}
export const GET=handle
export const POST=handle
export const DELETE=handle
