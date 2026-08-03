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

const MAX_IMAGE_COUNT =
  25

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

function createImageCounts(
  images: string[]
): Map<string, number> {
  const counts =
    new Map<string, number>()

  for (const image of images) {
    counts.set(
      image,
      (
        counts.get(image) ??
        0
      ) + 1
    )
  }

  return counts
}

function containsSameImages(
  existingImages: string[],
  reorderedImages: string[]
): boolean {
  if (
    existingImages.length !==
    reorderedImages.length
  ) {
    return false
  }

  const existingCounts =
    createImageCounts(
      existingImages
    )

  const reorderedCounts =
    createImageCounts(
      reorderedImages
    )

  if (
    existingCounts.size !==
    reorderedCounts.size
  ) {
    return false
  }

  for (
    const [
      image,
      count
    ]
    of existingCounts
  ) {
    if (
      reorderedCounts.get(image) !==
      count
    ) {
      return false
    }
  }

  return true
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
     * Read the requested image order.
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

    const reorderedImages =
      Array.isArray(
        requestBody.images
      )
        ? requestBody.images
            .map(
              (
                image: unknown
              ) =>
                typeof image ===
                  'string'
                  ? image.trim()
                  : ''
            )
            .filter(Boolean)
        : null

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

    if (!reorderedImages) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A reordered image array is required.'
        },
        {
          status: 400
        }
      )
    }

    if (
      reorderedImages.length >
      MAX_IMAGE_COUNT
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `A listing may contain no more than ${MAX_IMAGE_COUNT} images.`
        },
        {
          status: 409
        }
      )
    }

    /*
     * Load the current listing state.
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
        'REORDER IMAGES LISTING LOAD ERROR:',
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
     * Verify ownership and lifecycle state.
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
            'Images cannot be reordered on a deleted listing.'
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

    /*
     * The submitted array must contain exactly
     * the same values and duplicate counts.
     *
     * This prevents:
     * - injected URLs
     * - foreign Storage paths
     * - omitted images
     * - duplicated images
     * - accidental deletion
     */
    if (
      !containsSameImages(
        existingImages,
        reorderedImages
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The reordered image list must contain exactly the images currently attached to this listing.'
        },
        {
          status: 409
        }
      )
    }

    /*
     * Updating the array changes only display order.
     * Storage objects and external URLs remain untouched.
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
            reorderedImages,

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
        'REORDER IMAGES DATABASE ERROR:',
        updateError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The listing images could not be reordered.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,

      images:
        normalizeStoredImages(
          updatedListing.images
        ),

      imageCount:
        reorderedImages.length
    })
  } catch (error) {
    console.error(
      'REORDER LISTING IMAGES ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing images could not be reordered.'
      },
      {
        status: 500
      }
    )
  }
}