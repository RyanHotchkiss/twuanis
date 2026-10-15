import { createServerSupabaseClient } from '@/lib/supabase-server'
import { readNavigationAvatar } from '@/lib/account-identity/profile-image-server'
export const runtime='nodejs'
export const maxDuration=60
export async function GET(){
 const headers={'Cache-Control':'private, no-store'}
 try{
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser()
  if(auth.error||!auth.data.user)return Response.json({ok:false},{status:401,headers})
  return Response.json({ok:true,...await readNavigationAvatar(auth.data.user.id)},{headers})
 }catch{return Response.json({ok:false},{status:503,headers})}
}
