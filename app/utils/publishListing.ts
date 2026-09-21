import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  recordListingPublished
} from '@/lib/activity'

type PublishListingOptions = {
  supabase: SupabaseClient
  listingId: string
}

export async function publishListing({
  supabase,
  listingId
}: PublishListingOptions) {
  // S7: no surviving callers; active flows use token publication or manageListing.
  rejectRetiredWriter()

  if (!listingId) {
    throw new Error(
      'A listing ID is required.'
    )
  }

  const {
    data: listing,
    error
  } = await supabase
    .from('listings')
    .update({
      listing_status: 'active'
    })
    .eq('id', listingId)
    .select(
      'id, title, listing_status, transaction_type'
    )
    .single()

  if (error) {
    throw error
  }

  await recordListingPublished({
    listingId: listing.id,
    metadata: {
      title: listing.title,
      status: listing.listing_status,
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
