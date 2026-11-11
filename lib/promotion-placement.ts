import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveListingEntitlementsBatch
} from '@/lib/listing-entitlements'

import {
  resolvePromotionsFromEntitlements,
  type CanonicalPromotionState
} from '@/lib/promotion-engine'

import type {
  PromotionSurface
} from '@/lib/promotion-catalog'

import {
  rankListings,
  type RankableListing,
  type ListingPromotionRanking,
  type ListingPromotionTier,
  type ListingRankingSortMode
} from '@/lib/listing-ranking'


export type PromotionPlacementListing =
  RankableListing & {

    listing_status?:
      string | null

    transaction_type?:
      string | null

    province?:
      string | null

    property_type?:
      string | null
  }


export type MarketplacePlacementResult<
  T extends PromotionPlacementListing
> = {

  listings:
    T[]

  promotionRankings:
    ListingPromotionRanking[]

  promotionStateByListingId:
    Record<
      string,
      CanonicalPromotionState
    >

  surface:
    PromotionSurface

  resolvedAt:
    string
}


export class PromotionPlacementError
  extends Error {

  code:
    | 'SURFACE_REQUIRED'
    | 'INVALID_LISTING_ID'
    | 'PLACEMENT_RESOLUTION_FAILED'

  constructor(
    code:
      PromotionPlacementError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'PromotionPlacementError'

    this.code =
      code
  }
}


/*
 * ---------------------------------------------------------
 * PROMOTION TIER RESOLUTION
 * ---------------------------------------------------------
 *
 * Promotion Placement translates canonical operational
 * promotion state into the ranking vocabulary understood
 * by listing-ranking.ts.
 *
 * Placement does not calculate whether promotions are
 * valid. Promotion Engine already owns that decision.
 */


function resolveListingPromotionTier(
  state:
    CanonicalPromotionState
): ListingPromotionTier {

  const hasFeaturedPromotion =
    state
      .activePromotions
      .some(
        promotion =>
          promotion.eligible &&
          promotion.priorityMode ===
            'featured'
      )


  if (
    hasFeaturedPromotion
  ) {
    return 'featured'
  }


  const hasBoostPromotion =
    state
      .activePromotions
      .some(
        promotion =>
          promotion.eligible &&
          (
            promotion.priorityMode ===
              'boost' ||
            promotion.priorityMode ===
              'surface-placement'
          )
      )


  if (
    hasBoostPromotion
  ) {
    return 'boosted'
  }


  return 'organic'
}


/*
 * ---------------------------------------------------------
 * CANONICAL LISTING NORMALIZATION
 * ---------------------------------------------------------
 *
 * The placement engine accepts already-eligible cohorts.
 *
 * Missing marketplace fields resolve conservatively.
 */


