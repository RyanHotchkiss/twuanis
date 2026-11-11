import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  recordListingDeleted
} from '@/lib/activity'

type DeleteListingOptions = {
  supabase: SupabaseClient
  listingId: string
}

export async function deleteListing({
  supabase,
  listingId
}: DeleteListingOptions) {
  // S7: no surviving callers; active flows use token publication or manageListing.
  rejectRetiredWriter()

  if (!listingId) {
    throw new Error(
      'A listing ID is required.'
    )
  }

  const {
    data: listing,
    error: listingError
  } = await supabase
    .from('listings')
    .select(
      'id, title, listing_status, transaction_type'
    )
    .eq('id', listingId)
    .single()

  if (listingError) {
    throw listingError
  }

  const {
    error: deleteError
  } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)

  if (deleteError) {
    throw deleteError
  }

  await recordListingDeleted({
    listingId: listing.id,
    metadata: {
      title: listing.title,
      previousStatus:
        listing.listing_status,
      transactionType:
        listing.transaction_type
    }
  })

  return listing
}

// Explicit void keeps the retained legacy body type-checkable; execution always stops.
function rejectRetiredWriter(): void {
  throw new Error('This legacy direct writer is retired. Use the current listing workflow.')
}
