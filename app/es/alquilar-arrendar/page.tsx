'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import TopBarES from '@/app/components/TopBarES'

import LocationFilterES from '@/app/components/filter-bar/LocationFilterES'
import PriceFilterRLES from '@/app/components/filter-bar/PriceFilterRLES'
import PropertyTypeFilterES from '@/app/components/filter-bar/PropertyTypeFilterES'
import UtilitiesFilterES from '@/app/components/filter-bar/UtilitiesFilterES'
import AdvancedFiltersToggleES from '@/app/components/filter-bar/AdvancedFiltersToggleES'
import AccessibilityFilterES from '@/app/components/filter-bar/AccessibilityFilterES'
import EnvironmentFilterES from '@/app/components/filter-bar/EnvironmentFilterES'
import PropertyAreaFilter from '@/app/components/filter-bar/PropertyAreaFilterES'
import ResidentialAttributesS from '@/app/components/filter-bar/ResidentialAttributesS'
import CreateRentalListingButton from '@/app/components/CreateRentalListingButton'
import RentLeaseSidebarES from '@/app/components/RentLeaseSidebarES'
import { normalizeText } from '@/lib/normalizeText' 


import {
      provinces,
      districts
    } from '@/data/property-data'
export default function HomePage() {

const navButton = {
            background:'#00ff9950',
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
    monthly_price: '',
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
  const [showLocationOptions, setShowLocationOptions] = useState(true)
  const [showCantonOptions, setShowCantonOptions] = useState(false)
  const [showDistrictOptions, setShowDistrictOptions] = useState(false)
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

  const [isMobile, setIsMobile] =
    useState(false)

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

        const { data, error } = await supabase
          .from('rent_lease_listings')
          .select('*')
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
                  ? listing.images.split('|')
                  : []

            })
          )

            console.log(
              'FETCHED TABLE RECORD:',
              data?.[0]
            )

            console.log(
              'FETCHED RENT LEASE DATA:',
              data
            )

            console.log(
            'FETCHED RENT LEASE DATA:',
            data
          )

        const mergedListings = [
          ...normalizedSupabaseListings
        ]

console.log(
  'FIRST PROPERTY:',
  mergedListings[0]
)

console.log(
  'DISTRICT FIELD:',
  mergedListings[0]?.district
)

console.log(
  'TABLE SAMPLE:',
  mergedListings.slice(0, 5)
)

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

  console.log(
    '===================================='
  )

  console.log(
    'TITLE:',
    property.title
  )

  console.log(
  'PROVINCE:',
  property.province,
  'CANTON:',
  property.canton,
  'DISTRICT:',
  property.district
)

console.log(
  'PROVINCE FILTER:',
  filters.province,
  'PROPERTY PROVINCE:',
  property.province
)

                 if (
                    filters.province &&
                    normalizeText(property.province) !==
                    normalizeText(filters.province)
                  ) {
                    return false
                  }

  console.log(
  'CANTON FILTER:',
  filters.canton,
  'PROPERTY CANTON:',
  property.canton
)

console.log(
  'NORMALIZED CANTON VALUES:',
  normalizeText(filters.canton),
  normalizeText(property.canton)
)

console.log(
  normalizeText(filters.canton) ===
  normalizeText(property.canton)
)

                if (
                  filters.canton &&
                  normalizeText(property.canton) !==
                  normalizeText(filters.canton)
                ) {
                  return false
                }   

console.log(
  'DISTRICT FILTER:',
  filters.district,
  'PROPERTY DISTRICT:',
  property.district
)

console.log(
  'RAW DISTRICT VALUES:',
  JSON.stringify(filters.district),
  JSON.stringify(property.district)
)

                if (
                  filters.district &&
                  normalizeText(property.district) !==
                  normalizeText(filters.district)
                ) {
                  return false
                }

console.log(
  'MONTHLY PRICE FILTER:',
  filters.monthly_price,
  'PROPERTY PRICE RANGE:',
  property.price_range
)

                  if (
                    filters.monthly_price &&
                    property.price_range !== filters.monthly_price
                  ) {

                    console.log(
                      'FAILED MONTHLY PRICE'
                    )

                    return false
                  }

