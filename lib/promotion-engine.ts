import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveListingEntitlements,
  type ListingEntitlementRecord
} from '@/lib/listing-entitlements'

import {
  getPromotionCatalogProduct,
  isPromotionProductSlug,
  resolvePromotionBasePriority,
  promotionSupportsSurface,
  type PromotionProductSlug,
  type PromotionSurface,
  type PromotionScope,
  type PromotionPriorityMode,
  type PromotionStackingBehavior
} from '@/lib/promotion-catalog'


export type PromotionOperationalState =
  | 'active'
  | 'scheduled'
  | 'inactive'


export type PromotionEligibilityReason =
  | 'eligible'
  | 'listing-inactive'
  | 'listing-not-customer-owned'
  | 'surface-not-supported'
  | 'province-mismatch'
  | 'property-type-mismatch'
  | 'transaction-type-mismatch'


export type PromotionResolutionContext = {
  surface?:
    PromotionSurface

  province?:
    string

  propertyType?:
    string
}


export type ResolvedPromotion = {
  slug:
    PromotionProductSlug

  entitlementIds:
    string[]

  operationalState:
    PromotionOperationalState

  eligible:
    boolean

  eligibilityReason:
    PromotionEligibilityReason

  active:
    boolean

  scheduled:
    boolean

  surfaces:
    PromotionSurface[]

  scope:
    PromotionScope

  priorityMode:
    PromotionPriorityMode

  basePriority:
    number

  resolvedPriority:
    number

  stackingBehavior:
    PromotionStackingBehavior

  activeQuantity:
    number

  scheduledQuantity:
    number

  startsAt:
    string | null

  expiresAt:
    string | null
}


export type CanonicalPromotionState = {
  listingId:
    string

  ownerId:
    string | null

  listingEligible:
    boolean

  resolvedAt:
    string

  surface:
    PromotionSurface | null

  promotions:
    ResolvedPromotion[]

  activePromotions:
    ResolvedPromotion[]

  scheduledPromotions:
    ResolvedPromotion[]

  eligiblePromotions:
    ResolvedPromotion[]

  totalPriority:
    number

  hasActivePromotion:
    boolean
}


type DatabasePromotionListing = {
  id:
    string

  owner_id:
    string | null

  listing_status:
    string | null

  transaction_type:
    string | null

  province:
    string | null

  property_type:
    string | null
}


export class PromotionEngineError
  extends Error {

  code:
    | 'LISTING_ID_REQUIRED'
    | 'LISTING_NOT_FOUND'
    | 'LISTING_LOAD_FAILED'
    | 'LISTING_OWNER_MISMATCH'
    | 'INVALID_PROMOTION_ENTITLEMENT'
    | 'INVALID_PROMOTION_STATE'
    | 'PROMOTION_CONFLICT'
    | 'PROMOTION_STACKING_VIOLATION'

  listingId:
    string | null

  promotionSlug:
    string | null

  constructor({
    code,
    message,
    listingId = null,
    promotionSlug = null
  }: {
    code:
      PromotionEngineError['code']

    message:
      string

    listingId?:
      string | null

    promotionSlug?:
      string | null
  }) {

    super(
      message
    )

    this.name =
      'PromotionEngineError'

    this.code =
      code

    this.listingId =
      listingId

    this.promotionSlug =
      promotionSlug
  }
}


function normalizeComparableValue(
  value:
    string | null | undefined
): string {

  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase()
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
}


function earliestTimestamp(
  entitlements:
    ListingEntitlementRecord[]
): string | null {

  const timestamps =
    entitlements
      .map(
        entitlement =>
          entitlement.startsAt
      )
      .filter(
        (
          value
        ): value is string =>
          Boolean(
            value
          )
      )
      .sort(
        (
          left,
          right
        ) =>
          new Date(
            left
          ).getTime() -
          new Date(
            right
          ).getTime()
      )

  return (
    timestamps[0] ??
    null
  )
}


function latestTimestamp(
  entitlements:
    ListingEntitlementRecord[]
): string | null {

  const timestamps =
    entitlements
      .map(
        entitlement =>
          entitlement.expiresAt
      )
      .filter(
        (
          value
        ): value is string =>
          Boolean(
            value
          )
      )
      .sort(
        (
          left,
          right
        ) =>
          new Date(
            right
          ).getTime() -
          new Date(
            left
          ).getTime()
      )

  return (
    timestamps[0] ??
    null
  )
}


