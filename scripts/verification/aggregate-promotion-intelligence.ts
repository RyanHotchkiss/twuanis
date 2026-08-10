import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  AggregatePromotionIntelligenceResult,
  CanonicalAggregatePromotionIntelligence
} from '../../lib/aggregate-promotion-intelligence-engine'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'aggregate-promotion-intelligence-verification'

const TEST_RUN_ID =
  crypto.randomUUID()

const TEST_PROMOTION_SLUG =
  'featured-listing'


const BASE_PROPERTY_TYPE =
  `Aggregate Verification Property ${TEST_RUN_ID}`

const ALTERNATE_PROPERTY_TYPE =
  `Aggregate Alternate Property ${TEST_RUN_ID}`

const BASE_PROVINCE =
  `Aggregate Verification Province ${TEST_RUN_ID}`


const CANTON_INSUFFICIENT =
  `Aggregate Insufficient Canton ${TEST_RUN_ID}`

const CANTON_LIMITED =
  `Aggregate Limited Canton ${TEST_RUN_ID}`

const CANTON_USABLE =
  `Aggregate Usable Canton ${TEST_RUN_ID}`

const CANTON_STRONG =
  `Aggregate Strong Canton ${TEST_RUN_ID}`

const CANTON_ALTERNATE =
  `Aggregate Alternate Canton ${TEST_RUN_ID}`


const DAY_MS =
  24 *
  60 *
  60 *
  1000


type PromotionProductRow = {
  id:
    string

  duration_type:
    string

  duration_days:
    number | null
}


type SyntheticListing = {
  id:
    string

  canton:
    string

  propertyType:
    string
}


type EvidenceSeed = {
  listingId:
    string

  canton:
    string

  propertyType:
    string

  observationIndex:
    number

  observedAt:
    string

  listingChange:
    number

  marketChange:
    number

  variance:
    number

  whatsappSufficient?:
    boolean
}


type VerificationArtifacts = {
  listingIds:
    string[]

  entitlementIds:
    string[]

  evidenceIds:
    string[]
}


const artifacts:
  VerificationArtifacts = {

  listingIds:
    [],

  entitlementIds:
    [],

  evidenceIds:
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


function requireTestUserId():
  string {

  return requireEnvironmentVariable(
    'ACTIVATION_VERIFY_USER_ID'
  )
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


function assertTrue(
  value:
    boolean,

  label:
    string
) {

  if (
    !value
  ) {

    throw new Error(
      `${label} failed.`
    )
  }
}


function requireCanonicalAggregate(
  result:
    AggregatePromotionIntelligenceResult
): CanonicalAggregatePromotionIntelligence {

  if (
    'status' in result
  ) {

    throw new Error(
      [
        'Aggregate Promotion Intelligence unexpectedly',
        'returned insufficient evidence.',
        `Count: ${result.qualifyingPromotionCount}.`
      ].join(
        ' '
      )
    )
  }


  return result
}


function resolveExpiration({
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
      `Active ${TEST_PROMOTION_SLUG} promotion was not found.`
    )
  }


  return data as
    PromotionProductRow
}


async function createSyntheticListing({
  supabase,
  ownerId,
  canton,
  propertyType
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  canton:
    string

  propertyType:
    string
}): Promise<
  SyntheticListing
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listings'
      )
      .insert({
        owner_id:
          ownerId,

        title:
          `[${TEST_SUITE}] ${canton}`,

        description:
          `Aggregate Promotion Intelligence verification ${TEST_RUN_ID}`,

        transaction_type:
          'sale',

        listing_status:
          'active',

        currency:
          'CRC',

        province:
          BASE_PROVINCE,

        canton,

        district:
          `Aggregate Verification District ${TEST_RUN_ID}`,

        property_type:
          propertyType,

        bedrooms:
          '3',

        bathrooms:
          '2',

        property_area:
          '1000',

        construction_area:
          '250',

        current_price:
          100_000_000,

        listing_origin:
          'customer',

        listing_source_type:
          'customer',

        source_name:
          TEST_SUITE,

        source_listing_id:
          `${TEST_RUN_ID}:${canton}`
      })
      .select(`
        id
      `)
      .single()


  if (
    error ||
    !data
  ) {

    throw new Error(
      error?.message ??
      'Synthetic aggregate verification listing could not be created.'
    )
  }


  const listingId =
    data.id as string


  artifacts
    .listingIds
    .push(
      listingId
    )


  return {
    id:
      listingId,

    canton,

    propertyType
  }
}


