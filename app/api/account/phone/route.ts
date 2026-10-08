import { createServerSupabaseClient } from '@/lib/supabase-server'
import { readAccountPhone, changeAccountPhone } from '@/lib/account-identity/phone-server'
export const runtime='nodejs'
export const maxDuration=30
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v)
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
async function actor(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();return error?null:data.user?.id}
export async function GET(){try{const user=await actor();return user?reply({ok:true,current:await readAccountPhone(user)}):reply({ok:false,reason:'auth'},401)}catch{return reply({ok:false,reason:'unavailable'},503)}}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({ok:false,reason:'auth'},403)
  const user=await actor();if(!user)return reply({ok:false,reason:'auth'},401)
  const reader=request.body?.getReader();if(!reader)return reply({ok:false,reason:'invalid'},400)
  let body='';const decoder=new TextDecoder();let size=0
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();return reply({ok:false,reason:'invalid'},413)}body+=decoder.decode(value,{stream:true})}body+=decoder.decode()}finally{reader.releaseLock()}
  let data;try{data=JSON.parse(body)}catch{return reply({ok:false,reason:'invalid'},400)}
  if(!data||typeof data!=='object'||Array.isArray(data)||!uuid(data.request))return reply({ok:false,reason:'invalid'},400)
  const fields=data.op==='save'?['op','request','revision','phone','country']:[]
  if(!fields.length||Object.keys(data).some(k=>!fields.includes(k)))return reply({ok:false,reason:'invalid'},400)
  if((!Number.isSafeInteger(data.revision)||data.revision<0))return reply({ok:false,reason:'invalid'},400)
  const result=await changeAccountPhone(user,data.request,data.revision,data.phone,data.country)
  return reply(result,result.ok?200:result.reason==='rate'||result.reason==='cooldown'?429:409)
 }catch{return reply({ok:false,reason:'unavailable'},503)}
}
