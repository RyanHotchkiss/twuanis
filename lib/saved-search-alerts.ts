import { resolveBuyPriceRange } from './marketplace-price-ranges'
import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

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
  updated_at: string
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
      last_checked_at,
      updated_at
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
    .order('last_checked_at',{ascending:true,nullsFirst:true})
    .order('id')
    .limit(1000)

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
    try{await processSavedSearchAlert(savedSearch as SavedSearchAlert)}catch{console.error('Saved-search processing failed; checkpoint preserved:',savedSearch.id)}
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

  // Fix the upper bound before matching so later publications remain eligible.
  const checkedAt=new Date().toISOString()
  const matchingListings=await findMatchingListings(savedSearch,checkedAt)
  const result=await supabaseAdmin.rpc('complete_saved_search_alert',{
    p_search:savedSearch.id,
    p_snapshot:{lastCheckedAt:savedSearch.last_checked_at,updatedAt:savedSearch.updated_at,filters:savedSearch.filters,transactionType:savedSearch.transaction_type},
    p_checked_at:checkedAt,p_listings:matchingListings.map(listing=>listing.id)
  })
  if(result.error)throw Error('SAVED_SEARCH_COMMIT_FAILED')
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
  savedSearch: SavedSearchAlert,
  checkedAt:string
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
        ['sale','buy'].includes(savedSearch.transaction_type)?'sale':'rent'
      )
      .eq(
        'listing_status',
        'active'
      )
      .lte('created_at',checkedAt)
      .order('created_at')
      .order('id')
      .limit(1000)

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

    throw Error('SAVED_SEARCH_MATCH_FAILED')
  }

    const listings =
    (
      data ??
      []
    ) as MatchingListing[]

    if(listings.length>=1000)throw Error('SAVED_SEARCH_MATCH_BATCH_LIMIT')

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

  throw Error('INVALID_SAVED_SEARCH_CRITERIA')
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
        (isRental ? comparablePrice > maxPrice : comparablePrice >= maxPrice)
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

  const range = resolveBuyPriceRange(rawPriceRange)
  return range ? { status: 'valid', minPrice: range.min, maxPrice: range.max } : { status: 'invalid' }

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

