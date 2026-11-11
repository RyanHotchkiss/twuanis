import { stagingDeliveryBlocked } from '@/lib/staging-identity'
import 'server-only'

import {
  Resend
} from 'resend'

function getResendClient() {
  if (stagingDeliveryBlocked()) throw new Error('Staging email delivery disabled')
  const apiKey =
    process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured.'
    )
  }

  return new Resend(
    apiKey
  )
}

export async function sendTestEmail() {
  const emailFrom =
    process.env.EMAIL_FROM

  if (!emailFrom) {
    throw new Error(
      'EMAIL_FROM is not configured.'
    )
  }

  const resend =
    getResendClient()

  const {
    data,
    error
  } =
    await resend.emails.send({
      from:
        emailFrom,

      to:
        'ryanjonhotchkiss@gmail.com',

      subject:
        'Twuanis Email Test',

      html: `
        <h2>Twuanis</h2>
        <p>Your email system is working.</p>
      `
    })

  if (error) {
    throw new Error(
      error.message
    )
  }

  return data
}
// Stable plain-text operational payload; no customer/credential/banking fields.
export async function sendSinpePurchaseNotification(orderId:string,payload:Record<string,unknown>):Promise<string>{
 const from=process.env.EMAIL_FROM;if(!from)throw Error('Email unavailable')
 const fields=['nameEN','productId','productClass','unit','quantity','durationDays','termKind','amount','currency','orderId','receivedAt','confirmedAt','payment','fulfillment','startsAt','endsAt','asOf']
 const duration=payload.productClass==='PACKAGE'?(payload.unit==='day'?'24 consecutive hours':'One continuous calendar month'):payload.productClass==='FOUNDING_MEMBERSHIP'?'Lifetime':payload.durationDays?`${payload.durationDays} days`:'Product-specific term / operation'
 const text='Twuanis paid SINPE purchase\nDuration: '+duration+'\nStatus as of the timestamp below. Fulfillment is separate from payment.\n'+fields.map(k=>`${k}: ${payload[k]??'not available'}`).join('\n')
 const {data,error}=await getResendClient().emails.send({from,to:'ryanjonhotchkiss@gmail.com',subject:'Twuanis — paid SINPE purchase',text},{idempotencyKey:'sinpe-order-'+orderId})
 if(error||!data?.id)throw Error('Email delivery not confirmed');return data.id
}

// Separate Auth obligation; shares only Resend transport with commerce.
export async function sendConfirmedAccountNotification(payload:{accountId:string;email:string;createdAt:string;confirmedAt:string;language:string|null}):Promise<string>{
 const from=process.env.EMAIL_FROM;if(!from)throw Error('Email unavailable')
 const text=['A new customer has completed registration and confirmed their email address.',`Email: ${payload.email}`,`Account created: ${payload.createdAt}`,`Email confirmed: ${payload.confirmedAt}`,`Account identifier: ${payload.accountId}`,`Registration language: ${payload.language??'not available'}`].join('\n')
 const {data,error}=await getResendClient().emails.send({from,to:'ryanjonhotchkiss@gmail.com',subject:'Twuanis: New Account Registered',text},{idempotencyKey:'confirmed-account-'+payload.accountId})
 if(error||!data?.id)throw Error('Email delivery not confirmed');return data.id
}

// Publication shares the existing Resend transport; token and lifecycle authority remain unchanged.
export async function sendPublicationEmail({to,token,language}:{to:string;token:string;language:'en'|'es'}):Promise<string>{
 const from=process.env.EMAIL_FROM;if(!from)throw Error('Email unavailable')
 const origin=new URL(process.env.TWUANIS_APP_ORIGIN||'https://twuanis.com')
 if(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)))throw Error('Invalid application origin')
 const link=new URL('/publish-listing/'+token,origin);link.searchParams.set('lang',language)
 const es=language==='es'
 const text=es?'Confirme la publicación de su anuncio en Twuanis. Inicie sesión con esta misma cuenta y abra el enlace dentro de las 24 horas de crear la sesión. No se requiere comprar ni pagar.\n\n'+link.href+'\n\nSi usted no solicitó publicar un anuncio, ignore este mensaje.':'Confirm your Twuanis listing publication. Sign in with this same account and open the link within 24 hours of creating the session. No purchase or payment is required.\n\n'+link.href+'\n\nIf you did not request this listing, ignore this message.'
 const {data,error}=await getResendClient().emails.send({from,to,subject:es?'Twuanis — confirme la publicación de su anuncio':'Twuanis — confirm your listing publication',text},{idempotencyKey:'publication-link-'+token})
 if(error||!data?.id)throw Error('Email delivery not confirmed');return data.id
}

