import {
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  resolveMarketplacePlacement
} from '@/lib/promotion-placement'

import type {
  PromotionSurface
} from '@/lib/promotion-catalog'


type MarketplacePlacementListing = {
  id: string
  owner_id?: string | null
  [key: string]: unknown
}


type RequestBody = {
  listings?:
    MarketplacePlacementListing[]

  surface?:
    PromotionSurface
}


export async function POST(
  request:
    Request
) {

  try {

    const body =
      await request.json() as
        RequestBody


    const listings =
      Array.isArray(
        body.listings
      )
        ? body.listings
        : []


    const surface =
      body.surface


    if (
      !surface
    ) {

      return NextResponse.json(
        {
          error:
            'Promotion surface is required.'
        },
        {
          status:
            400
        }
      )
    }


    if (
      listings.length ===
        0
    ) {

      return NextResponse.json({
        listings:
          []
      })
    }


    /*
     * Fail closed on malformed listing IDs.
     */

    if (
      listings.some(
        listing =>
          !listing.id
      )
    ) {

      return NextResponse.json(
        {
          error:
            'Every marketplace listing requires a canonical ID.'
        },
        {
          status:
            400
        }
      )
    }


    const placement =
      await resolveMarketplacePlacement({
        supabase:
          supabaseAdmin,

        listings,

        surface
      })


    /*
     * Return only canonical placement output.
     *
     * No entitlement state crosses the server boundary.
     */

    return NextResponse.json({
      listings:
        placement.listings
    })

  } catch (
    error
  ) {

    console.error(
      'MARKETPLACE PLACEMENT API ERROR:',
      error
    )


    return NextResponse.json(
      {
        error:
          'Marketplace placement could not be resolved.'
      },
      {
        status:
          500
      }
    )
  }
}