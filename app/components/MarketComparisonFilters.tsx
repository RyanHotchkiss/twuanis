'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

import {
  pavedRoadDistanceRangeOptions
} from '@/data/property-data'

type Language = 'en' | 'es'

type Props = {
  language: Language
  options: any
  leftFilters: any
  rightFilters: any
  embedded?: boolean
}

const copy = {
  en: {

    marketA: 'Market A',
    marketB: 'Market B',

    compare: 'Compare Markets',

    location: 'Location',

    propertyType: 'Property Type',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    parking: 'Parking',

    priceRange: 'Price Range',

    propertyArea: 'Property Area',
    constructionArea: 'Construction Area',

    yearBuilt: 'Year Built',

    environment: 'Environment',
    terrain: 'Terrain',
    utilities: 'Utilities',
    accessibility: 'Accessibility',
    distanceToPavedRoad: 'Distance to Paved Road',
    legalStatus: 'Legal Status',
    transactionType: 'Transaction'
  },

  es: {

    marketA: 'Mercado A',
    marketB: 'Mercado B',

    compare: 'Comparar Mercados',

    location: 'Ubicación',

    propertyType: 'Tipo de Propiedad',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    parking: 'Parqueos',

    priceRange: 'Rango de Precio',

    propertyArea: 'Área del Terreno',
    constructionArea: 'Área de Construcción',

    yearBuilt: 'Año de Construcción',

    environment: 'Entorno',
    terrain: 'Terreno',
    utilities: 'Servicios',
    accessibility: 'Accesibilidad',
    distanceToPavedRoad: 'Distancia a Calle Pavimentada',
    legalStatus: 'Estado Legal',
    transactionType: 'Transacción'
  }
}

