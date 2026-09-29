import 'server-only'
import { resolveCanonicalMarketRequest,canonicalMarketFilterBoundary } from './canonical-market-request'
import { readMarketNumericalSurvivors } from './canonical-market-acquisition'
import { canonicalMarketPrevalence } from './canonical-market-prevalence'

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
    MarketAnalyticalContext,
  language:Language
) {
  const filters =
    normalizeSideFilters(sideFilters, prefix)

  const request=await resolveCanonicalMarketRequest(filters,language)
  const acquired=await readMarketNumericalSurvivors(request,canonicalMarketFilterBoundary(request),
    ['canonical_domain_version','transaction_type','currency','current_price','monthly_price','property_area','construction_area'])

const usdToCrcRate =
  analyticalContext.fx.rate

const listings =
  applyPriceRange(
    acquired,
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

  const prevalence=await canonicalMarketPrevalence(listings.map(row=>row.id),['property_type','environment','terrain','utility','accessibility','legal_status'])
  const leading=(dimension:string)=>{const value=prevalence.dimensions.find(d=>d.dimension===dimension)?.terms[0];return value?value.label[language]:null}
  return {
    filters,
    prevalence,
    // Already-calculated statistics for chart geometry; no parsing formatted text.
    metrics: {averageSalePrice,medianSalePrice,averageRent,medianRent,averagePropertyArea,averageConstructionArea},

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
      leading('property_type'),

    topEnvironment:
      leading('environment'),

    topTerrain:
      leading('terrain'),

    topUtility:
      leading('utility'),

    topAccessibility:
      leading('accessibility'),

    topLegalStatus:
      leading('legal_status')
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
      analyticalContext,
      language
    )

  const right =
    await analyzeMarket(
      rightFilters,
      'b',
      analyticalContext,
      language
    )

  return {
    language,
    left,
    right
  }
}