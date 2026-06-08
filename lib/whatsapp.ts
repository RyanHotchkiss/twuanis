import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp({
  to,
  body,
}: {
  to: string
  body: string
}) {
  try {

console.log('TWILIO ACCOUNT SID:', process.env.TWILIO_ACCOUNT_SID)
console.log('TWILIO WHATSAPP NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER)
console.log('TWILIO TO:', `whatsapp:+506${to}`)

console.log(
  'CONTENT VARIABLES:',
  JSON.stringify({
    1: body
  })
)

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:+506${to}`,
      contentSid: 'HX7b16956a26f1d43a6ef77784cba5ab98',

      contentVariables: JSON.stringify({
        1: body
      })
    })

    console.log('WhatsApp sent:', message.sid)

    return {
      success: true,
      sid: message.sid,
    }
  } catch (error) {
    console.error('WhatsApp error:', error)

    return {
      success: false,
      error,
    }
  }
} 