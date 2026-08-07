import {
  NextResponse
} from 'next/server'

import {
  createClient
} from '@supabase/supabase-js'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  resolveListingTimeline
} from '@/lib/listing-timeline'

type ListingTimelineRequest = {
  listingId?: string
}

function createAuthenticatedSupabaseClient(
  accessToken: string
) {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      'Supabase environment variables are not configured.'
    )
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      },

      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false
      }
    }
  )
}

export async function POST(
  request: Request
) {
  try {
    const authorizationHeader =
      request.headers.get(
        'authorization'
      )

    const accessToken =
      authorizationHeader
        ?.replace(
          /^Bearer\s+/i,
          ''
        )
        .trim()

    if (!accessToken) {
      return NextResponse.json(
        {
          success:
            false,

          timeline:
            null,

          error:
            'Authentication is required.'
        },
        {
          status:
            401
        }
      )
    }

    const authenticatedSupabase =
      createAuthenticatedSupabaseClient(
        accessToken
      )

    const {
      data: {
        user
      },
      error:
        userError
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
          success:
            false,

          timeline:
            null,

          error:
            'The authenticated user could not be verified.'
        },
        {
          status:
            401
        }
      )
    }

    const body =
      await request
        .json()
        .catch(
          () =>
            null
        ) as
          | ListingTimelineRequest
          | null

    const listingId =
      body?.listingId
        ?.trim()

    if (!listingId) {
      return NextResponse.json(
        {
          success:
            false,

          timeline:
            null,

          error:
            'A listing ID is required.'
        },
        {
          status:
            400
        }
      )
    }

    const timeline =
      await resolveListingTimeline({
        supabase:
          supabaseAdmin,

        listingId,

        ownerId:
          user.id
      })

    return NextResponse.json({
      success:
        true,

      timeline,

      empty:
        timeline.events.length === 0
    })
  } catch (error) {
    console.error(
      'LISTING TIMELINE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success:
          false,

        timeline:
          null,

        error:
          error instanceof Error
            ? error.message
            : 'Listing timeline could not be resolved.'
      },
      {
        status:
          500
      }
    )
  }
}