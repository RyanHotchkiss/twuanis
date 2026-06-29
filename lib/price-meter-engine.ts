import { getMarketStatistics } from '@/lib/statistics-engine'

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

function parseImages(value: any) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      return []
    }
  }

  return []
}

function getListingPrice(listing: any) {
  if (listing.transaction_type === 'rent') {
    return listing.monthly_price
      ? Number(listing.monthly_price)
      : null
  }

  if (
    listing.price_millions === null ||
    listing.price_millions === undefined
  ) {
    return null
  }

  const priceMillions = Number(listing.price_millions)

  if (!priceMillions || Number.isNaN(priceMillions)) {
    return null
  }

  if (listing.currency === 'USD') {
    return priceMillions * 1000000 * CRC_TO_USD
  }

  const priceCRC = priceMillions * 1000000

if (priceCRC < 10000000) {
  return null
}

return priceCRC
}

function parseArea(value: any) {
  if (value === null || value === undefined) return null

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')

  const number = Number(cleaned)

  if (!number || Number.isNaN(number)) return null

  return number
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

    parseImages(listing.images),

    formattedPrice:
      price ? formatCRC(price) : null,

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

  const landPrices =
    decoratedListings
      .map((listing: any) => {
        const price = getListingPrice(listing)
        const area = parseArea(listing.property_area)

        return price && area ? price / area : null
      })
      .filter((value: number | null): value is number => Boolean(value))

  const constructionPrices =
    decoratedListings
      .map((listing: any) => {
        const price = getListingPrice(listing)
        const area = parseArea(listing.construction_area)

        return price && area ? price / area : null
      })
      .filter((value: number | null): value is number => Boolean(value))

  const averageLandM2 = average(landPrices)
  const medianLandM2 = median(landPrices)

  const averageConstructionM2 =
    average(constructionPrices)

  const medianConstructionM2 =
    median(constructionPrices)

  const lowestLandM2 = lowest(landPrices)
  const highestLandM2 = highest(landPrices)

  const lowestConstructionM2 =
    lowest(constructionPrices)

  const highestConstructionM2 =
    highest(constructionPrices)

  const sampleSize =
    Math.max(
      landPrices.length,
      constructionPrices.length
    )

console.log(
  'PRICE METER DEBUG',
  listings.slice(0, 5).map((listing: any) => ({
    title: listing.title,
    transaction_type: listing.transaction_type,
    price_millions: listing.price_millions,
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
        formatCRC(pricePerFt2(medianConstructionM2), ' / ft²')
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
        formatCRC(pricePerFt2(highestConstructionM2), ' / ft²')
    },

    confidence:
      getConfidence(sampleSize, language),

    sampleSize,

    listings:
      decoratedListings
  }
}