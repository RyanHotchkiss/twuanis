import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  createPurchaseRequest
} from '../../lib/purchase-engine'

import {
  approvePurchase
} from '../../lib/approval-engine'

import {
  changePromotion,
  cancelPromotion
} from '../../lib/promotion-operations'

import {
  getPromotionHistory
} from '../../lib/promotion-history'

import {
  resolveListingTimeline
} from '../../lib/listing-timeline'

import {
  getPromotionCatalogProduct,
  resolvePromotionBasePriority
} from '../../lib/promotion-catalog'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'promotion-history-verification'

const TEST_RUN_ID =
  crypto.randomUUID()

const TEST_PROMOTION_SLUG =
  'featured-listing' as const


type ActivationRpcRow = {
  purchase_id:
    string

  owner_id:
    string

  product_type:
    'package' | 'add_on'

  activation_type:
    'subscription' | 'listing_entitlement'

  activation_id:
    string

  activated_at:
    string
}


function requireEnvironmentVariable(
  name:
    string
): string {

  const value =
    process.env[
      name
    ]


  if (
    !value ||
    !value.trim()
  ) {

    throw new Error(
      `Missing required environment variable: ${name}`
    )
  }


  return value.trim()
}


function requireTestIdentity() {

  return {
    userId:
      requireEnvironmentVariable(
        'ACTIVATION_VERIFY_USER_ID'
      ),

    listingId:
      requireEnvironmentVariable(
        'ACTIVATION_VERIFY_LISTING_ID'
      )
  }
}


function createAdminClient():
  SupabaseClient {

  const url =
    requireEnvironmentVariable(
      'NEXT_PUBLIC_SUPABASE_URL'
    )


  const serviceRoleKey =
    requireEnvironmentVariable(
      'SUPABASE_SERVICE_ROLE_KEY'
    )


  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false
      }
    }
  )
}


function testMetadata(
  extra:
    Record<
      string,
      unknown
    > = {}
) {

  return {
    testRecord:
      true,

    testSuite:
      TEST_SUITE,

    testRunId:
      TEST_RUN_ID,

    verificationStatus:
      'test-promotion-history-verified',

    ...extra
  }
}


function sleep(
  milliseconds:
    number
) {

  return new Promise<void>(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  )
}


