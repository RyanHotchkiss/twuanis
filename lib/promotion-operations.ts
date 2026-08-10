import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionCatalogProduct,
  resolvePromotionBasePriority,
  type PromotionProductSlug
} from '@/lib/promotion-catalog'


export type PromotionOperationActorType =
  | 'system'
  | 'user'
  | 'admin'


export type PromotionOperationResult = {
  entitlementId:
    string

  listingId:
    string

  status:
    string

  startsAt:
    string | null

  expiresAt:
    string | null

  eventId:
    string

  occurredAt:
    string
}


type ChangePromotionRpcRow = {
  entitlement_id:
    string

  listing_id:
    string

  status:
    string

  starts_at:
    string | null

  expires_at:
    string | null

  event_id:
    string

  changed_at:
    string
}


type CancelPromotionRpcRow = {
  entitlement_id:
    string

  listing_id:
    string

  status:
    string

  starts_at:
    string | null

  expires_at:
    string | null

  event_id:
    string

  cancelled_at:
    string
}


export class PromotionOperationsError
  extends Error {

  code:
    | 'PROMOTION_SLUG_REQUIRED'
    | 'ENTITLEMENT_ID_REQUIRED'
    | 'PROMOTION_START_REQUIRED'
    | 'PROMOTION_CHANGE_FAILED'
    | 'PROMOTION_CANCEL_FAILED'
    | 'PROMOTION_OPERATION_RETURNED_NO_STATE'

  constructor(
    code:
      PromotionOperationsError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'PromotionOperationsError'

    this.code =
      code
  }
}


function resolveCatalogSnapshot(
  promotionSlug:
    PromotionProductSlug
) {

  const promotion =
    getPromotionCatalogProduct(
      promotionSlug
    )


  return {
    surfaces:
      promotion.surfaces,

    priority:
      resolvePromotionBasePriority(
        promotion
      ),

    scope: {
      scope:
        promotion.scope,

      priorityMode:
        promotion.priorityMode,

      stackingBehavior:
        promotion.stackingBehavior,

      durationBehavior:
        promotion.durationBehavior
    }
  }
}


export async function changePromotion({
  supabase,
  entitlementId,
  promotionSlug,
  startsAt,
  actorId = null,
  actorType = 'system'
}: {
  supabase:
    SupabaseClient

  entitlementId:
    string

  promotionSlug:
    PromotionProductSlug

  startsAt:
    Date

  actorId?:
    string | null

  actorType?:
    PromotionOperationActorType
}): Promise<
  PromotionOperationResult
> {

  if (
    !entitlementId
  ) {

    throw new PromotionOperationsError(
      'ENTITLEMENT_ID_REQUIRED',
      'A promotion entitlement ID is required.'
    )
  }


  if (
    !promotionSlug
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_SLUG_REQUIRED',
      'A promotion slug is required.'
    )
  }


  if (
    !startsAt ||
    !Number.isFinite(
      startsAt.getTime()
    )
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_START_REQUIRED',
      'A valid promotion start date is required.'
    )
  }


  const snapshot =
    resolveCatalogSnapshot(
      promotionSlug
    )


  const {
    data,
    error
  } =
    await supabase
      .rpc(
        'change_promotion',
        {
          p_entitlement_id:
            entitlementId,

          p_starts_at:
            startsAt.toISOString(),

          p_surfaces:
            snapshot.surfaces,

          p_priority:
            snapshot.priority,

          p_scope:
            snapshot.scope,

          p_actor_id:
            actorId,

          p_actor_type:
            actorType
        }
      )


  if (
    error
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_CHANGE_FAILED',
      error.message
    )
  }


  const row =
    Array.isArray(
      data
    )
      ? data[0] as
          ChangePromotionRpcRow | undefined
      : undefined


  if (
    !row
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_OPERATION_RETURNED_NO_STATE',
      'Promotion change returned no canonical state.'
    )
  }


  return {
    entitlementId:
      row.entitlement_id,

    listingId:
      row.listing_id,

    status:
      row.status,

    startsAt:
      row.starts_at,

    expiresAt:
      row.expires_at,

    eventId:
      row.event_id,

    occurredAt:
      row.changed_at
  }
}


export async function cancelPromotion({
  supabase,
  entitlementId,
  promotionSlug,
  actorId = null,
  actorType = 'system'
}: {
  supabase:
    SupabaseClient

  entitlementId:
    string

  promotionSlug:
    PromotionProductSlug

  actorId?:
    string | null

  actorType?:
    PromotionOperationActorType
}): Promise<
  PromotionOperationResult
> {

  if (
    !entitlementId
  ) {

    throw new PromotionOperationsError(
      'ENTITLEMENT_ID_REQUIRED',
      'A promotion entitlement ID is required.'
    )
  }


  if (
    !promotionSlug
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_SLUG_REQUIRED',
      'A promotion slug is required.'
    )
  }


  const snapshot =
    resolveCatalogSnapshot(
      promotionSlug
    )


  const {
    data,
    error
  } =
    await supabase
      .rpc(
        'cancel_promotion',
        {
          p_entitlement_id:
            entitlementId,

          p_surfaces:
            snapshot.surfaces,

          p_priority:
            snapshot.priority,

          p_scope:
            snapshot.scope,

          p_actor_id:
            actorId,

          p_actor_type:
            actorType
        }
      )


  if (
    error
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_CANCEL_FAILED',
      error.message
    )
  }


  const row =
    Array.isArray(
      data
    )
      ? data[0] as
          CancelPromotionRpcRow | undefined
      : undefined


  if (
    !row
  ) {

    throw new PromotionOperationsError(
      'PROMOTION_OPERATION_RETURNED_NO_STATE',
      'Promotion cancellation returned no canonical state.'
    )
  }


  return {
    entitlementId:
      row.entitlement_id,

    listingId:
      row.listing_id,

    status:
      row.status,

    startsAt:
      row.starts_at,

    expiresAt:
      row.expires_at,

    eventId:
      row.event_id,

    occurredAt:
      row.cancelled_at
  }
}