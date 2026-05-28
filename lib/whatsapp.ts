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
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${to}`,
      body,
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