import { NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  const result = await sendWhatsApp({
    to: '+50684479916',
    body: 'Twuanis reusable WhatsApp utility working.',
  })

  return NextResponse.json(result)
}