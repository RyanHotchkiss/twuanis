'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import rawListings from '@/data/encuentra24-rent-lease-listings.json'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import Favorites from '@/app/components/Favorites'
import SwipeCard from '@/app/components/SwipeCard'
import LocationFilter from '@/app/components/filter-bar/LocationFilter'
import AddPropertyRL from '@/app/components/filter-bar/AddPropertyRL'
import PriceFilterRL from '@/app/components/filter-bar/PriceFilterRL'
import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'
import UseTypeFilter from '@/app/components/filter-bar/UseTypeFilter'
import LotSizeFilter from '@/app/components/filter-bar/LotSizeFilter'
import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'
import AdvancedFiltersToggle from '@/app/components/filter-bar/AdvancedFiltersToggle'
import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'
import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'
import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilter'
import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'
export default function HomePage() {

  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedprovince, setSelectedprovince] = useState('')
  const [selectedcanton, setSelectedcanton] = useState('')
  const [selecteddistrict, setSelecteddistrict] = useState('')

  const [selectedmonthly_price, setSelectedmonthly_price] = useState('')
  const [selectedproperty_type, setSelectedproperty_type] = useState('')
  const [selecteduse_type, setSelecteduse_type] = useState('')
  const [selectedproperty_area, setSelectedproperty_area] = useState('')
  const [selectedutility, setSelectedutility] = useState('')

  const [showadvanced_filters, setShowadvanced_filters] = useState(false)

  const [selectedlegal_status, setSelectedlegal_status] = useState('')
  const [selectedenvironment, setSelectedenvironment] = useState('')
  const [selectedaccessibility, setSelectedaccessibility] = useState('')
  const [selectedterrain, setSelectedterrain] = useState('')

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
          .from('rent_lease_listings')
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

      const provinces: Record<string, string[]> = {

        'San José': [
          'Central San José',
          'Escazú',
          'Desamparados',
          'Puriscal',
          'Tarrazú',
          'Aserrí',
          'Mora',
          'Goicoechea',
          'Santa Ana',
          'Alajuelita',
          'Vásquez de Coronado',
          'Acosta',
          'Tibás',
          'Moravia',
          'Montes de Oca',
          'Turrubares',
          'Dota',
          'Curridabat',
          'Pérez Zeledón',
          'León Cortés'
        ],

        Alajuela: [
          'Central Alajuela',
          'San Ramón',
          'Grecia',
          'San Mateo',
          'Atenas',
          'Naranjo',
          'Palmares',
          'Poás',
          'Orotina',
          'San Carlos',
          'Zarcero',
          'Valverde Vega',
          'Upala',
          'Los Chiles',
          'Guatuso',
          'Río Cuarto'
        ],

        Cartago: [
          'Central Cartago',
          'Paraíso',
          'La Unión',
          'Jiménez',
          'Turrialba',
          'Alvarado',
          'Oreamuno',
          'El Guarco'
        ],

        Heredia: [
          'Central Heredia',
          'Barva',
          'Santo Domingo',
          'Santa Bárbara',
          'San Rafael',
          'San Isidro',
          'Belén',
          'Flores',
          'San Pablo',
          'Sarapiquí'
        ],

        Guanacaste: [
          'Liberia',
          'Nicoya',
          'Santa Cruz',
          'Bagaces',
          'Carrillo',
          'Cañas',
          'Abangares',
          'Tilarán',
          'Nandayure',
          'La Cruz',
          'Hojancha'
        ],

        Puntarenas: [
          'Central Puntarenas',
          'Esparza',
          'Buenos Aires',
          'Montes de Oro',
          'Osa',
          'Quepos',
          'Golfito',
          'Coto Brus',
          'Parrita',
          'Corredores',
          'Garabito'
        ],

        Limón: [
          'Central Limón',
          'Pococí',
          'Siquirres',
          'Talamanca',
          'Matina',
          'Guácimo'
        ]

      }

        const districts: Record<string, string[]> = {

        // SAN JOSÉ
        'Central San José': [
          'Carmen',
          'Merced',
          'Hospital',
          'Catedral',
          'Zapote',
          'San Francisco de Dos Ríos'
        ],

        Escazú: [
          'Escazú Centro',
          'San Rafael',
          'San Antonio'
        ],

        Desamparados: [
          'Desamparados Centro',
          'San Miguel',
          'San Juan de Dios',
          'San Rafael Arriba',
          'San Antonio',
          'Frailes'
        ],

        'Santa Ana': [
          'Santa Ana Centro',
          'Pozos',
          'Uruca',
          'Piedades',
          'Brasil'
        ],

        Curridabat: [
          'Curridabat Centro',
          'Granadilla',
          'Sánchez',
          'Tirrases'
        ],

        // ALAJUELA
        'Central Alajuela': [
          'Alajuela Centro',
          'San José',
          'Carrizal',
          'San Antonio'
        ],

        'San Ramón': [
          'San Ramón Centro',
          'Santiago',
          'San Juan',
          'Piedades Norte'
        ],

        Grecia: [
          'Grecia Centro',
          'San Isidro',
          'San José',
          'Tacares'
        ],

        'San Carlos': [
          'Quesada',
          'Florencia',
          'Aguas Zarcas',
          'Venecia',
          'Pital',
          'La Fortuna'
        ],

        // CARTAGO
        'Central Cartago': [
          'Oriental',
          'Occidental',
          'Carmen',
          'San Nicolás',
          'Aguacaliente'
        ],

        Paraíso: [
          'Paraíso Centro',
          'Santiago',
          'Orosi',
          'Cachí'
        ],

        'La Unión': [
          'Tres Ríos',
          'San Diego',
          'San Juan',
          'Concepción'
        ],

        Jiménez: [
          'Juan Viñas',
          'Tucurrique',
          'Pejivalle'
        ],

        Turrialba: [
          'Turrialba Centro',
          'La Suiza',
          'Peralta',
          'Santa Cruz',
          'Santa Teresita',
          'Pavones',
          'Tayutic'
        ],

        // HEREDIA
        'Central Heredia': [
          'Heredia Centro',
          'Mercedes',
          'San Francisco',
          'Ulloa'
        ],

        Barva: [
          'Barva Centro',
          'San Pedro',
          'San Pablo'
        ],

        Sarapiquí: [
          'Puerto Viejo',
          'La Virgen',
          'Horquetas'
        ],

        // GUANACASTE
        Liberia: [
          'Liberia Centro',
          'Cañas Dulces',
          'Mayorga'
        ],

        Nicoya: [
          'Nicoya Centro',
          'Sámara',
          'Nosara'
        ],

        'Santa Cruz': [
          'Santa Cruz Centro',
          'Tamarindo',
          'Brasilito',
          'Potrero'
        ],

        Carrillo: [
          'Filadelfia',
          'Palmira',
          'Sardinal'
        ],

        // PUNTARENAS
        'Central Puntarenas': [
          'Puntarenas Centro',
          'Pitahaya',
          'Chomes',
          'Lepanto'
        ],

        Osa: [
          'Puerto Cortés',
          'Palmar',
          'Sierpe',
          'Bahía Ballena'
        ],

        Quepos: [
          'Quepos Centro',
          'Savegre',
          'Naranjito'
        ],

        Garabito: [
          'Jacó',
          'Tárcoles'
        ],

        // LIMÓN
        'Central Limón': [
          'Limón Centro',
          'Valle La Estrella',
          'Río Blanco'
        ],

        Pococí: [
          'Guápiles',
          'Jiménez',
          'La Rita',
          'Cariari'
        ],

        Siquirres: [
          'Siquirres Centro',
          'Pacuarito',
          'Florida'
        ],

        Talamanca: [
          'Bratsi',
          'Sixaola',
          'Cahuita'
        ]

      }

 const filteredProperties = properties.filter((property) => {

                    if (
                      selectedprovince &&
                      property.province !== selectedprovince
                    ) {
                      return false
                    }

                    if (
                      selectedcanton &&
                      property.canton !== selectedcanton
                    ) {
                      return false
                    }

                    if (
                      selecteddistrict &&
                      property.district !== selecteddistrict
                    ) {
                      return false
                    }

                    if (
                      selectedmonthly_price &&
                      property.monthly_price !== selectedmonthly_price
                    ) {
                      return false
                    }

                    if (
                      selectedproperty_type &&
                      property.property_type !== selectedproperty_type
                    ) {
                      return false
                    }

                    if (
                      selecteduse_type &&
                      property.use_type !== selecteduse_type
                    ) {
                      return false
                    }

                    if (
                      selectedproperty_area &&
                      property.property_area !== selectedproperty_area
                    ) {
                      return false
                    }

                    if (
                      selectedutility &&
                      property.utility !== selectedutility
                    ) {
                      return false
                    }

                    if (
                      selectedenvironment &&
                      property.environment !== selectedenvironment
                    ) {
                      return false
                    }

                    if (
                      selectedaccessibility &&
                      property.accessibility !== selectedaccessibility
                    ) {
                      return false
                    }

                    return true

                  })

  function selectprovince(province: string) {

    if (selectedprovince === province) {
      setSelectedprovince('')
      setSelectedcanton('')
      setSelecteddistrict('')
      return
    }

    setSelectedprovince(province)
    setSelectedcanton('')
    setSelecteddistrict('')
  }

  function selectcanton(canton: string) {

    if (selectedcanton === canton) {
      setSelectedcanton('')
      setSelecteddistrict('')
      return
    }

    setSelectedcanton(canton)
    setSelecteddistrict('')
  }

  function selectdistrict(district: string) {

    if (selecteddistrict === district) {
      setSelecteddistrict('')
      return
    }

    setSelecteddistrict(district)
  }

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
                            label: 'Rent & Lease',
                            href: '/en/rent-lease'
                          }
                        ]}
                      />

                        <Favorites
                          href="/en/favorites"
                          label="Favorite Properties"
                          icon="♥"
                        />

                        <SwipeCard
                          href="/en/swipe/rent-lease"
                          label="Swipe View"
                        />
              </div>


