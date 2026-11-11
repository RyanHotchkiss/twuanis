import {createServerSupabaseClient} from '@/lib/supabase-server'
export async function GET(){
 const headers={'Cache-Control':'private, no-store'}
 try{
  const db=await createServerSupabaseClient(),{data,error}=await db.auth.getUser()
  if(error||!data.user)return Response.json({visible:false},{headers})
  const authority=await db.rpc('read_admin_navigation')
  return Response.json({visible:!authority.error&&authority.data===true},{headers})
 }catch{return Response.json({visible:false},{headers})}
}
