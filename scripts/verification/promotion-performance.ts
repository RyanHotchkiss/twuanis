import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionPerformance,
  type CanonicalPromotionPerformance,
  type PromotionPerformanceResult
} from '../../lib/promotion-performance-engine'

import {
  getPromotionCatalogProduct,
  resolvePromotionBasePriority
} from '../../lib/promotion-catalog'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'promotion-performance-verification'

const TEST_RUN_ID =
  crypto.randomUUID()

const TEST_PROMOTION_SLUG =
  'featured-listing' as const


const HOUR_MS =
  60 *
  60 *
  1000


const DAY_MS =
  24 *
  HOUR_MS


type VerificationArtifacts = {
  activityIds:
    string[]

  entitlementIds:
    string[]
}


const artifacts:
  VerificationArtifacts = {

  activityIds:
    [],

  entitlementIds:
    []
}


type PromotionProductRow = {
  id:
    string

  slug:
    string

  duration_type:
    string

  duration_days:
    number | null
}


type SyntheticScenario = {
  entitlementId:
    string

  activationAt:
    Date

  cancellationAt:
    Date

  resolutionAt:
    Date
}


type SeedCounts = {
  views?:
    number

  saves?:
    number

  shares?:
    number

  whatsappClicks?:
    number

  emailInquiries?:
    number
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

    ...extra
  }
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
        owner_id
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
}


