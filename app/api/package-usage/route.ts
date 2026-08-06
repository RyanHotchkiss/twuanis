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

export async function GET(
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

    const usage =
      await resolveUserPackageUsage({
        supabase:
          supabaseAdmin,

        userId:
          user.id
      })

    return NextResponse.json({
      success: true,
      usage
    })
  } catch (error) {
    console.error(
      'PACKAGE USAGE API ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Your package usage could not be loaded.'
      },
      {
        status: 500
      }
    )
  }
}