async function createSyntheticEntitlement({
  supabase,
  listingId,
  ownerId,
  product,
  observationIndex
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  ownerId:
    string

  product:
    PromotionProductRow

  observationIndex:
    number
}): Promise<
  string
> {

  const startsAt =
    new Date(
      Date.UTC(
        2025,
        0,
        1 +
          observationIndex
      )
    )


  const expiresAt =
    resolveExpiration({
      startsAt,
      product
    })


  const {
    data,
    error
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
          ownerId,

        status:
          'cancelled',

        source_type:
          'system',

        starts_at:
          startsAt
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
    error ||
    !data
  ) {

    throw new Error(
      error?.message ??
      'Synthetic aggregate verification entitlement could not be created.'
    )
  }


  const entitlementId =
    data.id as string


  artifacts
    .entitlementIds
    .push(
      entitlementId
    )


  return entitlementId
}


async function createEvidenceObservation({
  supabase,
  ownerId,
  product,
  seed
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  product:
    PromotionProductRow

  seed:
    EvidenceSeed
}) {

  const entitlementId =
    await createSyntheticEntitlement({
      supabase,

      listingId:
        seed.listingId,

      ownerId,

      product,

      observationIndex:
        seed.observationIndex
    })


  const promotionStartedAt =
    new Date(
      Date.UTC(
        2025,
        0,
        1 +
          seed.observationIndex
      )
    )


  const promotionEndedAt =
    new Date(
      promotionStartedAt.getTime() +
      48 *
      60 *
      60 *
      1000
    )


  const whatsappSufficient =
    seed.whatsappSufficient ??
    true


  const {
    data,
    error
  } =
    await supabase
      .from(
        'promotion_intelligence_evidence'
      )
      .insert({
        listing_id:
          seed.listingId,

        entitlement_id:
          entitlementId,

        product_id:
          product.id,

        promotion_slug:
          TEST_PROMOTION_SLUG,


        /*
         * Immutable listing context snapshot
         */

        property_type:
          seed.propertyType,

        province:
          BASE_PROVINCE,

        canton:
          seed.canton,

        district:
          `Aggregate Verification District ${TEST_RUN_ID}`,

        transaction_type:
          'sale',

        price_millions:
          100,

        monthly_price:
          null,

        bedrooms:
          '3',

        bathrooms:
          '2',

        property_area:
          '1000',

        construction_area:
          '250',

        listing_created_at:
          '2025-01-01T00:00:00.000Z',

        listing_published_at:
          '2025-01-01T00:00:00.000Z',


        /*
         * Promotion context
         */

        promotion_started_at:
          promotionStartedAt
            .toISOString(),

        promotion_ended_at:
          promotionEndedAt
            .toISOString(),

        promotion_duration_hours:
          48,


        /*
         * Cohort qualification
         */

        cohort_quality:
          'strong',

        cohort_selected_count:
          10,

        cohort_eligible_count:
          14,


        /*
         * Views
         *
         * All three values remain mathematically aligned:
         *
         * listing change
         * -
         * market change
         * =
         * variance
         */

        views_listing_before:
          100,

        views_listing_during:
          100 +
          seed.listingChange,

        views_listing_change_pct:
          seed.listingChange,

        views_cohort_before_avg:
          50,

        views_cohort_during_avg:
          50 +
          seed.marketChange /
          2,

        views_cohort_change_pct:
          seed.marketChange,

        views_variance_points:
          seed.variance,

        views_evidence_status:
          'sufficient',


        /*
         * Saves
         */

        saves_listing_before:
          10,

        saves_listing_during:
          20,

        saves_listing_change_pct:
          seed.listingChange,

        saves_cohort_before_avg:
          8,

        saves_cohort_during_avg:
          10,

        saves_cohort_change_pct:
          seed.marketChange,

        saves_variance_points:
          seed.variance,

        saves_evidence_status:
          'sufficient',


        /*
         * Shares
         */

        shares_listing_before:
          4,

        shares_listing_during:
          6,

        shares_listing_change_pct:
          seed.listingChange,

        shares_cohort_before_avg:
          4,

        shares_cohort_during_avg:
          5,

        shares_cohort_change_pct:
          seed.marketChange,

        shares_variance_points:
          seed.variance,

        shares_evidence_status:
          'sufficient',


        /*
         * WhatsApp
         *
         * Strong scenario intentionally gives only eight
         * observations sufficient WhatsApp evidence.
         */

        whatsapp_listing_before:
          whatsappSufficient
            ? 2
            : null,

        whatsapp_listing_during:
          whatsappSufficient
            ? 3
            : null,

        whatsapp_listing_change_pct:
          whatsappSufficient
            ? seed.listingChange
            : null,

        whatsapp_cohort_before_avg:
          whatsappSufficient
            ? 2
            : null,

        whatsapp_cohort_during_avg:
          whatsappSufficient
            ? 3
            : null,

        whatsapp_cohort_change_pct:
          whatsappSufficient
            ? seed.marketChange
            : null,

        whatsapp_variance_points:
          whatsappSufficient
            ? seed.variance
            : null,

        whatsapp_evidence_status:
          whatsappSufficient
            ? 'sufficient'
            : 'insufficient_cohort_behavior',


        /*
        * Email inquiries are not a supported Twuanis
        * marketplace behavior.
        */

        email_listing_before:
        null,

        email_listing_during:
        null,

        email_listing_change_pct:
        null,

        email_cohort_before_avg:
        null,

        email_cohort_during_avg:
        null,

        email_cohort_change_pct:
        null,

        email_variance_points:
        null,

        email_evidence_status:
        'insufficient_cohort_behavior',


        /*
         * Buyer actions
         */

        buyer_actions_listing_before:
          3,

        buyer_actions_listing_during:
          5,

        buyer_actions_listing_change_pct:
          seed.listingChange,

        buyer_actions_cohort_before_avg:
          3,

        buyer_actions_cohort_during_avg:
          4,

        buyer_actions_cohort_change_pct:
          seed.marketChange,

        buyer_actions_variance_points:
          seed.variance,

        buyer_actions_evidence_status:
          'sufficient',


        /*
         * Canonical qualification
         */

        market_comparison_status:
          'sufficient',

        interpretation_available:
          true,

        structural_cohort_sufficient:
          true,

        behavioral_evidence_sufficient:
          true,


        /*
         * Full evidence placeholder.
         *
         * This harness tests the aggregate engine, not
         * canonical 5G persistence mapping.
         */

        evidence: {
          testRecord:
            true,

          testSuite:
            TEST_SUITE,

          testRunId:
            TEST_RUN_ID,

          observationIndex:
            seed.observationIndex
        },


        observed_at:
          seed.observedAt
      })
      .select(`
        id
      `)
      .single()


  if (
    error ||
    !data
  ) {

    throw new Error(
      error?.message ??
      'Synthetic aggregate evidence could not be created.'
    )
  }


  artifacts
    .evidenceIds
    .push(
      data.id as string
    )
}


