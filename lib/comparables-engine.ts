type ComparableListing = {
  id: string
  title?: string | null
  transaction_type?: string | null
  currency?: string | null
  price_millions?: number | string | null
  monthly_price?: number | string | null
  property_area?: number | string | null
  construction_area?: number | string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  property_type?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  parking?: string | null
  images?: any
}

type ComparableFilters = Partial<ComparableListing>

function scoreComparable(
  listing: ComparableListing,
  filters: ComparableFilters
) {
  let score = 0

  if (filters.province && listing.province === filters.province) score += 20
  if (filters.canton && listing.canton === filters.canton) score += 20
  if (filters.district && listing.district === filters.district) score += 25

  if (filters.property_type && listing.property_type === filters.property_type) score += 20

  if (filters.bedrooms && listing.bedrooms === filters.bedrooms) score += 10
  if (filters.bathrooms && listing.bathrooms === filters.bathrooms) score += 10
  if (filters.parking && listing.parking === filters.parking) score += 5

  if (filters.transaction_type && listing.transaction_type === filters.transaction_type) score += 10

  return score
}

export function getComparableListings(
  listings: ComparableListing[],
  filters: ComparableFilters,
  limit = 6
) {
  return listings
    .map(listing => ({
      ...listing,
      comparableScore: scoreComparable(listing, filters)
    }))
    .sort((a, b) => b.comparableScore - a.comparableScore)
    .slice(0, limit)
}