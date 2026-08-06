import {
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  ListingActivityEventType
} from '@/lib/activity'

export type ListingPerformance = {
  listingId: string
  viewCount: number
  favoriteCount: number
  shareCount: number
  whatsappClickCount: number
  emailInquiryCount: number
}

export type ListingPerformanceMap =
  Map<
    string,
    ListingPerformance
  >

type DatabaseActivityEvent = {
  entity_id:
    | string
    | null

  event_type:
    ListingActivityEventType
    | string
}

type GetListingPerformanceInput = {
  supabase: SupabaseClient
  listingIds: string[]
}

export function createEmptyListingPerformance(
  listingId: string
): ListingPerformance {
  return {
    listingId,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    whatsappClickCount: 0,
    emailInquiryCount: 0
  }
}

export async function getListingPerformance({
  supabase,
  listingIds
}: GetListingPerformanceInput):
  Promise<ListingPerformanceMap> {
  const uniqueListingIds =
    Array.from(
      new Set(
        listingIds.filter(Boolean)
      )
    )

  const performanceByListing:
    ListingPerformanceMap =
      new Map()

  for (
    const listingId
    of uniqueListingIds
  ) {
    performanceByListing.set(
      listingId,
      createEmptyListingPerformance(
        listingId
      )
    )
  }

  if (
    uniqueListingIds.length === 0
  ) {
    return performanceByListing
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'activity_events'
      )
      .select(`
        entity_id,
        event_type
      `)
      .eq(
        'entity_type',
        'listing'
      )
      .in(
        'entity_id',
        uniqueListingIds
      )

  if (error) {
    throw new Error(
      `Listing performance could not be loaded: ${error.message}`
    )
  }

  const activityEvents =
    (
      data ?? []
    ) as DatabaseActivityEvent[]

  for (
    const activityEvent
    of activityEvents
  ) {
    if (
      !activityEvent.entity_id
    ) {
      continue
    }

    const performance =
      performanceByListing.get(
        activityEvent.entity_id
      )

    if (!performance) {
      continue
    }

    switch (
      activityEvent.event_type
    ) {
      case 'listing_viewed':
        performance.viewCount += 1
        break

      case 'listing_saved':
        performance.favoriteCount += 1
        break

      case 'listing_shared':
        performance.shareCount += 1
        break

      case 'listing_whatsapp_clicked':
        performance.whatsappClickCount += 1
        break

      case 'listing_email_inquiry':
        performance.emailInquiryCount += 1
        break

      default:
        break
    }
  }

  return performanceByListing
}