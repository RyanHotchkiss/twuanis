import {
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  ListingActivityEventType
} from '@/lib/activity'

export type ListingPerformanceHealth =
  | 'excellent'
  | 'good'
  | 'needs-attention'
  | 'dormant'
  | 'insufficient-data'

export type ListingPerformance = {
  listingId: string

  viewCount: number
  favoriteCount: number
  shareCount: number
  whatsappClickCount: number
  emailInquiryCount: number

  totalEngagementCount: number
  totalInquiryCount: number

  favoriteRate: number
  shareRate: number
  whatsappRate: number
  emailInquiryRate: number
  totalEngagementRate: number
  totalInquiryRate: number

  health: ListingPerformanceHealth

  firstActivityAt: string | null
  lastActivityAt: string | null
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
    | ListingActivityEventType
    | string

  created_at:
    | string
    | null
}

type GetListingPerformanceInput = {
  supabase: SupabaseClient
  listingIds: string[]
}

const PERFORMANCE_EVENT_TYPES = [
  'listing_viewed',
  'listing_saved',
  'listing_shared',
  'listing_whatsapp_clicked',
  'listing_email_inquiry'
] satisfies ListingActivityEventType[]

function calculateRate(
  numerator: number,
  denominator: number
): number {
  if (
    denominator <= 0 ||
    numerator <= 0
  ) {
    return 0
  }

  return Number(
    (
      numerator /
      denominator
    ).toFixed(4)
  )
}

function resolveListingHealth(
  performance: {
    viewCount: number
    favoriteCount: number
    shareCount: number
    totalInquiryCount: number
    totalEngagementRate: number
  }
): ListingPerformanceHealth {
  const {
    viewCount,
    favoriteCount,
    shareCount,
    totalInquiryCount,
    totalEngagementRate
  } = performance

  if (viewCount === 0) {
    return 'insufficient-data'
  }

  if (
    viewCount >= 100 &&
    (
      totalInquiryCount >= 5 ||
      totalEngagementRate >= 0.12
    )
  ) {
    return 'excellent'
  }

  if (
    totalInquiryCount >= 1 ||
    favoriteCount >= 2 ||
    shareCount >= 1 ||
    totalEngagementRate >= 0.05
  ) {
    return 'good'
  }

  if (
    viewCount >= 50 &&
    totalInquiryCount === 0 &&
    favoriteCount === 0 &&
    shareCount === 0
  ) {
    return 'dormant'
  }

  return 'needs-attention'
}

function finalizeListingPerformance(
  performance:
    ListingPerformance
): ListingPerformance {
  const totalInquiryCount =
    performance
      .whatsappClickCount +
    performance
      .emailInquiryCount

  const totalEngagementCount =
    performance.favoriteCount +
    performance.shareCount +
    totalInquiryCount

  const favoriteRate =
    calculateRate(
      performance.favoriteCount,
      performance.viewCount
    )

  const shareRate =
    calculateRate(
      performance.shareCount,
      performance.viewCount
    )

  const whatsappRate =
    calculateRate(
      performance.whatsappClickCount,
      performance.viewCount
    )

  const emailInquiryRate =
    calculateRate(
      performance.emailInquiryCount,
      performance.viewCount
    )

  const totalEngagementRate =
    calculateRate(
      totalEngagementCount,
      performance.viewCount
    )

  const totalInquiryRate =
    calculateRate(
      totalInquiryCount,
      performance.viewCount
    )

  return {
    ...performance,

    totalEngagementCount,
    totalInquiryCount,

    favoriteRate,
    shareRate,
    whatsappRate,
    emailInquiryRate,
    totalEngagementRate,
    totalInquiryRate,

    health:
      resolveListingHealth({
        viewCount:
          performance.viewCount,

        favoriteCount:
          performance.favoriteCount,

        shareCount:
          performance.shareCount,

        totalInquiryCount,

        totalEngagementRate
      })
  }
}

function updateActivityDates(
  performance:
    ListingPerformance,
  createdAt:
    | string
    | null
): void {
  if (!createdAt) {
    return
  }

  const timestamp =
    new Date(
      createdAt
    ).getTime()

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return
  }

  if (
    !performance.firstActivityAt ||
    timestamp <
      new Date(
        performance.firstActivityAt
      ).getTime()
  ) {
    performance.firstActivityAt =
      createdAt
  }

  if (
    !performance.lastActivityAt ||
    timestamp >
      new Date(
        performance.lastActivityAt
      ).getTime()
  ) {
    performance.lastActivityAt =
      createdAt
  }
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
    emailInquiryCount: 0,

    totalEngagementCount: 0,
    totalInquiryCount: 0,

    favoriteRate: 0,
    shareRate: 0,
    whatsappRate: 0,
    emailInquiryRate: 0,
    totalEngagementRate: 0,
    totalInquiryRate: 0,

    health:
      'insufficient-data',

    firstActivityAt: null,
    lastActivityAt: null
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
        listingIds
          .map(
            listingId =>
              listingId.trim()
          )
          .filter(Boolean)
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
        event_type,
        created_at
      `)
      .eq(
        'entity_type',
        'listing'
      )
      .in(
        'entity_id',
        uniqueListingIds
      )
      .in(
        'event_type',
        PERFORMANCE_EVENT_TYPES
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

    updateActivityDates(
      performance,
      activityEvent.created_at
    )

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

  for (
    const [
      listingId,
      performance
    ] of performanceByListing
  ) {
    performanceByListing.set(
      listingId,
      finalizeListingPerformance(
        performance
      )
    )
  }

  return performanceByListing
}