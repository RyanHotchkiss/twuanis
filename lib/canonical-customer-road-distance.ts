import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// New, explicitly selected customer input only. Never parse legacy projections.
const ranges = {
  under_100m: ['0', '100', true, false],
  '100_500m': ['100', '500', true, false],
  '500_1000m': ['500', '1000', true, false],
  '1_5km': ['1000', '5000', true, true],
  over_5km: ['5000', null, false, false],
} as const

export function customerRoadDistanceRange(option: unknown) {
  if (typeof option !== 'string' || !Object.prototype.hasOwnProperty.call(ranges, option)) {
    throw new Error('Select an explicit valid road-distance range.')
  }
  const [lower, upper, lower_inclusive, upper_inclusive] = ranges[option as keyof typeof ranges]
  return { kind: 'range' as const, lower, upper, lower_inclusive, upper_inclusive }
}

// This adapter deliberately accepts an explicit range selection, not a complete
// legacy form or inferred distance. An omitted selection never replaces existing
// exact/range evidence. The wider customer-edit coordinator is still pending.
export async function applyCustomerRoadDistanceEdit(customer: SupabaseClient, input: {
  listingId: string; requestId: string; expectedRevision: string; selectedRange?: unknown
}) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(input.listingId) || !uuid.test(input.requestId) ||
      typeof input.expectedRevision !== 'string' || !/^[1-9][0-9]{0,18}$/.test(input.expectedRevision) ||
      BigInt(input.expectedRevision) > BigInt('9223372036854775807')) throw new Error('Explicit edit identity and revision required.')
  const { data: { user }, error: authError } = await customer.auth.getUser()
  if (authError || !user) throw new Error('Authentication required.')
  const { data: listing, error } = await customer.from('listings')
    .select('id,owner_id,canonical_domain_version').eq('id', input.listingId).eq('owner_id', user.id).maybeSingle()
  if (error || !listing || listing.owner_id !== user.id || listing.canonical_domain_version !== 1) {
    throw new Error('Confirmed owned canonical listing required.')
  }
  if (input.selectedRange === undefined) return { listing_id: input.listingId, unchanged: true }
  const range = customerRoadDistanceRange(input.selectedRange)
  const result = await customer.rpc('mutate_customer_canonical_listing', {
    p_listing: input.listingId, p_expected: input.expectedRevision, p_request: input.requestId,
    p_domains: { facts: { distance_to_paved_road: range } },
  })
  if (result.error) throw new Error(result.error.message)
  if (result.data?.listing_id !== input.listingId) throw new Error('Canonical edit result was not confirmed. Retry the same request.')
  return result.data
}
