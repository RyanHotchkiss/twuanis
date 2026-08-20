'use client'

import { useMemo } from 'react'

import {
  pavedRoadDistanceRangeOptions
} from '@/data/property-data'

import FilterSelect from './FilterSelect'

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
  basePath: string
  language: Language
  text: UiText
}

export default function FilterColumn({
  title,
  prefix,
  options,
  filters,
  basePath,
  language,
  text
}: Props) {
  const provinceKey =
    `${prefix}province`

  const cantonKey =
    `${prefix}canton`

  const districtKey =
    `${prefix}district`

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

  const locationFields = [
    {
      key: provinceKey,
      label: text.province,
      options: options.province
    },
    {
      key: cantonKey,
      label: text.canton,
      options: cantons
    },
    {
      key: districtKey,
      label: text.district,
      options: districts
    }
  ]

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

  const marketFields = [
    {
      key: 'transaction_type',
      label: text.transaction,
      options:
        transactionOptions[language]
    },
    {
      key: 'property_type',
      label: text.propertyType,
      options: options.property_type
    },
    {
      key: 'bedrooms',
      label: text.bedrooms,
      options: options.bedrooms
    },
    {
      key: 'bathrooms',
      label: text.bathrooms,
      options: options.bathrooms
    },
    {
      key: 'parking',
      label: text.parking,
      options: options.parking
    },
    {
      key: 'price_range',
      label: text.priceRange,
      options: priceRangeOptions
    },
    {
      key: 'property_area',
      label: text.propertyArea,
      options: options.property_area
    },
    {
      key: 'construction_area',
      label: text.constructionArea,
      options:
        options.construction_area
    },
    {
      key: 'year_built',
      label: text.yearBuilt,
      options: options.year_built
    },
    {
      key: 'environment',
      label: text.environment,
      options: options.environment
    },
    {
      key: 'terrain',
      label: text.terrain,
      options: options.terrain
    },
    {
      key: 'utility',
      label: text.utilities,
      options: options.utility
    },
    {
      key: 'accessibility',
      label: text.accessibility,
      options: options.accessibility
    },
    ...(showPavedRoadDistance
      ? [
          {
            key: 'distance_to_paved_road_range',
            label: text.distanceToPavedRoad,
            options: pavedRoadDistanceOptions
          }
        ]
      : []),
    {
      key: 'legal_status',
      label: text.legalStatus,
      options: options.legal_status
    }
  ]

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
                basePath={basePath}
                language={language}
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
              filterKey={
                `${prefix}${field.key}`
              }
              options={field.options}
              filters={filters}
              basePath={basePath}
              language={language}
            />
          )
        )}
      </div>
    </div>
  )
}