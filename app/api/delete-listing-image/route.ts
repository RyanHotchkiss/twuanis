import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
    if (!token) return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 })
    const customer = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user }, error } = await customer.auth.getUser(token)
    if (error || !user) return NextResponse.json({ success: false, error: 'Session could not be verified.' }, { status: 401 })
    const body = await request.json()
    const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
    const retry = body.operationId !== undefined
    if (retry ? typeof body.operationId !== 'string' || !uuid.test(body.operationId)
      : typeof body.listingId !== 'string' || !uuid.test(body.listingId) || typeof body.imageValue !== 'string' || !body.imageValue.trim()) {
      return NextResponse.json({ success: false, error: 'Valid image deletion identity required.' }, { status: 400 })
    }
    // Retry resolves the immutable server record; browser paths/listing IDs cannot replace it.
    const detached = retry
      ? await supabaseAdmin.rpc('get_image_detach_operation', { p_owner: user.id, p_operation: body.operationId })
      : await supabaseAdmin.rpc('detach_listing_image', { p_owner: user.id, p_listing: body.listingId, p_image: body.imageValue.trim() })
    if (detached.error || !detached.data) {
      return NextResponse.json({ success: false, status: 'DETACH_NOT_CONFIRMED', error: 'Detachment was not confirmed. No storage cleanup was attempted.' }, { status: 409 })
    }
    const op = detached.data
    if (op.owner_id !== user.id || typeof op.id !== 'string' || typeof op.image_value !== 'string' ||
      (retry && ((body.listingId !== undefined && body.listingId !== op.listing_id) || (body.imageValue !== undefined && body.imageValue !== op.image_value)))) {
      return NextResponse.json({ success: false, error: 'Detach identity mismatch.' }, { status: 403 })
    }
    const result = (complete: boolean) => NextResponse.json({
      success: true, status: complete ? 'DETACH_CONFIRMED' : 'STORAGE_CLEANUP_UNCONFIRMED',
      operationId: op.id, deletedImage: op.image_value,
      deletedStorageObject: op.managed === true && complete,
      storageCleanup: op.managed !== true ? 'NOT_APPLICABLE' : complete ? 'CONFIRMED' : 'PENDING_UNCONFIRMED',
      storageCleanupPending: !complete, images: op.images, imageCount: op.imageCount,
      ...(!complete ? { warning: 'The image remains detached. Storage cleanup is unconfirmed; retry this operation ID.' } : {})
    })
    if (op.cleanup_completed === true || op.managed === false) return result(true)
    if (op.managed !== true || !new RegExp(`^${user.id}/${op.listing_id}/[a-zA-Z0-9_-]+[.]jpg$`).test(op.image_value)) return result(false)
    try {
      const removed = await supabaseAdmin.storage.from('listings-images').remove([op.image_value])
      if (removed.error) return result(false)
      const confirmed = await supabaseAdmin.rpc('confirm_image_cleanup', { p_owner: user.id, p_operation: op.id })
      return result(!confirmed.error)
    } catch {
      // Detachment already committed. No old image array is ever restored.
      return result(false)
    }
  } catch {
    return NextResponse.json({ success: false, status: 'DETACH_NOT_CONFIRMED', error: 'Detachment could not be confirmed. Retry the same request.' }, { status: 500 })
  }
}
