'use client'
import {useHomeMarketplace, useMarketplaceFilters, MarketplaceContextHeading} from '../home-marketplace/MarketplaceContext'
import {useSiteTheme} from '@/app/components/theme/ThemeProvider'

import {
  Suspense,
  useEffect,
  useRef,
  useState
} from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import FilterButton from '@/app/components/FilterButton'

import TopBar from '@/app/components/TopBar'
import BuyHeaderES from '@/app/components/BuyHeaderES'
import BuySidebarES from '@/app/components/BuySidebarES'
import MarketplaceListingGrid from '@/app/components/marketplace/AddonMarketplaceGrid'
import { normalizeText } from '@/lib/normalizeText' 
import {
  getSavedSearch,
  saveSearch
} from '@/lib/saved-searches'

import {
      provinces,
      districts
    } from '@/data/property-data'

import {
  toggleFavorite
} from '@/lib/favorites'

import {
  getListingFavoriteIds
} from '@/lib/account-storage'

import {
  recordListingSaved
} from '@/lib/activity'

import {
  trackListingRemoved
} from '@/lib/activity/listings'

import EmailAuthModal from '@/app/components/EmailAuthModal'

import PropertyComparisonTray
  from '@/app/components/comparisons/PropertyComparisonTray'

import {
  usePropertyComparisonSelection
} from '@/lib/property-comparison-selection'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

import {
  matchesPropertyAreaRange,
  matchesConstructionAreaRange
} from '@/lib/marketplace-area-ranges'

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <BuyPageContent />
    </Suspense>
  )
}

