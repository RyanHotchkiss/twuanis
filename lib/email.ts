import 'server-only'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTestEmail() {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: 'ryanjonhotchkiss@gmail.com',
    subject: 'Twuanis Email Test',
    html: `
      <h2>Twuanis</h2>
      <p>Your email system is working.</p>
    `
  })

  if (error) {
    console.error(error)
    return
  }

  console.log(data)
}