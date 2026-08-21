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
  id: string
): Promise<void> {

  const favorite =
    await isFavorite(id)

  if (favorite) {
    return
  }

  await saveListingFavorite(id)

  recordPropertySaved(id)

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
  id: string
): Promise<void> {

  await removeListingFavorite(id)

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

export async function toggleFavorite(
  id: string
): Promise<void> {

  const favorite =
    await isFavorite(id)

  if (favorite) {

    await removeFavorite(id)

  } else {

    await saveFavorite(id)

  }

}