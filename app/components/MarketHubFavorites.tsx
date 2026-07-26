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
  getFavoriteCollections
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

import {
  ArrowRight,
  BarChart3,
  Clock3,
  Columns3,
  FolderHeart,
  Heart,
  Map,
  MapPin,
  NotebookPen,
  Pencil,
  Search,
  Trash2
} from 'lucide-react'



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
      propertyNotes?: PropertyNote[]
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
      propertyNotes = [],
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
      loadedFavoriteCollections,
      setLoadedFavoriteCollections
    ] = useState<
      FavoriteCollection[]
    >(
      initialFavoriteCollections
    )

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
                getFirstImage(
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

          function handleFavoritesChanged(): void {
            loadSavedProperties()
          }

          window.addEventListener(
            'collections-updated',
            loadCollections
          )

          window.addEventListener(
            'favorites-updated',
            handleFavoritesChanged
          )

          return () => {
            active = false

            window.removeEventListener(
              'collections-updated',
              loadCollections
            )

            window.removeEventListener(
              'favorites-updated',
              handleFavoritesChanged
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

const resolvedMarketComparisons =
  marketComparisonsLoaded
    ? loadedMarketComparisons
    : initialMarketComparisons


  const savedProperties =
    loadedSavedProperties

  const favoriteCollections =
  loadedFavoriteCollections

  const savedAnalyses =
    loadedSavedAnalyses

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
            recentlyViewedProperties.length === 1
                ? 'Ha visto recientemente 1 propiedad.'
                : `Ha visto recientemente ${recentlyViewedProperties.length} propiedades.`,
            emptyRecentProperties:
            'Todavía no ha visto propiedades.',
            recentMarkets:
            'Mercados Vistos Recientemente',
            recentMarketCount:
            recentlyViewedMarkets.length === 1
                ? 'Ha visto recientemente 1 mercado.'
                : `Ha visto recientemente ${recentlyViewedMarkets.length} mercados.`,
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
            recentlyViewedProperties.length === 1
                ? 'You recently viewed 1 property.'
                : `You recently viewed ${recentlyViewedProperties.length} properties.`,
            emptyRecentProperties:
            'You have not viewed any properties yet.',
            recentMarkets:
            'Recently Viewed Markets',
            recentMarketCount:
            recentlyViewedMarkets.length === 1
                ? 'You recently viewed 1 market.'
                : `You recently viewed ${recentlyViewedMarkets.length} markets.`,            

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

      <h3 style={sectionHeading}>
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
                <h3 style={sectionHeading}>
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

                <div style={subsectionHeader}>
                <div>
                    <h3 style={sectionHeading}>
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

                            {labels.recentProperties}

                            <span style={count}>
                                {recentlyViewedProperties.length}
                            </span>
                            </h3>

                            <p style={subsectionSummary}>
                            {labels.recentPropertyCount}
                            </p>
                        </div>
                        </div>

                        {recentlyViewedProperties.length === 0 ? (
                        <div style={emptyState}>
                            <Clock3
                            size={36}
                            strokeWidth={0.75}
                            color="#C7A44B"
                            />

                            <p style={emptyText}>
                            {labels.emptyRecentProperties}
                            </p>

                            <Link
                            href={exploreHref}
                            style={exploreLink}
                            >
                            {labels.explore}
                            </Link>
                        </div>
                        ) : (
                        <div style={recentPropertyGrid}>
                            {recentlyViewedProperties.map(
                            property => (
                                <Link
                                key={property.id}
                                href={property.href}
                                style={recentPropertyCard}
                                >
                                {property.image ? (
                                    <img
                                    src={property.image}
                                    alt={property.title}
                                    style={recentPropertyImage}
                                    />
                                ) : (
                                    <div style={recentImagePlaceholder}>
                                    <Heart
                                        size={30}
                                        strokeWidth={0.75}
                                        color="#C7A44B"
                                    />
                                    </div>
                                )}

                                <div style={recentPropertyContent}>
                                    <h4 style={recentPropertyTitle}>
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

                                    <div style={recentlyViewedAt}>
                                    {property.viewedAt}
                                    </div>
                                </div>
                                </Link>
                            )
                            )}
                        </div>
                        )}

                        <div style={subsectionDivider} />
                            <div style={subsectionHeader}>
                            <div>
                                <h3 style={sectionHeading}>
                                <FolderHeart
                                    size={20}
                                    strokeWidth={1}
                                    color="#C7A44B"
                                />

                          <div style={subsectionHeader}>
                            <div>
                              <h3 style={sectionHeading}>
                                <Map
                                  size={20}
                                  strokeWidth={1}
                                  color="#C7A44B"
                                />

                                {labels.recentMarkets}

                                <span style={count}>
                                  {recentlyViewedMarkets.length}
                                </span>
                              </h3>

                              <p style={subsectionSummary}>
                                {labels.recentMarketCount}
                              </p>
                            </div>
                          </div>

                          {recentlyViewedMarkets.length === 0 ? (
                            <div style={emptyState}>
                              <Map
                                size={36}
                                strokeWidth={0.75}
                                color="#C7A44B"
                              />

                              <p style={emptyText}>
                                {labels.emptyRecentMarkets}
                              </p>

                              <Link
                                href={marketExplorerHref}
                                style={exploreLink}
                              >
                                {labels.openExplorer}
                              </Link>
                            </div>
                          ) : (
                            <div style={recentMarketGrid}>
                              {recentlyViewedMarkets.map(
                                market => (
                                  <Link
                                    key={market.id}
                                    href={market.href}
                                    style={recentMarketCard}
                                  >
                                    <div style={recentMarketIconWrap}>
                                      <Map
                                        size={26}
                                        strokeWidth={1}
                                        color="#C7A44B"
                                      />
                                    </div>

                                    <div style={recentMarketContent}>
                                      <h4 style={recentMarketTitle}>
                                        {market.title}
                                      </h4>

                                      <div style={recentMarketType}>
                                        {market.marketType}
                                      </div>

                                      <div style={recentMarketSummary}>
                                        {market.summary}
                                      </div>

                                      <div style={recentlyViewedAt}>
                                        {market.viewedAt}
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
                                collection => (
                                    <Link
                                    key={collection.id}
                                    href={collection.href}
                                    style={collectionCard}
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

                        <div style={subsectionDivider} />
                            <div style={subsectionHeader}>
                            <div>
                                <h3 style={sectionHeading}>
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

function getFirstImage(
  images: unknown
): string | null {
  if (
    Array.isArray(images)
  ) {
    return typeof images[0] ===
      'string'
      ? images[0]
      : null
  }

  if (
    typeof images !==
    'string'
  ) {
    return null
  }

  try {
    const parsed =
      JSON.parse(images)

    if (
      Array.isArray(parsed) &&
      typeof parsed[0] ===
        'string'
    ) {
      return parsed[0]
    }
  } catch {
    return (
      images
        .split('|')
        .map(image =>
          image.trim()
        )
        .filter(Boolean)[0] ??
      null
    )
  }

  return null
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

const collectionGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
}

const collectionCard = {
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