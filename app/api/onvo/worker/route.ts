import {after} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {dispatchPendingMeasurement} from '@/lib/measurement/operations'
import {OnvoAutomation,onvoAutomationEnabled,onvoConfiguration,workerAuthorized,deliverSinpeNotification} from '@/lib/providers/onvo-automation'
export const runtime='nodejs'
export const maxDuration=50
export async function POST(request:Request){if(!onvoAutomationEnabled())return Response.json({error:'unavailable'},{status:503});if(!workerAuthorized(request.headers.get('authorization')))return Response.json({error:'unauthorized'},{status:401});try{const service=new OnvoAutomation(onvoConfiguration());const result=await service.run();try{after(async()=>{try{await dispatchPendingMeasurement(supabaseAdmin)}catch{}})}catch{};let notification;try{notification=await deliverSinpeNotification()}catch{notification={state:'RETRY'}}const health=await service.health();return Response.json({...result,notification,health})}catch{return Response.json({error:'worker_unavailable'},{status:503})}}
