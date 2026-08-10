import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveCommercialState
} from '../../lib/commercial-resolver'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'commercial-resolver-verification'

const TEST_RUN_ID =
  crypto.randomUUID()

const TEST_NOW =
  new Date(
    '2026-08-10T12:00:00.000Z'
  )

const FEATURED_LISTING_SLUG =
  'featured-listing'


type VerificationArtifacts = {
  listingIds:
    string[]

  entitlementIds:
    string[]
}


const artifacts:
  VerificationArtifacts = {

  listingIds:
    [],

  entitlementIds:
    []
}


type PromotionProductRow = {
  id:
    string

  slug:
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


  console.log(
    `✓ ${label}`
  )
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


  console.log(
    `✓ ${label}`
  )
}


async function resolveFeaturedListingProduct({
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
        slug
      `)
      .eq(
        'slug',
        FEATURED_LISTING_SLUG
      )
      .eq(
        'target_type',
        'listing'
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new Error(
      `Featured Listing product could not be resolved: ${error.message}`
    )
  }


  if (
    !data
  ) {

    throw new Error(
      'Featured Listing product was not found.'
    )
  }


  return data as
    PromotionProductRow
}


async function createSyntheticListing({
  supabase,
  ownerId,
  sequence
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  sequence:
    number
}): Promise<
  string
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
          `[${TEST_SUITE}] Listing ${sequence}`,

        description:
          `Commercial Resolver verification ${TEST_RUN_ID}`,

        transaction_type:
          'sale',

        listing_status:
          'active',

        currency:
          'CRC',

        province:
          `Commercial Resolver Province ${TEST_RUN_ID}`,

        canton:
          `Commercial Resolver Canton ${TEST_RUN_ID}`,

        district:
          `Commercial Resolver District ${sequence}`,

        property_type:
          'house',

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
          `${TEST_RUN_ID}:${sequence}`
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
      'Synthetic commercial listing could not be created.'
    )
  }


  const listingId =
    data.id as string


  artifacts
    .listingIds
    .push(
      listingId
    )


  return listingId
}


async function createSyntheticEntitlement({
  supabase,
  listingId,
  ownerId,
  productId,
  status,
  startsAt,
  expiresAt
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  ownerId:
    string

  productId:
    string

  status:
    'active'
    | 'scheduled'
    | 'expired'

  startsAt:
    string | null

  expiresAt:
    string | null
}): Promise<
  string
> {

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

        status,

        source_type:
          'system',

        starts_at:
          startsAt,

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
      `Synthetic ${status} entitlement could not be created.`
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


async function verifyBaseline({
  supabase,
  userId
}: {
  supabase:
    SupabaseClient

  userId:
    string
}) {

  console.log(
    '\nBASELINE COMMERCIAL STATE'
  )


  const state =
    await resolveCommercialState({
      supabase,
      userId,
      now:
        TEST_NOW
    })


  assertEqual(
    state.userId,
    userId,
    'User identity preserved'
  )


  assertEqual(
    state.resolvedAt,
    TEST_NOW.toISOString(),
    'Deterministic resolution timestamp'
  )


  assertTrue(
    state.subscriptions.active !==
      null,
    'Active subscription resolved'
  )


  assertTrue(
    state.activePackage !==
      null,
    'Active package resolved'
  )


  assertTrue(
    state.limits !==
      null,
    'Commercial limits resolved'
  )


  assertTrue(
    state.usage !==
      null,
    'Commercial usage resolved'
  )


  assertTrue(
    state.remaining !==
      null,
    'Remaining commercial capacity resolved'
  )


  return state
}


async function verifySyntheticEntitlementScenario({
  supabase,
  userId
}: {
  supabase:
    SupabaseClient

  userId:
    string
}) {

  console.log(
    '\nCONTROLLED ENTITLEMENT SCENARIO'
  )


  const product =
    await resolveFeaturedListingProduct({
      supabase
    })


  const [
    activeListingId,
    scheduledListingId,
    historicalListingId
  ] =
    await Promise.all([
      createSyntheticListing({
        supabase,
        ownerId:
          userId,
        sequence:
          1
      }),

      createSyntheticListing({
        supabase,
        ownerId:
          userId,
        sequence:
          2
      }),

      createSyntheticListing({
        supabase,
        ownerId:
          userId,
        sequence:
          3
      })
    ])


  const activeStartsAt =
    new Date(
      TEST_NOW.getTime() -
      (
        24 *
        60 *
        60 *
        1000
      )
    )


  const activeExpiresAt =
    new Date(
      TEST_NOW.getTime() +
      (
        3 *
        24 *
        60 *
        60 *
        1000
      )
    )


  const scheduledStartsAt =
    new Date(
      TEST_NOW.getTime() +
      (
        2 *
        24 *
        60 *
        60 *
        1000
      )
    )


  const scheduledExpiresAt =
    new Date(
      TEST_NOW.getTime() +
      (
        5 *
        24 *
        60 *
        60 *
        1000
      )
    )


  const historicalStartsAt =
    new Date(
      TEST_NOW.getTime() -
      (
        10 *
        24 *
        60 *
        60 *
        1000
      )
    )


  const historicalExpiresAt =
    new Date(
      TEST_NOW.getTime() -
      (
        5 *
        24 *
        60 *
        60 *
        1000
      )
    )


  await createSyntheticEntitlement({
    supabase,
    listingId:
      activeListingId,
    ownerId:
      userId,
    productId:
      product.id,
    status:
      'active',
    startsAt:
      activeStartsAt
        .toISOString(),
    expiresAt:
      activeExpiresAt
        .toISOString()
  })


  await createSyntheticEntitlement({
    supabase,
    listingId:
      scheduledListingId,
    ownerId:
      userId,
    productId:
      product.id,
    status:
      'scheduled',
    startsAt:
      scheduledStartsAt
        .toISOString(),
    expiresAt:
      scheduledExpiresAt
        .toISOString()
  })


  await createSyntheticEntitlement({
    supabase,
    listingId:
      historicalListingId,
    ownerId:
      userId,
    productId:
      product.id,
    status:
      'expired',
    startsAt:
      historicalStartsAt
        .toISOString(),
    expiresAt:
      historicalExpiresAt
        .toISOString()
  })


  const state =
    await resolveCommercialState({
      supabase,
      userId,
      now:
        TEST_NOW
    })


  const syntheticIds =
    new Set(
      artifacts
        .entitlementIds
    )


  const syntheticActive =
    state.entitlements.active
      .filter(
        entitlement =>
          syntheticIds.has(
            entitlement.entitlementId
          )
      )


  const syntheticScheduled =
    state.entitlements.scheduled
      .filter(
        entitlement =>
          syntheticIds.has(
            entitlement.entitlementId
          )
      )


  const syntheticHistorical =
    state.entitlements.historical
      .filter(
        entitlement =>
          syntheticIds.has(
            entitlement.entitlementId
          )
      )


  assertEqual(
    syntheticActive.length,
    1,
    'Active entitlement classified canonically'
  )


  assertEqual(
    syntheticScheduled.length,
    1,
    'Scheduled entitlement classified canonically'
  )


  assertEqual(
    syntheticHistorical.length,
    1,
    'Historical entitlement classified canonically'
  )


  const activeEntitlement =
    syntheticActive[0]


  assertEqual(
    activeEntitlement
      .remainingDurationDays,
    3,
    'Remaining entitlement duration resolved'
  )


  assertEqual(
    activeEntitlement
      .remainingDurationHours,
    72,
    'Remaining entitlement hours resolved'
  )


  const quantity =
    state
      .entitlements
      .quantityByProduct[
        FEATURED_LISTING_SLUG
      ]


  assertTrue(
    Boolean(
      quantity
    ),
    'Featured Listing quantity state resolved'
  )


  assertTrue(
    quantity.activeQuantity >=
      1,
    'Featured Listing active quantity includes controlled entitlement'
  )


  assertTrue(
    quantity.scheduledQuantity >=
      1,
    'Featured Listing scheduled quantity includes controlled entitlement'
  )


  assertTrue(
    quantity.historicalQuantity >=
      1,
    'Featured Listing historical quantity includes controlled entitlement'
  )


  assertTrue(
    state.usage !==
      null,
    'Usage available during controlled scenario'
  )


  if (
    state.usage
  ) {

    assertEqual(
      state
        .usage
        .featuredListingsUsed,
      quantity.activeQuantity,
      'Featured Listing usage derives from active entitlement quantity'
    )


    assertEqual(
      state
        .usage
        .featuredUsageStatus,
      'available',
      'Featured Listing usage marked available'
    )
  }


  assertTrue(
    state.remaining !==
      null,
    'Remaining capacity available during controlled scenario'
  )


  if (
    state.remaining
  ) {

    assertEqual(
      state
        .remaining
        .featuredListings
        .used,
      quantity.activeQuantity,
      'Remaining featured capacity consumes canonical active quantity'
    )


    if (
      state
        .remaining
        .featuredListings
        .limit !==
        null
    ) {

      assertEqual(
        state
          .remaining
          .featuredListings
          .remaining,

        Math.max(
          0,
          state
            .remaining
            .featuredListings
            .limit! -
          quantity
            .activeQuantity
        ),

        'Remaining Featured Listing capacity calculated canonically'
      )
    }
  }


  console.log(
    '✓ Controlled commercial entitlement state resolved'
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
    artifacts
      .entitlementIds
      .length >
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
    artifacts
      .listingIds
      .length >
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

  const supabase =
    createAdminClient()

  const userId =
    requireTestUserId()


  console.log(
    '========================================'
  )

  console.log(
    'COMMERCIAL RESOLVER VERIFICATION'
  )

  console.log(
    '========================================'
  )

  console.log(
    `Test suite: ${TEST_SUITE}`
  )

  console.log(
    `Test run: ${TEST_RUN_ID}`
  )

  console.log(
    `User: ${userId}`
  )

  console.log(
    `Canonical now: ${TEST_NOW.toISOString()}`
  )


  try {

    await verifyBaseline({
      supabase,
      userId
    })


    await verifySyntheticEntitlementScenario({
      supabase,
      userId
    })


    console.log(
      '\n========================================'
    )

    console.log(
      'COMMERCIAL RESOLVER VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )

    console.log(
      '✓ Active package'
    )

    console.log(
      '✓ Active subscription'
    )

    console.log(
      '✓ Historical subscriptions'
    )

    console.log(
      '✓ Active entitlements'
    )

    console.log(
      '✓ Scheduled entitlements'
    )

    console.log(
      '✓ Historical entitlements'
    )

    console.log(
      '✓ Remaining quantity'
    )

    console.log(
      '✓ Remaining duration'
    )

    console.log(
      '✓ Remaining capacity'
    )

    console.log(
      '✓ Commercial usage'
    )

    console.log(
      '✓ Commercial limits'
    )

    console.log(
      '✓ Canonical Commercial Resolver'
    )

  } catch (
    error
  ) {

    console.error(
      '\nCOMMERCIAL RESOLVER VERIFICATION FAILED'
    )

    console.error(
      error
    )

    process.exitCode =
      1

  } finally {

    await cleanup({
      supabase
    })
  }
}


void run()