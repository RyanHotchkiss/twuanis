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
  resolveCommercialTimeline
} from '@/lib/commercial-timeline'


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
          success:
            false,

          error:
            'Authentication required.'
        },
        {
          status:
            401
        }
      )
    }


    /*
     * -----------------------------------------------------
     * AUTHENTICATE USER
     * -----------------------------------------------------
     */


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
          },

          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false
          }
        }
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

          error:
            'Your session could not be verified.'
        },
        {
          status:
            401
        }
      )
    }


    /*
     * -----------------------------------------------------
     * CANONICAL COMMERCIAL TIMELINE
     * -----------------------------------------------------
     */


    const timeline =
      await resolveCommercialTimeline({
        supabase:
          supabaseAdmin,

        userId:
          user.id
      })


    return NextResponse.json({
      success:
        true,

      timeline
    })

  } catch (
    error
  ) {

    console.error(
      'COMMERCIAL TIMELINE API ERROR:',
      error
    )


    return NextResponse.json(
      {
        success:
          false,

        error:
          'Your commercial history could not be loaded.'
      },
      {
        status:
          500
      }
    )
  }
}