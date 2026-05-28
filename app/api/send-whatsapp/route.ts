import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(req: Request) {

  try {

    const { phone, code } = await req.json()

    const cleanedPhone =
      phone.replace(/\D/g, '')

    const formattedPhone =
      cleanedPhone.startsWith('506')
        ? `+${cleanedPhone}`
        : `+506${cleanedPhone}`

    const message =
      await client.messages.create({

        from:
          process.env
            .TWILIO_WHATSAPP_NUMBER!,

        to:
          `whatsapp:${formattedPhone}`,

        body:
          `Your Twuanis verification code is: ${code}`

      })

    return NextResponse.json({

      success: true,

      sid: message.sid

    })

  } catch (error: any) {

    console.error(error)

    return NextResponse.json({

      success: false,

      error: error.message

    })

  }

}