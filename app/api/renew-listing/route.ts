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
    if (
      listing.listing_status !==
        'active' &&
      listing.listing_status !==
        'expired'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Only active or expired listings can be renewed.'
        },
        {
          status: 409
        }
      )
    }

    const previousStatus =
      listing.listing_status

    /*
     * Expired → Active consumes an active-listing slot.
     *
     * Active → Active does not create another active
     * listing, so no package-capacity check is needed.
     */
    if (
      previousStatus ===
      'expired'
    ) {
      let packageUsage

      try {
        packageUsage =
          await resolveUserPackageUsage({
            supabase:
              supabaseAdmin,

            userId:
              user.id
          })
      } catch (usageError) {
        console.error(
          'RENEW LISTING PACKAGE USAGE ERROR:',
          usageError
        )

        return NextResponse.json(
          {
            success: false,
            error:
              'Your package allowance could not be verified.'
          },
          {
            status: 500
          }
        )
      }

      if (
        packageUsage.listingLimit !==
          null &&
        packageUsage.listingsUsed >=
          packageUsage.listingLimit
      ) {
        return NextResponse.json(
          {
            success: false,

            code:
              'LISTING_LIMIT_EXCEEDED',

            error:
              `Your package allows ${packageUsage.listingLimit} active ${
                packageUsage.listingLimit === 1
                  ? 'listing'
                  : 'listings'
              }. Archive an existing listing or upgrade your package before renewing this listing.`
          },
          {
            status: 403
          }
        )
      }
    }

    /*
     * Renew the listing canonically.
     *
     * created_at is deliberately untouched.
     */
    const renewedAt =
      new Date().toISOString()

    const {
      data: renewedListing,
      error: renewError
    } =
      await supabaseAdmin
        .from(
          'listings'
        )
        .update({
          listing_status:
            'active',

          published_at:
            renewedAt,

          renewed_at:
            renewedAt,

          updated_at:
            renewedAt,

          expired_at:
            null
        })
        .eq(
          'id',
          listing.id
        )
        .eq(
          'owner_id',
          user.id
        )
        .eq(
          'listing_status',
          previousStatus
        )
        .select(`
          id,
          title,
          listing_status,
          transaction_type,
          created_at,
          published_at,
          renewed_at,
          updated_at,
          expired_at
        `)
        .maybeSingle()

    if (
      renewError ||
      !renewedListing
    ) {
      console.error(
        'RENEW LISTING UPDATE ERROR:',
        renewError
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

    /*
     * Record the canonical renewal event.
     *
     * Activity failure must not invalidate a successful
     * listing renewal.
     */
    try {
      const {
        error: activityError
      } =
        await supabaseAdmin
          .from(
            'activity_events'
          )
          .insert({
            user_id:
              user.id,

            event_category:
              'listing',

            event_type:
              'listing_renewed',

            entity_type:
              'listing',

            entity_id:
              renewedListing.id,

            metadata: {
              title:
                renewedListing.title,

              transactionType:
                renewedListing
                  .transaction_type,

              previousStatus,

              listingStatus:
                renewedListing
                  .listing_status,

              publishedAt:
                renewedListing
                  .published_at,

              renewedAt:
                renewedListing
                  .renewed_at,

              source:
                'market-hub'
            }
          })

      if (activityError) {
        console.error(
          'RENEW LISTING ACTIVITY ERROR:',
          activityError
        )
      }
    } catch (activityError) {
      console.error(
        'RENEW LISTING ACTIVITY ERROR:',
        activityError
      )
    }

    return NextResponse.json({
      success: true,

      listing:
        renewedListing
    })
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