'use client'

import {useHubUniverse} from '../HubUniverseContext'
import {universeLabels} from '@/lib/hub-universe-contract'
import BathroomSelectionControl from '../BathroomSelectionControl'

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
  const universe=useHubUniverse()
  if(universe&&filterKey.endsWith('transaction_type'))return <div><h3 style={assetHeading}>{label}</h3><p>{universeLabels[language][universe]}</p></div>
  if(['bathrooms','a_bathrooms','b_bathrooms'].includes(filterKey))return <BathroomSelectionControl label={accessibleLabel??label} value={filters[filterKey]} options={options} language={language} multiple onChange={v=>onFilterChange(filterKey,v)}/>
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