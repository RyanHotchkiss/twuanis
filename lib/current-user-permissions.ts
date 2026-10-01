import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { UserPermissionContext } from './permissions'

function createAuthenticatedSupabaseClient(
  accessToken: string
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are not configured.'
    )
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}

export async function resolveCurrentUserPermissionContext(
  accessToken: string
): Promise<UserPermissionContext> {
  const unresolved: UserPermissionContext = {
    authenticated: false,
    premium: false,
    enterprise: false,
    roles: []
  }

  if (!accessToken) {
    return unresolved
  }

  const client =
    createAuthenticatedSupabaseClient(
      accessToken
    )

  const {
    data: {
      user
    },
    error: userError
  } =
    await client.auth.getUser(
      accessToken
    )

  if (userError || !user) {
    return unresolved
  }

  const {
    data: administrator,
    error: administratorError
  } =
    await client.rpc(
      'is_current_user_administrator'
    )

  if (administratorError) {
    throw administratorError
  }

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

  return {
    ...unresolved,
    authenticated: true
  }
}
