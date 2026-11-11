import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveUserPackageUsage } from '@/lib/package-usage'

export async function completeDuplicateMedia(
  admin: SupabaseClient, customer: SupabaseClient, ownerId: string,
  sourceId: string, requestId: string
) {
  const prepared = await customer.rpc('prepare_customer_duplicate', { p_source: sourceId, p_request: requestId })
  if (prepared.error) throw new Error(prepared.error.message)
  const plan = prepared.data
  if (!plan || typeof plan.listing_id !== 'string') throw new Error('Duplicate identity was not confirmed. Retry the same request.')
  const listingId = plan.listing_id as string
  const incomplete = () => ({ id: listingId, mediaStatus: 'incomplete' as const,
    warning: 'The duplicate draft was created, but its images are incomplete. Retry media completion for this draft.' })
  try {
    if (plan.completed === true) return { id: listingId, mediaStatus: 'complete' as const }
    if (!Array.isArray(plan.media) || plan.media.length > 25) return incomplete()
    const bucket = admin.storage.from('listings-images')
    for (const entry of plan.media) {
      if (typeof entry.source !== 'string' || typeof entry.destination !== 'string' ||
          !entry.source.startsWith(`${ownerId}/${sourceId}/`) ||
          !entry.destination.startsWith(`${ownerId}/${listingId}/`)) return incomplete()
      const existing = await bucket.info(entry.destination)
      if (!existing.error && existing.data) continue
      // A timeout/authorization failure is not proof of absence.
      if (String(existing.error?.statusCode) !== '404') return incomplete()
      const source = await bucket.info(entry.source)
      if (source.error || !source.data || typeof source.data.size !== 'number' || !Number.isSafeInteger(source.data.size) || source.data.size < 0) return incomplete()
      const usage = await resolveUserPackageUsage({ supabase: admin, userId: ownerId })
      if (usage.storageLimitBytes !== null && usage.storageUsedBytes + source.data.size > usage.storageLimitBytes) return incomplete()
      // No overwrite, removal or compensation: an uncertain successful copy is reused on retry.
      const copied = await bucket.copy(entry.source, entry.destination)
      if (copied.error) return incomplete()
    }
    const attached = await admin.rpc('attach_customer_duplicate_media', { p_listing: listingId })
    if (attached.error || attached.data?.completed !== true) return incomplete()
    return { id: listingId, mediaStatus: 'complete' as const }
  } catch {
    return incomplete()
  }
}
