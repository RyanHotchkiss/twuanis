'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  supabase
} from '@/lib/supabase'

import MarketHubMyListings, {
  type MarketHubListing
} from '@/app/components/MarketHubMyListings'

import {
  resolveFirstListingImage
} from '@/app/utils/resolveListingImages'

type SupportedLanguage =
  | 'en'
  | 'es'

type DatabaseListing = {
  id: string
  title: string | null
  listing_status: string | null
  transaction_type: string | null
  images: unknown
  province: string | null
  canton: string | null
  district: string | null
  currency: string | null
  price_millions: number | string | null
  monthly_price: number | string | null
  created_at: string | null
  updated_at?: string | null
}

type ListingActivityCounts = {
  listing_id: string
  view_count: number | string | null
  favorite_count: number | string | null
  share_count: number | string | null
  whatsapp_click_count:
    | number
    | string
    | null
}

type DatabaseActivityEvent = {
  entity_id: string | null
  event_type: string
}

type MarketHubMyListingsLoaderProps = {
  language: SupportedLanguage
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
  value: number | string | null
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
      maximumFractionDigits: 0
    }
  ).format(amount)
}

function formatListingPrice(
  listing: DatabaseListing
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
      ? priceMillions * 1_000_000
      : priceMillions

  return formatCurrency(
    fullPrice,
    currency
  )
}

function daysSince(
  value: string | null | undefined
): number {
  if (!value) return 0

  const timestamp =
    new Date(value).getTime()

  if (
    !Number.isFinite(timestamp)
  ) {
    return 0
  }

  const milliseconds =
    Date.now() - timestamp

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

function mapListing(
  listing: DatabaseListing,
  language: SupportedLanguage,
  analytics: {
    viewCount: number
    favoriteCount: number
    shareCount: number
    whatsappClickCount: number
    emailInquiryCount: number
  }
): MarketHubListing {

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
      analytics.viewCount,

    favoriteCount:
      analytics.favoriteCount,

    shareCount:
      analytics.shareCount,

    whatsappClickCount:
      analytics.whatsappClickCount,

    emailInquiryCount:
      analytics.emailInquiryCount,

    daysSincePublished:
      daysSince(
        listing.created_at
      ),

    daysSinceLastUpdate:
      daysSince(
        listing.updated_at ||
        listing.created_at
      )
  }
}

export default function MarketHubMyListingsLoader({
  language
}: MarketHubMyListingsLoaderProps) {
  const [
    listings,
    setListings
  ] = useState<
    MarketHubListing[]
  >([])

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage
  ] = useState('')

  useEffect(() => {
    let active = true

    async function loadListings():
      Promise<void> {
      setLoading(true)
      setErrorMessage('')

      const {
        data: {
          user
        },
        error: userError
      } =
        await supabase.auth.getUser()

      if (!active) return

      if (
        userError ||
        !user
      ) {
        setListings([])
        setLoading(false)

        setErrorMessage(
          language === 'es'
            ? 'Inicie sesión para ver sus publicaciones.'
            : 'Sign in to view your listings.'
        )

        return
      }

      const {
        data,
        error
      } =
        await supabase
          .from('listings')
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
            updated_at
          `)
          .eq(
            'owner_id',
            user.id
          )
          .neq(
            'listing_status',
            'deleted'
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          )

      if (!active) return

      if (error) {
        console.error(
          'MARKETHUB LISTINGS ERROR:',
          error
        )

        setListings([])

        setErrorMessage(
          language === 'es'
            ? 'No se pudieron cargar sus publicaciones.'
            : 'Your listings could not be loaded.'
        )

        setLoading(false)
        return
      }

      const databaseListings =
  (data || []) as DatabaseListing[]

const listingIds =
  databaseListings.map(
    listing => listing.id
  )

let activityEvents:
  DatabaseActivityEvent[] = []

if (listingIds.length > 0) {
  const {
    data: activityData,
    error: activityError
  } =
    await supabase
      .from('activity_events')
      .select(`
        entity_id,
        event_type
      `)
      .eq(
        'entity_type',
        'listing'
      )
      .in(
        'entity_id',
        listingIds
      )

  if (activityError) {
    console.error(
      'MARKETHUB LISTING ANALYTICS ERROR:',
      activityError
    )
  } else {
    activityEvents =
      (activityData || []) as
        DatabaseActivityEvent[]
  }
}

const analyticsByListing =
  new Map<
    string,
    {
      viewCount: number
      favoriteCount: number
      shareCount: number
      whatsappClickCount: number
      emailInquiryCount: number
    }
  >()

for (const listingId of listingIds) {
  analyticsByListing.set(
    listingId,
    {
      viewCount: 0,
      favoriteCount: 0,
      shareCount: 0,
      whatsappClickCount: 0,
      emailInquiryCount: 0
    }
  )
}

for (
  const activityEvent of
  activityEvents
) {
  if (!activityEvent.entity_id) {
    continue
  }

  const analytics =
    analyticsByListing.get(
      activityEvent.entity_id
    )

  if (!analytics) {
    continue
  }

  switch (
    activityEvent.event_type
  ) {
    case 'listing_viewed':
      analytics.viewCount += 1
      break

    case 'listing_saved':
      analytics.favoriteCount += 1
      break

    case 'listing_shared':
      analytics.shareCount += 1
      break

    case 'listing_whatsapp_clicked':
      analytics.whatsappClickCount += 1
      break

    case 'listing_email_inquiry':
      analytics.emailInquiryCount += 1
      break
  }
}

setListings(
    databaseListings.map(
      listing =>
        mapListing(
          listing,
          language,
          analyticsByListing.get(
            listing.id
          ) ?? {
            viewCount: 0,
            favoriteCount: 0,
            shareCount: 0,
            whatsappClickCount: 0,
            emailInquiryCount: 0
          }
        )
    )
  )

      setLoading(false)
    }

    loadListings()

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadListings()
        }
      )

    return () => {
      active = false

      authListener.subscription.unsubscribe()
    }
  }, [
    language
  ])

  if (loading) {
    return (
      <section style={messageCard}>
        {language === 'es'
          ? 'Cargando sus publicaciones...'
          : 'Loading your listings...'}
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section style={messageCard}>
        {errorMessage}
      </section>
    )
  }

  return (
    <MarketHubMyListings
      language={language}
      listings={listings}
    />
  )
}

const messageCard = {
  maxWidth: '90rem',
  margin: '0 auto',
  padding: '2rem',
  color: '#aaa',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1.5rem'
}