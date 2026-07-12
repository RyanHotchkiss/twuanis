type ComparableListing = {
  id: string
  title?: string | null
  transaction_type?: string | null
  currency?: string | null
  price_millions?: number | string | null
  current_price?: number | string | null
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

const MAX_SCORE = 110

function normalize(value: any) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function matchesValue(
  listingValue: any,
  filterValue: any
) {
  if (!filterValue) return false
  if (!listingValue) return false

  const listingNormalized =
    normalize(listingValue)

  const filterNormalized =
    normalize(filterValue)

  return (
    listingNormalized === filterNormalized ||
    listingNormalized.includes(filterNormalized) ||
    filterNormalized.includes(listingNormalized)
  )
}

function matchesTransaction(
  listingValue: any,
  filterValue: any
) {
  if (!filterValue) return false

  const listingTransaction =
    normalize(listingValue)

  const filterTransaction =
    normalize(filterValue)

  if (
    filterTransaction === 'sale' &&
    (
      listingTransaction === 'sale' ||
      listingTransaction === 'buy'
    )
  ) {
    return true
  }

  if (
    filterTransaction === 'rent' &&
    (
      listingTransaction === 'rent' ||
      listingTransaction === 'lease'
    )
  ) {
    return true
  }

  return listingTransaction === filterTransaction
}

function scoreComparable(
  listing: ComparableListing,
  filters: ComparableFilters
) {
  let score = 0

  if (matchesValue(listing.province, filters.province)) score += 20
  if (matchesValue(listing.canton, filters.canton)) score += 20
  if (matchesValue(listing.district, filters.district)) score += 25

  if (matchesValue(listing.property_type, filters.property_type)) score += 20

  if (matchesValue(listing.bedrooms, filters.bedrooms)) score += 10
  if (matchesValue(listing.bathrooms, filters.bathrooms)) score += 10
  if (matchesValue(listing.parking, filters.parking)) score += 5

  if (
    matchesTransaction(
      listing.transaction_type,
      filters.transaction_type
    )
  ) {
    score += 10
  }

  return score
}

export function getComparableListings(
  listings: ComparableListing[],
  filters: ComparableFilters,
  limit = 6
) {
  return listings
    .map(listing => {
      const comparableScore =
        scoreComparable(listing, filters)

      const comparableMatchPercent =
        Math.round(
          (comparableScore / MAX_SCORE) * 100
        )

      return {
        ...listing,
        comparableScore,
        comparableMatchPercent
      }
    })
    .sort((a, b) =>
      b.comparableScore - a.comparableScore
    )
    .slice(0, limit)
}