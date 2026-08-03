import {
  NextRequest,
  NextResponse
} from 'next/server'

import { createClient } from '@supabase/supabase-js'

export async function DELETE(
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
    endpoint
  } = await request.json()

  const {
    error
  } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error(
      'DELETE PUSH SUBSCRIPTION ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to delete subscription'
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