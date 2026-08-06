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
  package_limits:
    PackageLimitRecord[]
}

type ActiveSubscriptionRow = {
  id: string
  package_id: string
  package:
    PackageRecord[]
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
    data,
    error
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id,
        package_id,

        package:packages (
          id,
          slug,

          package_limits (
            listing_limit,
            featured_listing_limit,
            storage_limit_mb
          )
        )
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

  if (error) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_LOAD_FAILED',
      error.message
    )
  }

  if (
    !data ||
    !data.package ||
    data.package.length === 0
  ) {
    throw new PackageLimitsError(
      'NO_ACTIVE_SUBSCRIPTION',
      'No active subscription was found.'
    )
  }

  const subscription =
    data as ActiveSubscriptionRow

  const packageRecord =
    subscription.package[0]

  const limitRecord =
    packageRecord
      .package_limits?.[0]

  if (!limitRecord) {
    throw new PackageLimitsError(
      'PACKAGE_LIMITS_NOT_FOUND',
      'No limits were configured for the active package.'
    )
  }

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