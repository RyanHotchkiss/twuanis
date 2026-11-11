import type { SupabaseClient } from '@supabase/supabase-js'
export function disposableActivationContext(): { client: SupabaseClient; userId: string; listingId: string; packageId: string; addOnId: string } {
  throw new Error('Runner-created disposable activation authority required; use npm run verify-activation.')
}
