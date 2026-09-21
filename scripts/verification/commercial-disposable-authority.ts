import type { SupabaseClient } from '@supabase/supabase-js'
// Deliberately no environment-based authorization. Only the isolated runner injects this capability.
export function disposableCommercialContext(): { client: SupabaseClient; userId: string } {
  throw new Error('Run npm run verify-commercial-resolver: runner-created disposable transport required.')
}
