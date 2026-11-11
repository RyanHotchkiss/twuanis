import 'server-only'
import {supabaseAdmin} from './supabase-admin'
import {sendListingDuplicateNotification} from './email'
export async function deliverListingDuplicateNotification(){
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return {state:'UNCONFIGURED'}
 const c=await supabaseAdmin.rpc('listing_duplicate_notification_service',{p_operation:'claim'}).abortSignal(AbortSignal.timeout(3000))
 if(c.error)throw Error('Duplicate notification unavailable');if(!c.data)return {state:'EMPTY'}
 let messageId:string|null=null
 let timer:ReturnType<typeof setTimeout>|undefined
 try{messageId=await Promise.race([sendListingDuplicateNotification(c.data.caseId),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('notification_timeout')),5000)})])}catch{}finally{if(timer)clearTimeout(timer)}
 const f=await supabaseAdmin.rpc('listing_duplicate_notification_service',{p_operation:'finish',p_case:c.data.caseId,p_command:{token:c.data.token,messageId}}).abortSignal(AbortSignal.timeout(3000))
 if(f.error)throw Error('Duplicate notification completion unavailable')
 return {state:messageId?'ACCEPTED':'RETRY'}
}
