import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionCatalogProduct,
  isPromotionProductSlug,
  resolvePromotionBasePriority,
  type PromotionProductSlug,
  type PromotionSurface
} from '@/lib/promotion-catalog'


export type PromotionHistoryEventType =
  | 'promotion_scheduled'
  | 'promotion_activated'
  | 'promotion_changed'
  | 'promotion_expired'
  | 'promotion_cancelled'


export type PromotionHistoryActorType =
  | 'system'
  | 'user'
  | 'admin'


export type PromotionHistoryEvent = {
  id:
    string

  listingId:
    string

  entitlementId:
    string

  purchaseRequestId:
    string | null

  productId:
    string

  promotionSlug:
    PromotionProductSlug

  eventType:
    PromotionHistoryEventType

  previousState:
    string | null

  resultingState:
    string | null

  startsAt:
    string | null

  expiresAt:
    string | null

  surfaces:
    PromotionSurface[]

  priority:
    number

  scope:
    Record<
      string,
      unknown
    >

  metadata:
    Record<
      string,
      unknown
    >

  actorId:
    string | null

  actorType:
    PromotionHistoryActorType

  occurredAt:
    string

  createdAt:
    string
}


export type PromotionHistoryTimeline = {
  listingId:
    string

  resolvedAt:
    string

  events:
    PromotionHistoryEvent[]
}


type DatabasePromotionEvent = {
  id:
    string

  listing_id:
    string

  entitlement_id:
    string

  purchase_request_id:
    string | null

  product_id:
    string

  promotion_slug:
    string

  event_type:
    PromotionHistoryEventType

  previous_state:
    string | null

  resulting_state:
    string | null

  starts_at:
    string | null

  expires_at:
    string | null

  surfaces:
    string[]

  priority:
    number

  scope:
    Record<
      string,
      unknown
    >

  metadata:
    Record<
      string,
      unknown
    >

  actor_id:
    string | null

  actor_type:
    PromotionHistoryActorType

  occurred_at:
    string

  created_at:
    string
}


export class PromotionHistoryError
  extends Error {

  code:
    | 'INVALID_PROMOTION_SLUG'
    | 'PROMOTION_HISTORY_INSERT_FAILED'
    | 'PROMOTION_HISTORY_LOAD_FAILED'

  constructor(
    code:
      PromotionHistoryError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'PromotionHistoryError'

    this.code =
      code
  }
}


function normalizePromotionEvent(
  row:
    DatabasePromotionEvent
): PromotionHistoryEvent {

  if (
    !isPromotionProductSlug(
      row.promotion_slug
    )
  ) {

    throw new PromotionHistoryError(
      'INVALID_PROMOTION_SLUG',
      `Unknown promotion slug "${row.promotion_slug}" in promotion history.`
    )
  }


  return {
    id:
      row.id,

    listingId:
      row.listing_id,

    entitlementId:
      row.entitlement_id,

    purchaseRequestId:
      row.purchase_request_id,

    productId:
      row.product_id,

    promotionSlug:
      row.promotion_slug,

    eventType:
      row.event_type,

    previousState:
      row.previous_state,

    resultingState:
      row.resulting_state,

    startsAt:
      row.starts_at,

    expiresAt:
      row.expires_at,

    surfaces:
      (
        row.surfaces ??
        []
      ) as PromotionSurface[],

    priority:
      row.priority,

    scope:
      row.scope ??
      {},

    metadata:
      row.metadata ??
      {},

    actorId:
      row.actor_id,

    actorType:
      row.actor_type,

    occurredAt:
      row.occurred_at,

    createdAt:
      row.created_at
  }
}


async function recordPromotionHistoryEvent({
  supabase,
  listingId,
  entitlementId,
  purchaseRequestId = null,
  productId,
  promotionSlug,
  eventType,
  previousState = null,
  resultingState = null,
  startsAt = null,
  expiresAt = null,
  scope = {},
  metadata = {},
  actorId = null,
  actorType = 'system',
  occurredAt = new Date()
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  entitlementId:
    string

  purchaseRequestId?:
    string | null

  productId:
    string

  promotionSlug:
    PromotionProductSlug

  eventType:
    PromotionHistoryEventType

  previousState?:
    string | null

  resultingState?:
    string | null

  startsAt?:
    string | null

  expiresAt?:
    string | null

  scope?:
    Record<
      string,
      unknown
    >

  metadata?:
    Record<
      string,
      unknown
    >

  actorId?:
    string | null

  actorType?:
    PromotionHistoryActorType

  occurredAt?:
    Date
}): Promise<
  PromotionHistoryEvent
