'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import FilterButton from '@/app/components/FilterButton'

import TopBarES from '@/app/components/TopBarES'
import BuyHeaderES from '@/app/components/BuyHeaderES'
import BuySidebarES from '@/app/components/BuySidebarES'
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
  getFavorites,
  toggleFavorite
} from '@/lib/favorites'

import {
  recordListingSaved
} from '@/lib/activity'

import {
  trackListingRemoved
} from '@/lib/activity/listings'

export default function HomePage() {

const searchParams =
  useSearchParams()

const savedSearchId =
  searchParams.get('savedSearch')

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
  const [filters, setFilters] = useState({
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
  const [showConstructionAreaOptions, setShowConstructionAreaOptions] = useState(false)
  const [showResidentialSummary, setShowResidentialSummary] = useState(false)

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [favoriteIds, setFavoriteIds] =
  useState<string[]>([])

  const [isMobile, setIsMobile] =
    useState(false)

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

    function handleResize() {

      setIsMobile(
        window.innerWidth <= 768
      )

    }

    useEffect(() => {

      function syncFavorites() {
        setFavoriteIds(
          getFavorites()
        )
      }

      syncFavorites()

      window.addEventListener(
        'favorites-updated',
        syncFavorites
      )

      return () => {
        window.removeEventListener(
          'favorites-updated',
          syncFavorites
        )
      }

    }, [])

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

const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('transaction_type', 'sale')
  .eq('listing_status', 'active')
  .order('id', { ascending: false })


  if (error) {

    console.error(
      JSON.stringify(error, null, 2)
    )

    setProperties([])

    setLoading(false)

    return

  }



            const normalizedSupabaseListings = (data || []).map(
                  (listing: any) => ({
                    ...listing,

                    id: createListingId(listing),

                    images:
                      Array.isArray(listing.images)
                        ? listing.images
                        : typeof listing.images === 'string'
                        ? (() => {

                            try {

                              return JSON.parse(
                                listing.images
                              )

                            } catch {

                              return listing.images
                                .split('|')
                                .map((img: string) =>
                                  img.trim()
                                )
                                .filter(Boolean)

                            }

                          })()
                        : []

                  })
                )

                const mergedListings = [
                  ...normalizedSupabaseListings
                ]


                setProperties(mergedListings)

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
                          
const filteredProperties = properties.filter((property) => {

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

                  if (filters.price_range) {
                    const exchangeRate = 500

                    const rawPrice =
                      Number(property.current_price)

                    const priceInColones =
                      property.currency === 'USD' ||
                      property.title?.toUpperCase().includes('USD')
                        ? rawPrice * exchangeRate
                        : rawPrice

                    if (
                          filters.price_range === '₡0 - ₡25M' &&
                          priceInColones > 25000000
                        ) return false

                        if (
                          filters.price_range === '₡25M - ₡75M' &&
                          (priceInColones < 25000000 ||
                          priceInColones > 75000000)
                        ) return false

                        if (
                          filters.price_range === '₡75M - ₡150M' &&
                          (priceInColones < 75000000 ||
                          priceInColones > 150000000)
                        ) return false

                        if (
                          filters.price_range === '₡150M - ₡250M' &&
                          (priceInColones < 150000000 ||
                          priceInColones > 250000000)
                        ) return false

                        if (
                          filters.price_range === '₡250M+' &&
                          priceInColones < 250000000
                        ) return false
                      }


                  if (
                    filters.property_type &&
                    normalizeText(property.property_type) !==
                    normalizeText(filters.property_type)
                  ) {
                    return false
                  }

                  if (
                    filters.use_type &&
                    property.use_type !== filters.use_type
                  ) {
                    return false
                  }

if (
  property.title?.includes('Frente al Río')
) {

}

                  if (filters.property_area) {

                                    const area = Number(
                                      property.property_area
                                    )

                                    if (
                                      filters.property_area === '<1,000m²' &&
                                      area >= 1000
                                    ) {
                                      return false
                                    }

                                    if (
                                      filters.property_area === '1,000–10,000m²' &&
                                      (area < 1000 || area > 10000)
                                    ) {
                                      return false
                                    }

                                    if (
                                      filters.property_area === '10,000–50,000m²' &&
                                      (area < 10000 || area > 50000)
                                    ) {
                                      return false
                                    }

                                    if (
                                      filters.property_area === 'Más de 50,000m²' &&
                                      area <= 50000
                                    ) {
                                      return false
                                    }

                                  }



                  if (
                    filters.utility.length > 0 &&
                    !filters.utility.some((item) =>
                      Array.isArray(property.utility)
                        ? property.utility.includes(item)
                        : property.utility === item
                    )
                  ) {
                    return false
                  }



                    if (
                      filters.legal_status &&
                      normalizeText(property.legal_status) !==
                      normalizeText(filters.legal_status)
                    ) {
                      return false
                    }

                  if (
                    filters.environment.length > 0 &&
                    !filters.environment.some((item) =>
                      Array.isArray(property.environment)
                        ? property.environment.includes(item)
                        : property.environment === item
                    )
                  ) {
                    return false
                  }

                  if (
                    filters.accessibility &&
                    normalizeText(property.accessibility) !==
                    normalizeText(filters.accessibility)
                  ) {
                    return false
                  }


                  if (
                    filters.terrain.length > 0 &&
                    !filters.terrain.some((item) =>
                      Array.isArray(property.terrain)
                        ? property.terrain.includes(item)
                        : property.terrain === item
                    )
                  ) {
                    return false
                  }

                  return true

                })

  return (
      <main style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* TOP NAV */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '.5rem 0',
              marginBottom: '40px',
              borderBottom: '1px solid #151515'
            }}>

                    <TopBarES
                      onFilterClick={() =>
                        setShowMobileFilters(true)
                      }
                    />

                    <div className="floating-filter-button">
                      <FilterButton
                        onClick={() => setShowMobileFilters(true)}
                      />
                    </div>

            </div>

            {/* HEADER */}

            <BuyHeaderES />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    saveSearch(
                      'buy',
                      'es',
                      filters
                    )
                  }
                  style={{
                    background: '#fff',
                    border: '1px solid #fff',
                    color: '#000',
                    padding: '12px 20px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Guardar búsqueda
                </button>
              </div>   

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
              background: '#111',
              borderRadius: '28px',
              overflow: isMobile
                ? 'visible'
                : 'hidden',
              textDecoration: 'none',
              color: '#fff',
              border: '1px solid #222',
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : '320px 1fr',
              minHeight: '620px',
              width: '100%'
            }}
          >

{/* SIDEBAR */}

           <BuySidebarES

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

{/* PROPERTY PREVIEW right-center column */}
                <div
                  style={{
                    padding: isMobile ? '16px' : '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    overflow: 'hidden'
                  }}
                >

                  <div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
  isMobile
    ? '1fr'
    : 'repeat(5, 1fr)',
                        gap: '1.25rem',
                        alignContent: 'start'
                      }}
                    >

                              {filteredProperties.map((property) => (

                                <Link
                                  href={`/es/comprar/anuncio/${property.id}`}
                                  key={property.id}
                                  style={{
                                    textDecoration: 'none',
                                    color: 'inherit'
                                  }}
                                >

                                  <div
                                    style={{
                                      background: '#181818',
                                      border: '1px solid #222',
                                      borderRadius: '22px',
                                      overflow: 'hidden',
                                      cursor: 'pointer'
                                    }}
                                  >

                                    {/* PROPERTY IMAGE */}
                                    <div
                                      style={{
                                        aspectRatio: '4 / 3',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: '#111'
                                      }}
                                    >

                                      {Array.isArray(property.images) &&
                                      property.images[0] ? (

                                        <img
                                          referrerPolicy="no-referrer"
                                          src={property.images[0]}
                                          alt={property.title}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                          }}
                                        />

                                      ) : (

                                        <div
                                          style={{
                                            height: '100%',
                                            background:
                                              'linear-gradient(135deg, #222 0%, #333 100%)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: '#555',
                                            fontSize: '20px'
                                          }}
                                        >
                                          No Image
                                        </div>

                                      )}

                                      <button
                                            onClick={async (e) => {

                                              e.preventDefault()
                                              e.stopPropagation()

                                              const alreadySaved =
                                                favoriteIds.includes(
                                                  property.id
                                                )

                                              toggleFavorite(
                                                property.id
                                              )

                                              const metadata = {
                                                title: property.title,
                                                province: property.province,
                                                canton: property.canton,
                                                district: property.district,
                                                propertyType: property.property_type,
                                                transactionType: 'buy',
                                                pathname: window.location.pathname,
                                                href: window.location.href,
                                                source: 'search-results'
                                              }

                                              if (alreadySaved) {

                                                await trackListingRemoved({
                                                  listingId: property.id,
                                                  metadata
                                                })

                                              } else {

                                                await recordListingSaved({
                                                  listingId: property.id,
                                                  metadata
                                                })

                                              }

                                            }}
                                        style={{
                                          position: 'absolute',
                                          top: '1rem',
                                          right: '1rem',
                                          width: '2.75rem',
                                          height: '2.75rem',
                                          borderRadius: '999px',
                                          border: '1px solid rgba(255,255,255,.15)',
                                          background: 'rgba(0,0,0,.55)',
                                          backdropFilter: 'blur(8px)',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          cursor: 'pointer',
                                          zIndex: 20
                                        }}
                                      >

                                        <span style={{
                                          fontSize: '1.25rem',
                                          color:
                                            favoriteIds.includes(property.id)
                                              ? '#D4AF37'
                                              : '#fff',
                                          transition: 'all .2s ease'
                                        }}>
                                          ♥
                                        </span>

                                      </button>

                                    </div>

                                    {/* CONTENT */}
                                    <div
                                      style={{
                                        padding: '1.25rem'
                                      }}
                                    >

                                      <h2
                                        style={{
                                          fontSize: '1.25rem',
                                          marginBottom: '.75rem'
                                        }}
                                      >
                                        {property.title}
                                      </h2>

                                      <p
                                        style={{
                                          color: '#888',
                                          marginBottom: '16px'
                                        }}
                                      >
                                        {property.province} → {property.canton} → {property.district}
                                      </p>

                                      <div
                                        style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: '10px'
                                        }}
                                      >

                                      <span style={pill}>
                                        {property.property_type}
                                      </span>

                                      {property.current_price && (
                                        <span style={pill}>
                                          {property.currency === 'USD' ||
                                          property.title?.toUpperCase().includes('USD')
                                            ? `$${Number(property.current_price).toLocaleString()}`
                                            : `₡${Number(property.current_price).toLocaleString()}`}
                                        </span>
                                      )}

                                      {property.property_area && (
                                        <span style={pill}>
                                          {property.property_area}
                                        </span>
                                      )}

                                      {property.construction_area && (
                                        <span style={pill}>
                                          {property.construction_area} Construcción
                                        </span>
                                      )}

                                      {property.bedrooms && (
                                        <span style={pill}>
                                          {property.bedrooms
                                            ?.replace('Bedroom', '')
                                            .replace('Bedrooms', '')
                                            .trim()} Habitaciones
                                        </span>
                                      )}

                                      {property.bathrooms && (
                                        <span style={pill}>
                                          {property.bathrooms
                                            ?.replace('Bathroom', '')
                                            .replace('Bathrooms', '')
                                            .trim()} Baños
                                        </span>
                                      )}

                                      {property.parking && (
                                        <span style={pill}>
                                          {property.parking
                                            ?.replace('Vehicle', '')
                                            .replace('Vehicles', '')
                                            .trim()} Parqueos
                                        </span>
                                      )}

                                       
                                      </div>

                                    </div>

                                  </div>

                                </Link>

                              ))}

                     

                      {filteredProperties.length === 0 && (

                        <div
                          style={{
                            background: '#181818',
                            border: '1px solid #222',
                            borderRadius: '22px',
                            padding: '40px',
                            textAlign: 'center'
                          }}
                        >

                          <h2
                            style={{
                              marginBottom: '10px'
                            }}
                          >
                            No se encontraron propiedades en venta
                          </h2>

                          <p
                            style={{
                              color: '#777'
                            }}
                          >
                            Intenta ajustar los filtros de propiedad.
                          </p>

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
           </div>
    </main>
  )
}


