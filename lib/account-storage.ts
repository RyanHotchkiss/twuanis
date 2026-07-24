import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

export async function saveListingFavorite(
  listingId: string
) {
  const user =
    await getCurrentUser()

  if (!user) return

  await supabase
    .from('listing_favorites')
    .upsert(
      {
        user_id: user.id,
        listing_id: listingId
      },
      {
        onConflict:
          'user_id,listing_id'
      }
    )
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