import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  createNotification
} from '@/lib/notifications'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

import {
  resolveListingAmountCrc,
  resolveListingAmountUsd
} from '@/lib/listing-monetary-value'

type SavedSearchAlertFrequency =
  | 'daily'
  | 'weekly'
  | null

type SavedSearchAlert = {
  id: string
  user_id: string
  transaction_type: string
  language: string
  filters: Record<
    string,
    unknown
  >
  alert_frequency:
    SavedSearchAlertFrequency
  last_checked_at:
    string | null
}

type MatchingListing = {
  id: string
  created_at: string
  transaction_type:
    string | null
  currency:
    string | null
  current_price:
    number | null
  price_millions:
    number | null
  monthly_price:
    number | null
}

export async function processSavedSearchAlerts():
  Promise<void> {
  const {
    data: savedSearches,
    error
  } = await supabaseAdmin
    .from('saved_searches')
    .select(`
      id,
      user_id,
      transaction_type,
      language,
      filters,
      alert_frequency,
      last_checked_at
    `)
    .eq(
      'alerts_enabled',
      true
    )
    .not(
      'alert_frequency',
      'is',
      null
    )

  if (error) {
    console.error(
        'Unable to load saved-search alerts:',
        error
    )

    return
    }

  for (
    const savedSearch
    of savedSearches ?? []
  ) {
    await processSavedSearchAlert(
      savedSearch as SavedSearchAlert
    )
  }
}

async function processSavedSearchAlert(
  savedSearch: SavedSearchAlert
): Promise<void> {
  if (
    !isAlertDue(
      savedSearch
    )
  ) {
    return
  }

  const matchingListings =
    await findMatchingListings(
      savedSearch
    )

  if (
    matchingListings.length > 0
  ) {
    await recordNewMatches(
      savedSearch,
      matchingListings
    )
  }

  const checkedAt =
    new Date().toISOString()

  const {
    error
  } = await supabaseAdmin
    .from('saved_searches')
    .update({
      last_checked_at:
        checkedAt
    })
    .eq(
      'id',
      savedSearch.id
    )

  if (error) {
    console.error(
      'Unable to update saved-search check time:',
      error
    )
  }
}

function isAlertDue(
  savedSearch: SavedSearchAlert
): boolean {
  if (
    !savedSearch.last_checked_at
  ) {
    return true
  }

  const lastChecked =
    new Date(
      savedSearch.last_checked_at
    ).getTime()

  const now =
    Date.now()

  const interval =
    savedSearch.alert_frequency ===
    'weekly'
      ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000

  return (
    now - lastChecked >=
    interval
  )
}

async function findMatchingListings(
  savedSearch: SavedSearchAlert
): Promise<MatchingListing[]> {
  const checkedAfter =
    savedSearch.last_checked_at ??
    new Date(0).toISOString()

  let query =
    supabaseAdmin
      .from('listings')
      .select(`
        id,
        created_at,
        transaction_type,
        currency,
        current_price,
        price_millions,
        monthly_price
      `)
      .gt(
        'created_at',
        checkedAfter
      )
      .eq(
        'transaction_type',
        savedSearch.transaction_type
      )
      .eq(
        'listing_status',
        'active'
      )

  query =
     applySavedSearchFilters(
      query,
      savedSearch.filters
    )

  const {
    data,
    error
  } = await query

  if (error) {
    console.error(
      `Unable to match listings for saved search ${savedSearch.id}:`,
      error
    )

    return []
  }

    const listings =
    (
      data ??
      []
    ) as MatchingListing[]

    const priceResolution =
  resolveSavedSearchPriceBounds(
    savedSearch.transaction_type,
    savedSearch.filters
  )

if (
  priceResolution.status ===
    'invalid'
) {
  console.error(
    `Saved search ${savedSearch.id} has an invalid transaction type or price criterion.`
  )

  return []
}

if (
  priceResolution.status ===
    'none'
) {
  return listings
}

const {
  minPrice,
  maxPrice
} = priceResolution

    const {
    fx
  } =
    await resolveMarketAnalyticalContext()

  const usdToCrcRate =
    fx.rate

  const isRental =
    savedSearch.transaction_type ===
      'rent' ||
    savedSearch.transaction_type ===
      'lease'

  return listings.filter(
    listing => {
      const monetaryInput = {
        transaction_type:
          listing.transaction_type,
        currency:
          listing.currency,
        current_price:
          listing.current_price,
        price_millions:
          listing.price_millions,
        monthly_price:
          listing.monthly_price
      }

      const comparablePrice =
        isRental
          ? resolveListingAmountUsd(
              monetaryInput,
              usdToCrcRate
            )
          : resolveListingAmountCrc(
              monetaryInput,
              usdToCrcRate
            )

      if (comparablePrice === null) {
        return false
      }

      if (
        minPrice !== null &&
        comparablePrice < minPrice
      ) {
        return false
      }

      if (
        maxPrice !== null &&
        comparablePrice > maxPrice
      ) {
        return false
      }

      return true
    }
  )
}

type SavedSearchPriceResolution =
  | {
      status: 'none'
    }
  | {
      status: 'valid'
      minPrice: number | null
      maxPrice: number | null
    }
  | {
      status: 'invalid'
    }