function normalizeListingForPromotion(
  listing:
    PromotionPlacementListing
) {

  return {
    id:
      listing.id,

    owner_id:
      listing.owner_id ??
      null,

    listing_status:
      listing.listing_status ??
      null,

    transaction_type:
      listing.transaction_type ??
      null,

    province:
      listing.province ??
      null,

    property_type:
      listing.property_type ??
      null
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL MARKETPLACE PLACEMENT
 * ---------------------------------------------------------
 *
 * Input:
 *
 * Already-eligible listing cohort.
 *
 * Output:
 *
 * Same cohort, canonically reordered.
 *
 * This function NEVER adds listings to the cohort.
 * It NEVER removes listings from the cohort.
 *
 * Eligibility belongs upstream.
 * Placement only determines order.
 */


export async function resolveMarketplacePlacement<
  T extends PromotionPlacementListing
>({
  supabase,
  listings,
  surface,
  province,
  propertyType,
  sortMode = 'default',
  now = new Date()
}: {
  supabase:
    SupabaseClient

  listings:
    T[]

  surface:
    PromotionSurface

  province?:
    string

  propertyType?:
    string

  sortMode?:
    ListingRankingSortMode

  now?:
    Date
}): Promise<
  MarketplacePlacementResult<T>
> {

  if (
    !surface
  ) {

    throw new PromotionPlacementError(
      'SURFACE_REQUIRED',
      'A marketplace surface is required to resolve promotional placement.'
    )
  }


  /*
   * Nothing to resolve.
   */

  if (
    listings.length ===
      0
  ) {

    return {
      listings: [],

      promotionRankings: [],

      promotionStateByListingId:
        {},

      surface,

      resolvedAt:
        now.toISOString()
    }
  }


  /*
   * -------------------------------------------------------
   * VERIFY LISTING IDENTITIES
   * -------------------------------------------------------
   */


  const invalidListing =
    listings.find(
      listing =>
        !listing.id
    )


  if (
    invalidListing
  ) {

    throw new PromotionPlacementError(
      'INVALID_LISTING_ID',
      'Every listing passed to Promotion Placement must have a canonical listing ID.'
    )
  }


  const listingIds =
    Array.from(
      new Set(
        listings.map(
          listing =>
            listing.id
        )
      )
    )


  /*
   * -------------------------------------------------------
   * BATCH ENTITLEMENT RESOLUTION
   * -------------------------------------------------------
   *
   * Entitlement Engine owns lifecycle truth.
   *
   * This produces canonical active / scheduled /
   * historical entitlement state for the whole cohort.
   */


  const entitlementBatch =
    await resolveListingEntitlementsBatch({
      supabase,

      listingIds,

      includeInactive:
        true,

      now
    })


  const promotionStateByListingId:
    Record<
      string,
      CanonicalPromotionState
    > = {}


  const promotionRankings:
    ListingPromotionRanking[] =
      []


  /*
   * -------------------------------------------------------
   * RESOLVE PROMOTION STATE
   * -------------------------------------------------------
   */


  for (
    const listing
    of listings
  ) {

    /*
     * External inventory has canonical zero promotional
     * priority.
     *
     * No entitlement record exists for it and none should
     * be manufactured.
     */

    if (
      !listing.owner_id
    ) {

      promotionRankings.push({
        listingId:
          listing.id,

        tier:
          'organic',

        priority:
          0
      })

      continue
    }


    const resolvedEntitlements =
      entitlementBatch
        .byListingId[
          listing.id
        ]


    /*
     * Every customer listing is returned by the batch
     * resolver, even when it owns zero entitlements.
     */

    if (
      !resolvedEntitlements
    ) {

      throw new PromotionPlacementError(
        'PLACEMENT_RESOLUTION_FAILED',
        `Canonical entitlement state could not be resolved for customer listing ${listing.id}.`
      )
    }


    const promotionState =
      resolvePromotionsFromEntitlements({
        listing:
          normalizeListingForPromotion(
            listing
          ),

        entitlements:
          resolvedEntitlements
            .entitlements,

        context: {
          surface,

          province,

          propertyType
        },

        now
      })


    promotionStateByListingId[
      listing.id
    ] =
      promotionState


    promotionRankings.push({
      listingId:
        listing.id,

      tier:
        resolveListingPromotionTier(
          promotionState
        ),

      priority:
        promotionState
          .totalPriority
    })
  }


  /*
   * -------------------------------------------------------
   * CANONICAL FINAL ORDER
   * -------------------------------------------------------
   *
   * listing-ranking.ts remains authoritative for ranking.
   *
   * Its permanent hierarchy is:
   *
   * 1. Customer-owned inventory
   * 2. Explicit user sort, when requested
   * 3. Promotion tier / priority
   * 4. Organic newest-first order
   * 5. Deterministic ID tie-breaker
   *
   * Promotion Placement does not reimplement any of those
   * ordering rules.
   */


  const rankedListings =
    rankListings({
      listings,

      sortMode,

      promotions:
        promotionRankings
    })


  return {

    listings:
      rankedListings,

    promotionRankings,

    promotionStateByListingId,

    surface,

    resolvedAt:
      now.toISOString()
  }
}