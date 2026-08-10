export type ListingRankingSortMode =
  | 'default'
  | 'newest'
  | 'price-low-high'
  | 'price-high-low'


export type ListingRankingTier =
  | 'customer'
  | 'external'


export type ListingPromotionTier =
  | 'featured'
  | 'boosted'
  | 'organic'


export type RankableListing = {
  id:
    string

  owner_id?:
    string | null

  created_at?:
    string | null

  current_price?:
    number | null

  monthly_price?:
    number | null
}


export type ListingPromotionRanking = {
  listingId:
    string

  tier:
    ListingPromotionTier

  priority:
    number
}


export type RankListingsInput<
  T extends RankableListing
> = {
  listings:
    T[]

  sortMode?:
    ListingRankingSortMode

  promotions?:
    ListingPromotionRanking[]
}


function resolveOwnershipTier(
  listing:
    RankableListing
): ListingRankingTier {

  return listing.owner_id
    ? 'customer'
    : 'external'
}


function ownershipTierWeight(
  listing:
    RankableListing
): number {

  return resolveOwnershipTier(
    listing
  ) === 'customer'
    ? 1
    : 0
}


function parseCreatedAt(
  listing:
    RankableListing
): number {

  if (
    !listing.created_at
  ) {
    return 0
  }

  const timestamp =
    new Date(
      listing.created_at
    ).getTime()

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0
}


function resolveComparablePrice(
  listing:
    RankableListing
): number {

  const currentPrice =
    Number(
      listing.current_price
    )

  if (
    Number.isFinite(
      currentPrice
    ) &&
    currentPrice > 0
  ) {
    return currentPrice
  }


  const monthlyPrice =
    Number(
      listing.monthly_price
    )

  if (
    Number.isFinite(
      monthlyPrice
    ) &&
    monthlyPrice > 0
  ) {
    return monthlyPrice
  }


  return Number
    .POSITIVE_INFINITY
}


function compareDeterministicId(
  left:
    RankableListing,

  right:
    RankableListing
): number {

  return left.id
    .localeCompare(
      right.id
    )
}


function compareNewest(
  left:
    RankableListing,

  right:
    RankableListing
): number {

  const timestampDifference =
    parseCreatedAt(
      right
    ) -
    parseCreatedAt(
      left
    )

  if (
    timestampDifference !== 0
  ) {
    return timestampDifference
  }

  return compareDeterministicId(
    left,
    right
  )
}


function resolvePromotionRanking(
  listingId:
    string,

  promotionMap:
    Map<
      string,
      ListingPromotionRanking
    >
):
  ListingPromotionRanking {

  return (
    promotionMap.get(
      listingId
    ) ?? {
      listingId,

      tier:
        'organic',

      priority:
        0
    }
  )
}


function promotionTierWeight(
  tier:
    ListingPromotionTier
): number {

  switch (
    tier
  ) {

    case 'featured':
      return 2

    case 'boosted':
      return 1

    case 'organic':
    default:
      return 0
  }
}


function comparePromotionRanking({
  left,
  right,
  promotionMap
}: {
  left:
    RankableListing

  right:
    RankableListing

  promotionMap:
    Map<
      string,
      ListingPromotionRanking
    >
}): number {

  const leftPromotion =
    resolvePromotionRanking(
      left.id,
      promotionMap
    )

  const rightPromotion =
    resolvePromotionRanking(
      right.id,
      promotionMap
    )


  const tierDifference =
    promotionTierWeight(
      rightPromotion.tier
    ) -
    promotionTierWeight(
      leftPromotion.tier
    )

  if (
    tierDifference !== 0
  ) {
    return tierDifference
  }


  const priorityDifference =
    rightPromotion.priority -
    leftPromotion.priority

  if (
    priorityDifference !== 0
  ) {
    return priorityDifference
  }


  return 0
}


