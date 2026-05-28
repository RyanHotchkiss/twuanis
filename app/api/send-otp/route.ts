import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    const oneMinuteAgo = new Date(
      Date.now() - 60 * 1000
    ).toISOString()

    const { data: recentOtp } = await supabase
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentOtp && recentOtp.length > 0) {

      return NextResponse.json(
        {
          success: false,
          error: 'Please wait before requesting another code.'
        },
        { status: 429 }
      )
    }

    const oneHourAgo = new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString()

    const { data: otpAttempts } = await supabase
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', oneHourAgo)

    if (otpAttempts && otpAttempts.length >= 5) {

      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please try again later.'
        },
        { status: 429 }
      )
    }

    console.log('OTP PHONE:', phone)

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone required' },
        { status: 400 }
      )
    }

    await supabase
  .from('whatsapp_otps')
  .delete()
  .lt(
    'expires_at',
    new Date().toISOString()
  )

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error } = await supabase
      .from('whatsapp_otps')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {

      console.error(
        'SUPABASE OTP INSERT ERROR:',
        JSON.stringify(error, null, 2)
      )

      return NextResponse.json(
        {
          success: false,
          error: JSON.stringify(error, null, 2)
        },
        { status: 500 }
      )
    }

    await sendWhatsApp({
      to: phone,
      body: `Your Twuanis verification code is: ${code}`,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}