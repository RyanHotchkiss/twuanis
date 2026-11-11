import { NextRequest, NextResponse } from 'next/server'

import {
  getPublicListingContact
} from '@/lib/public-listings-server'

export async function GET(
  request: NextRequest
) {
  const listingId =
    request.nextUrl.searchParams.get(
      'listingId'
    )

  if (!listingId) {
    return NextResponse.json(
      {
        error: 'Listing ID is required.'
      },
      {
        status: 400
      }
    )
  }

  const contact =
    await getPublicListingContact(
      listingId
    )

  if (!contact?.whatsapp) {
    return NextResponse.json(
      {
        error: 'Contact unavailable.'
      },
      {
        status: 404
      }
    )
  }

  return NextResponse.json(
    {
      whatsapp: contact.whatsapp
    },
    {
      headers: {
        'Cache-Control':
          'private, no-store'
      }
    }
  )
}