import {
  supabase
} from '@/lib/supabase'

export const ACTIVITY_TYPES = [
    'viewed-property',
    'saved-property',
    'shared-property',
    'published-listing',
    'edited-listing',
    'archived-listing',
    'created-valuation',
    'compared-markets',
    'saved-market-explorer-analysis',
    'saved-search',
    'followed-market',
    'created-alert',
    'purchased-package',
    'renewed-listing',
    'updated-profile'
] as const

export type ActivityType =
  (typeof ACTIVITY_TYPES)[number]

export type MarketHubActivity = {
  id: string
  type: ActivityType
  propertyId: string
  propertyTitle: string
  propertyUrl: string
  propertyImageUrl?: string
  occurredAt: string
}

export const ACTIVITY_LABELS: Record<
  ActivityType,
  {
    en: string
    es: string
  }
> = {
  'viewed-property': {
    en: 'Viewed Property',
    es: 'Propiedad Vista'
  },

  'saved-property': {
    en: 'Saved Property',
    es: 'Propiedad Guardada'
  },

  'shared-property': {
    en: 'Shared Property',
    es: 'Propiedad Compartida'
  },

  'published-listing': {
    en: 'Published Listing',
    es: 'Anuncio Publicado'
  },

  'edited-listing': {
    en: 'Edited Listing',
    es: 'Anuncio Editado'
  },

  'archived-listing': {
    en: 'Archived Listing',
    es: 'Anuncio Archivado'
  },

  'created-valuation': {
    en: 'Created Valuation',
    es: 'Valoración Creada'
    },

    'compared-markets': {
    en: 'Compared Markets',
    es: 'Mercados Comparados'
    },

    'saved-market-explorer-analysis': {
    en: 'Saved Market Explorer Analysis',
    es: 'Análisis del Explorador de Mercado Guardado'
    },

    'saved-search': {
    en: 'Saved Search',
    es: 'Búsqueda Guardada'
    },

    'followed-market': {
    en: 'Followed Market',
    es: 'Mercado Seguido'
    },

    'created-alert': {
    en: 'Created Alert',
    es: 'Alerta Creada'
    },

    'purchased-package': {
    en: 'Purchased Package',
    es: 'Paquete Comprado'
    },

    'renewed-listing': {
    en: 'Renewed Listing',
    es: 'Anuncio Renovado'
    },

    'updated-profile': {
    en: 'Updated Profile',
    es: 'Perfil Actualizado'
    }
}

export function getActivityLabel(
  type: ActivityType,
  language: 'en' | 'es'
): string {
  return ACTIVITY_LABELS[type][language]
}

export function sortActivity(
  activity: MarketHubActivity[]
): MarketHubActivity[] {
  return [...activity].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() -
      new Date(a.occurredAt).getTime()
  )
}

export type ActivityTimelineGroup =
  | 'today'
  | 'yesterday'
  | 'earlier'

export function getActivityTimelineGroup(
  occurredAt: string
): ActivityTimelineGroup {
  const date = new Date(occurredAt)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(
    yesterday.getDate() - 1
  )

  if (date >= today) {
    return 'today'
  }

  if (date >= yesterday) {
    return 'yesterday'
  }

  return 'earlier'
}

export type ActivityEventCategory =
  | 'property'
  | 'listing'
  | 'market'
  | 'search'
  | 'account'
  | 'comparison'

export type PropertyActivityEventType =
  | 'property_viewed'
  | 'property_saved'
  | 'property_shared'

export type ListingActivityEventType =
  | 'listing_viewed'
  | 'listing_saved'
  | 'listing_shared'
  | 'listing_whatsapp_clicked'
  | 'listing_email_inquiry'
  | 'listing_created'
  | 'listing_updated'
  | 'listing_published'
  | 'listing_unpublished'
  | 'listing_archived'
  | 'listing_restored'
  | 'listing_renewed'
  | 'listing_deleted'
  | 'listing_permanently_deleted'
  | 'listing_removed'

  export type SearchActivityEventType =
  | 'search_saved'

