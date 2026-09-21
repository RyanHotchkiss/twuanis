import type {
  SupabaseClient
} from '@supabase/supabase-js'


type ListingUpdates =
  Record<string, unknown>

type UpdateListingOptions = {
  supabase: SupabaseClient
  listingId: string
  updates: ListingUpdates
}

export async function updateListing({
  supabase,
  listingId,
  updates
}: UpdateListingOptions) {
  throw new Error('Legacy listing editing has been retired. Canonical listings use the canonical edit boundary.')
}
