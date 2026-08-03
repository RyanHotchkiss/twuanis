import { getMarketStatistics } from '@/lib/statistics-engine'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

type PriceMeterLanguage = 'en' | 'es'

type MarketFilters = {
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

const SQM_TO_SQFT = 10.7639
const CRC_TO_USD = 500

function formatCRC(value: number | null, suffix = '') {
  if (value === null || Number.isNaN(value)) return null

  return `₡${Math.round(value).toLocaleString()}${suffix}`
}

function formatUSD(value: number | null, suffix = '') {
  if (value === null || Number.isNaN(value)) return null

  return `$${Math.round(value).toLocaleString()}${suffix}`
}

function average(values: number[]) {
  if (!values.length) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]) {
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function lowest(values: number[]) {
  if (!values.length) return null

  return Math.min(...values)
}

function highest(values: number[]) {
  if (!values.length) return null

  return Math.max(...values)
}

function pricePerFt2(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return value / SQM_TO_SQFT
}

function getConfidence(
  sampleSize: number,
  language: PriceMeterLanguage
) {
  if (sampleSize >= 25) {
    return {
      score: 90,
      label:
        language === 'es'
          ? 'Confianza Alta'
          : 'High Confidence'
    }
  }

  if (sampleSize >= 15) {
    return {
      score: 75,
      label:
        language === 'es'
          ? 'Confianza Moderada'
          : 'Moderate Confidence'
    }
  }

  if (sampleSize >= 8) {
    return {
      score: 60,
      label:
        language === 'es'
          ? 'Confianza Baja'
          : 'Low Confidence'
    }
  }

  return {
    score: 35,
    label:
      language === 'es'
        ? 'Confianza Muy Baja'
        : 'Very Low Confidence'
  }
}

function getListingPrice(listing: any) {
      const price =
        listing.transaction_type === 'rent'
          ? Number(listing.monthly_price)
          : Number(listing.current_price)

      if (!price || Number.isNaN(price)) return null

      if (listing.currency === 'USD') {
        return price * CRC_TO_USD
      }

      return price
    }

    function parseArea(value: any) {
            if (!value) return null

            const text = String(value)
              .replace(/,/g, '')
              .trim()

            const isHectares = /hect/i.test(text)

            const numbers =
              text.match(/\d+(\.\d+)?/g)

            if (!numbers?.length) return null

            const area =
              numbers.length === 1
                ? Number(numbers[0])
                : (
                    Number(numbers[0]) +
                    Number(numbers[1])
                  ) / 2

            return isHectares
              ? area * 10000
              : area
          }

function decorateListing(listing: any) {
  const price = getListingPrice(listing)

    const propertyArea = parseArea(listing.property_area)

    const constructionArea = parseArea(listing.construction_area)

  const pricePerLandM2 =
    price && propertyArea
      ? price / propertyArea
      : null

  const pricePerConstructionM2 =
    price && constructionArea
      ? price / constructionArea
      : null

  return {
    ...listing,
    
    images:
      resolveListingImages(
        listing.images
      ),

   formattedPrice:
      price
        ? listing.currency === 'USD'
          ? formatUSD(price)
          : formatCRC(price)
        : null,

    pricePerLandM2:
      formatCRC(pricePerLandM2, ' / m²'),

    pricePerLandFt2:
      formatCRC(pricePerFt2(pricePerLandM2), ' / ft²'),

    pricePerConstructionM2:
      formatCRC(pricePerConstructionM2, ' / m²'),

    pricePerConstructionFt2:
      formatCRC(pricePerFt2(pricePerConstructionM2), ' / ft²')
  }
}

export async function getPriceMeterAnalysis(
  filters: MarketFilters,
  language: PriceMeterLanguage = 'en'
) {
  const market = await getMarketStatistics(filters)

  const listings = market.listings || []

  const decoratedListings =
    listings.map(decorateListing)

 const landOnlyPrices: number[] = []
  const constructionOnlyPrices: number[] = []
  const mixedLandPrices: number[] = []
  const mixedConstructionPrices: number[] = []
  const mixedConstructionToLandRatios: number[] = []

  for (const listing of decoratedListings) {
    const price = getListingPrice(listing)
    const landArea = parseArea(listing.property_area)
    const constructionArea = parseArea(listing.construction_area)

    if (!price) continue

    if (landArea && !constructionArea) {
      landOnlyPrices.push(price / landArea)
    }

    if (constructionArea && !landArea) {
      constructionOnlyPrices.push(price / constructionArea)
    }

    if (landArea && constructionArea) {
      mixedLandPrices.push(price / landArea)
      mixedConstructionPrices.push(price / constructionArea)
      mixedConstructionToLandRatios.push(constructionArea / landArea)
    }
  }

  const averageLandM2 = average(landOnlyPrices)
  const medianLandM2 = median(landOnlyPrices)

  const averageConstructionM2 = average(constructionOnlyPrices)
  const medianConstructionM2 = median(constructionOnlyPrices)

  const averageMixedLandM2 = average(mixedLandPrices)
  const medianMixedLandM2 = median(mixedLandPrices)

  const averageMixedConstructionM2 = average(mixedConstructionPrices)
  const medianMixedConstructionM2 = median(mixedConstructionPrices)

  const averageMixedConstructionToLandRatio =
    average(mixedConstructionToLandRatios)

  const medianMixedConstructionToLandRatio =
    median(mixedConstructionToLandRatios)

  const lowestLandM2 = lowest(landOnlyPrices)
  const highestLandM2 = highest(landOnlyPrices)

  const lowestConstructionM2 = lowest(constructionOnlyPrices)
  const highestConstructionM2 = highest(constructionOnlyPrices)

  const lowestMixedLandM2 = lowest(mixedLandPrices)
  const highestMixedLandM2 = highest(mixedLandPrices)

  const lowestMixedConstructionM2 = lowest(mixedConstructionPrices)
  const highestMixedConstructionM2 = highest(mixedConstructionPrices)

  const sampleSize =
    landOnlyPrices.length +
    constructionOnlyPrices.length +
    mixedLandPrices.length

console.log(
  'PRICE METER DEBUG',
  listings.slice(0, 5).map((listing: any) => ({
    title: listing.title,
    transaction_type: listing.transaction_type,
    current_price: listing.current_price,
    monthly_price: listing.monthly_price,
    property_area: listing.property_area,
    construction_area: listing.construction_area,
    calculated_price: getListingPrice(listing),
    currency: listing.currency
  }))
)

  return {
    filters,

    summary: {
      averagePricePerLandM2:
        formatCRC(averageLandM2, ' / m²'),

      averagePricePerLandFt2:
        formatCRC(pricePerFt2(averageLandM2), ' / ft²'),

      medianPricePerLandM2:
        formatCRC(medianLandM2, ' / m²'),

      medianPricePerLandFt2:
        formatCRC(pricePerFt2(medianLandM2), ' / ft²'),

      averagePricePerConstructionM2:
        formatCRC(averageConstructionM2, ' / m²'),

      averagePricePerConstructionFt2:
        formatCRC(pricePerFt2(averageConstructionM2), ' / ft²'),

      medianPricePerConstructionM2:
        formatCRC(medianConstructionM2, ' / m²'),

      medianPricePerConstructionFt2:
        formatCRC(pricePerFt2(medianConstructionM2), ' / ft²'),

      averageMixedPricePerLandM2:
        formatCRC(averageMixedLandM2, ' / m²'),

      averageMixedPricePerLandFt2:
        formatCRC(pricePerFt2(averageMixedLandM2), ' / ft²'),

      medianMixedPricePerLandM2:
        formatCRC(medianMixedLandM2, ' / m²'),

      medianMixedPricePerLandFt2:
        formatCRC(pricePerFt2(medianMixedLandM2), ' / ft²'),

      averageMixedPricePerConstructionM2:
        formatCRC(averageMixedConstructionM2, ' / m²'),

      averageMixedPricePerConstructionFt2:
        formatCRC(pricePerFt2(averageMixedConstructionM2), ' / ft²'),

      medianMixedPricePerConstructionM2:
        formatCRC(medianMixedConstructionM2, ' / m²'),

      medianMixedPricePerConstructionFt2:
        formatCRC(pricePerFt2(medianMixedConstructionM2), ' / ft²'),

      averageMixedConstructionToLandRatio:
        averageMixedConstructionToLandRatio === null
          ? null
          : `${Math.round(averageMixedConstructionToLandRatio * 100)}%`,

      medianMixedConstructionToLandRatio:
        medianMixedConstructionToLandRatio === null
          ? null
          : `${Math.round(medianMixedConstructionToLandRatio * 100)}%`,

      landOnlySampleSize:
        landOnlyPrices.length,

      constructionOnlySampleSize:
        constructionOnlyPrices.length,

      mixedSampleSize:
        mixedLandPrices.length
    },

    breakdown: {
      lowestPricePerLandM2:
        formatCRC(lowestLandM2, ' / m²'),

      lowestPricePerLandFt2:
        formatCRC(pricePerFt2(lowestLandM2), ' / ft²'),

      highestPricePerLandM2:
        formatCRC(highestLandM2, ' / m²'),

      highestPricePerLandFt2:
        formatCRC(pricePerFt2(highestLandM2), ' / ft²'),

      lowestPricePerConstructionM2:
        formatCRC(lowestConstructionM2, ' / m²'),

      lowestPricePerConstructionFt2:
        formatCRC(pricePerFt2(lowestConstructionM2), ' / ft²'),

      highestPricePerConstructionM2:
        formatCRC(highestConstructionM2, ' / m²'),

      highestPricePerConstructionFt2:
        formatCRC(pricePerFt2(highestConstructionM2), ' / ft²'),

      lowestMixedPricePerLandM2:
        formatCRC(lowestMixedLandM2, ' / m²'),

      lowestMixedPricePerLandFt2:
        formatCRC(pricePerFt2(lowestMixedLandM2), ' / ft²'),

      highestMixedPricePerLandM2:
        formatCRC(highestMixedLandM2, ' / m²'),

      highestMixedPricePerLandFt2:
        formatCRC(pricePerFt2(highestMixedLandM2), ' / ft²'),

      lowestMixedPricePerConstructionM2:
        formatCRC(lowestMixedConstructionM2, ' / m²'),

      lowestMixedPricePerConstructionFt2:
        formatCRC(pricePerFt2(lowestMixedConstructionM2), ' / ft²'),

      highestMixedPricePerConstructionM2:
        formatCRC(highestMixedConstructionM2, ' / m²'),

      highestMixedPricePerConstructionFt2:
        formatCRC(pricePerFt2(highestMixedConstructionM2), ' / ft²')
    },

    confidence:
      getConfidence(sampleSize, language),

    sampleSize,

    listings:
      decoratedListings
  }
}