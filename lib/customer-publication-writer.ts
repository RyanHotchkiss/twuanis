import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// The route supplies its verified customer's JWT client, never service credentials.
export async function executeCustomerPublication(
  client: SupabaseClient, listingId: string, event: 'publish' | 'renew',
  body: { requestId?: unknown; expectedRevision?: unknown },
) {
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId) ||
      typeof body.expectedRevision !== 'string' || !/^[0-9]{1,19}$/.test(body.expectedRevision) || BigInt(body.expectedRevision) > BigInt('9223372036854775807')) {
    throw new Error('A stable operation ID and expected canonical revision are required.')
  }
  const { data, error } = await client.rpc('publish_customer_canonical_listing', {
    p_listing: listingId, p_expected: body.expectedRevision,
    p_request: body.requestId, p_event: event,
  })
  if (error) throw new Error(error.message)
  if (!data || data.listing_id !== listingId) throw new Error('Canonical publication returned an invalid result.')
  return data
}