function resolveSavedSearchPriceBounds(
  transactionType: string,
  filters: Record<string, unknown>
): SavedSearchPriceResolution {
  const isRental =
    transactionType === 'rent' ||
    transactionType === 'lease'

  const isSale =
    transactionType === 'sale' ||
    transactionType === 'buy'

  if (
    !isRental &&
    !isSale
  ) {
    return {
      status: 'invalid'
    }
  }

  if (isRental) {
    const rawMonthlyPrice =
      filters.monthly_price

    if (
      rawMonthlyPrice ===
        undefined ||
      rawMonthlyPrice ===
        null ||
      rawMonthlyPrice === ''
    ) {
      return {
        status: 'none'
      }
    }

    if (
      typeof rawMonthlyPrice !==
        'string'
    ) {
      return {
        status: 'invalid'
      }
    }

    switch (rawMonthlyPrice) {
      case '$0 - $500/mo':
        return {
          status: 'valid',
          minPrice: 0,
          maxPrice: 500
        }

      case '$500 - $1K/mo':
        return {
          status: 'valid',
          minPrice: 500,
          maxPrice: 1_000
        }

      case '$1K - $2K/mo':
        return {
          status: 'valid',
          minPrice: 1_000,
          maxPrice: 2_000
        }

      case '$2K - $5K/mo':
        return {
          status: 'valid',
          minPrice: 2_000,
          maxPrice: 5_000
        }

      case '$5K+/mo':
        return {
          status: 'valid',
          minPrice: 5_000,
          maxPrice: null
        }

      default:
        return {
          status: 'invalid'
        }
    }
  }

  const rawPriceRange =
    filters.price_range

  if (
    rawPriceRange === undefined ||
    rawPriceRange === null ||
    rawPriceRange === ''
  ) {
    return {
      status: 'none'
    }
  }

  if (
    typeof rawPriceRange !==
      'string'
  ) {
    return {
      status: 'invalid'
    }
  }

  switch (rawPriceRange) {
    case '₡0 - ₡25M':
      return {
        status: 'valid',
        minPrice: 0,
        maxPrice: 25_000_000
      }

    case '₡25M - ₡75M':
      return {
        status: 'valid',
        minPrice: 25_000_000,
        maxPrice: 75_000_000
      }

    case '₡75M - ₡150M':
      return {
        status: 'valid',
        minPrice: 75_000_000,
        maxPrice: 150_000_000
      }

    case '₡150M - ₡250M':
      return {
        status: 'valid',
        minPrice: 150_000_000,
        maxPrice: 250_000_000
      }

    case '₡250M+':
      return {
        status: 'valid',
        minPrice: 250_000_000,
        maxPrice: null
      }

    default:
      return {
        status: 'invalid'
      }
  }
}

function applySavedSearchFilters(
    query: any,
    filters: Record<
        string,
        unknown
    >
    ): any {
  let filteredQuery =
    query

  if (
    typeof filters.province ===
      'string' &&
    filters.province
  ) {
    filteredQuery =
      filteredQuery.eq(
        'province',
        filters.province
      )
  }

  if (
    typeof filters.canton ===
      'string' &&
    filters.canton
  ) {
    filteredQuery =
      filteredQuery.eq(
        'canton',
        filters.canton
      )
  }

  if (
    typeof filters.district ===
      'string' &&
    filters.district
  ) {
    filteredQuery =
      filteredQuery.eq(
        'district',
        filters.district
      )
  }

  if (
    typeof filters.propertyType ===
      'string' &&
    filters.propertyType
  ) {
    filteredQuery =
      filteredQuery.eq(
        'property_type',
        filters.propertyType
      )
  }

  if (
    typeof filters.bedrooms ===
      'string' &&
    filters.bedrooms
  ) {
    filteredQuery =
      filteredQuery.eq(
        'bedrooms',
        filters.bedrooms
      )
  }

  if (
    typeof filters.bathrooms ===
      'string' &&
    filters.bathrooms
  ) {
    filteredQuery =
      filteredQuery.eq(
        'bathrooms',
        filters.bathrooms
      )
  }

  if (
    typeof filters.parking ===
      'string' &&
    filters.parking
  ) {
    filteredQuery =
      filteredQuery.eq(
        'parking',
        filters.parking
      )
  }

  return filteredQuery
}

async function recordNewMatches(
  savedSearch: SavedSearchAlert,
  listings: MatchingListing[]
): Promise<void> {
  const deliveries =
    listings.map(
      listing => ({
        saved_search_id:
          savedSearch.id,

        listing_id:
          listing.id,

        user_id:
          savedSearch.user_id,

        matched_at:
          new Date().toISOString(),

        delivery_status:
          'pending'
      })
    )

  const {
    error
  } = await supabaseAdmin
    .from(
      'saved_search_alert_deliveries'
    )
    .upsert(
      deliveries,
      {
        onConflict:
          'saved_search_id,listing_id',

        ignoreDuplicates:
          true
      }
    )

  if (error) {
  console.error(
    'Unable to record saved-search matches:',
    error
  )

  return
}

if (listings.length > 0) {
    await createNotification({
        userId:
        savedSearch.user_id,

        title:
        'New properties found',

        message:
        `${listings.length} new properties match this saved search.`,

        url:
        '/en/market-hub?tab=favorites',

        metadata: {
        savedSearchId:
            savedSearch.id,

        listingCount:
            listings.length
        }
    })
    }
}