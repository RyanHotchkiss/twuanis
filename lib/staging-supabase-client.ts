import { createClient as sdkCreateClient } from '@supabase/supabase-js'
import { assertStagingCredential, stagingFetch } from './staging-identity'
export * from '@supabase/supabase-js'
export const createClient: typeof sdkCreateClient = ((url: string, key: string, options?: Parameters<typeof sdkCreateClient>[2]) => {
  assertStagingCredential(url, key, typeof window !== 'undefined')
  return sdkCreateClient(url, key, { ...options, global: { ...options?.global, fetch: stagingFetch(options?.global?.fetch) } })
}) as typeof sdkCreateClient
