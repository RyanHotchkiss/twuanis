import {createHash,timingSafeEqual} from 'node:crypto'
import {processRematesAlerts} from '@/lib/remates/alerts'

export const runtime='nodejs'
export const maxDuration=15

// Explicitly opt in to IN_APP scheduling; this does not authorize external delivery.
function schedulingEnabled(){
  const e=process.env,environment=e.TWUANIS_ENVIRONMENT
  if(e.TWUANIS_REMATES_ALERTS_SCHEDULING!=='enabled'||!['staging','production'].includes(environment||'')||e.NEXT_PUBLIC_TWUANIS_ENVIRONMENT!==environment)return false
  return environment!=='staging'||(e.VERCEL_PROJECT_ID==='prj_FVMLa40NeWsYgAFcHVHpUgolBgro'&&e.TWUANIS_STAGING_PROJECT_REF==='zryfurtogxvrnilnnadn'&&e.NEXT_PUBLIC_SUPABASE_URL==='https://zryfurtogxvrnilnnadn.supabase.co')
}

export async function GET(request:Request){
  const secret=process.env.CRON_SECRET,header=request.headers.get('authorization')
  const headers={'Cache-Control':'no-store'}
  if(!secret||secret.length<32||!header||header.length>1024||!timingSafeEqual(createHash('sha256').update(header).digest(),createHash('sha256').update('Bearer '+secret).digest()))return Response.json({error:'unauthorized'},{status:401,headers})
  if(!schedulingEnabled())return Response.json({error:'remates_alerts_scheduling_disabled'},{status:503,headers})
  try{
    return Response.json(await processRematesAlerts(AbortSignal.timeout(10000)),{headers})
  }catch{
    // No in-request retry: a subsequent scheduled invocation uses canonical DB deduplication.
    return Response.json({error:'remates_alerts_unavailable'},{status:503,headers})
  }
}
