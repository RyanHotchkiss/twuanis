import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    const { data, error } = await supabase
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: 'Invalid code',
      })
    }

    const now = new Date()
    const expiresAt = new Date(data.expires_at)

    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Code expired',
      })
    }

    await supabase
      .from('whatsapp_otps')
      .update({
        verified: true,
      })
      .eq('id', data.id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json({
      success: false,
      error: 'Server error',
    })
  }
}