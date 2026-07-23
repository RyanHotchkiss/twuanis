import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

export async function saveFavorite(
  entityType: string,
  entityId: string,
  metadata: any = {}
) {
  const user =
      await getCurrentUser()

    if (!user) return

  await supabase
    .from('user_favorites')
    .upsert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    })
}

export async function recordRecentActivity(
  activityType: string,
  entityType: string,
  entityId: string,
  metadata: any = {}
) {
  const user =
    await getCurrentUser()

  if (!user) return

  await supabase
    .from('user_recent_activity')
    .insert({
      user_id: user.id,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    })
}