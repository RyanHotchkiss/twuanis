import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  sendWhatsApp
} from '@/lib/whatsapp'

type PublishTokenRow = {
  id: string
  phone: string
  token: string
  verified: boolean
}

export async function POST(
  request: NextRequest
) {
  try {
    const {
      phone,
      token
    } =
      await request.json()

    if (
      typeof phone !== 'string' ||
      !phone.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Phone required.'
        },
        {
          status: 400
        }
      )
    }

    if (
      typeof token !== 'string' ||
      !token.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Publish token required.'
        },
        {
          status: 400
        }
      )
    }

    const normalizedPhone =
      phone.trim()

    const normalizedToken =
      token.trim()

    const {
      data,
      error
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .select(`
          id,
          phone,
          token,
          verified
        `)
        .eq(
          'token',
          normalizedToken
        )
        .single()

    if (
      error ||
      !data
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This publishing session does not exist.'
        },
        {
          status: 404
        }
      )
    }

    const publishToken =
      data as PublishTokenRow

    if (
      publishToken.phone !==
      normalizedPhone
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The WhatsApp number does not match this publishing session.'
        },
        {
          status: 403
        }
      )
    }

    if (publishToken.verified) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This listing has already been published.'
        },
        {
          status: 409
        }
      )
    }

    await sendWhatsApp({
      to:
        normalizedPhone,

      body:
        normalizedToken
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error(
      'SEND PUBLISH LINK ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The WhatsApp publishing link could not be sent.'
      },
      {
        status: 500
      }
    )
  }
}