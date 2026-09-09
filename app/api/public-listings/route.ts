import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  getPublicListings,
  type PublicListingTransaction
} from '@/lib/public-listings-server'

const ALLOWED_TRANSACTIONS =
  new Set<PublicListingTransaction>([
    'sale',
    'rent'
  ])

export async function GET(
  request: NextRequest
) {
  const transaction =
    request.nextUrl.searchParams.get(
      'transaction'
    )

  if (
    transaction &&
    !ALLOWED_TRANSACTIONS.has(
      transaction as PublicListingTransaction
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid transaction type'
      },
      {
        status: 400
      }
    )
  }

  try {
    const listings =
      await getPublicListings(
        transaction
          ? transaction as PublicListingTransaction
          : undefined
      )

    return NextResponse.json(
      {
        listings
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )
  } catch (error) {
    console.error(
      'Public listings request failed',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to load listings'
      },
      {
        status: 500
      }
    )
  }
}