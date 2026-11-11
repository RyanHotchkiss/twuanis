import {NextResponse} from 'next/server'
import {assertOwner} from '@/lib/administrative-control'
import {assertStagingServerEnvironment} from '@/lib/staging-server-guard'
import {runStagingFxNegativeAcceptance} from '@/lib/staging-fx-negative-acceptance'

export const runtime = 'nodejs'
const headers = {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow'}
export async function POST(request: Request) {
  if (process.env.TWUANIS_ENVIRONMENT !== 'staging' ||
      process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT !== 'staging' ||
      process.env.TWUANIS_STAGING_FX_NEGATIVE_ACCEPTANCE !== '1' ||
      process.env.TWUANIS_PACKAGE_ENFORCEMENT !== 'canonical' ||
      (process.env.VERCEL === '1' && process.env.VERCEL_PROJECT_ID !== 'prj_FVMLa40NeWsYgAFcHVHpUgolBgro')) {
    return new NextResponse(null, {status: 404, headers})
  }
  try { assertStagingServerEnvironment() }
  catch { return new NextResponse(null, {status: 404, headers}) }
  // No customer parameters, cookies supplied actor, or cross-origin invocation.
  const origin = request.headers.get('origin')
  if (origin !== new URL(request.url).origin || new URL(request.url).search ||
      (await request.text()).length !== 0) return new NextResponse(null, {status: 400, headers})
  try {
    const actor = await assertOwner()
    if (actor.actorId !== 'fe0f4718-ac10-4091-8ec3-081a96765991') throw new Error('Fixture mismatch')
  } catch { return new NextResponse(null, {status: 403, headers}) }
  if (process.env.BCCR_API_TOKEN) return new NextResponse(null, {status: 409, headers})
  try {
    const result = await runStagingFxNegativeAcceptance()
    return NextResponse.json(result, {status: result.passed ? 200 : 422, headers})
  } catch { return NextResponse.json({passed: false, error: 'FX acceptance prerequisite or execution failed'}, {status: 409, headers}) }
}
