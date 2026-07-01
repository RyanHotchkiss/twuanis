import { getMarketStatistics } from '@/lib/statistics-engine'

type MatchingLanguage = 'en' | 'es'

type MarketMatchingFilters = {
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

function parseImages(value: any) {
  if (!value) return []

  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) return parsed
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

  if (priceCRC < 10000000) return null

  return priceCRC
}

function splitValues(value?: string) {
  if (!value) return []

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalize(value: any) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function labelize(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const matchFields = [
  { key: 'province', label: 'Province', weight: 15 },
  { key: 'canton', label: 'Canton', weight: 12 },
  { key: 'district', label: 'District', weight: 10 },
  { key: 'property_type', label: 'Property Type', weight: 15 },
  { key: 'bedrooms', label: 'Bedrooms', weight: 8 },
  { key: 'bathrooms', label: 'Bathrooms', weight: 8 },
  { key: 'parking', label: 'Parking', weight: 5 },
  { key: 'environment', label: 'Environment', weight: 8 },
  { key: 'terrain', label: 'Terrain', weight: 6 },
  { key: 'utility', label: 'Utility', weight: 7 },
  { key: 'accessibility', label: 'Accessibility', weight: 4 },
  { key: 'legal_status', label: 'Legal Status', weight: 7 }
]

function scoreListing(
  listing: any,
  filters: MarketMatchingFilters,
  language: MatchingLanguage
) {
  let earned = 0
  let possible = 0

  const matchReasons: string[] = []
  const missingFeatures: string[] = []

  matchFields.forEach((field) => {
    const requestedValues =
      splitValues(filters[field.key as keyof MarketMatchingFilters])

    if (!requestedValues.length) return

    possible += field.weight

    const listingValue =
      listing[field.key]

    const listingValues =
      Array.isArray(listingValue)
        ? listingValue
        : splitValues(String(listingValue || ''))

    const matched =
        requestedValues.some(requested =>
            listingValues.some((listingValue: any) =>
            normalize(listingValue) === normalize(requested)
            )
        )

    if (matched) {
      earned += field.weight

      matchReasons.push(
        language === 'es'
          ? `Coincide con ${field.label}: ${requestedValues.map(labelize).join(', ')}`
          : `Matches ${field.label}: ${requestedValues.map(labelize).join(', ')}`
      )
    } else {
      missingFeatures.push(
        language === 'es'
          ? `${field.label}: ${requestedValues.map(labelize).join(', ')}`
          : `${field.label}: ${requestedValues.map(labelize).join(', ')}`
      )
    }
  })

  const matchScore =
    possible > 0
      ? Math.round((earned / possible) * 100)
      : 0

  return {
    matchScore,
    matchReasons,
    missingFeatures
  }
}

function decorateListing(
  listing: any,
  filters: MarketMatchingFilters,
  language: MatchingLanguage
) {
  const price = getListingPrice(listing)

  const scoring =
    scoreListing(listing, filters, language)

  return {
    ...listing,

    images:
      parseImages(listing.images),

    formattedPrice:
      price ? formatCRC(price) : null,

    matchScore:
      scoring.matchScore,

    matchReasons:
      scoring.matchReasons,

    missingFeatures:
      scoring.missingFeatures
  }
}

export async function getMarketMatches(
  filters: MarketMatchingFilters,
  language: MatchingLanguage = 'en'
) {
  const broadFilters = {
    transaction_type: filters.transaction_type,
    province: filters.province,
    canton: filters.canton,
    district: filters.district
    }

    const market =
    await getMarketStatistics(broadFilters)

  const listings =
    market.listings || []

  const decoratedListings =
    listings
      .map((listing: any) =>
        decorateListing(listing, filters, language)
      )
      .sort((a: any, b: any) =>
        b.matchScore - a.matchScore
      )

  return {
    filters,

    totalListings:
      listings.length,

    listings:
      decoratedListings.slice(0, 12)
  }
}