{/* RIGHT */}
             
            <AddPropertyRL />

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
           Find Properties for Rent & Lease
          </p>

        </div>

        {/* MAIN GRID */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>

        {/* RENT & LEASE EXPERIENCE */}
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

                  selectedprovince={selectedprovince}
                  selectedcanton={selectedcanton}
                  selecteddistrict={selecteddistrict}

                  setSelectedprovince={setSelectedprovince}
                  setSelectedcanton={setSelectedcanton}
                  setSelecteddistrict={setSelecteddistrict}

                />

                <PriceFilterRL
                    selectedmonthly_price={selectedmonthly_price}
                    setSelectedmonthly_price={setSelectedmonthly_price}
                  />

                 <PropertyTypeFilter
                    selectedproperty_type={selectedproperty_type}
                    setSelectedproperty_type={setSelectedproperty_type}
                  />

                  <UseTypeFilter
                    selecteduse_type={selecteduse_type}
                    setSelecteduse_type={setSelecteduse_type}
                  />

                  <LotSizeFilter
                    selectedproperty_area={selectedproperty_area}
                    setSelectedproperty_area={setSelectedproperty_area}
                  />

                  <UtilitiesFilter
                    selectedutility={selectedutility}
                    setSelectedutility={setSelectedutility}
                  />

                  
                <AdvancedFiltersToggle
                  showadvanced_filters={showadvanced_filters}
                  setShowadvanced_filters={setShowadvanced_filters}
                >

                  <LegalStatusFilter
                    selectedlegal_status={selectedlegal_status}
                    setSelectedlegal_status={setSelectedlegal_status}
                  />

                  <EnvironmentFilter
                    selectedenvironment={selectedenvironment}
                    setSelectedenvironment={setSelectedenvironment}
                  />

                  <AccessibilityFilter
                        selectedaccessibility={selectedaccessibility}
                        setSelectedaccessibility={setSelectedaccessibility}
                  />

                  <TerrainFilter
                      selectedterrain={selectedterrain}
                      setSelectedterrain={setSelectedterrain}
                    />

                </AdvancedFiltersToggle>
                      

                 
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
                          href={`/en/rent-lease/listing/${property.id}`}
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
                            No matching rental properties
                          </h2>

                          <p
                            style={{
                              color: '#777'
                            }}
                          >
                            Try adjusting your rental filters.
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
  border: '.0625rem solid #222',
  color: '#fff',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const sellButton = {
  background: '#00ff99',
  color: '#000',
  textDecoration: 'none',
  padding: '.75rem 1.125rem',
  borderRadius: '.875rem',
  fontWeight: 'bold',
  fontSize: '.875rem'
}