export type ComparisonActivityEventType =
  | 'comparison_created'
  | 'comparison_opened'
  | 'comparison_duplicated'
  | 'comparison_deleted'

export type ActivityEventType =
  | PropertyActivityEventType
  | ListingActivityEventType
  | SearchActivityEventType
  | ComparisonActivityEventType

export type ActivityEntityType =
  | 'property'
  | 'listing'
  | 'search'
  | 'property_comparison'

export function recordSearchSaved({
  searchId,
  metadata
}: {
  searchId: string
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'search',
    eventType: 'search_saved',
    entityType: 'search',
    entityId: searchId,
    metadata
  })
}

export type ActivityEventMetadata = {
  title?: string
  location?: string
  price?: string | number
  href?: string
  source?: string
  shareMethod?: string
  [key: string]: unknown
}

export type ActivityEventInput = {
  eventCategory: ActivityEventCategory
  eventType: ActivityEventType
  entityType?: ActivityEntityType
  entityId?: string
  metadata?: ActivityEventMetadata
}

export type StoredActivityEvent = {
  id: string
  userId: string | null
  sessionId: string | null
  eventCategory: ActivityEventCategory
  eventType: ActivityEventType
  entityType: ActivityEntityType | null
  entityId: string | null
  metadata: ActivityEventMetadata
  createdAt: string
}

export const PROPERTY_ACTIVITY_EVENTS = [
  {
    id: 'property_viewed',
    label: {
      en: 'Viewed',
      es: 'Vista'
    }
  },
  {
    id: 'property_saved',
    label: {
      en: 'Saved',
      es: 'Guardada'
    }
  },
  {
    id: 'property_shared',
    label: {
      en: 'Shared',
      es: 'Compartida'
    }
  }
] satisfies {
  id: PropertyActivityEventType
  label: {
    en: string
    es: string
  }
}[]

export async function recordActivityEvent(
      event: ActivityEventInput
    ): Promise<void> {
      const {
        data: {
          session
        },
        error: sessionError
      } =
        await supabase.auth.getSession()

      if (
        sessionError ||
        !session
      ) {
        throw new Error(
          'Authentication required to record activity.'
        )
      }

      const response = await fetch(
        '/api/activity',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`
          },

          body:
            JSON.stringify(event)
        }
      )

      if (!response.ok) {
        const result =
          await response
            .json()
            .catch(() => null)

        throw new Error(
          result?.error ||
            'Unable to record activity event.'
        )
      }
    }

export function recordPropertyViewed({
  propertyId,
  metadata
}: {
  propertyId: string
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'property',
    eventType: 'property_viewed',
    entityType: 'property',
    entityId: propertyId,
    metadata
  })
}

export function recordPropertySaved({
  propertyId,
  metadata
}: {
  propertyId: string
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'property',
    eventType: 'property_saved',
    entityType: 'property',
    entityId: propertyId,
    metadata
  })
}

export function recordPropertyShared({
  propertyId,
  metadata
}: {
  propertyId: string
  metadata?: ActivityEventMetadata
}) {
  return recordActivityEvent({
    eventCategory: 'property',
    eventType: 'property_shared',
    entityType: 'property',
    entityId: propertyId,
    metadata
  })
}

type ListingActivityInput = {
  listingId: string
  metadata?: ActivityEventMetadata
}

export function recordListingCreated({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_created',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingUpdated({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_updated',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingSaved({
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

export function recordListingShared({
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

export function recordListingPublished({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_published',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingUnpublished({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_unpublished',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingArchived({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_archived',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingDeleted({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_deleted',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingRestored({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_restored',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingRenewed({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType: 'listing_renewed',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}

export function recordListingPermanentlyDeleted({
  listingId,
  metadata
}: ListingActivityInput) {
  return recordActivityEvent({
    eventCategory: 'listing',
    eventType:
      'listing_permanently_deleted',
    entityType: 'listing',
    entityId: listingId,
    metadata
  })
}