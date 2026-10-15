import 'server-only'
import {randomUUID,createHash,timingSafeEqual} from 'node:crypto'
import {createClient,type SupabaseClient} from '@/lib/staging-supabase-client'
import {acquireSource,type SyntheticTransport,type RetrievalPlan} from './retrieval'

/** No bank connection can be initiated in staging, or without explicit production activation. */
export function retrievalActivated(){return process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT==='production' && process.env.TWUANIS_REMATES_RETRIEVAL==='authorized'}
export function workerRequestAuthorized(value:string|null){
 const secret=process.env.CRON_SECRET
 if(!secret||secret.length<32||!value||value.length>256)return false
 const actual=Buffer.from(value),expected=Buffer.from(`Bearer ${secret}`)
 return actual.length===expected.length&&timingSafeEqual(actual,expected)
}
function receiptId(lease:string){const hash=createHash('sha256').update(`remates-retrieval:${lease}`).digest('hex');return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`}
/** Genuine source-scoped Auth session. Never substitutes service-role or Owner authority. */
export async function runRetrievalWorker(){
 if(!retrievalActivated())throw Error('RETRIEVAL_DISABLED')
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,email=process.env.REMATES_RETRIEVAL_WORKER_EMAIL,password=process.env.REMATES_RETRIEVAL_WORKER_PASSWORD
 if(!url||!key||!email||!password||!url.startsWith('https://'))throw Error('WORKER_CONFIGURATION_REQUIRED')
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
 const signed=await db.auth.signInWithPassword({email,password});if(signed.error||!signed.data.user)throw Error('WORKER_AUTHENTICATION_FAILED')
 try{return await executeRetrievalWorker(db)}finally{await db.auth.signOut({scope:'local'})}
}
/** Shared orchestration; callers supply a genuine authenticated, source-scoped client. */
export async function executeRetrievalWorker(db:SupabaseClient,options:{source?:string;request?:string;transport?:SyntheticTransport}={}){
 const counters={examined:0,retained:0,failed:0,skipped:0}
 {
  const read=await db.rpc('remate_retrieval_read',{});if(read.error||read.data?.owner!==false||!Array.isArray(read.data?.items)||read.data.items.length>100)throw Error('WORKER_SCOPE_INVALID')
  const due=read.data.items.filter((item:{source_id:string;enabled:boolean;next_due_at:string})=>item.enabled&&(!options.source||item.source_id===options.source)&&Date.parse(item.next_due_at)<=Date.now()).slice(0,2)
  // Two per invocation; database leases enforce the global concurrency budget across instances.
  for(const item of due){
   counters.examined++;const lease=options.request||randomUUID()
   const claim=await db.rpc('remate_retrieval_worker',{p_request:lease,p_source:item.source_id,p_operation:'claim',p_data:{}})
   if(claim.error){counters.skipped++;continue}
   const plan:RetrievalPlan={adapter:claim.data.adapter,urls:claim.data.urls,sourceRevision:claim.data.sourceRevision,authorizationExpiresAt:claim.data.authorizationExpiresAt}
   const authorize=async()=>{const checked=await db.rpc('remate_retrieval_worker',{p_request:lease,p_source:item.source_id,p_operation:'check',p_data:{lease}});if(checked.error||checked.data?.ok!==true)throw Error('WORKER_AUTHORITY_LOST')}
   try{
    const captured=await acquireSource(plan,lease,authorize,undefined,options.transport)
    const data={lease,run:{key:lease,started_at:captured.startedAt,ended_at:captured.endedAt,outcome:captured.outcome,scope:'SAMPLE',pages:captured.pages},observations:captured.observations,diagnostics:captured.diagnostics}
    const retained=await db.rpc('remate_retrieval_worker',{p_request:receiptId(lease),p_source:item.source_id,p_operation:'retain',p_data:data})
    if(retained.error)throw Error('WORKER_RETENTION_FAILED')
    counters.retained++;if(captured.outcome==='FAILED')counters.failed++
   }catch{counters.failed++} // Lease expiry permits bounded recovery. No unauthorized mutation after lost authority.
  }
 }
 return {...counters,publicationEnabled:false,inventoryComplete:false}
}
