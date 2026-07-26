import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  createNotification
} from '@/lib/notifications'

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
        created_at
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
        savedSearch.filters,
        savedSearch.transaction_type
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

  return (
    data ??
    []
  ) as MatchingListing[]
}

function applySavedSearchFilters(
    query: any,
    filters: Record<
        string,
        unknown
    >,
    transactionType: string
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

  if (
    typeof filters.minPrice ===
      'number'
  ) {
    filteredQuery =
      filteredQuery.gte(
        savedSearchPriceColumn(
        transactionType
        ),
        filters.minPrice
      )
  }

  if (
    typeof filters.maxPrice ===
      'number'
  ) {
    filteredQuery =
      filteredQuery.lte(
        savedSearchPriceColumn(
        transactionType
        ),
        filters.maxPrice
      )
  }

  return filteredQuery
}

function savedSearchPriceColumn(
    transactionType: string
    ):
    | 'monthly_price'
    | 'price_millions' {
    return (
        transactionType === 'rent' ||
        transactionType === 'lease'
    )
    ? 'monthly_price'
    : 'price_millions'
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