import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  ComparableCohortResult,
  ComparableCohortResolution
} from '../../lib/comparable-cohort-engine'

loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'comparable-cohort-verification'

const TEST_RUN_ID =
  crypto.randomUUID()


const TEST_PROVINCE =
  `Verification Province ${TEST_RUN_ID}`

const TEST_PROPERTY_TYPE =
  `Verification Property ${TEST_RUN_ID}`

const TEST_CANTON =
  `Verification Canton ${TEST_RUN_ID}`

const TEST_DISTRICT =
  `Verification District ${TEST_RUN_ID}`


type SyntheticListingInput = {
  role:
    string

  transactionType?:
    string

  province?:
    string

  propertyType?:
    string

  canton?:
    string | null

  district?:
    string | null

  bedrooms?:
    string | null

  bathrooms?:
    string | null

  propertyArea?:
    string | null

  constructionArea?:
    string | null

  currentPrice?:
    number | null
}


type VerificationListing = {
  id:
    string

  role:
    string
}


const createdListingIds:
  string[] = []


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


function requireSuccessfulCohort(
  result:
    ComparableCohortResolution
): ComparableCohortResult {

  if (
    'status' in result
  ) {

    throw new Error(
      `Comparable Cohort unexpectedly returned ${result.status}: ${result.reason}`
    )
  }


  return result
}


async function createSyntheticListing({
  supabase,
  ownerId,
  input
}: {
  supabase:
    SupabaseClient

  ownerId:
    string

  input:
    SyntheticListingInput
}): Promise<
  VerificationListing
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
          `[${TEST_SUITE}] ${input.role}`,

        description:
          `Synthetic comparable cohort verification listing ${TEST_RUN_ID}`,

        transaction_type:
          input.transactionType ??
          'sale',

        listing_status:
          'active',

        currency:
          'CRC',

        province:
          input.province ??
          TEST_PROVINCE,

        canton:
          input.canton ===
            undefined
            ? TEST_CANTON
            : input.canton,

        district:
          input.district ===
            undefined
            ? TEST_DISTRICT
            : input.district,

        property_type:
          input.propertyType ??
          TEST_PROPERTY_TYPE,

        bedrooms:
          input.bedrooms ===
            undefined
            ? '3'
            : input.bedrooms,

        bathrooms:
          input.bathrooms ===
            undefined
            ? '2'
            : input.bathrooms,

        property_area:
          input.propertyArea ===
            undefined
            ? '1000'
            : input.propertyArea,

        construction_area:
          input.constructionArea ===
            undefined
            ? '250'
            : input.constructionArea,

        current_price:
          input.currentPrice ===
            undefined
            ? 100_000_000
            : input.currentPrice,

        listing_origin:
          'customer',

        listing_source_type:
          'customer',

        source_name:
          TEST_SUITE,

        source_listing_id:
          `${TEST_RUN_ID}:${input.role}`
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
      `Could not create synthetic listing ${input.role}.`
    )
  }


  createdListingIds.push(
    data.id
  )


  return {
    id:
      data.id,

    role:
      input.role
  }
}