async function seedGroup({
  supabase,
  ownerId,
  product,
  listing,
  count,
  startingIndex,
  varianceFactory,
  whatsappSufficientCount =
    count,
  observedAtFactory
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  product:
    PromotionProductRow

  listing:
    SyntheticListing

  count:
    number

  startingIndex:
    number

  varianceFactory:
    (
      index:
        number
    ) =>
      number

  whatsappSufficientCount?:
    number

  observedAtFactory?:
    (
      index:
        number
    ) =>
      string
}) {

  for (
    let index =
      0;

    index <
      count;

    index +=
      1
  ) {

    const variance =
      varianceFactory(
        index
      )


    const marketChange =
      10


    const listingChange =
      variance +
      marketChange


    const observedAt =
      observedAtFactory
        ? observedAtFactory(
            index
          )
        : new Date(
            Date.UTC(
              2026,
              0,
              1 +
                startingIndex +
                index
            )
          ).toISOString()


    await createEvidenceObservation({
      supabase,
      ownerId,
      product,

      seed: {
        listingId:
          listing.id,

        canton:
          listing.canton,

        propertyType:
          listing.propertyType,

        observationIndex:
          startingIndex +
          index,

        observedAt,

        listingChange,

        marketChange,

        variance,

        whatsappSufficient:
          index <
            whatsappSufficientCount
      }
    })
  }
}


