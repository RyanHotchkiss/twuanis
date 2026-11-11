export function loadLocal<T>(
  key: string,
  fallback: T
): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value =
    localStorage.getItem(key)

  if (!value) {
    return fallback
  }

  return JSON.parse(value)
}

export function saveLocal(
  key: string,
  value: unknown
) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(
    key,
    JSON.stringify(value)
  )
}

export function removeLocal(
  key: string
) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(key)
}