async function assertTestListingOwnership({
  supabase,
  userId,
  listingId
}: {
  supabase:
    SupabaseClient

  userId:
    string

  listingId:
    string
}) {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        owner_id,
        listing_status
      `)
      .eq(
        'id',
        listingId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new Error(
      `Could not verify test listing: ${error.message}`
    )
  }


  if (
    !data
  ) {

    throw new Error(
      `Test listing ${listingId} does not exist.`
    )
  }


  if (
    data.owner_id !==
      userId
  ) {

    throw new Error(
      'ACTIVATION_VERIFY_LISTING_ID is not owned by ACTIVATION_VERIFY_USER_ID.'
    )
  }


  if (
    data.listing_status !==
      'active'
  ) {

    throw new Error(
      `Verification listing must be active. Current status: ${data.listing_status}.`
    )
  }
}


async function resolveVerificationPromotion({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  const explicitProductId =
    process.env
      .PROMOTION_HISTORY_VERIFY_ADD_ON_ID
      ?.trim()


  let query =
    supabase
      .from(
        'add_on_products'
      )
      .select(`
        id,
        slug,
        product_type,
        target_type,
        duration_type,
        duration_days,
        is_stackable,
        maximum_quantity,
        requires_manual_approval,
        is_active
      `)
      .eq(
        'slug',
        TEST_PROMOTION_SLUG
      )
      .eq(
        'product_type',
        'promotion'
      )
      .eq(
        'target_type',
        'listing'
      )
      .eq(
        'is_active',
        true
      )


  if (
    explicitProductId &&
    !explicitProductId.startsWith(
      'OPTIONAL_'
    )
  ) {

    query =
      query.eq(
        'id',
        explicitProductId
      )
  }


  const {
    data,
    error
  } =
    await query
      .limit(1)
      .maybeSingle()


  if (
    error
  ) {

    throw new Error(
      `Could not resolve verification promotion: ${error.message}`
    )
  }


  if (
    !data
  ) {

    throw new Error(
      `Could not find active ${TEST_PROMOTION_SLUG} promotion product.`
    )
  }


  if (
    data.requires_manual_approval
  ) {

    throw new Error(
      `${TEST_PROMOTION_SLUG} requires manual approval and cannot be used by this verification harness.`
    )
  }


  if (
    data.duration_type !==
      'days' &&
    data.duration_type !==
      'listing_lifetime'
  ) {

    throw new Error(
      `Unsupported verification promotion duration type: ${data.duration_type}.`
    )
  }


  return data
}

async function addSyntheticProviderEvidence({
  supabase,
  purchaseId,
  actorId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  actorId:
    string
}) {

  const {
    error
  } =
    await supabase
      .from(
        'purchase_request_events'
      )
      .insert({
        purchase_request_id:
          purchaseId,

        event_type:
          'provider_test_promotion_history_verified',

        previous_status:
          'pending',

        resulting_status:
          'pending',

        actor_id:
          actorId,

        metadata:
          testMetadata({
            provider:
              'verification-harness',

            evidenceType:
              'synthetic-provider-evidence'
          })
      })


  if (
    error
  ) {

    throw new Error(
      `Could not create synthetic provider evidence: ${error.message}`
    )
  }
}

async function approveVerificationPurchase({
  supabase,
  purchaseId,
  reviewerId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  reviewerId:
    string
}) {

await addSyntheticProviderEvidence({
    supabase,

    purchaseId,

    actorId:
        reviewerId
    })

  const approved =
    await approvePurchase({
      supabase,

      purchaseId,

      reviewerId,

      notes:
        'Synthetic approval created by the Promotion History verification harness.',

      metadata:
        testMetadata({
          decision:
            'test-promotion-history-approved'
        })
    })


  if (
    approved.purchase.status !==
      'approved'
  ) {

    throw new Error(
      `Purchase ${purchaseId} did not resolve to approved state.`
    )
  }


  return approved
}


async function activateThroughRpc({
  supabase,
  purchaseId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string
}): Promise<
  ActivationRpcRow
> {

  const {
    data,
    error
  } =
    await supabase
      .rpc(
        'activate_purchase',
        {
          p_purchase_id:
            purchaseId
        }
      )


  if (
    error
  ) {

    throw new Error(
      `Atomic promotion activation failed: ${error.message}`
    )
  }


  const row =
    Array.isArray(
      data
    )
      ? data[0] as
          ActivationRpcRow | undefined
      : undefined


  if (
    !row
  ) {

    throw new Error(
      'Atomic activation returned no canonical activation row.'
    )
  }


  return row
}


async function assertEntitlementState({
  supabase,
  entitlementId,
  expectedStatus,
  listingId,
  purchaseId
}: {
  supabase:
    SupabaseClient

  entitlementId:
    string

  expectedStatus:
    string

  listingId:
    string

  purchaseId:
    string
}) {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id,
        listing_id,
        purchase_request_id,
        status,
        starts_at,
        expires_at
      `)
      .eq(
        'id',
        entitlementId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new Error(
      `Could not inspect verification entitlement: ${error.message}`
    )
  }


  if (
    !data
  ) {

    throw new Error(
      `Verification entitlement ${entitlementId} does not exist.`
    )
  }


  if (
    data.listing_id !==
      listingId
  ) {

    throw new Error(
      'Verification entitlement points to the wrong listing.'
    )
  }


  if (
    data.purchase_request_id !==
      purchaseId
  ) {

    throw new Error(
      'Verification entitlement does not point back to its purchase.'
    )
  }


  if (
    data.status !==
      expectedStatus
  ) {

    throw new Error(
      `Expected entitlement status ${expectedStatus}, received ${data.status}.`
    )
  }


  return data
}


function assertEventExists({
  events,
  eventType,
  entitlementId
}: {
  events:
    Awaited<
      ReturnType<
        typeof getPromotionHistory
      >
    >

  eventType:
    string

  entitlementId:
    string
}) {

  const event =
    events.find(
      candidate =>
        candidate.entitlementId ===
          entitlementId &&
        candidate.eventType ===
          eventType
    )


  if (
    !event
  ) {

    throw new Error(
      `Expected immutable ${eventType} event for entitlement ${entitlementId}.`
    )
  }


  return event
}


