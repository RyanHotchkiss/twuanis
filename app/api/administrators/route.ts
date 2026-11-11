import {createServerSupabaseClient} from '@/lib/supabase-server'
import {assertOwner,changeAdministrativeAuthority,type AdministrativeCommand} from '@/lib/administrative-control'
export const runtime='nodejs'
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function GET(request:Request){
 try{
  await assertOwner()
  const p=new URL(request.url).searchParams
  if([...p.keys()].some(k=>!['lookup','after','before'].includes(k))||[...p.keys()].some(k=>p.getAll(k).length!==1))return respond({ok:false},400)
  const lookup=p.get('lookup'),after=p.get('after'),before=p.get('before')
  if((lookup!==null&&(lookup.trim().length<3||lookup.length>320))||(after!==null&&!uuid.test(after))||(before!==null&&!/^[1-9][0-9]{0,17}$/.test(before)))return respond({ok:false},400)
  const db=await createServerSupabaseClient()
  const r=await db.rpc('admin_administrators_read',{p_lookup:lookup,p_after:after,p_before:before})
  if(r.error)return respond({ok:false},r.error.code==='42501'?403:503)
  return respond({ok:true,data:r.data})
 }catch{return respond({ok:false},403)}
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false},403)
  if(Number(request.headers.get('content-length')??0)>4096)return respond({ok:false},400)
  const raw=await request.text();if(raw.length>4096)return respond({ok:false},400)
  const c=JSON.parse(raw)
  if(!c||Object.keys(c).some(k=>!['requestId','targetId','operation','permission','reason'].includes(k))||!uuid.test(c.requestId??'')||!uuid.test(c.targetId??'')||!['administrator.activate','administrator.deactivate','permission.grant','permission.revoke'].includes(c.operation)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>2000)return respond({ok:false},400)
  await assertOwner()
  // Existing authenticated helper derives the actor and delegates to the canonical audited RPC.
  const result=await changeAdministrativeAuthority(c as AdministrativeCommand)
  return respond({ok:true,result})
 }catch{return respond({ok:false},403)}
}
