import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

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

type ListingPublishTokenRow = {
  id: string
  token: string
  verified: boolean
  listing_data:
    Record<string, unknown> | null
}

function readTemporaryImages(
  listingData:
    Record<string, unknown>
): string[] {
  const value =
    listingData.temporary_images

  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (
      imagePath
    ): imagePath is string =>
      typeof imagePath ===
        'string' &&
      imagePath.startsWith(
        'temporary/'
      )
  )
}

export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData()

    const tokenValue =
      formData.get('token')

    const imageValue =
      formData.get('image')

    if (
      typeof tokenValue !==
        'string' ||
      !tokenValue.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Publish token required.'
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
            'Image file required.'
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

    const token =
      tokenValue.trim()

    const {
      data: tokenData,
      error: tokenError
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .select(`
          id,
          token,
          verified,
          listing_data
        `)
        .eq(
          'token',
          token
        )
        .single()

    if (
      tokenError ||
      !tokenData
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This publishing session does not exist.'
        },
        {
          status: 404
        }
      )
    }

    const publishToken =
      tokenData as
        ListingPublishTokenRow

    if (publishToken.verified) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This listing has already been published.'
        },
        {
          status: 409
        }
      )
    }

    const listingData =
      publishToken.listing_data &&
      typeof publishToken
        .listing_data === 'object'
        ? publishToken.listing_data
        : {}

    const temporaryImages =
      readTemporaryImages(
        listingData
      )

    if (
      temporaryImages.length >=
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

    const storagePath =
      `temporary/${token}/${crypto.randomUUID()}.jpg`

    const imageBytes =
      new Uint8Array(
        await imageValue.arrayBuffer()
      )

    const {
      error: uploadError
    } =
      await supabaseAdmin
        .storage
        .from(BUCKET_NAME)
        .upload(
          storagePath,
          imageBytes,
          {
            contentType:
              'image/jpeg',

            cacheControl:
              '3600',

            upsert:
              false
          }
        )

    if (uploadError) {
      console.error(
        'TEMPORARY IMAGE UPLOAD ERROR:',
        uploadError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The temporary image could not be uploaded.'
        },
        {
          status: 500
        }
      )
    }

    const updatedTemporaryImages =
      [
        ...temporaryImages,
        storagePath
      ]

    const {
      error: updateError
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .update({
          listing_data: {
            ...listingData,

            temporary_images:
              updatedTemporaryImages,

            images:
              updatedTemporaryImages
          }
        })
        .eq(
          'id',
          publishToken.id
        )

    if (updateError) {
      await supabaseAdmin
        .storage
        .from(BUCKET_NAME)
        .remove([
          storagePath
        ])

      console.error(
        'TEMPORARY IMAGE TOKEN UPDATE ERROR:',
        updateError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The publishing session could not be updated.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,
      path:
        storagePath,
      imageCount:
        updatedTemporaryImages.length
    })
  } catch (error) {
    console.error(
      'TEMPORARY LISTING IMAGE ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The image could not be processed.'
      },
      {
        status: 500
      }
    )
  }
}