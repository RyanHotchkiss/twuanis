'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import rawListings from '@/data/encuentra24-sale-listings.json'
import LocationFilter from '@/app/components/filter-bar/LocationFilter'
import PriceFilter from '@/app/components/filter-bar/PriceFilter'
import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'
import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'
import AdvancedFiltersToggle from '@/app/components/filter-bar/AdvancedFiltersToggle'
import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'
import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'
import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilter'
import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'
import PropertyAreaFilter from '@/app/components/filter-bar/PropertyAreaFilter'
import ResidentialAttributesS from '@/app/components/filter-bar/ResidentialAttributesS'
import TopBar from '@/app/components/TopBar'

import Image from 'next/image'
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

        const normalizedJsonListings = rawListings.map(
          (listing: any, index: number) => ({

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

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('id', { ascending: false })

        if (error) {

          console.error(
            JSON.stringify(error, null, 2)
          )

          setProperties(normalizedJsonListings)

          setLoading(false)

          return

        }

        const normalizedSupabaseListings = (data || []).map(
          (listing: any) => ({

            ...listing,

            images:
              Array.isArray(listing.images)
                ? listing.images
                : typeof listing.images === 'string'
                ? listing.images.split('|')
                : []

          })
        )

        const mergedListings = [

          ...normalizedJsonListings,

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
                    property.province !== filters.province
                  ) {
                    return false
                  }

                  if (
                    filters.canton &&
                    property.canton !== filters.canton
                  ) {
                    return false
                  }

                  if (
                    filters.district &&
                    property.district !== filters.district
                  ) {
                    return false
                  }

                  if (
                    filters.price_range &&
                    property.price_range !== filters.price_range
                  ) {
                    return false
                  }

                  if (
                    filters.property_type &&
                    property.property_type !== filters.property_type
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
                    filters.property_area &&
                    property.property_area !== filters.property_area
                  ) {
                    return false
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
                    property.legal_status !== filters.legal_status
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
                      property.accessibility !== filters.accessibility
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

                    <TopBar
                      onFilterClick={() =>
                        setShowMobileFilters(true)
                      }
                    />

            </div>

            {/* HEADER */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px'
            }}>

                  <h1 style={{
                    fontSize: '72px',
                    marginBottom: '10px',
                    color: '#ff3b00'
                  }}>
                    Twuanis
                  </h1>

          <p style={{
            color: '#999',
            fontSize: '22px'
          }}>
            Find Properties for Sale
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

{/* SIDEBAR */}
            <div
              style={{
                background: '#000000',
                borderRight: '1px solid #222',
                padding: '25px',

                display: 'flex',
                flexDirection: 'column',
                gap: '28px',

                position: isMobile
                  ? 'fixed'
                  : 'relative',

                top: 0,

                left:
                  isMobile && !showMobileFilters
                    ? '-100%'
                    : '0',

                width: isMobile
                  ? '85vw'
                  : '320px',

                height: isMobile
                  ? '100vh'
                  : 'auto',

                zIndex: 1500,

                transition: 'left .3s ease',

                overflowY: 'auto'
              }}
            >

              {isMobile && (

                <button
                  onClick={() =>
                    setShowMobileFilters(false)
                  }
                  style={{
                    position: 'fixed',

                      display: showMobileFilters
                          ? 'block'
                          : 'none',

                    top: '1.25rem',
                    left: '50%',

                    transform: 'translateX(-50%)',

                    width: 'calc(85vw - 2rem)',
                    maxWidth: '8rem',

                    background: '#ff3b0099',
                    color: '#fff',

                    border: 'none',
                    borderRadius: '999rem',

                    padding: '.5rem .5rem',

                    fontSize: '.6rem',
                  

                    boxShadow:
                      '0 10px 40px rgba(0,0,0,.45)',

                    zIndex: 9999,

                    cursor: 'pointer'
                  }}
                >
                  View Filtered Properties
                </button>

              )}

<LocationFilter

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

                    selectedprovince={filters.province}
                    selectedcanton={filters.canton}
                    selecteddistrict={filters.district}

                    setSelectedprovince={(value) => {

                      setFilters(prev => ({
                        ...prev,
                        province: value,
                        canton: '',
                        district: ''
                      }))

                      setShowProvinceOptions(false)
                      setShowCantonOptions(true)
                      setShowDistrictOptions(false)

                    }}

                    setSelectedcanton={(value) => {

                      setFilters(prev => ({
                        ...prev,
                        canton: value,
                        district: ''
                      }))

                      setShowCantonOptions(false)
                      setShowDistrictOptions(true)

                    }}

                      setSelecteddistrict={(value) => {

                      setFilters(prev => ({
                        ...prev,
                        district: value
                      }))

                      setShowProvinceOptions(false)
                      setShowCantonOptions(false)
                      setShowDistrictOptions(false)

                      setShowLocationOptions(false)

                      setShowproperty_typeOptions(true)

                    }}

                  />

<PriceFilter

                  showPriceOptions={showPriceOptions}
                  setShowPriceOptions={setShowPriceOptions}

                  setShowProvinceOptions={
                    setShowProvinceOptions
                  }

                  setShowCantonOptions={
                    setShowCantonOptions
                  }

                  setShowDistrictOptions={
                    setShowDistrictOptions
                  }

                  selectedprice_range={filters.price_range}

                  setSelectedprice_range={(value) => {

                    setFilters(prev => ({
                      ...prev,
                      price_range: value
                    }))

                    setShowPriceOptions(false)

                    setShowproperty_typeOptions(true)

                  }}

                />


<PropertyTypeFilter

                              showproperty_typeOptions={showproperty_typeOptions}
                              setShowproperty_typeOptions={setShowproperty_typeOptions}

                              setShowproperty_areaOptions={setShowproperty_areaOptions}

                              setShowBedroomOptions={
                                setShowBedroomOptions
                              }

                              setShowProvinceOptions={
                                setShowProvinceOptions
                              }

                              setShowCantonOptions={
                                setShowCantonOptions
                              }

                              setShowDistrictOptions={
                                setShowDistrictOptions
                              }

                              selectedproperty_type={filters.property_type}

                              bedrooms={filters.bedrooms}

                              bathrooms={filters.bathrooms}

                              parking={filters.parking}

                              yearBuiltRange={filters.year_built}

                              constructionArea={filters.construction_area}

                              setSelectedproperty_type={(value) => {

                                setFilters(prev => ({
                                  ...prev,
                                  property_type: value
                                }))

                              }}

                            />

                                        {
                                          (
                                            filters.property_type === 'House' ||
                                            filters.property_type === 'Condo' ||
                                            filters.property_type === 'Cabin'
                                          ) && (

                                            <ResidentialAttributesS

                                              setShowproperty_typeOptions={
                                                setShowproperty_typeOptions
                                              }

                                              setShowproperty_areaOptions={
                                                setShowproperty_areaOptions
                                              }

                                              bedrooms={filters.bedrooms}
                                              setBedrooms={(value) =>
                                                setFilters(prev => ({
                                                  ...prev,
                                                  bedrooms: value
                                                }))
                                              }

                                              bathrooms={filters.bathrooms}
                                              setBathrooms={(value) =>
                                                setFilters(prev => ({
                                                  ...prev,
                                                  bathrooms: value
                                                }))
                                              }

                                              parking={filters.parking}
                                              setParking={(value) =>
                                                setFilters(prev => ({
                                                  ...prev,
                                                  parking: value
                                                }))
                                              }

                                              yearBuiltRange={filters.year_built}
                                              setYearBuiltRange={(value) =>
                                                setFilters(prev => ({
                                                  ...prev,
                                                  year_built: value
                                                }))
                                              }

                                              constructionArea={filters.construction_area}
                                              setConstructionArea={(value) =>
                                                setFilters(prev => ({
                                                  ...prev,
                                                  construction_area: value
                                                }))
                                              }

                                              setShowResidentialSummary={
                                                setShowResidentialSummary
                                              }

                                              bedroomOptions={bedroomOptions}
                                              bathroomOptions={bathroomOptions}
                                              parkingOptions={parkingOptions}
                                              yearBuiltOptions={yearBuiltOptions}
                                              constructionAreaOptions={constructionAreaOptions}

                                              showBedroomOptions={showBedroomOptions}
                                              setShowBedroomOptions={setShowBedroomOptions}

                                              showBathroomOptions={showBathroomOptions}
                                              setShowBathroomOptions={setShowBathroomOptions}

                                              showParkingOptions={showParkingOptions}
                                              setShowParkingOptions={setShowParkingOptions}

                                              showYearBuiltOptions={showYearBuiltOptions}
                                              setShowYearBuiltOptions={setShowYearBuiltOptions}

                                              showConstructionAreaOptions={
                                                showConstructionAreaOptions
                                              }

                                              setShowConstructionAreaOptions={
                                                setShowConstructionAreaOptions
                                              }

                                              showResidentialSummary={showResidentialSummary}

                                            />

                                          )
                                        }

<PropertyAreaFilter

                          showproperty_areaOptions={
                            showproperty_areaOptions
                          }

                          setShowproperty_areaOptions={
                            setShowproperty_areaOptions
                          }

                          setShowutilityOptions={
                            setShowutilityOptions
                          }

                          selectedproperty_area={
                            filters.property_area
                          }

                          setShowProvinceOptions={
                            setShowProvinceOptions
                          }

                          setShowCantonOptions={
                            setShowCantonOptions
                          }

                          setShowDistrictOptions={
                            setShowDistrictOptions
                          }

                          setSelectedproperty_area={(value) => {

                            setFilters(prev => ({
                              ...prev,
                              property_area: value
                            }))

                            setShowproperty_areaOptions(false)

                            setShowutilityOptions(true)

                          }}

                        />

<UtilitiesFilter

                        showutilityOptions={
                          showutilityOptions
                        }

                        setShowutilityOptions={
                          setShowutilityOptions
                        }

                        selectedutility={
                          filters.utility
                        }

                        setShowProvinceOptions={
                        setShowProvinceOptions
                      }

                      setShowCantonOptions={
                        setShowCantonOptions
                      }

                      setShowDistrictOptions={
                        setShowDistrictOptions
                      }

                        setSelectedutility={(value) => {

                          setFilters(prev => ({
                            ...prev,
                            utility: value
                          }))

                          setShowenvironmentOptions(true)

                        }}

                      />


<AdvancedFiltersToggle
  showadvanced_filters={showadvanced_filters}
  setShowadvanced_filters={setShowadvanced_filters}
  setShowutilityOptions={setShowutilityOptions}
  setShowProvinceOptions={
  setShowProvinceOptions
    }

    setShowCantonOptions={
      setShowCantonOptions
    }

    setShowDistrictOptions={
      setShowDistrictOptions
    }
>

<EnvironmentFilter

                    showenvironmentOptions={
                      showenvironmentOptions
                    }

                    setShowenvironmentOptions={
                      setShowenvironmentOptions
                    }

                    selectedenvironment={
                      filters.environment
                    }

                    setSelectedenvironment={(value) => {

                        setFilters(prev => ({
                          ...prev,
                          environment: value
                        }))

                        setShowAccessibilityOptions(true)

                      }}

                  />

<AccessibilityFilter

                  showaccessibilityOptions={
                    showAccessibilityOptions
                  }

                  setShowaccessibilityOptions={
                    setShowAccessibilityOptions
                  }

                  setShowenvironmentOptions={
                    setShowenvironmentOptions
                  }

                  setShowTerrainOptions={
                    setShowTerrainOptions
                  }

                  setShowProvinceOptions={
                    setShowProvinceOptions
                  }

                  setShowCantonOptions={
                    setShowCantonOptions
                  }

                  setShowDistrictOptions={
                    setShowDistrictOptions
                  }

                  selectedaccessibility={
                    filters.accessibility
                  }

                  setSelectedaccessibility={(value) => {

                    setFilters(prev => ({
                      ...prev,
                      accessibility: value
                    }))

                    setShowTerrainOptions(true)

                  }}

                />

<TerrainFilter

                    showTerrainOptions={
                      showTerrainOptions
                    }

                    setShowTerrainOptions={
                      setShowTerrainOptions
                    }

                    selectedterrain={
                      filters.terrain
                    }

                    setShowProvinceOptions={
                      setShowProvinceOptions
                    }

                    setShowCantonOptions={
                      setShowCantonOptions
                    }

                    setShowDistrictOptions={
                      setShowDistrictOptions
                    }

                    setSelectedterrain={(value) => {

                      setFilters(prev => ({
                        ...prev,
                        terrain: value
                      }))

                      setShowlegal_statusOptions(true)

                    }}

                  />

<LegalStatusFilter

                    showlegal_statusOptions={
                      showlegal_statusOptions
                    }

                    setShowlegal_statusOptions={
                      setShowlegal_statusOptions
                    }

                    setShowTerrainOptions={
                      setShowTerrainOptions
                    }

                    selectedlegal_status={
                      filters.legal_status
                    }

                    setShowProvinceOptions={
                      setShowProvinceOptions
                    }

                    setShowCantonOptions={
                      setShowCantonOptions
                    }

                    setShowDistrictOptions={
                      setShowDistrictOptions
                    }

                    setSelectedlegal_status={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        legal_status: value
                      }))
                    }

                  />

</AdvancedFiltersToggle>

                </div>   

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
                                          No Image
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
                            No matching properties for sale
                          </h2>

                          <p
                            style={{
                              color: '#777'
                            }}
                          >
                            Try adjusting your property filters.
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


