import { NextResponse } from 'next/server'

import { sendTestEmail } from '@/lib/email'

export async function GET() {
  await sendTestEmail()

  return NextResponse.json({
    success: true
  })
}