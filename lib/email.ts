import 'server-only'

import {
  Resend
} from 'resend'

function getResendClient() {
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