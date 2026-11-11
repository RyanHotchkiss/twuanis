import {after} from 'next/server'
import {POST as runExistingWorker} from '../worker/route'
import {OnvoAutomation,onvoAutomationEnabled,onvoConfiguration,boundedOnvoBody} from '@/lib/providers/onvo-automation'
export const runtime='nodejs'
export async function POST(request:Request){
 if(!onvoAutomationEnabled())return Response.json({error:'unavailable'},{status:503})
 try{
  const service=new OnvoAutomation(onvoConfiguration())
  await service.ingest(await boundedOnvoBody(request),request.headers.get('X-Webhook-Secret'))
  // Ingestion queues a hint; the existing protected worker owns provider verification,
  // fulfillment, notifications and consent-governed outcome delivery. No new scheduler.
  try{after(async()=>{
   const secret=process.env.ONVO_WORKER_SECRET
   if(!secret){console.error('ONVO queued work awaits configured worker');return}
   try{const result=await runExistingWorker(new Request(new URL('/api/onvo/worker',request.url),{method:'POST',headers:{authorization:'Bearer '+secret}}));if(!result.ok)console.error('ONVO queued work awaits retry')}catch{console.error('ONVO queued work awaits retry')}
  })}catch{console.error('ONVO queued work awaits retry')}
  return Response.json({accepted:true},{status:202})
 }catch{return Response.json({error:'event_not_accepted'},{status:400})}
}
