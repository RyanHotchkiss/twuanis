import { createBrowserClient as browser, createServerClient as server } from '@supabase/ssr'
import { assertStagingCredential, stagingFetch } from './staging-identity'
export const createBrowserClient: typeof browser = ((url: string, key: string, options?: Parameters<typeof browser>[2]) => {
  assertStagingCredential(url, key, true)
  return (browser as (url: string, key: string, options: unknown) => ReturnType<typeof browser>)(url, key, { ...options, global: { ...options?.global, fetch: stagingFetch(options?.global?.fetch) } })
}) as typeof browser
export const createServerClient: typeof server = ((url: string, key: string, options: Parameters<typeof server>[2]) => {
  assertStagingCredential(url, key, true)
  return server(url, key, { ...options, global: { ...options?.global, fetch: stagingFetch(options?.global?.fetch) } })
}) as typeof server
