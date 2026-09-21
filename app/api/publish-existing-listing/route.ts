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

import {
  recordListingPublished
} from '@/lib/activity'

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
  images: unknown
  published_at: string | null
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

export async function POST(
  request: NextRequest
) {
  try {
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
          images,
          published_at
        `)
        .eq(
          'id',
          listingId
        )
        .maybeSingle()

    if (listingError) {
      console.error(
        'PUBLISH EXISTING LISTING LOAD ERROR:',
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
            'You are not authorized to publish this listing.'
        },
        {
          status: 403
        }
      )
    }

    if (listing.canonical_domain_version === 1) {
      const result = await executeCustomerPublication(authenticatedSupabase, listing.id, 'publish', requestBody)
      return NextResponse.json({ success: true, listing: { id: listing.id }, canonicalResult: result })
    }
    return NextResponse.json({ success: false, error: 'Legacy listing mutation has been retired. A canonical listing is required.' }, { status: 409 })
  } catch (error) {
    console.error(
      'PUBLISH EXISTING LISTING ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The listing could not be published.'
      },
      {
        status: 500
      }
    )
  }
}