'use client'

import type {
  FilterOption,
  Filters,
  Language
} from './types'

import {
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
  language: Language

  onFilterChange: (
    key: string,
    value: string
  ) => void
}

export default function FilterSelect({
  label,
  filterKey,
  options = [],
  filters,
  language,
  onFilterChange
}: Props) {
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
          onFilterChange(
            filterKey,
            event.target.value
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