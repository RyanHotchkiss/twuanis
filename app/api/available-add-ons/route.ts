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
  resolveAvailableAddOns
} from '@/lib/add-on-catalog'


export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'


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
          error: 'Authentication required.'
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
          },

          auth: {
            persistSession: false,
            autoRefreshToken: false
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
          success: false,
          error: 'Your session could not be verified.'
        },
        {
          status: 401
        }
      )
    }


    const body =
      await request.json() as {
        packageId?: string
      }


    if (!body.packageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'A package ID is required.'
        },
        {
          status: 400
        }
      )
    }


    const addOns =
      await resolveAvailableAddOns({
        supabase:
          supabaseAdmin,

        packageId:
          body.packageId
      })


    return NextResponse.json({
      success: true,
      addOns
    })

  } catch (
    error
  ) {

    console.error(
      'AVAILABLE ADD-ONS API ERROR:',
      error
    )


    return NextResponse.json(
      {
        success: false,
        error: 'Available add-ons could not be loaded.'
      },
      {
        status: 500
      }
    )
  }
}