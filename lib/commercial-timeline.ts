import type {
  SupabaseClient
} from '@supabase/supabase-js'


export type CommercialTimelineSource =
  | 'purchase'
  | 'payment'
  | 'activation'
  | 'subscription'
  | 'promotion'


export type CommercialTimelineEvent = {
  id:
    string

  source:
    CommercialTimelineSource

  eventType:
    string

  occurredAt:
    string

  purchaseRequestId:
    string | null

  subscriptionId:
    string | null

  entitlementId:
    string | null

  listingId:
    string | null

  productId:
    string | null

  metadata:
    Record<
      string,
      unknown
    >
}


export type CommercialTimeline = {
  userId:
    string

  resolvedAt:
    string

  events:
    CommercialTimelineEvent[]
}


type DatabasePurchaseEvent = {
  id:
    string

  purchase_request_id:
    string

  event_type:
    string

  previous_status:
    string | null

  resulting_status:
    string | null

  actor_id:
    string | null

  metadata:
    Record<
      string,
      unknown
    > | null

  created_at:
    string
}


type DatabaseSinpePayment = {
  id:
    string

  purchase_request_id:
    string | null

  subscription_id:
    string | null

  amount:
    number | string

  currency:
    string

  sinpe_reference:
    string | null

  sender_name:
    string | null

  sender_phone:
    string | null

  payment_date:
    string | null

  status:
    string

  rejection_reason:
    string | null

  reviewed_at:
    string | null

  approved_at:
    string | null

  rejected_at:
    string | null

  created_at:
    string

  updated_at:
    string | null
}


type DatabaseActivationEvent = {
  id:
    string

  entity_type:
    string | null

  entity_id:
    string | null

  metadata:
    Record<
      string,
      unknown
    > | null

  created_at:
    string
}


type DatabaseSubscription = {
  id:
    string

  package_id:
    string

  status:
    string

  billing_cycle:
    string | null

  started_at:
    string | null

  current_period_start:
    string | null

  current_period_end:
    string | null

  cancelled_at:
    string | null

  expired_at:
    string | null

  purchase_request_id:
    string | null

  created_at:
    string

  updated_at:
    string | null
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
    string

  previous_state:
    string | null

  resulting_state:
    string | null

  starts_at:
    string | null

  expires_at:
    string | null

  metadata:
    Record<
      string,
      unknown
    > | null

  actor_id:
    string | null

  actor_type:
    string

  occurred_at:
    string

  created_at:
    string
}


export class CommercialTimelineError
  extends Error {

  code:
    | 'USER_ID_REQUIRED'
    | 'PURCHASE_HISTORY_LOAD_FAILED'
    | 'PAYMENT_HISTORY_LOAD_FAILED'
    | 'ACTIVATION_HISTORY_LOAD_FAILED'
    | 'SUBSCRIPTION_HISTORY_LOAD_FAILED'
    | 'PROMOTION_HISTORY_LOAD_FAILED'

  constructor(
    code:
      CommercialTimelineError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'CommercialTimelineError'

    this.code =
      code
  }
}


function asMetadata(
  value:
    Record<
      string,
      unknown
    > | null
): Record<
  string,
  unknown
> {

  return value ?? {}
}


function normalizePurchaseEvent(
  row:
    DatabasePurchaseEvent
): CommercialTimelineEvent {

  return {
    id:
      `purchase:${row.id}`,

    source:
      'purchase',

    eventType:
      row.event_type,

    occurredAt:
      row.created_at,

    purchaseRequestId:
      row.purchase_request_id,

    subscriptionId:
      null,

    entitlementId:
      null,

    listingId:
      null,

    productId:
      null,

    metadata: {
      previousStatus:
        row.previous_status,

      resultingStatus:
        row.resulting_status,

      actorId:
        row.actor_id,

      ...asMetadata(
        row.metadata
      )
    }
  }
}


