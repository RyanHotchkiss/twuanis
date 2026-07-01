import { getMarketStatistics } from '@/lib/statistics-engine'

type BuyerDemandLanguage = 'en' | 'es'

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

type DemandSignal = {
  category: string
  characteristic: string
  withCount: number
  withoutCount: number
  withAveragePrice: number | null
  withoutAveragePrice: number | null
  priceDifference: number | null
  priceDifferencePercent: string | null
  confidence: string
  explanation: string
}

const CRC_TO_USD = 500

const ontologyCategories = [
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'environment',
  'terrain',
  'utility',
  'accessibility',
  'legal_status'
]

function formatCRC(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `₡${Math.round(value).toLocaleString()}`
}

function formatUSD(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return `$${Math.round(value).toLocaleString()}`
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

function normalizeText(value: any) {
  return String(value || '')
    .toLowerCase()
    .trim()
}

function labelize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function getListingPrice(listing: any) {
  if (listing.transaction_type === 'rent') {
    return null
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

function getConfidence(
  withCount: number,
  withoutCount: number,
  language: BuyerDemandLanguage
) {
  const sampleSize =
    Math.min(withCount, withoutCount)

  if (sampleSize >= 50) {
    return language === 'es'
      ? 'Confianza Alta'
      : 'High Confidence'
  }

  if (sampleSize >= 25) {
    return language === 'es'
      ? 'Confianza Moderada'
      : 'Moderate Confidence'
  }

  if (sampleSize >= 10) {
    return language === 'es'
      ? 'Confianza Baja'
      : 'Low Confidence'
  }

  return language === 'es'
    ? 'Confianza Muy Baja'
    : 'Very Low Confidence'
}

function getDifferencePercent(
  withAverage: number | null,
  withoutAverage: number | null
) {
  if (!withAverage || !withoutAverage) return null

  const difference =
    ((withAverage - withoutAverage) / withoutAverage) * 100

  const rounded =
    Math.round(difference)

  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function listingHasCharacteristic(
  listing: any,
  category: string,
  characteristic: string
) {
  const value =
    listing[category]

  if (!value) return false

  if (Array.isArray(value)) {
    return value
      .map(normalizeText)
      .includes(normalizeText(characteristic))
  }

  return normalizeText(value) === normalizeText(characteristic)
}

function getUniqueCharacteristics(
  listings: any[],
  category: string
) {
  const values = new Set<string>()

  listings.forEach((listing: any) => {
    const value = listing[category]

    if (!value) return

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item) values.add(String(item))
      })
    } else {
      values.add(String(value))
    }
  })

  return Array.from(values)
}

function analyzeCharacteristic({
  listings,
  category,
  characteristic,
  language
}: {
  listings: any[]
  category: string
  characteristic: string
  language: BuyerDemandLanguage
}): DemandSignal {
  const withListings =
    listings.filter((listing: any) =>
      listingHasCharacteristic(
        listing,
        category,
        characteristic
      )
    )

  const withoutListings =
    listings.filter((listing: any) =>
      !listingHasCharacteristic(
        listing,
        category,
        characteristic
      )
    )

  const withPrices =
    withListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))

  const withoutPrices =
    withoutListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))

  const withAveragePrice =
    average(withPrices)

  const withoutAveragePrice =
    average(withoutPrices)

  const priceDifference =
    withAveragePrice && withoutAveragePrice
      ? withAveragePrice - withoutAveragePrice
      : null

  const priceDifferencePercent =
    getDifferencePercent(
      withAveragePrice,
      withoutAveragePrice
    )

  const categoryLabel =
    labelize(category)

  const characteristicLabel =
    labelize(characteristic)

  return {
    category: categoryLabel,
    characteristic: characteristicLabel,

    withCount:
      withPrices.length,

    withoutCount:
      withoutPrices.length,

    withAveragePrice,
    withoutAveragePrice,
    priceDifference,
    priceDifferencePercent,

    confidence:
      getConfidence(
        withPrices.length,
        withoutPrices.length,
        language
      ),

    explanation:
      language === 'es'
        ? `Las propiedades con ${characteristicLabel} muestran una diferencia de precio promedio de ${priceDifferencePercent || 'sin datos suficientes'} frente a propiedades comparables sin esta característica.`
        : `Listings with ${characteristicLabel} show an average price difference of ${priceDifferencePercent || 'insufficient data'} compared with listings without this characteristic.`
  }
}


