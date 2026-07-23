import {
  NextRequest,
  NextResponse
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

import {
  assignListingOntology
} from '@/lib/assign-listing-ontology'

import {
  recordListingCreated,
  recordListingPublished
} from '@/lib/activity'

function generateFallbackTitle(
  data: any
) {
  const environment =
    data.environment || ''

  const propertyType =
    data.property_type || 'property'

  const district =
    data.district || ''

  const canton =
    data.canton || ''

  return `${environment} ${propertyType} in ${district} ${canton}`.trim()
}

function generateFallbackDescription(
  data: any
) {
  return `This property is located in ${
    data.district ||
    data.canton ||
    data.province ||
    'Costa Rica'
  }.`
}

export async function POST(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get('authorization')

    const accessToken =
      authorization?.startsWith('Bearer ')
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
        .getUser(accessToken)

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

    const {
      token
    } = await request.json()

    if (!token) {
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

    const {
      data: tokenData,
      error: tokenError
    } = await supabase
      .from('listing_publish_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (
      tokenError ||
      !tokenData
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This publish link is invalid or expired.'
        },
        {
          status: 404
        }
      )
    }

    if (tokenData.verified) {
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

    const propertyData =
      tokenData.listing_data || {}

    const transactionType =
      propertyData.transaction_type ===
      'rent'
        ? 'rent'
        : 'buy'

    const {
      data: listingData,
      error: listingError
    } = await authenticatedSupabase
      .from('listings')
      .insert([
        {
          owner_id:
            user.id,

          province:
            propertyData.province,

          canton:
            propertyData.canton,

          district:
            propertyData.district,

          property_type:
            propertyData.property_type ||
            '',

          bedrooms:
            propertyData.bedrooms,

          bathrooms:
            propertyData.bathrooms,

          parking:
            propertyData.parking,

          year_built_range:
            propertyData
              .year_built_range,

          construction_area:
            propertyData
              .construction_area,

          utility:
            propertyData.utility || [],

          property_area:
            propertyData.property_area,

          environment:
            propertyData.environment,

          accessibility:
            propertyData.accessibility,

          terrain:
            propertyData.terrain || [],

          legal_status:
            propertyData.legal_status,

          price_millions:
            propertyData
              .priceMillions ??
            propertyData
              .price_millions ??
            null,

          monthly_price:
            propertyData.monthly_price
              ? Number(
                  String(
                    propertyData
                      .monthly_price
                  ).replace(
                    /[^\d]/g,
                    ''
                  )
                )
              : null,

          transaction_type:
            transactionType,

          listing_status:
            propertyData
              .listing_status ||
            'active',

          currency:
            propertyData.currency ||
            'CRC',

          whatsapp:
            tokenData.phone,

          title:
            propertyData.title ||
            generateFallbackTitle(
              propertyData
            ),

          description:
            propertyData.description ||
            generateFallbackDescription(
              propertyData
            ),

          images:
            propertyData.images || []
        }
      ])
      .select()
      .single()

    if (
      listingError ||
      !listingData
    ) {
      console.error(
        'LISTING INSERT ERROR:',
        listingError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Your listing could not be published.'
        },
        {
          status: 500
        }
      )
    }

    try {
      await assignListingOntology(
        listingData.id,
        {
          ...propertyData,
          price_millions:
            propertyData
              .priceMillions ??
            propertyData
              .price_millions
        }
      )
    } catch (ontologyError) {
      console.error(
        'ONTOLOGY ERROR:',
        ontologyError
      )
    }

    try {
      const metadata = {
        title:
          listingData.title,

        province:
          listingData.province,

        canton:
          listingData.canton,

        district:
          listingData.district,

        propertyType:
          listingData.property_type,

        transactionType:
          listingData
            .transaction_type,

        status:
          listingData
            .listing_status,

        source:
          'authenticated-publish'
      }

      await recordListingCreated({
        listingId:
          listingData.id,
        metadata
      })

      await recordListingPublished({
        listingId:
          listingData.id,
        metadata
      })
    } catch (activityError) {
      console.error(
        'ACTIVITY ERROR:',
        activityError
      )
    }

    const {
      error: tokenUpdateError
    } = await supabase
      .from('listing_publish_tokens')
      .update({
        verified: true
      })
      .eq('token', token)

    if (tokenUpdateError) {
      console.error(
        'TOKEN UPDATE ERROR:',
        tokenUpdateError
      )
    }

    const redirectTo =
      transactionType === 'rent'
        ? `/en/rent-lease/listing/${listingData.id}`
        : `/en/buy/listing/${listingData.id}`

    return NextResponse.json({
      success: true,
      redirectTo
    })
  } catch (error) {
    console.error(
      'PUBLISH ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Something went wrong while publishing your listing.'
      },
      {
        status: 500
      }
    )
  }
}