const filterHeading = {
  marginBottom: '14px',
  fontSize: '15px',
  color: '#888',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px'
}

const miniHeading = {
  color: '#666',
  fontSize: '13px',
  marginBottom: '10px'
}

const pillWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '10px'
}

const pill = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  color: '#bbb',
  padding: '10px 14px',
  borderRadius: '999px',
  cursor: 'pointer',
  transition: 'all .2s ease'
}

const activePill = {
  background: '#FFFFFF',
  border: '1px solid #FFFFFF',
  color: '#000',
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
  background: '#181818',
  border: '1px solid #222',
  color: '#bbb',
  padding: '14px 16px',
  borderRadius: '14px',
  cursor: 'pointer',
  textAlign: 'left' as const,
  transition: 'all .2s ease'
}

const activeListButton = {
  background: '#FFFFFF',
  border: '1px solid #FFFFFF',
  color: '#000',
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
  color: '#888',
  fontSize: '13px'
}

const backButton = {
  background: 'transparent',
  border: 'none',
  color: '#FFFFFF',
  cursor: 'pointer',
  padding: 0,
  fontSize: '14px',
  transition: 'all .2s ease'
}

const navLink = {
  color: '#888',
  textDecoration: 'none',
  fontSize: '.875rem',
  transition: 'all .2s ease'
}

const navButton = {
  background: '#181818',
  border: '.0625rem solid #fff',
  color: '#fff',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const navButton0 = {
  background: '#D4AF3795',
  border: '.0625rem solid #ffffff50',
  color: '#fff',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const sellButton = {
  background: '#FFFFFF50',
  color: '#fff',
  border:'.0625rem solid #ffffff50',
  textDecoration: 'none',
  padding: '.75rem 1.125rem',
  borderRadius: '.875rem',
  fontWeight: 'bold',
  fontSize: '.875rem'
}