async function createFixture({
  supabase,
  ownerId
}: {
  supabase:
    SupabaseClient

  ownerId:
    string
}) {

  const target =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'target'
      }
    })


  /*
   * -------------------------------------------------------
   * ELIGIBLE PEERS
   * -------------------------------------------------------
   */


  const strongest =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'strongest',

        /*
         * Exact soft-dimension match.
         */
        currentPrice:
          100_000_000
      }
    })


  const strong =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'strong',

        currentPrice:
          110_000_000,

        propertyArea:
          '1100',

        constructionArea:
          '270'
      }
    })


  const medium =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'medium',

        district:
          `Different District ${TEST_RUN_ID}`,

        bathrooms:
          '3',

        propertyArea:
          '1200',

        constructionArea:
          '300',

        currentPrice:
          120_000_000
      }
    })


  const weaker =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'weaker',

        canton:
          `Different Canton ${TEST_RUN_ID}`,

        district:
          `Different District B ${TEST_RUN_ID}`,

        bedrooms:
          '5',

        bathrooms:
          '4',

        propertyArea:
          '2000',

        constructionArea:
          '500',

        currentPrice:
          200_000_000
      }
    })


  /*
   * Missing optional attributes.
   *
   * Must remain structurally eligible because hard
   * requirements are still satisfied.
   */

  const sparse =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'sparse',

        canton:
          null,

        district:
          null,

        bedrooms:
          null,

        bathrooms:
          null,

        propertyArea:
          null,

        constructionArea:
          null,

        currentPrice:
          null
      }
    })


  /*
   * Deterministic tie pair.
   *
   * Identical comparison evidence means listing ID must
   * provide the stable final ordering.
   */

  const tieA =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'tie-a',

        district:
          `Tie District ${TEST_RUN_ID}`,

        bedrooms:
          '4',

        bathrooms:
          '3',

        propertyArea:
          '1400',

        constructionArea:
          '350',

        currentPrice:
          130_000_000
      }
    })


  const tieB =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'tie-b',

        district:
          `Tie District ${TEST_RUN_ID}`,

        bedrooms:
          '4',

        bathrooms:
          '3',

        propertyArea:
          '1400',

        constructionArea:
          '350',

        currentPrice:
          130_000_000
      }
    })


  const peer8 =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'peer-8',

        bedrooms:
          '4',

        propertyArea:
          '1250'
      }
    })


  const peer9 =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'peer-9',

        bathrooms:
          '3',

        constructionArea:
          '310'
      }
    })


  const peer10 =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'peer-10',

        currentPrice:
          125_000_000
      }
    })


  /*
   * -------------------------------------------------------
   * INELIGIBLE LISTINGS
   * -------------------------------------------------------
   */


  const wrongTransaction =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'wrong-transaction',

        transactionType:
          'rent'
      }
    })


  const wrongPropertyType =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'wrong-property-type',

        propertyType:
          `Wrong Property ${TEST_RUN_ID}`
      }
    })


  const wrongProvince =
    await createSyntheticListing({
      supabase,
      ownerId,

      input: {
        role:
          'wrong-province',

        province:
          `Wrong Province ${TEST_RUN_ID}`
      }
    })


  return {
    target,

    eligible: {
      strongest,
      strong,
      medium,
      weaker,
      sparse,
      tieA,
      tieB,
      peer8,
      peer9,
      peer10
    },

    ineligible: {
      wrongTransaction,
      wrongPropertyType,
      wrongProvince
    }
  }
}


function assertExcluded(
  cohort:
    ComparableCohortResult,

  listingId:
    string,

  label:
    string
) {

  const present =
    cohort.listings.some(
      listing =>
        listing.id ===
          listingId
    )


  assertEqual(
    present,
    false,
    label
  )
}


function assertIncluded(
  cohort:
    ComparableCohortResult,

  listingId:
    string,

  label:
    string
) {

  const present =
    cohort.listings.some(
      listing =>
        listing.id ===
          listingId
    )


  assertEqual(
    present,
    true,
    label
  )
}


