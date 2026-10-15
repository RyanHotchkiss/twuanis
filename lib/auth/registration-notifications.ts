import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendConfirmedAccountNotification } from '@/lib/email'
export async function deliverRegistrationNotification(){
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return {state:'UNCONFIGURED'}
 const claim=await supabaseAdmin.rpc('confirmed_account_notification_service',{p_operation:'claim',p_command:{}})
 if(claim.error)throw Error('notification_unavailable');if(!claim.data)return {state:'EMPTY'}
 let outcome='RETRY',messageId:string|null=null
 try{messageId=await sendConfirmedAccountNotification(claim.data);outcome='ACCEPTED'}catch{}
 const finish=await supabaseAdmin.rpc('confirmed_account_notification_service',{p_operation:'finish',p_command:{accountId:claim.data.accountId,token:claim.data.token,outcome,messageId}})
 if(finish.error)throw Error('notification_unavailable')
 return {state:outcome}
}