function assertChronologicalOrder({
  timestamps,
  label
}: {
  timestamps:
    string[]

  label:
    string
}) {

  for (
    let index = 1;
    index < timestamps.length;
    index += 1
  ) {

    const previous =
      new Date(
        timestamps[
          index - 1
        ]
      ).getTime()


    const current =
      new Date(
        timestamps[
          index
        ]
      ).getTime()


    if (
      current <
        previous
    ) {

      throw new Error(
        `${label} is not chronological.`
      )
    }
  }
}


async function assertPromotionEventsImmutable({
  supabase,
  eventId
}: {
  supabase:
    SupabaseClient

  eventId:
    string
}) {

  /*
   * UPDATE must fail even for service_role.
   */

  const {
    error:
      updateError
  } =
    await supabase
      .from(
        'promotion_events'
      )
      .update({
        priority:
          999999
      })
      .eq(
        'id',
        eventId
      )


  if (
    !updateError
  ) {

    throw new Error(
      'Immutable promotion event unexpectedly allowed UPDATE.'
    )
  }


  if (
    !updateError.message
      .toLowerCase()
      .includes(
        'immutable'
      )
  ) {

    throw new Error(
      [
        'Promotion UPDATE failed, but not because of the immutable-event protection.',
        updateError.message
      ].join(
        ' '
      )
    )
  }


  /*
   * DELETE must also fail.
   */

  const {
    error:
      deleteError
  } =
    await supabase
      .from(
        'promotion_events'
      )
      .delete()
      .eq(
        'id',
        eventId
      )


  if (
    !deleteError
  ) {

    throw new Error(
      'Immutable promotion event unexpectedly allowed DELETE.'
    )
  }


  if (
    !deleteError.message
      .toLowerCase()
      .includes(
        'immutable'
      )
  ) {

    throw new Error(
      [
        'Promotion DELETE failed, but not because of the immutable-event protection.',
        deleteError.message
      ].join(
        ' '
      )
    )
  }
}


