import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest
) {
  try {
    const {
      phone,
      listingData
    } =
      await request.json()

    if (
      typeof phone !== 'string' ||
      !phone.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Phone required.'
        },
        {
          status: 400
        }
      )
    }

    if (
      !listingData ||
      typeof listingData !==
        'object' ||
      Array.isArray(listingData)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Listing data required.'
        },
        {
          status: 400
        }
      )
    }

    const token =
      crypto.randomUUID()

    const normalizedListingData = {
      ...listingData,

      /*
       * The temporary uploader will populate
       * these fields after the token exists.
       */
      images: [],
      temporary_images: []
    }

    const {
      error
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .insert({
          phone:
            phone.trim(),

          token,

          listing_data:
            normalizedListingData,

          verified:
            false
        })

    if (error) {
      console.error(
        'CREATE PUBLISH TOKEN ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The publishing session could not be created.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,
      token
    })
  } catch (error) {
    console.error(
      'CREATE PUBLISH TOKEN ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The publishing session could not be created.'
      },
      {
        status: 500
      }
    )
  }
}