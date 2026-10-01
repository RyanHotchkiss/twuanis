import 'server-only'
import { createServerSupabaseClient } from './supabase-server'
import type { UserPermissionContext } from './permissions'

export async function resolveCurrentUserPermissionContext():
  Promise<UserPermissionContext> {

  const unresolved: UserPermissionContext = {
    authenticated: false,
    premium: false,
    enterprise: false,
    roles: []
  }

  try {
    const client =
      await createServerSupabaseClient()

    const {
      data,
      error
    } =
      await client.auth.getUser()

    if (
      error ||
      !data.user ||
      typeof data.user.id !== 'string' ||
      !data.user.id
    ) {
      return {
        ...unresolved,
        roles: ['buyer']
      }
    }

    const {
      data: administrator,
      error: administratorError
    } =
      await client.rpc(
        'is_current_user_administrator'
      )

    if (administratorError) {
      return {
        ...unresolved,
        authenticated: true,
        roles: ['seller']
      }
    }

    console.warn(
      '[permissions] administrator RPC result',
      {
        userId: data.user.id,
        administrator
      }
    )

    if (administrator === true) {
      return {
        authenticated: true,
        premium: true,
        enterprise: true,
        roles: [
          'buyer',
          'seller',
          'agent',
          'brokerage',
          'developer'
        ]
      }
    }

    // Current subscription/package sources do not yet establish
    // Premium/Enterprise presentation equivalence.
    // No authoritative MarketHub role assignment source is
    // currently connected either.
    return {
      ...unresolved,
      authenticated: true
    }
  } catch (error) {
    console.error(
      '[permissions] resolution failed',
      error
    )

    throw error
  }
}