async function resolvePromotionProduct({
  supabase
}: {
  supabase:
    SupabaseClient
}): Promise<
  PromotionProductRow
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'add_on_products'
      )
      .select(`
        id,
        slug,
        duration_type,
        duration_days
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
      `Active ${TEST_PROMOTION_SLUG} promotion product was not found.`
    )
  }


  return data as
    PromotionProductRow
}


function resolveEntitlementExpiration({
  startsAt,
  product
}: {
  startsAt:
    Date

  product:
    PromotionProductRow
}): string | null {

  if (
    product.duration_type ===
      'listing_lifetime'
  ) {

    return null
  }


  if (
    product.duration_type ===
      'days' &&
    product.duration_days !==
      null
  ) {

    return new Date(
      startsAt.getTime() +
      product.duration_days *
      DAY_MS
    ).toISOString()
  }


  throw new Error(
    `Unsupported promotion duration type: ${product.duration_type}`
  )
}


async function createSyntheticPromotionScenario({
  supabase,
  listingId,
  userId,
  product,
  activationAt,
  cancellationAt,
  resolutionAt,
  scenario
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  userId:
    string

  product:
    PromotionProductRow

  activationAt:
    Date

  cancellationAt:
    Date

  resolutionAt:
    Date

  scenario:
    string
}): Promise<
  SyntheticScenario
> {

  const expiresAt =
    resolveEntitlementExpiration({
      startsAt:
        activationAt,

      product
    })


  /*
   * Historical test entitlement.
   *
   * It is already cancelled because this harness is
   * establishing completed historical evidence.
   */

  const {
    data:
      entitlement,

    error:
      entitlementError
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .insert({
        listing_id:
          listingId,

        product_id:
          product.id,

        owner_id:
          userId,

        status:
          'cancelled',

        source_type:
          'system',

        starts_at:
          activationAt
            .toISOString(),

        expires_at:
          expiresAt,

        purchase_request_id:
          null,

        assigned_by:
          null,

        revoked_at:
          null,

        revoked_by:
          null,

        revocation_reason:
          null
      })
      .select(`
        id
      `)
      .single()


  if (
    entitlementError ||
    !entitlement
  ) {

    throw new Error(
      entitlementError?.message ??
      'Synthetic promotion entitlement could not be created.'
    )
  }


  const entitlementId =
    entitlement.id as string


  artifacts
    .entitlementIds
    .push(
      entitlementId
    )


  const catalog =
    getPromotionCatalogProduct(
      TEST_PROMOTION_SLUG
    )


  const priority =
    resolvePromotionBasePriority(
      catalog
    )


  const scope = {
    scope:
      catalog.scope,

    priorityMode:
      catalog.priorityMode,

    stackingBehavior:
      catalog.stackingBehavior,

    durationBehavior:
      catalog.durationBehavior
  }


  /*
   * Immutable historical Promotion History.
   *
   * We insert deterministic historical occurred_at values.
   * Production RPCs remain untouched and continue using
   * now().
   */

  const {
    error:
      historyError
  } =
    await supabase
      .from(
        'promotion_events'
      )
      .insert([
        {
          listing_id:
            listingId,

          entitlement_id:
            entitlementId,

          purchase_request_id:
            null,

          product_id:
            product.id,

          promotion_slug:
            TEST_PROMOTION_SLUG,

          event_type:
            'promotion_activated',

          previous_state:
            null,

          resulting_state:
            'active',

          starts_at:
            activationAt
              .toISOString(),

          expires_at:
            expiresAt,

          surfaces:
            catalog.surfaces,

          priority,

          scope,

          metadata:
            testMetadata({
              scenario,

              verificationBoundary:
                'activation'
            }),

          actor_id:
            null,

          actor_type:
            'system',

          occurred_at:
            activationAt
              .toISOString()
        },

        {
          listing_id:
            listingId,

          entitlement_id:
            entitlementId,

          purchase_request_id:
            null,

          product_id:
            product.id,

          promotion_slug:
            TEST_PROMOTION_SLUG,

          event_type:
            'promotion_cancelled',

          previous_state:
            'active',

          resulting_state:
            'cancelled',

          starts_at:
            activationAt
              .toISOString(),

          expires_at:
            expiresAt,

          surfaces:
            catalog.surfaces,

          priority,

          scope,

          metadata:
            testMetadata({
              scenario,

              verificationBoundary:
                'cancellation'
            }),

          actor_id:
            null,

          actor_type:
            'system',

          occurred_at:
            cancellationAt
              .toISOString()
        }
      ])


  if (
    historyError
  ) {

    throw new Error(
      `Synthetic Promotion History could not be created: ${historyError.message}`
    )
  }


  return {
    entitlementId,

    activationAt,

    cancellationAt,

    resolutionAt
  }
}


function activityRowsForMetric({
  listingId,
  eventType,
  count,
  startsAt,
  endsAt,
  scenario,
  period
}: {
  listingId:
    string

  eventType:
    string

  count:
    number

  startsAt:
    Date

  endsAt:
    Date

  scenario:
    string

  period:
    string
}) {

  if (
    count <=
      0
  ) {

    return []
  }


  const windowMs =
    endsAt.getTime() -
    startsAt.getTime()


  return Array.from(
    {
      length:
        count
    },

    (
      _,
      index
    ) => {

      /*
       * Distribute events safely inside the period rather
       * than directly on a boundary.
       */

      const fraction =
        (
          index +
          1
        ) /
        (
          count +
          1
        )


      const eventTime =
        new Date(
          startsAt.getTime() +
          windowMs *
          fraction
        )


      return {
        user_id:
          null,

        session_id:
          `promotion-performance-${TEST_RUN_ID}`,

        event_category:
          'listing',

        event_type:
          eventType,

        entity_type:
          'listing',

        entity_id:
          listingId,

        metadata:
          testMetadata({
            scenario,
            period
          }),

        created_at:
          eventTime
            .toISOString()
      }
    }
  )
}


async function seedActivityPeriod({
  supabase,
  listingId,
  startsAt,
  endsAt,
  scenario,
  period,
  counts
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  startsAt:
    Date

  endsAt:
    Date

  scenario:
    string

  period:
    string

  counts:
    SeedCounts
}) {

  const rows = [
    ...activityRowsForMetric({
      listingId,

      eventType:
        'listing_viewed',

      count:
        counts.views ?? 0,

      startsAt,
      endsAt,
      scenario,
      period
    }),

    ...activityRowsForMetric({
      listingId,

      eventType:
        'listing_saved',

      count:
        counts.saves ?? 0,

      startsAt,
      endsAt,
      scenario,
      period
    }),

    ...activityRowsForMetric({
      listingId,

      eventType:
        'listing_shared',

      count:
        counts.shares ?? 0,

      startsAt,
      endsAt,
      scenario,
      period
    }),

    ...activityRowsForMetric({
      listingId,

      eventType:
        'listing_whatsapp_clicked',

      count:
        counts.whatsappClicks ?? 0,

      startsAt,
      endsAt,
      scenario,
      period
    }),

    ...activityRowsForMetric({
      listingId,

      eventType:
        'listing_email_inquiry',

      count:
        counts.emailInquiries ?? 0,

      startsAt,
      endsAt,
      scenario,
      period
    })
  ]


  if (
    rows.length ===
      0
  ) {

    return
  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        'activity_events'
      )
      .insert(
        rows
      )
      .select(`
        id
      `)


  if (
    error
  ) {

    throw new Error(
      `Could not seed ${scenario}/${period} activity: ${error.message}`
    )
  }


  for (
    const row
    of data ?? []
  ) {

    artifacts
      .activityIds
      .push(
        row.id
      )
  }
}


function requireCanonicalPerformance(
  result:
    PromotionPerformanceResult
): CanonicalPromotionPerformance {

  if (
    'status' in result
  ) {

    throw new Error(
      `Promotion Performance unexpectedly returned insufficient evidence: ${result.reason}`
    )
  }


  return result
}


function assertEqual(
  actual:
    unknown,

  expected:
    unknown,

  label:
    string
) {

  if (
    actual !==
      expected
  ) {

    throw new Error(
      [
        `${label} failed.`,
        `Expected ${String(expected)}.`,
        `Received ${String(actual)}.`
      ].join(
        ' '
      )
    )
  }
}


function assertNear(
  actual:
    number,

  expected:
    number,

  label:
    string
) {

  if (
    Math.abs(
      actual -
      expected
    ) >
      0.01
  ) {

    throw new Error(
      [
        `${label} failed.`,
        `Expected ${expected}.`,
        `Received ${actual}.`
      ].join(
        ' '
      )
    )
  }
}


async function verifyMatureScenario({
  supabase,
  listingId,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nMATURE PERFORMANCE SCENARIO'
  )


  /*
   * Fixed deterministic timeline:
   *
   * Jan 1 → Jan 3 : BEFORE 48h
   * Jan 3 → Jan 5 : DURING 48h
   * Jan 5 → Jan 7 : AFTER 48h
   */

  const activationAt =
    new Date(
      '2026-01-03T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      '2026-01-05T00:00:00.000Z'
    )


  const resolutionAt =
    new Date(
      '2026-01-07T01:00:00.000Z'
    )


  const beforeStart =
    new Date(
      activationAt.getTime() -
      2 *
      DAY_MS
    )


  const afterEnd =
    new Date(
      cancellationAt.getTime() +
      2 *
      DAY_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,
      listingId,
      userId,
      product,
      activationAt,
      cancellationAt,
      resolutionAt,

      scenario:
        'mature'
    })


  await seedActivityPeriod({
    supabase,
    listingId,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'mature',

    period:
      'before',

    counts: {
      views:
        100,

      saves:
        10,

      /*
       * Deliberately zero.
       *
       * This proves baseline-zero percentage withholding.
       */
      shares:
        0,

      whatsappClicks:
        2,

      emailInquiries:
        1
    }
  })


  await seedActivityPeriod({
    supabase,
    listingId,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'mature',

    period:
      'during',

    counts: {
      views:
        150,

      saves:
        20,

      shares:
        8,

      whatsappClicks:
        6,

      emailInquiries:
        3
    }
  })


  await seedActivityPeriod({
    supabase,
    listingId,

    startsAt:
      cancellationAt,

    endsAt:
      afterEnd,

    scenario:
      'mature',

    period:
      'after',

    counts: {
      views:
        120,

      saves:
        12,

      shares:
        5,

      whatsappClicks:
        3,

      emailInquiries:
        1
    }
  })


  const performance =
    requireCanonicalPerformance(
      await getPromotionPerformance({
        supabase,

        listingId,

        entitlementId:
          scenario.entitlementId,

        now:
          resolutionAt
      })
    )


  /*
   * -------------------------------------------------------
   * WINDOW BOUNDARIES
   * -------------------------------------------------------
   */

  assertEqual(
    performance.before
      .durationHours,

    48,

    'Before duration'
  )


  assertEqual(
    performance.during
      .durationHours,

    48,

    'During duration'
  )


  assertEqual(
    performance.after
      .durationHours,

    48,

    'After duration'
  )


  assertEqual(
    performance.before
      .startsAt,

    beforeStart
      .toISOString(),

    'Before start'
  )


  assertEqual(
    performance.before
      .endsAt,

    activationAt
      .toISOString(),

    'Before end'
  )


  assertEqual(
    performance.during
      .startsAt,

    activationAt
      .toISOString(),

    'During start'
  )


  assertEqual(
    performance.during
      .endsAt,

    cancellationAt
      .toISOString(),

    'During end'
  )


  assertEqual(
    performance.after
      .startsAt,

    cancellationAt
      .toISOString(),

    'After start'
  )


  assertEqual(
    performance.after
      .endsAt,

    afterEnd
      .toISOString(),

    'After end'
  )


  console.log(
    '✓ Equal-duration Before / During / After windows'
  )


  /*
   * -------------------------------------------------------
   * RAW COUNTS
   * -------------------------------------------------------
   */

  assertEqual(
    performance.before
      .counts.views,

    100,

    'Before views'
  )


  assertEqual(
    performance.during
      .counts.views,

    150,

    'During views'
  )


  assertEqual(
    performance.after
      .counts.views,

    120,

    'After views'
  )


  assertEqual(
    performance.before
      .counts.saves,

    10,

    'Before saves'
  )


  assertEqual(
    performance.during
      .counts.saves,

    20,

    'During saves'
  )


  assertEqual(
    performance.during
      .counts.shares,

    8,

    'During shares'
  )


  assertEqual(
    performance.during
      .counts.whatsappClicks,

    6,

    'During WhatsApp clicks'
  )


  assertEqual(
    performance.during
      .counts.emailInquiries,

    3,

    'During email inquiries'
  )


  assertEqual(
    performance.before
      .counts.buyerActions,

    3,

    'Before buyer actions'
  )


  assertEqual(
    performance.during
      .counts.buyerActions,

    9,

    'During buyer actions'
  )


  console.log(
    '✓ Raw behavioral counts preserved'
  )

  console.log(
    '✓ Buyer actions aggregated'
  )


  /*
   * -------------------------------------------------------
   * BEFORE → DURING COMPARISON
   * -------------------------------------------------------
   */

  const comparison =
    performance
      .comparison
      .beforeToDuring


  assertEqual(
    comparison.views
      .absoluteChange,

    50,

    'View absolute change'
  )


  assertNear(
    comparison.views
      .percentageChange ??
      Number.NaN,

    50,

    'View percentage change'
  )


  assertEqual(
    comparison.saves
      .absoluteChange,

    10,

    'Save absolute change'
  )


  assertNear(
    comparison.saves
      .percentageChange ??
      Number.NaN,

    100,

    'Save percentage change'
  )


  assertEqual(
    comparison.buyerActions
      .absoluteChange,

    6,

    'Buyer action absolute change'
  )


  assertNear(
    comparison.buyerActions
      .percentageChange ??
      Number.NaN,

    200,

    'Buyer action percentage change'
  )


  /*
   * Shares deliberately had a zero baseline.
   */

  assertEqual(
    comparison.shares
      .baseline,

    0,

    'Share zero baseline'
  )


  assertEqual(
    comparison.shares
      .absoluteChange,

    8,

    'Share absolute change'
  )


  assertEqual(
    comparison.shares
      .percentageChange,

    null,

    'Share percentage withheld'
  )


  assertEqual(
    comparison.shares
      .evidenceStatus,

    'baseline_zero',

    'Share baseline-zero evidence'
  )


  console.log(
    '✓ Absolute changes calculated'
  )

  console.log(
    '✓ Valid percentage changes calculated'
  )

  console.log(
    '✓ Zero-baseline percentage withheld'
  )


  /*
   * -------------------------------------------------------
   * AFTER COMPARISON
   * -------------------------------------------------------
   */

  if (
    !performance
      .comparison
      .duringToAfter
  ) {

    throw new Error(
      'Expected complete During → After comparison.'
    )
  }


  assertNear(
    performance
      .comparison
      .duringToAfter
      .views
      .percentageChange ??
      Number.NaN,

    -20,

    'Post-promotion view percentage change'
  )


  console.log(
    '✓ Complete post-promotion period measured'
  )


  /*
   * -------------------------------------------------------
   * EVIDENCE POLICY
   * -------------------------------------------------------
   */

  assertEqual(
    performance
      .interpretationAvailable,

    true,

    'Mature interpretation availability'
  )


  assertEqual(
    performance
      .interpretationStatus,

    'sufficient',

    'Mature interpretation evidence'
  )


  assertEqual(
    performance
      .listingClicksSupported,

    false,

    'Unsupported listing-click metric'
  )


  const causalDisclaimer =
    performance.notes.some(
      note =>
        note
          .toLowerCase()
          .includes(
            'does not establish'
          ) &&
        note
          .toLowerCase()
          .includes(
            'caused'
          )
    )


  assertEqual(
    causalDisclaimer,

    true,

    'Causal disclaimer'
  )


  console.log(
    '✓ ≥24-hour evidence interpretation allowed'
  )

  console.log(
    '✓ Unsupported listing-click metric remains disabled'
  )

  console.log(
    '✓ No unsupported causal claim'
  )
}


async function verifyShortScenario({
  supabase,
  listingId,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nSHORT-DURATION EVIDENCE SCENARIO'
  )


  /*
   * 12 hours before
   * 12 hours during
   *
   * Raw evidence exists, but interpretation must
   * remain unavailable.
   */

  const activationAt =
    new Date(
      '2026-02-02T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      activationAt.getTime() +
      12 *
      HOUR_MS
    )


  const resolutionAt =
    new Date(
      cancellationAt.getTime() +
      13 *
      HOUR_MS
    )


  const beforeStart =
    new Date(
      activationAt.getTime() -
      12 *
      HOUR_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,
      listingId,
      userId,
      product,
      activationAt,
      cancellationAt,
      resolutionAt,

      scenario:
        'short-duration'
    })


  await seedActivityPeriod({
    supabase,
    listingId,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'short-duration',

    period:
      'before',

    counts: {
      views:
        10
    }
  })


  await seedActivityPeriod({
    supabase,
    listingId,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'short-duration',

    period:
      'during',

    counts: {
      views:
        15
    }
  })


  const performance =
    requireCanonicalPerformance(
      await getPromotionPerformance({
        supabase,

        listingId,

        entitlementId:
          scenario.entitlementId,

        now:
          resolutionAt
      })
    )


  assertEqual(
    performance.before
      .counts.views,

    10,

    'Short-period before raw views'
  )


  assertEqual(
    performance.during
      .counts.views,

    15,

    'Short-period during raw views'
  )


  assertEqual(
    performance
      .comparison
      .beforeToDuring
      .views
      .absoluteChange,

    5,

    'Short-period absolute change'
  )


  assertEqual(
    performance
      .comparison
      .beforeToDuring
      .views
      .percentageChange,

    null,

    'Short-period percentage withheld'
  )


  assertEqual(
    performance
      .comparison
      .beforeToDuring
      .views
      .evidenceStatus,

    'insufficient_duration',

    'Short-period metric evidence status'
  )


  assertEqual(
    performance
      .interpretationAvailable,

    false,

    'Short-period interpretation availability'
  )


  assertEqual(
    performance
      .interpretationStatus,

    'insufficient_duration',

    'Short-period interpretation status'
  )


  console.log(
    '✓ Short-period raw counts preserved'
  )

  console.log(
    '✓ Short-period absolute change preserved'
  )

  console.log(
    '✓ <24-hour percentage interpretation withheld'
  )

  console.log(
    '✓ <24-hour performance interpretation withheld'
  )
}

async function cleanupStaleSyntheticActivity({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  const {
    error
  } =
    await supabase
      .from(
        'activity_events'
      )
      .delete()
      .eq(
        'metadata->>testSuite',
        TEST_SUITE
      )


  if (
    error
  ) {

    throw new Error(
      `Could not clean stale Promotion Performance verification activity: ${error.message}`
    )
  }
}

async function cleanupMutableArtifacts({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  console.log(
    '\nCLEANUP'
  )


  /*
   * promotion_events are intentionally NOT deleted.
   *
   * Their immutability is canonical platform behavior.
   *
   * The associated synthetic entitlements therefore
   * remain as historical verification lineage.
   */


  if (
    artifacts.activityIds.length >
      0
  ) {

    const {
      error
    } =
      await supabase
        .from(
          'activity_events'
        )
        .delete()
        .in(
          'id',
          artifacts.activityIds
        )


    if (
      error
    ) {

      console.error(
        'Synthetic activity cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic activity events removed: ${artifacts.activityIds.length}`
      )
    }
  }


  console.log(
    'Immutable Promotion History intentionally preserved.'
  )


  console.log(
    'Verification entitlement IDs:',
    artifacts
      .entitlementIds
      .join(
        ', '
      )
  )
}


