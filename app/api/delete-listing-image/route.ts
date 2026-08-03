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

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

const BUCKET_NAME =
  'listings-images'

type ListingRow = {
  id: string
  owner_id: string | null
  images: unknown
  deleted_at: string | null
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
  imageValue: string,
  userId: string,
  listingId: string
): boolean {
  return imageValue.startsWith(
    `${userId}/${listingId}/`
  )
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

    const imageValue =
      typeof requestBody
        .imageValue === 'string'
        ? requestBody
            .imageValue
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

    if (!imageValue) {
      return NextResponse.json(
        {
          success: false,
          error:
            'An image value is required.'
        },
        {
          status: 400
        }
      )
    }

    /*
     * Load the listing.
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
          images,
          deleted_at
        `)
        .eq(
          'id',
          listingId
        )
        .maybeSingle()

    if (listingError) {
      console.error(
        'DELETE IMAGE LISTING LOAD ERROR:',
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

    /*
     * Verify ownership.
     */
    if (
      !listing.owner_id ||
      listing.owner_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You are not authorized to edit this listing.'
        },
        {
          status: 403
        }
      )
    }

    if (listing.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Images cannot be removed from a deleted listing.'
        },
        {
          status: 409
        }
      )
    }

    const existingImages =
      normalizeStoredImages(
        listing.images
      )

    const imageIndex =
      existingImages.indexOf(
        imageValue
      )

    if (imageIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The image is not attached to this listing.'
        },
        {
          status: 404
        }
      )
    }

    const updatedImages =
      existingImages.filter(
        (
          _,
          index
        ) =>
          index !== imageIndex
      )

    /*
     * Remove the image from the database first.
     */
    const {
      data: updatedListing,
      error: updateError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .update({
          images:
            updatedImages,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          'id',
          listing.id
        )
        .eq(
          'owner_id',
          user.id
        )
        .is(
          'deleted_at',
          null
        )
        .select(`
          id,
          images
        `)
        .maybeSingle()

    if (
      updateError ||
      !updatedListing
    ) {
      console.error(
        'DELETE IMAGE DATABASE ERROR:',
        updateError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The image could not be removed from the listing.'
        },
        {
          status: 500
        }
      )
    }

    /*
     * External scraped URLs are removed only from
     * listings.images. Twuanis never deletes the
     * remote source image.
     */
    if (
      !isExternalUrl(
        imageValue
      )
    ) {
      if (
        !isOwnedStoragePath(
          imageValue,
          user.id,
          listing.id
        )
      ) {
        /*
         * Roll the database back because the supplied
         * Storage path is not owned by this listing.
         */
        const {
          error: rollbackError
        } =
          await supabaseAdmin
            .from(
              'listings'
            )
            .update({
              images:
                existingImages
            })
            .eq(
              'id',
              listing.id
            )
            .eq(
              'owner_id',
              user.id
            )

        if (rollbackError) {
          console.error(
            'DELETE IMAGE OWNERSHIP ROLLBACK ERROR:',
            rollbackError
          )
        }

        return NextResponse.json(
          {
            success: false,
            error:
              'The image Storage path does not belong to this listing.'
          },
          {
            status: 403
          }
        )
      }

      const {
        error: storageDeleteError
      } =
        await supabaseAdmin
          .storage
          .from(
            BUCKET_NAME
          )
          .remove([
            imageValue
          ])

      if (storageDeleteError) {
        console.error(
          'DELETE IMAGE STORAGE ERROR:',
          storageDeleteError
        )

        /*
         * Restore the original image array because
         * Storage deletion did not succeed.
         */
        const {
          error: rollbackError
        } =
          await supabaseAdmin
            .from(
              'listings'
            )
            .update({
              images:
                existingImages
            })
            .eq(
              'id',
              listing.id
            )
            .eq(
              'owner_id',
              user.id
            )

        if (rollbackError) {
          console.error(
            'DELETE IMAGE DATABASE ROLLBACK ERROR:',
            rollbackError
          )
        }

        return NextResponse.json(
          {
            success: false,
            error:
              'The image could not be deleted from Storage.'
          },
          {
            status: 500
          }
        )
      }
    }

    return NextResponse.json({
      success: true,

      deletedImage:
        imageValue,

      deletedStorageObject:
        !isExternalUrl(
          imageValue
        ),

      images:
        normalizeStoredImages(
          updatedListing.images
        ),

      imageCount:
        updatedImages.length
    })
  } catch (error) {
    console.error(
      'DELETE LISTING IMAGE ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing image could not be deleted.'
      },
      {
        status: 500
      }
    )
  }
}