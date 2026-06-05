import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {

  const formData = await req.formData()

  const from = String(
    formData.get('From') || ''
  )

  const body = String(
    formData.get('Body') || ''
  )

  console.log('FROM:', from)
  console.log('BODY:', body)

  if (
    body.trim().toUpperCase() === 'PURA VIDA'
  ) {

    const phone = from
      .replace('whatsapp:+506', '')
      .replace('whatsapp:+', '')

    await supabase
      .from('verified_whatsapp_numbers')
      .upsert({
        phone,
        verified: true
      })

    console.log(
      'VERIFIED PHONE:',
      phone
    )

  }

  return new NextResponse('OK', {
    status: 200
  })
} 