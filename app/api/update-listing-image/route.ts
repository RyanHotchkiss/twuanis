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

const MAX_IMAGE_COUNT =
  25

const MAX_OPTIMIZED_IMAGE_BYTES =
  600 * 1024

const SUPPORTED_IMAGE_TYPES =
  new Set([
    'image/jpeg'
  ])

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

function isJpeg(
  bytes: Uint8Array
): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
}

export async function POST(
  request: NextRequest
) {
  let uploadedStoragePath:
    string | null = null

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
     * Read and validate the request.
     */
    const formData =
      await request.formData()

    const listingIdValue =
      formData.get(
        'listingId'
      )

    const imageValue =
      formData.get(
        'image'
      )

    if (
      typeof listingIdValue !==
        'string' ||
      !listingIdValue.trim()
    ) {
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

    if (
      !(imageValue instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'An image file is required.'
        },
        {
          status: 400
        }
      )
    }

    if (
      !SUPPORTED_IMAGE_TYPES.has(
        imageValue.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Only optimized JPEG images are accepted.'
        },
        {
          status: 415
        }
      )
    }

    if (
      imageValue.size <= 0 ||
      imageValue.size >
        MAX_OPTIMIZED_IMAGE_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The optimized image must not exceed 600 KB.'
        },
        {
          status: 413
        }
      )
    }

    const listingId =
      listingIdValue.trim()

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
        'EDIT IMAGE LISTING LOAD ERROR:',
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
            'Images cannot be added to a deleted listing.'
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

    if (
      existingImages.length >=
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
     * Validate the actual file contents.
     */
    const imageBytes =
      new Uint8Array(
        await imageValue
          .arrayBuffer()
      )

    if (!isJpeg(imageBytes)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The uploaded file is not a valid JPEG image.'
        },
        {
          status: 415
        }
      )
    }

    /*
     * Upload directly to the permanent,
     * ownership-aware listing folder.
     */
    uploadedStoragePath =
      `${user.id}/${listing.id}/${crypto.randomUUID()}.jpg`

    const {
      error: uploadError
    } =
      await supabaseAdmin
        .storage
        .from(
          BUCKET_NAME
        )
        .upload(
          uploadedStoragePath,
          imageBytes,
          {
            contentType:
              'image/jpeg',

            cacheControl:
              '31536000',

            upsert:
              false
          }
        )

    if (uploadError) {
      console.error(
        'EDIT LISTING IMAGE UPLOAD ERROR:',
        uploadError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The listing image could not be uploaded.'
        },
        {
          status: 500
        }
      )
    }

    const updatedImages = [
      ...existingImages,
      uploadedStoragePath
    ]

    /*
     * Attach the Storage path to the listing.
     * Do not store its public URL.
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
      await supabaseAdmin
        .storage
        .from(
          BUCKET_NAME
        )
        .remove([
          uploadedStoragePath
        ])

      uploadedStoragePath =
        null

      console.error(
        'EDIT LISTING IMAGE DATABASE ERROR:',
        updateError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The listing image could not be attached to the listing.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,

      path:
        uploadedStoragePath,

      images:
        normalizeStoredImages(
          updatedListing.images
        ),

      imageCount:
        updatedImages.length
    })
  } catch (error) {
    console.error(
      'UPDATE LISTING IMAGE ROUTE ERROR:',
      error
    )

    /*
     * Remove an uploaded object if an unexpected
     * failure occurs before successful completion.
     */
    if (uploadedStoragePath) {
      await supabaseAdmin
        .storage
        .from(
          BUCKET_NAME
        )
        .remove([
          uploadedStoragePath
        ])
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing image could not be processed.'
      },
      {
        status: 500
      }
    )
  }
}