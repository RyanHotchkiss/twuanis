import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveCommercialTimeline
} from '@/lib/commercial-timeline'

import {
  loadEnvConfig
} from '@next/env'

loadEnvConfig(
  process.cwd()
)

const TEST_SUITE =
  'commercial-timeline-verification'

const TEST_USER_ID =
  'd81064bc-1b4a-478f-8f6a-b263c4779bc1'


function createAdminClient():
  SupabaseClient {

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY


  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {

    throw new Error(
      'Missing Supabase environment variables.'
    )
  }


  return createClient(
    supabaseUrl,
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


function assert(
  condition:
    unknown,

  message:
    string
): asserts condition {

  if (
    !condition
  ) {

    throw new Error(
      message
    )
  }


  console.log(
    `✓ ${message}`
  )
}


function iso(
  value:
    string
): string {

  return new Date(
    value
  ).toISOString()
}


async function cleanup({
  supabase,
  purchaseId,
  paymentId,
  subscriptionId,
  entitlementId,
  promotionEventIds,
  activityEventId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  paymentId:
    string | null

  subscriptionId:
    string | null

  entitlementId:
    string | null

  promotionEventIds:
    string[]

  activityEventId:
    string | null
}) {

  if (
    promotionEventIds.length >
      0
  ) {

    await supabase
      .from(
        'promotion_events'
      )
      .delete()
      .in(
        'id',
        promotionEventIds
      )
  }


  if (
    activityEventId
  ) {

    await supabase
      .from(
        'activity_events'
      )
      .delete()
      .eq(
        'id',
        activityEventId
      )
  }


  if (
    entitlementId
  ) {

    await supabase
      .from(
        'listing_entitlements'
      )
      .delete()
      .eq(
        'id',
        entitlementId
      )
  }

  if (
    paymentId
    ) {

    await supabase
        .from(
        'sinpe_payments'
        )
        .delete()
        .eq(
        'id',
        paymentId
        )
    }

  if (
    subscriptionId
  ) {

    await supabase
      .from(
        'user_subscriptions'
      )
      .delete()
      .eq(
        'id',
        subscriptionId
      )
  }

  await supabase
    .from(
      'purchase_request_events'
    )
    .delete()
    .eq(
      'purchase_request_id',
      purchaseId
    )


  await supabase
    .from(
      'purchase_requests'
    )
    .delete()
    .eq(
      'id',
      purchaseId
    )
}


async function verifyCommercialTimeline() {

  const supabase =
    createAdminClient()

  const testRun =
    crypto.randomUUID()

  const baseTime =
    new Date(
      '2026-08-10T12:00:00.000Z'
    )


  const createdAt =
    iso(
      '2026-08-10T12:00:00.000Z'
    )

  const paymentAt =
    iso(
      '2026-08-10T12:05:00.000Z'
    )

  const approvedAt =
    iso(
      '2026-08-10T12:10:00.000Z'
    )

  const activatedAt =
    iso(
      '2026-08-10T12:15:00.000Z'
    )

  const promotionScheduledAt =
    iso(
      '2026-08-10T12:20:00.000Z'
    )

  const promotionActivatedAt =
    iso(
      '2026-08-10T12:25:00.000Z'
    )


  let purchaseId =
    ''

  let paymentId:
    string | null =
      null

  let subscriptionId:
    string | null =
      null

  let entitlementId:
    string | null =
      null

  let activityEventId:
    string | null =
      null

  const promotionEventIds:
    string[] =
      []


  console.log(
    '========================================'
  )

  console.log(
    'COMMERCIAL TIMELINE VERIFICATION'
  )

  console.log(
    '========================================'
  )

  console.log(
    `Test suite: ${TEST_SUITE}`
  )

  console.log(
    `Test run: ${testRun}`
  )

  console.log(
    `User: ${TEST_USER_ID}`
  )


  try {

    /*
     * -----------------------------------------------------
     * CATALOG FIXTURES
     * -----------------------------------------------------
     */


    const {
      data:
        packageData,

      error:
        packageError
    } =
      await supabase
        .from(
          'packages'
        )
        .select(`
          id
        `)
        .eq(
          'is_active',
          true
        )
        .limit(1)
        .single()


    if (
      packageError ||
      !packageData
    ) {

      throw new Error(
        packageError?.message ??
        'No active package available for verification.'
      )
    }


    const {
      data:
        addOnData,

      error:
        addOnError
    } =
      await supabase
        .from(
          'add_on_products'
        )
        .select(`
          id,
          slug
        `)
        .eq(
          'is_active',
          true
        )
        .limit(1)
        .single()


    if (
      addOnError ||
      !addOnData
    ) {

      throw new Error(
        addOnError?.message ??
        'No active add-on available for verification.'
      )
    }


    const {
      data:
        listingData,

      error:
        listingError
    } =
      await supabase
        .from(
          'listings'
        )
        .select(`
          id
        `)
        .eq(
          'owner_id',
          TEST_USER_ID
        )
        .limit(1)
        .single()


    if (
      listingError ||
      !listingData
    ) {

      throw new Error(
        listingError?.message ??
        'No owned listing available for verification.'
      )
    }


    /*
     * -----------------------------------------------------
     * PURCHASE
     * -----------------------------------------------------
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
        .insert({
          owner_id:
            TEST_USER_ID,

          product_type:
            'package',

          package_id:
            packageData.id,

          add_on_product_id:
            null,

          target_type:
            'account',

          listing_id:
            null,

          quantity:
            1,

          unit_amount:
            1000,

          amount:
            1000,

          currency:
            'CRC',

          status:
            'approved',

          approved_at:
            approvedAt,

          metadata: {
            testSuite:
              TEST_SUITE,

            testRun
          },

          created_at:
            createdAt,

          updated_at:
            approvedAt
        })
        .select(`
          id
        `)
        .single()


    if (
      purchaseError ||
      !purchaseData
    ) {

      throw new Error(
        purchaseError?.message ??
        'Synthetic purchase could not be created.'
      )
    }


    purchaseId =
      purchaseData.id


    /*
     * -----------------------------------------------------
     * PURCHASE EVENTS
     * -----------------------------------------------------
     */


    const {
      error:
        purchaseEventsError
    } =
      await supabase
        .from(
          'purchase_request_events'
        )
        .insert([
          {
            purchase_request_id:
              purchaseId,

            event_type:
              'purchase_created',

            previous_status:
              null,

            resulting_status:
              'pending',

            actor_id:
              TEST_USER_ID,

            metadata: {
              testSuite:
                TEST_SUITE,

              testRun
            },

            created_at:
              createdAt
          },

          {
            purchase_request_id:
              purchaseId,

            event_type:
              'purchase_approved',

            previous_status:
              'pending',

            resulting_status:
              'approved',

            actor_id:
              TEST_USER_ID,

            metadata: {
              testSuite:
                TEST_SUITE,

              testRun
            },

            created_at:
              approvedAt
          }
        ])


    if (
      purchaseEventsError
    ) {

      throw new Error(
        purchaseEventsError.message
      )
    }


     /*
     * -----------------------------------------------------
     * SUBSCRIPTION
     * -----------------------------------------------------
     */


    const {
      data:
        subscriptionData,

      error:
        subscriptionError
    } =
      await supabase
        .from(
          'user_subscriptions'
        )
        .insert({
          user_id:
            TEST_USER_ID,

          package_id:
            packageData.id,

          status:
            'expired',

          billing_cycle:
            'monthly',

          started_at:
            activatedAt,

          current_period_start:
            activatedAt,

          current_period_end:
            iso(
              '2026-09-10T12:15:00.000Z'
            ),

          expired_at:
            iso(
                '2026-09-10T12:15:00.000Z'
            ),

          purchase_request_id:
            purchaseId,

          created_at:
            activatedAt,

          updated_at:
            activatedAt
        })
        .select(`
          id
        `)
        .single()


    if (
      subscriptionError ||
      !subscriptionData
    ) {

      throw new Error(
        subscriptionError?.message ??
        'Synthetic subscription could not be created.'
      )
    }


    subscriptionId =
      subscriptionData.id




    /*
     * -----------------------------------------------------
     * PAYMENT
     * -----------------------------------------------------
     */


    const {
      data:
        paymentData,

      error:
        paymentError
    } =
      await supabase
        .from(
          'sinpe_payments'
        )
        .insert({
          user_id:
            TEST_USER_ID,

          purchase_request_id:
            purchaseId,

          subscription_id:
            subscriptionId,

          amount:
            1000,

          currency:
            'CRC',

          sinpe_reference:
            `VERIFY-${testRun}`,

          sender_name:
            'Verification User',

          sender_phone:
            null,

          payment_date:
            '2026-08-10',

          status:
            'approved',

          reviewed_by:
            TEST_USER_ID,

          approved_at:
            paymentAt,

          reviewed_at:
            paymentAt,

          created_at:
            paymentAt,

          updated_at:
            paymentAt
        })
        .select(`
          id
        `)
        .single()


    if (
      paymentError ||
      !paymentData
    ) {

      throw new Error(
        paymentError?.message ??
        'Synthetic payment could not be created.'
      )
    }


    paymentId =
      paymentData.id

    /*
     * -----------------------------------------------------
     * ENTITLEMENT
     * -----------------------------------------------------
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
        .insert({
        owner_id:
            TEST_USER_ID,

        listing_id:
            listingData.id,

        product_id:
            addOnData.id,

        purchase_request_id:
            purchaseId,

        source_type:
            'purchase',

        status:
            'active',

        starts_at:
            promotionScheduledAt,

        expires_at:
            iso(
            '2026-09-09T12:20:00.000Z'
            )
        })
        .select(`
          id
        `)
        .single()


    if (
      entitlementError ||
      !entitlementData
    ) {

      throw new Error(
        entitlementError?.message ??
        'Synthetic entitlement could not be created.'
      )
    }


    entitlementId =
      entitlementData.id


    /*
     * -----------------------------------------------------
     * ACTIVATION EVENT
     * -----------------------------------------------------
     */


    const {
      data:
        activityData,

      error:
        activityError
    } =
      await supabase
        .from(
          'activity_events'
        )
        .insert({
          user_id:
            TEST_USER_ID,

          event_category:
            'account',

          event_type:
            'commercial_activation_completed',

          entity_type:
            'subscription',

          entity_id:
            subscriptionId,

          metadata: {
            purchaseId,

            productType:
              'package',

            activationType:
              'subscription',

            activatedAt,

            testSuite:
              TEST_SUITE,

            testRun
          },

          created_at:
            activatedAt
        })
        .select(`
          id
        `)
        .single()


    if (
      activityError ||
      !activityData
    ) {

      throw new Error(
        activityError?.message ??
        'Synthetic activation activity could not be created.'
      )
    }


    activityEventId =
      activityData.id


    /*
     * -----------------------------------------------------
     * PROMOTION HISTORY
     * -----------------------------------------------------
     */


    const promotionRows = [
      {
        listing_id:
          listingData.id,

        entitlement_id:
          entitlementId,

        purchase_request_id:
          purchaseId,

        product_id:
          addOnData.id,

        promotion_slug:
          addOnData.slug,

        event_type:
          'promotion_scheduled',

        previous_state:
          null,

        resulting_state:
          'scheduled',

        starts_at:
          promotionScheduledAt,

        expires_at:
          iso(
            '2026-09-09T12:20:00.000Z'
          ),

        surfaces:
          [],

        priority:
          10,

        scope:
          {},

        metadata: {
          testSuite:
            TEST_SUITE,

          testRun
        },

        actor_id:
          TEST_USER_ID,

        actor_type:
          'user',

        occurred_at:
          promotionScheduledAt,

        created_at:
          promotionScheduledAt
      },

      {
        listing_id:
          listingData.id,

        entitlement_id:
          entitlementId,

        purchase_request_id:
          purchaseId,

        product_id:
          addOnData.id,

        promotion_slug:
          addOnData.slug,

        event_type:
          'promotion_activated',

        previous_state:
          'scheduled',

        resulting_state:
          'active',

        starts_at:
          promotionScheduledAt,

        expires_at:
            iso(
                '2026-09-09T12:20:00.000Z'
            ),

        surfaces:
          [],

        priority:
          10,

        scope:
          {},

        metadata: {
          testSuite:
            TEST_SUITE,

          testRun
        },

        actor_id:
          null,

        actor_type:
          'system',

        occurred_at:
          promotionActivatedAt,

        created_at:
          promotionActivatedAt
      }
    ]


    const {
      data:
        promotionData,

      error:
        promotionError
    } =
      await supabase
        .from(
          'promotion_events'
        )
        .insert(
          promotionRows
        )
        .select(`
          id
        `)


    if (
      promotionError ||
      !promotionData
    ) {

      throw new Error(
        promotionError?.message ??
        'Synthetic promotion history could not be created.'
      )
    }


    promotionEventIds.push(
      ...promotionData.map(
        row =>
          row.id
      )
    )


    /*
     * -----------------------------------------------------
     * RESOLVE
     * -----------------------------------------------------
     */


    const timeline =
      await resolveCommercialTimeline({
        supabase,

        userId:
          TEST_USER_ID
      })


    const syntheticEvents =
      timeline.events.filter(
        event =>
          event.purchaseRequestId ===
            purchaseId ||
          event.metadata.testRun ===
            testRun
      )


    console.log(
      ''
    )

    console.log(
      'CANONICAL COMMERCIAL TIMELINE'
    )


    assert(
      timeline.userId ===
        TEST_USER_ID,

      'User identity preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'purchase' &&
          event.eventType ===
            'purchase_created'
      ),

      'Purchase creation preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'payment' &&
          event.eventType ===
            'sinpe_approved'
      ),

      'Payment history preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'purchase' &&
          event.eventType ===
            'purchase_approved'
      ),

      'Purchase approval preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'activation' &&
          event.eventType ===
            'commercial_activation_completed'
      ),

      'Activation history preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'subscription' &&
          event.eventType ===
            'subscription_started'
      ),

      'Subscription history preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'promotion' &&
          event.eventType ===
            'promotion_scheduled'
      ),

      'Promotion scheduling preserved'
    )


    assert(
      syntheticEvents.some(
        event =>
          event.source ===
            'promotion' &&
          event.eventType ===
            'promotion_activated'
      ),

      'Promotion activation preserved'
    )


    /*
     * -----------------------------------------------------
     * SOURCE PRESERVATION
     * -----------------------------------------------------
     */


    const sources =
      new Set(
        syntheticEvents.map(
          event =>
            event.source
        )
      )


    assert(
      sources.has(
        'purchase'
      ),

      'Purchase source preserved'
    )


    assert(
      sources.has(
        'payment'
      ),

      'Payment source preserved'
    )


    assert(
      sources.has(
        'activation'
      ),

      'Activation source preserved'
    )


    assert(
      sources.has(
        'subscription'
      ),

      'Subscription source preserved'
    )


    assert(
      sources.has(
        'promotion'
      ),

      'Promotion source preserved'
    )


    /*
     * -----------------------------------------------------
     * DETERMINISTIC ORDERING
     * -----------------------------------------------------
     */


    for (
      let index = 1;
      index <
        syntheticEvents.length;
      index += 1
    ) {

      const previous =
        syntheticEvents[
          index - 1
        ]

      const current =
        syntheticEvents[
          index
        ]


      const previousTime =
        new Date(
          previous.occurredAt
        ).getTime()

      const currentTime =
        new Date(
          current.occurredAt
        ).getTime()


      assert(
        previousTime >=
          currentTime,

        `Timeline event ${index} preserves newest-first ordering`
      )
    }


    /*
     * -----------------------------------------------------
     * RELATIONSHIP PRESERVATION
     * -----------------------------------------------------
     */


    assert(
      syntheticEvents.every(
        event =>
          event.purchaseRequestId ===
            purchaseId ||
          event.source ===
            'subscription'
      ),

      'Purchase relationship preserved across commercial history'
    )


    const promotionEvents =
      syntheticEvents.filter(
        event =>
          event.source ===
            'promotion'
      )


    assert(
      promotionEvents.every(
        event =>
          event.entitlementId ===
            entitlementId
      ),

      'Promotion entitlement relationship preserved'
    )


    assert(
      promotionEvents.every(
        event =>
          event.listingId ===
            listingData.id
      ),

      'Promotion listing relationship preserved'
    )


    /*
     * -----------------------------------------------------
     * DUPLICATE SUPPRESSION
     * -----------------------------------------------------
     *
     * Promotion history is loaded through both purchase IDs
     * and entitlement IDs. The resolver must deduplicate.
     */


    const promotionIds =
      promotionEvents.map(
        event =>
          event.id
      )


    assert(
      promotionIds.length ===
        new Set(
          promotionIds
        ).size,

      'Promotion history is not duplicated across ownership paths'
    )


    /*
     * -----------------------------------------------------
     * OWNERSHIP ISOLATION
     * -----------------------------------------------------
     */


    const foreignUserId =
      crypto.randomUUID()


    const foreignTimeline =
      await resolveCommercialTimeline({
        supabase,

        userId:
          foreignUserId
      })


    assert(
      !foreignTimeline.events.some(
        event =>
          event.purchaseRequestId ===
            purchaseId ||
          event.metadata.testRun ===
            testRun
      ),

      'Commercial timeline preserves ownership isolation'
    )


    /*
     * -----------------------------------------------------
     * CANONICAL EVENT ORDER
     * -----------------------------------------------------
     */


    const orderedSynthetic =
      [
        ...syntheticEvents
      ].sort(
        (
          first,
          second
        ) =>
          new Date(
            first.occurredAt
          ).getTime() -
          new Date(
            second.occurredAt
          ).getTime()
      )


    const sequence =
      orderedSynthetic.map(
        event =>
          event.eventType
      )


    const createdIndex =
      sequence.indexOf(
        'purchase_created'
      )

    const paymentIndex =
      sequence.indexOf(
        'sinpe_approved'
      )

    const approvalIndex =
      sequence.indexOf(
        'purchase_approved'
      )

    const activationIndex =
      sequence.indexOf(
        'commercial_activation_completed'
      )

    const subscriptionIndex =
      sequence.indexOf(
        'subscription_started'
      )

    const promotionScheduledIndex =
      sequence.indexOf(
        'promotion_scheduled'
      )

    const promotionActivatedIndex =
      sequence.indexOf(
        'promotion_activated'
      )


    assert(
      createdIndex !== -1 &&
      paymentIndex !== -1 &&
      approvalIndex !== -1 &&
      activationIndex !== -1 &&
      subscriptionIndex !== -1 &&
      promotionScheduledIndex !== -1 &&
      promotionActivatedIndex !== -1,

      'All canonical commercial stages are present'
    )


    assert(
      createdIndex <
        paymentIndex,

      'Purchase precedes payment'
    )


    assert(
      paymentIndex <
        approvalIndex,

      'Payment precedes purchase approval'
    )


    assert(
      approvalIndex <
        activationIndex,

      'Approval precedes activation'
    )


    assert(
      activationIndex <=
        subscriptionIndex,

      'Activation and subscription chronology remains valid'
    )


    assert(
      subscriptionIndex <=
        promotionScheduledIndex,

      'Subscription precedes promotion scheduling'
    )


    assert(
      promotionScheduledIndex <
        promotionActivatedIndex,

      'Promotion scheduling precedes promotion activation'
    )


    console.log(
      ''
    )

    console.log(
      '========================================'
    )

    console.log(
      'COMMERCIAL TIMELINE VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )

    console.log(
      '✓ Purchase history'
    )

    console.log(
      '✓ Payment history'
    )

    console.log(
      '✓ Approval history'
    )

    console.log(
      '✓ Activation history'
    )

    console.log(
      '✓ Subscription history'
    )

    console.log(
      '✓ Promotion history'
    )

    console.log(
      '✓ Deterministic ordering'
    )

    console.log(
      '✓ Source preservation'
    )

    console.log(
      '✓ Relationship preservation'
    )

    console.log(
      '✓ Promotion duplicate suppression'
    )

    console.log(
      '✓ Ownership isolation'
    )

    console.log(
      '✓ Canonical Commercial Timeline'
    )

  } finally {

    if (
      purchaseId
    ) {

      console.log(
        ''
      )

      console.log(
        'CLEANUP'
      )


      await cleanup({
        supabase,

        purchaseId,

        paymentId,

        subscriptionId,

        entitlementId,

        promotionEventIds,

        activityEventId
      })


      console.log(
        'Synthetic commercial timeline evidence removed'
      )
    }
  }
}


async function run() {

  try {

    await verifyCommercialTimeline()

  } catch (
    error
  ) {

    console.error(
      ''
    )

    console.error(
      'COMMERCIAL TIMELINE VERIFICATION FAILED'
    )

    console.error(
      error
    )

    process.exitCode =
      1
  }
}


void run()