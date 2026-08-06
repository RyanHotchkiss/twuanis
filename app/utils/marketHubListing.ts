import {
  type SupabaseClient
} from '@supabase/supabase-js'

import type {
  MarketHubListing
} from '@/app/components/MarketHubMyListings'

import {
  resolveFirstListingImage
} from '@/app/utils/resolveListingImages'

import {
  createEmptyListingPerformance,
  getListingPerformance,
  type ListingPerformance
} from '@/lib/listing-performance-engine'

type SupportedLanguage =
  | 'en'
  | 'es'

export type DatabaseMarketHubListing = {
  id: string
  title: string | null
  listing_status: string | null
  transaction_type: string | null
  images: unknown
  province: string | null
  canton: string | null
  district: string | null
  currency: string | null
  price_millions:
    | number
    | string
    | null
  monthly_price:
    | number
    | string
    | null
  created_at: string | null
  published_at: string | null
  renewed_at: string | null
  updated_at: string | null
}

function normalizeStatus(
  value: string | null
): MarketHubListing['status'] {
  switch (value) {
    case 'active':
    case 'draft':
    case 'expired':
    case 'archived':
    case 'deleted':
      return value

    default:
      return 'draft'
  }
}

function normalizeTransactionType(
  value: string | null
): MarketHubListing['transactionType'] {
  if (
    value === 'rent' ||
    value === 'lease'
  ) {
    return 'rent'
  }

  if (
    value === 'sale' ||
    value === 'buy'
  ) {
    return 'buy'
  }

  return undefined
}

function numberValue(
  value:
    | number
    | string
    | null
): number | null {
  if (
    value === null ||
    value === ''
  ) {
    return null
  }

  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

function formatCurrency(
  amount: number,
  currency: string | null
): string {
  const normalizedCurrency =
    currency === 'USD'
      ? 'USD'
      : 'CRC'

  return new Intl.NumberFormat(
    normalizedCurrency === 'USD'
      ? 'en-US'
      : 'es-CR',
    {
      style: 'currency',

      currency:
        normalizedCurrency,

      maximumFractionDigits:
        0
    }
  ).format(amount)
}

function formatListingPrice(
  listing:
    DatabaseMarketHubListing
): string | null {
  const transactionType =
    normalizeTransactionType(
      listing.transaction_type
    )

  if (
    transactionType === 'rent'
  ) {
    const monthlyPrice =
      numberValue(
        listing.monthly_price
      )

    if (monthlyPrice === null) {
      return null
    }

    return `${formatCurrency(
      monthlyPrice,
      listing.currency
    )} / month`
  }

  const priceMillions =
    numberValue(
      listing.price_millions
    )

  if (priceMillions === null) {
    return null
  }

  const currency =
    listing.currency === 'USD'
      ? 'USD'
      : 'CRC'

  const fullPrice =
    currency === 'CRC'
      ? priceMillions *
        1_000_000
      : priceMillions

  return formatCurrency(
    fullPrice,
    currency
  )
}

function daysSince(
  value:
    | string
    | null
    | undefined
): number {
  if (!value) {
    return 0
  }

  const timestamp =
    new Date(value).getTime()

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return 0
  }

  const milliseconds =
    Date.now() -
    timestamp

  return Math.max(
    0,
    Math.floor(
      milliseconds /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  )
}

export function mapDatabaseListingToMarketHubListing({
  listing,
  language,
  performance
}: {
  listing:
    DatabaseMarketHubListing

  language:
    SupportedLanguage

  performance:
    ListingPerformance
}): MarketHubListing {
  return {
    id:
      listing.id,

    title:
      listing.title ||
      (
        language === 'es'
          ? 'Publicación sin título'
          : 'Untitled Listing'
      ),

    status:
      normalizeStatus(
        listing.listing_status
      ),

    transactionType:
      normalizeTransactionType(
        listing.transaction_type
      ),

    image:
      resolveFirstListingImage(
        listing.images
      ),

    location:
      [
        listing.district,
        listing.canton,
        listing.province
      ]
        .filter(Boolean)
        .join(', ') ||
      null,

    price:
      formatListingPrice(
        listing
      ),

    viewCount:
      performance.viewCount,

    favoriteCount:
      performance.favoriteCount,

    shareCount:
      performance.shareCount,

    whatsappClickCount:
      performance
        .whatsappClickCount,

    emailInquiryCount:
      performance
        .emailInquiryCount,

    daysSincePublished:
      listing.listing_status ===
        'active'
        ? daysSince(
            listing.published_at
          )
        : 0,

    daysSinceLastUpdate:
      daysSince(
        listing.updated_at
      )
  }
}

export async function loadCanonicalMarketHubListing({
  supabase,
  listingId,
  language
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  language:
    SupportedLanguage
}): Promise<MarketHubListing> {
  const {
    data: {
      user
    },
    error: userError
  } =
    await supabase.auth
      .getUser()

  if (
    userError ||
    !user
  ) {
    throw new Error(
      'Authentication required to load the listing.'
    )
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        title,
        listing_status,
        transaction_type,
        images,
        province,
        canton,
        district,
        currency,
        price_millions,
        monthly_price,
        created_at,
        published_at,
        renewed_at,
        updated_at
      `)
      .eq(
        'id',
        listingId
      )
      .eq(
        'owner_id',
        user.id
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message
    )
  }

  if (!data) {
    throw new Error(
      'The canonical listing could not be loaded.'
    )
  }

  let performance =
    createEmptyListingPerformance(
      listingId
    )

  try {
    const performanceByListing =
      await getListingPerformance({
        supabase,

        listingIds: [
          listingId
        ]
      })

    performance =
      performanceByListing.get(
        listingId
      ) ??
      performance
  } catch (performanceError) {
    console.error(
      'CANONICAL LISTING PERFORMANCE ERROR:',
      performanceError
    )
  }

  return mapDatabaseListingToMarketHubListing({
    listing:
      data as
        DatabaseMarketHubListing,

    language,

    performance
  })
}