> {

  const promotion =
    getPromotionCatalogProduct(
      promotionSlug
    )


  const surfaces =
    promotion.surfaces


  const priority =
    resolvePromotionBasePriority(
      promotion
    )


  const {
    data,
    error
  } =
    await supabase
      .from(
        'promotion_events'
      )
      .insert({
        listing_id:
          listingId,

        entitlement_id:
          entitlementId,

        purchase_request_id:
          purchaseRequestId,

        product_id:
          productId,

        promotion_slug:
          promotionSlug,

        event_type:
          eventType,

        previous_state:
          previousState,

        resulting_state:
          resultingState,

        starts_at:
          startsAt,

        expires_at:
          expiresAt,

        surfaces,

        priority,

        scope,

        metadata: {
          ...metadata,

          catalogSnapshot: {
            scope:
              promotion.scope,

            priorityMode:
              promotion.priorityMode,

            stackingBehavior:
              promotion.stackingBehavior
          }
        },

        actor_id:
          actorId,

        actor_type:
          actorType,

        occurred_at:
          occurredAt.toISOString()
      })
      .select('*')
      .single()


  if (
    error ||
    !data
  ) {

    throw new PromotionHistoryError(
      'PROMOTION_HISTORY_INSERT_FAILED',
      error?.message ??
        'Promotion history event could not be recorded.'
    )
  }


  return normalizePromotionEvent(
    data as DatabasePromotionEvent
  )
}


export async function recordPromotionScheduled(
  input:
    Omit<
      Parameters<
        typeof recordPromotionHistoryEvent
      >[0],
      'eventType'
    >
) {

  return recordPromotionHistoryEvent({
    ...input,

    eventType:
      'promotion_scheduled'
  })
}


export async function recordPromotionActivated(
  input:
    Omit<
      Parameters<
        typeof recordPromotionHistoryEvent
      >[0],
      'eventType'
    >
) {

  return recordPromotionHistoryEvent({
    ...input,

    eventType:
      'promotion_activated'
  })
}


export async function recordPromotionChanged(
  input:
    Omit<
      Parameters<
        typeof recordPromotionHistoryEvent
      >[0],
      'eventType'
    >
) {

  return recordPromotionHistoryEvent({
    ...input,

    eventType:
      'promotion_changed'
  })
}


export async function recordPromotionExpired(
  input:
    Omit<
      Parameters<
        typeof recordPromotionHistoryEvent
      >[0],
      'eventType'
    >
) {

  return recordPromotionHistoryEvent({
    ...input,

    eventType:
      'promotion_expired'
  })
}


export async function recordPromotionCancelled(
  input:
    Omit<
      Parameters<
        typeof recordPromotionHistoryEvent
      >[0],
      'eventType'
    >
) {

  return recordPromotionHistoryEvent({
    ...input,

    eventType:
      'promotion_cancelled'
  })
}


export async function getPromotionHistory({
  supabase,
  listingId
}: {
  supabase:
    SupabaseClient

  listingId:
    string
}): Promise<
  PromotionHistoryEvent[]
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'promotion_events'
      )
      .select('*')
      .eq(
        'listing_id',
        listingId
      )
      .order(
        'occurred_at',
        {
          ascending:
            true
        }
      )
      .order(
        'created_at',
        {
          ascending:
            true
        }
      )


  if (
    error
  ) {

    throw new PromotionHistoryError(
      'PROMOTION_HISTORY_LOAD_FAILED',
      error.message
    )
  }


  return (
    data ??
    []
  ).map(
    row =>
      normalizePromotionEvent(
        row as DatabasePromotionEvent
      )
  )
}


export async function getPromotionTimeline({
  supabase,
  listingId
}: {
  supabase:
    SupabaseClient

  listingId:
    string
}): Promise<
  PromotionHistoryTimeline
> {

  const events =
    await getPromotionHistory({
      supabase,
      listingId
    })


  return {
    listingId,

    resolvedAt:
      new Date()
        .toISOString(),

    events
  }
}