'use client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

const STORAGE_KEY =
  'twuanis-property-comparison-selection'

const UPDATE_EVENT =
  'property-comparison-selection-updated'

const MAX_PROPERTIES = 4

function normalizePropertyIds(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .filter(
          propertyId =>
            typeof propertyId === 'string'
        )
        .map(propertyId =>
          propertyId.trim()
        )
        .filter(Boolean)
    )
  ).slice(0, MAX_PROPERTIES)
}

export function getSelectedPropertyIds():
string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      )

    if (!stored) {
      return []
    }

    return normalizePropertyIds(
      JSON.parse(stored)
    )
  } catch {
    return []
  }
}

function saveSelectedPropertyIds(
  propertyIds: string[]
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizePropertyIds(propertyIds)
    )
  )

  window.dispatchEvent(
    new CustomEvent(
      UPDATE_EVENT
    )
  )
}

export function toggleSelectedProperty(
  propertyId: string
): {
  selected: boolean
  propertyIds: string[]
} {
  const current =
    getSelectedPropertyIds()

  const alreadySelected =
    current.includes(propertyId)

  const next =
    alreadySelected
      ? current.filter(
          id => id !== propertyId
        )
      : current.length >= MAX_PROPERTIES
      ? current
      : [
          ...current,
          propertyId
        ]

  saveSelectedPropertyIds(next)

  return {
    selected:
      next.includes(propertyId),

    propertyIds:
      next
  }
}

export function removeSelectedProperty(
  propertyId: string
) {
  saveSelectedPropertyIds(
    getSelectedPropertyIds().filter(
      id => id !== propertyId
    )
  )
}

export function clearSelectedProperties() {
  saveSelectedPropertyIds([])
}

export function usePropertyComparisonSelection() {
  const [
    propertyIds,
    setPropertyIds
  ] = useState<string[]>([])

  const sync =
    useCallback(() => {
      setPropertyIds(
        getSelectedPropertyIds()
      )
    }, [])

  useEffect(() => {
    sync()

    window.addEventListener(
      UPDATE_EVENT,
      sync
    )

    window.addEventListener(
      'storage',
      sync
    )

    return () => {
      window.removeEventListener(
        UPDATE_EVENT,
        sync
      )

      window.removeEventListener(
        'storage',
        sync
      )
    }
  }, [sync])

  return {
    propertyIds,

    isSelected(
      propertyId: string
    ) {
      return propertyIds.includes(
        propertyId
      )
    },

    toggleProperty:
      toggleSelectedProperty,

    removeProperty:
      removeSelectedProperty,

    clear:
      clearSelectedProperties,

    maximumProperties:
      MAX_PROPERTIES
  }
}