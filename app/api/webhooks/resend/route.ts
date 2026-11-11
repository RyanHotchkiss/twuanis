import {supabaseAdmin} from '@/lib/supabase-admin'
import {verifyCustomerEmailProviderEvent} from '@/lib/customer-email/provider-events'
export const runtime='nodejs'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
export async function POST(request:Request){
 const secret=process.env.RESEND_WEBHOOK_SECRET,key=process.env.RESEND_API_KEY
 if(!secret||!key)return reply({error:'unavailable'},503)
 const reader=request.body?.getReader();if(!reader)return reply({error:'invalid'},400)
 let raw='',size=0;const decoder=new TextDecoder()
 try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>65536){await reader.cancel();return reply({error:'too_large'},413)}raw+=decoder.decode(part.value,{stream:true})}raw+=decoder.decode()}catch{return reply({error:'invalid'},400)}finally{reader.releaseLock()}
 let event;try{event=verifyCustomerEmailProviderEvent(raw,request.headers,secret,key)}catch{return reply({error:'unauthorized'},401)}
 if(!event)return reply({ok:true})
 const result=await supabaseAdmin.rpc('customer_transactional_email_service',{p_operation:'provider_event',p_command:event})
 if(result.error)return reply({error:'unavailable'},503)
 return reply({ok:true})
}
