import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveUserPackageLimits
} from '@/lib/package-limits'

const STORAGE_BUCKET =
  'listings-images'

const STORAGE_PAGE_SIZE =
  100

const RECENT_ACTIVITY_WINDOW_DAYS =
  30

type StorageListItem = {
  id?: string | null
  name: string
  metadata?: {
    size?: number | string | null
  } | null
}

export type FeaturedUsageStatus =
  | 'available'
  | 'not_configured'

export type PackageUsage = {
  packageId: string
  packageSlug: string

  listingsUsed: number
  listingLimit: number | null

  featuredListingsUsed: number
  featuredListingLimit: number | null
  featuredUsageStatus:
    FeaturedUsageStatus

  storageUsedBytes: number
  storageLimitMb: number | null
  storageLimitBytes: number | null

  savedAnalysesUsed: number
  savedSearchesUsed: number

  recentActivityCount: number
  recentActivityWindowDays: number
}

export class PackageUsageError
  extends Error {
    code:
  | 'LISTING_USAGE_LOAD_FAILED'
  | 'STORAGE_USAGE_LOAD_FAILED'
  | 'SAVED_ANALYSES_USAGE_LOAD_FAILED'
  | 'SAVED_SEARCHES_USAGE_LOAD_FAILED'
  | 'ACTIVITY_USAGE_LOAD_FAILED'

  constructor(
    code: PackageUsageError['code'],
    message: string
  ) {
    super(message)

    this.name =
      'PackageUsageError'

    this.code =
      code
  }
}

function readStorageObjectSize(
  item: StorageListItem
): number {
  const rawSize =
    item.metadata?.size

  if (
    rawSize === null ||
    rawSize === undefined
  ) {
    return 0
  }

  const parsedSize =
    Number(rawSize)

  return Number.isFinite(
    parsedSize
  )
    ? Math.max(
        0,
        parsedSize
      )
    : 0
}

async function calculateStorageFolderSize({
  supabase,
  folderPath
}: {
  supabase: SupabaseClient
  folderPath: string
}): Promise<number> {
  let totalBytes = 0
  let offset = 0

  while (true) {
    const {
      data,
      error
    } =
      await supabase
        .storage
        .from(
          STORAGE_BUCKET
        )
        .list(
          folderPath,
          {
            limit:
              STORAGE_PAGE_SIZE,

            offset,

            sortBy: {
              column:
                'name',

              order:
                'asc'
            }
          }
        )

    if (error) {
      throw new PackageUsageError(
        'STORAGE_USAGE_LOAD_FAILED',
        error.message
      )
    }

    const items =
      (
        data ?? []
      ) as StorageListItem[]

    for (const item of items) {
      /*
       * Supabase folder entries have null metadata
       * and null file identifiers. Files have metadata,
       * including their stored byte size.
       */
      const isFolder =
        item.metadata === null ||
        item.id === null

      if (isFolder) {
        const nestedPath =
          folderPath
            ? `${folderPath}/${item.name}`
            : item.name

        totalBytes +=
          await calculateStorageFolderSize({
            supabase,
            folderPath:
              nestedPath
          })

        continue
      }

      totalBytes +=
        readStorageObjectSize(
          item
        )
    }

    if (
      items.length <
      STORAGE_PAGE_SIZE
    ) {
      break
    }

    offset +=
      items.length
  }

  return totalBytes
}

async function countUserRows({
  supabase,
  table,
  userId,
  errorCode
}: {
  supabase: SupabaseClient
  table:
    | 'saved_analyses'
    | 'saved_searches'
  userId: string
  errorCode:
    | 'SAVED_ANALYSES_USAGE_LOAD_FAILED'
    | 'SAVED_SEARCHES_USAGE_LOAD_FAILED'
}): Promise<number> {
  const {
    count,
    error
  } =
    await supabase
      .from(
        table
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true
        }
      )
      .eq(
        'user_id',
        userId
      )

  if (error) {
    throw new PackageUsageError(
      errorCode,
      error.message
    )
  }

  return count ?? 0
}

async function calculateActiveListingsUsed({
  supabase,
  userId
}: {
  supabase: SupabaseClient
  userId: string
}): Promise<number> {
  const {
    count,
    error
  } =
    await supabase
      .from(
        'listings'
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true
        }
      )
      .eq(
        'owner_id',
        userId
      )
      .eq(
        'listing_status',
        'active'
      )
      .is(
        'deleted_at',
        null
      )

  if (error) {
    throw new PackageUsageError(
      'LISTING_USAGE_LOAD_FAILED',
      error.message
    )
  }

  return count ?? 0
}

export async function resolveUserPackageUsage({
  supabase,
  userId
}: {
  supabase: SupabaseClient
  userId: string
}): Promise<PackageUsage> {
  const limits =
    await resolveUserPackageLimits({
      supabase,
      userId
    })

  const [
  listingsUsed,
  storageUsedBytes,
  savedAnalysesUsed,
  savedSearchesUsed,
  recentActivityCount
] =
  await Promise.all([
    calculateActiveListingsUsed({
      supabase,
      userId
    }),

    calculateStorageFolderSize({
      supabase,
      folderPath:
        userId
    }),

    countUserRows({
      supabase,
      table:
        'saved_analyses',
      userId,
      errorCode:
        'SAVED_ANALYSES_USAGE_LOAD_FAILED'
    }),

    countUserRows({
      supabase,
      table:
        'saved_searches',
      userId,
      errorCode:
        'SAVED_SEARCHES_USAGE_LOAD_FAILED'
    }),

    calculateRecentActivityCount({
      supabase,
      userId
    })
  ])

  return {
    packageId:
      limits.packageId,

    packageSlug:
      limits.packageSlug,

    listingsUsed,

    listingLimit:
      limits.listingLimit,

    /*
      * The canonical listing_entitlements architecture now
      * exists. Featured usage remains unavailable until
      * entitlement activation and package-credit assignment
      * are implemented later in Phase 3.
      */
    featuredListingsUsed:
      0,

    featuredListingLimit:
      limits.featuredListingLimit,

    featuredUsageStatus:
      'not_configured',

    storageUsedBytes,

    storageLimitMb:
      limits.storageLimitMb,

    storageLimitBytes:
      limits.storageLimitBytes,

    savedAnalysesUsed,

    savedSearchesUsed,

    recentActivityCount,

    recentActivityWindowDays:
      RECENT_ACTIVITY_WINDOW_DAYS
  }
}

async function calculateRecentActivityCount({
  supabase,
  userId
}: {
  supabase: SupabaseClient
  userId: string
}): Promise<number> {
  const activityWindowStart =
    new Date(
      Date.now() -
      (
        RECENT_ACTIVITY_WINDOW_DAYS *
        24 *
        60 *
        60 *
        1000
      )
    ).toISOString()

  const {
    count,
    error
  } =
    await supabase
      .from(
        'activity_events'
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true
        }
      )
      .eq(
        'user_id',
        userId
      )
      .gte(
        'created_at',
        activityWindowStart
      )

  if (error) {
    throw new PackageUsageError(
      'ACTIVITY_USAGE_LOAD_FAILED',
      error.message
    )
  }

  return count ?? 0
}