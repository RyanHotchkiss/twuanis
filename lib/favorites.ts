import {
  saveListingFavorite
} from '@/lib/account-storage'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

import { supabase }
from '@/lib/supabase'

import {
  recordPropertySaved
} from '@/lib/activity/listings'

export const FAVORITES_STORAGE_KEY =
  'favorites'

const LEGACY_KEYS = [
  'buy_favorites',
  'rent_lease_favorites'
] as const

function read(
  key: string
): string[] {
  if (
    typeof window === 'undefined'
  ) {
    return []
  }

  try {
    const value =
      JSON.parse(
        window.localStorage.getItem(key) ||
        '[]'
      )

    return Array.isArray(value)
      ? value
      : []
  } catch {
    return []
  }
}

function write(
  ids: string[]
) {
  if (
    typeof window === 'undefined'
  ) {
    return
  }

  window.localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(ids)
  )
}

export function getFavorites() {

  const ids = [
    ...read(FAVORITES_STORAGE_KEY),
    ...LEGACY_KEYS.flatMap(read)
  ]

  const unique = [
    ...new Set(ids)
  ]

  write(unique)

  if (
    typeof window !== 'undefined'
  ) {
    LEGACY_KEYS.forEach(key =>
      window.localStorage.removeItem(key)
    )
  }

  return unique

}

export function isFavorite(
  id: string
) {

  return getFavorites().includes(id)

}

export async function saveFavorite(
  id: string
) {

  if (isFavorite(id)) {
    return
  }

  write([
      ...getFavorites(),
      id
    ])

    await saveListingFavorite(id)

    recordPropertySaved(id)

}

export function removeFavorite(
  id: string
) {

  write(
    getFavorites().filter(
      favorite => favorite !== id
    )
  )

}

export function toggleFavorite(
  id: string
) {

  if (isFavorite(id)) {

    removeFavorite(id)

  } else {

    saveFavorite(id)

  }

}

export async function migrateAnonymousFavorites() {

  const user =
    await getCurrentUser()

  if (!user) return

  const favorites =
    getFavorites()

  if (favorites.length === 0) {
    return
  }

  const RECENT_SAVED_PROPERTIES_KEY =
  'recently-saved-properties'

  window.dispatchEvent(
      new Event(
        'recent-saved-properties-updated'
      )
    )

  const rows =
    favorites.map(id => ({
      user_id: user.id,
      listing_id: id
    }))

  await supabase
    .from('listing_favorites')
    .upsert(
      rows,
      {
        onConflict:
          'user_id,listing_id'
      }
    )

  if (
  typeof window !== 'undefined'
) {
  window.localStorage.removeItem(
    FAVORITES_STORAGE_KEY
  )

  window.dispatchEvent(
    new Event(
      'favorites-updated'
    )
  )
}
}