import {
  saveFavorite as saveFavoriteAccount
} from '@/lib/account-storage'

export const FAVORITES_STORAGE_KEY =
  'favorites'

const LEGACY_KEYS = [
  'buy_favorites',
  'rent_lease_favorites'
] as const

function read(
  key: string
): string[] {

  if (typeof window === 'undefined') {
    return []
  }

  try {

    const value = JSON.parse(
      localStorage.getItem(key) || '[]'
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

  localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(ids)
  )

  window.dispatchEvent(
    new Event(
      'favorites-updated'
    )
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

  LEGACY_KEYS.forEach(key =>
    localStorage.removeItem(key)
  )

  return unique

}

export function isFavorite(
  id: string
) {

  return getFavorites().includes(id)

}

export function saveFavorite(
  id: string
) {

  if (isFavorite(id)) {
    return
  }

  write([
      ...getFavorites(),
      id
    ])

    saveFavoriteAccount(
      'listing',
      id
    )

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