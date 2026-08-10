import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveMarketplacePlacement
} from '@/lib/promotion-placement'


const NOW =
  new Date(
    '2026-08-09T18:00:00.000Z'
  )


const CUSTOMER_FEATURED =
  '11111111-1111-4111-8111-111111111111'

const CUSTOMER_BOOSTED =
  '22222222-2222-4222-8222-222222222222'

const CUSTOMER_ORGANIC =
  '33333333-3333-4333-8333-333333333333'

const EXTERNAL_NEWER =
  '44444444-4444-4444-8444-444444444444'

const EXTERNAL_OLDER =
  '55555555-5555-4555-8555-555555555555'


const OWNER_ID =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'


const listings = [
  {
    id:
      EXTERNAL_NEWER,

    owner_id:
      null,

    listing_status:
      'active',

    transaction_type:
      'sale',

    province:
      'San José',

    property_type:
      'House',

    created_at:
      '2026-08-09T17:59:00.000Z',

    current_price:
      100000
  },

  {
    id:
      CUSTOMER_ORGANIC,

    owner_id:
      OWNER_ID,

    listing_status:
      'active',

    transaction_type:
      'sale',

    province:
      'San José',

    property_type:
      'House',

    created_at:
      '2026-08-09T17:58:00.000Z',

    current_price:
      300000
  },

  {
    id:
      CUSTOMER_BOOSTED,

    owner_id:
      OWNER_ID,

    listing_status:
      'active',

    transaction_type:
      'sale',

    province:
      'San José',

    property_type:
      'House',

    created_at:
      '2026-08-09T17:57:00.000Z',

    current_price:
      200000
  },

  {
    id:
      CUSTOMER_FEATURED,

    owner_id:
      OWNER_ID,

    listing_status:
      'active',

    transaction_type:
      'sale',

    province:
      'San José',

    property_type:
      'House',

    created_at:
      '2026-08-09T17:56:00.000Z',

    current_price:
      400000
  },

  {
    id:
      EXTERNAL_OLDER,

    owner_id:
      null,

    listing_status:
      'active',

    transaction_type:
      'sale',

    province:
      'San José',

    property_type:
      'House',

    created_at:
      '2026-08-01T12:00:00.000Z',

    current_price:
      50000
  }
]


const entitlementRows = [
  {
    id:
      'aaaaaaaa-1111-4111-8111-111111111111',

    listing_id:
      CUSTOMER_FEATURED,

    product_id:
      '6ac98308-270d-4c1c-becd-e2674c923eb7',

    owner_id:
      OWNER_ID,

    status:
      'active',

    source_type:
      'purchase',

    starts_at:
      '2026-08-01T00:00:00.000Z',

    expires_at:
      '2026-08-31T00:00:00.000Z',

    purchase_request_id:
      null,

    assigned_by:
      null,

    revoked_at:
      null,

    revoked_by:
      null,

    revocation_reason:
      null,

    created_at:
      '2026-08-01T00:00:00.000Z',

    updated_at:
      '2026-08-01T00:00:00.000Z',

    product: [
      {
        id:
          '6ac98308-270d-4c1c-becd-e2674c923eb7',

        slug:
          'featured-listing',

        name_en:
          'Featured Listing',

        name_es:
          'Anuncio Destacado',

        product_type:
          'promotion',

        target_type:
          'listing'
      }
    ]
  },

  {
    id:
      'bbbbbbbb-2222-4222-8222-222222222222',

    listing_id:
      CUSTOMER_BOOSTED,

    product_id:
      'baaf3769-8087-437f-a4f4-bc5f8661d0b0',

    owner_id:
      OWNER_ID,

    status:
      'active',

    source_type:
      'purchase',

    starts_at:
      '2026-08-05T00:00:00.000Z',

    expires_at:
      '2026-08-12T00:00:00.000Z',

    purchase_request_id:
      null,

    assigned_by:
      null,

    revoked_at:
      null,

    revoked_by:
      null,

    revocation_reason:
      null,

    created_at:
      '2026-08-05T00:00:00.000Z',

    updated_at:
      '2026-08-05T00:00:00.000Z',

    product: [
      {
        id:
          'baaf3769-8087-437f-a4f4-bc5f8661d0b0',

        slug:
          'listing-boost',

        name_en:
          'Listing Boost',

        name_es:
          'Impulso de Anuncio',

        product_type:
          'promotion',

        target_type:
          'listing'
      }
    ]
  }
]


function createFakeSupabase():
  SupabaseClient {

  return {
    from(
      table:
        string
    ) {

      if (
        table ===
          'listings'
      ) {

        return {
          select() {

            return {
              in() {

                return Promise.resolve({
                  data:
                    listings.map(
                      listing => ({
                        id:
                          listing.id,

                        owner_id:
                          listing.owner_id
                      })
                    ),

                  error:
                    null
                })
              }
            }
          }
        }
      }


      if (
        table ===
          'listing_entitlements'
      ) {

        return {
          select() {

            return {
              in() {

                return {
                  order() {

                    return Promise.resolve({
                      data:
                        entitlementRows,

                      error:
                        null
                    })
                  }
                }
              }
            }
          }
        }
      }


      throw new Error(
        `Unexpected table requested by verification harness: ${table}`
      )
    }
  } as unknown as
    SupabaseClient
}


