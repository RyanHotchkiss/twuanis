import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export const PUBLIC_LISTING_DISCOVERY_COLUMNS = `
  id,
  title,
  province,
  canton,
  district,
  property_type,
  property_area,
  construction_area,
  bedrooms,
  bathrooms,
  parking,
  year_built_range,
  environment,
  terrain,
  utility,
  accessibility,
  legal_status,
  price_millions,
  monthly_price,
  current_price,
  currency,
  transaction_type,
  images
`

export const PUBLIC_LISTING_DETAIL_COLUMNS = `
  id,
  title,
  description,
  province,
  canton,
  district,
  property_type,
  property_area,
  construction_area,
  bedrooms,
  bathrooms,
  parking,
  year_built_range,
  environment,
  terrain,
  utility,
  accessibility,
  legal_status,
  price_millions,
  monthly_price,
  current_price,
  currency,
  transaction_type,
  images
`

export type PublicListingTransaction =
  | 'sale'
  | 'rent'

export async function getPublicListings(
  transactionType?: PublicListingTransaction
) {
  let query =
    supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DISCOVERY_COLUMNS
      )
      .eq(
        'listing_status',
        'active'
      )

  if (transactionType) {
    query =
      query.eq(
        'transaction_type',
        transactionType
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    throw new Error(
      `Public listing discovery failed: ${error.message}`
    )
  }

  return data || []
}

export async function getPublicListingById(
  listingId: string
) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DETAIL_COLUMNS
      )
      .eq(
        'id',
        listingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Public listing detail failed: ${error.message}`
    )
  }

  return data
}

export async function getPublicListingSitemapRows() {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(`
        id,
        created_at,
        transaction_type
      `)
      .eq(
        'listing_status',
        'active'
      )

  if (error) {
    throw new Error(
      `Public listing sitemap failed: ${error.message}`
    )
  }

  return data || []
}

export async function getPublicListingContact(
  listingId: string
) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(`
        id,
        whatsapp
      `)
      .eq(
        'id',
        listingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Public listing contact failed: ${error.message}`
    )
  }

  return data
}

export async function getPublicListingsByIds(
  listingIds: string[]
) {
  const uniqueListingIds =
    [...new Set(
      listingIds.filter(Boolean)
    )]

  if (
    uniqueListingIds.length === 0
  ) {
    return []
  }

  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DISCOVERY_COLUMNS
      )
      .in(
        'id',
        uniqueListingIds
      )
      .eq(
        'listing_status',
        'active'
      )

  if (error) {
    throw new Error(
      `Public listing ID lookup failed: ${error.message}`
    )
  }

  return data || []
}