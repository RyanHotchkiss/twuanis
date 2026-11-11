'use client'

import {
  useRouter
} from 'next/navigation'

import FilterSelect from './FilterSelect'

import {
  buildUrl
} from './utils'

import type {
  FilterOption,
  Filters,
  Language
} from './types'

type Props = {
  label: string
  filterKey: string
  options?: FilterOption[]
  filters: Filters
  basePath: string
  language: Language
}

export default function UrlFilterSelect({
  label,
  filterKey,
  options = [],
  filters,
  basePath,
  language
}: Props) {
  const router =
    useRouter()

  function handleFilterChange(
    key: string,
    value: string
  ) {
    router.push(
      buildUrl(
        filters,
        key,
        value,
        basePath
      )
    )
  }

  return (
    <FilterSelect
      label={label}
      filterKey={filterKey}
      options={options}
      filters={filters}
      language={language}
      onFilterChange={
        handleFilterChange
      }
    />
  )
}