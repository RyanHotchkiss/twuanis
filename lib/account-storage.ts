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

export async function getListingFavoriteIds():
  Promise<string[]> {
  const { data: authData } =
    await supabase.auth.getUser()

  const user =
    authData.user

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('listing_favorites')
    .select('listing_id')
    .eq(
      'user_id',
      user.id
    )

  if (error) {
    console.error(
      'GET LISTING FAVORITES ERROR:',
      error
    )

    return []
  }

  return (
    data || []
  ).map(
    favorite =>
      favorite.listing_id
  )
}

export async function removeListingFavorite(
  listingId: string
): Promise<void> {
  const { data: authData } =
    await supabase.auth.getUser()

  const user =
    authData.user

  if (!user) {
    return
  }

  const { error } =
    await supabase
      .from('listing_favorites')
      .delete()
      .eq(
        'user_id',
        user.id
      )
      .eq(
        'listing_id',
        listingId
      )

  if (error) {
    console.error(
      'REMOVE LISTING FAVORITE ERROR:',
      error
    )

    throw error
  }
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