function resolveOperationalState({
  activeQuantity,
  scheduledQuantity
}: {
  activeQuantity:
    number

  scheduledQuantity:
    number
}): PromotionOperationalState {

  if (
    activeQuantity > 0
  ) {
    return 'active'
  }

  if (
    scheduledQuantity > 0
  ) {
    return 'scheduled'
  }

  return 'inactive'
}


function resolveSurfaceEligibility({
  listing,
  promotionSlug,
  context
}: {
  listing:
    DatabasePromotionListing

  promotionSlug:
    PromotionProductSlug

  context:
    PromotionResolutionContext
}): {
  eligible:
    boolean

  reason:
    PromotionEligibilityReason
} {

  const promotion =
    getPromotionCatalogProduct(
      promotionSlug
    )


  if (
    listing.listing_status !==
      'active'
  ) {
    return {
      eligible:
        false,

      reason:
        'listing-inactive'
    }
  }


  if (
    !listing.owner_id
  ) {
    return {
      eligible:
        false,

      reason:
        'listing-not-customer-owned'
    }
  }


  if (
    context.surface &&
    !promotionSupportsSurface({
      promotion,
      surface:
        context.surface
    })
  ) {
    return {
      eligible:
        false,

      reason:
        'surface-not-supported'
    }
  }


  if (
    promotion.scope ===
      'province' &&
    context.province
  ) {

    const listingProvince =
      normalizeComparableValue(
        listing.province
      )

    const requestedProvince =
      normalizeComparableValue(
        context.province
      )

    if (
      listingProvince !==
        requestedProvince
    ) {
      return {
        eligible:
          false,

        reason:
          'province-mismatch'
      }
    }
  }


  if (
    promotion.scope ===
      'property-type' &&
    context.propertyType
  ) {

    const listingPropertyType =
      normalizeComparableValue(
        listing.property_type
      )

    const requestedPropertyType =
      normalizeComparableValue(
        context.propertyType
      )

    if (
      listingPropertyType !==
        requestedPropertyType
    ) {
      return {
        eligible:
          false,

        reason:
          'property-type-mismatch'
      }
    }
  }


  if (
    context.surface ===
      'buy-results' &&
    listing.transaction_type !==
      'sale'
  ) {
    return {
      eligible:
        false,

      reason:
        'transaction-type-mismatch'
    }
  }


  if (
    context.surface ===
      'rent-results' &&
    listing.transaction_type !==
      'rent'
  ) {
    return {
      eligible:
        false,

      reason:
        'transaction-type-mismatch'
    }
  }


  return {
    eligible:
      true,

    reason:
      'eligible'
  }
}


function assertCanonicalPromotionState({
  listingId,
  slug,
  activeEntitlements,
  scheduledEntitlements
}: {
  listingId:
    string

  slug:
    PromotionProductSlug

  activeEntitlements:
    ListingEntitlementRecord[]

  scheduledEntitlements:
    ListingEntitlementRecord[]
}): void {

  const catalog =
    getPromotionCatalogProduct(
      slug
    )


  const operationalCount =
    activeEntitlements.length +
    scheduledEntitlements.length


  if (
    catalog.stackingBehavior ===
      'non-stackable' &&
    operationalCount > 1
  ) {

    throw new PromotionEngineError({
      code:
        'PROMOTION_STACKING_VIOLATION',

      listingId,

      promotionSlug:
        slug,

      message:
        `Non-stackable promotion "${slug}" has multiple active or scheduled entitlements.`
    })
  }


  if (
    catalog.maximumQuantity !==
      null &&
    operationalCount >
      catalog.maximumQuantity
  ) {

    throw new PromotionEngineError({
      code:
        'PROMOTION_STACKING_VIOLATION',

      listingId,

      promotionSlug:
        slug,

      message:
        `Promotion "${slug}" exceeds its canonical maximum quantity of ${catalog.maximumQuantity}.`
    })
  }


  const overlappingStates =
    activeEntitlements.some(
      activeEntitlement =>
        scheduledEntitlements.some(
          scheduledEntitlement =>
            activeEntitlement.entitlementId ===
              scheduledEntitlement.entitlementId
        )
    )


  if (
    overlappingStates
  ) {

    throw new PromotionEngineError({
      code:
        'INVALID_PROMOTION_STATE',

      listingId,

      promotionSlug:
        slug,

      message:
        `Promotion "${slug}" contains an entitlement resolved as both active and scheduled.`
    })
  }
}


