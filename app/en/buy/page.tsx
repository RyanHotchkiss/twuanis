'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import rawListings from '@/data/encuentra24-sale-listings.json'
import Favorites from '@/app/components/Favorites'
import SwipeCard from '@/app/components/SwipeCard'
import LocationFilter from '@/app/components/filter-bar/LocationFilter'
import AddProperty from '@/app/components/filter-bar/AddProperty'
import PriceFilter from '@/app/components/filter-bar/PriceFilter'
import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'
import UseTypeFilter from '@/app/components/filter-bar/UseTypeFilter'
import LotSizeFilter from '@/app/components/filter-bar/LotSizeFilter'
import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'
import AdvancedFiltersToggle from '@/app/components/filter-bar/AdvancedFiltersToggle'
import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'
import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'
import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilter'
import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'
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
    use_type: '',
    property_area: '',
    utility: '',
    legal_status: '',
    environment: '',
    accessibility: '',
    terrain: ''
  })

  const [showadvanced_filters, setShowadvanced_filters] = useState(false)


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
          .from('sale_listing')
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
                    filters.utility &&
                    property.utility !== filters.utility
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
                    filters.environment &&
                    property.environment !== filters.environment
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
                    filters.terrain &&
                    property.terrain !== filters.terrain
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

        {/* TOP BAR */}
              <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>

                    <Breadcrumbs
                        breadcrumbs={[
                          {
                            label: 'Home',
                            href: '/en/'
                          },
                          {
                            label: 'Buy',
                            href: '/en/buy'
                          }
                        ]}
                      />

                        <Favorites
                          href="/en/favorites"
                          label="Favorite Properties"
                          icon="♥"
                        />

                        <SwipeCard
                          href="/en/swipe/buy"
                          label="Swipe View"
                        />
              </div>


{/* RIGHT */}
             
            <AddProperty />

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
            Find Properties for Sale
          </p>

        </div>

        {/* MAIN GRID */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>

        {/* BUY EXPERIENCE */}
          <div
            style={{
              background: '#111',
              borderRadius: '28px',
              overflow: 'hidden',
              textDecoration: 'none',
              color: '#fff',
              border: '1px solid #222',
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              minHeight: '620px',
              width: '100%'
            }}
          >
            {/* SIDEBAR */}
            <div style={{
              background: '#0d0d0d',
              borderRight: '1px solid #222',
              padding: '25px',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px'
            }}>

<LocationFilter

                    provinces={provinces}
                    districts={districts}

                    selectedprovince={filters.province}
                    selectedcanton={filters.canton}
                    selecteddistrict={filters.district}

                    setSelectedprovince={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        province: value,
                        canton: '',
                        district: ''
                      }))
                    }

                    setSelectedcanton={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        canton: value,
                        district: ''
                      }))
                    }

                    setSelecteddistrict={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        district: value
                      }))
                    }

                  />

<PriceFilter
                      selectedprice_range={filters.price_range}
                      setSelectedprice_range={(value) =>
                        setFilters(prev => ({
                          ...prev,
                          price_range: value
                        }))
                      }
                    />

<PropertyTypeFilter
                    selectedproperty_type={filters.property_type}
                    setSelectedproperty_type={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        property_type: value
                      }))
                    }
                  />

<UseTypeFilter
                      selecteduse_type={filters.use_type}
                      setSelecteduse_type={(value) =>
                        setFilters(prev => ({
                          ...prev,
                          use_type: value
                        }))
                      }
                    />

<LotSizeFilter
                        selectedproperty_area={filters.property_area}
                        setSelectedproperty_area={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            property_area: value
                          }))
                        }
                      />

<UtilitiesFilter
                        selectedutility={filters.utility}
                        setSelectedutility={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            utility: value
                          }))
                        }
                      />

<AdvancedFiltersToggle
                        showadvanced_filters={showadvanced_filters}
                        setShowadvanced_filters={setShowadvanced_filters}
                      >

  <LegalStatusFilter
                        selectedlegal_status={filters.legal_status}
                        setSelectedlegal_status={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            legal_status: value
                          }))
                        }
                      />

  <EnvironmentFilter
                        selectedenvironment={filters.environment}
                        setSelectedenvironment={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            environment: value
                          }))
                        }
                      />

  <AccessibilityFilter
                        selectedaccessibility={filters.accessibility}
                        setSelectedaccessibility={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            accessibility: value
                          }))
                        }
                      />

  <TerrainFilter
                        selectedterrain={filters.terrain}
                        setSelectedterrain={(value) =>
                          setFilters(prev => ({
                            ...prev,
                            terrain: value
                          }))
                        }
                      />

</AdvancedFiltersToggle>
                      

                        </div>
                </div>   

{/* PROPERTY PREVIEW right-center column */}
                <div
                  style={{
                    padding: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >

                  <div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
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