async function verifyInsufficientThreshold({
  getAggregatePromotionIntelligence,
  supabase
}: {
  getAggregatePromotionIntelligence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nINSUFFICIENT EVIDENCE THRESHOLD'
  )


  const result =
    await getAggregatePromotionIntelligence({
      supabase,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      propertyType:
        BASE_PROPERTY_TYPE,

      province:
        BASE_PROVINCE,

      canton:
        CANTON_INSUFFICIENT
    })


  if (
    !(
      'status' in result
    )
  ) {

    throw new Error(
      'Expected insufficient aggregate evidence.'
    )
  }


  assertEqual(
    result.qualifyingPromotionCount,
    4,
    'Four-observation count'
  )


  assertEqual(
    result.evidenceQuality,
    'insufficient',
    'Four-observation quality'
  )


  assertEqual(
    result.publishable,
    false,
    'Four-observation publication'
  )


  assertEqual(
    result.minimumRequired,
    10,
    'Minimum public evidence threshold'
  )


  console.log(
    '✓ 4 observations → insufficient'
  )

  console.log(
    '✓ 4 observations → not public'
  )
}


async function verifyLimitedThreshold({
  getAggregatePromotionIntelligence,
  supabase
}: {
  getAggregatePromotionIntelligence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nLIMITED EVIDENCE THRESHOLD'
  )


  const result =
    await getAggregatePromotionIntelligence({
      supabase,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      propertyType:
        BASE_PROPERTY_TYPE,

      province:
        BASE_PROVINCE,

      canton:
        CANTON_LIMITED
    })


  if (
    !(
      'status' in result
    )
  ) {

    throw new Error(
      'Expected limited aggregate evidence to remain unpublished.'
    )
  }


  assertEqual(
    result.qualifyingPromotionCount,
    5,
    'Five-observation count'
  )


  assertEqual(
    result.evidenceQuality,
    'limited',
    'Five-observation quality'
  )


  assertEqual(
    result.publishable,
    false,
    'Five-observation publication'
  )


  console.log(
    '✓ 5 observations → limited'
  )

  console.log(
    '✓ Limited evidence remains private'
  )
}


async function verifyUsableThreshold({
  getAggregatePromotionIntelligence,
  supabase
}: {
  getAggregatePromotionIntelligence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nUSABLE PUBLIC EVIDENCE THRESHOLD'
  )


  const result =
    requireCanonicalAggregate(
      await getAggregatePromotionIntelligence({
        supabase,

        promotionSlug:
          TEST_PROMOTION_SLUG,

        propertyType:
          BASE_PROPERTY_TYPE,

        province:
          BASE_PROVINCE,

        canton:
          CANTON_USABLE
      })
    )


  assertEqual(
    result.qualifyingPromotionCount,
    10,
    'Ten-observation count'
  )


  assertEqual(
    result.evidenceQuality,
    'usable',
    'Ten-observation quality'
  )


  assertEqual(
    result.publishable,
    true,
    'Ten-observation publication'
  )


  assertEqual(
    result.metrics
      .views
      .observationCount,

    10,

    'Ten usable view observations'
  )


  assertEqual(
    result.metrics
      .views
      .publishable,

    true,

    'Ten view observations publishable'
  )


  console.log(
    '✓ 10 observations → usable'
  )

  console.log(
    '✓ 10 observations → public'
  )
}