function BuyPageContent() {
const home = useHomeMarketplace()
const embedded = home !== null
const [desktopSidebarCollapsed,setDesktopSidebarCollapsed] = useState(false)

const searchParams =
  useSearchParams()

const savedSearchId =
  searchParams.get('savedSearch')

const {
  isSelected,
  toggleProperty,
  maximumProperties,
  propertyIds
} =
  usePropertyComparisonSelection()

const navButton = {
            background:'#FFFFFF50',
            border:'.0625rem solid #ffffff50',
            color:'#fff',
            borderRadius:'999rem',
            padding:'.85rem 1.25rem',
            fontWeight:'bold',
            cursor:'pointer',
            transition:'all .2s ease',
            backdropFilter:'blur(10px)'
          }


  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useMarketplaceFilters({
    province: '',
    canton: '',
    district: '',
    price_range: '',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    year_built: '',
    construction_area: '',
    use_type: '',
    property_area: '',
    utility: [] as string[],
    legal_status: '',
    environment: [] as string[],
    accessibility: '',
    distance_to_paved_road_range: '',
    terrain: [] as string[]
  })

  const [showadvanced_filters, setShowadvanced_filters] = useState(false)
  const [showProvinceOptions, setShowProvinceOptions] = useState(true)
  const [showCantonOptions, setShowCantonOptions] = useState(false)
  const [showDistrictOptions, setShowDistrictOptions] = useState(false)
  const [showLocationOptions, setShowLocationOptions] = useState(true)
  const [showPriceOptions, setShowPriceOptions] = useState(true)
  const [showproperty_typeOptions, setShowproperty_typeOptions] = useState(true)
  const [showproperty_areaOptions, setShowproperty_areaOptions] = useState(true)
  const [showutilityOptions, setShowutilityOptions] = useState(true)
  const [showenvironmentOptions, setShowenvironmentOptions] = useState(true)
  const [showAccessibilityOptions, setShowAccessibilityOptions] = useState(true)
  const [showTerrainOptions, setShowTerrainOptions] = useState(true)
  const [showlegal_statusOptions, setShowlegal_statusOptions] = useState(true)
  const [showBedroomOptions, setShowBedroomOptions] = useState(false)
  const [showBathroomOptions, setShowBathroomOptions] = useState(false)
  const [showParkingOptions, setShowParkingOptions] = useState(false)
  const [showYearBuiltOptions, setShowYearBuiltOptions] = useState(false)
  const [showConstructionAreaOptions, setShowConstructionAreaOptions] = useState(true)
  const [showResidentialSummary, setShowResidentialSummary] = useState(false)

  const [showMobileFilters, setShowMobileFilters] = useState(embedded)

  const [favoriteIds, setFavoriteIds] =
  useState<string[]>([])

  const [isMobile, setIsMobile] =
    useState(false)

  const {theme,setTheme} = useSiteTheme()

  const [
    showSaveSearchAuth,
    setShowSaveSearchAuth
  ] = useState(false)

  const wasOrienting = useRef(home?.orienting)
  useEffect(() => {
    if (home && wasOrienting.current && !home.orienting) {
      setDesktopSidebarCollapsed(true)
      setShowMobileFilters(false)
    }
    wasOrienting.current = home?.orienting
  }, [home?.orienting])

  useEffect(() => {
      let active = true

      async function restoreSavedSearch() {
        if (!savedSearchId) {
          return
        }

        const savedSearch =
          await getSavedSearch(
            savedSearchId
          )

        if (
          !active ||
          !savedSearch ||
          savedSearch.transaction_type !== 'buy'
        ) {
          return
        }

        setFilters(current => ({
          ...current,
          ...savedSearch.filters,
          utility:
            Array.isArray(
              savedSearch.filters?.utility
            )
              ? savedSearch.filters.utility
              : [],
          environment:
            Array.isArray(
              savedSearch.filters?.environment
            )
              ? savedSearch.filters.environment
              : [],
          terrain:
            Array.isArray(
              savedSearch.filters?.terrain
            )
              ? savedSearch.filters.terrain
              : []
        }))
        if (savedSearch.filters?.district) {
            setShowLocationOptions(false)
            setShowProvinceOptions(false)
            setShowCantonOptions(false)
            setShowDistrictOptions(false)
          } else if (savedSearch.filters?.canton) {
            setShowLocationOptions(true)
            setShowProvinceOptions(false)
            setShowCantonOptions(false)
            setShowDistrictOptions(true)
          } else if (savedSearch.filters?.province) {
            setShowLocationOptions(true)
            setShowProvinceOptions(false)
            setShowCantonOptions(true)
            setShowDistrictOptions(false)
          }
      }

      void restoreSavedSearch()

      return () => {
        active = false
      }
    }, [savedSearchId])

  useEffect(() => {
  let active = true

  async function syncFavorites() {
        const ids =
          await getListingFavoriteIds()

        if (!active) {
          return
        }

        setFavoriteIds(ids)
      }

      void syncFavorites()

      function handleFavoritesUpdated() {
        void syncFavorites()
      }

      window.addEventListener(
        'favorites-updated',
        handleFavoritesUpdated
      )

      return () => {
        active = false

        window.removeEventListener(
          'favorites-updated',
          handleFavoritesUpdated
        )
      }
    }, [])

    useEffect(() => {
      function handleResize() {
        setIsMobile(
          window.innerWidth <= 768
        )
      }

      handleResize()

      window.addEventListener(
        'resize',
        handleResize
      )

      return () => {
        window.removeEventListener(
          'resize',
          handleResize
        )
      }
    }, [])

    useEffect(() => {

      async function fetchListings() {

const response =
  await fetch(
    '/api/public-listings?transaction=sale'
  )

if (!response.ok) {
  throw new Error(
    `Listing request failed: ${response.status}`
  )
}

const payload =
  await response.json()

const data =
  Array.isArray(payload.listings)
    ? payload.listings
    : []



const normalizedSupabaseListings =
  (data || []).map(
    (listing: any) => ({
      ...listing,

      id:
        createListingId(
          listing
        ),

      images:
        resolveListingImages(
          listing.images
        )
    })
  )

                const mergedListings = [
                  ...normalizedSupabaseListings
                ]


                let placedListings =
                    mergedListings


                  try {

                    const placementResponse =
                      await fetch(
                        '/api/marketplace-placement',
                        {
                          method:
                            'POST',

                          headers: {
                            'Content-Type':
                              'application/json'
                          },

                          body:
                            JSON.stringify({
                              listings:
                                mergedListings,

                              surface:
                                'buy-results'
                            }),

                          cache:
                            'no-store'
                        }
                      )


                    if (
                      placementResponse.ok
                    ) {

                      const placementResult =
                        await placementResponse.json() as {
                          listings?:
                            typeof mergedListings
                        }


                      if (
                        Array.isArray(
                          placementResult.listings
                        )
                      ) {

                        placedListings =
                          placementResult.listings
                      }
                    } else {

                      console.error(
                        'BUY MARKETPLACE PLACEMENT FAILED:',
                        placementResponse.status
                      )
                    }

                  } catch (
                    placementError
                  ) {

                    /*
                    * Placement enhancement fails open to the already-valid
                    * organic cohort.
                    *
                    * Listing discovery must not disappear because promotion
                    * ranking temporarily failed.
                    */

                    console.error(
                      'BUY MARKETPLACE PLACEMENT ERROR:',
                      placementError
                    )
                  }


                  setProperties(
                    placedListings
                  )

                setLoading(false)


                  }

      fetchListings()

    }, [])

    const bedroomOptions = [
        '1+ Bedrooms',
        '2+ Bedrooms',
        '3+ Bedrooms',
        '4+ Bedrooms',
        '5+ Bedrooms'
      ]

      const bathroomOptions = [
        '1+ Bathrooms',
        '2+ Bathrooms',
        '3+ Bathrooms',
        '4+ Bathrooms'
      ]

      const parkingOptions = [
        '1+ Spaces',
        '2+ Spaces',
        '3+ Spaces',
        '4+ Spaces'
      ]

      const yearBuiltOptions = [
        'Pre-1980',
        '1980s',
        '1990s',
        '2000s',
        '2010s',
        '2020+'
      ]

      const constructionAreaOptions = [
        '<50m²',
        '50-100m²',
        '100-200m²',
        '200-400m²',
        '400m²+'
      ]

      async function handleSaveSearch() {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setShowSaveSearchAuth(true)
          return
        }

        await saveSearch(
          'buy',
          'es',
          filters
        )
      }
                          
