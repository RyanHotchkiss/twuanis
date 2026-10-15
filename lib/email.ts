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
