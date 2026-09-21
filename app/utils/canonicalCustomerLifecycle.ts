import type { SupabaseClient } from '@supabase/supabase-js'

type Event = 'unpublish' | 'archive' | 'restore' | 'delete'
const statuses = { unpublish: 'draft', archive: 'archived', restore: 'draft', delete: 'deleted' } as const

// Public RPC derives authority from auth.uid(); the browser cannot grant authority.
export async function changeCustomerListingLifecycle(supabase: SupabaseClient, listingId: string, event: Event) {
  if (!Object.hasOwn(statuses, event)) throw new Error('Unsupported lifecycle operation.')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Authentication required.')
  const { data: row, error } = await supabase.from('listings')
    .select('id,owner_id,title,listing_status,transaction_type,canonical_domain_version,canonical_revision::text')
    .eq('id', listingId).eq('owner_id', user.id).single()
  if (error || !row || row.owner_id !== user.id) throw new Error('Owned listing could not be confirmed.')
  if (row.canonical_domain_version !== 1 || typeof row.canonical_revision !== 'string' || !/^\d{1,19}$/.test(row.canonical_revision)) {
    throw new Error('Confirmed canonical identity and revision required.')
  }
  const key = `twuanis:lifecycle:${user.id}:${listingId}:${event}`
  const stored = window.localStorage.getItem(key)
  const attempt = stored ? JSON.parse(stored) : { requestId: crypto.randomUUID(), expectedRevision: row.canonical_revision }
  if (typeof attempt.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(attempt.requestId) ||
      typeof attempt.expectedRevision !== 'string' || !/^\d{1,19}$/.test(attempt.expectedRevision)) throw new Error('Invalid pending lifecycle request.')
  window.localStorage.setItem(key, JSON.stringify(attempt))
  const { data: result, error: writeError } = await supabase.rpc('mutate_customer_canonical_listing', {
    p_listing: listingId, p_expected: attempt.expectedRevision, p_request: attempt.requestId,
    p_domains: { lifecycle: { event } }
  })
  if (writeError || result?.listing_id !== listingId) throw new Error(writeError?.message || 'Lifecycle result was not confirmed. Retry the same operation.')
  window.localStorage.removeItem(key)
  return { id: row.id, title: row.title, transaction_type: row.transaction_type, listing_status: statuses[event] }
}
