import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Application deletion preserves canonical history. Administrative purge is separate.
export async function POST() {
  return NextResponse.json({ success: false, error: 'Permanent listing deletion has been retired.' }, { status: 410 })
}
