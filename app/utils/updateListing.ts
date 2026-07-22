import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  recordListingUpdated
} from '@/lib/activity'

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
  if (!listingId) {
    throw new Error(
      'A listing ID is required.'
    )
  }

  const updatedFields =
    Object.keys(updates)

  if (updatedFields.length === 0) {
    throw new Error(
      'At least one listing field must be updated.'
    )
  }

  const {
    data: existingListing,
    error: existingListingError
  } = await supabase
    .from('listings')
    .select(
      'id, title, listing_status, transaction_type'
    )
    .eq('id', listingId)
    .single()

  if (existingListingError) {
    throw existingListingError
  }

  const {
    data: updatedListing,
    error: updateError
  } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', listingId)
    .select()
    .single()

  if (updateError) {
    throw updateError
  }

  await recordListingUpdated({
    listingId: updatedListing.id,
    metadata: {
      title:
        updatedListing.title ??
        existingListing.title,
      updatedFields,
      previousStatus:
        existingListing.listing_status,
      status:
        updatedListing.listing_status,
      transactionType:
        updatedListing.transaction_type
    }
  })

  return updatedListing
}