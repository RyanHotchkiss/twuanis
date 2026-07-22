import {
  recordActivityEvent
} from '@/lib/activity'

import type {
  ActivityEventMetadata
} from '@/lib/activity'

import {
  recordRecentActivity
} from '@/lib/account-storage'

type ListingActivityInput = {
  listingId: string
  metadata?: ActivityEventMetadata
}

export async function trackListingViewed({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_viewed',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function trackListingSaved({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_saved',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function trackListingShared({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_shared',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function recordListingUnpublished({
  listingId,
  metadata = {}
}: {
  listingId: string
  userId?: string | null
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_unpublished',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function recordListingArchived({
  listingId,
  metadata = {}
}: {
  listingId: string
  userId?: string | null
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_archived',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function recordListingRestored({
  listingId,
  metadata = {}
}: {
  listingId: string
  userId?: string | null
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_restored',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export async function recordListingDeleted({
  listingId,
  metadata = {}
}: {
  listingId: string
  userId?: string | null
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_deleted',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

const RECENT_PROPERTIES_KEY =
  'recently-viewed-properties'

export function getRecentlyViewedProperties() {
  if (typeof window === 'undefined') {
    return []
  }

  return JSON.parse(
    localStorage.getItem(
      RECENT_PROPERTIES_KEY
    ) || '[]'
  )
}

export function recordPropertyViewed(
  property: {
    id: string
    title: string
    image?: string | null
    location?: string | null
    price?: string | null
    href: string
  }
) {
  if (typeof window === 'undefined') {
    return
  }

  const updated = [
    {
      ...property,
      viewedAt: new Date().toISOString()
    },
    ...getRecentlyViewedProperties().filter(
      (item: any) =>
        item.id !== property.id
    )
  ].slice(0, 25)

  localStorage.setItem(
    RECENT_PROPERTIES_KEY,
    JSON.stringify(updated)
  )

  window.dispatchEvent(
      new Event(
        'recent-properties-updated'
      )
    )

    recordRecentActivity(
      'property_viewed',
      'listing',
      property.id,
      property
    )
}