async function verifyStrongAggregate({
  getAggregatePromotionIntelligence,
  supabase
}: {
  getAggregatePromotionIntelligence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nSTRONG AGGREGATE SCENARIO'
  )


  const result =
    requireCanonicalAggregate(
      await getAggregatePromotionIntelligence({
        supabase,

        promotionSlug:
          TEST_PROMOTION_SLUG,

        propertyType:
          BASE_PROPERTY_TYPE,

        province:
          BASE_PROVINCE,

        canton:
          CANTON_STRONG,

        transactionType:
          'sale',

        now:
          new Date(
            '2026-08-10T12:00:00.000Z'
          )
      })
    )


  /*
   * -------------------------------------------------------
   * PROMOTION-LEVEL QUALITY
   * -------------------------------------------------------
   */


  assertEqual(
    result.qualifyingPromotionCount,
    25,
    'Strong promotion observation count'
  )


  assertEqual(
    result.evidenceQuality,
    'strong',
    'Strong promotion evidence quality'
  )


  assertEqual(
    result.publishable,
    true,
    'Strong promotion publication'
  )


  console.log(
    '✓ 25 observations → strong'
  )

  console.log(
    '✓ Strong evidence → public'
  )


  /*
   * -------------------------------------------------------
   * DISTINCT LISTINGS
   * -------------------------------------------------------
   *
   * All 25 observations intentionally belong to one
   * synthetic listing.
   */


  assertEqual(
    result.distinctListingCount,
    1,
    'Distinct listing count'
  )


  console.log(
    '✓ Repeated promotion observations preserve truthful distinct-listing count'
  )


  /*
   * -------------------------------------------------------
   * OUTLIER-RESISTANT DISTRIBUTION
   * -------------------------------------------------------
   *
   * Variances:
   *
   * 10, 11, 12 ... 33, 900
   *
   * With 25 observations:
   *
   * P25   = 16
   * median= 22
   * P75   = 28
   */


  const viewVariance =
    result.metrics
      .views
      .observedVariance


  if (
    !viewVariance
  ) {

    throw new Error(
      'Expected aggregate view variance distribution.'
    )
  }


  assertNear(
    viewVariance.minimum,
    10,
    'View variance minimum'
  )


  assertNear(
    viewVariance.percentile25,
    16,
    'View variance P25'
  )


  assertNear(
    viewVariance.median,
    22,
    'View variance median'
  )


  assertNear(
    viewVariance.percentile75,
    28,
    'View variance P75'
  )


  assertNear(
    viewVariance.maximum,
    900,
    'View variance maximum'
  )


  console.log(
    '✓ Median calculated correctly'
  )

  console.log(
    '✓ P25 calculated correctly'
  )

  console.log(
    '✓ P75 calculated correctly'
  )

  console.log(
    '✓ Extreme outlier does not hijack median'
  )


  /*
   * -------------------------------------------------------
   * LISTING / MARKET / VARIANCE RELATIONSHIP
   * -------------------------------------------------------
   *
   * Market change is fixed at +10.
   *
   * Median variance is +22.
   *
   * Therefore median listing movement is +32.
   */


  const listingDistribution =
    result.metrics
      .views
      .listingChange


  const marketDistribution =
    result.metrics
      .views
      .marketChange


  if (
    !listingDistribution ||
    !marketDistribution
  ) {

    throw new Error(
      'Expected complete listing and market distributions.'
    )
  }


  assertNear(
    listingDistribution.median,
    32,
    'Median listing movement'
  )


  assertNear(
    marketDistribution.median,
    10,
    'Median comparable market movement'
  )


  assertNear(
    viewVariance.median,
    22,
    'Median observed variance relationship'
  )


  console.log(
    '✓ Listing movement aggregated'
  )

  console.log(
    '✓ Comparable market movement aggregated'
  )

  console.log(
    '✓ Observed market variance aggregated'
  )


  /*
   * -------------------------------------------------------
   * METRIC-SPECIFIC EVIDENCE
   * -------------------------------------------------------
   *
   * Promotion cohort = 25.
   *
   * Views = 25 sufficient observations.
   *
   * WhatsApp = only 8 sufficient observations.
   */


  assertEqual(
    result.metrics
      .views
      .observationCount,

    25,

    'View metric evidence count'
  )


  assertEqual(
    result.metrics
      .views
      .evidenceQuality,

    'strong',

    'View metric quality'
  )


  assertEqual(
    result.metrics
      .views
      .publishable,

    true,

    'View metric publication'
  )


  assertEqual(
    result.metrics
      .whatsapp
      .observationCount,

    8,

    'WhatsApp metric evidence count'
  )


  assertEqual(
    result.metrics
      .whatsapp
      .evidenceQuality,

    'limited',

    'WhatsApp metric quality'
  )


  assertEqual(
    result.metrics
      .whatsapp
      .publishable,

    false,

    'WhatsApp metric publication'
  )


  console.log(
    '✓ Metric evidence counts remain independent'
  )

  console.log(
    '✓ Strong promotion cohort does not inflate sparse WhatsApp evidence'
  )

  console.log(
    '✓ Insufficient metric evidence remains unpublished'
  )


  /*
   * -------------------------------------------------------
   * OBSERVATION RANGE
   * -------------------------------------------------------
   */


  assertEqual(
    result.observedFrom,
    '2026-07-01T00:00:00.000Z',
    'Observed-from boundary'
  )


  assertEqual(
    result.observedThrough,
    '2026-07-25T00:00:00.000Z',
    'Observed-through boundary'
  )


  console.log(
    '✓ Observation date boundaries preserved'
  )


  /*
   * -------------------------------------------------------
   * METHODOLOGY / CAUSAL FIREWALL
   * -------------------------------------------------------
   */


  assertEqual(
    result.methodology
      .statistic,

    'median_with_interquartile_range',

    'Aggregate methodology'
  )


  assertEqual(
    result.methodology
      .causalAttribution,

    false,

    'Causal attribution policy'
  )


  assertEqual(
    result.methodology
      .individualPrediction,

    false,

    'Individual prediction policy'
  )


  const causalNote =
    result.notes.some(
      note => {

        const normalized =
          note.toLowerCase()


        return (
          normalized.includes(
            'not evidence'
          ) &&
          normalized.includes(
            'caused'
          )
        )
      }
    )


  const predictionNote =
    result.notes.some(
      note => {

        const normalized =
          note.toLowerCase()


        return (
          normalized.includes(
            'does not predict'
          ) ||
          normalized.includes(
            'does not predict the result'
          )
        )
      }
    )


  assertEqual(
    causalNote,
    true,
    'Aggregate causal disclaimer'
  )


  assertEqual(
    predictionNote,
    true,
    'Aggregate prediction disclaimer'
  )


  console.log(
    '✓ No unsupported causal conclusion'
  )

  console.log(
    '✓ No unsupported individual prediction'
  )
}