function normalizePaymentEvent(
  row:
    DatabaseSinpePayment
): CommercialTimelineEvent {

  const occurredAt =
    row.approved_at ??
    row.rejected_at ??
    row.reviewed_at ??
    row.updated_at ??
    row.created_at


  return {
    id:
      `payment:${row.id}`,

    source:
      'payment',

    eventType:
      `sinpe_${row.status}`,

    occurredAt,

    purchaseRequestId:
      row.purchase_request_id,

    subscriptionId:
      row.subscription_id,

    entitlementId:
      null,

    listingId:
      null,

    productId:
      null,

    metadata: {
      amount:
        Number(
          row.amount
        ),

      currency:
        row.currency,

      sinpeReference:
        row.sinpe_reference,

      senderName:
        row.sender_name,

      senderPhone:
        row.sender_phone,

      paymentDate:
        row.payment_date,

      status:
        row.status,

      rejectionReason:
        row.rejection_reason,

      submittedAt:
        row.created_at,

      reviewedAt:
        row.reviewed_at,

      approvedAt:
        row.approved_at,

      rejectedAt:
        row.rejected_at
    }
  }
}


function normalizeActivationEvent(
  row:
    DatabaseActivationEvent
): CommercialTimelineEvent {

  const metadata =
    asMetadata(
      row.metadata
    )


  const purchaseRequestId =
    typeof metadata.purchaseId ===
      'string'
      ? metadata.purchaseId
      : null


  const activatedAt =
    typeof metadata.activatedAt ===
      'string'
      ? metadata.activatedAt
      : row.created_at


  return {
    id:
      `activation:${row.id}`,

    source:
      'activation',

    eventType:
      'commercial_activation_completed',

    occurredAt:
      activatedAt,

    purchaseRequestId,

    subscriptionId:
      row.entity_type ===
        'subscription'
        ? row.entity_id
        : null,

    entitlementId:
      row.entity_type ===
        'listing_entitlement'
        ? row.entity_id
        : null,

    listingId:
      null,

    productId:
      null,

    metadata: {
      entityType:
        row.entity_type,

      entityId:
        row.entity_id,

      ...metadata
    }
  }
}


function normalizeSubscriptionStarted(
  row:
    DatabaseSubscription
): CommercialTimelineEvent {

  return {
    id:
      `subscription:${row.id}:started`,

    source:
      'subscription',

    eventType:
      'subscription_started',

    occurredAt:
      row.started_at ??
      row.created_at,

    purchaseRequestId:
      row.purchase_request_id,

    subscriptionId:
      row.id,

    entitlementId:
      null,

    listingId:
      null,

    productId:
      row.package_id,

    metadata: {
      packageId:
        row.package_id,

      status:
        row.status,

      billingCycle:
        row.billing_cycle,

      currentPeriodStart:
        row.current_period_start,

      currentPeriodEnd:
        row.current_period_end
    }
  }
}


function normalizeSubscriptionTerminal(
  row:
    DatabaseSubscription
): CommercialTimelineEvent | null {

  if (
    row.cancelled_at
  ) {

    return {
      id:
        `subscription:${row.id}:cancelled`,

      source:
        'subscription',

      eventType:
        'subscription_cancelled',

      occurredAt:
        row.cancelled_at,

      purchaseRequestId:
        row.purchase_request_id,

      subscriptionId:
        row.id,

      entitlementId:
        null,

      listingId:
        null,

      productId:
        row.package_id,

      metadata: {
        packageId:
          row.package_id,

        status:
          row.status,

        billingCycle:
          row.billing_cycle
      }
    }
  }


  if (
    row.expired_at
  ) {

    return {
      id:
        `subscription:${row.id}:expired`,

      source:
        'subscription',

      eventType:
        'subscription_expired',

      occurredAt:
        row.expired_at,

      purchaseRequestId:
        row.purchase_request_id,

      subscriptionId:
        row.id,

      entitlementId:
        null,

      listingId:
        null,

      productId:
        row.package_id,

      metadata: {
        packageId:
          row.package_id,

        status:
          row.status,

        billingCycle:
          row.billing_cycle
      }
    }
  }


  return null
}


function normalizePromotionEvent(
  row:
    DatabasePromotionEvent
): CommercialTimelineEvent {

  return {
    id:
      `promotion:${row.id}`,

    source:
      'promotion',

    eventType:
      row.event_type,

    occurredAt:
      row.occurred_at,

    purchaseRequestId:
      row.purchase_request_id,

    subscriptionId:
      null,

    entitlementId:
      row.entitlement_id,

    listingId:
      row.listing_id,

    productId:
      row.product_id,

    metadata: {
      promotionSlug:
        row.promotion_slug,

      previousState:
        row.previous_state,

      resultingState:
        row.resulting_state,

      startsAt:
        row.starts_at,

      expiresAt:
        row.expires_at,

      actorId:
        row.actor_id,

      actorType:
        row.actor_type,

      ...asMetadata(
        row.metadata
      )
    }
  }
}