function assertOrder({
  actual,
  expected,
  label
}: {
  actual:
    string[]

  expected:
    string[]

  label:
    string
}) {

  if (
    actual.length !==
      expected.length
  ) {
    throw new Error(
      `${label}: expected ${expected.length} listings but received ${actual.length}.`
    )
  }


  for (
    let index = 0;
    index < expected.length;
    index += 1
  ) {

    if (
      actual[index] !==
        expected[index]
    ) {

      throw new Error(
        [
          `${label} failed.`,
          `Expected position ${index + 1}: ${expected[index]}`,
          `Received: ${actual[index]}`,
          '',
          `Expected order: ${expected.join(' → ')}`,
          `Actual order: ${actual.join(' → ')}`
        ].join(
          '\n'
        )
      )
    }
  }
}


async function verifyDefaultPlacement() {

  const result =
    await resolveMarketplacePlacement({
      supabase:
        createFakeSupabase(),

      listings,

      surface:
        'buy-results',

      now:
        NOW
    })


  const actual =
    result.listings.map(
      listing =>
        listing.id
    )


  const expected = [
    CUSTOMER_FEATURED,
    CUSTOMER_BOOSTED,
    CUSTOMER_ORGANIC,
    EXTERNAL_NEWER,
    EXTERNAL_OLDER
  ]


  assertOrder({
    actual,
    expected,
    label:
      'Default promotional placement'
  })


  console.log(
    '✓ Customer inventory outranks external inventory'
  )

  console.log(
    '✓ Featured customer listing ranks first'
  )

  console.log(
    '✓ Boosted customer listing ranks above organic customer listing'
  )

  console.log(
    '✓ Organic customer listing remains above all scraped inventory'
  )

  console.log(
    '✓ External inventory remains organically ordered'
  )


  const featuredRanking =
    result
      .promotionRankings
      .find(
        ranking =>
          ranking.listingId ===
            CUSTOMER_FEATURED
      )


  const boostedRanking =
    result
      .promotionRankings
      .find(
        ranking =>
          ranking.listingId ===
            CUSTOMER_BOOSTED
      )


  const externalRanking =
    result
      .promotionRankings
      .find(
        ranking =>
          ranking.listingId ===
            EXTERNAL_NEWER
      )


  if (
    featuredRanking?.tier !==
      'featured' ||
    featuredRanking.priority !==
      100
  ) {

    throw new Error(
      'Featured promotion did not resolve to canonical featured priority.'
    )
  }


  if (
    boostedRanking?.tier !==
      'boosted' ||
    boostedRanking.priority !==
      25
  ) {

    throw new Error(
      'Listing Boost did not resolve to canonical boosted priority.'
    )
  }


  if (
    externalRanking?.tier !==
      'organic' ||
    externalRanking.priority !==
      0
  ) {

    throw new Error(
      'External inventory did not preserve canonical zero promotional priority.'
    )
  }


  console.log(
    '✓ Featured priority = 100'
  )

  console.log(
    '✓ Boost priority = 25'
  )

  console.log(
    '✓ External priority = 0'
  )
}


async function verifyExplicitSort() {

  const result =
    await resolveMarketplacePlacement({
      supabase:
        createFakeSupabase(),

      listings,

      surface:
        'buy-results',

      sortMode:
        'price-low-high',

      now:
        NOW
    })


  const actual =
    result.listings.map(
      listing =>
        listing.id
    )


  /*
   * Ownership tier remains absolute.
   *
   * Inside the customer tier, explicit price sorting beats
   * promotional placement.
   */

  const expected = [
    CUSTOMER_BOOSTED,
    CUSTOMER_ORGANIC,
    CUSTOMER_FEATURED,
    EXTERNAL_OLDER,
    EXTERNAL_NEWER
  ]


  assertOrder({
    actual,
    expected,
    label:
      'Explicit price sorting'
  })


  console.log(
    '✓ Explicit user sorting overrides promotion inside ownership tiers'
  )

  console.log(
    '✓ Customer ownership still outranks external inventory'
  )
}


async function run() {

  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION PLACEMENT VERIFICATION'
  )

  console.log(
    '========================================'
  )


  await verifyDefaultPlacement()


  console.log('')


  await verifyExplicitSort()


  console.log('')

  console.log(
    '========================================'
  )

  console.log(
    'PROMOTION PLACEMENT VERIFICATION PASSED'
  )

  console.log(
    '========================================'
  )

  console.log(
    '✓ Customer-first invariant'
  )

  console.log(
    '✓ Featured placement'
  )

  console.log(
    '✓ Boosted placement'
  )

  console.log(
    '✓ Organic placement'
  )

  console.log(
    '✓ External inventory priority = 0'
  )

  console.log(
    '✓ Deterministic organic ordering'
  )

  console.log(
    '✓ Explicit sort preservation'
  )
}


run()
  .catch(
    error => {

      console.error('')

      console.error(
        'PROMOTION PLACEMENT VERIFICATION FAILED'
      )

      console.error(
        error
      )

      process.exitCode =
        1
    }
  )