const filteredProperties = properties.filter((property) => {

      const getFirstNumber = (
        value: unknown
      ) => {
        const match =
          String(value ?? '')
            .replace(/,/g, '')
            .match(/\d+(\.\d+)?/)

        return match
          ? Number(match[0])
          : null
      }

      const getYear = (
        value: unknown
      ) => {
        const match =
          String(value ?? '')
            .match(/\b(19|20)\d{2}\b/)

        return match
          ? Number(match[0])
          : null
      }

      const normalizeValues = (
        value: unknown
      ) => {
        if (Array.isArray(value)) {
          return value.map(item =>
            normalizeText(String(item))
          )
        }

        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return []
        }

        return String(value)
          .split(/[|,;]/)
          .map(item =>
            normalizeText(item.trim())
          )
          .filter(Boolean)
      }

      /*
      * LOCATION
      */

      if (
        filters.province &&
        normalizeText(property.province)
          .replace(' provincia', '') !==
        normalizeText(filters.province)
      ) {
        return false
      }

      if (filters.canton) {
        const propertyCanton =
          normalizeText(property.canton)

        const selectedCanton =
          normalizeText(filters.canton)

        const cantonMatches =
          propertyCanton === selectedCanton ||
          (
            selectedCanton === 'san jose' &&
            propertyCanton.includes('san jo')
          )

        if (!cantonMatches) {
          return false
        }
      }

      if (
        filters.district &&
        normalizeText(property.district) !==
        normalizeText(filters.district)
      ) {
        return false
      }

      /*
      * PRICE
      */

      if (filters.price_range) {
        const priceInColones =
          Number(
            property.marketplace_price_crc
          )

        if (
          !Number.isFinite(
            priceInColones
          ) ||
          priceInColones <= 0
        ) {
          return false
        }

        if (
          filters.price_range === '₡0 - ₡25M' &&
          priceInColones > 25000000
        ) {
          return false
        }

        if (
          filters.price_range === '₡25M - ₡75M' &&
          (
            priceInColones < 25000000 ||
            priceInColones > 75000000
          )
        ) {
          return false
        }

        if (
          filters.price_range === '₡75M - ₡150M' &&
          (
            priceInColones < 75000000 ||
            priceInColones > 150000000
          )
        ) {
          return false
        }

        if (
          filters.price_range === '₡150M - ₡250M' &&
          (
            priceInColones < 150000000 ||
            priceInColones > 250000000
          )
        ) {
          return false
        }

        if (
          filters.price_range === '₡250M+' &&
          priceInColones < 250000000
        ) {
          return false
        }
      }

      /*
      * PROPERTY TYPE
      */

      if (
        filters.property_type &&
        normalizeText(property.property_type) !==
        normalizeText(filters.property_type)
      ) {
        return false
      }

      /*
      * USE TYPE
      */

      if (
        filters.use_type &&
        normalizeText(property.use_type) !==
        normalizeText(filters.use_type)
      ) {
        return false
      }

      /*
      * BEDROOMS
      */

      if (filters.bedrooms) {
        const requiredBedrooms =
          getFirstNumber(filters.bedrooms)

        const propertyBedrooms =
          getFirstNumber(property.bedrooms)

        if (
          requiredBedrooms === null ||
          propertyBedrooms === null ||
          propertyBedrooms < requiredBedrooms
        ) {
          return false
        }
      }

      /*
      * BATHROOMS
      */

      if (filters.bathrooms) {
        const requiredBathrooms =
          getFirstNumber(filters.bathrooms)

        const propertyBathrooms =
          getFirstNumber(property.bathrooms)

        if (
          requiredBathrooms === null ||
          propertyBathrooms === null ||
          propertyBathrooms < requiredBathrooms
        ) {
          return false
        }
      }

      /*
      * PARKING
      */

      if (filters.parking) {
        const requiredParking =
          getFirstNumber(filters.parking)

        const propertyParking =
          getFirstNumber(property.parking)

        if (
          requiredParking === null ||
          propertyParking === null ||
          propertyParking < requiredParking
        ) {
          return false
        }
      }

      /*
      * YEAR BUILT
      */

      if (filters.year_built) {
        const propertyYear =
          getYear(property.year_built) ??
          getYear(property.year_built_range)

        if (propertyYear === null) {
          return false
        }

        if (
          filters.year_built === 'Pre-1980' &&
          propertyYear >= 1980
        ) {
          return false
        }

        if (
          filters.year_built === '1980s' &&
          (
            propertyYear < 1980 ||
            propertyYear > 1989
          )
        ) {
          return false
        }

        if (
          filters.year_built === '1990s' &&
          (
            propertyYear < 1990 ||
            propertyYear > 1999
          )
        ) {
          return false
        }

        if (
          filters.year_built === '2000s' &&
          (
            propertyYear < 2000 ||
            propertyYear > 2009
          )
        ) {
          return false
        }

        if (
          filters.year_built === '2010s' &&
          (
            propertyYear < 2010 ||
            propertyYear > 2019
          )
        ) {
          return false
        }

        if (
          filters.year_built === '2020+' &&
          propertyYear < 2020
        ) {
          return false
        }
      }

      /*
      * CONSTRUCTION AREA
      */

      if (
        filters.construction_area &&
        !matchesConstructionAreaRange(
          property.construction_area,
          filters.construction_area
        )
      ) {
        return false
      }

      /*
      * PROPERTY AREA
      */

      if (
        filters.property_area &&
        !matchesPropertyAreaRange(
          property.property_area,
          filters.property_area
        )
      ) {
        return false
      }

      /*
      * UTILITIES
      */

      if (filters.utility.length > 0) {
        const propertyUtilities =
          normalizeValues(property.utility)

        const utilityMatches =
          filters.utility.some(
            selectedUtility =>
              propertyUtilities.includes(
                normalizeText(selectedUtility)
              )
          )

        if (!utilityMatches) {
          return false
        }
      }

      /*
      * LEGAL STATUS
      */

      if (
        filters.legal_status &&
        normalizeText(property.legal_status) !==
        normalizeText(filters.legal_status)
      ) {
        return false
      }

      /*
      * ENVIRONMENT
      */

      if (filters.environment.length > 0) {
        const propertyEnvironments =
          normalizeValues(property.environment)

        const environmentMatches =
          filters.environment.some(
            selectedEnvironment =>
              propertyEnvironments.includes(
                normalizeText(
                  selectedEnvironment
                )
              )
          )

        if (!environmentMatches) {
          return false
        }
      }

      /*
      * ACCESSIBILITY
      */

      if (filters.accessibility) {
        const propertyAccessibility =
          normalizeValues(
            property.accessibility
          )

        if (
          !propertyAccessibility.includes(
            normalizeText(
              filters.accessibility
            )
          )
        ) {
          return false
        }
      }

      /*
        * DISTANCE TO PAVED ROAD
        */

        if (
          filters.accessibility ===
            'Unpaved Road to Property' &&
          filters.distance_to_paved_road_range
        ) {
          if (
            property.distance_to_paved_road_range !==
            filters.distance_to_paved_road_range
          ) {
            return false
          }
        }

      /*
      * TERRAIN
      */

      if (filters.terrain.length > 0) {
        const propertyTerrain =
          normalizeValues(property.terrain)

        const terrainMatches =
          filters.terrain.some(
            selectedTerrain =>
              propertyTerrain.includes(
                normalizeText(selectedTerrain)
              )
          )

        if (!terrainMatches) {
          return false
        }
      }

      return true
    })

    const rankedProperties =
      filteredProperties

  const marketplaceActions = (<>
<button
                    type="button"

                    onClick={
                      handleSaveSearch
                    }

                    style={{
                      background:
                        theme === 'dark'
                          ? '#ffffff'
                          : '#111111',

                      border:
                        theme === 'dark'
                          ? '1px solid #ffffff'
                          : '1px solid #111111',

                      color:
                        theme === 'dark'
                          ? '#000000'
                          : '#ffffff',

                      padding:
                        '12px 20px',

                      borderRadius:
                        '999px',

                      cursor:
                        'pointer',

                      fontWeight:
                        'bold',

                      transition:
                        'background .25s ease, color .25s ease, border-color .25s ease'
                    }}
                  >
                    Guardar búsqueda
                  </button>

                  <Link
                    href="/es/favoritos"

                    style={{
                      background:
                        theme === 'dark'
                          ? 'rgba(0,0,0,.72)'
                          : 'rgba(255,255,255,.88)',

                      border:
                        '1px solid #C7A44B',

                      color:
                        theme === 'dark'
                          ? '#C7A44B'
                          : '#6f5315',

                      padding:
                        '12px 20px',

                      borderRadius:
                        '999px',

                      cursor:
                        'pointer',

                      fontWeight:
                        'bold',

                      textDecoration:
                        'none',

                      backdropFilter:
                        'blur(10px)',

                      WebkitBackdropFilter:
                        'blur(10px)',

                      transition:
                        'background .25s ease, color .25s ease'
                    }}
                  >
                    Abrir Favoritos
                  </Link>
</>)

  return (
      <main onPointerDownCapture={home?.interact} onKeyDownCapture={home?.interact}
        style={{
          background:
            theme === 'dark'
              ? '#000000'
              : '#f7f7f4',

          minHeight: '100vh',

          color:
            theme === 'dark'
              ? '#ffffff'
              : '#111111',

          padding: '20px',

          position: 'relative',

          overflow: 'hidden',

          transition:
            'background .25s ease, color .25s ease'
        }}
      >

      {showSaveSearchAuth && (
        <EmailAuthModal
          onClose={() =>
            setShowSaveSearchAuth(false)
          }
          redirectTo="/es/comprar"
        />
      )}

        {/* MARKETPLACE MASTHEAD */}
          {!embedded && (<section
            style={{
              position: 'relative',

              minHeight:
                isMobile
                  ? '420px'
                  : '360px',

              marginBottom:
                '24px',

              borderRadius:
                '28px',

              overflow:
                'hidden',

              backgroundImage:
                theme === 'dark'
                  ? 'url(/images/buy-dark.webp)'
                  : 'url(/images/buy-light.webp)',

              backgroundSize:
                'cover',

              backgroundPosition:
                'center center',

              backgroundRepeat:
                'no-repeat',

              border:
                theme === 'dark'
                  ? '1px solid rgba(255,255,255,.08)'
                  : '1px solid rgba(0,0,0,.10)',

              transition:
                'background-image .25s ease, border-color .25s ease'
            }}
          >
            {/* IMAGE CONTRAST LAYER */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,

                background:
                  theme === 'dark'
                    ? 'linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.40) 55%, rgba(0,0,0,.62) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.18) 55%, rgba(255,255,255,.42) 100%)',

                pointerEvents:
                  'none'
              }}
            />

            {/* MASTHEAD CONTENT */}
            <div
              style={{
                position: 'relative',

                zIndex: 1,

                minHeight:
                  isMobile
                    ? '420px'
                    : '360px',

                padding:
                  isMobile
                    ? '14px'
                    : '16px 24px 28px',

                boxSizing:
                  'border-box',

                display:
                  'flex',

                flexDirection:
                  'column'
              }}
            >
              {/* TOP NAV */}
              <div
                style={{
                  width: '100%',

                  display: 'flex',

                  justifyContent:
                    'center',

                  alignItems:
                    'flex-start',

                  position:
                    'relative'
                }}
              >
                <TopBar
                  theme={theme}

                  onThemeToggle={() =>
                    setTheme(current =>
                      current === 'dark'
                        ? 'light'
                        : 'dark'
                    )
                  }

                  onFilterClick={() =>
                    setShowMobileFilters(true)
                  }
                />

                <div
                  className="floating-filter-button"
                >
                  <FilterButton
                    onClick={() =>
                      setShowMobileFilters(true)
                    }
                  />
                </div>
              </div>

              {/* HEADER + ACTIONS */}
              <div
                style={{
                  flex: 1,

                  display:
                    'flex',

                  flexDirection:
                    'column',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  padding:
                    isMobile
                      ? '28px 12px 18px'
                      : '24px 20px 12px'
                }}
              >
                <BuyHeaderES
                  theme={theme}
                />

                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'center',

                    gap:
                      '12px',

                    flexWrap:
                      'wrap'
                  }}
                >
                  {marketplaceActions}
                </div>
              </div>
            </div>
          </section>)}

        {embedded && <MarketplaceContextHeading language="es" mode="sale" filters={filters} count={rankedProperties.length} loading={loading} onFilters={() => {setDesktopSidebarCollapsed(false);setShowMobileFilters(true)}}>{marketplaceActions}</MarketplaceContextHeading>}
{/* MAIN GRID */}
          <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              position: 'relative'
          }}>

        {/* BUY EXPERIENCE */}
          <div
            style={{
              background:
                theme === 'dark'
                  ? '#111111'
                  : '#ffffff',
              borderRadius: '28px',
              overflow: isMobile
                ? 'visible'
                : 'hidden',
              textDecoration: 'none',
              color: '#fff',
              border:
                theme === 'dark'
                  ? '1px solid #222222'
                  : '1px solid rgba(0,0,0,.12)',

              display: 'grid',
              gridTemplateColumns:
                isMobile
                  ? '1fr'
                  : embedded && desktopSidebarCollapsed ? '48px minmax(0, 1fr)' : '320px 1fr',
              transition:
                  'background .25s ease, color .25s ease, border-color .25s ease',
              minHeight: '620px',
              width: '100%'
            }}
          >