function compareExplicitSort(
  left:
    RankableListing,

  right:
    RankableListing,

  sortMode:
    ListingRankingSortMode
): number {

  switch (
    sortMode
  ) {

    case 'price-low-high': {

      const difference =
        resolveComparablePrice(
          left
        ) -
        resolveComparablePrice(
          right
        )

      if (
        difference !== 0
      ) {
        return difference
      }

      return compareNewest(
        left,
        right
      )
    }


    case 'price-high-low': {

      const leftPrice =
        resolveComparablePrice(
          left
        )

      const rightPrice =
        resolveComparablePrice(
          right
        )


      /*
       * Listings without usable prices stay behind listings
       * with canonical prices.
       */

      if (
        leftPrice ===
          Number.POSITIVE_INFINITY &&
        rightPrice !==
          Number.POSITIVE_INFINITY
      ) {
        return 1
      }

      if (
        rightPrice ===
          Number.POSITIVE_INFINITY &&
        leftPrice !==
          Number.POSITIVE_INFINITY
      ) {
        return -1
      }


      const difference =
        rightPrice -
        leftPrice

      if (
        difference !== 0
      ) {
        return difference
      }

      return compareNewest(
        left,
        right
      )
    }


    case 'newest':
      return compareNewest(
        left,
        right
      )


    case 'default':
    default:
      return 0
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL LISTING RANKING
 * ---------------------------------------------------------
 *
 * Ranking invariant #1:
 *
 * Customer-owned inventory ALWAYS ranks above external
 * inventory.
 *
 * Promotion can modify placement only inside an ownership
 * tier.
 *
 * A promoted external listing can never outrank a customer
 * listing.
 *
 * Explicit user sorting is preserved inside ownership
 * tiers.
 *
 * Eligibility/filtering happens BEFORE this engine.
 */


export function rankListings<
  T extends RankableListing
>({
  listings,
  sortMode = 'default',
  promotions = []
}: RankListingsInput<T>): T[] {

  const promotionMap =
    new Map(
      promotions.map(
        promotion => [
          promotion.listingId,
          promotion
        ]
      )
    )


  return [
    ...listings
  ].sort(
    (
      left,
      right
    ) => {

      /*
       * ---------------------------------------------------
       * 1. OWNERSHIP TIER
       * ---------------------------------------------------
       *
       * Permanent Twuanis invariant.
       */

      const ownershipDifference =
        ownershipTierWeight(
          right
        ) -
        ownershipTierWeight(
          left
        )

      if (
        ownershipDifference !== 0
      ) {
        return ownershipDifference
      }


      /*
       * ---------------------------------------------------
       * 2. EXPLICIT USER SORT
       * ---------------------------------------------------
       *
       * If the user explicitly selects a sort mode, honor
       * it inside the ownership tier.
       *
       * Promotion does not falsify explicit sorting.
       */

      if (
        sortMode !==
          'default'
      ) {

        const explicitDifference =
          compareExplicitSort(
            left,
            right,
            sortMode
          )

        if (
          explicitDifference !== 0
        ) {
          return explicitDifference
        }

        return compareDeterministicId(
          left,
          right
        )
      }


      /*
       * ---------------------------------------------------
       * 3. PROMOTION TIER
       * ---------------------------------------------------
       *
       * Promotion operates only on already eligible
       * listings and only inside the ownership tier.
       */

      const promotionDifference =
        comparePromotionRanking({
          left,
          right,
          promotionMap
        })

      if (
        promotionDifference !== 0
      ) {
        return promotionDifference
      }


      /*
       * ---------------------------------------------------
       * 4. ORGANIC ORDER
       * ---------------------------------------------------
       *
       * Canonical marketplace default:
       *
       * newest first.
       */

      return compareNewest(
        left,
        right
      )
    }
  )
}


export function resolveListingRankingTier(
  listing:
    RankableListing
): ListingRankingTier {

  return resolveOwnershipTier(
    listing
  )
}