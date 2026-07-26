import { supabase } from '@/lib/supabase'

export async function getCurrentUser() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (
    error ||
    !session?.user
  ) {
    return null
  }

  return session.user
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