import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveUserPackageLimits,
  type PackageLimits
} from '@/lib/package-limits'

import {
  resolveUserPackageUsage,
  type PackageUsage
} from '@/lib/package-usage'

import {
  resolveListingEntitlementsBatch
} from '@/lib/listing-entitlements'


/*
 * ---------------------------------------------------------
 * COMMERCIAL RESOLVER
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Compose canonical commercial state from the existing
 * package, subscription, usage, and entitlement engines.
 *
 * This resolver does NOT:
 *
 * - activate purchases
 * - approve purchases
 * - calculate entitlement lifecycle independently
 * - calculate package limits independently
 * - calculate marketplace placement
 *
 * Existing engines remain authoritative for those concerns.
 *
 * This resolver answers:
 *
 * "What commercial state does this user possess right now?"
 */


export type CommercialSubscriptionStatus =
  | 'active'
  | 'pending'
  | 'pending_payment'
  | 'cancelled'
  | 'expired'
  | 'rejected'
  | string


export type CommercialSubscription = {
  subscriptionId:
    string

  userId:
    string

  packageId:
    string

  status:
    CommercialSubscriptionStatus

  billingCycle:
    string | null

  startedAt:
    string | null

  currentPeriodStart:
    string | null

  currentPeriodEnd:
    string | null

  cancelledAt:
    string | null

  expiredAt:
    string | null

  purchaseRequestId:
    string | null

  createdAt:
    string

  updatedAt:
    string | null

  isActive:
    boolean
}


export type CommercialPackage = {
    packageId:
      string

    packageSlug:
      string

    nameEn:
      string

    nameEs:
      string

    descriptionEn:
      string | null

    descriptionEs:
      string | null

    priceUsd:
      number

    priceCrc:
      number

    billingInterval:
      string

    hierarchyLevel:
      number

    displayOrder:
      number
  }


export type CommercialEntitlement = {
  entitlementId:
    string

  listingId:
    string

  ownerId:
    string

  productId:
    string

  productSlug:
    string

  productNameEn:
    string

  productNameEs:
    string

  productType:
    string

  targetType:
    string

  status:
    string

  sourceType:
    string

  startsAt:
    string | null

  expiresAt:
    string | null

  purchaseRequestId:
    string | null

  assignedBy:
    string | null

  revokedAt:
    string | null

  revokedBy:
    string | null

  revocationReason:
    string | null

  createdAt:
    string

  updatedAt:
    string

  isPending:
    boolean

  isScheduled:
    boolean

  isCurrentlyActive:
    boolean

  isExpired:
    boolean

  isRevoked:
    boolean

  isCancelled:
    boolean

  remainingDurationMs:
    number | null

  remainingDurationHours:
    number | null

  remainingDurationDays:
    number | null
}


export type CommercialRemainingCapacity = {
  listings: {
    used:
      number

    limit:
      number | null

    remaining:
      number | null
  }

  featuredListings: {
    used:
      number

    limit:
      number | null

    remaining:
      number | null
  }

  storage: {
    usedBytes:
      number

    limitBytes:
      number | null

    remainingBytes:
      number | null
  }
}


export type CommercialQuantityState = {
  productSlug:
    string

  activeQuantity:
    number

  scheduledQuantity:
    number

  historicalQuantity:
    number
}


export type CanonicalCommercialState = {
  userId:
    string

  resolvedAt:
    string

  activePackage:
    CommercialPackage | null

  subscriptions: {
    active:
      CommercialSubscription | null

    all:
      CommercialSubscription[]

    historical:
      CommercialSubscription[]
  }

  entitlements: {
    active:
      CommercialEntitlement[]

    scheduled:
      CommercialEntitlement[]

    historical:
      CommercialEntitlement[]

    all:
      CommercialEntitlement[]

    quantityByProduct:
      Record<
        string,
        CommercialQuantityState
      >
  }

  usage:
    PackageUsage | null

  limits:
    PackageLimits | null

  remaining:
    CommercialRemainingCapacity | null
}


type DatabaseSubscriptionRow = {
  id:
    string

  user_id:
    string

  package_id:
    string

  status:
    string

  billing_cycle:
    string | null

  started_at:
    string | null

  current_period_start:
    string | null

  current_period_end:
    string | null

  cancelled_at:
    string | null

  expired_at:
    string | null

  purchase_request_id:
    string | null

  created_at:
    string

  updated_at:
    string | null
}


  type DatabaseOwnedListing = {
    id:
      string
  }

  type DatabasePackageRow = {
    id:
      string

    slug:
      string

    name_en:
      string

    name_es:
      string

    description_en:
      string | null

    description_es:
      string | null

    price_usd:
      number

    price_crc:
      number

    billing_interval:
      string

    hierarchy_level:
      number

    display_order:
      number
  }

