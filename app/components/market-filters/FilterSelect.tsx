'use client'

import { useRouter } from 'next/navigation'

import type {
  FilterOption,
  Filters,
  Language
} from './types'

import {
  buildUrl,
  optionLabel,
  optionValue
} from './utils'

import {
  assetHeading,
  assetSection,
  select
} from './styles'

type Props = {
  label: string
  filterKey: string
  options?: FilterOption[]
  filters: Filters
  basePath: string
  language: Language
}

export default function FilterSelect({
  label,
  filterKey,
  options = [],
  filters,
  basePath,
  language
}: Props) {
  const router = useRouter()

  return (
    <div style={assetSection}>
      <h3 style={assetHeading}>
        {label}
      </h3>

      <select
        value={
          filters[filterKey] || ''
        }
        onChange={event =>
          router.push(
            buildUrl(
              filters,
              filterKey,
              event.target.value,
              basePath
            )
          )
        }
        style={select}
      >
        <option value="">
          {label}
        </option>

        {options.map(option => {
          const value =
            optionValue(option)

          return (
            <option
              key={`${filterKey}-${value}`}
              value={value}
            >
              {optionLabel(
                option,
                language
              )}
            </option>
          )
        })}
      </select>
    </div>
  )
}