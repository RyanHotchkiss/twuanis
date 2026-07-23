import { supabase } from '@/lib/supabase'
import {
  requireCurrentUser
} from '@/lib/auth/current-user'

export async function loadAnalysis(
  id: string
) {
  const user =
    await requireCurrentUser()

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}