function resolvePromotionPriority({
  slug,
  activeQuantity
}: {
  slug:
    PromotionProductSlug

  activeQuantity:
    number
}): number {

  const promotion =
    getPromotionCatalogProduct(
      slug
    )

  const basePriority =
    resolvePromotionBasePriority(
      promotion
    )


  /*
   * Non-stackable promotions always resolve to their
   * catalog-defined base priority.
   */

  if (
    promotion.stackingBehavior ===
      'non-stackable'
  ) {
    return activeQuantity > 0
      ? basePriority
      : 0
  }


  /*
   * Stackable promotion behavior.
   *
   * Each active entitlement contributes the canonical base
   * weight.
   *
   * Example:
   *
   * listing-boost
   * base priority = 25
   *
   * 1 active boost = 25
   * 2 active boosts = 50
   * 3 active boosts = 75
   * 4 active boosts = 100
   */

  return (
    basePriority *
    activeQuantity
  )
}


function resolvePromotion({
  listing,
  slug,
  entitlements,
  context
}: {
  listing:
    DatabasePromotionListing

  slug:
    PromotionProductSlug

  entitlements:
    ListingEntitlementRecord[]

  context:
    PromotionResolutionContext
}): ResolvedPromotion {

  const catalog =
    getPromotionCatalogProduct(
      slug
    )


  const promotionEntitlements =
    entitlements.filter(
      entitlement =>
        entitlement.productSlug ===
          slug
    )


  const activeEntitlements =
    promotionEntitlements.filter(
      entitlement =>
        entitlement.isCurrentlyActive
    )


  const scheduledEntitlements =
    promotionEntitlements.filter(
      entitlement =>
        entitlement.isScheduled
    )


  assertCanonicalPromotionState({
    listingId:
      listing.id,

    slug,

    activeEntitlements,

    scheduledEntitlements
  })


  const eligibility =
    resolveSurfaceEligibility({
      listing,
      promotionSlug:
        slug,
      context
    })


  const activeQuantity =
    activeEntitlements.length

  const scheduledQuantity =
    scheduledEntitlements.length


  const operationalState =
    resolveOperationalState({
      activeQuantity,
      scheduledQuantity
    })


  const resolvedPriority =
    eligibility.eligible &&
    operationalState ===
      'active'
      ? resolvePromotionPriority({
          slug,
          activeQuantity
        })
      : 0


  return {

    slug,

    entitlementIds:
      promotionEntitlements.map(
        entitlement =>
          entitlement.entitlementId
      ),

    operationalState,

    eligible:
      eligibility.eligible,

    eligibilityReason:
      eligibility.reason,

    active:
      operationalState ===
        'active',

    scheduled:
      operationalState ===
        'scheduled',

    surfaces:
      catalog.surfaces,

    scope:
      catalog.scope,

    priorityMode:
      catalog.priorityMode,

    basePriority:
      catalog.priorityWeight,

    resolvedPriority,

    stackingBehavior:
      catalog.stackingBehavior,

    activeQuantity,

    scheduledQuantity,

    startsAt:
      earliestTimestamp(
        [
          ...activeEntitlements,
          ...scheduledEntitlements
        ]
      ),

    expiresAt:
      latestTimestamp(
        activeEntitlements
      )
  }
}


