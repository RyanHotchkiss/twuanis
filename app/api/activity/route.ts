import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  createClient
} from '@supabase/supabase-js'

type ActivityRequestBody = {
  eventCategory?: string
  eventType?: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<
    string,
    unknown
  >
  sessionId?: string | null
}

function createAuthenticatedClient(
  accessToken: string
) {
  return createClient(
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
}

async function getAuthenticatedUser(
  request: NextRequest
) {
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
    return {
      user: null,
      supabase: null
    }
  }

  const supabase =
    createAuthenticatedClient(
      accessToken
    )

  const {
    data: {
      user
    },
    error
  } =
    await supabase.auth.getUser(
      accessToken
    )

  if (
    error ||
    !user
  ) {
    return {
      user: null,
      supabase: null
    }
  }

  return {
    user,
    supabase
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const {
      user,
      supabase
    } =
      await getAuthenticatedUser(
        request
      )

    if (
      !user ||
      !supabase
    ) {
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

    const body =
      await request.json() as
        ActivityRequestBody

    const {
      eventCategory,
      eventType,
      entityType = null,
      entityId = null,
      metadata = {},
      sessionId = null
    } = body

    if (
      !eventCategory ||
      !eventType
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Event category and event type are required.'
        },
        {
          status: 400
        }
      )
    }

    const {
      data,
      error
    } = await supabase
      .from('activity_events')
      .insert({
        user_id:
          user.id,

        session_id:
          sessionId,

        event_category:
          eventCategory,

        event_type:
          eventType,

        entity_type:
          entityType,

        entity_id:
          entityId,

        metadata
      })
      .select(`
        id,
        user_id,
        session_id,
        event_category,
        event_type,
        entity_type,
        entity_id,
        metadata,
        created_at
      `)
      .single()

    if (error) {
      console.error(
        'ACTIVITY INSERT ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The activity event could not be recorded.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,
      activity: data
    })
  } catch (error) {
    console.error(
      'ACTIVITY POST ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Something went wrong while recording activity.'
      },
      {
        status: 500
      }
    )
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const {
      user,
      supabase
    } =
      await getAuthenticatedUser(
        request
      )

    if (
      !user ||
      !supabase
    ) {
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

    const limitParameter =
      request.nextUrl.searchParams.get(
        'limit'
      )

    const requestedLimit =
      Number(limitParameter ?? 50)

    const limit =
      Number.isFinite(
        requestedLimit
      )
        ? Math.min(
            Math.max(
              requestedLimit,
              1
            ),
            100
          )
        : 50

    const {
      data,
      error
    } = await supabase
      .from('activity_events')
      .select(`
        id,
        user_id,
        session_id,
        event_category,
        event_type,
        entity_type,
        entity_id,
        metadata,
        created_at
      `)
      .eq(
        'user_id',
        user.id
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(limit)

    if (error) {
      console.error(
        'ACTIVITY LOAD ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Activity history could not be loaded.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,
      activity: data ?? []
    })
  } catch (error) {
    console.error(
      'ACTIVITY GET ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Something went wrong while loading activity.'
      },
      {
        status: 500
      }
    )
  }
}