{/* SIDEBAR */}

           <BuySidebarES
              desktopCollapsed={embedded && desktopSidebarCollapsed}
              setDesktopCollapsed={embedded ? setDesktopSidebarCollapsed : undefined}

              isMobile={isMobile}
              showMobileFilters={showMobileFilters}
              setShowMobileFilters={setShowMobileFilters}

              showLocationOptions={showLocationOptions}
              setShowLocationOptions={setShowLocationOptions}
              showProvinceOptions={showProvinceOptions}
              setShowProvinceOptions={setShowProvinceOptions}
              showCantonOptions={showCantonOptions}
              setShowCantonOptions={setShowCantonOptions}
              showDistrictOptions={showDistrictOptions}
              setShowDistrictOptions={setShowDistrictOptions}
              provinces={provinces}
              districts={districts}

              showPriceOptions={showPriceOptions}
              setShowPriceOptions={setShowPriceOptions}

              showproperty_typeOptions={showproperty_typeOptions}
              setShowproperty_areaOptions={setShowproperty_areaOptions}

              showBedroomOptions={showBedroomOptions}
              setShowBedroomOptions={setShowBedroomOptions}

              bedroomOptions={bedroomOptions}
              bathroomOptions={bathroomOptions}
              parkingOptions={parkingOptions}
              yearBuiltOptions={yearBuiltOptions}
              constructionAreaOptions={constructionAreaOptions}
              showConstructionAreaOptions={
                showConstructionAreaOptions
              }

              setShowConstructionAreaOptions={
                setShowConstructionAreaOptions
              }
              filters={filters}
              setFilters={setFilters}

              setShowproperty_typeOptions={setShowproperty_typeOptions}

              showproperty_areaOptions={showproperty_areaOptions}
              setShowutilityOptions={setShowutilityOptions}

              showutilityOptions={showutilityOptions}

              showenvironmentOptions={showenvironmentOptions}
              setShowenvironmentOptions={setShowenvironmentOptions}

              showAccessibilityOptions={showAccessibilityOptions}
              setShowAccessibilityOptions={setShowAccessibilityOptions}

              showTerrainOptions={showTerrainOptions}
              setShowTerrainOptions={setShowTerrainOptions}

              showlegal_statusOptions={showlegal_statusOptions}
              setShowlegal_statusOptions={setShowlegal_statusOptions}

            />

          <MarketplaceListingGrid province={filters.province} propertyType={filters.property_type}
                theme={theme}

                listings={
                  rankedProperties
                }

                transactionType="buy"

                language="es"

                favoriteIds={
                  favoriteIds
                }

                isSelected={
                  isSelected
                }

                maximumProperties={
                  maximumProperties
                }

                selectedPropertyIds={
                  propertyIds
                }

                onToggleCompare={
                  toggleProperty
                }

                onToggleFavorite={async property => {
                  const alreadySaved =
                    favoriteIds.includes(
                      property.id
                    )

                  await toggleFavorite(
                    property.id
                  )

                  const ids =
                    await getListingFavoriteIds()

                  setFavoriteIds(ids)

                  const metadata = {
                    title:
                      property.title,

                    province:
                      property.province,

                    canton:
                      property.canton,

                    district:
                      property.district,

                    propertyType:
                      property.property_type,

                    transactionType:
                      'buy',

                    pathname:
                      window.location.pathname,

                    href:
                      window.location.href,

                    source:
                      'search-results'
                  }

                  if (alreadySaved) {
                    await trackListingRemoved({
                      listingId:
                        property.id,

                      metadata
                    })
                  } else {
                    await recordListingSaved({
                      listingId:
                        property.id,

                      metadata
                    })
                  }
                }}
              />

                                
          </div>
        </div>
        <PropertyComparisonTray
          properties={properties}
          language="es"
        />
    </main>
  )
}