function collectPromotionSlugs(
  entitlements:
    ListingEntitlementRecord[]
): PromotionProductSlug[] {

  const slugs =
    new Set<
      PromotionProductSlug
    >()


  for (
    const entitlement
    of entitlements
  ) {

    if (
      entitlement.productType !==
        'promotion'
    ) {
      continue
    }


    if (
      !isPromotionProductSlug(
        entitlement.productSlug
      )
    ) {

      throw new PromotionEngineError({
        code:
          'INVALID_PROMOTION_ENTITLEMENT',

        listingId:
          entitlement.listingId,

        promotionSlug:
          entitlement.productSlug,

        message:
          `Promotion entitlement "${entitlement.entitlementId}" references unknown promotion product "${entitlement.productSlug}".`
      })
    }


    slugs.add(
      entitlement.productSlug
    )
  }


  return Array.from(
    slugs
  )
}


/*
 * ---------------------------------------------------------
 * PRE-RESOLVED PROMOTION STATE
 * ---------------------------------------------------------
 *
 * Pure operational resolver.
 *
 * Used when entitlement state has already been resolved
 * canonically, such as marketplace batch placement.
 *
 * This avoids repeating database queries while keeping all
 * promotion behavior inside the Promotion Engine.
 */

  export function resolvePromotionsFromEntitlements({
      listing,
      entitlements,
      context = {},
      now = new Date()
    }: {
      listing: {
        id: string
        owner_id: string | null
        listing_status: string | null
        transaction_type: string | null
        province: string | null
        property_type: string | null
      }

      entitlements:
        ListingEntitlementRecord[]

      context?:
        PromotionResolutionContext

      now?:
        Date
    }): CanonicalPromotionState {

      /*
      * External inventory can never receive customer
      * promotional priority.
      */

      if (
        !listing.owner_id
      ) {

        return {
          listingId:
            listing.id,

          ownerId:
            null,

          listingEligible:
            false,

          resolvedAt:
            now.toISOString(),

          surface:
            context.surface ??
            null,

          promotions: [],

          activePromotions: [],

          scheduledPromotions: [],

          eligiblePromotions: [],

          totalPriority:
            0,

          hasActivePromotion:
            false
        }
      }


      const promotionSlugs =
        collectPromotionSlugs(
          entitlements
        )


      const promotions =
        promotionSlugs.map(
          slug =>
            resolvePromotion({
              listing,
              slug,
              entitlements,
              context
            })
        )


      promotions.sort(
        (
          left,
          right
        ) => {

          const priorityDifference =
            right.resolvedPriority -
            left.resolvedPriority

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference
          }

          return left.slug
            .localeCompare(
              right.slug
            )
        }
      )


      const activePromotions =
        promotions.filter(
          promotion =>
            promotion.active
        )


      const scheduledPromotions =
        promotions.filter(
          promotion =>
            promotion.scheduled
        )


      const eligiblePromotions =
        promotions.filter(
          promotion =>
            promotion.eligible
        )


      const totalPriority =
        activePromotions
          .filter(
            promotion =>
              promotion.eligible
          )
          .reduce(
            (
              total,
              promotion
            ) =>
              total +
              promotion.resolvedPriority,
            0
          )


      return {
        listingId:
          listing.id,

        ownerId:
          listing.owner_id,

        listingEligible:
          listing.listing_status ===
            'active',

        resolvedAt:
          now.toISOString(),

        surface:
          context.surface ??
          null,

        promotions,

        activePromotions,

        scheduledPromotions,

        eligiblePromotions,

        totalPriority,

        hasActivePromotion:
          activePromotions.some(
            promotion =>
              promotion.eligible
          )
      }
    }

/*
 * ---------------------------------------------------------
 * CANONICAL PROMOTION RESOLVER
 * ---------------------------------------------------------
 *
 * This is the authoritative operational entry point.
 *
 * It answers:
 *
 * • Which promotions does this listing have?
 * • Which are active?
 * • Which are scheduled?
 * • Which are eligible on the requested surface?
 * • What priority do they contribute?
 *
 * It does NOT:
 *
 * • create purchases
 * • create entitlements
 * • activate entitlements
 * • modify listing order
 * • perform React rendering
 */


export async function resolveListingPromotions({
  supabase,
  listingId,
  ownerId,
  context = {},
  now = new Date()
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  ownerId?:
    string

  context?:
    PromotionResolutionContext

  now?:
    Date
}): Promise<
  CanonicalPromotionState
