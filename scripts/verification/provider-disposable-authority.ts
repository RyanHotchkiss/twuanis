import type { SupabaseClient } from '@supabase/supabase-js'
export function disposableProviderContext(): { client: SupabaseClient; userId: string; packageId: string; provider: 'sinpe' | 'bank-transfer' } {
  throw new Error('Runner-created disposable provider authority required; use npm run verify-provider -- sinpe or bank-transfer.')
}
