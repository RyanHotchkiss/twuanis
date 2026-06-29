import { getMarketStatistics } from '@/lib/statistics-engine'
import { getComparableListings } from '@/lib/comparables-engine'

import {
  getValuationConfidenceScore,
  getConfidenceLabel
} from '@/lib/valuation-confidence-engine'

type ValuationLanguage = 'en' | 'es'

type ValuationFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string

  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string

  year_built?: string

  property_area?: string
  construction_area?: string

  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  legal_status?: string
}

const valuationCopy = {
  en: {
    comingSoon: 'Coming soon',

    strengths: {
      hasComparables:
        'Comparable listings were found for this market.',
      hasProvince:
        'The valuation is grounded in a selected province.',
      hasCanton:
        'The valuation includes canton-level market context.',
      hasDistrict:
        'The valuation includes district-level market context.',
      hasPropertyType:
        'The valuation includes property-type context.'
    },

    weaknesses: {
      smallSample:
        'The valuation is based on a small sample size.',
      noPropertyType:
        'No property type was selected, so the estimate is broader.',
      noConstructionArea:
        'Construction area was not provided, limiting price-per-m² precision.',
      noPropertyArea:
        'Property area was not provided, limiting land-value precision.'
    },

    notes: [
      'This first valuation model uses current listing data, market statistics, and comparable inventory.',
      'Accuracy will improve as more listings, historical observations, and source coverage are added.'
    ]
  },

  es: {
    comingSoon: 'Próximamente',

    strengths: {
      hasComparables:
        'Se encontraron propiedades comparables para este mercado.',
      hasProvince:
        'La valoración está basada en una provincia seleccionada.',
      hasCanton:
        'La valoración incluye contexto de mercado a nivel de cantón.',
      hasDistrict:
        'La valoración incluye contexto de mercado a nivel de distrito.',
      hasPropertyType:
        'La valoración incluye contexto por tipo de propiedad.'
    },

    weaknesses: {
      smallSample:
        'La valoración se basa en una muestra pequeña.',
      noPropertyType:
        'No se seleccionó un tipo de propiedad, por lo que la estimación es más amplia.',
      noConstructionArea:
        'No se proporcionó el área de construcción, lo que limita la precisión del precio por m².',
      noPropertyArea:
        'No se proporcionó el área del terreno, lo que limita la precisión del valor del terreno.'
    },

    notes: [
      'Este primer modelo de valoración utiliza datos actuales de propiedades, estadísticas del mercado e inventario comparable.',
      'La precisión mejorará a medida que se agreguen más propiedades, observaciones históricas y mayor cobertura de fuentes.'
    ]
  }
}

function formatCRC(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `₡${Math.round(value).toLocaleString()}`
}

function formatUSD(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `$${Math.round(value).toLocaleString()}`
}

function calculateRange(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return {
      low: null,
      likely: null,
      high: null
    }
  }

  return {
    low: value * 0.9,
    likely: value,
    high: value * 1.1
  }
}

export async function getValuation(
  filters: ValuationFilters,
  language: ValuationLanguage = 'en'
) {
  const copy = valuationCopy[language]

  const market = await getMarketStatistics(filters)

  const stats = market.statistics
  const listings = market.listings || []

  const averageSalePrice = stats.averageSalePrice
    ? Number(stats.averageSalePrice) * 1000000
    : null

  const medianSalePrice = stats.medianSalePrice
    ? Number(stats.medianSalePrice) * 1000000
    : null

  const estimatedMarketValue =
    medianSalePrice || averageSalePrice || null

  const saleRange =
    calculateRange(estimatedMarketValue)

  const estimatedRentalValue =
    stats.medianRentCRC ||
    stats.averageRentCRC ||
    null

  const rentalRange =
    calculateRange(
      estimatedRentalValue
        ? Number(estimatedRentalValue)
        : null
    )

  const sampleSize =
    listings.length || 0

  const confidenceScore =
    getValuationConfidenceScore({
      sampleSize,
      hasProvince: Boolean(filters.province),
      hasCanton: Boolean(filters.canton),
      hasDistrict: Boolean(filters.district),
      hasPropertyType: Boolean(filters.property_type),
      hasBedrooms: Boolean(filters.bedrooms),
      hasBathrooms: Boolean(filters.bathrooms),
      hasPropertyArea: Boolean(filters.property_area),
      hasConstructionArea: Boolean(filters.construction_area),
      hasRecentListings: sampleSize > 0
    })

  const confidenceLabel =
    getConfidenceLabel(confidenceScore, language)

  return {
    filters,

    summary: {
      estimatedMarketValueCRC:
        formatCRC(estimatedMarketValue),

      estimatedMarketValueUSD:
        estimatedMarketValue
          ? formatUSD(estimatedMarketValue / 500)
          : null,

      confidenceScore:
        `${confidenceScore}%`,

      confidenceLabel,

      estimatedSalePriceCRC:
        formatCRC(estimatedMarketValue),

      estimatedSalePriceUSD:
        estimatedMarketValue
          ? formatUSD(estimatedMarketValue / 500)
          : null,

      estimatedRentalValueCRC:
        estimatedRentalValue
          ? formatCRC(Number(estimatedRentalValue))
          : null,

      estimatedRentalValueUSD:
        estimatedRentalValue
          ? formatUSD(Number(estimatedRentalValue) / 500)
          : null
    },

    pricingSignals: {
      pricePerM2:
        stats.averagePricePerM2
          ? formatCRC(Number(stats.averagePricePerM2))
          : null,

      marketPercentile:
        copy.comingSoon,

      daysOnMarketEstimate:
        copy.comingSoon,

      pricePosition:
        copy.comingSoon
    },

    recommendedRange: {
      lowCRC:
        formatCRC(saleRange.low),

      likelyCRC:
        formatCRC(saleRange.likely),

      highCRC:
        formatCRC(saleRange.high),

      lowUSD:
        saleRange.low
          ? formatUSD(saleRange.low / 500)
          : null,

      likelyUSD:
        saleRange.likely
          ? formatUSD(saleRange.likely / 500)
          : null,

      highUSD:
        saleRange.high
          ? formatUSD(saleRange.high / 500)
          : null
    },

    rentalRange: {
      lowCRC:
        formatCRC(rentalRange.low),

      likelyCRC:
        formatCRC(rentalRange.likely),

      highCRC:
        formatCRC(rentalRange.high)
    },

    comparables:
      getComparableListings(
        listings,
        filters,
        6
      ),

    explanation: {
      strengths: [
        sampleSize > 0
          ? copy.strengths.hasComparables
          : null,

        filters.province
          ? copy.strengths.hasProvince
          : null,

        filters.canton
          ? copy.strengths.hasCanton
          : null,

        filters.district
          ? copy.strengths.hasDistrict
          : null,

        filters.property_type
          ? copy.strengths.hasPropertyType
          : null
      ].filter(Boolean),

      weaknesses: [
        sampleSize < 8
          ? copy.weaknesses.smallSample
          : null,

        !filters.property_type
          ? copy.weaknesses.noPropertyType
          : null,

        !filters.construction_area
          ? copy.weaknesses.noConstructionArea
          : null,

        !filters.property_area
          ? copy.weaknesses.noPropertyArea
          : null
      ].filter(Boolean),

      notes: copy.notes
    },

    sampleSize
  }
}