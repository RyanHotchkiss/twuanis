import 'server-only'
import { assertStagingCredential, isStagingApplication } from './staging-identity'
export function assertStagingServerEnvironment() {
  const server = process.env.TWUANIS_ENVIRONMENT === 'staging'
  if (!server && !isStagingApplication()) return
  if (!server || !isStagingApplication()) throw new Error('Staging environment declarations disagree')
  if (process.env.VERCEL === '1' && (!process.env.TWUANIS_STAGING_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID !== process.env.TWUANIS_STAGING_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID === 'prj_XTn9YvpEiY9uyq5eHauJ9MNWhnxk')) throw new Error('Staging Vercel project identity rejected')
  assertStagingCredential(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', true)
  assertStagingCredential(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', false, 'service_role')
  for (const name of ['RESEND_API_KEY','ONVO_SECRET_KEY','ONVO_WEBHOOK_SECRET','ONVO_WORKER_SECRET','ONVO_RECEIVING_ACCOUNT_ID','NEXT_PUBLIC_VAPID_PUBLIC_KEY']) {
    if (process.env[name]) throw new Error('Staging external configuration rejected')
  }
  const scheduling = process.env.TWUANIS_REMATES_ALERTS_SCHEDULING
  const secret = process.env.CRON_SECRET
  if (scheduling !== undefined && !['disabled', 'enabled'].includes(scheduling)) throw new Error('Staging IN_APP scheduling mode rejected')
  // This credential authorizes only the existing opted-in IN_APP route, not external delivery.
  if (secret || scheduling === 'enabled') {
    if (scheduling !== 'enabled' || !secret || secret.length < 32 || /\s/.test(secret)
      || process.env.VERCEL_PROJECT_ID !== 'prj_FVMLa40NeWsYgAFcHVHpUgolBgro'
      || process.env.TWUANIS_STAGING_VERCEL_PROJECT_ID !== 'prj_FVMLa40NeWsYgAFcHVHpUgolBgro'
      || process.env.TWUANIS_STAGING_PROJECT_REF !== 'zryfurtogxvrnilnnadn') throw new Error('Staging cron requires reviewed IN_APP scheduling activation')
  }
  if (!['legacy', 'canonical'].includes(process.env.TWUANIS_PACKAGE_ENFORCEMENT ?? '') || process.env.TWUANIS_SINPE_PAYMENTS === 'canonical' || process.env.TWUANIS_ONVO_AUTOMATION === 'canonical') throw new Error('Staging commercial activation rejected')
}
