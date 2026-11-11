import {Resend} from 'resend'
const kinds=new Set(['email.delivered','email.bounced','email.failed','email.suppressed','email.complained','email.delivery_delayed'])
export function verifyCustomerEmailProviderEvent(raw:string,headers:Headers,secret:string,key:string){
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signature=headers.get('svix-signature')
 if(!id||id.length>200||!timestamp||!signature||signature.length>2048)throw Error('INVALID_WEBHOOK')
 const event=new Resend(key).webhooks.verify({payload:raw,headers:{id,timestamp,signature},webhookSecret:secret})
 if(!kinds.has(event.type))return null
 const data=event.data as {email_id?:unknown};if(typeof data.email_id!=='string'||!data.email_id||data.email_id.length>200||!Number.isFinite(Date.parse(event.created_at)))throw Error('INVALID_WEBHOOK')
 return {eventId:id,messageId:data.email_id,kind:event.type,occurredAt:event.created_at}
}
