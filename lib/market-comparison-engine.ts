import {
  getMarketStatistics
} from '@/lib/statistics-engine'

import {
  resolveMarketAnalyticalContext,
  type MarketAnalyticalContext
} from '@/lib/market-analytical-context'

import {
  convertCrcToUsd
} from '@/lib/currency-conversion'

import {
  resolveListingAmountCrc
} from '@/lib/listing-monetary-value'

type Language = 'en' | 'es'

type SideFilters =
  Record<string, string | undefined>

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

function applyPriceRange(
  listings: any[],
  priceRange: string | undefined,
  usdToCrcRate: number
) {
  const range =
    parsePriceRange(
      priceRange
    )

  if (!range) {
    return listings
  }

  return listings.filter(
    (listing) => {
      const price =
        resolveListingAmountCrc(
          listing,
          usdToCrcRate
        )

      if (!price) {
        return false
      }

      if (range.max === null) {
        return price >= range.min
      }

      return (
        price >= range.min &&
        price <= range.max
      )
    }
  )
}

async function analyzeMarket(
  sideFilters: SideFilters,
  prefix: 'a' | 'b',
  analyticalContext:
    MarketAnalyticalContext
) {
  const filters =
    normalizeSideFilters(sideFilters, prefix)

  const market =
  await getMarketStatistics(
    filters,
    analyticalContext
  )

const usdToCrcRate =
  analyticalContext.fx.rate

const listings =
  applyPriceRange(
    market.listings || [],
    sideFilters[
      `${prefix}_price_range`
    ],
    usdToCrcRate
  )

  const salePrices =
    listings
      .filter((listing: any) => listing.transaction_type !== 'rent')
      .map(
            (listing: any) =>
              resolveListingAmountCrc(
                listing,
                usdToCrcRate
              )
          )
      .filter((value: number | null): value is number => Boolean(value))

  const rentPrices =
    listings
      .filter((listing: any) => listing.transaction_type === 'rent')
      .map(
            (listing: any) =>
              resolveListingAmountCrc(
                listing,       
                usdToCrcRate
              )
          )
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
        ? formatUSD(
          convertCrcToUsd(
            averageSalePrice,
            usdToCrcRate
          )
        )
        : null,

    medianSalePriceCRC:
      formatCRC(medianSalePrice),

    medianSalePriceUSD:
      medianSalePrice
        ? formatUSD(
          convertCrcToUsd(
            medianSalePrice,
            usdToCrcRate
          )
        )
        : null,

    averageRentCRC:
      formatCRC(averageRent),

    averageRentUSD:
      averageRent
        ? formatUSD(
          convertCrcToUsd(
            averageRent,
            usdToCrcRate
          )
        )
        : null,

    medianRentCRC:
      formatCRC(medianRent),

    medianRentUSD:
      medianRent
        ? formatUSD(
          convertCrcToUsd(
            medianRent,
            usdToCrcRate
          )
        )
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
  const analyticalContext =
    await resolveMarketAnalyticalContext()

  const left =
    await analyzeMarket(
      leftFilters,
      'a',
      analyticalContext
    )

  const right =
    await analyzeMarket(
      rightFilters,
      'b',
      analyticalContext
    )

  return {
    language,
    left,
    right
  }
}