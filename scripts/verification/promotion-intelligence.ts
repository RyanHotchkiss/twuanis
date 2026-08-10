import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  CanonicalPromotionIntelligence,
  PromotionIntelligenceResult
} from '../../lib/promotion-intelligence-engine'

import {
  getPromotionCatalogProduct,
  resolvePromotionBasePriority
} from '../../lib/promotion-catalog'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'promotion-intelligence-verification'

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


type TargetListing = {
  id:
    string

  owner_id:
    string | null

  transaction_type:
    string

  province:
    string | null

  canton:
    string | null

  district:
    string | null

  property_type:
    string | null

  bedrooms:
    string | null

  bathrooms:
    string | null

  property_area:
    string | null

  construction_area:
    string | null

  current_price:
    number | null

  monthly_price:
    number | null

  currency:
    string
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


type VerificationArtifacts = {
  activityIds:
    string[]

  cohortListingIds:
    string[]

  entitlementIds:
    string[]
}


const artifacts:
  VerificationArtifacts = {

  activityIds:
    [],

  cohortListingIds:
    [],

  entitlementIds:
    []
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
    !Number.isFinite(
      actual
    ) ||
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


function requireCanonicalIntelligence(
  result:
    PromotionIntelligenceResult
): CanonicalPromotionIntelligence {

  if (
    'status' in result
  ) {

    throw new Error(
      `Promotion Intelligence unexpectedly returned insufficient evidence: ${result.reason}`
    )
  }


  return result
}


async function loadTargetListing({
  supabase,
  listingId,
  userId
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  userId:
    string
}): Promise<
  TargetListing
> {

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
        transaction_type,
        province,
        canton,
        district,
        property_type,
        bedrooms,
        bathrooms,
        property_area,
        construction_area,
        current_price,
        monthly_price,
        currency
      `)
      .eq(
        'id',
        listingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new Error(
      `Could not load verification listing: ${error.message}`
    )
  }


  if (
    !data
  ) {

    throw new Error(
      'Verification listing does not exist or is not active.'
    )
  }


  if (
    data.owner_id !==
      userId
  ) {

    throw new Error(
      'Verification listing does not belong to ACTIVATION_VERIFY_USER_ID.'
    )
  }


  if (
    !data.transaction_type ||
    !data.property_type ||
    !data.province
  ) {

    throw new Error(
      'Verification listing lacks transaction_type, property_type, or province required for cohort resolution.'
    )
  }


  return data as
    TargetListing
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
      'Featured Listing promotion product was not found.'
    )
  }


  return data as
    PromotionProductRow
}


function numericOrNull(
  value:
    unknown
): number | null {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null
  }


  const parsed =
    Number(
      value
    )


  return Number.isFinite(
    parsed
  )
    ? parsed
    : null
}


async function createComparableListings({
  supabase,
  target,
  ownerId,
  count = 5
}: {
  supabase:
    SupabaseClient

  target:
    TargetListing

  ownerId:
    string

  count?:
    number
}) {

  const rows =
    Array.from(
      {
        length:
          count
      },

      (
        _,
        index
      ) => {

        const ordinal =
          index +
          1


        return {
          owner_id:
            ownerId,

          title:
            `[${TEST_SUITE}] Comparable ${ordinal}`,

          description:
            `Synthetic Promotion Intelligence cohort listing ${TEST_RUN_ID}`,

          transaction_type:
            target.transaction_type,

          listing_status:
            'active',

          currency:
            target.currency,

          province:
            target.province,

          canton:
            target.canton,

          district:
            target.district,

          property_type:
            target.property_type,

          bedrooms:
            target.bedrooms,

          bathrooms:
            target.bathrooms,

          property_area:
            target.property_area,

          construction_area:
            target.construction_area,

          current_price:
            numericOrNull(
              target.current_price
            ),

          monthly_price:
            numericOrNull(
              target.monthly_price
            ),

          listing_origin:
            'customer',

          listing_source_type:
            'customer',

          source_name:
            TEST_SUITE,

          source_listing_id:
            `${TEST_RUN_ID}:cohort:${ordinal}`
        }
      }
    )


  const {
    data,
    error
  } =
    await supabase
      .from(
        'listings'
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
      `Could not create Promotion Intelligence cohort: ${error.message}`
    )
  }


  const ids =
    (
      data ??
      []
    )
      .map(
        row =>
          row.id as string
      )


  if (
    ids.length !==
      count
  ) {

    throw new Error(
      `Expected ${count} cohort listings, created ${ids.length}.`
    )
  }


  artifacts
    .cohortListingIds
    .push(
      ...ids
    )


  return ids
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

  scenario:
    string
}) {

  const expiresAt =
    resolveEntitlementExpiration({
      startsAt:
        activationAt,

      product
    })


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
      'Synthetic Promotion Intelligence entitlement could not be created.'
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
    entitlementId
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

      const fraction =
        (
          index +
          1
        ) /
        (
          count +
          1
        )


      return {
        user_id:
          null,

        session_id:
          `promotion-intelligence-${TEST_RUN_ID}`,

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
          new Date(
            startsAt.getTime() +
            windowMs *
            fraction
          ).toISOString()
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
      `Could not seed ${scenario}/${period}: ${error.message}`
    )
  }


  artifacts
    .activityIds
    .push(
      ...(
        data ??
        []
      ).map(
        row =>
          row.id as string
      )
    )
}


async function seedCohortActivity({
  supabase,
  cohortListingIds,
  startsAt,
  endsAt,
  scenario,
  period,
  countsPerListing,
  participatingListings =
    cohortListingIds.length
}: {
  supabase:
    SupabaseClient

  cohortListingIds:
    string[]

  startsAt:
    Date

  endsAt:
    Date

  scenario:
    string

  period:
    string

  countsPerListing:
    SeedCounts

  participatingListings?:
    number
}) {

  for (
    const listingId
    of cohortListingIds.slice(
      0,
      participatingListings
    )
  ) {

    await seedActivityPeriod({
      supabase,
      listingId,
      startsAt,
      endsAt,
      scenario,
      period,
      counts:
        countsPerListing
    })
  }
}


async function cleanupStaleActivity({
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
      `Could not remove stale Promotion Intelligence activity: ${error.message}`
    )
  }
}


async function verifyMatureMarketAwareScenario({
  supabase,
  getPromotionIntelligence,
  target,
  cohortListingIds,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  getPromotionIntelligence:
    (
      input: {
        supabase:
          SupabaseClient

        listingId:
          string

        entitlementId:
          string

        cohortLimit?:
          number

        now?:
          Date
      }
    ) =>
      Promise<
        PromotionIntelligenceResult
      >

  target:
    TargetListing

  cohortListingIds:
    string[]

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nMATURE MARKET-AWARE SCENARIO'
  )


  /*
   * Jan 1 → Jan 3 : BEFORE 48h
   * Jan 3 → Jan 5 : DURING 48h
   * Jan 5 → Jan 7 : AFTER 48h
   */

  const activationAt =
    new Date(
      '2026-03-03T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      '2026-03-05T00:00:00.000Z'
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


  const resolutionAt =
    new Date(
      afterEnd.getTime() +
      HOUR_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,

      listingId:
        target.id,

      userId,

      product,

      activationAt,

      cancellationAt,

      scenario:
        'mature-market-aware'
    })


  /*
   * -------------------------------------------------------
   * PROMOTED LISTING
   * -------------------------------------------------------
   */


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'mature-market-aware',

    period:
      'before',

    counts: {
      views:
        100,

      saves:
        10,

      shares:
        4,

      whatsappClicks:
        2,

      emailInquiries:
        1
    }
  })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'mature-market-aware',

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

    listingId:
      target.id,

    startsAt:
      cancellationAt,

    endsAt:
      afterEnd,

    scenario:
      'mature-market-aware',

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


  /*
   * -------------------------------------------------------
   * COMPARABLE MARKET
   * -------------------------------------------------------
   *
   * Every peer receives identical evidence.
   *
   * Views:
   * 50 → 56 = +12%
   *
   * Saves:
   * 8 → 10 = +25%
   *
   * WhatsApp:
   * 2 → 3 = +50%
   */


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'mature-market-aware',

    period:
      'before',

    countsPerListing: {
      views:
        50,

      saves:
        8,

      shares:
        4,

      whatsappClicks:
        2,

      emailInquiries:
        1
    }
  })


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'mature-market-aware',

    period:
      'during',

    countsPerListing: {
      views:
        56,

      saves:
        10,

      shares:
        5,

      whatsappClicks:
        3,

      emailInquiries:
        2
    }
  })


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      cancellationAt,

    endsAt:
      afterEnd,

    scenario:
      'mature-market-aware',

    period:
      'after',

    countsPerListing: {
      views:
        50,

      saves:
        9,

      shares:
        4,

      whatsappClicks:
        2,

      emailInquiries:
        1
    }
  })


  const intelligence =
    requireCanonicalIntelligence(
      await getPromotionIntelligence({
        supabase,

        listingId:
          target.id,

        entitlementId:
          scenario.entitlementId,

        cohortLimit:
          5,

        now:
          resolutionAt
      })
    )


  assertEqual(
    intelligence
      .cohort
      .selectedCount,

    5,

    'Canonical cohort size'
  )


  assertEqual(
    intelligence
      .interpretation
      .structuralCohortSufficient,

    true,

    'Structural cohort evidence'
  )


  console.log(
    '✓ Canonical comparable cohort resolved'
  )


  /*
   * -------------------------------------------------------
   * VIEW INTELLIGENCE
   * -------------------------------------------------------
   */


  const views =
    intelligence
      .beforeToDuring
      .views


  assertNear(
    views.listing
      .percentageChange ??
      Number.NaN,

    50,

    'Listing view change'
  )


  assertNear(
    views.cohort
      .baseline
      .averageObservedEventsPerListing,

    50,

    'Cohort baseline views'
  )


  assertNear(
    views.cohort
      .comparison
      .averageObservedEventsPerListing,

    56,

    'Cohort during views'
  )


  assertNear(
    views.cohort
      .percentageChange ??
      Number.NaN,

    12,

    'Cohort view change'
  )


  assertNear(
    views
      .observedVariancePercentagePoints ??
      Number.NaN,

    38,

    'View observed variance'
  )


  console.log(
    '✓ Listing views: +50%'
  )

  console.log(
    '✓ Comparable market views: +12%'
  )

  console.log(
    '✓ Observed view variance: +38 percentage points'
  )


  /*
   * -------------------------------------------------------
   * SAVE INTELLIGENCE
   * -------------------------------------------------------
   */


  const saves =
    intelligence
      .beforeToDuring
      .saves


  assertNear(
    saves.listing
      .percentageChange ??
      Number.NaN,

    100,

    'Listing save change'
  )


  assertNear(
    saves.cohort
      .percentageChange ??
      Number.NaN,

    25,

    'Cohort save change'
  )


  assertNear(
    saves
      .observedVariancePercentagePoints ??
      Number.NaN,

    75,

    'Save observed variance'
  )


  console.log(
    '✓ Listing saves: +100%'
  )

  console.log(
    '✓ Comparable market saves: +25%'
  )

  console.log(
    '✓ Observed save variance: +75 percentage points'
  )


  /*
   * -------------------------------------------------------
   * WHATSAPP INTELLIGENCE
   * -------------------------------------------------------
   */


  const whatsapp =
    intelligence
      .beforeToDuring
      .whatsappClicks


  assertNear(
    whatsapp.listing
      .percentageChange ??
      Number.NaN,

    200,

    'Listing WhatsApp change'
  )


  assertNear(
    whatsapp.cohort
      .percentageChange ??
      Number.NaN,

    50,

    'Cohort WhatsApp change'
  )


  assertNear(
    whatsapp
      .observedVariancePercentagePoints ??
      Number.NaN,

    150,

    'WhatsApp observed variance'
  )


  console.log(
    '✓ Listing WhatsApp actions: +200%'
  )

  console.log(
    '✓ Comparable market WhatsApp actions: +50%'
  )

  console.log(
    '✓ Observed WhatsApp variance: +150 percentage points'
  )


  /*
   * -------------------------------------------------------
   * RAW COHORT EVIDENCE
   * -------------------------------------------------------
   */


  assertEqual(
    views.cohort
      .baseline
      .totalObservedEvents,

    250,

    'Raw cohort baseline views'
  )


  assertEqual(
    views.cohort
      .comparison
      .totalObservedEvents,

    280,

    'Raw cohort during views'
  )


  assertEqual(
    views.cohort
      .baseline
      .listingsWithObservedEvents,

    5,

    'Baseline cohort participating listings'
  )


  assertEqual(
    views.cohort
      .comparison
      .listingsWithObservedEvents,

    5,

    'During cohort participating listings'
  )


  console.log(
    '✓ Raw cohort evidence preserved'
  )


  /*
   * -------------------------------------------------------
   * POST-PROMOTION MARKET BEHAVIOR
   * -------------------------------------------------------
   */


  if (
    !intelligence
      .duringToAfter
  ) {

    throw new Error(
      'Expected complete market-aware post-promotion comparison.'
    )
  }


  assertNear(
    intelligence
      .duringToAfter
      .views
      .listing
      .percentageChange ??
      Number.NaN,

    -20,

    'Listing post-promotion views'
  )


  assertNear(
    intelligence
      .duringToAfter
      .views
      .cohort
      .percentageChange ??
      Number.NaN,

    -10.71,

    'Cohort post-promotion views'
  )


  assertNear(
    intelligence
      .duringToAfter
      .views
      .observedVariancePercentagePoints ??
      Number.NaN,

    -9.29,

    'Post-promotion view variance'
  )


  console.log(
    '✓ Market-aware post-promotion behavior measured'
  )


  /*
   * -------------------------------------------------------
   * CANONICAL EVIDENCE STATE
   * -------------------------------------------------------
   */


  assertEqual(
    intelligence
      .marketComparisonAvailable,

    true,

    'Market comparison availability'
  )


  assertEqual(
    intelligence
      .marketComparisonStatus,

    'sufficient',

    'Market comparison status'
  )


  assertEqual(
    intelligence
      .interpretation
      .behavioralEvidenceSufficient,

    true,

    'Behavioral evidence sufficiency'
  )


  assertEqual(
    intelligence
      .interpretation
      .available,

    true,

    'Canonical interpretation availability'
  )


  const causalFirewall =
    intelligence
      .notes
      .some(
        note => {

          const normalized =
            note.toLowerCase()


          return (
            normalized.includes(
              'not a causal'
            ) ||
            (
              normalized.includes(
                'must not'
              ) &&
              normalized.includes(
                'caused'
              )
            )
          )
        }
      )


  assertEqual(
    causalFirewall,

    true,

    'Causal firewall'
  )


  console.log(
    '✓ Statistical confidence requirements preserved'
  )

  console.log(
    '✓ Unsupported causal attribution prevented'
  )

  console.log(
    '✓ Canonical Promotion Intelligence evidence produced'
  )
}


async function verifyStructuralFailure({
  supabase,
  getPromotionIntelligence,
  target,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  getPromotionIntelligence:
    any

  target:
    TargetListing

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nSTRUCTURAL COHORT PROTECTION'
  )


  const activationAt =
    new Date(
      '2026-04-03T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      '2026-04-05T00:00:00.000Z'
    )


  const beforeStart =
    new Date(
      activationAt.getTime() -
      2 *
      DAY_MS
    )


  const resolutionAt =
    new Date(
      cancellationAt.getTime() +
      HOUR_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,

      listingId:
        target.id,

      userId,

      product,

      activationAt,

      cancellationAt,

      scenario:
        'structural-protection'
    })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'structural-protection',

    period:
      'before',

    counts: {
      views:
        20
    }
  })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'structural-protection',

    period:
      'during',

    counts: {
      views:
        30
    }
  })


  const intelligence =
    requireCanonicalIntelligence(
      await getPromotionIntelligence({
        supabase,

        listingId:
          target.id,

        entitlementId:
          scenario.entitlementId,

        cohortLimit:
          2,

        now:
          resolutionAt
      })
    )


  assertEqual(
    intelligence
      .marketComparisonAvailable,

    false,

    'Small cohort market comparison'
  )


  assertEqual(
    intelligence
      .marketComparisonStatus,

    'insufficient_structural_cohort',

    'Small cohort evidence status'
  )


  console.log(
    '✓ Small structural cohort fails closed'
  )
}


async function verifySparseBehaviorFailure({
  supabase,
  getPromotionIntelligence,
  target,
  cohortListingIds,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  getPromotionIntelligence:
    any

  target:
    TargetListing

  cohortListingIds:
    string[]

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nSPARSE BEHAVIOR PROTECTION'
  )


  const activationAt =
    new Date(
      '2026-05-03T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      '2026-05-05T00:00:00.000Z'
    )


  const beforeStart =
    new Date(
      activationAt.getTime() -
      2 *
      DAY_MS
    )


  const resolutionAt =
    new Date(
      cancellationAt.getTime() +
      HOUR_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,

      listingId:
        target.id,

      userId,

      product,

      activationAt,

      cancellationAt,

      scenario:
        'sparse-behavior'
    })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'sparse-behavior',

    period:
      'before',

    counts: {
      views:
        20
    }
  })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'sparse-behavior',

    period:
      'during',

    counts: {
      views:
        30
    }
  })


  /*
   * Only two cohort listings have behavioral evidence.
   *
   * Engine requires three distinct peers in BOTH periods.
   */


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'sparse-behavior',

    period:
      'before',

    countsPerListing: {
      views:
        10
    },

    participatingListings:
      2
  })


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'sparse-behavior',

    period:
      'during',

    countsPerListing: {
      views:
        12
    },

    participatingListings:
      2
  })


  const intelligence =
    requireCanonicalIntelligence(
      await getPromotionIntelligence({
        supabase,

        listingId:
          target.id,

        entitlementId:
          scenario.entitlementId,

        cohortLimit:
          5,

        now:
          resolutionAt
      })
    )


  assertEqual(
    intelligence
      .marketComparisonAvailable,

    false,

    'Sparse behavior market comparison'
  )


  assertEqual(
    intelligence
      .marketComparisonStatus,

    'insufficient_cohort_behavior',

    'Sparse behavior evidence status'
  )


  assertEqual(
    intelligence
      .beforeToDuring
      .views
      .evidenceStatus,

    'insufficient_cohort_behavior',

    'Sparse view metric status'
  )


  console.log(
    '✓ Sparse cohort behavior fails closed'
  )

  console.log(
    '✓ Three-distinct-listing behavioral threshold enforced'
  )
}


async function verifyShortDurationFailure({
  supabase,
  getPromotionIntelligence,
  target,
  cohortListingIds,
  userId,
  product
}: {
  supabase:
    SupabaseClient

  getPromotionIntelligence:
    any

  target:
    TargetListing

  cohortListingIds:
    string[]

  userId:
    string

  product:
    PromotionProductRow
}) {

  console.log(
    '\nSHORT-DURATION PROTECTION'
  )


  const activationAt =
    new Date(
      '2026-06-02T00:00:00.000Z'
    )


  const cancellationAt =
    new Date(
      activationAt.getTime() +
      12 *
      HOUR_MS
    )


  const beforeStart =
    new Date(
      activationAt.getTime() -
      12 *
      HOUR_MS
    )


  const resolutionAt =
    new Date(
      cancellationAt.getTime() +
      HOUR_MS
    )


  const scenario =
    await createSyntheticPromotionScenario({
      supabase,

      listingId:
        target.id,

      userId,

      product,

      activationAt,

      cancellationAt,

      scenario:
        'short-duration'
    })


  await seedActivityPeriod({
    supabase,

    listingId:
      target.id,

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

    listingId:
      target.id,

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


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      beforeStart,

    endsAt:
      activationAt,

    scenario:
      'short-duration',

    period:
      'before',

    countsPerListing: {
      views:
        10
    }
  })


  await seedCohortActivity({
    supabase,
    cohortListingIds,

    startsAt:
      activationAt,

    endsAt:
      cancellationAt,

    scenario:
      'short-duration',

    period:
      'during',

    countsPerListing: {
      views:
        12
    }
  })


  const intelligence =
    requireCanonicalIntelligence(
      await getPromotionIntelligence({
        supabase,

        listingId:
          target.id,

        entitlementId:
          scenario.entitlementId,

        cohortLimit:
          5,

        now:
          resolutionAt
      })
    )


  assertEqual(
    intelligence
      .marketComparisonAvailable,

    false,

    'Short-duration market comparison'
  )


  assertEqual(
    intelligence
      .marketComparisonStatus,

    'insufficient_duration',

    'Short-duration evidence status'
  )


  assertEqual(
    intelligence
      .beforeToDuring
      .views
      .observedVariancePercentagePoints,

    null,

    'Short-duration variance withheld'
  )


  console.log(
    '✓ Short-duration market interpretation withheld'
  )

  console.log(
    '✓ Short-duration market variance withheld'
  )
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


  /*
   * Cohort listings do not own Promotion History,
   * so they remain safely mutable and disposable.
   */


  if (
    artifacts.cohortListingIds.length >
      0
  ) {

    const {
      error
    } =
      await supabase
        .from(
          'listings'
        )
        .delete()
        .in(
          'id',
          artifacts.cohortListingIds
        )


    if (
      error
    ) {

      console.error(
        'Synthetic cohort cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic cohort listings removed: ${artifacts.cohortListingIds.length}`
      )
    }
  }


  /*
   * Promotion History is immutable.
   *
   * The test promotion entitlements therefore remain as
   * historical verification lineage, exactly as in the
   * Promotion Performance harness.
   */


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