async function verifyComparableCohort({
    supabase,
    ownerId,
    resolveComparableCohort
    }: {
    supabase:
        SupabaseClient

    ownerId:
        string

    resolveComparableCohort:
        (
        input: {
            listingId:
            string

            limit?:
            number
        }
        ) =>
        Promise<
            ComparableCohortResolution
        >
    }) {

  console.log(
    '========================================'
  )

  console.log(
    'COMPARABLE COHORT VERIFICATION'
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


  const fixture =
    await createFixture({
      supabase,
      ownerId
    })


  /*
   * -------------------------------------------------------
   * FULL COHORT
   * -------------------------------------------------------
   */


  const full =
    requireSuccessfulCohort(
      await resolveComparableCohort({
        listingId:
          fixture.target.id,

        limit:
          10
      })
    )


  assertEqual(
    full.eligibleCount,
    10,
    'Eligible cohort count'
  )


  assertEqual(
    full.selectedCount,
    10,
    'Selected cohort count'
  )


  assertEqual(
    full.quality,
    'strong',
    'Strong cohort quality'
  )


  console.log(
    '✓ Canonical hard-requirement cohort resolved'
  )


  /*
   * -------------------------------------------------------
   * HARD REQUIREMENTS
   * -------------------------------------------------------
   */


  assertExcluded(
    full,
    fixture.target.id,
    'Target listing exclusion'
  )


  assertExcluded(
    full,
    fixture
      .ineligible
      .wrongTransaction
      .id,

    'Wrong transaction exclusion'
  )


  assertExcluded(
    full,
    fixture
      .ineligible
      .wrongPropertyType
      .id,

    'Wrong property type exclusion'
  )


  assertExcluded(
    full,
    fixture
      .ineligible
      .wrongProvince
      .id,

    'Wrong province exclusion'
  )


  assertEqual(
    full.hardRequirements
      .sameTransactionType,
    true,
    'Transaction hard requirement'
  )


  assertEqual(
    full.hardRequirements
      .samePropertyType,
    true,
    'Property-type hard requirement'
  )


  assertEqual(
    full.hardRequirements
      .sameProvince,
    true,
    'Province hard requirement'
  )


  assertEqual(
    full.hardRequirements
      .targetListingExcluded,
    true,
    'Target exclusion invariant'
  )


  console.log(
    '✓ Same transaction family required'
  )

  console.log(
    '✓ Same property type required'
  )

  console.log(
    '✓ Same province required'
  )

  console.log(
    '✓ Target listing excluded'
  )


  /*
   * -------------------------------------------------------
   * OPTIONAL EVIDENCE
   * -------------------------------------------------------
   */


  assertIncluded(
    full,
    fixture
      .eligible
      .sparse
      .id,

    'Sparse optional-evidence listing remains eligible'
  )


  console.log(
    '✓ Missing optional fields do not disqualify'
  )


  /*
   * -------------------------------------------------------
   * SIMILARITY RANKING
   * -------------------------------------------------------
   */


  const strongestIndex =
    full.listings.findIndex(
      listing =>
        listing.id ===
          fixture
            .eligible
            .strongest
            .id
    )


  const mediumIndex =
    full.listings.findIndex(
      listing =>
        listing.id ===
          fixture
            .eligible
            .medium
            .id
    )


  const weakerIndex =
    full.listings.findIndex(
      listing =>
        listing.id ===
          fixture
            .eligible
            .weaker
            .id
    )


  assertTrue(
    strongestIndex !==
      -1,

    'Strongest peer present'
  )


  assertTrue(
    mediumIndex !==
      -1,

    'Medium peer present'
  )


  assertTrue(
    weakerIndex !==
      -1,

    'Weaker peer present'
  )


  assertTrue(
    strongestIndex <
      mediumIndex,

    'Strongest peer outranks medium peer'
  )


  assertTrue(
    mediumIndex <
      weakerIndex,

    'Medium peer outranks weaker peer'
  )


  const strongestRecord =
    full.listings.find(
      listing =>
        listing.id ===
          fixture
            .eligible
            .strongest
            .id
    )


  const weakerRecord =
    full.listings.find(
      listing =>
        listing.id ===
          fixture
            .eligible
            .weaker
            .id
    )


  if (
    !strongestRecord ||
    !weakerRecord
  ) {

    throw new Error(
      'Could not inspect comparable similarity records.'
    )
  }


  assertTrue(
    strongestRecord
      .similarityScore >
      weakerRecord
        .similarityScore,

    'Similarity score strength'
  )


  console.log(
    '✓ Stronger peers outrank weaker peers'
  )


  /*
   * -------------------------------------------------------
   * DETERMINISTIC TIE BREAKING
   * -------------------------------------------------------
   */


  const tieIds =
    [
      fixture
        .eligible
        .tieA
        .id,

      fixture
        .eligible
        .tieB
        .id
    ]


  const expectedTieOrder =
    [...tieIds]
      .sort(
        (
          first,
          second
        ) =>
          first.localeCompare(
            second
          )
      )


  const actualTieOrder =
    full.listings
      .filter(
        listing =>
          tieIds.includes(
            listing.id
          )
      )
      .map(
        listing =>
          listing.id
      )


  assertEqual(
    actualTieOrder.length,
    2,
    'Tie listing count'
  )


  assertEqual(
    actualTieOrder[0],
    expectedTieOrder[0],
    'First deterministic tie listing'
  )


  assertEqual(
    actualTieOrder[1],
    expectedTieOrder[1],
    'Second deterministic tie listing'
  )


  /*
   * Run again and verify exact result order.
   */

  const repeated =
    requireSuccessfulCohort(
      await resolveComparableCohort({
        listingId:
          fixture.target.id,

        limit:
          10
      })
    )


  assertEqual(
    repeated
      .listings
      .map(
        listing =>
          listing.id
      )
      .join('|'),

    full
      .listings
      .map(
        listing =>
          listing.id
      )
      .join('|'),

    'Repeated deterministic ordering'
  )


  console.log(
    '✓ Deterministic listing ordering'
  )


  /*
   * -------------------------------------------------------
   * COHORT QUALITY THRESHOLDS
   * -------------------------------------------------------
   */


  const insufficient =
    requireSuccessfulCohort(
      await resolveComparableCohort({
        listingId:
          fixture.target.id,

        limit:
          2
      })
    )


  assertEqual(
    insufficient
      .selectedCount,
    2,
    'Insufficient selected count'
  )


  assertEqual(
    insufficient
      .quality,
    'insufficient',
    'Insufficient quality threshold'
  )


  const limited =
    requireSuccessfulCohort(
      await resolveComparableCohort({
        listingId:
          fixture.target.id,

        limit:
          4
      })
    )


  assertEqual(
    limited
      .selectedCount,
    4,
    'Limited selected count'
  )


  assertEqual(
    limited
      .quality,
    'limited',
    'Limited quality threshold'
  )


  const usable =
    requireSuccessfulCohort(
      await resolveComparableCohort({
        listingId:
          fixture.target.id,

        limit:
          7
      })
    )


  assertEqual(
    usable
      .selectedCount,
    7,
    'Usable selected count'
  )


  assertEqual(
    usable
      .quality,
    'usable',
    'Usable quality threshold'
  )


  assertEqual(
    full.quality,
    'strong',
    'Strong quality threshold'
  )


  console.log(
    '✓ 0–2 peers resolve insufficient'
  )

  console.log(
    '✓ 3–4 peers resolve limited'
  )

  console.log(
    '✓ 5–9 peers resolve usable'
  )

  console.log(
    '✓ 10+ peers resolve strong'
  )


  console.log('')


  console.log(
    '========================================'
  )

  console.log(
    'COMPARABLE COHORT VERIFICATION PASSED'
  )

  console.log(
    '========================================'
  )


  console.log(
    '✓ Same transaction family'
  )

  console.log(
    '✓ Same property type'
  )

  console.log(
    '✓ Same province'
  )

  console.log(
    '✓ Target listing exclusion'
  )

  console.log(
    '✓ Optional evidence handling'
  )

  console.log(
    '✓ Similarity ranking'
  )

  console.log(
    '✓ Deterministic ordering'
  )

  console.log(
    '✓ Insufficient cohort quality'
  )

  console.log(
    '✓ Limited cohort quality'
  )

  console.log(
    '✓ Usable cohort quality'
  )

  console.log(
    '✓ Strong cohort quality'
  )
}


async function cleanupSyntheticListings({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  console.log(
    '\nCLEANUP'
  )


  if (
    createdListingIds.length ===
      0
  ) {

    console.log(
      'No synthetic listings to remove.'
    )

    return
  }


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
        createdListingIds
      )


  if (
    error
  ) {

    console.error(
      'Synthetic listing cleanup failed:',
      error.message
    )

    return
  }


  console.log(
    `Synthetic listings removed: ${createdListingIds.length}`
  )
}


async function run() {

  const supabase =
    createAdminClient()

  const {
  resolveComparableCohort
} =
  await import(
    '../../lib/comparable-cohort-engine'
  )

  const ownerId =
    requireTestUserId()


  try {

    await verifyComparableCohort({
        supabase,
        ownerId,
        resolveComparableCohort
        })

  } finally {

    await cleanupSyntheticListings({
      supabase
    })
  }
}


run()
  .catch(
    error => {

      console.error('')


      console.error(
        'COMPARABLE COHORT VERIFICATION FAILED'
      )


      console.error(
        error
      )


      process.exitCode =
        1
    }
  )