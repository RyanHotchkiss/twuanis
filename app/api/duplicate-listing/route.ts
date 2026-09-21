import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { completeDuplicateMedia } from '@/lib/duplicate-listing-media'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
    if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const customer = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: { user }, error } = await customer.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const body = await request.json()
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuid.test(body.listingId) || !uuid.test(body.requestId)) return NextResponse.json({ error: 'Listing and request identity required.' }, { status: 400 })
    const result = await completeDuplicateMedia(supabaseAdmin, customer, user.id, body.listingId, body.requestId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Duplication failed. Retry the same request.' }, { status: 409 })
  }
}
