import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  return Response.json({
    status: 'ok'
  })
}

export async function POST(
  req: NextRequest
) {

  console.log('WEBHOOK HIT')

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

    const result = await supabase
      .from('verified_whatsapp_numbers')
      .upsert({
        phone,
        verified: true
      })

    console.log(
      'SUPABASE RESULT:',
      JSON.stringify(result, null, 2)
    )

    console.log(
      'VERIFIED PHONE:',
      phone
    )
  }

  return new NextResponse(
    'OK',
    { status: 200 }
  )
}