export class CommercialResolverError
  extends Error {

  code:
    | 'USER_ID_REQUIRED'
    | 'SUBSCRIPTIONS_LOAD_FAILED'
    | 'LISTINGS_LOAD_FAILED'
    | 'COMMERCIAL_RESOLUTION_FAILED'

  constructor(
    code:
      CommercialResolverError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'CommercialResolverError'

    this.code =
      code
  }
}


function nonNegativeRemaining(
  used:
    number,

  limit:
    number | null
): number | null {

  if (
    limit ===
      null
  ) {

    return null
  }

  return Math.max(
    0,
    limit -
      used
  )
}


function calculateRemainingDuration({
  expiresAt,
  now
}: {
  expiresAt:
    string | null

  now:
    Date
}) {

  if (
    !expiresAt
  ) {

    return {
      remainingDurationMs:
        null,

      remainingDurationHours:
        null,

      remainingDurationDays:
        null
    }
  }


  const expirationTimestamp =
    new Date(
      expiresAt
    ).getTime()


  if (
    !Number.isFinite(
      expirationTimestamp
    )
  ) {

    return {
      remainingDurationMs:
        null,

      remainingDurationHours:
        null,

      remainingDurationDays:
        null
    }
  }


  const remainingDurationMs =
    Math.max(
      0,
      expirationTimestamp -
        now.getTime()
    )


  const remainingDurationHours =
    Number(
      (
        remainingDurationMs /
        (
          60 *
          60 *
          1000
        )
      ).toFixed(
        2
      )
    )


  const remainingDurationDays =
    Number(
      (
        remainingDurationHours /
        24
      ).toFixed(
        2
      )
    )


  return {
    remainingDurationMs,
    remainingDurationHours,
    remainingDurationDays
  }
}


function normalizeSubscription(
  row:
    DatabaseSubscriptionRow
): CommercialSubscription {

  return {
    subscriptionId:
      row.id,

    userId:
      row.user_id,

    packageId:
      row.package_id,

    status:
      row.status,

    billingCycle:
      row.billing_cycle,

    startedAt:
      row.started_at,

    currentPeriodStart:
      row.current_period_start,

    currentPeriodEnd:
      row.current_period_end,

    cancelledAt:
      row.cancelled_at,

    expiredAt:
      row.expired_at,

    purchaseRequestId:
      row.purchase_request_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    isActive:
      row.status ===
        'active'
  }
}


function normalizeEntitlement({
  entitlement,
  now
}: {
  entitlement:
    any

  now:
    Date
}): CommercialEntitlement {

  const remaining =
    calculateRemainingDuration({
      expiresAt:
        entitlement.expiresAt,

      now
    })


  return {
    entitlementId:
      entitlement.entitlementId,

    listingId:
      entitlement.listingId,

    ownerId:
      entitlement.ownerId,

    productId:
      entitlement.productId,

    productSlug:
      entitlement.productSlug,

    productNameEn:
      entitlement.productNameEn,

    productNameEs:
      entitlement.productNameEs,

    productType:
      entitlement.productType,

    targetType:
      entitlement.targetType,

    status:
      entitlement.status,

    sourceType:
      entitlement.sourceType,

    startsAt:
      entitlement.startsAt,

    expiresAt:
      entitlement.expiresAt,

    purchaseRequestId:
      entitlement.purchaseRequestId,

    assignedBy:
      entitlement.assignedBy,

    revokedAt:
      entitlement.revokedAt,

    revokedBy:
      entitlement.revokedBy,

    revocationReason:
      entitlement.revocationReason,

    createdAt:
      entitlement.createdAt,

    updatedAt:
      entitlement.updatedAt,

    isPending:
      entitlement.isPending,

    isScheduled:
      entitlement.isScheduled,

    isCurrentlyActive:
      entitlement.isCurrentlyActive,

    isExpired:
      entitlement.isExpired,

    isRevoked:
      entitlement.isRevoked,

    isCancelled:
      entitlement.isCancelled,

    ...remaining
  }
}


function buildQuantityByProduct(
  entitlements:
    CommercialEntitlement[]
): Record<
  string,
  CommercialQuantityState
