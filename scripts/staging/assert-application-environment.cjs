// Staging-only build gate: never a production build command. No network or secret output.
const assert = require('node:assert/strict')
const env = process.env, ref = 'zryfurtogxvrnilnnadn'
assert.equal(env.TWUANIS_ENVIRONMENT, 'staging')
assert.equal(env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT, 'staging')
assert.equal(env.TWUANIS_STAGING_PROJECT_REF, ref)
assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, `https://${ref}.supabase.co`)
for (const [name, role] of [['NEXT_PUBLIC_SUPABASE_ANON_KEY','anon'],['SUPABASE_SERVICE_ROLE_KEY','service_role']]) {
  let valid = false
  try { const claim = JSON.parse(Buffer.from(env[name].split('.')[1], 'base64url')); valid = claim.ref === ref && claim.role === role } catch {}
  assert(valid, 'Staging credential identity rejected')
}
assert(['legacy', 'canonical'].includes(env.TWUANIS_PACKAGE_ENFORCEMENT), 'Staging Package enforcement rejected')
assert.notEqual(env.TWUANIS_SINPE_PAYMENTS, 'canonical')
assert.notEqual(env.TWUANIS_ONVO_AUTOMATION, 'canonical')
for (const name of ['RESEND_API_KEY','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_WHATSAPP_NUMBER','ONVO_SECRET_KEY','ONVO_WEBHOOK_SECRET','ONVO_WORKER_SECRET','ONVO_RECEIVING_ACCOUNT_ID','NEXT_PUBLIC_VAPID_PUBLIC_KEY']) assert(!env[name], 'Staging external configuration rejected')
// The only reviewed staging cron is the opted-in IN_APP worker; external provider guards stay unchanged.
if (env.CRON_SECRET) assert(env.TWUANIS_REMATES_ALERTS_SCHEDULING === 'enabled' && env.CRON_SECRET.length >= 32, 'Staging cron requires reviewed IN_APP scheduling activation')
if (env.TWUANIS_REMATES_ALERTS_SCHEDULING !== undefined) assert(['disabled', 'enabled'].includes(env.TWUANIS_REMATES_ALERTS_SCHEDULING), 'Staging IN_APP scheduling mode rejected')
if (env.VERCEL === '1') assert(env.TWUANIS_STAGING_VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID === env.TWUANIS_STAGING_VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== 'prj_XTn9YvpEiY9uyq5eHauJ9MNWhnxk', 'Staging Vercel project identity rejected')
console.log('Staging-only build environment PASS')
