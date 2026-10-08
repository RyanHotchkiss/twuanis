import twilio from 'twilio'
export type WhatsAppOutcome={state:'SENT'|'FAILED'|'UNKNOWN';messageId?:string}
// Shared provider capability only; templates and account-verification authority stay separate.
export async function sendWhatsAppTemplate(to:string,contentSid:string,variables:Record<string,string>):Promise<WhatsAppOutcome>{
 const account=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_WHATSAPP_NUMBER
 if(!account||!token||!from||!/^HX[a-f0-9]{32}$/i.test(contentSid)||!/^\+[1-9][0-9]{1,14}$/.test(to))return {state:'FAILED'}
 try{
  const client=twilio(account,token,{autoRetry:false,timeout:10000})
  const message=await client.messages.create({from,to:`whatsapp:${to}`,contentSid,contentVariables:JSON.stringify(variables)})
  if(!message.sid||['failed','undelivered','canceled'].includes(message.status))return {state:'FAILED'}
  return {state:'SENT',messageId:message.sid}
 }catch(e){
  const status=e&&typeof e==='object'&&'status' in e?Number(e.status):0
  // Timeout/transport/5xx may have been accepted. Never blindly repeat an uncertain send.
  return {state:status>=400&&status<500?'FAILED':'UNKNOWN'}
 }
}
export async function sendWhatsApp({to,body}:{to:string;body:string}){
 // Retained publishing transport: preserve token and existing template; prevent duplicate +506.
 const number=to.trim().startsWith('+')?to.trim():`+506${to.trim()}`
 const outcome=await sendWhatsAppTemplate(number,'HX7b16956a26f1d43a6ef77784cba5ab98',{1:body})
 return {success:outcome.state==='SENT',sid:outcome.messageId,state:outcome.state}
}