export default function MarketComparisonFilters({
  language,
  options,
  leftFilters,
  rightFilters,
  embedded = false
}: Props) {

  const router = useRouter()

  const t = copy[language]

  const leftCantons = useMemo(() => {

    if (!leftFilters.a_province) return []

    return (
      options.canton?.filter(
        (c: any) =>
          c.province === leftFilters.a_province
      ) || []
    )

  }, [
    leftFilters.a_province,
    options.canton
  ])

  const rightCantons = useMemo(() => {

    if (!rightFilters.b_province) return []

    return (
      options.canton?.filter(
        (c: any) =>
          c.province === rightFilters.b_province
      ) || []
    )

  }, [
    rightFilters.b_province,
    options.canton
  ])

  const leftDistricts = useMemo(() => {

    if (!leftFilters.a_canton) return []

    return (
      options.district?.filter(
        (d: any) =>
          d.canton === leftFilters.a_canton
      ) || []
    )

  }, [
    leftFilters.a_canton,
    options.district
  ])

  const rightDistricts = useMemo(() => {

    if (!rightFilters.b_canton) return []

    return (
      options.district?.filter(
        (d: any) =>
          d.canton === rightFilters.b_canton
      ) || []
    )

  }, [
    rightFilters.b_canton,
    options.district
  ])

function getLabel(option: any, language: Language) {
  if (typeof option === 'string') return option

  return language === 'es'
    ? option.term_name_es || option.term_name || option.slug
    : option.term_name_en || option.term_name || option.slug
}

function getValue(option: any) {
  if (typeof option === 'string') return option

  return option.slug
}

  function compareMarkets() {
  const form =
    document.querySelector('#market-comparison-form') as HTMLFormElement

  if (!form) return

  const formData =
    new FormData(form)

  const params =
    new URLSearchParams()

  if (embedded) {
    params.set(
      'intelligence',
      'comparison'
    )

    params.set(
      'compare',
      'markets'
    )
  }

  formData.forEach((value, key) => {
    const stringValue = String(value)

    if (stringValue.length > 0) {
      params.set(key, stringValue)
    }
  })

  router.push(`?${params.toString()}`)
}

  return (

<form id="market-comparison-form">
    <section style={wrapper}>

      <div style={column}>

  <h2 style={marketHeading}>
    {t.marketA}
  </h2>

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.location}
    </h3>

    {/* Province */}

    <select
      name="a_province"
      defaultValue={leftFilters.a_province || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Provincia'
          : 'Province'}
      </option>

      {options.province?.map((option: any) => (

        <option key={getValue(option)} value={getValue(option)}>

            {getLabel(option, language)}

        </option>

        ))}
    </select>

    {/* Canton */}

    <select
      name="a_canton"
      defaultValue={leftFilters.a_canton || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Cantón'
          : 'Canton'}
      </option>

      {leftCantons.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

    {/* District */}

    <select
      name="a_district"
      defaultValue={leftFilters.a_district || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Distrito'
          : 'District'}
      </option>

      {leftDistricts.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  <div style={assetSection}>
    <h3 style={assetHeading}>
      {t.transactionType}
    </h3>

    <select
      name="a_transaction_type"
      defaultValue={
        leftFilters.a_transaction_type || ''
      }
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Transacción'
          : 'Transaction'}
      </option>

      <option value="sale">
        {language === 'es'
          ? 'En Venta'
          : 'For Sale'}
      </option>

      <option value="rent">
        {language === 'es'
          ? 'En Alquiler'
          : 'For Rent'}
      </option>
    </select>
  </div>

  {/* PROPERTY TYPE */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.propertyType}
  </h3>

  <select
    name="a_property_type"
    defaultValue={leftFilters.a_property_type || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Tipo de Propiedad'
        : 'Property Type'}
    </option>

    {options.property_type?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* BEDROOMS */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.bedrooms}
  </h3>

  <select
    name="a_bedrooms"
    defaultValue={leftFilters.a_bedrooms || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Habitaciones'
        : 'Bedrooms'}
    </option>

    {options.bedrooms?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* BATHROOMS */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.bathrooms}
  </h3>

  <select
    name="a_bathrooms"
    defaultValue={leftFilters.a_bathrooms || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Baños'
        : 'Bathrooms'}
    </option>

    {options.bathrooms?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* PARKING */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.parking}
  </h3>

  <select
    name="a_parking"
    defaultValue={leftFilters.a_parking || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Parqueo'
        : 'Parking'}
    </option>

    {options.parking?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* PRICE RANGE */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.priceRange}
  </h3>

  <select
    name="a_price_range"
    defaultValue={leftFilters.a_price_range || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Rango de Precio'
        : 'Price Range'}
    </option>

    <option value="0-25000000">
      ₡0 – ₡25M
    </option>

    <option value="25000000-50000000">
      ₡25M – ₡50M
    </option>

    <option value="50000000-100000000">
      ₡50M – ₡100M
    </option>

    <option value="100000000-250000000">
      ₡100M – ₡250M
    </option>

    <option value="250000000+">
      ₡250M+
    </option>

  </select>

</div>

{/* PROPERTY AREA */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.propertyArea}
  </h3>

  <select
    name="a_property_area"
    defaultValue={leftFilters.a_property_area || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Área del Terreno'
        : 'Property Area'}
    </option>

    {options.property_area?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* CONSTRUCTION AREA */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.constructionArea}
  </h3>

  <select
    name="a_construction_area"
    defaultValue={leftFilters.a_construction_area || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Área de Construcción'
        : 'Construction Area'}
    </option>

    {options.construction_area?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* YEAR BUILT */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.yearBuilt}
  </h3>

  <select
    name="a_year_built"
    defaultValue={leftFilters.a_year_built || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Año de Construcción'
        : 'Year Built'}
    </option>

    {options.year_built?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* ENVIRONMENT */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.environment}
  </h3>

  <select
    name="a_environment"
    defaultValue={leftFilters.a_environment || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Entorno'
        : 'Environment'}
    </option>

    {options.environment?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* TERRAIN */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.terrain}
  </h3>

  <select
    name="a_terrain"
    defaultValue={leftFilters.a_terrain || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Terreno'
        : 'Terrain'}
    </option>

    {options.terrain?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* UTILITIES */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.utilities}
  </h3>

  <select
    name="a_utility"
    defaultValue={leftFilters.a_utility || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Servicios'
        : 'Utilities'}
    </option>

    {options.utility?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{/* ACCESSIBILITY */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.accessibility}
  </h3>

  <select
    name="a_accessibility"
    defaultValue={leftFilters.a_accessibility || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Accesibilidad'
        : 'Accessibility'}
    </option>

    {options.accessibility?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

{leftFilters.a_accessibility ===
  'Unpaved Road to Property' && (

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.distanceToPavedRoad}
    </h3>

    <select
      name="a_distance_to_paved_road_range"
      defaultValue={
        leftFilters.a_distance_to_paved_road_range || ''
      }
      style={select}
    >
      <option value="">
        {t.distanceToPavedRoad}
      </option>

      {pavedRoadDistanceRangeOptions.map(
        option => (
          <option
            key={option.value}
            value={option.value}
          >
            {language === 'es'
              ? option.es
              : option.en}
          </option>
        )
      )}
    </select>

  </div>

)}

{/* LEGAL STATUS */}

<div style={assetSection}>

  <h3 style={assetHeading}>
    {t.legalStatus}
  </h3>

  <select
    name="a_legal_status"
    defaultValue={leftFilters.a_legal_status || ''}
    style={select}
  >
    <option value="">
      {language === 'es'
        ? 'Estado Legal'
        : 'Legal Status'}
    </option>

    {options.legal_status?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

</div>

</div>

      <div style={column}>

  <h2 style={marketHeading}>
    {t.marketB}
  </h2>

  {/* LOCATION */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.location}
    </h3>

    <select
      name="b_province"
      defaultValue={rightFilters.b_province || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Provincia'
          : 'Province'}
      </option>

      {options.province?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

    <select
      name="b_canton"
      defaultValue={rightFilters.b_canton || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Cantón'
          : 'Canton'}
      </option>

      {rightCantons.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

    <select
      name="b_district"
      defaultValue={rightFilters.b_district || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Distrito'
          : 'District'}
      </option>

      {rightDistricts.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  <div style={assetSection}>
    <h3 style={assetHeading}>
      {t.transactionType}
    </h3>

    <select
      name="b_transaction_type"
      defaultValue={
        rightFilters.b_transaction_type || ''
      }
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Transacción'
          : 'Transaction'}
      </option>

      <option value="sale">
        {language === 'es'
          ? 'En Venta'
          : 'For Sale'}
      </option>

      <option value="rent">
        {language === 'es'
          ? 'En Alquiler'
          : 'For Rent'}
      </option>
    </select>
  </div>

  {/* PROPERTY TYPE */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.propertyType}
    </h3>

    <select
      name="b_property_type"
      defaultValue={rightFilters.b_property_type || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Tipo de Propiedad'
          : 'Property Type'}
      </option>

      {options.property_type?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* BEDROOMS */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.bedrooms}
    </h3>

    <select
      name="b_bedrooms"
      defaultValue={rightFilters.b_bedrooms || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Habitaciones'
          : 'Bedrooms'}
      </option>

      {options.bedrooms?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* BATHROOMS */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.bathrooms}
    </h3>

    <select
      name="b_bathrooms"
      defaultValue={rightFilters.b_bathrooms || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Baños'
          : 'Bathrooms'}
      </option>

      {options.bathrooms?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* PARKING */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.parking}
    </h3>

    <select
      name="b_parking"
      defaultValue={rightFilters.b_parking || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Parqueo'
          : 'Parking'}
      </option>

      {options.parking?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* PRICE RANGE */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.priceRange}
    </h3>

    <select
      name="b_price_range"
      defaultValue={rightFilters.b_price_range || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Rango de Precio'
          : 'Price Range'}
      </option>

      <option value="0-25000000">₡0 – ₡25M</option>
      <option value="25000000-50000000">₡25M – ₡50M</option>
      <option value="50000000-100000000">₡50M – ₡100M</option>
      <option value="100000000-250000000">₡100M – ₡250M</option>
      <option value="250000000+">₡250M+</option>

    </select>

  </div>

  {/* PROPERTY AREA */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.propertyArea}
    </h3>

    <select
      name="b_property_area"
      defaultValue={rightFilters.b_property_area || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Área del Terreno'
          : 'Property Area'}
      </option>

      {options.property_area?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* CONSTRUCTION AREA */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.constructionArea}
    </h3>

    <select
      name="b_construction_area"
      defaultValue={rightFilters.b_construction_area || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Área de Construcción'
          : 'Construction Area'}
      </option>

      {options.construction_area?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* YEAR BUILT */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.yearBuilt}
    </h3>

    <select
      name="b_year_built"
      defaultValue={rightFilters.b_year_built || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Año de Construcción'
          : 'Year Built'}
      </option>

      {options.year_built?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* ENVIRONMENT */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.environment}
    </h3>

    <select
      name="b_environment"
      defaultValue={rightFilters.b_environment || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Entorno'
          : 'Environment'}
      </option>

      {options.environment?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* TERRAIN */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.terrain}
    </h3>

    <select
      name="b_terrain"
      defaultValue={rightFilters.b_terrain || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Terreno'
          : 'Terrain'}
      </option>

      {options.terrain?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* UTILITIES */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.utilities}
    </h3>

    <select
      name="b_utility"
      defaultValue={rightFilters.b_utility || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Servicios'
          : 'Utilities'}
      </option>

      {options.utility?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

  {/* ACCESSIBILITY */}

    <div style={assetSection}>

      <h3 style={assetHeading}>
        {t.accessibility}
      </h3>

      <select
        name="b_accessibility"
        defaultValue={rightFilters.b_accessibility || ''}
        style={select}
      >
        <option value="">
          {language === 'es'
            ? 'Accesibilidad'
            : 'Accessibility'}
        </option>

        {options.accessibility?.map((option: any) => (

              <option key={getValue(option)} value={getValue(option)}>

                  {getLabel(option, language)}

              </option>

              ))}
      </select>

    </div>

    {rightFilters.b_accessibility ===
    'Unpaved Road to Property' && (

    <div style={assetSection}>

      <h3 style={assetHeading}>
        {t.distanceToPavedRoad}
      </h3>

      <select
        name="b_distance_to_paved_road_range"
        defaultValue={
          rightFilters.b_distance_to_paved_road_range || ''
        }
        style={select}
      >
        <option value="">
          {t.distanceToPavedRoad}
        </option>

        {pavedRoadDistanceRangeOptions.map(
          option => (
            <option
              key={option.value}
              value={option.value}
            >
              {language === 'es'
                ? option.es
                : option.en}
            </option>
          )
        )}
      </select>

    </div>

  )}

  {/* LEGAL STATUS */}

  <div style={assetSection}>

    <h3 style={assetHeading}>
      {t.legalStatus}
    </h3>

    <select
      name="b_legal_status"
      defaultValue={rightFilters.b_legal_status || ''}
      style={select}
    >
      <option value="">
        {language === 'es'
          ? 'Estado Legal'
          : 'Legal Status'}
      </option>

      {options.legal_status?.map((option: any) => (

            <option key={getValue(option)} value={getValue(option)}>

                {getLabel(option, language)}

            </option>

            ))}
    </select>

  </div>

</div>

            </section>
        <div style={buttonWrap}>

        <button

        type="button"

        onClick={compareMarkets}

        style={compareButton}

        >

        {t.compare}

        </button>

      </div>

    </form>
  )
}

const wrapper = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '3rem',
  marginBottom: '3rem'
}

const column = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1.5rem'
}

const marketHeading = {
  color: '#ff3B00',
  fontSize: '2rem',
  margin: 0
}

const assetSection = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.6rem',
  paddingBottom: '1rem'
}

const assetHeading = {
  color: '#aaa',
  fontSize: '.9rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  margin: '0 0 .25rem 0'
}

const select = {
  background: '#111',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '.5rem',
  padding: '.75rem',
  fontSize: '1rem'
}

const buttonWrap = {
  display: 'flex',
  justifyContent: 'center',
  margin: '2rem 0 3rem'
}

const compareButton = {
  background: '#D4AF37',
  color: '#000',
  border: '1px solid #fff',
  borderRadius: '999rem',
  padding: '1rem 2rem',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer'
}
