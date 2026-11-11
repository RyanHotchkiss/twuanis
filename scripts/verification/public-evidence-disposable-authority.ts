import type { SupabaseClient } from '@supabase/supabase-js'
export function disposablePublicEvidenceContext(): { client: SupabaseClient; userId: string } {
  throw new Error('A runner-created disposable public evidence authority is required.')
}
