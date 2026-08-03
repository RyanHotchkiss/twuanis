'use client'

import {
  useEffect,
  useState
} from 'react'

import Link from 'next/link'

import {
  supabase
} from '@/lib/supabase'

import {
  getFavorites
} from '@/lib/favorites'

import {
  deleteFavoriteCollection,
  getFavoriteCollections,
  renameFavoriteCollection,
  reorderFavoriteCollections
} from '@/lib/collections'

import {
  deleteSavedSearch,
  getSavedSearches,
  renameSavedSearch
} from '@/lib/saved-searches'

import {
  getSavedAnalyses
} from '@/lib/saved-analyses'

import {
  getMarketComparisons,
  type MarketHubMarketComparison
} from '@/lib/market-comparisons'

import CollectionPicker from '@/app/components/CollectionPicker'
import CreateCollectionButton from '@/app/components/CreateCollectionButton'
import MarketHubNotificationFeed, {
  type MarketHubNotification
} from '@/app/components/MarketHubNotificationFeed'

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Clock3,
  Columns3,
  Eye,
  FolderHeart,
  Heart,
  Map as MapIcon,
  RefreshCw,
  MapPin,
  NotebookPen,
  Pencil,
  Search,
  Trash2
} from 'lucide-react'

import {
  getRecentlySavedProperties,
  getRecentlyViewedProperties,
  type RecentlySavedProperty
} from '@/lib/activity/listings'

import {
  getRecentlyViewedMarkets
} from '@/lib/activity/markets'

import {
  getUserPropertyNotes
} from '@/lib/property-notes'

import DOMPurify from 'dompurify'

import {
  getPropertyComparisons,
  type MarketHubPropertyComparison
} from '@/lib/property-comparisons'

import {
  resolveFirstListingImage
} from '@/app/utils/resolveListingImages'

type SupportedLanguage =
  | 'en'
  | 'es'

export type MarketHubSavedProperty = {
  id: string
  title: string
  image?: string | null
  location?: string | null
  price?: string | null
  transactionType?:
    | 'buy'
    | 'rent'
}

type MarketHubFavoritesProps = {
      language: SupportedLanguage
      savedProperties?:
        MarketHubSavedProperty[]
      savedSearches?: SavedSearch[]
      savedAnalyses?:
        savedAnalyses[]
      recentlyViewedProperties?:
        RecentlyViewedProperty[]
      recentlyViewedMarkets?:
        RecentlyViewedMarket[]
      favoriteCollections?:
        FavoriteCollection[]
      
      marketComparisons?:
        MarketHubMarketComparison[]
    }

export type FavoriteCollection = {
  id: string
  name: string
  propertyCount: number
  updatedAt: string
  href: string
}

export type PropertyNote = {
  id: string
  propertyId: string
  propertyTitle: string
  note: string
  updatedAt: string
  timestamp: string
  href: string
}

export type SavedSearch = {
  id: string
  title: string
  resultCount: number
  createdAt: string
  lastUpdated: string
  href: string
}

type SavedSearchSort =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'

export type savedAnalyses = {
  id: string
  title: string
  market: string
  summary: string
  lastUpdated: string
  timestamp: string
  href: string
}

export type RecentlyViewedProperty = {
  id: string
  title: string
  image?: string | null
  location?: string | null
  price?: string | null
  viewedAt: string
  href: string
}

export type RecentlyViewedMarket = {
  id: string
  title: string
  marketType: string
  summary: string
  viewedAt: string
  href: string
}

  type RecentActivityType =
      | 'property-saved'
      | 'property-viewed'
      | 'market-viewed'
      | 'analysis-updated'
      | 'property-note-updated'
      | 'property-compared'
      | 'market-compared'

  type RecentActivityItem = {
      id: string
      type: RecentActivityType
      title: string
      description: string
      timestamp: string
      href: string
    }

