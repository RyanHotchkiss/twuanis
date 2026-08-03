import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  createClient
} from '@supabase/supabase-js'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  recordListingPermanentlyDeleted
} from '@/lib/activity/listings'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

const BUCKET_NAME =
  'listings-images'

const STORAGE_LIST_LIMIT =
  100

type ListingRow = {
  id: string
  owner_id: string | null
  title: string | null
  transaction_type: string | null
  listing_status: string | null
  images: unknown
}

function normalizeStoredImages(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map(image =>
        String(image).trim()
      )
      .filter(Boolean)
  }

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return []
  }

  const trimmedValue =
    value.trim()

  try {
    const parsed =
      JSON.parse(trimmedValue)

    if (Array.isArray(parsed)) {
      return parsed
        .map(image =>
          String(image).trim()
        )
        .filter(Boolean)
    }

    if (
      typeof parsed === 'string' &&
      parsed.trim()
    ) {
      return [
        parsed.trim()
      ]
    }
  } catch {
    // Continue to legacy delimiter parsing.
  }

  return trimmedValue
    .split('|')
    .map(image =>
      image.trim()
    )
    .filter(Boolean)
}

function isExternalUrl(
  value: string
): boolean {
  return (
    value.startsWith(
      'https://'
    ) ||
    value.startsWith(
      'http://'
    )
  )
}

function isOwnedStoragePath(
  value: string,
  userId: string,
  listingId: string
): boolean {
  return value.startsWith(
    `${userId}/${listingId}/`
  )
}

async function listListingStoragePaths(
  userId: string,
  listingId: string
): Promise<string[]> {
  const folderPath =
    `${userId}/${listingId}`

  const storagePaths:
    string[] = []

  let offset = 0

  while (true) {
    const {
      data,
      error
    } =
      await supabaseAdmin
        .storage
        .from(
          BUCKET_NAME
        )
        .list(
          folderPath,
          {
            limit:
              STORAGE_LIST_LIMIT,

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
      throw new Error(
        `Storage folder could not be inspected: ${error.message}`
      )
    }

    const files =
      (
        data ?? []
      )
        .filter(item =>
          Boolean(
            item.name
          )
        )
        .map(item =>
          `${folderPath}/${item.name}`
        )

    storagePaths.push(
      ...files
    )

    if (
      files.length <
      STORAGE_LIST_LIMIT
    ) {
      break
    }

    offset +=
      STORAGE_LIST_LIMIT
  }

  return storagePaths
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * Verify the authenticated user.
     */
    const authorization =
      request.headers.get(
        'authorization'
      )

    const accessToken =
      authorization?.startsWith(
        'Bearer '
      )
        ? authorization.slice(7)
        : null

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Authentication required.'
        },
        {
          status: 401
        }
      )
    }

    const authenticatedSupabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,

        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,

        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        }
      )

    const {
      data: {
        user
      },
      error: userError
    } =
      await authenticatedSupabase
        .auth
        .getUser(
          accessToken
        )

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your session could not be verified.'
        },
        {
          status: 401
        }
      )
    }

    /*
     * Read the request.
     */
    const requestBody =
      await request.json()

    const listingId =
      typeof requestBody
        .listingId === 'string'
        ? requestBody
            .listingId
            .trim()
        : ''

    if (!listingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A listing ID is required.'
        },
        {
          status: 400
        }
      )
    }

    /*
     * Load the listing and verify ownership.
     */
    const {
      data: listingData,
      error: listingError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .select(`
          id,
          owner_id,
          title,
          transaction_type,
          listing_status,
          images
        `)
        .eq(
          'id',
          listingId
        )
        .maybeSingle()

    if (listingError) {
      console.error(
        'PERMANENT DELETE LISTING LOAD ERROR:',
        listingError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The listing could not be loaded.'
        },
        {
          status: 500
        }
      )
    }

    if (!listingData) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The listing does not exist.'
        },
        {
          status: 404
        }
      )
    }

    const listing =
      listingData as ListingRow

    if (
      !listing.owner_id ||
      listing.owner_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You are not authorized to permanently delete this listing.'
        },
        {
          status: 403
        }
      )
    }

    /*
     * Find every customer-owned Storage object.
     *
     * Canonical listing images are included, and the
     * folder is inspected so orphaned objects are also
     * removed.
     *
     * External scraped URLs are never sent to Storage.
     */
    const storedImages =
      normalizeStoredImages(
        listing.images
      )

    const canonicalOwnedPaths =
      storedImages.filter(
        image =>
          !isExternalUrl(
            image
          ) &&
          isOwnedStoragePath(
            image,
            user.id,
            listing.id
          )
      )

    const folderStoragePaths =
      await listListingStoragePaths(
        user.id,
        listing.id
      )

    const ownedStoragePaths =
      Array.from(
        new Set([
          ...canonicalOwnedPaths,
          ...folderStoragePaths
        ])
      )

    /*
     * Remove owned Storage objects first.
     *
     * If Storage deletion fails, the database record
     * remains intact and the user can safely retry.
     */
    if (
      ownedStoragePaths.length >
      0
    ) {
      const {
        error: storageDeleteError
      } =
        await supabaseAdmin
          .storage
          .from(
            BUCKET_NAME
          )
          .remove(
            ownedStoragePaths
          )

      if (storageDeleteError) {
        console.error(
          'PERMANENT DELETE STORAGE ERROR:',
          storageDeleteError
        )

        return NextResponse.json(
          {
            success: false,
            error:
              'The listing images could not be permanently deleted. The listing was preserved.'
          },
          {
            status: 500
          }
        )
      }
    }

    /*
     * Delete the listing row.
     *
     * Related rows are removed automatically through:
     * - favorite_collection_items
     * - listing_events
     * - listing_favorites
     * - listings_ontology_terms
     * - property_notes
     * - saved_search_alert_deliveries
     *
     * All six foreign keys use ON DELETE CASCADE.
     */
    const {
      data: deletedListing,
      error: deleteError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .delete()
        .eq(
          'id',
          listing.id
        )
        .eq(
          'owner_id',
          user.id
        )
        .select(`
          id
        `)
        .maybeSingle()

    if (
      deleteError ||
      !deletedListing
    ) {
      console.error(
        'PERMANENT DELETE DATABASE ERROR:',
        deleteError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The Storage objects were removed, but the listing record could not be deleted. Administrative cleanup is required.'
        },
        {
          status: 500
        }
      )
    }

    /*
     * Record the lifecycle event after deletion.
     *
     * Activity failure must not recreate or invalidate
     * an otherwise successful permanent deletion.
     */
    try {
      await recordListingPermanentlyDeleted({
        listingId:
          listing.id,

        metadata: {
          title:
            listing.title ??
            undefined,

          transactionType:
            listing.transaction_type,

          previousStatus:
            listing.listing_status,

          deletionType:
            'permanent-delete',

          deletedStorageObjectCount:
            ownedStoragePaths.length,

          source:
            'market-hub'
        }
      })
    } catch (activityError) {
      console.error(
        'PERMANENT DELETE ACTIVITY ERROR:',
        activityError
      )
    }

    return NextResponse.json({
      success: true,

      listingId:
        listing.id,

      deletedStorageObjectCount:
        ownedStoragePaths.length
    })
  } catch (error) {
    console.error(
      'PERMANENT DELETE LISTING ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing could not be permanently deleted.'
      },
      {
        status: 500
      }
    )
  }
}