// One authorized operational probe; destination and content are server constants.
export async function sendOwnerSupportDeliveryTest():Promise<string>{
 const from=process.env.EMAIL_FROM;if(!from)throw Error('EMAIL_UNAVAILABLE')
 const {data,error}=await getResendClient().emails.send({from,to:'soporte@twuanis.com',replyTo:'soporte@twuanis.com',subject:'Twuanis — prueba controlada de entrega transaccional',text:'Prueba única autorizada de entrega de correo transaccional de Twuanis. Este mensaje verifica la recepción en soporte@twuanis.com. No representa una compra, publicación ni activación. El envío general a clientes permanece deshabilitado.'},{idempotencyKey:'twuanis-owner-support-test-20261022-r1'})
 if(error||!data?.id)throw Error('PROVIDER_NOT_CONFIRMED');return data.id
}

// Customer obligations share the verified existing transport; Owner senders above are unchanged.
export async function sendCustomerTransactionalEmail(envelope:import('./customer-email/templates').CustomerEmailEnvelope,idempotencyKey:string):Promise<{id:string}>{
 const {data,error}=await getResendClient().emails.send(envelope,{idempotencyKey})
 if(error){
  const safeNames=new Set(['invalid_idempotency_key','validation_error','missing_api_key','restricted_api_key','invalid_api_key','invalid_idempotent_request','concurrent_idempotent_requests','invalid_from_address','invalid_access','invalid_parameter','invalid_region','missing_required_field','monthly_quota_exceeded','daily_quota_exceeded','rate_limit_exceeded','security_error','application_error','internal_server_error'])
  throw Error('RESEND_'+(safeNames.has(error.name)?error.name:'application_error'))
 }
 if(!data?.id)throw Error('PROVIDER_ACK_MISSING')
 return {id:data.id}
}

// Owner-authorized one-use live webhook acceptance; no browser-supplied message data.
export async function sendOwnerWebhookAcceptanceTest():Promise<string>{
 const from=process.env.EMAIL_FROM;if(!from||!process.env.RESEND_WEBHOOK_SECRET)throw Error('EMAIL_UNAVAILABLE')
 const {data,error}=await getResendClient().emails.send({from,to:'rynjnhtchkss@gmail.com',replyTo:'soporte@twuanis.com',subject:'Twuanis — prueba controlada de recepción y webhook',text:'Prueba única autorizada para verificar la entrega de correo y el webhook firmado de Resend. Este mensaje no representa una compra ni una activación. El envío general de notificaciones a clientes permanece deshabilitado.'},{idempotencyKey:'twuanis-owner-webhook-acceptance-20261022-r1'})
 if(error||!data?.id)throw Error('PROVIDER_NOT_CONFIRMED');return data.id
}

export async function sendListingDuplicateNotification(caseId:string):Promise<string>{
 if(!/^[0-9a-f-]{36}$/i.test(caseId))throw Error('Invalid case')
 const from=process.env.EMAIL_FROM;if(!from)throw Error('Email unavailable')
 const link=new URL('/admin',process.env.TWUANIS_APP_ORIGIN||'https://twuanis.com');link.searchParams.set('workspace','duplicates');link.searchParams.set('case',caseId)
 const {data,error}=await getResendClient().emails.send({from,to:'ryanjonhotchkiss@gmail.com',subject:'Twuanis: Listing requires duplicate review',text:'A submitted listing requires review. Open the authenticated Owner comparison:\n'+link.href},{idempotencyKey:'listing-duplicate-'+caseId})
 if(error||!data?.id)throw Error('Email delivery unconfirmed');return data.id
}
