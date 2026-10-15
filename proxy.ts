import {documentLanguage} from '@/lib/document-language'
import { isStagingApplication } from '@/lib/staging-identity'
import { createServerClient } from '@/lib/staging-supabase-ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const stagingInAppScheduler = request.nextUrl.pathname === '/api/cron/remates-alerts'
    && process.env.TWUANIS_REMATES_ALERTS_SCHEDULING === 'enabled'
    && process.env.TWUANIS_ENVIRONMENT === 'staging'
    && process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT === 'staging'
    && process.env.VERCEL_PROJECT_ID === 'prj_FVMLa40NeWsYgAFcHVHpUgolBgro'
    && process.env.TWUANIS_STAGING_PROJECT_REF === 'zryfurtogxvrnilnnadn'
    && process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://zryfurtogxvrnilnnadn.supabase.co'
  if (isStagingApplication() && !stagingInAppScheduler && /^\/api\/(cron(?:\/|$)|onvo(?:\/|$)|send-whatsapp(?:\/|$)|test-whatsapp(?:\/|$))/.test(request.nextUrl.pathname)) return NextResponse.json({ error: 'staging_operation_disabled' }, { status: 503 })
  const requestHeaders=new Headers(request.headers)
  requestHeaders.set('x-twuanis-document-language',documentLanguage(request.nextUrl.pathname,request.nextUrl.searchParams.get('lang')))
  const next=()=>NextResponse.next({request:{headers:requestHeaders}})
  let response=next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          requestHeaders.set('cookie',request.cookies.toString())
          response=next()

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
