import { NextResponse } from 'next/server'

// Synthetic saved-analysis experiments belong in offline verification, never a GET that mutates customer records.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
}
