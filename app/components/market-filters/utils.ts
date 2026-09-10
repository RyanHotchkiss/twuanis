import type {
  FilterOption,
  Filters,
  Language,
  Prefix
} from './types'

export function optionValue(
  option: FilterOption
) {
  if (typeof option === 'string') {
    return option
  }

  return (
    option.slug ||
    option.slug_en ||
    option.slug_es ||
    ''
  )
}

export function optionLabel(
  option: FilterOption,
  language: Language
) {
  if (typeof option === 'string') {
    return option
  }

  if (language === 'es') {
    return (
      option.term_name_es ||
      option.term_name ||
      option.slug_es ||
      option.slug ||
      ''
    )
  }

  return (
    option.term_name_en ||
    option.term_name ||
    option.slug_en ||
    option.slug ||
    ''
  )
}

export function normalize(
  value: unknown
) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function applyFilterChange(
  filters: Filters,
  key: string,
  value: string
): Filters {
  const next: Filters = {
    ...filters
  }

  if (value) {
    next[key] = value
  } else {
    delete next[key]
  }

  const prefix: Prefix =
    key.startsWith('a_')
      ? 'a_'
      : key.startsWith('b_')
        ? 'b_'
        : ''

  const plainKey =
    prefix
      ? key.slice(2)
      : key

  if (plainKey === 'province') {
    delete next[
      `${prefix}canton`
    ]

    delete next[
      `${prefix}district`
    ]
  }

  if (plainKey === 'canton') {
    delete next[
      `${prefix}district`
    ]
  }

  if (
    plainKey === 'accessibility' &&
    value !==
      'Unpaved Road to Property'
  ) {
    delete next[
      `${prefix}distance_to_paved_road_range`
    ]
  }

  return next
}

export function serializeFiltersUrl(
  filters: Filters,
  basePath: string
) {
  const params =
    new URLSearchParams()

  Object.entries(filters).forEach(
    ([filterKey, filterValue]) => {
      if (filterValue) {
        params.set(
          filterKey,
          filterValue
        )
      }
    }
  )

  const query =
    params.toString()

  const separator =
    basePath.includes('?')
      ? '&'
      : '?'

  return query
    ? `${basePath}${separator}${query}`
    : basePath
}

export function buildUrl(
  filters: Filters,
  key: string,
  value: string,
  basePath: string
) {
  return serializeFiltersUrl(
    applyFilterChange(
      filters,
      key,
      value
    ),
    basePath
  )
}