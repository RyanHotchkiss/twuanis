import type { SupabaseClient } from '@supabase/supabase-js'

export function disposableTimelineContext(): { client: SupabaseClient; userId: string } {
  throw new Error('A runner-created disposable timeline authority is required; use npm run verify-commercial-timeline.')
}