export default function MarketHubFavorites({
      language,
      savedProperties:
        initialSavedProperties = [],
      savedSearches = [],
      savedAnalyses:
  initialSavedAnalyses = [],
      recentlyViewedProperties = [],
      recentlyViewedMarkets = [],
      favoriteCollections:
        initialFavoriteCollections = [],
      
      marketComparisons:
        initialMarketComparisons = []
    }: MarketHubFavoritesProps) {

    const [
          loadedSavedProperties,
          setLoadedSavedProperties
        ] = useState<
          MarketHubSavedProperty[]
        >(
          initialSavedProperties
        )

    const [
            loadedPropertyNotes,
            setLoadedPropertyNotes
          ] = useState<PropertyNote[]>([])

    const [
          loadedRecentlyViewedProperties,
          setLoadedRecentlyViewedProperties
        ] = useState<RecentlyViewedProperty[]>(
          recentlyViewedProperties
        )

    const [
          loadedRecentlySavedProperties,
          setLoadedRecentlySavedProperties
        ] = useState<
          RecentlySavedProperty[]
        >([])

    const [
          loadedRecentlyViewedMarkets,
          setLoadedRecentlyViewedMarkets
        ] = useState<RecentlyViewedMarket[]>(
          recentlyViewedMarkets
        )

    const [
          loadedFavoriteCollections,
          setLoadedFavoriteCollections
        ] = useState<
          FavoriteCollection[]
        >(
          initialFavoriteCollections
        )

    const [
        deletingCollectionId,
        setDeletingCollectionId
      ] = useState<string | null>(
        null
      )

    const [
        deletingCollection,
        setDeletingCollection
      ] = useState(false)

    const [
        reorderingCollection,
        setReorderingCollection
      ] = useState(false)

    const [
      loadedSavedAnalyses,
      setLoadedSavedAnalyses
    ] = useState<savedAnalyses[]>(
      initialSavedAnalyses
    )

  const [
    loadedSavedSearches,
    setLoadedSavedSearches
  ] = useState<SavedSearch[]>(
    savedSearches
  )

  const [
    loadedNotifications,
    setLoadedNotifications
  ] = useState<
    MarketHubNotification[]
  >([])

  const [
    notificationsLoaded,
    setNotificationsLoaded
  ] = useState(false)
  
  const [
    editingSavedSearchId,
    setEditingSavedSearchId
  ] = useState<string | null>(
    null
  )

  const [
    savedSearchNameDraft,
    setSavedSearchNameDraft
  ] = useState('')

  const [
    savingSavedSearchName,
    setSavingSavedSearchName
  ] = useState(false)

  const [
    deletingSavedSearchId,
    setDeletingSavedSearchId
  ] = useState<string | null>(
    null
  )

  const [
    deletingSavedSearch,
    setDeletingSavedSearch
  ] = useState(false)

  const [
    savedSearchSort,
    setSavedSearchSort
  ] = useState<SavedSearchSort>(
    'newest'
  )

  const savedSearchTitleLink = {
    color: '#fff',
    textDecoration: 'none'
  }

  const savedSearchCardActions = {
    display: 'flex',
    alignItems: 'center',
    gap: '.65rem'
  }

  const savedSearchEditButton = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    padding: 0,
    color: '#C7A44B',
    background: '#161616',
    border: '1px solid #303030',
    borderRadius: '999px',
    cursor: 'pointer'
  }

  const savedSearchOpenLink = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const savedSearchNameInput = {
    width: '100%',
    padding: '.65rem .75rem',
    color: '#fff',
    background: '#111',
    border: '1px solid #C7A44B',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '.95rem',
    outline: 'none'
  }

  const savedSearchActions = {
    display: 'flex',
    gap: '.5rem',
    marginTop: '.65rem'
  }

  const savedSearchSaveButton = {
    padding: '.5rem .75rem',
    color: '#111',
    background: '#C7A44B',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: 'pointer'
  }

  const savedSearchCancelButton = {
    padding: '.5rem .75rem',
    color: '#aaa',
    background: '#1b1b1b',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    fontFamily: 'inherit',
    cursor: 'pointer'
  }

  const savedSearchDeleteButton = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    padding: 0,
    color: '#d66',
    background: '#161616',
    border: '1px solid #303030',
    borderRadius: '999px',
    cursor: 'pointer'
  }

  const savedSearchDeleteConfirmation = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '.4rem'
  }

  const savedSearchDeleteText = {
    color: '#aaa',
    fontSize: '.78rem'
  }

  const savedSearchDeleteConfirmButton = {
    padding: '.4rem .6rem',
    color: '#fff',
    background: '#8f2d2d',
    border: '1px solid #b34747',
    borderRadius: '7px',
    fontFamily: 'inherit',
    fontSize: '.75rem',
    fontWeight: 600,
    cursor: 'pointer'
  }

  const savedSearchDeleteCancelButton = {
    padding: '.4rem .6rem',
    color: '#aaa',
    background: '#1b1b1b',
    border: '1px solid #3a3a3a',
    borderRadius: '7px',
    fontFamily: 'inherit',
    fontSize: '.75rem',
    cursor: 'pointer'
  }

  const savedSearchSortLabel = {
  display: 'grid',
  gap: '.35rem'
  }

  const savedSearchSortText = {
    color: '#777',
    fontSize: '.75rem'
  }

  const savedSearchSortSelect = {
    minWidth: '145px',
    padding: '.6rem .75rem',
    color: '#ddd',
    background: '#191919',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '.82rem',
    cursor: 'pointer',
    outline: 'none'
  }

  const [
        loadedMarketComparisons,
        setLoadedMarketComparisons
      ] = useState<
        MarketHubMarketComparison[]
      >(
        initialMarketComparisons
      )

      const [
        marketComparisonsLoaded,
        setMarketComparisonsLoaded
      ] = useState(false)

      const [
          loadedPropertyComparisons,
          setLoadedPropertyComparisons
        ] = useState<
          MarketHubPropertyComparison[]
        >([])

        const [
          propertyComparisonsLoaded,
          setPropertyComparisonsLoaded
        ] = useState(false)

    useEffect(() => {
      let active = true

      async function loadSavedProperties():
        Promise<void> {
        const favoriteIds =
          getFavorites()

        if (
          favoriteIds.length === 0
        ) {
          if (active) {
            setLoadedSavedProperties(
              []
            )
          }

          return
        }

        const supabaseIds =
          favoriteIds.filter(
            id =>
              /^[0-9a-fA-F-]{36}$/.test(
                id
              )
          )

        if (
          supabaseIds.length === 0
        ) {
          if (active) {
            setLoadedSavedProperties(
              []
            )
          }

          return
        }

        const {
          data,
          error
        } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            images,
            province,
            canton,
            district,
            transaction_type,
            currency,
            price_millions,
            monthly_price
          `)
          .in(
            'id',
            supabaseIds
          )

        if (error) {
          console.error(
            'MARKETHUB FAVORITES ERROR:',
            error
          )

          return
        }

        const properties:
          MarketHubSavedProperty[] =
          (data || []).map(
            listing => ({
              id:
                listing.id,

              title:
                listing.title ||
                (
                  language === 'es'
                    ? 'Propiedad Guardada'
                    : 'Saved Property'
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
                formatSavedPropertyPrice({
                  transactionType:
                    listing.transaction_type,

                  currency:
                    listing.currency,

                  priceMillions:
                    listing.price_millions,

                  monthlyPrice:
                    listing.monthly_price
                }),

              transactionType:
                listing.transaction_type === 'rent' ||
                listing.transaction_type === 'lease'
                  ? 'rent'
                  : 'buy'
            })
          )

        if (active) {
          setLoadedSavedProperties(
            properties
          )
        }
      }

      async function loadPropertyNotes():
          Promise<void> {
          try {
            const notes =
              await getUserPropertyNotes()

            if (!active) {
              return
            }

            if (notes.length === 0) {
              setLoadedPropertyNotes([])
              return
            }

            const listingIds = [
              ...new Set(
                notes.map(
                  note =>
                    note.listingId
                )
              )
            ]

            const {
              data: listings,
              error
            } = await supabase
              .from('listings')
              .select(`
                id,
                title,
                transaction_type
              `)
              .in(
                'id',
                listingIds
              )

            if (error) {
              console.error(
                'MARKETHUB PROPERTY NOTES LISTINGS ERROR:',
                error
              )

              return
            }

            const listingsById =
              new Map(
                (listings || []).map(
                  listing => [
                    listing.id,
                    listing
                  ]
                )
              )

            setLoadedPropertyNotes(
              notes.map(
                note => {
                  const listing =
                    listingsById.get(
                      note.listingId
                    )

                  const transactionType =
                    listing?.transaction_type ===
                      'rent' ||
                    listing?.transaction_type ===
                      'lease'
                      ? 'rent'
                      : 'buy'

                  const href =
                    language === 'es'
                      ? transactionType === 'rent'
                        ? `/es/alquilar-arrendar/anuncio/${note.listingId}`
                        : `/es/comprar/anuncio/${note.listingId}`
                      : transactionType === 'rent'
                      ? `/en/rent-lease/listing/${note.listingId}`
                      : `/en/buy/listing/${note.listingId}`

                  return {
                    id:
                      note.id,

                    propertyId:
                      note.listingId,

                    propertyTitle:
                      listing?.title ||
                      (
                        language === 'es'
                          ? 'Propiedad'
                          : 'Property'
                      ),

                    note:
                      propertyNoteToPlainText(
                        note.content
                      ),

                    updatedAt:
                      new Date(
                        note.updatedAt
                      ).toLocaleString(
                        language === 'es'
                          ? 'es-CR'
                          : 'en-US',
                        {
                          dateStyle:
                            'medium',
                          timeStyle:
                            'short'
                        }
                      ),

                  timestamp:
                      note.updatedAt,

                    href
                  }
                }
              )
            )
          } catch (error) {
            console.error(
              'MARKETHUB PROPERTY NOTES ERROR:',
              error
            )

            if (active) {
              setLoadedPropertyNotes([])
            }
          }
        }

        async function loadCollections() {
          const collections =
            await getFavoriteCollections()

          if (!active) {
            return
          }

          setLoadedFavoriteCollections(
            collections.map(
              collection => ({
                id: collection.id,
                name: collection.name,
                propertyCount:
                  collection.propertyCount,
                updatedAt:
                  new Date(
                    collection.updatedAt
                  ).toLocaleDateString(
                    language === 'es'
                      ? 'es-CR'
                      : 'en-US'
                  ),
                href:
                  language === 'es'
                    ? `/es/favoritos?collection=${collection.id}`
                    : `/en/favorites?collection=${collection.id}`
              })
            )
          )
        }

        async function loadSavedSearches() {

          const searches =
            await getSavedSearches()

          if (!active) {
            return
          }

          setLoadedSavedSearches(
            searches.map(search => ({
              id: search.id,

              title:
                search.name,

              resultCount: 0,

              createdAt:
                search.created_at,

              lastUpdated:
                new Date(
                  search.created_at
                ).toLocaleDateString(
                  language === 'es'
                    ? 'es-CR'
                    : 'en-US'
                ),

              href:
                search.transaction_type === 'rent'
                  ? `${
                      language === 'es'
                        ? '/es/alquilar-arrendar'
                        : '/en/rent-lease'
                    }?savedSearch=${search.id}`
                  : `${
                      language === 'es'
                        ? '/es/comprar'
                        : '/en/buy'
                    }?savedSearch=${search.id}`
            }))
          )
        }

        async function loadSavedAnalyses() {

  const analyses =
    await getSavedAnalyses()

            if (!active) {
              return
            }

            setLoadedSavedAnalyses(
                analyses.map(
                  analysis => ({
                    id: analysis.id,

                    title:
                      analysis.name,

                    market:
                      [
                        analysis.filters?.district,
                        analysis.filters?.canton,
                        analysis.filters?.province
                      ]
                        .filter(Boolean)
                        .join(', ') ||
                      (
                        language === 'es'
                          ? 'Costa Rica'
                          : 'Costa Rica'
                      ),

                    summary:
                      analysis.engine_type
                        .replace(/-/g, ' ')
                        .replace(
                          /\b\w/g,
                          (letter: string) =>
                            letter.toUpperCase()
                        ),

                    lastUpdated:
                      new Date(
                        analysis.updated_at
                      ).toLocaleDateString(
                        language === 'es'
                          ? 'es-CR'
                          : 'en-US'
                      ),

                  timestamp:
                    analysis.updated_at,

            href: (() => {
                  const params = new URLSearchParams()

                  params.set('tab', analysis.engine_type)

                  Object.entries(analysis.filters ?? {}).forEach(
                    ([key, value]) => {
                      if (
                        value !== undefined &&
                        value !== null &&
                        value !== ''
                      ) {
                        params.set(key, String(value))
                      }
                    }
                  )

                  return `${
                    language === 'es'
                      ? '/es/inteligencia-de-mercado'
                      : '/en/market-intelligence'
                  }?${params.toString()}`
                })(),
                  })
                )
              )
          }

          loadCollections()
          loadSavedAnalyses()
          loadSavedSearches()
          loadSavedProperties()
          loadPropertyNotes()

          function handleFavoritesChanged(): void {
            void loadSavedProperties()
          }

          function handlePropertyNotesChanged():
            void {
            void loadPropertyNotes()
          }

          window.addEventListener(
            'property-notes-updated',
            handlePropertyNotesChanged
          )

          function loadRecentlyViewedProperties(): void {
              setLoadedRecentlyViewedProperties(
                getRecentlyViewedProperties()
              )
            }

            function loadRecentlySavedProperties():
                void {
                setLoadedRecentlySavedProperties(
                  getRecentlySavedProperties()
                )
              }

            function loadRecentlyViewedMarkets(): void {
              setLoadedRecentlyViewedMarkets(
                getRecentlyViewedMarkets()
              )
            }

            loadRecentlyViewedProperties()
            loadRecentlySavedProperties()
            loadRecentlyViewedMarkets()

          window.addEventListener(
            'collections-updated',
            loadCollections
          )

          window.addEventListener(
            'favorites-updated',
            handleFavoritesChanged
          )

          window.addEventListener(
            'recent-properties-updated',
            loadRecentlyViewedProperties
          )

          window.addEventListener(
            'recent-markets-updated',
            loadRecentlyViewedMarkets
          )

          window.addEventListener(
            'recent-saved-properties-updated',
            loadRecentlySavedProperties
          )

          return () => {
            active = false

            window.removeEventListener(
              'property-notes-updated',
              handlePropertyNotesChanged
            )

            window.removeEventListener(
              'collections-updated',
              loadCollections
            )

            window.removeEventListener(
              'favorites-updated',
              handleFavoritesChanged
            )

            window.removeEventListener(
              'recent-properties-updated',
              loadRecentlyViewedProperties
            )

            window.removeEventListener(
              'recent-markets-updated',
              loadRecentlyViewedMarkets
            )

            window.removeEventListener(
              'recent-saved-properties-updated',
              loadRecentlySavedProperties
            )

          }
          }, [language])


    useEffect(() => {
          let active = true

    async function loadMarketComparisons():
            Promise<void> {
            const comparisons =
              await getMarketComparisons({
                language
              })

            if (!active) {
              return
            }

            setLoadedMarketComparisons(
              comparisons
            )

            setMarketComparisonsLoaded(
              true
            )
          }

          void loadMarketComparisons()

    function handleMarketComparisonsUpdated():
            void {
            void loadMarketComparisons()
          }

          window.addEventListener(
            'market-comparisons-updated',
            handleMarketComparisonsUpdated
          )

          return () => {
            active = false

          window.removeEventListener(
              'market-comparisons-updated',
              handleMarketComparisonsUpdated
            )
          }

        }, [language])

        useEffect(() => {
            let active = true

            async function loadPropertyComparisons():
              Promise<void> {
              try {
                const comparisons =
                  await getPropertyComparisons({
                    language
                  })

                if (!active) {
                  return
                }

                setLoadedPropertyComparisons(
                  comparisons
                )

                setPropertyComparisonsLoaded(
                  true
                )
              } catch (error) {
                console.error(
                  'PROPERTY COMPARISONS ERROR:',
                  error
                )

                if (active) {
                  setLoadedPropertyComparisons([])
                  setPropertyComparisonsLoaded(true)
                }
              }
            }

            void loadPropertyComparisons()

            function handlePropertyComparisonsUpdated():
              void {
              void loadPropertyComparisons()
            }

            window.addEventListener(
              'property-comparisons-updated',
              handlePropertyComparisonsUpdated
            )

            return () => {
              active = false

              window.removeEventListener(
                'property-comparisons-updated',
                handlePropertyComparisonsUpdated
              )
            }
          }, [language])

      useEffect(() => {
        let active = true

        async function loadNotifications():
          Promise<void> {
          const {
            data: {
              user
            },
            error: userError
          } = await supabase.auth.getUser()

          if (
            userError ||
            !user
          ) {
            if (active) {
              setLoadedNotifications([])
              setNotificationsLoaded(true)
            }

            return
          }

          const {
            data,
            error
          } = await supabase
            .from('notifications')
            .select(`
              id,
              type,
              title,
              message,
              url,
              is_read,
              created_at
            `)
            .eq(
              'user_id',
              user.id
            )
            .eq(
              'type',
              'saved_search'
            )
            .order(
              'created_at',
              {
                ascending: false
              }
            )
            .limit(20)

          if (error) {
            console.error(
              'MARKETHUB NOTIFICATIONS ERROR:',
              error
            )

            if (active) {
              setNotificationsLoaded(true)
            }

            return
          }

          if (!active) {
            return
          }

          setLoadedNotifications(
            (data ?? []).map(
              notification => ({
                id:
                  notification.id,

                type:
                  notification.type,

                title:
                  notification.title,

                message:
                  notification.message,

                url:
                  notification.url,

                isRead:
                  notification.is_read,

                createdAt:
                  new Date(
                    notification.created_at
                  ).toLocaleString(
                    language === 'es'
                      ? 'es-CR'
                      : 'en-US',
                    {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }
                  )
              })
            )
          )

          setNotificationsLoaded(true)
        }

        void loadNotifications()

        return () => {
          active = false
        }
      }, [language])

    const resolvedMarketComparisons =
      marketComparisonsLoaded
        ? loadedMarketComparisons
        : initialMarketComparisons

      const resolvedPropertyComparisons =
      propertyComparisonsLoaded
        ? loadedPropertyComparisons
        : []

    const totalComparisonCount =
      resolvedMarketComparisons.length +
      resolvedPropertyComparisons.length

    const savedProperties =
      loadedSavedProperties

    const propertyNotes =
    loadedPropertyNotes

    const favoriteCollections =
    loadedFavoriteCollections

    const savedAnalyses =
      loadedSavedAnalyses

    const latestAnalysis =
      [...savedAnalyses]
        .sort(
          (left, right) =>
            new Date(
              right.timestamp
            ).getTime() -
            new Date(
              left.timestamp
            ).getTime()
        )[0] ?? null

    const resolvedSavedSearches =
        [...loadedSavedSearches].sort(
          (left, right) => {
            if (
              savedSearchSort ===
              'oldest'
            ) {
              return (
                new Date(
                  left.createdAt
                ).getTime() -
                new Date(
                  right.createdAt
                ).getTime()
              )
            }

            if (
              savedSearchSort ===
              'name-asc'
            ) {
              return left.title.localeCompare(
                right.title,
                language === 'es'
                  ? 'es'
                  : 'en',
                {
                  sensitivity: 'base'
                }
              )
            }

            if (
              savedSearchSort ===
              'name-desc'
            ) {
              return right.title.localeCompare(
                left.title,
                language === 'es'
                  ? 'es'
                  : 'en',
                {
                  sensitivity: 'base'
                }
              )
            }

            return (
              new Date(
                right.createdAt
              ).getTime() -
              new Date(
                left.createdAt
              ).getTime()
            )
          }
        )

    const labels =
      language === 'es'
        ? {
            heading: 'Favoritos',
            dashboardSummary:
              'Resumen de Favoritos',

            summarySavedProperties:
              'Propiedades Guardadas',

            summarySavedSearches:
              'Búsquedas Guardadas',

            summarySavedAnalyses:
              'Análisis Guardados',

            summaryCollections:
              'Colecciones',

            summaryNotes:
              'Notas de Propiedades',

            summaryComparisons:
              'Comparaciones',
              recentActivity:
              'Actividad Reciente',

              recentActivitySummary:
                'Sus propiedades, mercados, análisis, comparaciones y notas más recientes.',

              emptyRecentActivity:
                'Todavía no tiene actividad reciente.',

              propertySaved:
                'Propiedad Guardada',

              propertyViewed:
                'Propiedad Vista',

              marketViewed:
                'Mercado Visto',

              analysisUpdated:
                'Análisis Actualizado',

              noteUpdated:
                'Nota Actualizada',

              propertyCompared:
                'Propiedades Comparadas',

              marketCompared:
                'Mercados Comparados',
            purpose:
              'Recuerde y organice las propiedades, búsquedas, mercados y análisis que le importan.',
            savedProperties:
              'Propiedades Guardadas',
            savedCount:
              savedProperties.length === 1
                ? 'Tiene 1 propiedad guardada.'
                : `Tiene ${savedProperties.length} propiedades guardadas.`,
              empty:
              'Todavía no ha guardado propiedades.',
              explore:
              'Explorar Propiedades',
              viewFavorites:
              'Ver Todos los Favoritos',
              savedSearches:
              'Búsquedas Guardadas',
              savedSearchCount:
                resolvedSavedSearches.length === 1
                  ? 'Tiene 1 búsqueda guardada.'
                  : `Tiene ${resolvedSavedSearches.length} búsquedas guardadas.`,
              viewAllSearches:
              'Ver Todas las Búsquedas',
              emptySearches:
              'Todavía no ha guardado búsquedas.',
              exploreMarket:
              'Explorar el Mercado',
              savedAnalyses:
              'Análisis Guardados del Explorador de Mercado',
              savedAnalysisCount:
              savedAnalyses.length === 1
                  ? 'Tiene 1 análisis guardado.'
                  : `Tiene ${savedAnalyses.length} análisis guardados.`,
              emptyAnalyses:
              'Todavía no ha guardado análisis del Explorador de Mercado.',
              openExplorer:
              'Abrir Explorador de Mercado',
              recentProperties:
              'Propiedades Vistas Recientemente',
              recentPropertyCount:
              loadedRecentlyViewedProperties.length === 1
                ? 'Ha visto recientemente 1 propiedad.'
                : `Ha visto recientemente ${loadedRecentlyViewedProperties.length} propiedades.`,
              emptyRecentProperties:
              'Todavía no ha visto propiedades.',
              recentMarkets:
              'Mercados Vistos Recientemente',
              recentMarketCount:
              loadedRecentlyViewedMarkets.length === 1
                  ? 'Ha visto recientemente 1 mercado.'
                  : `Ha visto recientemente ${loadedRecentlyViewedMarkets.length} mercados.`,
              emptyRecentMarkets:
              'Todavía no ha explorado mercados.',
              favoriteCollections:
              'Colecciones de Favoritos',

              favoriteCollectionCount:
              favoriteCollections.length === 1
                  ? 'Tiene 1 colección de favoritos.'
                  : `Tiene ${favoriteCollections.length} colecciones de favoritos.`,

              emptyCollections:
              'Todavía no ha creado colecciones de favoritos.',

              createCollection:
              'Crear Colección',

              notes:
              'Notas de Propiedades',

              noteCount:
              propertyNotes.length === 1
                  ? 'Tiene 1 nota de propiedad.'
                  : `Tiene ${propertyNotes.length} notas de propiedades.`,

              emptyNotes:
              'Todavía no ha guardado notas sobre propiedades.',

              marketComparisons:
                'Comparaciones de Mercados',

              comparisonCount:
                resolvedMarketComparisons.length === 1
                  ? 'Tiene 1 comparación de mercados.'
                  : `Tiene ${resolvedMarketComparisons.length} comparaciones de mercados.`,

              emptyComparisons:
                'Todavía no ha guardado comparaciones de mercados.',

              compareProperties:
                'Comparar Mercados',

              properties:
              'propiedades',

              sortSearches:
                'Ordenar búsquedas',

              newest:
                'Más recientes',

              oldest:
                'Más antiguas',

              nameAscending:
                'Nombre A–Z',

              nameDescending:
                'Nombre Z–A',
          }
        : {
            heading: 'Favorites',
            dashboardSummary:
              'Favorites Summary',

            summarySavedProperties:
              'Saved Properties',

            summarySavedSearches:
              'Saved Searches',

            summarySavedAnalyses:
              'Saved Analyses',

            summaryCollections:
              'Collections',

            summaryNotes:
              'Property Notes',

            summaryComparisons:
              'Comparisons',
              recentActivity:

              'Recent Activity',

              recentActivitySummary:
                'Your latest property, market, analysis, comparison, and note activity.',

              emptyRecentActivity:
                'You do not have any recent activity yet.',

              propertySaved:
                'Property Saved',

              propertyViewed:
                'Property Viewed',

              marketViewed:
                'Market Viewed',

              analysisUpdated:
                'Analysis Updated',

              noteUpdated:
                'Note Updated',

              propertyCompared:
                'Properties Compared',

              marketCompared:
                'Markets Compared',
              purpose:
                'Remember and organize the properties, searches, markets, and analyses that matter to you.',
              savedProperties:
                'Saved Properties',
              savedCount:
              savedProperties.length === 1
                ? 'You have 1 saved property.'
                : `You have ${savedProperties.length} saved properties.`,
              empty:
              'You have not saved any properties yet.',
              explore:
              'Explore Properties',
              viewFavorites:
              'View All Favorites',
              savedSearches:
              'Saved Searches',
              savedSearchCount:
                resolvedSavedSearches.length === 1
                  ? 'You have 1 saved search.'
                  : `You have ${resolvedSavedSearches.length} saved searches.`,
              viewAllSearches:
              'View All Searches',
              emptySearches:
              'You have not saved any searches yet.',
              exploreMarket:
              'Explore the Market',
              savedAnalyses:
              'Saved Analyses',
              savedAnalysisCount:
              savedAnalyses.length === 1
                  ? 'You have 1 saved analysis.'
                  : `You have ${savedAnalyses.length} saved analyses.`,
              emptyAnalyses:
              'You have not saved any Market Explorer analyses yet.',
              openExplorer:
              'Open Market Explorer',
              recentProperties:
              'Recently Viewed Properties',
              recentPropertyCount:
              loadedRecentlyViewedProperties.length === 1
                ? 'You recently viewed 1 property.'
                : `You recently viewed ${loadedRecentlyViewedProperties.length} properties.`,
              emptyRecentProperties:
              'You have not viewed any properties yet.',
              recentMarkets:
              'Recently Viewed Markets',
              recentMarketCount:
              loadedRecentlyViewedMarkets.length === 1
                  ? 'You recently viewed 1 market.'
                  : `You recently viewed ${loadedRecentlyViewedMarkets.length} markets.`,            

              emptyRecentMarkets:
              'You have not explored any markets yet.',
              favoriteCollections:
              'Favorite Collections',

              favoriteCollectionCount:
              favoriteCollections.length === 1
                  ? 'You have 1 favorite collection.'
                  : `You have ${favoriteCollections.length} favorite collections.`,

              emptyCollections:
              'You have not created any favorite collections yet.',

              createCollection:
              'Create Collection',

              notes:
              'Property Notes',

              noteCount:
              propertyNotes.length === 1
                  ? 'You have 1 property note.'
                  : `You have ${propertyNotes.length} property notes.`,

              emptyNotes:
              'You have not saved any property notes yet.',

              marketComparisons:
                'Market Comparisons',

              comparisonCount:
                resolvedMarketComparisons.length === 1
                  ? 'You have 1 market comparison.'
                  : `You have ${resolvedMarketComparisons.length} market comparisons.`,

              emptyComparisons:
                'You have not saved any market comparisons yet.',

              compareProperties:
                'Compare Markets',

              properties:
              'properties',

              sortSearches:
                'Sort searches',

              newest:
                'Newest',

              oldest:
                'Oldest',

              nameAscending:
                'Name A–Z',

              nameDescending:
                'Name Z–A',
          }


  const propertyHref = (
        property:
          MarketHubSavedProperty
      ) => {
        if (
          language === 'es'
        ) {
          return property.transactionType ===
            'rent'
            ? `/es/alquilar-arrendar/anuncio/${property.id}`
            : `/es/comprar/anuncio/${property.id}`
        }

        return property.transactionType ===
          'rent'
          ? `/en/rent-lease/listing/${property.id}`
          : `/en/buy/listing/${property.id}`
      }

          const savedPropertiesById =
            new Map(
              savedProperties.map(
                property => [
                  property.id,
                  property
                ]
              )
            )

          const recentActivity:
            RecentActivityItem[] = [
              ...loadedRecentlySavedProperties.flatMap(
                recent => {
                  const property =
                    savedPropertiesById.get(
                      recent.id
                    )

                  if (!property) {
                    return []
                  }

                  return [{
                    id:
                      `property-saved-${recent.id}`,

                    type:
                      'property-saved' as const,

                    title:
                      property.title,

                    description:
                      property.location ||
                      (
                        language === 'es'
                          ? 'Propiedad guardada'
                          : 'Saved property'
                      ),

                    timestamp:
                      recent.savedAt,

                    href:
                      propertyHref(
                        property
                      )
                  }]
                }
              ),

              ...loadedRecentlyViewedProperties.map(
                property => ({
                  id:
                    `property-viewed-${property.id}`,

                  type:
                    'property-viewed' as const,

                  title:
                    property.title,

                  description:
                    property.location ||
                    (
                      language === 'es'
                        ? 'Propiedad vista'
                        : 'Viewed property'
                    ),

                  timestamp:
                    property.viewedAt,

                  href:
                    property.href
                })
              ),

              ...loadedRecentlyViewedMarkets.map(
                market => ({
                  id:
                    `market-viewed-${market.id}`,

                  type:
                    'market-viewed' as const,

                  title:
                    market.title,

                  description:
                    market.marketType ||
                    market.summary,

                  timestamp:
                    market.viewedAt,

                  href:
                    market.href
                })
              ),

              ...savedAnalyses.map(
                analysis => ({
                  id:
                    `analysis-${analysis.id}`,

                  type:
                    'analysis-updated' as const,

                  title:
                    analysis.title,

                  description:
                    `${analysis.summary} · ${analysis.market}`,

                  timestamp:
                    analysis.timestamp,

                  href:
                    analysis.href
                })
              ),

              ...propertyNotes.map(
                note => ({
                  id:
                    `property-note-${note.id}`,

                  type:
                    'property-note-updated' as const,

                  title:
                    note.propertyTitle,

                  description:
                    note.note ||
                    (
                      language === 'es'
                        ? 'Nota de propiedad actualizada'
                        : 'Property note updated'
                    ),

                  timestamp:
                    note.timestamp,

                  href:
                    note.href
                })
              ),
              ...resolvedPropertyComparisons.map(
                comparison => ({
                  id:
                    `property-comparison-${comparison.id}`,

                  type:
                    'property-compared' as const,

                  title:
                    comparison.title,

                  description:
                    comparison.summary,

                  timestamp:
                    comparison.timestamp,

                  href:
                    comparison.href
                })
              ),
              ...resolvedMarketComparisons.map(
                comparison => ({
                  id:
                    `market-comparison-${comparison.id}`,

                  type:
                    'market-compared' as const,

                  title:
                    comparison.title,

                  description:
                    comparison.summary,

                  timestamp:
                    comparison.timestamp,

                  href:
                    comparison.href
                })
              ),
            ]
              .filter(
                activity =>
                  Boolean(
                    activity.timestamp
                  )
              )
              .sort(
                (left, right) =>
                  new Date(
                    right.timestamp
                  ).getTime() -
                  new Date(
                    left.timestamp
                  ).getTime()
              )
              .slice(
                0,
                12
              )

        async function handleRenameCollection(
          collectionId: string,
          currentName: string
        ) {
          const name =
            window.prompt(
              language === 'es'
                ? 'Nuevo nombre de la colección'
                : 'New collection name',
              currentName
            )

          if (!name?.trim()) {
            return
          }

          await renameFavoriteCollection(
            collectionId,
            name
          )

          setLoadedFavoriteCollections(
            current =>
              current.map(collection =>
                collection.id ===
                collectionId
                  ? {
                      ...collection,
                      name: name.trim()
                    }
                  : collection
              )
          )
        }

        async function handleDeleteCollection(
          collectionId: string
        ) {
          if (deletingCollection) {
            return
          }

          setDeletingCollection(true)

          try {
            await deleteFavoriteCollection(
              collectionId
            )

            setLoadedFavoriteCollections(
              current =>
                current.filter(
                  collection =>
                    collection.id !==
                    collectionId
                )
            )

            setDeletingCollectionId(
              null
            )
          } catch (error) {
            console.error(
              'DELETE COLLECTION ERROR:',
              error
            )
          } finally {
            setDeletingCollection(false)
          }
        }

        async function handleMoveCollection(
          collectionId: string,
          direction: 'up' | 'down'
        ) {
          if (reorderingCollection) {
            return
          }

          const currentIndex =
            loadedFavoriteCollections.findIndex(
              collection =>
                collection.id ===
                collectionId
            )

          if (currentIndex === -1) {
            return
          }

          const targetIndex =
            direction === 'up'
              ? currentIndex - 1
              : currentIndex + 1

          if (
            targetIndex < 0 ||
            targetIndex >=
              loadedFavoriteCollections.length
          ) {
            return
          }

          const previousCollections =
            loadedFavoriteCollections

          const reorderedCollections =
            [...loadedFavoriteCollections]

          const [
            movedCollection
          ] = reorderedCollections.splice(
            currentIndex,
            1
          )

          reorderedCollections.splice(
            targetIndex,
            0,
            movedCollection
          )

          setLoadedFavoriteCollections(
            reorderedCollections
          )

          setReorderingCollection(true)

          try {
            await reorderFavoriteCollections(
              reorderedCollections.map(
                collection =>
                  collection.id
              )
            )
          } catch (error) {
            console.error(
              'REORDER COLLECTIONS ERROR:',
              error
            )

            setLoadedFavoriteCollections(
              previousCollections
            )
          } finally {
            setReorderingCollection(false)
          }
        }

        async function handleRenameSavedSearch(
          savedSearchId: string
        ) {
          const trimmedName =
            savedSearchNameDraft.trim()

          if (
            !trimmedName ||
            savingSavedSearchName
          ) {
            return
          }

          setSavingSavedSearchName(true)

          const renamed =
            await renameSavedSearch(
              savedSearchId,
              trimmedName
            )

          if (renamed) {
            setLoadedSavedSearches(
              current =>
                current.map(search =>
                  search.id === savedSearchId
                    ? {
                        ...search,
                        title: trimmedName
                      }
                    : search
                )
            )

            setEditingSavedSearchId(null)
            setSavedSearchNameDraft('')
          }

          setSavingSavedSearchName(false)
        }

        async function handleDeleteSavedSearch(
          savedSearchId: string
        ) {
          if (deletingSavedSearch) {
            return
          }

          setDeletingSavedSearch(true)

          const deleted =
            await deleteSavedSearch(
              savedSearchId
            )

          if (deleted) {
            setLoadedSavedSearches(
              current =>
                current.filter(
                  search =>
                    search.id !==
                    savedSearchId
                )
            )

            setDeletingSavedSearchId(
              null
            )
          }

          setDeletingSavedSearch(false)
        }

        async function handleOpenNotification(
            notificationId: string
          ): Promise<void> {
            const notification =
              loadedNotifications.find(
                item =>
                  item.id ===
                  notificationId
              )

            if (
              !notification ||
              notification.isRead
            ) {
              return
            }

            await updateNotificationReadState(
              notificationId,
              true
            )
          }

          async function handleMarkRead(
            notificationId: string
          ): Promise<void> {
            await updateNotificationReadState(
              notificationId,
              true
            )
          }

          async function handleMarkUnread(
            notificationId: string
          ): Promise<void> {
            await updateNotificationReadState(
              notificationId,
              false
            )
          }

          async function handleMarkAllRead():
            Promise<void> {
            const previousNotifications =
              loadedNotifications

            const unreadIds =
              loadedNotifications
                .filter(
                  notification =>
                    !notification.isRead
                )
                .map(
                  notification =>
                    notification.id
                )

            if (
              unreadIds.length === 0
            ) {
              return
            }

            setLoadedNotifications(
              current =>
                current.map(
                  notification => ({
                    ...notification,
                    isRead: true
                  })
                )
            )

            const {
              error
            } = await supabase
              .from('notifications')
              .update({
                is_read: true
              })
              .in(
                'id',
                unreadIds
              )

            if (error) {
              console.error(
                'MARK ALL NOTIFICATIONS READ ERROR:',
                error
              )

              setLoadedNotifications(
                previousNotifications
              )
            }
          }

          async function updateNotificationReadState(
            notificationId: string,
            isRead: boolean
          ): Promise<void> {
            const previousNotifications =
              loadedNotifications

            setLoadedNotifications(
              current =>
                current.map(
                  notification =>
                    notification.id === notificationId
                      ? {
                          ...notification,
                          isRead
                        }
                      : notification
                )
            )

            const { error } = await supabase
              .from('notifications')
              .update({
                is_read: isRead
              })
              .eq('id', notificationId)

            if (error) {
              console.error(
                'UPDATE NOTIFICATION ERROR:',
                error
              )

              setLoadedNotifications(
                previousNotifications
              )
            }

            }

  const exploreHref =
    language === 'es'
      ? '/es/comprar'
      : '/en/buy'
  const favoritesHref =
    language === 'es'
      ? '/es/favoritos'
      : '/en/favorites'
  const marketExplorerHref =
    language === 'es'
        ? '/es/inteligencia-de-mercado?tab=explorer'
        : '/en/market-intelligence?tab=explorer'

  return (
                  <section style={section}>
                    <header style={header}>
                      <div>
                        <div style={titleRow}>
                          <Heart
                            size={25}
                            strokeWidth={1}
                            color="#C7A44B"
                          />

                          <h2 style={heading}>
                            {labels.heading}
                          </h2>
                        </div>

                        <p style={purpose}>
                          {labels.purpose}
                        </p>

                        <p style={summary}>
                          {labels.savedCount}
                        </p>
                      </div>

                      <Link
                        href={favoritesHref}
                        style={viewAllButton}
                      >
                        {labels.viewFavorites}
                      </Link>
                    </header>

                    <div style={divider} />

                      <div style={summaryDashboardHeader}>
                        <h3 style={summaryDashboardHeading}>
                          {labels.dashboardSummary}
                        </h3>
                      </div>

                      <div style={summaryCardGrid}>
                        <a
                          href="#saved-properties"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <Heart
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {savedProperties.length}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summarySavedProperties}
                          </div>
                        </a>

                        <a
                          href="#saved-searches"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <Search
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {resolvedSavedSearches.length}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summarySavedSearches}
                          </div>
                        </a>

                        <a
                          href="#saved-analyses"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <BarChart3
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {savedAnalyses.length}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summarySavedAnalyses}
                          </div>
                        </a>

                        <a
                          href="#favorite-collections"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <FolderHeart
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {favoriteCollections.length}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summaryCollections}
                          </div>
                        </a>

                        <a
                          href="#property-notes"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <NotebookPen
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {propertyNotes.length}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summaryNotes}
                          </div>
                        </a>

                        <a
                          href="#comparisons"
                          style={summaryCard}
                        >
                          <div style={summaryCardIcon}>
                            <Columns3
                              size={23}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </div>

                          <div style={summaryCardCount}>
                            {totalComparisonCount}
                          </div>

                          <div style={summaryCardLabel}>
                            {labels.summaryComparisons}
                          </div>
                        </a>
                      </div>

                      <div style={subsectionDivider} />



                      <div style={subsectionHeader}>
                          <div>
                            <h3 style={sectionHeading}>
                              {language === 'es'
                                ? 'Acciones Rápidas'
                                : 'Quick Actions'}
                            </h3>

                            <p style={subsectionSummary}>
                              {language === 'es'
                                ? 'Acceda rápidamente a sus herramientas más utilizadas.'
                                : 'Quick access to your most frequently used tools.'}
                            </p>
                          </div>
                        </div>

                        <div style={quickActionGrid}>
                          <div
                            style={{
                              ...quickActionCard,
                              opacity: 0.45,
                              cursor: 'not-allowed'
                            }}
                          >
                            <Search
                              size={24}
                              strokeWidth={1}
                              color="#777"
                            />

                            <div style={quickActionContent}>
                              <h4 style={quickActionTitle}>
                                {language === 'es'
                                  ? 'Guardar Búsqueda Actual'
                                  : 'Save Current Search'}
                              </h4>

                              <p style={quickActionDescription}>
                                {language === 'es'
                                  ? 'No hay una búsqueda activa para guardar.'
                                  : 'No active search is available to save.'}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={favoritesHref}
                            style={quickActionCard}
                          >
                            <Heart
                              size={24}
                              strokeWidth={1}
                              color="#C7A44B"
                            />

                            <div style={quickActionContent}>
                              <h4 style={quickActionTitle}>
                                {language === 'es'
                                  ? 'Abrir Favoritos'
                                  : 'Open Favorites'}
                              </h4>

                              <p style={quickActionDescription}>
                                {language === 'es'
                                  ? 'Vea y administre todas sus propiedades favoritas.'
                                  : 'View and manage all your favorite properties.'}
                              </p>
                            </div>

                            <ArrowRight
                              size={20}
                              strokeWidth={1}
                              color="#C7A44B"
                            />
                          </Link>

                          <div style={quickActionCard}>
                            <FolderHeart
                              size={24}
                              strokeWidth={1}
                              color="#C7A44B"
                            />

                            <div style={quickActionContent}>
                              <h4 style={quickActionTitle}>
                                {language === 'es'
                                  ? 'Crear Colección'
                                  : 'Create Collection'}
                              </h4>

                              <p style={quickActionDescription}>
                                {language === 'es'
                                  ? 'Organice propiedades guardadas en grupos.'
                                  : 'Organize saved properties into collections.'}
                              </p>

                              <div style={quickActionControl}>
                                <CreateCollectionButton
                                  language={language}
                                />
                              </div>
                            </div>
                          </div>

                          {latestAnalysis ? (
                            <Link
                              href={latestAnalysis.href}
                              style={quickActionCard}
                            >
                              <RefreshCw
                                size={24}
                                strokeWidth={1}
                                color="#C7A44B"
                              />

                              <div style={quickActionContent}>
                                <h4 style={quickActionTitle}>
                                  {language === 'es'
                                    ? 'Reanudar Análisis'
                                    : 'Resume Analysis'}
                                </h4>

                                <p style={quickActionDescription}>
                                  {language === 'es'
                                    ? `Continuar ${latestAnalysis.title} en ${latestAnalysis.market}.`
                                    : `Continue ${latestAnalysis.title} in ${latestAnalysis.market}.`}
                                </p>
                              </div>

                              <ArrowRight
                                size={20}
                                strokeWidth={1}
                                color="#C7A44B"
                              />
                            </Link>
                          ) : (
                            <div
                              style={{
                                ...quickActionCard,
                                opacity: 0.45,
                                cursor: 'not-allowed'
                              }}
                            >
                              <RefreshCw
                                size={24}
                                strokeWidth={1}
                                color="#777"
                              />

                              <div style={quickActionContent}>
                                <h4 style={quickActionTitle}>
                                  {language === 'es'
                                    ? 'Reanudar Análisis'
                                    : 'Resume Analysis'}
                                </h4>

                                <p style={quickActionDescription}>
                                  {language === 'es'
                                    ? 'Todavía no tiene análisis guardados.'
                                    : 'No saved analyses yet.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={subsectionDivider} />

                        <h3
                          id="saved-properties"
                          style={sectionHeading}
                        >
                        
                      {labels.savedProperties}

                      <span style={count}>
                        {savedProperties.length}
                      </span>
                    </h3>

                    {savedProperties.length === 0 ? (
                      <div style={emptyState}>
                        <Heart
                          size={36}
                          strokeWidth={0.75}
                          color="#C7A44B"
                        />

                        <p style={emptyText}>
                          {labels.empty}
                        </p>

                        <Link
                          href={exploreHref}
                          style={exploreLink}
                        >
                          {labels.explore}
                        </Link>
                      </div>
                    ) : (
                      <div style={propertyGrid}>
                        
                        {savedProperties.map(
                            property => (
                              <div
                                key={property.id}
                                style={propertyCard}
                              >
                                <Link
                                  href={propertyHref(
                                    property
                                  )}
                                  style={{
                                    color: '#fff',
                                    textDecoration: 'none'
                                  }}
                                >
                                  {property.image ? (
                                    <img
                                      src={property.image}
                                      alt={property.title}
                                      style={propertyImage}
                                    />
                                  ) : (
                                    <div
                                      style={
                                        imagePlaceholder
                                      }
                                    >
                                      <Heart
                                        size={34}
                                        strokeWidth={0.75}
                                        color="#C7A44B"
                                      />
                                    </div>
                                  )}

                                  <div style={propertyContent}>
                                    <h4 style={propertyTitle}>
                                      {property.title}
                                    </h4>

                                    {property.location && (
                                      <div style={location}>
                                        <MapPin
                                          size={15}
                                          strokeWidth={1}
                                        />

                                        {property.location}
                                      </div>
                                    )}

                                    {property.price && (
                                      <div style={price}>
                                        {property.price}
                                      </div>
                                    )}
                                  </div>
                                </Link>

                                <div
                                  style={{
                                    padding:
                                      '0 1rem 1rem'
                                  }}
                                >
                                  <CollectionPicker
                                    listingId={property.id}
                                    language={language}
                                  />
                                </div>
                              </div>
                            )
                          )}
                      </div>
                    )}

                    <div style={subsectionDivider} />
                          <div style={subsectionHeader}>
                            <div>
                              <h3
                                  id="saved-searches"
                                  style={sectionHeading}
                                >
                                <Search
                                  size={20}
                                  strokeWidth={1}
                                  color="#C7A44B"
                                />

                                {labels.savedSearches}

                                <span style={count}>
                                  {
                                    resolvedSavedSearches.length
                                  }
                                </span>
                              </h3>

                              <p style={subsectionSummary}>
                                {labels.savedSearchCount}
                              </p>
                            </div>

                            {resolvedSavedSearches.length >
                              1 && (
                              <label style={savedSearchSortLabel}>
                                <span style={savedSearchSortText}>
                                  {labels.sortSearches}
                                </span>

                                <select
                                  value={savedSearchSort}
                                  onChange={event =>
                                    setSavedSearchSort(
                                      event.target
                                        .value as SavedSearchSort
                                    )
                                  }
                                  style={savedSearchSortSelect}
                                >
                                  <option value="newest">
                                    {labels.newest}
                                  </option>

                                  <option value="oldest">
                                    {labels.oldest}
                                  </option>

                                  <option value="name-asc">
                                    {labels.nameAscending}
                                  </option>

                                  <option value="name-desc">
                                    {labels.nameDescending}
                                  </option>
                                </select>
                              </label>
                            )}
                          </div>

                          {resolvedSavedSearches.length === 0 ? (
                          <div style={emptyState}>
                              <Search
                              size={36}
                              strokeWidth={0.75}
                              color="#C7A44B"
                              />

                              <p style={emptyText}>
                              {labels.emptySearches}
                              </p>

                              <Link
                              href={exploreHref}
                              style={exploreLink}
                              >
                              {labels.exploreMarket}
                              </Link>
                          </div>
                          ) : (
                          <div style={searchGrid}>
                              {resolvedSavedSearches.map(search => {
                                const isEditing =
                                  editingSavedSearchId === search.id

                                return (
                                  <div
                                    key={search.id}
                                    style={searchCard}
                                  >
                                    <div style={searchIconWrap}>
                                      <Search
                                        size={26}
                                        strokeWidth={1}
                                        color="#C7A44B"
                                      />
                                    </div>

                                    <div style={searchContent}>
                                      {isEditing ? (
                                        <>
                                          <input
                                            value={savedSearchNameDraft}
                                            onChange={event =>
                                              setSavedSearchNameDraft(
                                                event.target.value
                                              )
                                            }
                                            onKeyDown={event => {
                                              if (event.key === 'Enter') {
                                                void handleRenameSavedSearch(
                                                  search.id
                                                )
                                              }

                                              if (event.key === 'Escape') {
                                                setEditingSavedSearchId(
                                                  null
                                                )

                                                setSavedSearchNameDraft(
                                                  ''
                                                )
                                              }
                                            }}
                                            autoFocus
                                            style={savedSearchNameInput}
                                          />

                                          <div style={savedSearchActions}>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                void handleRenameSavedSearch(
                                                  search.id
                                                )
                                              }
                                              disabled={
                                                savingSavedSearchName
                                              }
                                              style={savedSearchSaveButton}
                                            >
                                              {language === 'es'
                                                ? 'Guardar'
                                                : 'Save'}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSavedSearchId(
                                                  null
                                                )

                                                setSavedSearchNameDraft(
                                                  ''
                                                )
                                              }}
                                              style={savedSearchCancelButton}
                                            >
                                              {language === 'es'
                                                ? 'Cancelar'
                                                : 'Cancel'}
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <Link
                                            href={search.href}
                                            style={savedSearchTitleLink}
                                          >
                                            <h4 style={searchTitle}>
                                              {search.title}
                                            </h4>
                                          </Link>

                                          <div style={searchMeta}>
                                            {search.resultCount}{' '}
                                            {language === 'es'
                                              ? 'resultados'
                                              : 'results'}
                                          </div>

                                          <div style={searchUpdated}>
                                            {search.lastUpdated}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {isEditing ? null : (
                                      <div style={savedSearchCardActions}>
                                        {deletingSavedSearchId ===
                                        search.id ? (
                                          <div
                                            style={
                                              savedSearchDeleteConfirmation
                                            }
                                          >
                                            <span
                                              style={
                                                savedSearchDeleteText
                                              }
                                            >
                                              {language === 'es'
                                                ? '¿Eliminar?'
                                                : 'Delete?'}
                                            </span>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                void handleDeleteSavedSearch(
                                                  search.id
                                                )
                                              }
                                              disabled={
                                                deletingSavedSearch
                                              }
                                              style={
                                                savedSearchDeleteConfirmButton
                                              }
                                            >
                                              {language === 'es'
                                                ? 'Eliminar'
                                                : 'Delete'}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                setDeletingSavedSearchId(
                                                  null
                                                )
                                              }
                                              disabled={
                                                deletingSavedSearch
                                              }
                                              style={
                                                savedSearchDeleteCancelButton
                                              }
                                            >
                                              {language === 'es'
                                                ? 'Cancelar'
                                                : 'Cancel'}
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              aria-label={
                                                language === 'es'
                                                  ? 'Renombrar búsqueda'
                                                  : 'Rename search'
                                              }
                                              onClick={() => {
                                                setEditingSavedSearchId(
                                                  search.id
                                                )

                                                setSavedSearchNameDraft(
                                                  search.title
                                                )

                                                setDeletingSavedSearchId(
                                                  null
                                                )
                                              }}
                                              style={
                                                savedSearchEditButton
                                              }
                                            >
                                              <Pencil
                                                size={17}
                                                strokeWidth={1}
                                              />
                                            </button>

                                            <button
                                              type="button"
                                              aria-label={
                                                language === 'es'
                                                  ? 'Eliminar búsqueda'
                                                  : 'Delete search'
                                              }
                                              onClick={() => {
                                                setDeletingSavedSearchId(
                                                  search.id
                                                )

                                                setEditingSavedSearchId(
                                                  null
                                                )

                                                setSavedSearchNameDraft(
                                                  ''
                                                )
                                              }}
                                              style={
                                                savedSearchDeleteButton
                                              }
                                            >
                                              <Trash2
                                                size={17}
                                                strokeWidth={1}
                                              />
                                            </button>

                                            <Link
                                              href={search.href}
                                              style={
                                                savedSearchOpenLink
                                              }
                                            >
                                              <ArrowRight
                                                size={20}
                                                strokeWidth={1}
                                                color="#C7A44B"
                                              />
                                            </Link>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                                    </div>
                          )}

                          <div style={subsectionDivider} />

                          {notificationsLoaded && (
                            <MarketHubNotificationFeed
                                language={language}
                                notifications={
                                  loadedNotifications
                                }
                                onOpenNotification={
                                  notificationId =>
                                    void handleOpenNotification(
                                      notificationId
                                    )
                                }
                                onMarkRead={
                                  notificationId =>
                                    void handleMarkRead(
                                      notificationId
                                    )
                                }
                                onMarkUnread={
                                  notificationId =>
                                    void handleMarkUnread(
                                      notificationId
                                    )
                                }
                                onMarkAllRead={() =>
                                  void handleMarkAllRead()
                                }
                              />
                          )}

                          <div style={subsectionDivider} />

                          <div style={subsectionHeader}>
                            <div>
                              <h3
                                  id="saved-analyses"
                                  style={sectionHeading}
                                >
                                <BarChart3
                                      size={20}
                                      strokeWidth={1}
                                      color="#C7A44B"
                                  />

                                  {labels.savedAnalyses}

                                  <span style={count}>
                                      {savedAnalyses.length}
                                  </span>
                                  </h3>

                                  <p style={subsectionSummary}>
                                  {labels.savedAnalysisCount}
                                  </p>
                              </div>
                              </div>

                              {savedAnalyses.length === 0 ? (
                              <div style={emptyState}>
                                  <BarChart3
                                  size={36}
                                  strokeWidth={0.75}
                                  color="#C7A44B"
                                  />

                                  <p style={emptyText}>
                                  {labels.emptyAnalyses}
                                  </p>

                                  <Link
                                  href={marketExplorerHref}
                                  style={exploreLink}
                                  >
                                  {labels.openExplorer}
                                  </Link>
                              </div>
                              ) : (
                              <div style={analysisGrid}>
                                  {savedAnalyses.map(
                                  analysis => (
                                      <Link
                                      key={analysis.id}
                                      href={analysis.href}
                                      style={analysisCard}
                                      >
                                      <div style={analysisIconWrap}>
                                          <BarChart3
                                          size={26}
                                          strokeWidth={1}
                                          color="#C7A44B"
                                          />
                                      </div>

                                      <div style={analysisContent}>
                                          <h4 style={analysisTitle}>
                                          {analysis.title}
                                          </h4>

                                          <div style={analysisMarket}>
                                          {analysis.market}
                                          </div>

                                          <div style={analysisSummary}>
                                          {analysis.summary}
                                          </div>

                                          <div style={analysisUpdated}>
                                          {analysis.lastUpdated}
                                          </div>
                                      </div>

                                      <ArrowRight
                                          size={20}
                                          strokeWidth={1}
                                          color="#C7A44B"
                                      />
                                      </Link>
                                    )
                                  )}
                                </div>
                              )}

                                  <div style={subsectionDivider} />

              <div style={subsectionHeader}>
                <div>
                  <h3 style={sectionHeading}>
                    <Clock3
                      size={20}
                      strokeWidth={1}
                      color="#C7A44B"
                    />

                    {labels.recentActivity}

                    <span style={count}>
                      {recentActivity.length}
                    </span>
                  </h3>

                  <p style={subsectionSummary}>
                    {labels.recentActivitySummary}
                  </p>
                </div>
              </div>

              {recentActivity.length === 0 ? (
                <div style={emptyState}>
                  <Clock3
                    size={36}
                    strokeWidth={0.75}
                    color="#C7A44B"
                  />

                  <p style={emptyText}>
                    {labels.emptyRecentActivity}
                  </p>
                </div>
              ) : (
                <div style={recentActivityList}>
                  {recentActivity.map(
                    activity => (
                      <Link
                        key={activity.id}
                        href={activity.href}
                        style={recentActivityCard}
                      >
                        <div style={recentActivityIcon}>
                          {renderRecentActivityIcon(
                            activity.type
                          )}
                        </div>

                        <div style={recentActivityContent}>
                          <div style={recentActivityMeta}>
                            <span style={recentActivityType}>
                              {getRecentActivityLabel(
                                activity.type,
                                language
                              )}
                            </span>

                            <span style={recentActivityTime}>
                              {formatRelativeActivityTime(
                                activity.timestamp,
                                language
                              )}
                            </span>
                          </div>

                          <h4 style={recentActivityTitle}>
                            {activity.title}
                          </h4>

                          <p style={recentActivityDescription}>
                            {activity.description}
                          </p>
                        </div>

                        <ArrowRight
                          size={20}
                          strokeWidth={1}
                          color="#C7A44B"
                        />
                      </Link>
                    )
                  )}
                </div>
              )}

              <div style={subsectionDivider} />

              <div style={subsectionHeader}>
                <div>
                  <h3
                    id="favorite-collections"
                    style={sectionHeading}
                  >
                    <FolderHeart
                      size={20}
                      strokeWidth={1}
                      color="#C7A44B"
                    />

                    {labels.favoriteCollections}

                    <span style={count}>
                      {favoriteCollections.length}
                    </span>
                  </h3>

                  <p style={subsectionSummary}>
                    {labels.favoriteCollectionCount}
                  </p>

                  <div
                    style={{
                      marginTop: '.75rem'
                    }}
                  >
                    <CreateCollectionButton
                      language={language}
                    />
                  </div>
                </div>
              </div>

              {favoriteCollections.length === 0 ? (
              <div style={emptyState}>
                  <FolderHeart
                  size={36}
                  strokeWidth={0.75}
                  color="#C7A44B"
                  />

                  <p style={emptyText}>
                  {labels.emptyCollections}
                  </p>

                  <CreateCollectionButton
                    language={language}
                  />

              </div>
              ) : (
              <div style={collectionGrid}>
                  {favoriteCollections.map(
                    (
                      collection,
                      collectionIndex
                    ) => (
                    <div
                      key={collection.id}
                      style={collectionCard}
                    >
                      <Link
                        href={collection.href}
                        style={collectionMainLink}
                      >
                        <div style={collectionIconWrap}>
                          <FolderHeart
                            size={28}
                            strokeWidth={1}
                            color="#C7A44B"
                          />
                        </div>

                        <div style={collectionContent}>
                          <h4 style={collectionTitle}>
                            {collection.name}
                          </h4>

                          <div style={collectionMeta}>
                            {collection.propertyCount}{' '}
                            {labels.properties}
                          </div>

                          <div style={collectionUpdated}>
                            {collection.updatedAt}
                          </div>
                        </div>
                      </Link>

                      <div style={collectionActions}>
                          {deletingCollectionId ===
                          collection.id ? (
                            <div
                              style={
                                collectionDeleteConfirmation
                              }
                            >
                              <span
                                style={collectionDeleteText}
                              >
                                {language === 'es'
                                  ? '¿Eliminar?'
                                  : 'Delete?'}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteCollection(
                                    collection.id
                                  )
                                }
                                disabled={deletingCollection}
                                style={
                                  collectionDeleteConfirmButton
                                }
                              >
                                {language === 'es'
                                  ? 'Eliminar'
                                  : 'Delete'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingCollectionId(
                                    null
                                  )
                                }
                                disabled={deletingCollection}
                                style={
                                  collectionDeleteCancelButton
                                }
                              >
                                {language === 'es'
                                  ? 'Cancelar'
                                  : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <>

                            <button
                              type="button"
                              aria-label={
                                language === 'es'
                                  ? 'Mover colección hacia arriba'
                                  : 'Move collection up'
                              }
                              title={
                                language === 'es'
                                  ? 'Mover hacia arriba'
                                  : 'Move up'
                              }
                              onClick={() =>
                                void handleMoveCollection(
                                  collection.id,
                                  'up'
                                )
                              }
                              disabled={
                                collectionIndex === 0 ||
                                reorderingCollection
                              }
                              style={{
                                ...collectionReorderButton,
                                opacity:
                                  collectionIndex === 0 ||
                                  reorderingCollection
                                    ? 0.35
                                    : 1,
                                cursor:
                                  collectionIndex === 0 ||
                                  reorderingCollection
                                    ? 'not-allowed'
                                    : 'pointer'
                              }}
                            >
                              <ArrowUp
                                size={17}
                                strokeWidth={1}
                              />
                            </button>

                            <button
                              type="button"
                              aria-label={
                                language === 'es'
                                  ? 'Mover colección hacia abajo'
                                  : 'Move collection down'
                              }
                              title={
                                language === 'es'
                                  ? 'Mover hacia abajo'
                                  : 'Move down'
                              }
                              onClick={() =>
                                void handleMoveCollection(
                                  collection.id,
                                  'down'
                                )
                              }
                              disabled={
                                collectionIndex ===
                                  favoriteCollections.length - 1 ||
                                reorderingCollection
                              }
                              style={{
                                ...collectionReorderButton,
                                opacity:
                                  collectionIndex ===
                                    favoriteCollections.length - 1 ||
                                  reorderingCollection
                                    ? 0.35
                                    : 1,
                                cursor:
                                  collectionIndex ===
                                    favoriteCollections.length - 1 ||
                                  reorderingCollection
                                    ? 'not-allowed'
                                    : 'pointer'
                              }}
                            >
                              <ArrowDown
                                size={17}
                                strokeWidth={1}
                              />
                            </button>
                              <button
                                type="button"
                                aria-label={
                                  language === 'es'
                                    ? 'Renombrar colección'
                                    : 'Rename collection'
                                }
                                onClick={() => {
                                  setDeletingCollectionId(
                                    null
                                  )

                                  void handleRenameCollection(
                                    collection.id,
                                    collection.name
                                  )
                                }}
                                style={collectionEditButton}
                              >
                                <Pencil
                                  size={17}
                                  strokeWidth={1}
                                />
                              </button>

                              <button
                                type="button"
                                aria-label={
                                  language === 'es'
                                    ? 'Eliminar colección'
                                    : 'Delete collection'
                                }
                                onClick={() =>
                                  setDeletingCollectionId(
                                    collection.id
                                  )
                                }
                                style={collectionDeleteButton}
                              >
                                <Trash2
                                  size={17}
                                  strokeWidth={1}
                                />
                              </button>

                              <Link
                                href={collection.href}
                                style={collectionOpenLink}
                              >
                                <ArrowRight
                                  size={20}
                                  strokeWidth={1}
                                  color="#C7A44B"
                                />
                              </Link>
                            </>
                          )}
                        </div>
                    </div>
                  )
                )}
              </div>
              )}

                        <div style={subsectionDivider} />
                            <div style={subsectionHeader}>
                            <div>
                                <h3
                                  id="property-notes"
                                  style={sectionHeading}
                                >
                                <NotebookPen
                                    size={20}
                                    strokeWidth={1}
                                    color="#C7A44B"
                                />

                                {labels.notes}

                                <span style={count}>
                                    {propertyNotes.length}
                                </span>
                                </h3>

                                <p style={subsectionSummary}>
                                {labels.noteCount}
                                </p>
                            </div>
                            </div>

                            {propertyNotes.length === 0 ? (
                            <div style={emptyState}>
                                <NotebookPen
                                size={36}
                                strokeWidth={0.75}
                                color="#C7A44B"
                                />

                                <p style={emptyText}>
                                {labels.emptyNotes}
                                </p>
                            </div>
                            ) : (
                            <div style={noteGrid}>
                                {propertyNotes.map(note => (
                                <Link
                                    key={note.id}
                                    href={note.href}
                                    style={noteCard}
                                >
                                    <div style={noteIconWrap}>
                                    <NotebookPen
                                        size={25}
                                        strokeWidth={1}
                                        color="#C7A44B"
                                    />
                                    </div>

                                    <div style={noteContent}>
                                    <h4 style={notePropertyTitle}>
                                        {note.propertyTitle}
                                    </h4>

                                    <p style={noteText}>
                                        {note.note}
                                    </p>

                                    <div style={noteUpdated}>
                                        {note.updatedAt}
                                    </div>
                                    </div>

                                    <ArrowRight
                                    size={20}
                                    strokeWidth={1}
                                    color="#C7A44B"
                                    />
                                </Link>
                                ))}
                            </div>
                          )}

                          <div style={subsectionHeader}>
                            <div>
                                <h3
                                  id="comparisons"
                                  style={sectionHeading}
                                >
                                <Columns3
                                    size={20}
                                    strokeWidth={1}
                                    color="#C7A44B"
                                />

                                {labels.marketComparisons}

                                <span style={count}>
                                    {resolvedMarketComparisons.length}
                                </span>
                                </h3>

                                <p style={subsectionSummary}>
                                {labels.comparisonCount}
                                </p>
                            </div>
                            </div>

                            {resolvedMarketComparisons.length === 0 ? (
                            <div style={emptyState}>
                                <Columns3
                                size={36}
                                strokeWidth={0.75}
                                color="#C7A44B"
                                />

                                <p style={emptyText}>
                                {labels.emptyComparisons}
                                </p>

                                <Link
                                href={favoritesHref}
                                style={exploreLink}
                                >
                                {labels.compareProperties}
                                </Link>
                            </div>
                            ) : (
                            <div style={comparisonGrid}>
                                {resolvedMarketComparisons.map(
                                comparison => (
                                    <Link
                                    key={comparison.id}
                                    href={comparison.href}
                                    style={comparisonCard}
                                    >
                                    <div style={comparisonIconWrap}>
                                        <Columns3
                                        size={27}
                                        strokeWidth={1}
                                        color="#C7A44B"
                                        />
                                    </div>

                                    <div style={comparisonContent}>
                                        <h4 style={comparisonTitle}>
                                        {comparison.title}
                                        </h4>

                                        <div style={comparisonMeta}>
                                          {comparison.marketCount}{' '}
                                          {language === 'es'
                                            ? comparison.marketCount === 1
                                              ? 'mercado'
                                              : 'mercados'
                                            : comparison.marketCount === 1
                                            ? 'market'
                                            : 'markets'}
                                        </div>

                                        <div style={comparisonSummary}>
                                        {comparison.summary}
                                        </div>

                                        <div style={comparisonUpdated}>
                                        {comparison.updatedAt}
                                        </div>
                                    </div>

                                    <ArrowRight
                                        size={20}
                                        strokeWidth={1}
                                        color="#C7A44B"
                                    />
                                    </Link>
                                )
                                )}
                            </div>
                            )}
                        </section>
                      )
                    }

function getRecentActivityLabel(
  type: RecentActivityType,
  language: SupportedLanguage
): string {
  const labels =
    language === 'es'
      ? {
          'property-saved':
            'Propiedad Guardada',

          'property-viewed':
            'Propiedad Vista',

          'market-viewed':
            'Mercado Visto',

          'analysis-updated':
            'Análisis Actualizado',

          'property-note-updated':
            'Nota Actualizada',

          'property-compared':
            'Propiedades Comparadas',

          'market-compared':
            'Mercados Comparados'
        }
      : {
          'property-saved':
            'Property Saved',

          'property-viewed':
            'Property Viewed',

          'market-viewed':
            'Market Viewed',

          'analysis-updated':
            'Analysis Updated',

          'property-note-updated':
            'Note Updated',

          'property-compared':
            'Properties Compared',

          'market-compared':
            'Markets Compared'
        }

  return labels[type]
}

function formatRelativeActivityTime(
  timestamp: string,
  language: SupportedLanguage
): string {
  const timestampValue =
    new Date(
      timestamp
    ).getTime()

  if (
    Number.isNaN(
      timestampValue
    )
  ) {
    return ''
  }

  const difference =
    timestampValue -
    Date.now()

  const absoluteDifference =
    Math.abs(
      difference
    )

  const formatter =
    new Intl.RelativeTimeFormat(
      language === 'es'
        ? 'es'
        : 'en',
      {
        numeric: 'auto'
      }
    )

  if (
    absoluteDifference <
    60 * 1000
  ) {
    return formatter.format(
      Math.round(
        difference / 1000
      ),
      'second'
    )
  }

  if (
    absoluteDifference <
    60 * 60 * 1000
  ) {
    return formatter.format(
      Math.round(
        difference /
        (60 * 1000)
      ),
      'minute'
    )
  }

  if (
    absoluteDifference <
    24 * 60 * 60 * 1000
  ) {
    return formatter.format(
      Math.round(
        difference /
        (60 * 60 * 1000)
      ),
      'hour'
    )
  }

  if (
    absoluteDifference <
    30 * 24 * 60 * 60 * 1000
  ) {
    return formatter.format(
      Math.round(
        difference /
        (
          24 *
          60 *
          60 *
          1000
        )
      ),
      'day'
    )
  }

  return new Date(
    timestamp
  ).toLocaleDateString(
    language === 'es'
      ? 'es-CR'
      : 'en-US'
  )
}

function renderRecentActivityIcon(
  type: RecentActivityType
) {
  const iconProps = {
    size: 22,
    strokeWidth: 1,
    color: '#C7A44B'
  }

  switch (type) {
    case 'property-saved':
      return (
        <Heart
          {...iconProps}
        />
      )

    case 'property-viewed':
      return (
        <Eye
          {...iconProps}
        />
      )

    case 'market-viewed':
      return (
        <MapIcon
          {...iconProps}
        />
      )

    case 'analysis-updated':
      return (
        <BarChart3
          {...iconProps}
        />
      )

    case 'property-note-updated':
      return (
        <NotebookPen
          {...iconProps}
        />
      )

    case 'property-compared':
    case 'market-compared':
      return (
        <Columns3
          {...iconProps}
        />
      )

    default:
      return (
        <RefreshCw
          {...iconProps}
        />
      )
  }
}

function propertyNoteToPlainText(
  content: string
): string {
  const sanitized =
    DOMPurify.sanitize(
      content
    )

  const container =
    document.createElement(
      'div'
    )

  container.innerHTML =
    sanitized

  return (
    container.textContent ||
    container.innerText ||
    ''
  )
    .replace(
      /\u00a0/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function formatSavedPropertyPrice({
  transactionType,
  currency,
  priceMillions,
  monthlyPrice
}: {
  transactionType?:
    string | null
  currency?:
    string | null
  priceMillions?:
    number | string | null
  monthlyPrice?:
    number | string | null
}): string | null {
  const symbol =
    currency === 'USD'
      ? '$'
      : '₡'

  if (
    transactionType ===
    'rent'
  ) {
    if (
      monthlyPrice === null ||
      monthlyPrice === undefined
    ) {
      return null
    }

    return `${symbol}${Number(
      monthlyPrice
    ).toLocaleString()} / month`
  }

  if (
    priceMillions === null ||
    priceMillions === undefined
  ) {
    return null
  }

  return `₡${Number(
    priceMillions
  ).toLocaleString()}M`
}

const summaryDashboardHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem'
}

const summaryDashboardHeading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.1rem'
}

const summaryCardGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '.85rem'
}

const summaryCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  gridTemplateRows:
    'auto auto',
  columnGap: '.75rem',
  alignItems: 'center',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const summaryCardIcon = {
  gridRow: '1 / span 2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#121212',
  borderRadius: '999px'
}

const summaryCardCount = {
  color: '#fff',
  fontSize: '1.45rem',
  fontWeight: 700,
  lineHeight: 1
}

const summaryCardLabel = {
  marginTop: '.25rem',
  color: '#999',
  fontSize: '.78rem',
  lineHeight: 1.3
}

const section = {
  padding: '1.5rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}

const header = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const titleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.75rem',
  lineHeight: 1.2
}

const purpose = {
  maxWidth: '700px',
  margin: '.6rem 0 0',
  color: '#aaa',
  fontSize: '.92rem',
  lineHeight: 1.5
}

const summary = {
  margin: '.45rem 0 0',
  color: '#777',
  fontSize: '.86rem'
}

const viewAllButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '.75rem 1rem',
  color: '#C7A44B',
  background: '#1d1d1d',
  border: '1px solid #C7A44B',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 600
}

const divider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const sectionHeading = {
  display: 'flex',
  alignItems: 'center',
  gap: '.6rem',
  margin: '0 0 1rem',
  color: '#ff3b00',
  fontSize: '1.1rem'
}

const count = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.7rem',
  height: '1.7rem',
  padding: '0 .45rem',
  color: '#fff',
  background: '#292929',
  borderRadius: '999px',
  fontSize: '.78rem'
}

const emptyState = {
  display: 'grid',
  justifyItems: 'center',
  gap: '.8rem',
  padding: '2rem',
  textAlign: 'center' as const,
  background: '#191919',
  border: '1px dashed #3a3a3a',
  borderRadius: '14px'
}

const emptyText = {
  margin: 0,
  color: '#999'
}

const exploreLink = {
  color: '#C7A44B',
  textDecoration: 'none',
  fontWeight: 600
}

const quickActionGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const quickActionCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.85rem',
  minHeight: '120px',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const quickActionContent = {
  minWidth: 0
}

const quickActionTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const quickActionDescription = {
  margin: '.4rem 0 0',
  color: '#999',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const quickActionControl = {
  marginTop: '.75rem'
}

const propertyGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
}

const propertyCard = {
  overflow: 'hidden',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const propertyImage = {
  display: 'block',
  width: '100%',
  height: '160px',
  objectFit: 'cover' as const
}

const imagePlaceholder = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '160px',
  background: '#111'
}

const propertyContent = {
  padding: '1rem'
}

const propertyTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const location = {
  display: 'flex',
  alignItems: 'center',
  gap: '.35rem',
  marginTop: '.5rem',
  color: '#888',
  fontSize: '.82rem'
}

const price = {
  marginTop: '.5rem',
  color: '#C7A44B',
  fontSize: '.95rem',
  fontWeight: 600
}

const subsectionDivider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const subsectionHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1rem'
}

const subsectionSummary = {
  margin: '.4rem 0 0',
  color: '#777',
  fontSize: '.86rem'
}

const searchGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
}

const searchCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const searchIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const searchContent = {
  minWidth: 0
}

const searchTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const searchMeta = {
  marginTop: '.35rem',
  color: '#aaa',
  fontSize: '.82rem'
}

const searchUpdated = {
  marginTop: '.2rem',
  color: '#777',
  fontSize: '.75rem'
}

const analysisGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const analysisCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const analysisIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const analysisContent = {
  minWidth: 0
}

const analysisTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const analysisMarket = {
  marginTop: '.35rem',
  color: '#C7A44B',
  fontSize: '.82rem',
  fontWeight: 600
}

const analysisSummary = {
  marginTop: '.35rem',
  color: '#aaa',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const analysisUpdated = {
  marginTop: '.35rem',
  color: '#777',
  fontSize: '.75rem'
}

const recentPropertyGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '1rem'
}

const recentPropertyCard = {
  overflow: 'hidden',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const recentPropertyImage = {
  display: 'block',
  width: '100%',
  height: '140px',
  objectFit: 'cover' as const
}

const recentImagePlaceholder = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '140px',
  background: '#111'
}

const recentPropertyContent = {
  padding: '.9rem'
}

const recentPropertyTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem',
  lineHeight: 1.35
}

const recentlyViewedAt = {
  marginTop: '.45rem',
  color: '#707070',
  fontSize: '.72rem'
}

const recentMarketGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const recentMarketCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const recentMarketIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const recentMarketContent = {
  minWidth: 0
}

const recentMarketTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const recentMarketType = {
  marginTop: '.3rem',
  color: '#C7A44B',
  fontSize: '.78rem',
  fontWeight: 600
}

const recentMarketSummary = {
  marginTop: '.35rem',
  color: '#999',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const emptyActionButton = {
  padding: 0,
  color: '#C7A44B',
  background: 'transparent',
  border: 'none',
  fontFamily: 'inherit',
  fontWeight: 600,
  cursor: 'pointer'
}

const recentActivityList = {
  display: 'grid',
  gap: '.75rem'
}

const recentActivityCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '.9rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const recentActivityIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.8rem',
  height: '2.8rem',
  background: '#121212',
  borderRadius: '999px'
}

const recentActivityContent = {
  minWidth: 0
}

const recentActivityMeta = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '.5rem'
}

const recentActivityType = {
  color: '#C7A44B',
  fontSize: '.74rem',
  fontWeight: 600,
  textTransform:
    'uppercase' as const,
  letterSpacing: '.04em'
}

const recentActivityTime = {
  color: '#707070',
  fontSize: '.72rem'
}

const recentActivityTitle = {
  margin: '.3rem 0 0',
  color: '#fff',
  fontSize: '.96rem',
  lineHeight: 1.35
}

const recentActivityDescription = {
  display: '-webkit-box',
  margin: '.3rem 0 0',
  overflow: 'hidden',
  color: '#999',
  fontSize: '.8rem',
  lineHeight: 1.45,
  WebkitBoxOrient:
    'vertical' as const,
  WebkitLineClamp: 2
}

const collectionGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
}

const collectionCard = {
  display: 'grid',
  gridTemplateColumns:
  'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const collectionMainLink = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '.85rem',
  minWidth: 0,
  color: '#fff',
  textDecoration: 'none'
}

const collectionReorderButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  padding: 0,
  color: '#aaa',
  background: '#161616',
  border: '1px solid #303030',
  borderRadius: '999px'
}

const collectionEditButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  padding: 0,
  color: '#C7A44B',
  background: '#161616',
  border: '1px solid #303030',
  borderRadius: '999px',
  cursor: 'pointer'
}

const collectionActions = {
  display: 'flex',
  alignItems: 'center',
  gap: '.5rem'
}

const collectionDeleteButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  padding: 0,
  color: '#d66',
  background: '#161616',
  border: '1px solid #303030',
  borderRadius: '999px',
  cursor: 'pointer'
}

const collectionDeleteConfirmation = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '.4rem'
}

const collectionDeleteText = {
  color: '#aaa',
  fontSize: '.78rem'
}

const collectionDeleteConfirmButton = {
  padding: '.4rem .6rem',
  color: '#fff',
  background: '#8f2d2d',
  border: '1px solid #b34747',
  borderRadius: '7px',
  fontFamily: 'inherit',
  fontSize: '.75rem',
  fontWeight: 600,
  cursor: 'pointer'
}

const collectionDeleteCancelButton = {
  padding: '.4rem .6rem',
  color: '#aaa',
  background: '#1b1b1b',
  border: '1px solid #3a3a3a',
  borderRadius: '7px',
  fontFamily: 'inherit',
  fontSize: '.75rem',
  cursor: 'pointer'
}

const collectionOpenLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const collectionIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.8rem',
  height: '2.8rem',
  background: '#161616',
  borderRadius: '999px'
}

const collectionContent = {
  minWidth: 0
}

const collectionTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const collectionMeta = {
  marginTop: '.35rem',
  color: '#aaa',
  fontSize: '.82rem'
}

const collectionUpdated = {
  marginTop: '.25rem',
  color: '#777',
  fontSize: '.74rem'
}

const noteGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const noteCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const noteIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const noteContent = {
  minWidth: 0
}

const notePropertyTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem',
  lineHeight: 1.35
}

const noteText = {
  display: '-webkit-box',
  margin: '.4rem 0 0',
  overflow: 'hidden',
  color: '#aaa',
  fontSize: '.82rem',
  lineHeight: 1.5,
  WebkitBoxOrient:
    'vertical' as const,
  WebkitLineClamp: 3
}

const noteUpdated = {
  marginTop: '.4rem',
  color: '#777',
  fontSize: '.74rem'
}

const comparisonGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(270px, 1fr))',
  gap: '1rem'
}

const comparisonCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.85rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const comparisonIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const comparisonContent = {
  minWidth: 0
}

const comparisonTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.35
}

const comparisonMeta = {
  marginTop: '.3rem',
  color: '#C7A44B',
  fontSize: '.8rem',
  fontWeight: 600
}

const comparisonSummary = {
  marginTop: '.35rem',
  color: '#999',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const comparisonUpdated = {
  marginTop: '.35rem',
  color: '#777',
  fontSize: '.74rem'
}