> {

  if (
    !listingId
  ) {

    throw new PromotionEngineError({
      code:
        'LISTING_ID_REQUIRED',

      message:
        'A listing ID is required to resolve promotion state.'
    })
  }


  /*
   * Resolve canonical listing state first.
   */

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
        listing_status,
        transaction_type,
        province,
        property_type
      `)
      .eq(
        'id',
        listingId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new PromotionEngineError({
      code:
        'LISTING_LOAD_FAILED',

      listingId,

      message:
        error.message
    })
  }


  if (
    !data
  ) {

    throw new PromotionEngineError({
      code:
        'LISTING_NOT_FOUND',

      listingId,

      message:
        'The selected listing does not exist.'
    })
  }


  const listing =
    data as
      DatabasePromotionListing


  if (
    ownerId &&
    listing.owner_id !==
      ownerId
  ) {

    throw new PromotionEngineError({
      code:
        'LISTING_OWNER_MISMATCH',

      listingId,

      message:
        'The authenticated user does not own this listing.'
    })
  }


  /*
   * External inventory cannot own customer promotions.
   *
   * Return authoritative empty state rather than throwing.
   *
   * This allows marketplace ranking to resolve scraped
   * inventory safely without treating absence of ownership
   * as exceptional behavior.
   */

  if (
    !listing.owner_id
  ) {

    return {
      listingId,

      ownerId:
        null,

      listingEligible:
        false,

      resolvedAt:
        now.toISOString(),

      surface:
        context.surface ??
        null,

      promotions: [],

      activePromotions: [],

      scheduledPromotions: [],

      eligiblePromotions: [],

      totalPriority:
        0,

      hasActivePromotion:
        false
    }
  }


  /*
   * Entitlement Engine owns entitlement lifecycle truth.
   *
   * Promotion Engine consumes it.
   */

  const resolvedEntitlements =
    await resolveListingEntitlements({
      supabase,

      listingId,

      ownerId:
        listing.owner_id,

      includeInactive:
        true,

      now
    })


  const promotionSlugs =
    collectPromotionSlugs(
      resolvedEntitlements.entitlements
    )


  const promotions =
    promotionSlugs.map(
      slug =>
        resolvePromotion({
          listing,

          slug,

          entitlements:
            resolvedEntitlements.entitlements,

          context
        })
    )


  /*
   * Deterministic output ordering.
   *
   * Highest resolved priority first.
   * Slug provides stable tie-breaking.
   */

  promotions.sort(
    (
      left,
      right
    ) => {

      const priorityDifference =
        right.resolvedPriority -
        left.resolvedPriority

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference
      }

      return left.slug
        .localeCompare(
          right.slug
        )
    }
  )


  const activePromotions =
    promotions.filter(
      promotion =>
        promotion.active
    )


  const scheduledPromotions =
    promotions.filter(
      promotion =>
        promotion.scheduled
    )


  const eligiblePromotions =
    promotions.filter(
      promotion =>
        promotion.eligible
    )


  const totalPriority =
    activePromotions
      .filter(
        promotion =>
          promotion.eligible
      )
      .reduce(
        (
          total,
          promotion
        ) =>
          total +
          promotion.resolvedPriority,
        0
      )


  return {

    listingId,

    ownerId:
      listing.owner_id,

    listingEligible:
      listing.listing_status ===
        'active',

    resolvedAt:
      now.toISOString(),

    surface:
      context.surface ??
      null,

    promotions,

    activePromotions,

    scheduledPromotions,

    eligiblePromotions,

    totalPriority,

    hasActivePromotion:
      activePromotions.some(
        promotion =>
          promotion.eligible
      )
  }
}


/*
 * ---------------------------------------------------------
 * SURFACE-SPECIFIC RESOLUTION
 * ---------------------------------------------------------
 */


export async function resolveListingPromotionsForSurface({
  supabase,
  listingId,
  surface,
  ownerId,
  province,
  propertyType,
  now = new Date()
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  surface:
    PromotionSurface

  ownerId?:
    string

  province?:
    string

  propertyType?:
    string

  now?:
    Date
}): Promise<
  CanonicalPromotionState
> {

  return resolveListingPromotions({
    supabase,

    listingId,

    ownerId,

    now,

    context: {
      surface,
      province,
      propertyType
    }
  })
}