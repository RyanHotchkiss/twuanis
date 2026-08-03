import {
  NextRequest,
  NextResponse
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest
) {
  const authorization =
    request.headers.get('authorization')

  const accessToken =
    authorization?.replace(
      'Bearer ',
      ''
    )

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'Unauthorized'
      },
      {
        status: 401
      }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized'
      },
      {
        status: 401
      }
    )
  }

  const {
    subscription,
    userAgent
  } = await request.json()

  const keys =
    subscription?.keys

  if (
    !subscription?.endpoint ||
    !keys?.p256dh ||
    !keys?.auth
  ) {
    return NextResponse.json(
      {
        error: 'Invalid subscription'
      },
      {
        status: 400
      }
    )
  }

  const {
    error
  } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint:
          subscription.endpoint,
        p256dh:
          keys.p256dh,
        auth:
          keys.auth,
        user_agent:
          userAgent ?? null,
        updated_at:
          new Date().toISOString()
      },
      {
        onConflict: 'endpoint'
      }
    )

  if (error) {
    console.error(
      'SAVE PUSH SUBSCRIPTION ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to save subscription'
      },
      {
        status: 500
      }
    )
  }

  return NextResponse.json({
    success: true
  })
}