function compareTimelineEvents(
  first:
    CommercialTimelineEvent,

  second:
    CommercialTimelineEvent
): number {

  const firstTime =
    new Date(
      first.occurredAt
    ).getTime()

  const secondTime =
    new Date(
      second.occurredAt
    ).getTime()


  if (
    firstTime !==
      secondTime
  ) {

    return (
      secondTime -
      firstTime
    )
  }


  return first.id.localeCompare(
    second.id
  )
}


export async function resolveCommercialTimeline({
  supabase,
  userId
}: {
  supabase:
    SupabaseClient

  userId:
    string
}): Promise<
  CommercialTimeline
> {

  if (
    !userId
  ) {

    throw new CommercialTimelineError(
      'USER_ID_REQUIRED',
      'A user ID is required to resolve the commercial timeline.'
    )
  }


  /*
   * -------------------------------------------------------
   * PURCHASE IDS
   * -------------------------------------------------------
   *
   * Purchase history is scoped canonically by purchase owner.
   */


  const {
    data:
      purchaseData,

    error:
      purchaseError
  } =
    await supabase
      .from(
        'purchase_requests'
      )
      .select(`
        id
      `)
      .eq(
        'owner_id',
        userId
      )


  if (
    purchaseError
  ) {

    throw new CommercialTimelineError(
      'PURCHASE_HISTORY_LOAD_FAILED',
      purchaseError.message
    )
  }


  const purchaseIds =
    (
      purchaseData ??
      []
    ).map(
      row =>
        row.id as string
    )


  /*
   * -------------------------------------------------------
   * LOAD AUTHORITATIVE HISTORY SOURCES
   * -------------------------------------------------------
   */


  const [
    purchaseEventsResult,
    paymentResult,
    activationResult,
    subscriptionResult
  ] =
    await Promise.all([
      purchaseIds.length >
        0
        ? supabase
            .from(
              'purchase_request_events'
            )
            .select(`
              id,
              purchase_request_id,
              event_type,
              previous_status,
              resulting_status,
              actor_id,
              metadata,
              created_at
            `)
            .in(
              'purchase_request_id',
              purchaseIds
            )
        : Promise.resolve({
            data: [],
            error: null
          }),

      supabase
        .from(
          'sinpe_payments'
        )
        .select(`
          id,
          purchase_request_id,
          subscription_id,
          amount,
          currency,
          sinpe_reference,
          sender_name,
          sender_phone,
          payment_date,
          status,
          rejection_reason,
          reviewed_at,
          approved_at,
          rejected_at,
          created_at,
          updated_at
        `)
        .eq(
          'user_id',
          userId
        ),

      supabase
        .from(
          'activity_events'
        )
        .select(`
          id,
          entity_type,
          entity_id,
          metadata,
          created_at
        `)
        .eq(
          'user_id',
          userId
        )
        .eq(
          'event_type',
          'commercial_activation_completed'
        ),

      supabase
        .from(
          'user_subscriptions'
        )
        .select(`
          id,
          package_id,
          status,
          billing_cycle,
          started_at,
          current_period_start,
          current_period_end,
          cancelled_at,
          expired_at,
          purchase_request_id,
          created_at,
          updated_at
        `)
        .eq(
          'user_id',
          userId
        )
    ])


  if (
    purchaseEventsResult.error
  ) {

    throw new CommercialTimelineError(
      'PURCHASE_HISTORY_LOAD_FAILED',
      purchaseEventsResult
        .error
        .message
    )
  }


  if (
    paymentResult.error
  ) {

    throw new CommercialTimelineError(
      'PAYMENT_HISTORY_LOAD_FAILED',
      paymentResult
        .error
        .message
    )
  }


  if (
    activationResult.error
  ) {

    throw new CommercialTimelineError(
      'ACTIVATION_HISTORY_LOAD_FAILED',
      activationResult
        .error
        .message
    )
  }


  if (
    subscriptionResult.error
  ) {

    throw new CommercialTimelineError(
      'SUBSCRIPTION_HISTORY_LOAD_FAILED',
      subscriptionResult
        .error
        .message
    )
  }


  /*
   * -------------------------------------------------------
   * PROMOTION HISTORY
   * -------------------------------------------------------
   *
   * Promotion events do not carry owner_id directly.
   *
   * The purchase relationship is therefore the cleanest
   * owner boundary for purchased promotions.
   *
   * Some legitimate promotion history may have no purchase
   * request, so we additionally scope by the user's
   * entitlement IDs.
   */


  const {
    data:
      entitlementData,

    error:
      entitlementError
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id
      `)
      .eq(
        'owner_id',
        userId
      )


  if (
    entitlementError
  ) {

    throw new CommercialTimelineError(
      'PROMOTION_HISTORY_LOAD_FAILED',
      entitlementError.message
    )
  }


  const entitlementIds =
    (
      entitlementData ??
      []
    ).map(
      row =>
        row.id as string
    )


  let promotionRows:
    DatabasePromotionEvent[] =
      []


  if (
    purchaseIds.length >
      0 ||
    entitlementIds.length >
      0
  ) {

    const purchasePromotionQuery =
      purchaseIds.length >
        0
        ? supabase
            .from(
              'promotion_events'
            )
            .select('*')
            .in(
              'purchase_request_id',
              purchaseIds
            )
        : Promise.resolve({
            data: [],
            error: null
          })


    const entitlementPromotionQuery =
      entitlementIds.length >
        0
        ? supabase
            .from(
              'promotion_events'
            )
            .select('*')
            .in(
              'entitlement_id',
              entitlementIds
            )
        : Promise.resolve({
            data: [],
            error: null
          })


    const [
      purchasePromotionResult,
      entitlementPromotionResult
    ] =
      await Promise.all([
        purchasePromotionQuery,
        entitlementPromotionQuery
      ])


    if (
      purchasePromotionResult.error
    ) {

      throw new CommercialTimelineError(
        'PROMOTION_HISTORY_LOAD_FAILED',
        purchasePromotionResult
          .error
          .message
      )
    }


    if (
      entitlementPromotionResult.error
    ) {

      throw new CommercialTimelineError(
        'PROMOTION_HISTORY_LOAD_FAILED',
        entitlementPromotionResult
          .error
          .message
      )
    }


    const promotionById =
      new Map<
        string,
        DatabasePromotionEvent
      >()


    for (
      const row of
        (
          purchasePromotionResult.data ??
          []
        )
    ) {

      promotionById.set(
        row.id,
        row as
          DatabasePromotionEvent
      )
    }


    for (
      const row of
        (
          entitlementPromotionResult.data ??
          []
        )
    ) {

      promotionById.set(
        row.id,
        row as
          DatabasePromotionEvent
      )
    }


    promotionRows =
      Array.from(
        promotionById.values()
      )
  }


  /*
   * -------------------------------------------------------
   * NORMALIZE
   * -------------------------------------------------------
   */


  const events:
    CommercialTimelineEvent[] =
      []


  for (
    const row of
      (
        purchaseEventsResult.data ??
        []
      )
  ) {

    events.push(
      normalizePurchaseEvent(
        row as
          DatabasePurchaseEvent
      )
    )
  }


  for (
    const row of
      (
        paymentResult.data ??
        []
      )
  ) {

    events.push(
      normalizePaymentEvent(
        row as
          DatabaseSinpePayment
      )
    )
  }


  for (
    const row of
      (
        activationResult.data ??
        []
      )
  ) {

    events.push(
      normalizeActivationEvent(
        row as
          DatabaseActivationEvent
      )
    )
  }


  for (
    const row of
      (
        subscriptionResult.data ??
        []
      )
  ) {

    const subscription =
      row as
        DatabaseSubscription


    events.push(
      normalizeSubscriptionStarted(
        subscription
      )
    )


    const terminalEvent =
      normalizeSubscriptionTerminal(
        subscription
      )


    if (
      terminalEvent
    ) {

      events.push(
        terminalEvent
      )
    }
  }


  for (
    const row of
      promotionRows
  ) {

    events.push(
      normalizePromotionEvent(
        row
      )
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL ORDER
   * -------------------------------------------------------
   *
   * Newest first for operational consumption.
   *
   * The event ID supplies a deterministic tie-breaker.
   */


  events.sort(
    compareTimelineEvents
  )


  return {
    userId,

    resolvedAt:
      new Date()
        .toISOString(),

    events
  }
}