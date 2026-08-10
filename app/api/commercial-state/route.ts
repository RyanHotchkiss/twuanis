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
  resolveCommercialState
} from '@/lib/commercial-resolver'


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
     * -------------------------------------------------------
     * VERIFY AUTHENTICATED USER
     * -------------------------------------------------------
     *
     * The browser proves identity with its access token.
     * Canonical commercial resolution then executes through
     * the privileged server boundary.
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
     * -------------------------------------------------------
     * CANONICAL COMMERCIAL STATE
     * -------------------------------------------------------
     *
     * The browser does not read private entitlement state
     * directly and does not reconstruct commercial truth.
     */


    const commercialState =
      await resolveCommercialState({
        supabase:
          supabaseAdmin,

        userId:
          user.id
      })


    return NextResponse.json({
      success:
        true,

      commercialState
    })

  } catch (error) {
    console.error(
      'COMMERCIAL STATE API ERROR:',
      error
    )


    return NextResponse.json(
      {
        success:
          false,

        error:
          'Your commercial state could not be loaded.'
      },
      {
        status:
          500
      }
    )
  }
}