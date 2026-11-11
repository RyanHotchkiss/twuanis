import 'server-only'
import {createHmac,timingSafeEqual} from 'node:crypto'
import {createClient} from '@/lib/staging-supabase-client'
import {assertStagingCredential} from '@/lib/staging-identity'
import type {SyntheticTransport} from './retrieval'
export const diagnosticSource='20ecfc2b-5cda-44e7-a9ac-e32a8916e6af'
export const diagnosticWorker='65401126-329e-43fc-ae39-f1f24400c26b'
export const diagnosticLocator='https://www.bancopopular.fi.cr/wp-content/uploads/SYNTHETIC-R16-CATALOG.pdf'
export const diagnosticScenarios=['success','429','500','503','timeout','malformed','oversized','mime','redirect'] as const
export type DiagnosticScenario=typeof diagnosticScenarios[number]
export const fixturePath='/api/staging/remates-retrieval-fixture'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Separate from ordinary retrieval activation. Never enabled by production settings. */
export function diagnosticGuard(deployment:string){
 const e=process.env,host=e.VERCEL_URL||'',expiry=Date.parse(e.TWUANIS_RETRIEVAL_DIAGNOSTIC_EXPIRES||'')
 if(e.TWUANIS_ENVIRONMENT!=='staging'||e.VERCEL!=='1'||e.NEXT_PUBLIC_TWUANIS_ENVIRONMENT!=='staging'||e.VERCEL_PROJECT_ID!=='prj_FVMLa40NeWsYgAFcHVHpUgolBgro'||!deployment||deployment!==e.VERCEL_DEPLOYMENT_ID||!/^dpl_[A-Za-z0-9]+$/.test(deployment)||e.TWUANIS_RETRIEVAL_DIAGNOSTIC!=='synthetic-085-v1'||!Number.isFinite(expiry)||expiry<=Date.now()||expiry>Date.now()+3600000||!/^twuanis-staging-do-not-use-for-production-[a-z0-9]+\.vercel\.app$/.test(host)||!e.TWUANIS_RETRIEVAL_DIAGNOSTIC_SECRET||e.TWUANIS_RETRIEVAL_DIAGNOSTIC_SECRET.length<32||!e.VERCEL_AUTOMATION_BYPASS_SECRET)throw Error('DIAGNOSTIC_DISABLED')
 assertStagingCredential(e.NEXT_PUBLIC_SUPABASE_URL||'',e.NEXT_PUBLIC_SUPABASE_ANON_KEY||'',true,'anon')
 return {origin:'https://'+host,expiry,secret:e.TWUANIS_RETRIEVAL_DIAGNOSTIC_SECRET,deployment}
}
type Ticket={deployment:string;lease:string;source:string;scenario:DiagnosticScenario;attempt:number;expires:number}
function signature(body:string,secret:string){return createHmac('sha256',secret).update(body).digest('hex')}
export function diagnosticTransport(deployment:string,scenario:DiagnosticScenario,lease:string,workerToken:string):SyntheticTransport{
 const gate=diagnosticGuard(deployment);if(!diagnosticScenarios.includes(scenario)||!uuid.test(lease)||!workerToken)throw Error('DIAGNOSTIC_INPUT')
 let requests=0;const statuses:number[]=[]
 return {noteResponse(status){if(statuses.length<3)statuses.push(status)},trace(){return [`SYNTHETIC_HTTP_ATTEMPTS:${requests}`,...statuses.map(status=>`SYNTHETIC_HTTP_STATUS:${status}`)]},beforeRequest(attempt){diagnosticGuard(deployment);if(++requests>3||attempt!==requests-1)throw Error('DIAGNOSTIC_REQUEST_BUDGET')},validate(){diagnosticGuard(deployment)},destination(logical,attempt){
  // destination() is also used for provenance after success; it must be side-effect free.
  diagnosticGuard(deployment);if(logical!==diagnosticLocator||!Number.isInteger(attempt)||attempt<0||attempt>2)throw Error('DIAGNOSTIC_DESTINATION')
  const ticket:Ticket={deployment,lease,source:diagnosticSource,scenario,attempt,expires:Math.min(gate.expiry,Date.now()+65000)}
  const body=Buffer.from(JSON.stringify(ticket)).toString('base64url')
  return {url:new URL(fixturePath,gate.origin),headers:{'x-twuanis-fixture':body+'.'+signature(body,gate.secret),'x-twuanis-worker':workerToken,'x-vercel-protection-bypass':process.env.VERCEL_AUTOMATION_BYPASS_SECRET!}}
 }}
}
export async function authorizeFixture(request:Request){
 const token=request.headers.get('x-twuanis-fixture')||'';if(token.length>2048)throw Error('FIXTURE_DENIED')
 const parts=token.split('.');if(parts.length!==2)throw Error('FIXTURE_DENIED')
 const ticket:Ticket=JSON.parse(Buffer.from(parts[0],'base64url').toString());const gate=diagnosticGuard(ticket.deployment)
 const expected=Buffer.from(signature(parts[0],gate.secret)),provided=Buffer.from(parts[1]);if(provided.length!==expected.length||!timingSafeEqual(provided,expected)||Object.keys(ticket).sort().join(',')!=='attempt,deployment,expires,lease,scenario,source'||ticket.source!==diagnosticSource||!uuid.test(ticket.lease)||!diagnosticScenarios.includes(ticket.scenario)||!Number.isInteger(ticket.attempt)||ticket.attempt<0||ticket.attempt>2||!Number.isFinite(ticket.expires)||ticket.expires<=Date.now()||ticket.expires>gate.expiry||new URL(request.url).origin!==gate.origin||new URL(request.url).pathname!==fixturePath||new URL(request.url).search)throw Error('FIXTURE_DENIED')
 const workerToken=request.headers.get('x-twuanis-worker');if(!workerToken||workerToken.length>4096)throw Error('FIXTURE_DENIED')
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+workerToken}}})
 const user=await db.auth.getUser(workerToken);if(user.error||user.data.user?.id!==diagnosticWorker)throw Error('FIXTURE_DENIED')
 const checked=await db.rpc('remate_retrieval_worker',{p_request:ticket.lease,p_source:diagnosticSource,p_operation:'check',p_data:{lease:ticket.lease}});if(checked.error||checked.data?.ok!==true)throw Error('FIXTURE_DENIED')
 return ticket
}
