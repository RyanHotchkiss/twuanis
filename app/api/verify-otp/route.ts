import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest
) {
  try {
    const {
      phone,
      code
    } =
      await req.json()

    const {
      data,
      error
    } =
      await supabaseAdmin
        .from(
          'whatsapp_otps'
        )
        .select(`
          id,
          expires_at
        `)
        .eq(
          'phone',
          phone
        )
        .eq(
          'code',
          code
        )
        .eq(
          'verified',
          false
        )
        .single()

    if (
      error ||
      !data
    ) {
      return NextResponse.json({
        success: false,
        error:
          'Invalid code'
      })
    }

    const now =
      new Date()

    const expiresAt =
      new Date(
        data.expires_at
      )

    if (
      now >
      expiresAt
    ) {
      return NextResponse.json({
        success: false,
        error:
          'Code expired'
      })
    }

    const {
      error: updateError
    } =
      await supabaseAdmin
        .from(
          'whatsapp_otps'
        )
        .update({
          verified: true
        })
        .eq(
          'id',
          data.id
        )

    if (updateError) {
      console.error(
        'OTP VERIFY UPDATE ERROR:',
        updateError
      )

      return NextResponse.json({
        success: false,
        error:
          'Server error'
      })
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error(
      'OTP VERIFY ROUTE ERROR:',
      error
    )

    return NextResponse.json({
      success: false,
      error:
        'Server error'
    })
  }
}