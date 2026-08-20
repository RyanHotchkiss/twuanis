import { getMarketStatistics } from '@/lib/statistics-engine'

type Language = 'en' | 'es'

type SideFilters = Record<string, string | undefined>

const CRC_TO_USD = 500

function formatCRC(value: number | null) {
  if (value === null || Number.isNaN(value)) return null
  return `₡${Math.round(value).toLocaleString()}`
}

function formatUSD(value: number | null) {
  if (value === null || Number.isNaN(value)) return null
  return `$${Math.round(value).toLocaleString()}`
}

function formatM2(value: number | null) {
  if (value === null || Number.isNaN(value)) return null
  return `${Math.round(value).toLocaleString()} m²`
}

function normalizeSideFilters(
  sideFilters: SideFilters,
  prefix: 'a' | 'b'
) {
  return {
    transaction_type:
      sideFilters[
        `${prefix}_transaction_type`
      ],

    province:
      sideFilters[
        `${prefix}_province`
      ],
    canton: sideFilters[`${prefix}_canton`],
    district: sideFilters[`${prefix}_district`],
    property_type: sideFilters[`${prefix}_property_type`],
    bedrooms: sideFilters[`${prefix}_bedrooms`],
    bathrooms: sideFilters[`${prefix}_bathrooms`],
    parking: sideFilters[`${prefix}_parking`],
    property_area: sideFilters[`${prefix}_property_area`],
    construction_area: sideFilters[`${prefix}_construction_area`],
    year_built: sideFilters[`${prefix}_year_built`],
    environment: sideFilters[`${prefix}_environment`],
    terrain: sideFilters[`${prefix}_terrain`],
    utility: sideFilters[`${prefix}_utility`],
    accessibility: sideFilters[`${prefix}_accessibility`],
    distance_to_paved_road_range:
      sideFilters[
        `${prefix}_distance_to_paved_road_range`
      ],
    legal_status: sideFilters[`${prefix}_legal_status`]
  }
}

function parsePriceRange(value?: string) {
  if (!value) return null

  if (value.endsWith('+')) {
    return {
      min: Number(value.replace('+', '')),
      max: null
    }
  }

  const [min, max] = value
    .split('-')
    .map(Number)

  return { min, max }
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

  if (priceCRC < 10000000) return null

  return priceCRC
}

function parseNumber(value: unknown): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized =
    value
      .replace(/,/g, '')
      .replace(/\s*m²\s*$/i, '')
      .trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null
  }

  const number = Number(normalized)

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null
  }

  return number
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

function mostCommon(values: any[]) {
  const counts: Record<string, number> = {}

  values
    .filter(Boolean)
    .forEach(value => {
      const key = String(value)
      counts[key] = (counts[key] || 0) + 1
    })

  const entries = Object.entries(counts)

  if (!entries.length) return null

  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function applyPriceRange(listings: any[], priceRange?: string) {
  const range = parsePriceRange(priceRange)

  if (!range) return listings

  return listings.filter((listing) => {
    const price = getListingPrice(listing)

    if (!price) return false

    if (range.max === null) {
      return price >= range.min
    }

    return price >= range.min && price <= range.max
  })
}

async function analyzeMarket(
  sideFilters: SideFilters,
  prefix: 'a' | 'b'
) {
  const filters =
    normalizeSideFilters(sideFilters, prefix)

  const market =
    await getMarketStatistics(filters)

  const listings =
    applyPriceRange(
      market.listings || [],
      sideFilters[`${prefix}_price_range`]
    )

  const salePrices =
    listings
      .filter((listing: any) => listing.transaction_type !== 'rent')
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))

  const rentPrices =
    listings
      .filter((listing: any) => listing.transaction_type === 'rent')
      .map(getListingPrice)
      .filter((value: number | null): value is number => Boolean(value))

  const propertyAreas =
    listings
      .map((listing: any) => parseNumber(listing.property_area))
      .filter((value: number | null): value is number => Boolean(value))

  const constructionAreas =
    listings
      .map((listing: any) => parseNumber(listing.construction_area))
      .filter((value: number | null): value is number => Boolean(value))

  const averageSalePrice =
    average(salePrices)

  const medianSalePrice =
    median(salePrices)

  const averageRent =
    average(rentPrices)

  const medianRent =
    median(rentPrices)

  const averagePropertyArea =
    average(propertyAreas)

  const averageConstructionArea =
    average(constructionAreas)

  return {
    filters,

    sampleSize:
      listings.length,

    averageSalePriceCRC:
      formatCRC(averageSalePrice),

    averageSalePriceUSD:
      averageSalePrice
        ? formatUSD(averageSalePrice / CRC_TO_USD)
        : null,

    medianSalePriceCRC:
      formatCRC(medianSalePrice),

    medianSalePriceUSD:
      medianSalePrice
        ? formatUSD(medianSalePrice / CRC_TO_USD)
        : null,

    averageRentCRC:
      formatCRC(averageRent),

    averageRentUSD:
      averageRent
        ? formatUSD(averageRent / CRC_TO_USD)
        : null,

    medianRentCRC:
      formatCRC(medianRent),

    medianRentUSD:
      medianRent
        ? formatUSD(medianRent / CRC_TO_USD)
        : null,

    averagePropertyArea:
      formatM2(averagePropertyArea),

    averageConstructionArea:
      formatM2(averageConstructionArea),

    topPropertyType:
      mostCommon(listings.map((listing: any) => listing.property_type)),

    topEnvironment:
      mostCommon(listings.map((listing: any) => listing.environment)),

    topTerrain:
      mostCommon(listings.map((listing: any) => listing.terrain)),

    topUtility:
      mostCommon(listings.map((listing: any) => listing.utility)),

    topAccessibility:
      mostCommon(listings.map((listing: any) => listing.accessibility)),

    topLegalStatus:
      mostCommon(listings.map((listing: any) => listing.legal_status))
  }
}

export async function getMarketComparison(
  leftFilters: SideFilters,
  rightFilters: SideFilters,
  language: Language = 'en'
) {
  const left =
    await analyzeMarket(leftFilters, 'a')

  const right =
    await analyzeMarket(rightFilters, 'b')

  return {
    language,
    left,
    right
  }
}