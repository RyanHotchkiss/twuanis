'use client'

import { useMemo } from 'react'

import {
  pavedRoadDistanceRangeOptions
} from '@/data/property-data'

import FilterSelect from './FilterSelect'

import {
  getIntelligenceFiltersForSection,
  type IntelligenceFilterKey
} from './filter-registry'

import type {
  ExplorerOptions,
  Filters,
  Language,
  Prefix
} from './types'

import type {
  UiText
} from './translations'

import {
  priceRangeOptions,
  transactionOptions
} from './options'

import {
  normalize,
  optionValue
} from './utils'

import {
  assetHeading,
  locationGrid,
  locationSection,
  marketHeading,
  wrapper
} from './styles'

type Props = {
  title?: string
  prefix: Prefix
  options: ExplorerOptions
  filters: Filters
  language: Language
  text: UiText

  filterKeys:
    readonly IntelligenceFilterKey[]

  onFilterChange: (
    key: string,
    value: string
  ) => void
}

export default function FilterColumn({
  title,
  prefix,
  options,
  filters,
  language,
  text,
  filterKeys,
  onFilterChange
}: Props) {
  const provinceKey =
    `${prefix}province`

  const cantonKey =
    `${prefix}canton`

  const cantons = useMemo(() => {
    const selected =
      filters[provinceKey]

    if (!selected) return []

    const province =
      options.province?.find(
        item =>
          normalize(optionValue(item)) ===
          normalize(selected)
      )

    if (
      typeof province === 'string' ||
      !province?.id
    ) {
      return []
    }

    return (
      options.canton?.filter(
        item =>
          typeof item !== 'string' &&
          item.parent_id === province.id
      ) || []
    )
  }, [
    filters,
    provinceKey,
    options.province,
    options.canton
  ])

  const districts = useMemo(() => {
    const selected =
      filters[cantonKey]

    if (!selected) return []

    const canton =
      options.canton?.find(
        item =>
          normalize(optionValue(item)) ===
          normalize(selected)
      )

    if (
      typeof canton === 'string' ||
      !canton?.id
    ) {
      return []
    }

    return (
      options.district?.filter(
        item =>
          typeof item !== 'string' &&
          item.parent_id === canton.id
      ) || []
    )
  }, [
    filters,
    cantonKey,
    options.canton,
    options.district
  ])

  const pavedRoadDistanceOptions =
    pavedRoadDistanceRangeOptions.map(
      option => ({
        slug: option.value,
        term_name_en: option.en,
        term_name_es: option.es
      })
    )

  const accessibilityKey =
    `${prefix}accessibility`

  const showPavedRoadDistance =
    filters[accessibilityKey] ===
      'Unpaved Road to Property'

  function getLabel(
    key: IntelligenceFilterKey
  ) {
    switch (key) {
      case 'transaction_type':
        return text.transaction

      case 'province':
        return text.province

      case 'canton':
        return text.canton

      case 'district':
        return text.district

      case 'property_type':
        return text.propertyType

      case 'bedrooms':
        return text.bedrooms

      case 'bathrooms':
        return text.bathrooms

      case 'parking':
        return text.parking

      case 'price_range':
        return text.priceRange

      case 'property_area':
        return text.propertyArea

      case 'construction_area':
        return text.constructionArea

      case 'year_built':
        return text.yearBuilt

      case 'environment':
        return text.environment

      case 'terrain':
        return text.terrain

      case 'utility':
        return text.utilities

      case 'accessibility':
        return text.accessibility

      case 'distance_to_paved_road_range':
        return text.distanceToPavedRoad

      case 'legal_status':
        return text.legalStatus
    }
  }

  function getOptions(
    key: IntelligenceFilterKey
  ) {
    switch (key) {
      case 'transaction_type':
        return transactionOptions[language]

      case 'province':
        return options.province

      case 'canton':
        return cantons

      case 'district':
        return districts

      case 'property_type':
        return options.property_type

      case 'bedrooms':
        return options.bedrooms

      case 'bathrooms':
        return options.bathrooms

      case 'parking':
        return options.parking

      case 'price_range':
        return priceRangeOptions

      case 'property_area':
        return options.property_area

      case 'construction_area':
        return options.construction_area

      case 'year_built':
        return options.year_built

      case 'environment':
        return options.environment

      case 'terrain':
        return options.terrain

      case 'utility':
        return options.utility

      case 'accessibility':
        return options.accessibility

      case 'distance_to_paved_road_range':
        return pavedRoadDistanceOptions

      case 'legal_status':
        return options.legal_status
    }
  }

  function buildFields(
    section: 'location' | 'market'
  ) {
    return getIntelligenceFiltersForSection(
      filterKeys,
      section
    )
      .filter(
        definition =>
          definition.key !==
            'distance_to_paved_road_range' ||
          showPavedRoadDistance
      )
      .map(
        definition => ({
          key:
            `${prefix}${definition.key}`,

          label:
            getLabel(
              definition.key
            ),

          options:
            getOptions(
              definition.key
            )
        })
      )
  }

  const locationFields =
    buildFields('location')

  const marketFields =
    buildFields('market')

  return (
    <div>
      {title && (
        <h3 style={marketHeading}>
          {title}
        </h3>
      )}

      <div style={locationSection}>
        <h3 style={assetHeading}>
          {text.location}
        </h3>

        <div style={locationGrid}>
          {locationFields.map(
            field => (
              <FilterSelect
                key={field.key}
                label={field.label}
                filterKey={field.key}
                options={field.options}
                filters={filters}
                language={language}
                onFilterChange={
                  onFilterChange
                }
              />
            )
          )}
        </div>
      </div>

      <div style={wrapper}>
        {marketFields.map(
          field => (
            <FilterSelect
              key={field.key}
              label={field.label}
              filterKey={field.key}
              options={field.options}
              filters={filters}
              language={language}
              onFilterChange={
                onFilterChange
              }
            />
          )
        )}
      </div>
    </div>
  )
}