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
  mapDatabaseListingToMarketHubListing,
  type DatabaseMarketHubListing
} from '@/app/utils/marketHubListing'

import {
  createEmptyListingPerformance,
  getListingPerformance
} from '@/lib/listing-performance-engine'

type SupportedLanguage =
  | 'en'
  | 'es'

type MarketHubMyListingsLoaderProps = {
  language: SupportedLanguage
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
            published_at,
            renewed_at,
            updated_at
          `)
          .eq(
            'owner_id',
            user.id
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
        (
          data || []
        ) as DatabaseMarketHubListing[]

      const listingIds =
        databaseListings.map(
          listing => listing.id
        )

      let performanceByListing

      try {
        performanceByListing =
          await getListingPerformance({
            supabase,
            listingIds
          })
      } catch (performanceError) {
        console.error(
          'MARKETHUB LISTING PERFORMANCE ERROR:',
          performanceError
        )

        performanceByListing =
          new Map(
            listingIds.map(
              listingId => [
                listingId,
                createEmptyListingPerformance(
                  listingId
                )
              ]
            )
          )
      }

      setListings(
        databaseListings.map(
          listing =>
            mapDatabaseListingToMarketHubListing({
              listing,

              language,

              performance:
                performanceByListing.get(
                  listing.id
                ) ??
                createEmptyListingPerformance(
                  listing.id
                )
            })
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