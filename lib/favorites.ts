import {getCurrentUser} from '@/lib/auth/current-user'
import {PropertyAuthenticationRequired} from '@/lib/property-interaction-errors'
import {
  getListingFavoriteIds,
  removeListingFavorite,
  saveListingFavorite
} from '@/lib/account-storage'

import {
  recordPropertySaved
} from '@/lib/activity/listings'

export async function isFavorite(
  id: string
): Promise<boolean> {

  const favoriteIds =
    await getListingFavoriteIds()

  return favoriteIds.includes(id)

}

export async function saveFavorite(
  id: string, expectedUserId?: string
): Promise<void> {

  const favorite =
    await isFavorite(id)

  if (favorite) {
    return
  }

  await saveListingFavorite(id,expectedUserId)

  try {recordPropertySaved(id)} catch { /* Activity failure cannot undo a confirmed favorite. */ }

  if (
    typeof window !== 'undefined'
  ) {
    window.dispatchEvent(
      new Event(
        'favorites-updated'
      )
    )
  }

}

export async function removeFavorite(
  id: string, expectedUserId?: string
): Promise<void> {

  await removeListingFavorite(id,expectedUserId)

  if (
    typeof window !== 'undefined'
  ) {
    window.dispatchEvent(
      new Event(
        'favorites-updated'
      )
    )
  }

}

async function performToggleFavorite(
  id: string, expectedUserId?: string
): Promise<void> {

  const favorite =
    await isFavorite(id)

  if (favorite) {

    await removeFavorite(id,expectedUserId)

  } else {

    await saveFavorite(id,expectedUserId)

  }

}
const pending = new Map<string, Promise<void>>()
export async function toggleFavorite(id: string): Promise<void> {
  const actor=await getCurrentUser();if(!actor)throw new PropertyAuthenticationRequired()
  const key=actor.id+':'+id;const existing=pending.get(key);if(existing)return existing
  const operation=performToggleFavorite(id,actor.id).finally(()=>{pending.delete(key)})
  pending.set(key,operation);return operation
}
