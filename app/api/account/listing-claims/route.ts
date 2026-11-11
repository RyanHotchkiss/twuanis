import {createServerSupabaseClient} from '@/lib/supabase-server'
import {changeAccountPhone,readAccountPhone} from '@/lib/account-identity/phone-server'
import {normalizeAccountPhone} from '@/lib/account-identity/phone-validation'
export const runtime='nodejs'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
export async function GET(request:Request){
 try{const db=await createServerSupabaseClient(),{data,error}=await db.auth.getUser();if(error||!data.user)return reply({ok:false,reason:'auth'},401)
 const result=await db.rpc('read_listing_claims');if(result.error)return reply({ok:false,reason:'unavailable'},503)
 const ownerScope=new URL(request.url).searchParams.get('scope')==='owner'
 if(ownerScope&&!result.data?.owner)return reply({ok:false,reason:'forbidden'},403)
 return reply({ok:true,...result.data,pending:ownerScope?result.data.pending:[]})
 }catch{return reply({ok:false,reason:'unavailable'},503)}
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({ok:false,reason:'auth'},403)
  const db=await createServerSupabaseClient(),{data,error}=await db.auth.getUser();if(error||!data.user)return reply({ok:false,reason:'auth'},401)
  const reader=request.body?.getReader();if(!reader)return reply({ok:false,reason:'invalid'},400)
  let size=0,body='';const decoder=new TextDecoder()
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();return reply({ok:false,reason:'invalid'},413)}body+=decoder.decode(part.value,{stream:true})}body+=decoder.decode()}finally{reader.releaseLock()}
  let input;try{input=JSON.parse(body)}catch{return reply({ok:false,reason:'invalid'},400)}
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['request','operation','data'].includes(k))||typeof input.request!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.request)||!['issue','approve','reject','revoke','claim'].includes(input.operation)||!input.data||typeof input.data!=='object'||Array.isArray(input.data))return reply({ok:false,reason:'invalid'},400)
  // Fail before any phone mutation if the approved local database prerequisites are absent.
  const available=await db.rpc('read_listing_claims');if(available.error)return reply({ok:false,reason:'unavailable'},503)
  let command=input.data
  if(input.operation==='issue'){
   if(Object.keys(command).some(k=>!['phone','revision'].includes(k))||!Number.isSafeInteger(command.revision)||command.revision<0)return reply({ok:false,reason:'invalid'},400)
   let phone;try{phone=normalizeAccountPhone(command.phone,'CR')}catch{return reply({ok:false,reason:'invalid_phone'},400)}
   if(!phone.startsWith('+506'))return reply({ok:false,reason:'invalid_phone'},400)
   await readAccountPhone(data.user.id)
   const changed=await changeAccountPhone(data.user.id,input.request,command.revision,phone,'CR');if(!changed.ok)return reply(changed,409)
   command={revision:changed.revision}
  }
  if(input.operation==='approve'){
   try{command={...command,sender:normalizeAccountPhone(command.sender,'CR')}}catch{return reply({ok:false,reason:'invalid_phone'},400)}
  }
  const result=await db.rpc('command_listing_claim',{p_request:input.request,p_operation:input.operation,p_data:command})
  if(result.error)return reply({ok:false,reason:result.error.code==='42501'?'forbidden':result.error.code==='22023'?'invalid':'unavailable'},result.error.code==='42501'?403:result.error.code==='22023'?400:503)
  return reply(result.data,result.data?.ok?200:result.data?.reason==='rate'?429:409)
 }catch{return reply({ok:false,reason:'unavailable'},503)}
}