async function run() {

  const supabase =
    createAdminClient()


  /*
   * Dynamic import intentionally happens AFTER
   * loadEnvConfig().
   *
   * Promotion Intelligence imports the Comparable Cohort
   * Engine → Statistics Engine → global Supabase client.
   */


  const {
    getPromotionIntelligence
  } =
    await import(
      '../../lib/promotion-intelligence-engine'
    )


  const {
    userId,
    listingId
  } =
    requireTestIdentity()


  await cleanupStaleActivity({
    supabase
  })


  const target =
    await loadTargetListing({
      supabase,
      listingId,
      userId
    })


  const product =
    await resolvePromotionProduct({
      supabase
    })


  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION INTELLIGENCE VERIFICATION'
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


  console.log(
    'Test listing:',
    target.id
  )


  console.log(
    'Promotion:',
    product.slug,
    product.id
  )


  const cohortListingIds =
    await createComparableListings({
      supabase,
      target,
      ownerId:
        userId,
      count:
        5
    })


  try {

    await verifyMatureMarketAwareScenario({
      supabase,
      getPromotionIntelligence,
      target,
      cohortListingIds,
      userId,
      product
    })


    await verifyStructuralFailure({
      supabase,
      getPromotionIntelligence,
      target,
      userId,
      product
    })


    await verifySparseBehaviorFailure({
      supabase,
      getPromotionIntelligence,
      target,
      cohortListingIds,
      userId,
      product
    })


    await verifyShortDurationFailure({
      supabase,
      getPromotionIntelligence,
      target,
      cohortListingIds,
      userId,
      product
    })


    console.log('')


    console.log(
      '========================================'
    )

    console.log(
      'PROMOTION INTELLIGENCE VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )


    console.log(
      '✓ Promoted listing baseline'
    )


    console.log(
      '✓ Canonical comparable cohort'
    )


    console.log(
      '✓ Identical temporal windows'
    )


    console.log(
      '✓ Listing view movement'
    )


    console.log(
      '✓ Comparable market view movement'
    )


    console.log(
      '✓ View market variance'
    )


    console.log(
      '✓ Listing save movement'
    )


    console.log(
      '✓ Comparable market save movement'
    )


    console.log(
      '✓ Save market variance'
    )


    console.log(
      '✓ Listing WhatsApp movement'
    )


    console.log(
      '✓ Comparable market WhatsApp movement'
    )


    console.log(
      '✓ WhatsApp market variance'
    )


    console.log(
      '✓ Post-promotion market behavior'
    )


    console.log(
      '✓ Raw listing evidence'
    )


    console.log(
      '✓ Raw cohort evidence'
    )


    console.log(
      '✓ Structural cohort protection'
    )


    console.log(
      '✓ Behavioral evidence protection'
    )


    console.log(
      '✓ Duration protection'
    )


    console.log(
      '✓ Statistical confidence requirements'
    )


    console.log(
      '✓ No unsupported causal conclusions'
    )


    console.log(
      '✓ Canonical Promotion Intelligence evidence'
    )

  } finally {

    await cleanupMutableArtifacts({
      supabase
    })
  }
}


run()
  .catch(
    error => {

      console.error('')


      console.error(
        'PROMOTION INTELLIGENCE VERIFICATION FAILED'
      )


      console.error(
        error
      )


      process.exitCode =
        1
    }
  )