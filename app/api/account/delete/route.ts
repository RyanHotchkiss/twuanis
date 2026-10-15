import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {createClient} from '@/lib/staging-supabase-client'
export const runtime='nodejs'
export const maxDuration=60
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function GET(){
 try{const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return respond({ok:false},401)
 const r=await db.rpc('read_account_deletion_eligibility');if(r.error||typeof r.data?.allowed!=='boolean'||!['NONE','CLEANUP_PENDING','STORAGE_READY','PROTECTED','UNAVAILABLE'].includes(r.data.phase))return respond({ok:false},503)
 return respond({ok:true,allowed:r.data.allowed,phase:r.data.phase,accountId:auth.data.user.id})}catch{return respond({ok:false},503)}
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false,reason:'auth'},403)
  if(Number(request.headers.get('content-length')??0)>4096)return respond({ok:false,reason:'invalid'},400)
  const raw=await request.text();if(raw.length>4096)return respond({ok:false,reason:'invalid'},400)
  const body=JSON.parse(raw)
  if(!body||Object.keys(body).some(k=>!['requestId','expectedAccount','password','acknowledged'].includes(k))||!uuid.test(body.expectedAccount??'')||!uuid.test(body.requestId??'')||body.acknowledged!==true||typeof body.password!=='string'||!body.password||body.password.length>1024)return respond({ok:false,reason:'invalid'},400)
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser()
  if(auth.error||!auth.data.user?.email)return respond({ok:false,reason:'auth'},401)
  const user=auth.data.user
  if(user.id!==body.expectedAccount)return respond({ok:false,reason:'auth'},403)
  // Separate non-persisting client: password reauthentication never replaces another session.
  const verifier=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const proof=await verifier.auth.signInWithPassword({email:user.email!,password:body.password})
  if(proof.error||proof.data.user?.id!==user.id){try{await verifier.auth.signOut({scope:'local'})}catch{}return respond({ok:false,reason:'reauth'},403)}
  try{
   // MFA-enabled accounts must retain verified AAL2; a password alone is insufficient.
   if(user.factors?.some(f=>f.status==='verified')){
    const claims=await db.auth.getClaims()
    const c=claims.data?.claims,now=Date.now()/1000
    if(claims.error||c?.sub!==user.id||c?.aal!=='aal2'||!Array.isArray(c.amr)||!(c.amr as unknown[]).some(a=>{if(!a||typeof a!=='object')return false;const v=a as Record<string,unknown>;return typeof v.method==='string'&&v.method.startsWith('mfa/')&&typeof v.timestamp==='number'&&v.timestamp<=now&&v.timestamp>=now-300}))return respond({ok:false,reason:'reauth'},403)
   }
   const invoke=async(operation:string)=>{
    const r=await supabaseAdmin.rpc('account_deletion_service',{p_user:user.id,p_request:body.requestId,p_operation:operation})
    if(r.error)throw new Error(r.error.code==='42501'?'protected':'pending')
    return r.data
   }
   let prepared=await invoke('prepare')
   // Bounded cleanup; retries continue the same durable deletion obligation.
   for(let batch=0;batch<5&&!prepared.complete;batch++){
    if(!Array.isArray(prepared.paths)||prepared.paths.length>200||prepared.paths.some((p:unknown)=>typeof p!=='string'||!p.startsWith(user.id+'/')))throw new Error('pending')
    if(!prepared.paths.length)break
    // Only server-selected private profile assets; never client paths or shared listing media.
    for(let i=0;i<prepared.paths.length;i+=100){const removed=await supabaseAdmin.storage.from('profile-images').remove(prepared.paths.slice(i,i+100));if(removed.error)throw new Error('pending')}
    prepared=await invoke('prepare')
   }
   if(!prepared.complete){
    const ready=await invoke('storage_ready')
    if(!ready.complete){
     const deleted=await supabaseAdmin.auth.admin.deleteUser(user.id,false)
     if(deleted.error&&!(await invoke('prepare')).complete)throw new Error('pending')
    }
   }
   return respond({ok:true})
  }finally{try{await verifier.auth.signOut({scope:'local'})}catch{/* No provider tokens persisted. */}}
 }catch(e){return respond({ok:false,reason:e instanceof Error&&e.message==='protected'?'protected':'pending'},e instanceof Error&&e.message==='protected'?403:503)}
}
