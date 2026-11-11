import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { assertStagingServerEnvironment } from './staging-server-guard'

const reads = new AsyncLocalStorage<{ trace: string; loads: number }>()
const instance = randomUUID()
function enabled() {
  if (process.env.TWUANIS_STAGING_ANALYTICAL_CACHE_TRACE !== '1') return false
  if (process.env.TWUANIS_ENVIRONMENT !== 'staging' || process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT !== 'staging') throw new Error('Staging cache trace target rejected')
  assertStagingServerEnvironment()
  return true
}
function emit(event: string, trace: string, loads: number) {
  console.info(JSON.stringify({ event, dictionary: 'explorer-options', trace, instance, deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null, loads }))
}
// Observes execution only. No cached values, account identity, tokens or queries are logged.
export function noteStagingDictionaryLoad() {
  if (!enabled()) return
  const read = reads.getStore()
  if (read) read.loads++
  emit('staging.dictionary.loader', read?.trace ?? 'unassociated', read?.loads ?? 1)
}
export function observeStagingDictionaryRead<T>(read: () => Promise<T>): Promise<T> {
  if (!enabled()) return read()
  const context = { trace: randomUUID(), loads: 0 }
  return reads.run(context, async () => {
    emit('staging.dictionary.read', context.trace, 0)
    try {
      const value = await read()
      // Zero loads means reuse observed, not proof of a distributed cache HIT.
      emit('staging.dictionary.complete', context.trace, context.loads)
      return value
    } catch (error) {
      emit('staging.dictionary.failed', context.trace, context.loads)
      throw error
    }
  })
}