const filterHeading = {
  marginBottom: '14px',
  fontSize: '15px',
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px'
}

const miniHeading = {
  color: 'var(--muted)',
  fontSize: '13px',
  marginBottom: '10px'
}

const pillWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '10px'
}

const pill = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  padding: '10px 14px',
  borderRadius: '999px',
  cursor: 'pointer',
  transition: 'all .2s ease'
}

const activePill = {
  background: 'var(--foreground)',
  border: '1px solid var(--foreground)',
  color: 'var(--background)',
  padding: '10px 14px',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all .2s ease'
}

const scrollPanel = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
  maxHeight: '220px',
  overflowY: 'auto' as const,
  paddingRight: '6px',
  position: 'relative' as const,

  // HIDE SCROLLBAR
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none' as const,

  // FADE MASKS
  maskImage: `
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0,0,0,1) 12%,
      rgba(0,0,0,1) 82%,
      transparent 100%
    )
  `,

  WebkitMaskImage: `
    linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0,0,0,1) 12%,
      rgba(0,0,0,1) 82%,
      transparent 100%
    )
  `,

  scrollBehavior: 'smooth' as const
}

const listButton = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  padding: '14px 16px',
  borderRadius: '14px',
  cursor: 'pointer',
  textAlign: 'left' as const,
  transition: 'all .2s ease'
}

