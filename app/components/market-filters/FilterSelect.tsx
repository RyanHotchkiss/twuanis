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
  compact?: boolean
  emptyLabel?: string
  label: string
  accessibleLabel?: string
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
  compact = false,
  emptyLabel,
  label,
  accessibleLabel,
  filterKey,
  options = [],
  filters,
  language,
  onFilterChange
}: Props) {
  return (
    <div style={compact ? {minWidth:0} : assetSection}>
      <h3 style={assetHeading}>
        {label}
      </h3>

      <select
        aria-label={accessibleLabel ?? label}
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
          {emptyLabel || label}
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