function analyzePair({
  listings,
  firstCategory,
  firstCharacteristic,
  secondCategory,
  secondCharacteristic,
  language
}: {
  listings: any[]
  firstCategory: string
  firstCharacteristic: string
  secondCategory: string
  secondCharacteristic: string
  language: BuyerDemandLanguage
}): DemandSignal {
  const pairLabel =
    `${labelize(firstCharacteristic)} + ${labelize(secondCharacteristic)}`
  const withListings =
    listings.filter((listing: any) =>
      listingHasCharacteristic(
        listing,
        firstCategory,
        firstCharacteristic
      ) &&
      listingHasCharacteristic(
        listing,
        secondCategory,
        secondCharacteristic
      )
    )
  const withoutListings =
    listings.filter((listing: any) =>
      !(
        listingHasCharacteristic(
          listing,
          firstCategory,
          firstCharacteristic
        ) &&
        listingHasCharacteristic(
          listing,
          secondCategory,
          secondCharacteristic
        )
      )
    )
  const withPrices =
    withListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))
  const withoutPrices =
    withoutListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))
  const withAveragePrice =
    average(withPrices)
  const withoutAveragePrice =
    average(withoutPrices)
  const priceDifference =
    withAveragePrice && withoutAveragePrice
      ? withAveragePrice - withoutAveragePrice
      : null
  const priceDifferencePercent =
    getDifferencePercent(
      withAveragePrice,
      withoutAveragePrice
    )
  return {
    category: 'Combination',
    characteristic: pairLabel,
    withCount:
      withPrices.length,
    withoutCount:
      withoutPrices.length,
    withAveragePrice,
    withoutAveragePrice,
    priceDifference,
    priceDifferencePercent,
    confidence:
      getConfidence(
        withPrices.length,
        withoutPrices.length,
        language
      ),
    explanation:
      language === 'es'
        ? `Las propiedades con ${pairLabel} muestran una diferencia de precio promedio de ${priceDifferencePercent || 'sin datos suficientes'} frente al resto del mercado seleccionado.`
        : `Listings with ${pairLabel} show an average price difference of ${priceDifferencePercent || 'insufficient data'} compared with the rest of the selected market.`
  }
}
function analyzeSegment({
  listings,
  segmentCategory,
  segmentCharacteristic,
  targetCategory,
  targetCharacteristic,
  language
}: {
  listings: any[]
  segmentCategory: string
  segmentCharacteristic: string
  targetCategory: string
  targetCharacteristic: string
  language: BuyerDemandLanguage
}): DemandSignal {
  const segmentListings =
    listings.filter((listing: any) =>
      listingHasCharacteristic(
        listing,
        segmentCategory,
        segmentCharacteristic
      )
    )
  const withListings =
    segmentListings.filter((listing: any) =>
      listingHasCharacteristic(
        listing,
        targetCategory,
        targetCharacteristic
      )
    )
  const withoutListings =
    segmentListings.filter((listing: any) =>
      !listingHasCharacteristic(
        listing,
        targetCategory,
        targetCharacteristic
      )
    )
  const withPrices =
    withListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))
  const withoutPrices =
    withoutListings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))
  const withAveragePrice =
    average(withPrices)
  const withoutAveragePrice =
    average(withoutPrices)
  const priceDifference =
    withAveragePrice && withoutAveragePrice
      ? withAveragePrice - withoutAveragePrice
      : null
  const priceDifferencePercent =
    getDifferencePercent(
      withAveragePrice,
      withoutAveragePrice
    )
  const characteristicLabel =
    `${labelize(targetCharacteristic)} among ${labelize(segmentCharacteristic)}`
  return {
    category: 'Segmented Signal',
    characteristic: characteristicLabel,
    withCount:
      withPrices.length,
    withoutCount:
      withoutPrices.length,
    withAveragePrice,
    withoutAveragePrice,
    priceDifference,
    priceDifferencePercent,
    confidence:
      getConfidence(
        withPrices.length,
        withoutPrices.length,
        language
      ),
    explanation:
      language === 'es'
        ? `Dentro del segmento ${labelize(segmentCharacteristic)}, ${labelize(targetCharacteristic)} muestra una diferencia de precio promedio de ${priceDifferencePercent || 'sin datos suficientes'}.`
        : `Within the ${labelize(segmentCharacteristic)} segment, ${labelize(targetCharacteristic)} shows an average price difference of ${priceDifferencePercent || 'insufficient data'}.`
  }
}
function sortSignals(signals: DemandSignal[]) {
  return signals
    .filter(signal => signal.priceDifference !== null)
    .sort(
      (a, b) =>
        Math.abs(b.priceDifference || 0) -
        Math.abs(a.priceDifference || 0)
    )
}
export async function getBuyerDemand(
  filters: MarketFilters,
  language: BuyerDemandLanguage = 'en'
) {
  const market =
    await getMarketStatistics(filters)
  const listings =
    market.listings || []
  const prices =
    listings
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))
  const marketAveragePrice =
    average(prices)
  const marketMedianPrice =
    median(prices)
  const signals: DemandSignal[] = []
  ontologyCategories.forEach(category => {
    const characteristics =
      getUniqueCharacteristics(
        listings,
        category
      )
    characteristics.forEach(characteristic => {
      signals.push(
        analyzeCharacteristic({
          listings,
          category,
          characteristic,
          language
        })
      )
    })
  })
  const pairSignals: DemandSignal[] = []
  ontologyCategories.forEach((firstCategory, firstIndex) => {
    ontologyCategories
      .slice(firstIndex + 1)
      .forEach(secondCategory => {
        const firstCharacteristics =
          getUniqueCharacteristics(
            listings,
            firstCategory
          )
        const secondCharacteristics =
          getUniqueCharacteristics(
            listings,
            secondCategory
          )
        firstCharacteristics.forEach(firstCharacteristic => {
          secondCharacteristics.forEach(secondCharacteristic => {
            pairSignals.push(
              analyzePair({
                listings,
                firstCategory,
                firstCharacteristic,
                secondCategory,
                secondCharacteristic,
                language
              })
            )
          })
        })
      })
  })
  const segmentedSignals: DemandSignal[] = []
  const propertyTypes =
    getUniqueCharacteristics(
      listings,
      'property_type'
    )
  propertyTypes.forEach(propertyType => {
    ontologyCategories
      .filter(category => category !== 'property_type')
      .forEach(targetCategory => {
        const characteristics =
          getUniqueCharacteristics(
            listings,
            targetCategory
          )
        characteristics.forEach(characteristic => {
          segmentedSignals.push(
            analyzeSegment({
              listings,
              segmentCategory: 'property_type',
              segmentCharacteristic: propertyType,
              targetCategory,
              targetCharacteristic: characteristic,
              language
            })
          )
        })
      })
  })
  const sortedSignals =
    sortSignals(signals)
  const sortedPairSignals =
    sortSignals(pairSignals)
  const sortedSegmentedSignals =
    sortSignals(segmentedSignals)
  const strongestSignal =
    sortedSignals[0]
      ? `${sortedSignals[0].characteristic} (${sortedSignals[0].priceDifferencePercent})`
      : null
  return {
    filters,
    sampleSize:
      prices.length,
    marketAveragePriceCRC:
      formatCRC(marketAveragePrice),
    marketAveragePriceUSD:
      marketAveragePrice
        ? formatUSD(marketAveragePrice / CRC_TO_USD)
        : null,
    marketMedianPriceCRC:
      formatCRC(marketMedianPrice),
    marketMedianPriceUSD:
      marketMedianPrice
        ? formatUSD(marketMedianPrice / CRC_TO_USD)
        : null,
    strongestSignal,
    signals:
      sortedSignals.slice(0, 12),
    pairSignals:
      sortedPairSignals.slice(0, 12),
    segmentedSignals:
      sortedSegmentedSignals.slice(0, 12)
  }
}