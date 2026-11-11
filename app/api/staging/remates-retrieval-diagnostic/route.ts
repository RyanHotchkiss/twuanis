import {createServerSupabaseClient} from '@/lib/supabase-server'
import {createClient} from '@/lib/staging-supabase-client'
import {diagnosticGuard,diagnosticScenarios,diagnosticSource,diagnosticWorker,diagnosticLocator,diagnosticTransport,type DiagnosticScenario} from '@/lib/remates/retrieval-diagnostic'
import {executeRetrievalWorker} from '@/lib/remates/retrieval-worker'
export const runtime='nodejs'
export const maxDuration=90
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>1024)throw Error('INPUT')
  const reader=request.body?.getReader();if(!reader)throw Error('INPUT');let size=0;const chunks:Uint8Array[]=[];try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>1024){await reader.cancel();throw Error('INPUT')}chunks.push(next.value)}}finally{reader.releaseLock()}const input=JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if(Object.keys(input).sort().join(',')!=='deployment,request,scenario'||typeof input.deployment!=='string'||typeof input.request!=='string'||!/^[0-9a-f-]{36}$/.test(input.request)||!diagnosticScenarios.includes(input.scenario))throw Error('INPUT')
  const gate=diagnosticGuard(input.deployment);if(new URL(request.url).origin!==gate.origin||request.headers.get('origin')!==gate.origin)throw Error('ORIGIN')
  const owner=await createServerSupabaseClient();const authorization=await owner.rpc('remate_retrieval_read',{p_source:diagnosticSource});if(authorization.error||authorization.data?.owner!==true)throw Error('OWNER_REQUIRED')
  const items=authorization.data.items;if(!Array.isArray(items)||items.length!==1||items[0].worker_id!==diagnosticWorker||items[0].adapter!=='bp-catalog'||items[0].urls.length!==1||items[0].urls[0]!==diagnosticLocator||!items[0].authorization_evidence.includes('SYNTHETIC'))throw Error('SOURCE_REQUIRED')
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const signed=await db.auth.signInWithPassword({email:process.env.REMATES_RETRIEVAL_WORKER_EMAIL||'',password:process.env.REMATES_RETRIEVAL_WORKER_PASSWORD||''});if(signed.error||signed.data.user?.id!==diagnosticWorker||!signed.data.session)throw Error('WORKER_REQUIRED')
  try{
   const result=await executeRetrievalWorker(db,{source:diagnosticSource,request:input.request,transport:diagnosticTransport(input.deployment,input.scenario as DiagnosticScenario,input.request,signed.data.session.access_token)})
   return Response.json(result,{headers:{'Cache-Control':'no-store'}})
  }finally{await db.auth.signOut({scope:'local'})}
 }catch{return Response.json({error:'Diagnostic unavailable'},{status:403,headers:{'Cache-Control':'no-store'}})}
}