async function runPromotionHistoryVerification() {

  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION HISTORY VERIFICATION'
  )

  console.log(
    '========================================'
  )


  console.log(
    'Test suite:',
    TEST_SUITE
  )

  console.log(
    'Test run:',
    TEST_RUN_ID
  )


  const supabase =
    createAdminClient()


  const {
    userId,
    listingId
  } =
    requireTestIdentity()


  console.log(
    'Test user:',
    userId
  )

  console.log(
    'Test listing:',
    listingId
  )


  await assertTestListingOwnership({
    supabase,
    userId,
    listingId
  })


  const promotionProduct =
    await resolveVerificationPromotion({
      supabase
    })


  console.log(
    'Promotion:',
    promotionProduct.slug,
    promotionProduct.id
  )


  /*
   * -------------------------------------------------------
   * 1. CREATE + APPROVE CONTROLLED PURCHASE
   * -------------------------------------------------------
   */


  const purchase =
    await createPurchaseRequest({
      supabase,

      ownerId:
        userId,

      productType:
        'add_on',

      addOnProductId:
        promotionProduct.id,

      targetType:
        'listing',

      listingId,

      quantity:
        1,

      currency:
        'CRC',

      metadata:
        testMetadata({
          verification:
            'promotion-history'
        })
    })


  const purchaseId =
    purchase.purchase.id


  console.log(
    '✓ Controlled promotion purchase created'
  )


  await approveVerificationPurchase({
    supabase,

    purchaseId,

    reviewerId:
      userId
  })


  console.log(
    '✓ Controlled promotion purchase approved'
  )


  /*
   * -------------------------------------------------------
   * 2. ACTIVATE
   * -------------------------------------------------------
   */


  const activation =
    await activateThroughRpc({
      supabase,
      purchaseId
    })


  if (
    activation.activation_type !==
      'listing_entitlement'
  ) {

    throw new Error(
      `Expected listing_entitlement activation, received ${activation.activation_type}.`
    )
  }


  const entitlementId =
    activation.activation_id


  await assertEntitlementState({
    supabase,

    entitlementId,

    expectedStatus:
      'active',

    listingId,

    purchaseId
  })


  let history =
    await getPromotionHistory({
      supabase,
      listingId
    })


  const activatedEvent =
    assertEventExists({
      events:
        history,

      eventType:
        'promotion_activated',

      entitlementId
    })


  if (
    activatedEvent.purchaseRequestId !==
      purchaseId
  ) {

    throw new Error(
      'promotion_activated does not preserve its purchase relationship.'
    )
  }


  console.log(
    '✓ Promotion activated atomically'
  )

  console.log(
    '✓ promotion_activated recorded'
  )

  console.log(
    '✓ Activation preserves purchase relationship'
  )


  /*
   * Make event timestamps unambiguously ordered.
   */

  await sleep(
    50
  )


  /*
   * -------------------------------------------------------
   * 3. CHANGE / RESCHEDULE PROMOTION
   * -------------------------------------------------------
   */


  const changedStart =
    new Date(
      Date.now() +
      24 *
      60 *
      60 *
      1000
    )


  const changeResult =
    await changePromotion({
      supabase,

      entitlementId,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      startsAt:
        changedStart,

      actorId:
        userId,

      actorType:
        'admin'
    })


  if (
    changeResult.status !==
      'scheduled'
  ) {

    throw new Error(
      `Expected changed promotion to become scheduled, received ${changeResult.status}.`
    )
  }


  await assertEntitlementState({
    supabase,

    entitlementId,

    expectedStatus:
      'scheduled',

    listingId,

    purchaseId
  })


  history =
    await getPromotionHistory({
      supabase,
      listingId
    })


  const changedEvent =
    assertEventExists({
      events:
        history,

      eventType:
        'promotion_changed',

      entitlementId
    })


  const catalog =
    getPromotionCatalogProduct(
      TEST_PROMOTION_SLUG
    )


  const expectedPriority =
    resolvePromotionBasePriority(
      catalog
    )


  if (
    changedEvent.priority !==
      expectedPriority
  ) {

    throw new Error(
      [
        'promotion_changed did not snapshot canonical promotion priority.',
        `Expected ${expectedPriority}.`,
        `Received ${changedEvent.priority}.`
      ].join(
        ' '
      )
    )
  }


  if (
    JSON.stringify(
      changedEvent.surfaces
    ) !==
    JSON.stringify(
      catalog.surfaces
    )
  ) {

    throw new Error(
      'promotion_changed did not snapshot canonical promotion surfaces.'
    )
  }


  console.log(
    '✓ Promotion change mutated canonical entitlement state'
  )

  console.log(
    '✓ promotion_changed recorded atomically'
  )

  console.log(
    '✓ Promotion priority snapshot preserved'
  )

  console.log(
    '✓ Promotion surface snapshot preserved'
  )


  await sleep(
    50
  )


  /*
   * -------------------------------------------------------
   * 4. CANCEL PROMOTION
   * -------------------------------------------------------
   */


  const cancellation =
    await cancelPromotion({
      supabase,

      entitlementId,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      actorId:
        userId,

      actorType:
        'admin'
    })


  if (
    cancellation.status !==
      'cancelled'
  ) {

    throw new Error(
      `Expected cancelled promotion state, received ${cancellation.status}.`
    )
  }


  await assertEntitlementState({
    supabase,

    entitlementId,

    expectedStatus:
      'cancelled',

    listingId,

    purchaseId
  })


  history =
    await getPromotionHistory({
      supabase,
      listingId
    })


  const cancelledEvent =
    assertEventExists({
      events:
        history,

      eventType:
        'promotion_cancelled',

      entitlementId
    })


  console.log(
    '✓ Promotion cancellation mutated canonical entitlement state'
  )

  console.log(
    '✓ promotion_cancelled recorded atomically'
  )


  /*
   * -------------------------------------------------------
   * 5. VERIFY CANONICAL EVENT CHRONOLOGY
   * -------------------------------------------------------
   */


  const verificationEvents =
    history.filter(
      event =>
        event.entitlementId ===
          entitlementId
    )


  const requiredEventTypes = [
    'promotion_activated',
    'promotion_changed',
    'promotion_cancelled'
  ]


  for (
    const requiredType
    of requiredEventTypes
  ) {

    if (
      !verificationEvents.some(
        event =>
          event.eventType ===
            requiredType
      )
    ) {

      throw new Error(
        `Promotion History is missing ${requiredType}.`
      )
    }
  }


  const orderedVerificationEvents =
    verificationEvents.filter(
      event =>
        requiredEventTypes.includes(
          event.eventType
        )
    )


  assertChronologicalOrder({
    timestamps:
      orderedVerificationEvents.map(
        event =>
          event.occurredAt
      ),

    label:
      'Promotion History'
  })


  console.log(
    '✓ Promotion History is chronological'
  )


  /*
   * -------------------------------------------------------
   * 6. VERIFY UNIFIED LISTING TIMELINE
   * -------------------------------------------------------
   */


  const timeline =
    await resolveListingTimeline({
      supabase,
      listingId,
      ownerId:
        userId
    })


  const promotionTimelineEvents =
    timeline.events.filter(
      event =>
        event.category ===
          'promotion' &&
        event.metadata
          .entitlementId ===
          entitlementId
    )


  for (
    const requiredType
    of requiredEventTypes
  ) {

    const matches =
      promotionTimelineEvents.filter(
        event =>
          event.eventType ===
            requiredType
      )


    if (
      matches.length !==
        1
    ) {

      throw new Error(
        [
          `Unified Listing Timeline expected exactly one ${requiredType} event.`,
          `Received ${matches.length}.`
        ].join(
          ' '
        )
      )
    }
  }


  /*
   * Promotion operational state must no longer be
   * reconstructed as capability_* lifecycle events.
   */

  const reconstructedOperationalDuplicates =
    timeline.events.filter(
      event =>
        event.category ===
          'capability' &&
        event.metadata
          .entitlementId ===
          entitlementId &&
        [
          'capability_scheduled',
          'capability_activated',
          'capability_expired',
          'capability_cancelled'
        ].includes(
          event.eventType
        )
    )


  if (
    reconstructedOperationalDuplicates.length >
      0
  ) {

    throw new Error(
      [
        'Unified Listing Timeline contains reconstructed promotion lifecycle duplicates:',
        reconstructedOperationalDuplicates
          .map(
            event =>
              event.eventType
          )
          .join(', ')
      ].join(
        ' '
      )
    )
  }


  const assignmentEvents =
    timeline.events.filter(
      event =>
        event.category ===
          'capability' &&
        event.metadata
          .entitlementId ===
          entitlementId &&
        event.eventType ===
          'capability_assigned'
    )


  if (
    assignmentEvents.length !==
      1
  ) {

    throw new Error(
      `Expected exactly one capability assignment event for the promotion entitlement, received ${assignmentEvents.length}.`
    )
  }


  console.log(
    '✓ Immutable Promotion History appears in Listing Timeline'
  )

  console.log(
    '✓ No reconstructed operational promotion duplicates'
  )

  console.log(
    '✓ Capability assignment remains visible'
  )


  /*
   * -------------------------------------------------------
   * 7. VERIFY DATABASE IMMUTABILITY
   * -------------------------------------------------------
   */


  await assertPromotionEventsImmutable({
    supabase,

    eventId:
      cancelledEvent.id
  })


  console.log(
    '✓ promotion_events UPDATE rejected'
  )

  console.log(
    '✓ promotion_events DELETE rejected'
  )


  /*
   * -------------------------------------------------------
   * COMPLETE
   * -------------------------------------------------------
   */


  console.log('')

  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION HISTORY VERIFICATION PASSED'
  )

  console.log(
    '========================================'
  )

  console.log(
    '✓ Controlled purchase'
  )

  console.log(
    '✓ Atomic promotion activation history'
  )

  console.log(
    '✓ Atomic promotion change history'
  )

  console.log(
    '✓ Atomic promotion cancellation history'
  )

  console.log(
    '✓ Catalog priority snapshot'
  )

  console.log(
    '✓ Catalog surface snapshot'
  )

  console.log(
    '✓ Listing relationship'
  )

  console.log(
    '✓ Entitlement relationship'
  )

  console.log(
    '✓ Purchase relationship'
  )

  console.log(
    '✓ Chronological immutable history'
  )

  console.log(
    '✓ Unified Listing Timeline'
  )

  console.log(
    '✓ No reconstructed duplicates'
  )

  console.log(
    '✓ Database immutability'
  )

  console.log('')

  console.log(
    'Verification records intentionally preserved.'
  )

  console.log(
    `Test run: ${TEST_RUN_ID}`
  )

  console.log(
    `Purchase: ${purchaseId}`
  )

  console.log(
    `Entitlement: ${entitlementId}`
  )
}


runPromotionHistoryVerification()
  .catch(
    error => {

      console.error('')

      console.error(
        'PROMOTION HISTORY VERIFICATION FAILED'
      )

      console.error(
        error
      )

      process.exitCode =
        1
    }
  )