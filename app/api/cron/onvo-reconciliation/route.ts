import {createHash, timingSafeEqual} from 'node:crypto'
import {POST as runExistingWorker} from '../../onvo/worker/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 50

let running = false
const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: {'Cache-Control': 'no-store'},
})

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization')
  if (!secret || secret.length < 32 || !header || header.length > 1024 ||
      !timingSafeEqual(createHash('sha256').update(header).digest(),
        createHash('sha256').update('Bearer ' + secret).digest())) {
    return reply({error: 'unauthorized'}, 401)
  }
  const workerSecret = process.env.ONVO_WORKER_SECRET
  if (process.env.VERCEL_ENV !== 'production' || !workerSecret || workerSecret.length < 32) {
    return reply({error: 'unavailable'}, 503)
  }
  // Canonical database locks and idempotency also protect separate instances.
  if (running) return reply({state: 'already_running'}, 409)
  running = true
  try {
    // Same authenticated POST handler used by the existing webhook; no public HTTP hop.
    const result = await runExistingWorker(new Request(new URL('/api/onvo/worker', request.url), {
      method: 'POST', headers: {authorization: 'Bearer ' + workerSecret},
    }))
    const body = await result.json()
    const summary = {
      event: 'onvo_scheduled_reconciliation',
      workerStatus: result.status,
      processed: typeof body.processed === 'number' ? body.processed : null,
      failed: typeof body.failed === 'number' ? body.failed : null,
      pending: typeof body.pending === 'number' ? body.pending : null,
      fulfilled: typeof body.fulfilled === 'number' ? body.fulfilled : null,
      deferred: typeof body.deferred === 'number' ? body.deferred : null,
      attention: typeof body.attention === 'number' ? body.attention : null,
      outstanding: typeof body.health?.pending === 'number' ? body.health.pending : null,
      oldestPendingSeconds: typeof body.health?.oldestPendingSeconds === 'number' ? body.health.oldestPendingSeconds : null,
      unresolved: typeof body.health?.attention === 'number' ? body.health.attention : null,
      reconciliation: body.reconciliation === 'standard-intent' ? 'standard-intent' : null,
      notification: ['EMPTY', 'ACCEPTED', 'RETRY', 'UNCONFIGURED', 'NEEDS_RESOLUTION'].includes(body.notification?.state)
        ? body.notification.state : 'UNKNOWN',
    }
    const ok = result.ok && summary.failed === 0 && summary.attention === 0 && summary.unresolved === 0 && ['EMPTY', 'ACCEPTED'].includes(summary.notification)
    if (ok) console.info(JSON.stringify(summary))
    else console.error(JSON.stringify(summary))
    return reply(summary, ok ? 200 : 503)
  } catch {
    console.error(JSON.stringify({event: 'onvo_scheduled_reconciliation', error: 'unavailable'}))
    return reply({error: 'worker_unavailable'}, 503)
  } finally {
    running = false
  }
}
