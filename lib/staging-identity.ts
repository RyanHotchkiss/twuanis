export const STAGING_PROJECT_REF = 'zryfurtogxvrnilnnadn'
export function isStagingApplication() { return process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT === 'staging' }
export function assertStagingCredential(url: string, key: string, publicOnly = false, expectedRole?: 'anon' | 'service_role') {
  if (!isStagingApplication()) return
  if (url !== `https://${STAGING_PROJECT_REF}.supabase.co`) throw new Error('Staging Supabase target rejected')
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.ref !== STAGING_PROJECT_REF || !['anon', 'service_role'].includes(payload.role) || (publicOnly && payload.role !== 'anon') || (expectedRole && payload.role !== expectedRole)) throw Error()
  } catch { throw new Error('Staging credential identity rejected') }
}
export function stagingDeliveryBlocked() { return isStagingApplication() }
export function stagingFetch(original: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    if (isStagingApplication()) {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
      if (url.origin !== `https://${STAGING_PROJECT_REF}.supabase.co`) throw new Error('Staging request target rejected')
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
      if (method === 'POST' && /^\/auth\/v1\/(signup|otp|recover|resend|invite)(?:\/|$)/.test(url.pathname)) throw new Error('Staging email delivery disabled')
      if (method === 'PUT' && url.pathname === '/auth/v1/user') {
        const body = init?.body ?? (input instanceof Request ? await input.clone().text() : '')
        try { if (JSON.parse(String(body)).email) throw new Error('Staging email delivery disabled') } catch (error) { if (error instanceof Error && error.message === 'Staging email delivery disabled') throw error }
      }
    }
    return original(input, init)
  }
}
