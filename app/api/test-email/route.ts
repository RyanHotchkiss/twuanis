import {assertOwner} from '@/lib/administrative-control'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {sendOwnerWebhookAcceptanceTest} from '@/lib/email'
export const runtime='nodejs'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
export async function GET(){return reply({error:'gone'},410)}
export async function POST(request:Request){
 let actor;try{actor=await assertOwner()}catch{return reply({error:'forbidden'},403)}
 if(request.headers.get('origin')!=='https://twuanis.com'||(await request.text()).length!==0)return reply({error:'invalid_request'},400)
 const claim=await supabaseAdmin.rpc('owner_webhook_acceptance_test',{p_operation:'claim',p_actor:actor.actorId,p_token:null,p_message:null})
 if(claim.error)return reply({error:'test_unavailable'},503)
 if(!claim.data?.token)return reply({error:'already_disabled'},409)
 let message:string|null=null;try{message=await sendOwnerWebhookAcceptanceTest()}catch{}
 const finish=await supabaseAdmin.rpc('owner_webhook_acceptance_test',{p_operation:'finish',p_actor:actor.actorId,p_token:claim.data.token,p_message:message})
 // An uncertain result is never retried: the durable reservation remains consumed.
 if(finish.error)return reply({state:'CONSUMED_RESULT_UNCERTAIN',providerMessageId:message},503)
 return reply({state:message?'PROVIDER_ACCEPTED':'PROVIDER_NOT_CONFIRMED',providerMessageId:message,temporaryCapability:'DISABLED',generalDelivery:'DISABLED'},message?200:502)
}
