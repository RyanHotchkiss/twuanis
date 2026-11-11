import {PropertyAuthenticationRequired,PropertyAccountChanged} from '@/lib/property-interaction-errors'
import {identity} from '@/lib/measurement/runtime'
import {favoriteReceipt} from '@/lib/measurement/acknowledged'
import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

export async function saveListingFavorite(
  listingId: string, expectedUserId?: string
) {
  const user =
    await getCurrentUser()

  if (!user) throw new PropertyAuthenticationRequired()
  if(expectedUserId&&user.id!==expectedUserId)throw new PropertyAccountChanged()

  const measurementReceipt=favoriteReceipt(listingId,'save')
  const {error:measurementWriteError}=await supabase
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
  if (measurementWriteError) throw measurementWriteError
  measurementReceipt()
}

export async function getListingFavoriteIds():
  Promise<string[]> {
  const { data: authData,error:measurementAuthError } =
    await supabase.auth.getUser()
  if(measurementAuthError && measurementAuthError.name!=='AuthSessionMissingError')throw measurementAuthError
  if(!measurementAuthError)identity(authData.user?.id??null,!!authData.user)

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

    throw error
  }

  return (
    data || []
  ).map(
    favorite =>
      favorite.listing_id
  )
}

export async function removeListingFavorite(
  listingId: string, expectedUserId?: string
): Promise<void> {
  const { data: authData } =
    await supabase.auth.getUser()

  const user =
    authData.user

  if (!user) throw new PropertyAuthenticationRequired()
  if(expectedUserId&&user.id!==expectedUserId)throw new PropertyAccountChanged()

  const measurementReceipt=favoriteReceipt(listingId,'remove')
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

  if(!error)measurementReceipt()

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