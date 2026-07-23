import { supabase } from '@/lib/supabase'

export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(
      'Authentication required.'
    )
  }

  return user
}