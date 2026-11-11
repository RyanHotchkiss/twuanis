import { supabase } from '@/lib/supabase'

function isExternalUrl(value: string) {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://')
  )
}

function normalizeImages(
  images: unknown
): string[] {

  if (Array.isArray(images)) {
    return images
      .map(String)
      .filter(Boolean)
  }

  if (
    typeof images === 'string' &&
    images.trim()
  ) {

    try {

      const parsed =
        JSON.parse(images)

      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .filter(Boolean)
      }

    } catch {

      return images
        .split('|')
        .map(image => image.trim())
        .filter(Boolean)

    }

  }

  return []

}

export function resolveListingImages(
  images: unknown
): string[] {

  return normalizeImages(images).map(
    image => {

      if (isExternalUrl(image)) {
        return image
      }

      return supabase
        .storage
        .from('listings-images')
        .getPublicUrl(image)
        .data
        .publicUrl

    }
  )

}

export function resolveFirstListingImage(
  images: unknown
): string | null {

  const resolved =
    resolveListingImages(images)

  return resolved[0] ?? null

}

export type ResolvedListingImage = {
  storedValue: string
  displayUrl: string
}

export function resolveEditableListingImages(
  images: unknown
): ResolvedListingImage[] {

  return normalizeImages(images).map(
    storedValue => ({

      storedValue,

      displayUrl:
        isExternalUrl(storedValue)
          ? storedValue
          : supabase
              .storage
              .from('listings-images')
              .getPublicUrl(storedValue)
              .data
              .publicUrl

    })
  )

}