console.log(
  'TYPE FILTER:',
  filters.property_type,
  'PROPERTY TYPE:',
  property.property_type
)

                 if (
                    filters.property_type &&
                    normalizeText(property.property_type) !==
                    normalizeText(filters.property_type)
                  ) {

                    console.log(
                      'FAILED PROPERTY TYPE'
                    )

                    return false
                  }

                  console.log(
                    'USE TYPE FILTER:',
                    filters.use_type,
                    'PROPERTY USE TYPE:',
                    property.use_type
                  )

                  if (
                    filters.use_type &&
                    normalizeText(property.use_type) !==
                    normalizeText(filters.use_type)
                  ) {

                    console.log(
                      'FAILED USE TYPE'
                    )

                    return false
                  }

                  console.log(
                    'PROPERTY AREA FILTER:',
                    filters.property_area,
                    'PROPERTY AREA:',
                    property.property_area
                  )

                  if (
                    filters.property_area &&
                    property.property_area !== filters.property_area
                  ) {

                    console.log(
                      'FAILED PROPERTY AREA'
                    )

                    return false
                  }

                  console.log(
                    'UTILITY FILTER:',
                    filters.utility,
                    'PROPERTY UTILITY:',
                    property.utility
                  )

                  if (
                    filters.utility.length > 0 &&
                    !filters.utility.some((item) =>
                      Array.isArray(property.utility)
                        ? property.utility.some(
                            (utility: string) =>
                              normalizeText(utility) ===
                              normalizeText(item)
                          )
                        : normalizeText(property.utility) ===
                          normalizeText(item)
                    )
                  ) {
                    return false
                  }

                  console.log(
                    'LEGAL STATUS FILTER:',
                    filters.legal_status,
                    'PROPERTY LEGAL STATUS:',
                    property.legal_status
                  )

                  if (
                    filters.use_type &&
                    normalizeText(property.use_type) !==
                    normalizeText(filters.use_type)
                  ) {

                    console.log(
                      'FAILED LEGAL STATUS'
                    )

                    return false
                  }

                  console.log(
                    'ENVIRONMENT FILTER:',
                    filters.environment,
                    'PROPERTY ENVIRONMENT:',
                    property.environment
                  )

                  if (
                    filters.environment.length > 0 &&
                    !filters.environment.some((item) =>
                      Array.isArray(property.environment)
                        ? property.environment.some(
                            (environment: string) =>
                              normalizeText(environment) ===
                              normalizeText(item)
                          )
                        : normalizeText(property.environment) ===
                          normalizeText(item)
                    )
                  ) {
                    return false
                  }

                  console.log(
                    'ACCESSIBILITY FILTER:',
                    filters.accessibility,
                    'PROPERTY ACCESSIBILITY:',
                    property.accessibility
                  )

                  if (
                    filters.accessibility &&
                    normalizeText(property.accessibility) !==
                    normalizeText(filters.accessibility)
                  ) {

                    console.log(
                      'FAILED ACCESSIBILITY'
                    )

                    return false
                  }

                  console.log(
                    'TERRAIN FILTER:',
                    filters.terrain,
                    'PROPERTY TERRAIN:',
                    property.terrain
                  )

                  if (
                      filters.terrain.length > 0 &&
                      !filters.terrain.some((item) =>
                        Array.isArray(property.terrain)
                          ? property.terrain.some(
                              (terrain: string) =>
                                normalizeText(terrain) ===
                                normalizeText(item)
                            )
                          : normalizeText(property.terrain) ===
                            normalizeText(item)
                      )
                    ) {
                      return false
                    }

                  console.log(
                    'PASSED ALL FILTERS'
                  )

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

      

          

{/* TOP LEFT NAV */}
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


