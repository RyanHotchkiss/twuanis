import type {
  ListingStatus
} from '@/lib/listing-lifecycle-engine'

import {
  resolveListingEntitlements
} from '@/lib/listing-entitlements'

import type {
  ListingEntitlementRecord,
  ListingEntitlementSourceType,
  ListingEntitlementStatus
} from '@/lib/listing-entitlements'

import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionHistory,
  type PromotionHistoryEvent,
  type PromotionHistoryEventType
} from '@/lib/promotion-history'

type ResolveListingLifecycleTimelineInput = {
  supabase: SupabaseClient

  listingId: string

  ownerId: string
}

type ResolveListingCapabilityTimelineInput =
  ResolveListingLifecycleTimelineInput

type ResolveListingTimelineInput =
  ResolveListingLifecycleTimelineInput

type DatabaseListingActivityEvent = {
  id: string

  user_id:
    string | null

  event_type:
    string

  metadata:
    Record<
      string,
      unknown
    >

  created_at:
    string
}

/*
 * The two canonical sources of listing timeline
 * information in V1.
 */
export type ListingTimelineCategory =
  | 'lifecycle'
  | 'capability'
  | 'promotion'

/*
 * Normalized lifecycle events.
 *
 * These deliberately do not expose the raw
 * Activity Engine event names to React.
 */
export type ListingLifecycleTimelineEventType =
  | 'created'
  | 'updated'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'restored'
  | 'renewed'
  | 'deleted'
  | 'permanently_deleted'

/*
 * Normalized capability / entitlement events.
 *
 * These correspond to the canonical entitlement
 * states already resolved by listing-entitlements.ts.
 */
export type ListingCapabilityTimelineEventType =
  | 'capability_assigned'
  | 'capability_pending'
  | 'capability_scheduled'
  | 'capability_activated'
  | 'capability_expired'
  | 'capability_revoked'
  | 'capability_cancelled'

export type ListingPromotionTimelineEventType =
  PromotionHistoryEventType

export type ListingTimelineEventType =
  | ListingLifecycleTimelineEventType
  | ListingCapabilityTimelineEventType
  | ListingPromotionTimelineEventType

/*
 * Canonical source of the event.
 *
 * The raw Activity Engine metadata may contain
 * values such as:
 *
 * market-hub
 * authenticated-publish
 *
 * Entitlements may originate from:
 *
 * package_credit
 * purchase
 * manual
 * system
 */
export type ListingTimelineSource =
  | string
  | ListingEntitlementSourceType
  | null

/*
 * Canonical actor information.
 *
 * Some events are user-driven.
 * Some are assigned by another user/admin.
 * Some are system generated.
 *
 * We normalize those differences here rather
 * than making React interpret them.
 */
export type ListingTimelineActor = {
  actorId:
    string | null

  actorType:
    | 'owner'
    | 'admin'
    | 'system'
    | 'unknown'

  assignedBy:
    string | null

  revokedBy:
    string | null
}

/*
 * Canonical state transition.
 *
 * Lifecycle events use ListingStatus.
 * Capability events use ListingEntitlementStatus.
 *
 * null is important because events such as
 * listing_created may not have a meaningful
 * previous state.
 */
export type ListingTimelineState =
  | ListingStatus
  | ListingEntitlementStatus
  | 'permanently-deleted'
  | null

/*
 * Normalized metadata available to Timeline
 * consumers.
 *
 * These fields are based on metadata Twuanis
 * already records through the Activity Engine
 * plus canonical entitlement facts.
 */
export type ListingTimelineMetadata = {
  title?:
    string

  transactionType?:
    string

  province?:
    string

  canton?:
    string

  district?:
    string

  propertyType?:
    string

  imageCount?:
    number

  updatedFields?:
    string[]

  deletionType?:
    string

  capabilityId?:
    string

  capabilitySlug?:
    string

  capabilityNameEn?:
    string

  capabilityNameEs?:
    string

  entitlementId?:
    string

  entitlementStatus?:
    ListingEntitlementStatus

  entitlementSourceType?:
    ListingEntitlementSourceType

  purchaseRequestId?:
    string | null

  promotionSlug?:
    string

  promotionSurfaces?:
    string[]

  promotionPriority?:
    number

  promotionScope?:
    Record<
      string,
      unknown
    >

  startsAt?:
    string | null

  expiresAt?:
    string | null

  revokedAt?:
    string | null

  revocationReason?:
    string | null

  /*
   * Preserve event-specific canonical facts
   * without requiring React to understand
   * the raw database record.
   */
  details?:
    Record<
      string,
      unknown
    >
}

/*
 * The canonical Timeline event.
 *
 * Everything displayed in the Operations Center
 * Timeline will eventually come through this shape.
 */
