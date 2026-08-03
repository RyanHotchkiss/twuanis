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

export async function trackListingRemoved({
      listingId,
      metadata
    }: ListingActivityInput) {
      return recordActivityEvent({
        eventCategory: 'listing',
        eventType: 'listing_removed',
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

export async function trackListingWhatsAppClicked({
      listingId,
      metadata
    }: ListingActivityInput) {
      return recordActivityEvent({
        eventCategory: 'listing',
        eventType:
          'listing_whatsapp_clicked',
        entityType: 'listing',
        entityId: listingId,
        metadata
      })
    }

export async function trackListingEmailInquiry({
      listingId,
      metadata
    }: ListingActivityInput) {
      return recordActivityEvent({
        eventCategory: 'listing',
        eventType:
          'listing_email_inquiry',
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

    export async function recordListingPermanentlyDeleted({
      listingId,
      metadata = {}
    }: {
      listingId: string
      userId?: string | null
      metadata?: ActivityEventMetadata
    }) {
      return recordActivityEvent({
        eventCategory:
          'listing',

        eventType:
          'listing_permanently_deleted',

        entityType:
          'listing',

        entityId:
          listingId,

        metadata
      })
    }

const RECENT_PROPERTIES_KEY =
  'recently-viewed-properties'

const RECENT_SAVED_PROPERTIES_KEY =
  'recently-saved-properties'

export type RecentlySavedProperty = {
      id: string
      savedAt: string
    }

export function getRecentlySavedProperties():
  RecentlySavedProperty[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const value =
      JSON.parse(
        localStorage.getItem(
          RECENT_SAVED_PROPERTIES_KEY
        ) || '[]'
      )

    return Array.isArray(value)
      ? value
      : []
  } catch {
    return []
  }
}

export function recordPropertySaved(
  listingId: string
) {
  if (typeof window === 'undefined') {
    return
  }

  const updated = [
    {
      id: listingId,
      savedAt:
        new Date().toISOString()
    },
    ...getRecentlySavedProperties().filter(
      property =>
        property.id !== listingId
    )
  ].slice(0, 25)

  localStorage.setItem(
    RECENT_SAVED_PROPERTIES_KEY,
    JSON.stringify(updated)
  )

  window.dispatchEvent(
    new Event(
      'recent-saved-properties-updated'
    )
  )
}

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