> {

  const result:
    Record<
      string,
      CommercialQuantityState
    > =
      {}


  for (
    const entitlement
    of entitlements
  ) {

    const slug =
      entitlement.productSlug


    if (
      !result[
        slug
      ]
    ) {

      result[
        slug
      ] = {
        productSlug:
          slug,

        activeQuantity:
          0,

        scheduledQuantity:
          0,

        historicalQuantity:
          0
      }
    }


    if (
      entitlement.isCurrentlyActive
    ) {

      result[
        slug
      ].activeQuantity +=
        1

    } else if (
      entitlement.isScheduled
    ) {

      result[
        slug
      ].scheduledQuantity +=
        1

    } else {

      result[
        slug
      ].historicalQuantity +=
        1
    }
  }


  return result
}


export async function resolveCommercialState({
  supabase,
  userId,
  now =
    new Date()
}: {
  supabase:
    SupabaseClient

  userId:
    string

  now?:
    Date
}): Promise<
  CanonicalCommercialState
> {

  if (
    !userId
  ) {

    throw new CommercialResolverError(
      'USER_ID_REQUIRED',
      'A user ID is required to resolve canonical commercial state.'
    )
  }


  /*
   * -------------------------------------------------------
   * 1. SUBSCRIPTIONS
   * -------------------------------------------------------
   */


  const {
    data:
      subscriptionData,

    error:
      subscriptionError
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id,
        user_id,
        package_id,
        status,
        billing_cycle,
        started_at,
        current_period_start,
        current_period_end,
        cancelled_at,
        expired_at,
        purchase_request_id,
        created_at,
        updated_at
      `)
      .eq(
        'user_id',
        userId
      )
      .order(
        'created_at',
        {
          ascending:
            false
        }
      )


  if (
    subscriptionError
  ) {

    throw new CommercialResolverError(
      'SUBSCRIPTIONS_LOAD_FAILED',
      subscriptionError.message
    )
  }


  const subscriptions =
    (
      subscriptionData ??
      []
    )
      .map(
        row =>
          normalizeSubscription(
            row as
              DatabaseSubscriptionRow
          )
      )


  const activeSubscription =
    subscriptions.find(
      subscription =>
        subscription.isActive
    ) ??
    null


  const historicalSubscriptions =
    subscriptions.filter(
      subscription =>
        !subscription.isActive
    )


  /*
   * -------------------------------------------------------
   * 2. USER-OWNED LISTINGS
   * -------------------------------------------------------
   *
   * Entitlements belong to listings.
   * Resolve the user's canonical listing cohort first.
   */


  const {
    data:
      listingData,

    error:
      listingError
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id
      `)
      .eq(
        'owner_id',
        userId
      )


  if (
    listingError
  ) {

    throw new CommercialResolverError(
      'LISTINGS_LOAD_FAILED',
      listingError.message
    )
  }


  const listingIds =
    (
      listingData ??
      []
    )
      .map(
        row =>
          (
            row as
              DatabaseOwnedListing
          ).id
      )
      .filter(
        Boolean
      )


  /*
   * -------------------------------------------------------
   * 3. CANONICAL ENTITLEMENTS
   * -------------------------------------------------------
   *
   * Lifecycle interpretation remains entirely owned by
   * listing-entitlements.ts.
   */


  const entitlementResolution =
    await resolveListingEntitlementsBatch({
      supabase,
      listingIds,
      includeInactive:
        true,
      now
    })


  const entitlements =
    Object
      .values(
        entitlementResolution
          .byListingId
      )
      .flatMap(
        resolution =>
          resolution.entitlements
      )
      .map(
        entitlement =>
          normalizeEntitlement({
            entitlement,
            now
          })
      )


  const activeEntitlements =
    entitlements.filter(
      entitlement =>
        entitlement
          .isCurrentlyActive
    )


  const scheduledEntitlements =
    entitlements.filter(
      entitlement =>
        entitlement
          .isScheduled
    )


  const historicalEntitlements =
    entitlements.filter(
      entitlement =>
        !entitlement
          .isCurrentlyActive &&
        !entitlement
          .isScheduled
    )


  const quantityByProduct =
    buildQuantityByProduct(
      entitlements
    )


  /*
   * -------------------------------------------------------
   * 4. PACKAGE LIMITS + USAGE
   * -------------------------------------------------------
   *
   * No active subscription means there is no active package
   * state to resolve.
   *
   * We intentionally do not call the package resolvers in
   * that case because they correctly fail when no active
   * subscription exists.
   */


  let limits:
    PackageLimits | null =
      null


  let usage:
    PackageUsage | null =
      null

  let activePackage:
  CommercialPackage | null =
    null

  if (
  activeSubscription
) {

  try {

    const [
      resolvedLimits,
      resolvedUsage,
      packageResult
    ] =
      await Promise.all([
        resolveUserPackageLimits({
          supabase,
          userId
        }),

        resolveUserPackageUsage({
          supabase,
          userId
        }),

        supabase
          .from(
            'packages'
          )
          .select(`
            id,
            slug,
            name_en,
            name_es,
            description_en,
            description_es,
            price_usd,
            price_crc,
            billing_interval,
            hierarchy_level,
            display_order
          `)
          .eq(
            'id',
            activeSubscription.packageId
          )
          .maybeSingle()
      ])


    limits =
      resolvedLimits

    usage =
      resolvedUsage


    if (
      packageResult.error
    ) {

      throw new Error(
        packageResult.error.message
      )
    }


    if (
      !packageResult.data
    ) {

      throw new Error(
        'The active commercial package could not be resolved.'
      )
    }


    const packageRecord =
      packageResult.data as
        DatabasePackageRow


    activePackage = {
      packageId:
        packageRecord.id,

      packageSlug:
        packageRecord.slug,

      nameEn:
        packageRecord.name_en,

      nameEs:
        packageRecord.name_es,

      descriptionEn:
        packageRecord.description_en,

      descriptionEs:
        packageRecord.description_es,

      priceUsd:
        packageRecord.price_usd,

      priceCrc:
        packageRecord.price_crc,

      billingInterval:
        packageRecord.billing_interval,

      hierarchyLevel:
        packageRecord.hierarchy_level,

      displayOrder:
        packageRecord.display_order
    }

  } catch (
    error
  ) {

    throw new CommercialResolverError(
      'COMMERCIAL_RESOLUTION_FAILED',

      error instanceof Error
        ? error.message
        : 'Package commercial state could not be resolved.'
    )
  }
}


  /*
   * -------------------------------------------------------
   * 5. CANONICAL FEATURED USAGE
   * -------------------------------------------------------
   *
   * package-usage.ts still contains the historical
   * placeholder featuredListingsUsed = 0.
   *
   * The Entitlement Engine now owns the real state.
   *
   * Commercial State therefore corrects that obsolete
   * projection without duplicating entitlement logic.
   */


  const featuredListingsUsed =
    quantityByProduct[
      'featured-listing'
    ]?.activeQuantity ??
    0


  if (
    usage
  ) {

    usage = {
      ...usage,

      featuredListingsUsed,

      featuredUsageStatus:
        'available'
    }
  }


  /*
   * -------------------------------------------------------
   * 6. REMAINING COMMERCIAL CAPACITY
   * -------------------------------------------------------
   */


  const remaining:
    CommercialRemainingCapacity | null =
      limits &&
      usage
        ? {
            listings: {
              used:
                usage.listingsUsed,

              limit:
                limits.listingLimit,

              remaining:
                nonNegativeRemaining(
                  usage.listingsUsed,
                  limits.listingLimit
                )
            },

            featuredListings: {
              used:
                featuredListingsUsed,

              limit:
                limits.featuredListingLimit,

              remaining:
                nonNegativeRemaining(
                  featuredListingsUsed,
                  limits.featuredListingLimit
                )
            },

            storage: {
              usedBytes:
                usage.storageUsedBytes,

              limitBytes:
                limits.storageLimitBytes,

              remainingBytes:
                nonNegativeRemaining(
                  usage.storageUsedBytes,
                  limits.storageLimitBytes
                )
            }
          }
        : null


  /*
   * -------------------------------------------------------
   * 7. CANONICAL COMMERCIAL STATE
   * -------------------------------------------------------
   */


  return {
    userId,

    resolvedAt:
      now.toISOString(),

    activePackage,

    subscriptions: {
      active:
        activeSubscription,

      all:
        subscriptions,

      historical:
        historicalSubscriptions
    },

    entitlements: {
      active:
        activeEntitlements,

      scheduled:
        scheduledEntitlements,

      historical:
        historicalEntitlements,

      all:
        entitlements,

      quantityByProduct
    },

    usage,

    limits,

    remaining
  }
}