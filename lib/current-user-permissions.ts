import 'server-only'
import { createServerSupabaseClient } from './supabase-server'
import type { UserPermissionContext } from './permissions'

// Presentation evidence only. Never derives commercial tiers from execution entitlements.
export async function resolveCurrentUserPermissionContext(): Promise<UserPermissionContext> {
  const unresolved: UserPermissionContext = { authenticated: false, premium: false, enterprise: false, roles: [] }
  try {
    const client = await createServerSupabaseClient()
    const { data, error } = await client.auth.getUser()
    if (error || !data.user || typeof data.user.id !== 'string' || !data.user.id) return unresolved
    // Current subscription/package sources do not establish Premium/Enterprise equivalence.
    // No authoritative MarketHub role assignment source is currently connected either.
    // Do not query unrelated commercial state or invent mappings from hierarchy/metadata.
    return { ...unresolved, authenticated: true }
  } catch {
    return unresolved
  }
}