export type ListingTimelineEvent = {
  id:
    string

  listingId:
    string

  category:
    ListingTimelineCategory

  eventType:
    ListingTimelineEventType

  /*
   * Human-readable event title should be
   * normalized by the resolver, not React.
   */
  title:
    string

  /*
   * One canonical timestamp regardless of whether
   * the source was activity_events.created_at,
   * entitlement created_at, starts_at,
   * expires_at, revoked_at, etc.
   */
  occurredAt:
    string

  source:
    ListingTimelineSource

  actor:
    ListingTimelineActor

  previousState:
    ListingTimelineState

  resultingState:
    ListingTimelineState

  metadata:
    ListingTimelineMetadata
}

/*
 * Canonical resolver result.
 *
 * Step 4 will eventually guarantee that events
 * are merged and sorted newest-first before
 * reaching React.
 */
export type ResolvedListingTimeline = {
  listingId:
    string

  ownerId:
    string

  resolvedAt:
    string

  events:
    ListingTimelineEvent[]
}

function normalizeLifecycleTitle(
  eventType: string
): string {

  switch (
    eventType
  ) {

    case 'listing_created':
      return 'Listing Created'

    case 'listing_updated':
      return 'Listing Updated'

    case 'listing_published':
      return 'Listing Published'

    case 'listing_unpublished':
      return 'Listing Unpublished'

    case 'listing_archived':
      return 'Listing Archived'

    case 'listing_restored':
      return 'Listing Restored'

    case 'listing_renewed':
      return 'Listing Renewed'

    case 'listing_deleted':
      return 'Listing Deleted'

    case 'listing_permanently_deleted':
      return 'Listing Permanently Deleted'

    default:
      return 'Listing Updated'
  }
}

function normalizeLifecycleEventType(
  eventType: string
): ListingLifecycleTimelineEventType {

  switch (
    eventType
  ) {

    case 'listing_created':
      return 'created'

    case 'listing_updated':
      return 'updated'

    case 'listing_published':
      return 'published'

    case 'listing_unpublished':
      return 'unpublished'

    case 'listing_archived':
      return 'archived'

    case 'listing_restored':
      return 'restored'

    case 'listing_renewed':
      return 'renewed'

    case 'listing_deleted':
      return 'deleted'

    case 'listing_permanently_deleted':
      return 'permanently_deleted'

    default:
      return 'updated'
  }
}

function normalizeLifecycleTimelineEvent(
  event:
    DatabaseListingActivityEvent,

  listingId:
    string
): ListingTimelineEvent {

  const metadata =
    event.metadata

  return {
    id:
      event.id,

    listingId,

    category:
      'lifecycle',

    eventType:
      normalizeLifecycleEventType(
        event.event_type
      ),

    title:
      normalizeLifecycleTitle(
        event.event_type
      ),

    occurredAt:
      event.created_at,

    source:
      (
        metadata.source as
          string | undefined
      ) ??
      null,

    actor: {
      actorId:
        event.user_id,

      actorType:
        event.user_id
          ? 'owner'
          : 'system',

      assignedBy:
        null,

      revokedBy:
        null
    },

    previousState:
      (
        metadata.previousStatus as
          ListingTimelineState
      ) ??
      null,

    resultingState:
      (
        metadata.status ??
        metadata.listingStatus
      ) as
        ListingTimelineState,

    metadata
  }
}

