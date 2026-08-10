import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  PublicPromotionEvidenceResult
} from '../../lib/public-promotion-evidence'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'public-promotion-evidence-verification'

const TEST_RUN_ID =
  crypto.randomUUID()

const TEST_PROMOTION_SLUG =
  'featured-listing'


const BASE_PROVINCE =
  `Public Evidence Province ${TEST_RUN_ID}`

const CANTON_PRIVATE =
  `Public Evidence Private Canton ${TEST_RUN_ID}`

const CANTON_PUBLIC =
  `Public Evidence Public Canton ${TEST_RUN_ID}`

const PROPERTY_TYPE =
  `Public Evidence Property ${TEST_RUN_ID}`


type PromotionProductRow = {
  id:
    string
}


type SyntheticListing = {
  id:
    string

  canton:
    string
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

  return createClient(
    requireEnvironmentVariable(
      'NEXT_PUBLIC_SUPABASE_URL'
    ),

    requireEnvironmentVariable(
      'SUPABASE_SERVICE_ROLE_KEY'
    ),

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


function assertFalse(
  value:
    boolean,

  label:
    string
) {

  assertEqual(
    value,
    false,
    label
  )
}


function hasOwn(
  value:
    unknown,

  key:
    string
): boolean {

  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    Object.prototype
      .hasOwnProperty.call(
        value,
        key
      )
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
        id
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


  return data as PromotionProductRow
}


async function createSyntheticListing({
  supabase,
  ownerId,
  canton
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  canton:
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
          `Public Promotion Evidence verification ${TEST_RUN_ID}`,

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
          `Public Evidence District ${TEST_RUN_ID}`,

        property_type:
          PROPERTY_TYPE,

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
      'Synthetic public-evidence listing could not be created.'
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

    canton
  }
}


async function createSyntheticEntitlement({
  supabase,
  listingId,
  ownerId,
  productId
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  ownerId:
    string

  productId:
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
      .insert({
        listing_id:
          listingId,

        product_id:
          productId,

        owner_id:
          ownerId,

        status:
          'cancelled',

        source_type:
          'system',

        starts_at:
          '2026-01-01T00:00:00.000Z',

        expires_at:
          '2026-01-03T00:00:00.000Z',

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
      'Synthetic public-evidence entitlement could not be created.'
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


async function insertEvidence({
  supabase,
  ownerId,
  listing,
  productId,
  index,
  whatsappSufficient,
  variance
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  listing:
    SyntheticListing

  productId:
    string

  index:
    number

  whatsappSufficient:
    boolean

  variance:
    number
}) {

  const entitlementId =
    await createSyntheticEntitlement({
      supabase,
      listingId:
        listing.id,
      ownerId,
      productId
    })


  const listingChange =
    variance +
    10


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
          listing.id,

        entitlement_id:
          entitlementId,

        product_id:
          productId,

        promotion_slug:
          TEST_PROMOTION_SLUG,

        property_type:
          PROPERTY_TYPE,

        province:
          BASE_PROVINCE,

        canton:
          listing.canton,

        district:
          `Public Evidence District ${TEST_RUN_ID}`,

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
          '2025-12-01T00:00:00.000Z',

        listing_published_at:
          '2025-12-15T00:00:00.000Z',

        promotion_started_at:
          '2026-01-01T00:00:00.000Z',

        promotion_ended_at:
          '2026-01-03T00:00:00.000Z',

        promotion_duration_hours:
          48,

        cohort_quality:
          'strong',

        cohort_selected_count:
          10,

        cohort_eligible_count:
          14,


        views_listing_before:
          100,

        views_listing_during:
          100 +
          listingChange,

        views_listing_change_pct:
          listingChange,

        views_cohort_before_avg:
          50,

        views_cohort_during_avg:
          55,

        views_cohort_change_pct:
          10,

        views_variance_points:
          variance,

        views_evidence_status:
          'sufficient',


        saves_listing_before:
          10,

        saves_listing_during:
          20,

        saves_listing_change_pct:
          listingChange,

        saves_cohort_before_avg:
          8,

        saves_cohort_during_avg:
          8.8,

        saves_cohort_change_pct:
          10,

        saves_variance_points:
          variance,

        saves_evidence_status:
          'sufficient',


        shares_listing_before:
          4,

        shares_listing_during:
          6,

        shares_listing_change_pct:
          listingChange,

        shares_cohort_before_avg:
          4,

        shares_cohort_during_avg:
          4.4,

        shares_cohort_change_pct:
          10,

        shares_variance_points:
          variance,

        shares_evidence_status:
          'sufficient',


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
            ? listingChange
            : null,

        whatsapp_cohort_before_avg:
          whatsappSufficient
            ? 2
            : null,

        whatsapp_cohort_during_avg:
          whatsappSufficient
            ? 2.2
            : null,

        whatsapp_cohort_change_pct:
          whatsappSufficient
            ? 10
            : null,

        whatsapp_variance_points:
          whatsappSufficient
            ? variance
            : null,

        whatsapp_evidence_status:
          whatsappSufficient
            ? 'sufficient'
            : 'insufficient_cohort_behavior',


        buyer_actions_listing_before:
          3,

        buyer_actions_listing_during:
          5,

        buyer_actions_listing_change_pct:
          listingChange,

        buyer_actions_cohort_before_avg:
          3,

        buyer_actions_cohort_during_avg:
          3.3,

        buyer_actions_cohort_change_pct:
          10,

        buyer_actions_variance_points:
          variance,

        buyer_actions_evidence_status:
          'sufficient',


        /*
         * Email intentionally unsupported.
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


        market_comparison_status:
          'sufficient',

        interpretation_available:
          true,

        structural_cohort_sufficient:
          true,

        behavioral_evidence_sufficient:
          true,

        evidence: {
          testRecord:
            true,

          testSuite:
            TEST_SUITE,

          testRunId:
            TEST_RUN_ID,

          observationIndex:
            index
        },

        observed_at:
          new Date(
            Date.UTC(
              2026,
              0,
              index +
                1
            )
          ).toISOString()
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
      'Synthetic public Promotion Evidence could not be inserted.'
    )
  }


  artifacts
    .evidenceIds
    .push(
      data.id as string
    )
}


function requirePublicResult(
  result:
    PublicPromotionEvidenceResult
) {

  if (
    !result.publishable
  ) {

    throw new Error(
      'Expected publishable Public Promotion Evidence.'
    )
  }


  return result
}


async function verifyPrivateThreshold({
  resolvePublicPromotionEvidence,
  supabase
}: {
  resolvePublicPromotionEvidence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nPUBLICATION FIREWALL'
  )


  const result =
    await resolvePublicPromotionEvidence({
      supabase,

      promotionSlug:
        TEST_PROMOTION_SLUG,

      propertyType:
        PROPERTY_TYPE,

      province:
        BASE_PROVINCE,

      canton:
        CANTON_PRIVATE
    })


  assertEqual(
    result.publishable,
    false,
    'Nine-observation publication'
  )


  if (
    result.publishable
  ) {

    throw new Error(
      'Expected private result.'
    )
  }


  assertEqual(
    result.qualifyingPromotionCount,
    9,
    'Private qualifying count'
  )


  assertEqual(
    result.minimumRequired,
    10,
    'Public minimum'
  )


  console.log(
    '✓ 9 observations remain private'
  )
}


async function verifyPublicShape({
  resolvePublicPromotionEvidence,
  supabase
}: {
  resolvePublicPromotionEvidence:
    any

  supabase:
    SupabaseClient
}) {

  console.log(
    '\nPUBLIC EVIDENCE SHAPE'
  )


  const result =
    requirePublicResult(
      await resolvePublicPromotionEvidence({
        supabase,

        promotionSlug:
          TEST_PROMOTION_SLUG,

        propertyType:
          PROPERTY_TYPE,

        province:
          BASE_PROVINCE,

        canton:
          CANTON_PUBLIC
      })
    )


  assertEqual(
    result.qualifyingPromotionCount,
    25,
    'Public qualifying promotion count'
  )


  assertEqual(
    result.evidenceQuality,
    'strong',
    'Public evidence quality'
  )


  assertEqual(
    result.publishable,
    true,
    'Public evidence availability'
  )


  console.log(
    '✓ 25 observations produce public evidence'
  )


  /*
   * -------------------------------------------------------
   * METRIC PUBLICATION
   * -------------------------------------------------------
   */


  const views =
    result.metrics.find(
      metric =>
        metric.metric ===
          'views'
    )


  if (
    !views
  ) {

    throw new Error(
      'Expected public view evidence.'
    )
  }


  assertEqual(
    views.observationCount,
    25,
    'Public view sample size'
  )


  assertEqual(
    views.evidenceQuality,
    'strong',
    'Public view quality'
  )


  /*
   * Variance distribution:
   *
   * 10..33 + 900
   *
   * median = 22
   * P25 = 16
   * P75 = 28
   */


  assertEqual(
    views.medianObservedVariancePoints,
    22,
    'Public median variance'
  )


  assertEqual(
    views.middle50Variance.low,
    16,
    'Public variance P25'
  )


  assertEqual(
    views.middle50Variance.high,
    28,
    'Public variance P75'
  )


  console.log(
    '✓ Median reaches public resolver'
  )

  console.log(
    '✓ Middle 50% reaches public resolver'
  )


  /*
   * -------------------------------------------------------
   * WHATSAPP SUPPRESSION
   * -------------------------------------------------------
   *
   * Only eight of the 25 evidence observations contain
   * sufficient WhatsApp evidence.
   */


  const whatsapp =
    result.metrics.find(
      metric =>
        metric.metric ===
          'whatsapp'
    )


  assertEqual(
    whatsapp,
    undefined,
    'Sparse WhatsApp suppression'
  )


  console.log(
    '✓ Sparse WhatsApp metric disappears entirely'
  )


  /*
   * -------------------------------------------------------
   * OUTLIER FIREWALL
   * -------------------------------------------------------
   *
   * Aggregate Engine knows maximum = 900.
   * Public resolver must not expose minimum or maximum.
   */


  assertFalse(
    hasOwn(
      views,
      'maximum'
    ),

    'Maximum field exposure'
  )


  assertFalse(
    hasOwn(
      views,
      'minimum'
    ),

    'Minimum field exposure'
  )


  assertFalse(
    hasOwn(
      views,
      'observedVariance'
    ),

    'Raw aggregate distribution exposure'
  )


  console.log(
    '✓ Extreme minimum / maximum values never reach public object'
  )


  /*
   * -------------------------------------------------------
   * PRIVATE IDENTIFIER FIREWALL
   * -------------------------------------------------------
   */


  assertFalse(
    hasOwn(
      result,
      'listingIds'
    ),

    'Listing ID exposure'
  )


  assertFalse(
    hasOwn(
      result,
      'entitlementIds'
    ),

    'Entitlement ID exposure'
  )


  assertFalse(
    hasOwn(
      result,
      'evidence'
    ),

    'Raw evidence exposure'
  )


  console.log(
    '✓ Listing IDs never reach public object'
  )

  console.log(
    '✓ Entitlement IDs never reach public object'
  )

  console.log(
    '✓ Raw evidence never reaches public object'
  )


  /*
   * -------------------------------------------------------
   * CAUSAL / PREDICTIVE FIREWALL
   * -------------------------------------------------------
   */


  assertEqual(
    result
      .methodology
      .causalAttribution,

    false,

    'Public causal attribution'
  )


  assertEqual(
    result
      .methodology
      .individualPrediction,

    false,

    'Public individual prediction'
  )


  const disclaimer =
    result
      .disclaimer
      .toLowerCase()


  assertTrue(
    disclaimer.includes(
      'do not establish'
    ),

    'Public causal disclaimer language'
  )


  assertTrue(
    disclaimer.includes(
      'do not predict'
    ),

    'Public prediction disclaimer language'
  )


  console.log(
    '✓ Causal attribution explicitly false'
  )

  console.log(
    '✓ Individual prediction explicitly false'
  )

  console.log(
    '✓ Public disclaimer preserves evidence-only philosophy'
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
        'Synthetic public evidence cleanup failed:',
        error.message
      )

    } else {

      console.log(
        `Synthetic public evidence removed: ${artifacts.evidenceIds.length}`
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
    'PUBLIC PROMOTION EVIDENCE VERIFICATION'
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
    resolvePublicPromotionEvidence
  } =
    await import(
      '../../lib/public-promotion-evidence'
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


  const privateListing =
    await createSyntheticListing({
      supabase,
      ownerId,
      canton:
        CANTON_PRIVATE
    })


  const publicListing =
    await createSyntheticListing({
      supabase,
      ownerId,
      canton:
        CANTON_PUBLIC
    })


  try {

    /*
     * -----------------------------------------------------
     * PRIVATE GROUP: 9
     * -----------------------------------------------------
     */


    for (
      let index =
        0;

      index <
        9;

      index +=
        1
    ) {

      await insertEvidence({
        supabase,
        ownerId,
        listing:
          privateListing,
        productId:
          product.id,
        index:
          index,
        whatsappSufficient:
          true,
        variance:
          10 +
          index
      })
    }


    /*
     * -----------------------------------------------------
     * PUBLIC GROUP: 25
     * -----------------------------------------------------
     *
     * Variance:
     *
     * 10..33 + 900
     *
     * WhatsApp:
     * only 8 sufficient observations
     */


    for (
      let index =
        0;

      index <
        25;

      index +=
        1
    ) {

      await insertEvidence({
        supabase,
        ownerId,
        listing:
          publicListing,
        productId:
          product.id,
        index:
          40 +
          index,
        whatsappSufficient:
          index <
            8,
        variance:
          index ===
            24
            ? 900
            : 10 +
              index
      })
    }


    await verifyPrivateThreshold({
      resolvePublicPromotionEvidence,
      supabase
    })


    await verifyPublicShape({
      resolvePublicPromotionEvidence,
      supabase
    })


    console.log('')


    console.log(
      '========================================'
    )

    console.log(
      'PUBLIC PROMOTION EVIDENCE VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )


    console.log(
      '✓ Promotion publication threshold'
    )


    console.log(
      '✓ Metric publication threshold'
    )


    console.log(
      '✓ Median-only headline evidence'
    )


    console.log(
      '✓ Interquartile-range context'
    )


    console.log(
      '✓ Sparse metric suppression'
    )


    console.log(
      '✓ Outlier exposure protection'
    )


    console.log(
      '✓ Listing identifier protection'
    )


    console.log(
      '✓ Entitlement identifier protection'
    )


    console.log(
      '✓ Raw evidence protection'
    )


    console.log(
      '✓ No unsupported causal claims'
    )


    console.log(
      '✓ No unsupported individual predictions'
    )


    console.log(
      '✓ Display-safe Public Promotion Evidence'
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
        'PUBLIC PROMOTION EVIDENCE VERIFICATION FAILED'
      )


      console.error(
        error
      )


      process.exitCode =
        1
    }
  )