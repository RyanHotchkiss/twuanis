import type {
  SupabaseClient
} from '@supabase/supabase-js'

const BYTES_PER_MEGABYTE =
  1024 * 1024

export type PackageLimits = {
  packageId: string
  packageSlug: string

  listingLimit:
    number | null

  featuredListingLimit:
    number | null

  storageLimitMb:
    number | null

  storageLimitBytes:
    number | null
}

type PackageLimitRecord = {
  listing_limit: number | null
  featured_listing_limit: number | null
  storage_limit_mb: number | null
}

type PackageRecord = {
  id: string
  slug: string
}

type ActiveSubscriptionRow = {
  id: string
  package_id: string
}

export class PackageLimitsError
  extends Error {
  code:
    | 'NO_ACTIVE_SUBSCRIPTION'
    | 'PACKAGE_LIMITS_NOT_FOUND'
    | 'PACKAGE_LIMITS_LOAD_FAILED'

  constructor(
    code:
      PackageLimitsError['code'],
    message: string
  ) {
    super(message)

    this.name =
      'PackageLimitsError'

    this.code =
      code
  }
}

export async function resolveUserPackageLimits({
  supabase,
  userId
}: {
  supabase: SupabaseClient
  userId: string
}): Promise<PackageLimits> {
  if (!userId) {
    throw new PackageLimitsError(
      'NO_ACTIVE_SUBSCRIPTION',
      'A user ID is required to resolve package limits.'
    )
  }

    const {
    data: subscriptionData,
    error: subscriptionError
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id,
        package_id
      `)
      .eq(
        'user_id',
        userId
      )
      .eq(
        'status',
        'active'
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

  if (subscriptionError) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_LOAD_FAILED',
      subscriptionError.message
    )
  }

  if (!subscriptionData) {
    throw new PackageLimitsError(
      'NO_ACTIVE_SUBSCRIPTION',
      'No active subscription was found.'
    )
  }

  const subscription =
    subscriptionData as
      ActiveSubscriptionRow

  if (!subscription.package_id) {
    throw new PackageLimitsError(
      'NO_ACTIVE_SUBSCRIPTION',
      'The active subscription does not identify a package.'
    )
  }

  const {
    data: packageData,
    error: packageError
  } =
    await supabase
      .from(
        'packages'
      )
      .select(`
        id,
        slug
      `)
      .eq(
        'id',
        subscription.package_id
      )
      .maybeSingle()

  if (packageError) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_LOAD_FAILED',
      packageError.message
    )
  }

  if (!packageData) {
    throw new PackageLimitsError(
      'NO_ACTIVE_SUBSCRIPTION',
      'The active subscription package could not be resolved.'
    )
  }

  const packageRecord =
    packageData as
      PackageRecord

  const {
    data: limitsData,
    error: limitsError
  } =
    await supabase
      .from(
        'package_limits'
      )
      .select(`
        listing_limit,
        featured_listing_limit,
        storage_limit_mb
      `)
      .eq(
        'package_id',
        packageRecord.id
      )
      .maybeSingle()

  if (limitsError) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_LOAD_FAILED',
      limitsError.message
    )
  }

  if (!limitsData) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_NOT_FOUND',
      'No limits were configured for the active package.'
    )
  }

  const limitRecord =
    limitsData as
      PackageLimitRecord

  const storageLimitMb =
    limitRecord.storage_limit_mb

  return {
    packageId:
      packageRecord.id,

    packageSlug:
      packageRecord.slug,

    listingLimit:
      limitRecord.listing_limit,

    featuredListingLimit:
      limitRecord
        .featured_listing_limit,

    storageLimitMb,

    storageLimitBytes:
      storageLimitMb === null
        ? null
        : storageLimitMb *
          BYTES_PER_MEGABYTE
  }
}

export function hasReachedLimit(
  used: number,
  limit: number | null
): boolean {
  return (
    limit !== null &&
    used >= limit
  )
}

export function wouldExceedLimit(
  used: number,
  additional: number,
  limit: number | null
): boolean {
  return (
    limit !== null &&
    used + additional >
      limit
  )
}