const activeListButton = {
  background: 'var(--foreground)',
  border: '1px solid var(--foreground)',
  color: 'var(--background)',
  padding: '14px 16px',
  borderRadius: '14px',
  cursor: 'pointer',
  textAlign: 'left' as const,
  fontWeight: 'bold',
  transition: 'all .2s ease'
}

const breadcrumbBar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '14px'
}

const breadcrumbText = {
  color: 'var(--muted)',
  fontSize: '13px'
}

const backButton = {
  background: 'transparent',
  border: 'none',
  color: 'var(--foreground)',
  cursor: 'pointer',
  padding: 0,
  fontSize: '14px',
  transition: 'all .2s ease'
}

const navLink = {
  color: 'var(--muted)',
  textDecoration: 'none',
  fontSize: '.875rem',
  transition: 'all .2s ease'
}

const navButton = {
  background: 'var(--surface)',
  border: '.0625rem solid #fff',
  color: 'var(--foreground)',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const navButton0 = {
  background: '#D4AF3795',
  border: '.0625rem solid #ffffff50',
  color: 'var(--foreground)',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const sellButton = {
  background: '#FFFFFF50',
  color: 'var(--foreground)',
  border:'.0625rem solid #ffffff50',
  textDecoration: 'none',
  padding: '.75rem 1.125rem',
  borderRadius: '.875rem',
  fontWeight: 'bold',
  fontSize: '.875rem'
}


