import {assertOwner} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {cookies} from 'next/headers'

export const runtime='nodejs'

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
const ownerRecoveryCookie='twuanis-owner-workspace-recovery'
const encodeRecovery=(session:{access_token:string;refresh_token:string})=>Buffer.from(JSON.stringify(session)).toString('base64url')

function userView(user:{id:string;email?:string;email_confirmed_at?:string|null;created_at?:string}){
 return {id:user.id,email:user.email??null,confirmed:!!user.email_confirmed_at,createdAt:user.created_at??null}
}

export async function GET(request:Request){
 try{
  const authority=await assertOwner()
  const search=new URL(request.url).searchParams
  if([...search.keys()].some(key=>key!=='page')||search.getAll('page').length>1)return respond({ok:false},400)
  const page=Number(search.get('page')??'1')
  if(!Number.isInteger(page)||page<1||page>100000)return respond({ok:false},400)
  const result=await supabaseAdmin.auth.admin.listUsers({page,perPage:50})
  if(result.error)return respond({ok:false},503)
  return respond({ok:true,users:result.data.users.filter(user=>user.id!==authority.actorId).map(userView),next:result.data.users.length===50?page+1:null})
 }catch{return respond({ok:false},403)}
}

export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false},403)
  if(Number(request.headers.get('content-length')??0)>1024)return respond({ok:false},400)
  const raw=await request.text();if(raw.length>1024)return respond({ok:false},400)
  const body=JSON.parse(raw)
  if(!body||typeof body!=='object'||Object.keys(body).some(key=>key!=='targetId')||!uuid.test(body.targetId??''))return respond({ok:false},400)
  const authority=await assertOwner()
  if(body.targetId===authority.actorId)return respond({ok:false,reason:'owner'},400)
  const target=await supabaseAdmin.auth.admin.getUserById(body.targetId)
  if(target.error||!target.data.user?.email||!target.data.user.email_confirmed_at)return respond({ok:false,reason:'unavailable'},404)
  const link=await supabaseAdmin.auth.admin.generateLink({type:'magiclink',email:target.data.user.email})
  const tokenHash=link.data?.properties?.hashed_token
  if(link.error||typeof tokenHash!=='string'||!tokenHash)return respond({ok:false,reason:'unavailable'},503)
  const client=await createServerSupabaseClient()
  const session=(await client.auth.getSession()).data.session
  if(!session||session.user.id!==authority.actorId)throw Error()
  ;(await cookies()).set(ownerRecoveryCookie,encodeRecovery(session),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24})
  return respond({ok:true,target:userView(target.data.user),tokenHash})
 }catch{return respond({ok:false},403)}
}
