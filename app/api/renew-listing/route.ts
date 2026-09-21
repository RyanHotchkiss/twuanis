import { executeCustomerPublication } from '@/lib/customer-publication-writer'
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

import {
  resolveUserPackageUsage
} from '@/lib/package-usage'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

type ListingRow = {
  id: string
  owner_id: string | null
  title: string | null
  transaction_type: string | null
  canonical_domain_version: number | null
  listing_status: string | null
  published_at: string | null
  renewed_at: string | null
  expired_at: string | null
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * Authenticate the user.
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
    const requestBody =
      await request.json()

    const listingId =
      typeof requestBody
        .listingId === 'string'
        ? requestBody
            .listingId
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

    /*
     * Load the canonical listing.
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
          title,
          transaction_type,
          canonical_domain_version,
          listing_status,
          published_at,
          renewed_at,
          expired_at
        `)
        .eq(
          'id',
          listingId
        )
        .maybeSingle()

    if (listingError) {
      console.error(
        'RENEW LISTING LOAD ERROR:',
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
            'You are not authorized to renew this listing.'
        },
        {
          status: 403
        }
      )
    }

    /*
     * Renewal is valid only from active or expired.
     */
    if (listing.canonical_domain_version === 1) {
      const result = await executeCustomerPublication(authenticatedSupabase, listing.id, 'renew', requestBody)
      return NextResponse.json({ success: true, listing: { id: listing.id }, canonicalResult: result })
    }
    return NextResponse.json({ success: false, error: 'Legacy listing mutation has been retired. A canonical listing is required.' }, { status: 409 })
  } catch (error) {
    console.error(
      'RENEW LISTING ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing could not be renewed.'
      },
      {
        status: 500
      }
    )
  }
}