{/* TOP RIGHT NAV */}
             
            

            </div>

            {/* HEADER */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px'
            }}>

          <h1 style={{
            fontSize: '72px',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            Twuanis
          </h1>

          <p style={{
            color: '#999',
            fontSize: '22px'
          }}>
            Encuentra una Propiedad en Alquiler o Arrendamiento Comercial
          </p>

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

{/* SIDEBAR LEFT */}
          <RentLeaseSidebarES

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
            setShowproperty_typeOptions={setShowproperty_typeOptions}

            showproperty_areaOptions={showproperty_areaOptions}
            setShowproperty_areaOptions={setShowproperty_areaOptions}

            showutilityOptions={showutilityOptions}
            setShowutilityOptions={setShowutilityOptions}

            showenvironmentOptions={showenvironmentOptions}
            setShowenvironmentOptions={setShowenvironmentOptions}

            showAccessibilityOptions={showAccessibilityOptions}
            setShowAccessibilityOptions={setShowAccessibilityOptions}

            showTerrainOptions={showTerrainOptions}
            setShowTerrainOptions={setShowTerrainOptions}

            showlegal_statusOptions={showlegal_statusOptions}
            setShowlegal_statusOptions={setShowlegal_statusOptions}

            showBedroomOptions={showBedroomOptions}
            setShowBedroomOptions={setShowBedroomOptions}

            showBathroomOptions={showBathroomOptions}
            setShowBathroomOptions={setShowBathroomOptions}

            showParkingOptions={showParkingOptions}
            setShowParkingOptions={setShowParkingOptions}

            showYearBuiltOptions={showYearBuiltOptions}
            setShowYearBuiltOptions={setShowYearBuiltOptions}

            showConstructionAreaOptions={showConstructionAreaOptions}
            setShowConstructionAreaOptions={setShowConstructionAreaOptions}

            showResidentialSummary={showResidentialSummary}
            setShowResidentialSummary={setShowResidentialSummary}

            bedroomOptions={bedroomOptions}
            bathroomOptions={bathroomOptions}
            parkingOptions={parkingOptions}
            yearBuiltOptions={yearBuiltOptions}
            constructionAreaOptions={constructionAreaOptions}

            filters={filters}
            setFilters={setFilters}
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
                                  href={`/en/buy/listing/${property.id}`}
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
                                          Sin Imagen
                                        </div>

                                      )}

                                      <button
                                        onClick={(e) => {

                                          e.preventDefault()
                                          e.stopPropagation()

                                          const existingFavorites =
                                            JSON.parse(
                                              localStorage.getItem('favorites') || '[]'
                                            )

                                          const alreadySaved =
                                            existingFavorites.includes(property.id)

                                          let updatedFavorites = []

                                          if (alreadySaved) {

                                            updatedFavorites =
                                              existingFavorites.filter(
                                                (id: string) => id !== property.id
                                              )

                                          } else {

                                            updatedFavorites = [
                                              ...existingFavorites,
                                              property.id
                                            ]

                                          }

                                          localStorage.setItem(
                                            'favorites',
                                            JSON.stringify(updatedFavorites)
                                          )

                                          window.location.reload()

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
                                          color: JSON.parse(
                                            localStorage.getItem('favorites') || '[]'
                                          ).includes(property.id)
                                            ? '#ff3b30'
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

                                        <span style={pill}>
                                          {property.environment}
                                        </span>

                                        <span style={pill}>
                                          {Array.isArray(property.terrain)
                                            ? property.terrain.join(', ')
                                            : property.terrain}
                                        </span>

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
                            No hay propiedades que coincidan con los filtros
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
  background: '#00ff99',
  border: '1px solid #00ff99',
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
  background: '#00ff99',
  border: '1px solid #00ff99',
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
  color: '#00ff99',
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
  background: '#ff3b0095',
  border: '.0625rem solid #ffffff50',
  color: '#fff',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const sellButton = {
  background: '#00ff9950',
  color: '#fff',
  border:'.0625rem solid #ffffff50',
  textDecoration: 'none',
  padding: '.75rem 1.125rem',
  borderRadius: '.875rem',
  fontWeight: 'bold',
  fontSize: '.875rem'
}


