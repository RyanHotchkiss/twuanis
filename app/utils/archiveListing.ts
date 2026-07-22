import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  recordListingArchived
} from '@/lib/activity'

type ArchiveListingOptions = {
  supabase: SupabaseClient
  listingId: string
}

export async function archiveListing({
  supabase,
  listingId
}: ArchiveListingOptions) {
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
      listing_status: 'archived'
    })
    .eq('id', listingId)
    .select(
      'id, title, listing_status, transaction_type'
    )
    .single()

  if (error) {
    throw error
  }

  await recordListingArchived({
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