async function verifyPromotionPerformance() {

  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION PERFORMANCE VERIFICATION'
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

  await cleanupStaleSyntheticActivity({
    supabase
    })

  console.log(
    'Test user:',
    userId
  )


  console.log(
    'Test listing:',
    listingId
  )


  try {

    await assertTestListingOwnership({
      supabase,
      userId,
      listingId
    })


    const product =
      await resolvePromotionProduct({
        supabase
      })


    console.log(
      'Promotion:',
      product.slug,
      product.id
    )


    await verifyMatureScenario({
      supabase,
      listingId,
      userId,
      product
    })


    await verifyShortScenario({
      supabase,
      listingId,
      userId,
      product
    })


    console.log('')


    console.log(
      '========================================'
    )

    console.log(
      'PROMOTION PERFORMANCE VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )


    console.log(
      '✓ Pre-promotion baseline period'
    )


    console.log(
      '✓ Promotion-active period'
    )


    console.log(
      '✓ Post-promotion period'
    )


    console.log(
      '✓ Listing views'
    )


    console.log(
      '✓ Saves'
    )


    console.log(
      '✓ Shares'
    )


    console.log(
      '✓ WhatsApp clicks'
    )


    console.log(
      '✓ Email inquiries'
    )


    console.log(
      '✓ Buyer actions'
    )


    console.log(
      '✓ Raw counts'
    )


    console.log(
      '✓ Absolute changes'
    )


    console.log(
      '✓ Percentage changes when valid'
    )


    console.log(
      '✓ Zero-baseline protection'
    )


    console.log(
      '✓ 24-hour evidence threshold'
    )


    console.log(
      '✓ Canonical Promotion Performance result'
    )


    console.log(
      '✓ Unsupported metric protection'
    )


    console.log(
      '✓ No unsupported causal claims'
    )

  } finally {

    await cleanupMutableArtifacts({
      supabase
    })
  }
}


verifyPromotionPerformance()
  .catch(
    error => {

      console.error('')


      console.error(
        'PROMOTION PERFORMANCE VERIFICATION FAILED'
      )


      console.error(
        error
      )


      process.exitCode =
        1
    }
  )