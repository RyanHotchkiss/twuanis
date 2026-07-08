import { getMarketStatistics } from '@/lib/statistics-engine'

type PricingStrategyLanguage = 'en' | 'es'

type PricingStrategyFilters = {
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

const CRC_TO_USD = 500

function formatCRC(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `₡${Math.round(value).toLocaleString()}`
}

function formatUSD(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `$${Math.round(value).toLocaleString()}`
}

function getConfidence(sampleSize: number, language: PricingStrategyLanguage) {
  if (sampleSize >= 25) {
    return {
      score: 90,
      label: language === 'es' ? 'Confianza Alta' : 'High Confidence'
    }
  }

  if (sampleSize >= 15) {
    return {
      score: 75,
      label: language === 'es' ? 'Confianza Moderada' : 'Moderate Confidence'
    }
  }

  if (sampleSize >= 8) {
    return {
      score: 60,
      label: language === 'es' ? 'Confianza Baja' : 'Low Confidence'
    }
  }

  return {
    score: 35,
    label: language === 'es' ? 'Confianza Muy Baja' : 'Very Low Confidence'
  }
}

function getCopy(language: PricingStrategyLanguage) {
  if (language === 'es') {
    return {
      pricingPosition: 'Basado en los precios actuales del mercado',

      conservative:
        'Use esta estrategia si desea atraer más compradores y reducir el riesgo de sobreprecio.',

      market:
        'Use esta estrategia si desea posicionar la propiedad cerca del precio típico del mercado actual.',

      premium:
        'Use esta estrategia si la propiedad tiene características fuertes y está dispuesto a esperar más tiempo por el comprador correcto.',

      buyerCompetitionHigh: 'Competencia Alta',
      buyerCompetitionMedium: 'Competencia Moderada',
      buyerCompetitionLow: 'Competencia Baja',

      timeFast: 'Más rápido que el promedio',
      timeNormal: 'Ritmo normal del mercado',
      timeSlow: 'Puede tomar más tiempo'
    }
  }

  return {
    pricingPosition: 'Based on current market pricing',

    conservative:
      'Use this strategy if you want to attract more buyers and reduce the risk of overpricing.',

    market:
      'Use this strategy if you want to position the property near the typical price of the current market.',

    premium:
      'Use this strategy if the property has strong characteristics and you are willing to wait longer for the right buyer.',

    buyerCompetitionHigh: 'High Competition',
    buyerCompetitionMedium: 'Moderate Competition',
    buyerCompetitionLow: 'Low Competition',

    timeFast: 'Faster than average',
    timeNormal: 'Normal market pace',
    timeSlow: 'May take longer'
  }
}

function getListingPrice(listing: any) {
      const price =
        listing.transaction_type === 'rent'
          ? Number(listing.monthly_price)
          : Number(listing.current_price)

      if (!price || Number.isNaN(price)) {
        return null
      }

      if (listing.currency === 'USD') {
        return price * CRC_TO_USD
      }

      return price
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

function decorateListing(listing: any) {
  const price = getListingPrice(listing)

  return {
    ...listing,

    images:
      parseImages(listing.images),

    formattedPrice:
      price
        ? listing.currency === 'USD'
          ? formatUSD(price)
          : formatCRC(price)
        : null
  }
}

export async function getPricingStrategy(
  filters: PricingStrategyFilters,
  language: PricingStrategyLanguage = 'en'
) {
  const copy = getCopy(language)

  const market = await getMarketStatistics(filters)

  const listings = market.listings || []

  const prices =
    listings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))

  const sampleSize =
    prices.length

  const averagePrice =
  normalizePrice(average(prices))

    const medianPrice =
    normalizePrice(median(prices))

    const recommendedPrice =
    medianPrice || averagePrice

  function normalizePrice(value: number | null) {
        if (value === null || Number.isNaN(value)) return null

        if (value < 100000) {
        return value * 1000
        }

        return value
        }

  const conservativePrice =
    recommendedPrice
      ? recommendedPrice * 0.95
      : null

  const premiumPrice =
    recommendedPrice
      ? recommendedPrice * 1.08
      : null

  let buyerCompetition =
    copy.buyerCompetitionLow

  let expectedTimeOnMarket =
    copy.timeSlow

  if (sampleSize >= 15) {
    buyerCompetition = copy.buyerCompetitionHigh
    expectedTimeOnMarket = copy.timeFast
  } else if (sampleSize >= 6) {
    buyerCompetition = copy.buyerCompetitionMedium
    expectedTimeOnMarket = copy.timeNormal
  }

  return {
    filters,

    summary: {
      conservativePriceCRC:
        formatCRC(conservativePrice),

      conservativePriceUSD:
        conservativePrice
          ? formatUSD(conservativePrice / CRC_TO_USD)
          : null,

      recommendedPriceCRC:
        formatCRC(recommendedPrice),

      recommendedPriceUSD:
        recommendedPrice
          ? formatUSD(recommendedPrice / CRC_TO_USD)
          : null,

      premiumPriceCRC:
        formatCRC(premiumPrice),

      premiumPriceUSD:
        premiumPrice
          ? formatUSD(premiumPrice / CRC_TO_USD)
          : null,

      pricingPosition:
        copy.pricingPosition
    },

    strategy: {
      conservative:
        copy.conservative,

      market:
        copy.market,

      premium:
        copy.premium
    },

    marketSignals: {
      medianPriceCRC:
        formatCRC(medianPrice),

      medianPriceUSD:
        medianPrice
          ? formatUSD(medianPrice / CRC_TO_USD)
          : null,

      averagePriceCRC:
        formatCRC(averagePrice),

      averagePriceUSD:
        averagePrice
          ? formatUSD(averagePrice / CRC_TO_USD)
          : null,

      buyerCompetition,

      expectedTimeOnMarket
    },

    confidence:
      getConfidence(sampleSize, language),

    sampleSize,

    comparables:
      listings
        .map(decorateListing)
        .filter((listing: any) => listing.formattedPrice)
        .slice(0, 6)
  }
}