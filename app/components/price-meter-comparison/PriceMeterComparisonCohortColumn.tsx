'use client'

import { useMemo } from 'react'

import FilterSelect from '@/app/components/market-filters/FilterSelect'

import {
  normalize,
  optionValue
} from '@/app/components/market-filters/utils'

import type {
  ExplorerOption
} from '@/lib/explorer-options-engine'

import {
  PROPERTY_AREA_RANGE_OPTIONS,
  CONSTRUCTION_AREA_RANGE_OPTIONS
} from '@/lib/market-intelligence-area-ranges'


import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS
} from '@/lib/price-meter-construction-land-cohorts'

type Language =
  | 'en'
  | 'es'


type Prefix =
  | 'a_'
  | 'b_'


type Filters =
  Record<
    string,
    string | undefined
  >


type ExplorerOptions = {
  province: ExplorerOption[]
  canton: ExplorerOption[]
  district: ExplorerOption[]
  property_type: ExplorerOption[]
  bedrooms: ExplorerOption[]
  bathrooms: ExplorerOption[]
  parking: ExplorerOption[]
  year_built: ExplorerOption[]
  property_area: ExplorerOption[]
  construction_area: ExplorerOption[]
  utility: ExplorerOption[]
  environment: ExplorerOption[]
  terrain: ExplorerOption[]
  accessibility: ExplorerOption[]
  legal_status: ExplorerOption[]
}


type Props = {
  title: string
  prefix: Prefix
  options: ExplorerOptions
  filters: Filters
  basePath: string
  language: Language
}


export default function PriceMeterComparisonCohortColumn({
  title,
  prefix,
  options,
  filters,
  basePath,
  language
}: Props) {
  const provinceKey =
    `${prefix}province`

  const cantonKey =
    `${prefix}canton`

  const districtKey =
    `${prefix}district`


  const characteristic1TypeKey =
    `${prefix}characteristic_1_type`

  const characteristic1Key =
    `${prefix}characteristic_1`

    const characteristic2TypeKey =
    `${prefix}characteristic_2_type`

  const characteristic2Key =
    `${prefix}characteristic_2`

  const cantons =
    useMemo(() => {
      const selected =
        filters[provinceKey]

      if (!selected) {
        return []
      }

      const province =
        options.province.find(
          item =>
            normalize(
              optionValue(item)
            ) ===
            normalize(selected)
        )

      if (!province?.id) {
        return []
      }

      return options.canton.filter(
        item =>
          item.parent_id ===
            province.id
      )
    }, [
      filters,
      provinceKey,
      options.province,
      options.canton
    ])


  const districts =
    useMemo(() => {
      const selected =
        filters[cantonKey]

      if (!selected) {
        return []
      }

      const canton =
        options.canton.find(
          item =>
            normalize(
              optionValue(item)
            ) ===
            normalize(selected)
        )

      if (!canton?.id) {
        return []
      }

      return options.district.filter(
        item =>
          item.parent_id ===
            canton.id
      )
    }, [
      filters,
      cantonKey,
      options.canton,
      options.district
    ])

      const characteristicTypeOptions = [
    'bedrooms',
    'bathrooms',
    'parking',
    'year_built',
    'environment',
    'terrain',
    'utility',
    'accessibility',
    'legal_status'
  ]


  const selectedCharacteristic1Type =
    filters[characteristic1TypeKey]


  const characteristic1Options =
    selectedCharacteristic1Type &&
    selectedCharacteristic1Type in options
      ? options[
          selectedCharacteristic1Type as
            keyof ExplorerOptions
        ]
      : []

    const selectedCharacteristic2Type =
    filters[characteristic2TypeKey]


  const characteristic2Options =
    selectedCharacteristic2Type &&
    selectedCharacteristic2Type in options
      ? options[
          selectedCharacteristic2Type as
            keyof ExplorerOptions
        ]
      : []

    const constructionLandOptions =
    PRICE_METER_CONSTRUCTION_LAND_COHORTS.map(
      cohort => ({
        slug:
          cohort.key,

        term_name:
          cohort.label
      })
    )

  const text =
    language === 'es'
      ? {
          location:
            'Ubicación',
          province:
            'Provincia',
          canton:
            'Cantón',
          district:
            'Distrito',
          propertyType:
            'Tipo de propiedad',
          characteristic1:
            'Característica 1',
          characteristic2:
            'Característica 2',
          characteristicType:
            'Tipo de característica',
          characteristicValue:
            'Valor',
          propertyArea:
            'Área de propiedad',
          constructionArea:
            'Área de construcción',
          constructionLand:
            'Construcción a terreno'
        }
      : {
          location:
            'Location',
          province:
            'Province',
          canton:
            'Canton',
          district:
            'District',
          propertyType:
            'Property Type',
          characteristic1:
            'Characteristic 1',
          characteristic2:
            'Characteristic 2',
          characteristicType:
            'Characteristic Type',
          characteristicValue:
            'Value',
          propertyArea:
            'Property Area',
          constructionArea:
            'Construction Area',
          constructionLand:
            'Construction-to-Land'
        }

    const propertyAreaOptions =
      PROPERTY_AREA_RANGE_OPTIONS.map(
        option => ({
          slug:
            option.value,

          term_name:
            option.label
        })
      )

    const constructionAreaOptions =
      CONSTRUCTION_AREA_RANGE_OPTIONS.map(
        option => ({
          slug:
            option.value,

          term_name:
            option.label
        })
      )


    return (
    <section>
      <h2>
        {title}
      </h2>

      <h3>
        {text.location}
      </h3>

      <FilterSelect
        label={text.province}
        filterKey={provinceKey}
        options={options.province}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.canton}
        filterKey={cantonKey}
        options={cantons}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.district}
        filterKey={districtKey}
        options={districts}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.propertyType}
        filterKey={
          `${prefix}property_type`
        }
        options={
          options.property_type
        }
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <h3>
        {text.characteristic1}
      </h3>

      <FilterSelect
        label={text.characteristicType}
        filterKey={characteristic1TypeKey}
        options={characteristicTypeOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.characteristicValue}
        filterKey={characteristic1Key}
        options={characteristic1Options}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <h3>
        {text.characteristic2}
      </h3>

      <FilterSelect
        label={text.characteristicType}
        filterKey={characteristic2TypeKey}
        options={characteristicTypeOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.characteristicValue}
        filterKey={characteristic2Key}
        options={characteristic2Options}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.propertyArea}
        filterKey={
          `${prefix}property_area`
        }
        options={
          propertyAreaOptions
        }
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.constructionArea}
        filterKey={
          `${prefix}construction_area`
        }
        options={
          constructionAreaOptions
        }
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.constructionLand}
        filterKey={
          `${prefix}construction_land_cohort`
        }
        options={
          constructionLandOptions
        }
        filters={filters}
        basePath={basePath}
        language={language}
      />
    </section>
  )
}