async function verifyScopeFiltering({
  getAggregatePromotionIntelligence,
  supabase
}: {
  getAggregatePromotionIntelligence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nSCOPE FILTERING'
  )


  const strong =
    requireCanonicalAggregate(
      await getAggregatePromotionIntelligence({
        supabase,

        promotionSlug:
          TEST_PROMOTION_SLUG,

        propertyType:
          BASE_PROPERTY_TYPE,

        province:
          BASE_PROVINCE,

        canton:
          CANTON_STRONG
      })
    )


  assertEqual(
    strong.qualifyingPromotionCount,
    25,
    'Strong canton scoped count'
  )


  const allBaseProperty =
    requireCanonicalAggregate(
      await getAggregatePromotionIntelligence({
        supabase,

        promotionSlug:
          TEST_PROMOTION_SLUG,

        propertyType:
          BASE_PROPERTY_TYPE,

        province:
          BASE_PROVINCE
      })
    )


  /*
   * Base property totals:
   *
   * insufficient  4
   * limited       5
   * usable       10
   * strong       25
   *
   * total         44
   */


  assertEqual(
    allBaseProperty
      .qualifyingPromotionCount,

    44,

    'Property-type scoped count'
  )


  const alternate =
    await getAggregatePromotionIntelligence({
      supabase,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      propertyType:
        ALTERNATE_PROPERTY_TYPE,

      province:
        BASE_PROVINCE,

      canton:
        CANTON_ALTERNATE
    })


  if (
    !(
      'status' in alternate
    )
  ) {

    throw new Error(
      'Expected alternate property type to remain below publication threshold.'
    )
  }


  assertEqual(
    alternate
      .qualifyingPromotionCount,

    3,

    'Alternate property-type scoped count'
  )


  console.log(
    '✓ Canton scope excludes unrelated evidence'
  )

  console.log(
    '✓ Property-type scope excludes unrelated evidence'
  )

  console.log(
    '✓ Scope filters preserve exact qualifying counts'
  )
}


