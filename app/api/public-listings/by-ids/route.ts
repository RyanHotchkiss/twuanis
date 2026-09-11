import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  getPublicListingsByIds
} from '@/lib/public-listings-server'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

import {
  projectPublicListingMonetaryValues
} from '@/lib/public-listing-monetary-projection'

const MAX_LISTING_IDS = 100

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json()

    const listingIds =
      Array.isArray(
        body?.listingIds
      )
        ? body.listingIds.filter(
            (
              value: unknown
            ): value is string =>
              typeof value ===
                'string' &&
              /^[0-9a-fA-F-]{36}$/.test(
                value
              )
          )
        : []

    const uniqueListingIds: string[] =
      [...new Set<string>(
        listingIds
      )]

    if (
      uniqueListingIds.length === 0
    ) {
      return NextResponse.json({
        listings: []
      })
    }

    if (
      uniqueListingIds.length >
      MAX_LISTING_IDS
    ) {
      return NextResponse.json(
        {
          error:
            'Too many listing IDs.'
        },
        {
          status: 400
        }
      )
    }

        const analyticalContext =
      await resolveMarketAnalyticalContext()

    const listings =
      await getPublicListingsByIds(
        uniqueListingIds
      )

    const projectedListings =
      projectPublicListingMonetaryValues(
        listings,
        analyticalContext
      )

    return NextResponse.json({
      listings:
        projectedListings
    })
  } catch (error) {
    console.error(
      'PUBLIC LISTINGS BY IDS ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to load listings.'
      },
      {
        status: 500
      }
    )
  }
}
