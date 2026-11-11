import {
  getCurrentUser
} from '@/lib/auth/current-user'

export async function isAuthenticated() {
  const user =
    await getCurrentUser()

  return !!user
}