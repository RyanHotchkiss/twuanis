import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const uuid=(x:unknown)=>typeof x==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x)
const endpoint=(x:unknown)=>{if(typeof x!=='string'||x.length>2048)return false;try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!/\s/.test(x)}catch{return false}}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}})
export async function pushRequest(request:Request,operation:'state'|'enable'|'disable'|'delivery'){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({ok:false},403)
  const db=await createServerSupabaseClient(),{data,error}=await db.auth.getUser();if(error||!data.user)return reply({ok:false},401)
  const reader=request.body?.getReader();if(!reader)return reply({ok:false},400);let size=0,body='';const decoder=new TextDecoder()
  try{while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>4096){await reader.cancel();return reply({ok:false},413)}body+=decoder.decode(v.value,{stream:true})}body+=decoder.decode()}finally{reader.releaseLock()}
  let p;try{p=JSON.parse(body)}catch{return reply({ok:false},400)}
  const allowed=operation==='enable'?['endpoint','keys']:operation==='delivery'?['endpoint','recipient']:['endpoint','registration']
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!allowed.includes(k)))return reply({ok:false},400)
  if(operation==='enable'||operation==='delivery'){if(!endpoint(p.endpoint))return reply({ok:false},400)}else if((p.endpoint!==undefined)===(p.registration!==undefined)||p.endpoint!==undefined&&!endpoint(p.endpoint)||p.registration!==undefined&&!uuid(p.registration))return reply({ok:false},400)
  if(operation==='enable'&&(!p.keys||typeof p.keys!=='object'||Object.keys(p.keys).some(k=>!['p256dh','auth'].includes(k))||typeof p.keys.p256dh!=='string'||typeof p.keys.auth!=='string'||!/^B[A-Za-z0-9_-]{86}=?$/.test(p.keys.p256dh)||!/^[A-Za-z0-9_-]{22}(==)?$/.test(p.keys.auth)))return reply({ok:false},400)
  // Payload recipient is a comparison only, never an authoritative account parameter.
  if(operation==='delivery'&&(!uuid(p.recipient)||p.recipient!==data.user.id))return reply({ok:false},403)
  const result=await db.rpc('account_push_command',{p_operation:operation==='delivery'?'state':operation,p_endpoint:p.endpoint??null,p_registration:p.registration??null,p_keys:operation==='enable'?p.keys:null})
  if(result.error)return reply({ok:false},503)
  if(!result.data?.ok)return reply({ok:false,reason:'unavailable'},409)
  return reply(operation==='delivery'?{ok:result.data.active===true}:{ok:true,active:result.data.active===true,registration:result.data.registration??null})
 }catch{return reply({ok:false},503)}
}
