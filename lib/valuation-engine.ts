import { getMarketStatistics } from '@/lib/statistics-engine'
import { getComparableListings } from '@/lib/comparables-engine'

import {
  convertCrcToUsd
} from '@/lib/currency-conversion'

import {
  resolveListingAmountCrc,
  type ListingMonetaryInput
} from '@/lib/listing-monetary-value'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

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
  distance_to_paved_road_range?: string
  legal_status?: string

    subjectListing?: ListingMonetaryInput
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

const marketFilters = {
  transaction_type: filters.transaction_type,
  province: filters.province,
  canton: filters.canton,
  district: filters.district,
  property_type: filters.property_type,
  bedrooms: filters.bedrooms,
  bathrooms: filters.bathrooms,
  parking: filters.parking,
  year_built: filters.year_built,
  property_area: filters.property_area,
  construction_area: filters.construction_area,
  utility: filters.utility,
  environment: filters.environment,
  terrain: filters.terrain,
  accessibility: filters.accessibility,
  distance_to_paved_road_range:
    filters.distance_to_paved_road_range,
  legal_status: filters.legal_status,
}

  const marketCandidates = [
    marketFilters,

    {
      transaction_type: filters.transaction_type,
      province: filters.province,
      canton: filters.canton,
      property_type: filters.property_type
    },

    {
      transaction_type: filters.transaction_type,
      province: filters.province,
      property_type: filters.property_type
    },

    {
      transaction_type: filters.transaction_type,
      province: filters.province,
      canton: filters.canton
    },

    {
      transaction_type: filters.transaction_type,
      province: filters.province
    },

    {
      transaction_type: filters.transaction_type
    }
  ]

  const analyticalContext =
  await resolveMarketAnalyticalContext()

  const markets =
    await Promise.all(
      marketCandidates.map(candidate =>
        getMarketStatistics(
          candidate,
          analyticalContext
        )
      )
    )

  const market =
    markets.find(candidate =>
      candidate.listings?.length > 0 &&
      (
        candidate.statistics.averageSalePrice ||
        candidate.statistics.medianSalePrice ||
        candidate.statistics.averageRentCRC ||
        candidate.statistics.medianRentCRC
      )
    ) || markets[0]

  const usdToCrcRate =
  analyticalContext.fx.rate

  const stats = market.statistics
  const listings = market.listings || []

  const isRent =
  filters.transaction_type === 'rent'

  const averageSalePrice = stats.averageSalePrice
    ? Number(stats.averageSalePrice)
    : null

  const medianSalePrice = stats.medianSalePrice
    ? Number(stats.medianSalePrice)
    : null

    const estimatedMarketValue =
      medianSalePrice ||
      averageSalePrice ||
      null

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
    
    const marketDifference =
      estimatedMarketValue && medianSalePrice
        ? (
            (estimatedMarketValue - medianSalePrice) /
            medianSalePrice
          ) * 100
        : null 

       const comparisonPrice =
      filters.subjectListing
        ? resolveListingAmountCrc(
            filters.subjectListing,
            usdToCrcRate
          )
        : null

    const comparisonTarget =
      isRent
        ? Number(estimatedRentalValue)
        : estimatedMarketValue

        const comparisonDifference =
      comparisonPrice !== null &&
      comparisonTarget !== null &&
      Number.isFinite(comparisonTarget) &&
      comparisonTarget > 0
        ? (
            (
              comparisonPrice -
              comparisonTarget
            ) /
            comparisonTarget
          ) * 100
        : marketDifference

    const pricePosition =
      comparisonDifference === null
        ? null
        : language === 'es'
          ? comparisonDifference < -10
            ? 'Por Debajo del Mercado'
            : comparisonDifference > 10
              ? 'Por Encima del Mercado'
              : 'Valor Justo'
          : comparisonDifference < -10
            ? 'Underpriced'
            : comparisonDifference > 10
              ? 'Overpriced'
              : 'Fair Value'

    const marketPercentile =
      marketDifference === null
        ? null
        : marketDifference < -20
          ? '25th Percentile'
          : marketDifference < -10
            ? '40th Percentile'
            : marketDifference < 10
              ? '50th Percentile'
              : marketDifference < 20
                ? '75th Percentile'
                : '90th Percentile'

  const saleRange =
    calculateRange(estimatedMarketValue)

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

      const activeRange =
  isRent
    ? rentalRange
    : saleRange

  return {
    filters,

    summary: {
      estimatedMarketValueCRC:
        isRent
          ? formatCRC(Number(estimatedRentalValue))
          : formatCRC(estimatedMarketValue),

      estimatedMarketValueUSD:
        isRent && estimatedRentalValue
          ? formatUSD(
              convertCrcToUsd(
                Number(estimatedRentalValue),
                usdToCrcRate
              )
            )
          : estimatedMarketValue
            ? formatUSD(
                convertCrcToUsd(
                  estimatedMarketValue,
                  usdToCrcRate
                )
              )
            : null,

      confidenceScore:
        `${confidenceScore}%`,

      confidenceLabel,

      estimatedSalePriceCRC:
        formatCRC(estimatedMarketValue),

      estimatedSalePriceUSD:
        estimatedMarketValue
          ? formatUSD(
              convertCrcToUsd(
                estimatedMarketValue,
                usdToCrcRate
              )
            )
          : null,

      estimatedRentalValueCRC:
        estimatedRentalValue
          ? formatCRC(Number(estimatedRentalValue))
          : null,

      estimatedRentalValueUSD:
        estimatedRentalValue
          ? formatUSD(
              convertCrcToUsd(
                Number(estimatedRentalValue),
                usdToCrcRate
              )
            )
          : null
    },

        pricingSignals: {
          pricePerM2: null,

        marketPercentile:
          marketPercentile,

        daysOnMarketEstimate:
          'Requires Twuanis historical listing data',

        pricePosition:
          pricePosition
      },

    recommendedRange: {
        lowCRC:
          formatCRC(activeRange.low),

        likelyCRC:
          formatCRC(activeRange.likely),

        highCRC:
          formatCRC(activeRange.high),

        lowUSD:
          activeRange.low
            ? formatUSD(
                convertCrcToUsd(
                  activeRange.low,
                  usdToCrcRate
                )
              )
            : null,

        likelyUSD:
          activeRange.likely
            ? formatUSD(
                convertCrcToUsd(
                  activeRange.likely,
                  usdToCrcRate
                )
              )
            : null,

        highUSD:
          activeRange.high
            ? formatUSD(
                convertCrcToUsd(
                  activeRange.high,
                  usdToCrcRate
                )
              )
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