function normalizeCapabilityTimelineEvents(
  entitlement:
    ListingEntitlementRecord
): ListingTimelineEvent[] {

  const baseMetadata:
    ListingTimelineMetadata = {
      capabilityId:
        entitlement.productId,

      capabilitySlug:
        entitlement.productSlug,

      capabilityNameEn:
        entitlement.productNameEn,

      capabilityNameEs:
        entitlement.productNameEs,

      entitlementId:
        entitlement.entitlementId,

      entitlementStatus:
        entitlement.status,

      entitlementSourceType:
        entitlement.sourceType,

      purchaseRequestId:
        entitlement.purchaseRequestId,

      startsAt:
        entitlement.startsAt,

      expiresAt:
        entitlement.expiresAt,

      revokedAt:
        entitlement.revokedAt,

      revocationReason:
        entitlement.revocationReason
    }

  const actor:
    ListingTimelineActor = {
      actorId:
        entitlement.assignedBy,

      actorType:
        entitlement.sourceType ===
          'system'
          ? 'system'
          : entitlement.assignedBy
            ? 'admin'
            : 'unknown',

      assignedBy:
        entitlement.assignedBy,

      revokedBy:
        entitlement.revokedBy
    }

  const events:
    ListingTimelineEvent[] = []

  /*
   * Every entitlement represents a capability
   * assignment, regardless of its eventual state.
   */
  events.push({
    id:
      `${entitlement.entitlementId}:assigned`,

    listingId:
      entitlement.listingId,

    category:
      'capability',

    eventType:
      'capability_assigned',

    title:
      `${entitlement.productNameEn} Assigned`,

    occurredAt:
      entitlement.createdAt,

    source:
      entitlement.sourceType,

    actor,

    previousState:
      null,

    resultingState:
      null,

    metadata:
      baseMetadata
  })

  if (
    entitlement.isPending
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:pending`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_pending',

      title:
        `${entitlement.productNameEn} Pending`,

      occurredAt:
        entitlement.createdAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        null,

      resultingState:
        'pending',

      metadata:
        baseMetadata
    })
  }

  if (
    entitlement.isScheduled
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:scheduled`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_scheduled',

      title:
        `${entitlement.productNameEn} Scheduled`,

      occurredAt:
        entitlement.createdAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        null,

      resultingState:
        'scheduled',

      metadata:
        baseMetadata
    })
  }

  if (
    entitlement.isCurrentlyActive
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:activated`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_activated',

      title:
        `${entitlement.productNameEn} Activated`,

      occurredAt:
        entitlement.startsAt ??
        entitlement.createdAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        entitlement.startsAt
          ? 'scheduled'
          : null,

      resultingState:
        'active',

      metadata:
        baseMetadata
    })
  }

  if (
    entitlement.isExpired
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:expired`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_expired',

      title:
        `${entitlement.productNameEn} Expired`,

      occurredAt:
        entitlement.expiresAt ??
        entitlement.updatedAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        'active',

      resultingState:
        'expired',

      metadata:
        baseMetadata
    })
  }

  if (
    entitlement.isRevoked
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:revoked`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_revoked',

      title:
        `${entitlement.productNameEn} Revoked`,

      occurredAt:
        entitlement.revokedAt ??
        entitlement.updatedAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        'active',

      resultingState:
        'revoked',

      metadata:
        baseMetadata
    })
  }

  if (
    entitlement.isCancelled
  ) {
    events.push({
      id:
        `${entitlement.entitlementId}:cancelled`,

      listingId:
        entitlement.listingId,

      category:
        'capability',

      eventType:
        'capability_cancelled',

      title:
        `${entitlement.productNameEn} Cancelled`,

      /*
       * listing_entitlements currently has no
       * dedicated cancelled_at column.
       * updatedAt is therefore the strongest
       * canonical timestamp available.
       */
      occurredAt:
        entitlement.updatedAt,

      source:
        entitlement.sourceType,

      actor,

      previousState:
        null,

      resultingState:
        'cancelled',

      metadata:
        baseMetadata
    })
  }

  return events
}

function normalizePromotionTimelineTitle(
  eventType:
    PromotionHistoryEventType
): string {

  switch (
    eventType
  ) {

    case 'promotion_scheduled':
      return 'Promotion Scheduled'

    case 'promotion_activated':
      return 'Promotion Activated'

    case 'promotion_changed':
      return 'Promotion Changed'

    case 'promotion_expired':
      return 'Promotion Expired'

    case 'promotion_cancelled':
      return 'Promotion Cancelled'

    default:
      return 'Promotion Updated'
  }
}


function normalizePromotionTimelineEvent(
  event:
    PromotionHistoryEvent
): ListingTimelineEvent {

  return {
    id:
      `promotion:${event.id}`,

    listingId:
      event.listingId,

    category:
      'promotion',

    eventType:
      event.eventType,

    title:
      normalizePromotionTimelineTitle(
        event.eventType
      ),

    occurredAt:
      event.occurredAt,

    source:
      'promotion-history',

    actor: {
      actorId:
        event.actorId,

      actorType:
        event.actorType === 'admin'
          ? 'admin'
          : event.actorType === 'system'
            ? 'system'
            : event.actorType === 'user'
              ? 'owner'
              : 'unknown',

      assignedBy:
        null,

      revokedBy:
        null
    },

    previousState:
      event.previousState as
        ListingTimelineState,

    resultingState:
      event.resultingState as
        ListingTimelineState,

    metadata: {
      entitlementId:
        event.entitlementId,

      purchaseRequestId:
        event.purchaseRequestId,

      promotionSlug:
        event.promotionSlug,

      promotionSurfaces:
        event.surfaces,

      promotionPriority:
        event.priority,

      promotionScope:
        event.scope,

      startsAt:
        event.startsAt,

      expiresAt:
        event.expiresAt,

      details: {
        ...event.metadata,

        productId:
          event.productId
      }
    }
  }
}

export async function resolveListingPromotionTimeline({
  supabase,
  listingId,
  ownerId
}: ResolveListingTimelineInput) {

  /*
   * Ownership is already enforced by the
   * promotion_events RLS policy.
   *
   * We still retain ownerId in this resolver's
   * contract so every Listing Timeline source
   * has the same ownership context.
   */

  const history =
    await getPromotionHistory({
      supabase,
      listingId
    })


  const events =
    history.map(
      normalizePromotionTimelineEvent
    )


  events.sort(
    (
      first,
      second
    ) =>
      new Date(
        second.occurredAt
      ).getTime() -
      new Date(
        first.occurredAt
      ).getTime()
  )


  return {
    listingId,

    ownerId,

    resolvedAt:
      new Date().toISOString(),

    events
  } satisfies
    ResolvedListingTimeline
}

export async function resolveListingLifecycleTimeline({
  supabase,
  listingId,
  ownerId
}: ResolveListingLifecycleTimelineInput) {

  const {
    data: listing,
    error: listingError
  } = await supabase
    .from('listings')
    .select(`
      id,
      owner_id
    `)
    .eq(
      'id',
      listingId
    )
    .maybeSingle()

  if (listingError) {
    throw new Error(
      listingError.message
    )
  }

  if (!listing) {
    throw new Error(
      'Listing not found.'
    )
  }

  if (
    listing.owner_id !== ownerId
  ) {
    throw new Error(
      'The authenticated user does not own this listing.'
    )
  }

  const {
    data,
    error
  } = await supabase
    .from('activity_events')
    .select(`
      id,
      user_id,
      event_type,
      metadata,
      created_at
    `)
    .eq(
      'user_id',
      ownerId
    )
    .eq(
      'entity_type',
      'listing'
    )
    .eq(
      'entity_id',
      listingId
    )
    .order(
      'created_at',
      {
        ascending: false
      }
    )

  if (error) {
    throw new Error(
      error.message
    )
  }

  const events =
    (data ?? []).map(
      event =>
        normalizeLifecycleTimelineEvent(
          event as
            DatabaseListingActivityEvent,

          listingId
        )
    )

  return {
    listingId,

    ownerId,

    resolvedAt:
      new Date().toISOString(),

    events
  } satisfies
    ResolvedListingTimeline
}

export async function resolveListingCapabilityTimeline({
  supabase,
  listingId,
  ownerId
}: ResolveListingCapabilityTimelineInput) {

  const resolved =
    await resolveListingEntitlements({
      supabase,

      listingId,

      ownerId,

      includeInactive: true
    })

  const events =
    resolved.entitlements.flatMap(
      entitlement => {

        const entitlementEvents =
          normalizeCapabilityTimelineEvents(
            entitlement
          )

        /*
        * Promotional operational lifecycle is now
        * authoritative in promotion_events.
        *
        * Keep assignment/pending entitlement facts,
        * but do not reconstruct operational promotion
        * events from current entitlement state.
        */

        if (
          entitlement.productType ===
            'promotion'
        ) {

          return entitlementEvents.filter(
            event =>
              event.eventType ===
                'capability_assigned' ||
              event.eventType ===
                'capability_pending'
          )
        }


        return entitlementEvents
      }
    )

  events.sort(
      (
        first,
        second
      ) =>
        new Date(
          second.occurredAt
        ).getTime() -
        new Date(
          first.occurredAt
        ).getTime()
    )

  return {
    listingId,

    ownerId,

    resolvedAt:
      resolved.resolvedAt,

    events
  } satisfies
    ResolvedListingTimeline
}

export async function resolveListingTimeline({
  supabase,
  listingId,
  ownerId
}: ResolveListingTimelineInput) {

  const lifecycle =
    await resolveListingLifecycleTimeline({
      supabase,

      listingId,

      ownerId
    })

  const capabilities =
    await resolveListingCapabilityTimeline({
      supabase,

      listingId,

      ownerId
    })

  const promotions =
    await resolveListingPromotionTimeline({
      supabase,

      listingId,

      ownerId
    })

    const events = [
      ...lifecycle.events,

      ...capabilities.events,

      ...promotions.events
    ]

    events.sort(
      (
        first,
        second
      ) =>
        new Date(
          second.occurredAt
        ).getTime() -
        new Date(
          first.occurredAt
        ).getTime()
    )

    const deduplicatedEvents =
      events.filter(
        (
          event,
          index,
          array
        ) =>
          array.findIndex(
            candidate =>
              candidate.id ===
              event.id
          ) === index
      )

    return {

        listingId,

        ownerId,

        resolvedAt:
          new Date().toISOString(),

        events:
          deduplicatedEvents

      } satisfies
      ResolvedListingTimeline
    }