import {OnvoAutomation,onvoAutomationEnabled,onvoConfiguration,boundedOnvoBody} from '@/lib/providers/onvo-automation'
export const runtime='nodejs'
export async function POST(request:Request){if(!onvoAutomationEnabled())return Response.json({error:'unavailable'},{status:503});try{const service=new OnvoAutomation(onvoConfiguration());await service.ingest(await boundedOnvoBody(request),request.headers.get('X-Webhook-Secret'));return Response.json({accepted:true},{status:202})}catch{return Response.json({error:'event_not_accepted'},{status:400})}}
