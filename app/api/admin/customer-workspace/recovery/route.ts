import {createServerSupabaseClient} from '@/lib/supabase-server'
import {cookies} from 'next/headers'

export const runtime='nodejs'

type Recovery={access_token:string;refresh_token:string}
const ownerRecoveryCookie='twuanis-owner-workspace-recovery'
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
function read(raw:string|undefined):Recovery|null{
 try{const value=raw?JSON.parse(Buffer.from(raw,'base64url').toString('utf8')):null
  return value&&typeof value.access_token==='string'&&typeof value.refresh_token==='string'?value:null
 }catch{return null}
}
export async function GET(){
 const value=read((await cookies()).get(ownerRecoveryCookie)?.value)
 return respond({ok:true,recovery:!!value})
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false},403)
  const store=await cookies(),recovery=read(store.get(ownerRecoveryCookie)?.value)
  if(!recovery)return respond({ok:false,reason:'missing'},409)
  const client=await createServerSupabaseClient()
  const restored=await client.auth.setSession(recovery)
  if(restored.error||!restored.data.user)return respond({ok:false,reason:'unavailable'},409)
  store.delete(ownerRecoveryCookie)
  return respond({ok:true})
 }catch{return respond({ok:false,reason:'unavailable'},409)}
}