async function cleanup({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  console.log(
    '\nCLEANUP'
  )


  /*
   * Evidence first because entitlement/listing FKs remain
   * underneath it.
   */


  if (
    artifacts.evidenceIds.length >
      0
  ) {

    const {
      error
    } =
      await supabase
        .from(
          'promotion_intelligence_evidence'
        )
        .delete()
        .in(
          'id',
          artifacts.evidenceIds
        )


    if (
      error
    ) {

      console.error(
        'Synthetic aggregate evidence cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic aggregate evidence removed: ${artifacts.evidenceIds.length}`
      )
    }
  }


  if (
    artifacts.entitlementIds.length >
      0
  ) {

    const {
      error
    } =
      await supabase
        .from(
          'listing_entitlements'
        )
        .delete()
        .in(
          'id',
          artifacts.entitlementIds
        )


    if (
      error
    ) {

      console.error(
        'Synthetic entitlement cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic entitlements removed: ${artifacts.entitlementIds.length}`
      )
    }
  }


  if (
    artifacts.listingIds.length >
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
          artifacts.listingIds
        )


    if (
      error
    ) {

      console.error(
        'Synthetic listing cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic listings removed: ${artifacts.listingIds.length}`
      )
    }
  }
}


async function run() {

  console.log(
    '========================================'
  )

  console.log(
    'AGGREGATE PROMOTION INTELLIGENCE VERIFICATION'
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
    getAggregatePromotionIntelligence
  } =
    await import(
      '../../lib/aggregate-promotion-intelligence-engine'
    )


  const ownerId =
    requireTestUserId()


  const product =
    await resolvePromotionProduct({
      supabase
    })


  console.log(
    'Promotion:',
    TEST_PROMOTION_SLUG,
    product.id
  )


  const insufficientListing =
    await createSyntheticListing({
      supabase,
      ownerId,

      canton:
        CANTON_INSUFFICIENT,

      propertyType:
        BASE_PROPERTY_TYPE
    })


  const limitedListing =
    await createSyntheticListing({
      supabase,
      ownerId,

      canton:
        CANTON_LIMITED,

      propertyType:
        BASE_PROPERTY_TYPE
    })


  const usableListing =
    await createSyntheticListing({
      supabase,
      ownerId,

      canton:
        CANTON_USABLE,

      propertyType:
        BASE_PROPERTY_TYPE
    })


  const strongListing =
    await createSyntheticListing({
      supabase,
      ownerId,

      canton:
        CANTON_STRONG,

      propertyType:
        BASE_PROPERTY_TYPE
    })


  const alternateListing =
    await createSyntheticListing({
      supabase,
      ownerId,

      canton:
        CANTON_ALTERNATE,

      propertyType:
        ALTERNATE_PROPERTY_TYPE
    })


  try {

    /*
     * -----------------------------------------------------
     * 4 OBSERVATIONS
     * -----------------------------------------------------
     */


    await seedGroup({
      supabase,
      ownerId,
      product,

      listing:
        insufficientListing,

      count:
        4,

      startingIndex:
        0,

      varianceFactory:
        index =>
          10 +
          index
    })


    /*
     * -----------------------------------------------------
     * 5 OBSERVATIONS
     * -----------------------------------------------------
     */


    await seedGroup({
      supabase,
      ownerId,
      product,

      listing:
        limitedListing,

      count:
        5,

      startingIndex:
        10,

      varianceFactory:
        index =>
          20 +
          index
    })


    /*
     * -----------------------------------------------------
     * 10 OBSERVATIONS
     * -----------------------------------------------------
     */


    await seedGroup({
      supabase,
      ownerId,
      product,

      listing:
        usableListing,

      count:
        10,

      startingIndex:
        20,

      varianceFactory:
        index =>
          30 +
          index
    })


    /*
     * -----------------------------------------------------
     * 25 OBSERVATIONS
     * -----------------------------------------------------
     *
     * Variance distribution:
     *
     * 10..33 + 900
     *
     * Only first 8 rows have sufficient WhatsApp evidence.
     */


    await seedGroup({
      supabase,
      ownerId,
      product,

      listing:
        strongListing,

      count:
        25,

      startingIndex:
        40,

      whatsappSufficientCount:
        8,

      varianceFactory:
        index =>
          index ===
            24
            ? 900
            : 10 +
              index,

      observedAtFactory:
        index =>
          new Date(
            Date.UTC(
              2026,
              6,
              1 +
                index
            )
          ).toISOString()
    })


    /*
     * -----------------------------------------------------
     * ALTERNATE PROPERTY TYPE
     * -----------------------------------------------------
     *
     * Used exclusively to prove scope isolation.
     */


    await seedGroup({
      supabase,
      ownerId,
      product,

      listing:
        alternateListing,

      count:
        3,

      startingIndex:
        80,

      varianceFactory:
        index =>
          500 +
          index
    })


    await verifyInsufficientThreshold({
      getAggregatePromotionIntelligence,
      supabase
    })


    await verifyLimitedThreshold({
      getAggregatePromotionIntelligence,
      supabase
    })


    await verifyUsableThreshold({
      getAggregatePromotionIntelligence,
      supabase
    })


    await verifyStrongAggregate({
      getAggregatePromotionIntelligence,
      supabase
    })


    await verifyScopeFiltering({
      getAggregatePromotionIntelligence,
      supabase
    })


    console.log('')


    console.log(
      '========================================'
    )

    console.log(
      'AGGREGATE PROMOTION INTELLIGENCE VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )


    console.log(
      '✓ Insufficient evidence threshold'
    )


    console.log(
      '✓ Limited evidence threshold'
    )


    console.log(
      '✓ Public evidence threshold'
    )


    console.log(
      '✓ Strong evidence threshold'
    )


    console.log(
      '✓ Median observed variance'
    )


    console.log(
      '✓ Interquartile range'
    )


    console.log(
      '✓ Extreme-outlier resistance'
    )


    console.log(
      '✓ Listing movement aggregation'
    )


    console.log(
      '✓ Comparable market aggregation'
    )


    console.log(
      '✓ Observed variance aggregation'
    )


    console.log(
      '✓ Metric-specific sample sizes'
    )


    console.log(
      '✓ Metric-specific publication firewall'
    )


    console.log(
      '✓ Distinct listing count'
    )


    console.log(
      '✓ Property-type scope'
    )


    console.log(
      '✓ Geography scope'
    )


    console.log(
      '✓ Observation range'
    )


    console.log(
      '✓ No unsupported causal claims'
    )


    console.log(
      '✓ No unsupported individual predictions'
    )


    console.log(
      '✓ Canonical Aggregate Promotion Intelligence'
    )

  } finally {

    await cleanup({
      supabase
    })
  }
}


run()
  .catch(
    error => {

      console.error('')


      console.error(
        'AGGREGATE PROMOTION INTELLIGENCE VERIFICATION FAILED'
      )


      console.error(
        error
      )


      process.exitCode =
        1
    }
  )