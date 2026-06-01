'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'


function HomePageContent() {

  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  const [selectedprovince, setSelectedprovince] = useState('')
  const [selectedcanton, setSelectedcanton] = useState('')
  const [selecteddistrict, setSelecteddistrict] = useState('')

  const [selectedprice, setSelectedprice] = useState('')
  const [selectedproperty_type, setSelectedproperty_type] = useState('')
  const [selecteduse_type, setSelecteduse_type] = useState('')
  const [selectedproperty_area, setSelectedproperty_area] = useState('')
  const [selectedutility, setSelectedutility] = useState('')

  const [showadvanced_filters, setShowadvanced_filters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
 const [showIntroOverlay, setShowIntroOverlay] = useState(
          searchParams.get('skipintro')
            ? false
            : true
        )

  const [countdown, setCountdown] = useState(12)


  const isMobile =
  typeof window !== 'undefined' &&
  window.innerWidth <= 768

  const overlayBackButton = {
    background:'#00ff9940',
    border:'.0625rem solid #ffffff50',
    color:'#fff',
    borderRadius:'999rem',
    padding:'.55rem 1rem',
    cursor:'pointer',
    transition:'all .2s ease',
    backdropFilter:'blur(10px)',
    fontSize:'.85rem',
    fontWeight:'bold',
    marginBottom:'1.25rem',
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center'
  }
  const [selectedlegal_status, setSelectedlegal_status] = useState('')
  const [selectedenvironment, setSelectedenvironment] = useState('')
  const [selectedaccessibility, setSelectedaccessibility] = useState('')
  const [selectedterrain, setSelectedterrain] = useState('')
  

  const initialOverlayState =  
    searchParams.get('overlay') === 'looking'
      ? 'looking'
      : searchParams.get('overlay') === 'posting'
      ? 'posting'
      : 'initial'

  const [overlayState, setOverlayState] =
  useState<'initial' | 'looking' | 'posting' | null>(
    initialOverlayState
  )
  const homepageBlurred =
  overlayState !== null

    useEffect(() => {

            async function fetchListings() {

              const { data, error } = await supabase
                .from('listings')
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

                  images:
                    Array.isArray(listing.images)
                      ? listing.images
                      : typeof listing.images === 'string'
                      ? listing.images.split('|')
                      : []

                })
              )

              setProperties(
                normalizedSupabaseListings
              )

              setLoading(false)

            }

            fetchListings()

          }, [])

          useEffect(() => {

              if (
                sessionStorage.getItem('skipIntro')
              ) {

                setShowIntroOverlay(false)

                sessionStorage.removeItem(
                  'skipIntro'
                )

              }

            }, [])

          useEffect(() => {

            if (!showIntroOverlay) return

            const interval = setInterval(() => {

              setCountdown(prev => {

                if (prev <= 1) {

                  clearInterval(interval)

                  setShowIntroOverlay(false)

                  return 0

                }

                return prev - 1

              })

            }, 1000)

            return () => clearInterval(interval)

          }, [showIntroOverlay])

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
                      selectedprice &&
                      property.price !== selectedprice
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

  {/* OVERLAY over OVERLAY */}
  return (
      <main style={{        
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>

      {showIntroOverlay && (

          <div
            style={{
              position:'fixed',
              inset:0,

              background:'rgba(0,0,0,.88)',

              backdropFilter:'blur(20px)',

              zIndex:10000,

              display:'flex',
              justifyContent:'center',
              alignItems:'flex-start',
              overflowY:'auto',

              paddingTop:'3rem',
              paddingBottom:'3rem',
            }}
          >

         <button
            onClick={() =>
              setShowIntroOverlay(false)
            }
            style={{
              position:'fixed',

              top:'1rem',
              right:'1rem',

              width:'3rem',
              height:'3rem',

              borderRadius:'999rem',

              background:'rgba(0,0,0,.6)',
              border:'1px solid rgba(255,255,255,.15)',

              backdropFilter:'blur(10px)',

              color:'#fff',

              fontSize:'1.5rem',

              cursor:'pointer',

              zIndex:10051,

              pointerEvents:'auto'
            }}
          >
            ✕
          </button>

            <div
              style={{
                maxWidth:'74rem',
                width:'100%',

                paddingTop:isMobile
                  ? '2rem'
                  : '5rem',

                paddingBottom:isMobile
                  ? '2rem'
                  : '5rem',

                paddingLeft:isMobile
                  ? '1rem'
                  : '2rem',

                paddingRight:isMobile
                  ? '1rem'
                  : '2rem',

                textAlign:'center'
              }}
            >

              <h1
  style={{
    fontSize:isMobile
      ? '2rem'
      : '3.5rem',

    lineHeight:'1.15',

    marginBottom:'1.5rem'
  }}
>
  <span style={{ color:'#ff3b00' }}>
    Do
  </span>

  {' '}exponentially{' '}

  <span style={{ color:'#ff3b00' }}>
    more with Twuanis
  </span>

  {' '}than any other real estate website.
</h1>

              <div
                  style={{
                    display:'flex',
                    flexWrap:'wrap',
                    justifyContent:'center',
                    alignItems:'flex-start',

                    gap:isMobile
                      ? '2rem'
                      : '4rem',

                    marginTop:'3rem',
                    marginBottom:'3rem'
                  }}
                >

                  {/* LEFT */}
                  <div
                    style={{
                      flex:'1 1 18rem',
                      minWidth:'16rem',
                      maxWidth:'22rem'
                    }}
                  >

                    <p
                      style={{
                        color:'#00ff99',
                        fontWeight:'bold',
                        fontSize:'1.2rem',
                        marginBottom:'1rem'
                      }}
                    >
                      Without typing a single letter.
                    </p>

                    <p
                      style={{
                        fontWeight:'bold',
                        fontSize:'1.4rem',
                        marginBottom:'2rem'
                      }}
                    >
                      Not. One. Word.
                    </p>

                    <div
                      style={{
                        color:'#cccccc',
                        lineHeight:'2'
                      }}
                    >
                      No titles.<br />
                      No descriptions.<br />
                      No endless forms.<br />
                      No wasted time.
                    </div>

                  </div>

                  {/* CENTER */}
                  <div
                    style={{
                      flex:'1 1 18rem',
                      minWidth:'16rem',
                      maxWidth:'22rem'
                    }}
                  >

                    <div
                      style={{
                        color:'#ffffff',
                        lineHeight:'2'
                      }}
                    >

                      <p
                      style={{
                        color:'#00ff99',
                        fontWeight:'bold',
                        fontSize:'1.2rem',
                        marginBottom:'1rem'
                      }}
                    >
                      Describe any property in under a minute.
                    </p>

                      Buying.<br />
                      Selling.<br />
                      Renting.<br />
                      Leasing.

                      
                    </div>

                  </div>

                  {/* RIGHT */}
                  <div
                    style={{
                      flex:'1 1 18rem',
                      minWidth:'16rem',
                      maxWidth:'22rem'
                    }}
                  >
                    <p
                      style={{
                        color:'#00ff99',
                        fontWeight:'bold',
                        fontSize:'1.2rem',
                        marginBottom:'1rem'
                      }}
                    >
                      Simply select the options that match the property.
                    </p>

                    <div
                      style={{
                        color:'#bbbbbb',
                        lineHeight:'2'
                      }}
                    >
                      • Property titles<br />
                      • Property descriptions<br />
                      • Property categorization<br />
                      • Keyword-rich search signals<br />
                      • Contact information
                    </div>

                  </div>

                </div>

                <p
                  style={{
                    marginTop:'2rem',
                    color:'#ff3b00',
                    fontWeight:'bold',
                    fontSize:isMobile
                      ? '1rem'
                      : '1.15rem'
                  }}
                >
                  What normally takes 15–30 minutes can be completed in under 80 seconds.
                </p>

                <div
                        style={{
                          position:'fixed',

                          top:isMobile ? '1rem' : 'auto',
                          bottom:isMobile ? 'auto' : '8rem',

                          left:isMobile ? '1rem' : '50%',

                          transform:isMobile
                            ? 'none'
                            : 'translateX(-50%)',

                          display:'flex',
                          alignItems:'center',
                          gap:'.75rem',

                          zIndex:10050,

                          pointerEvents:'auto'
                        }}
                      >

                        <div
                          style={{
                            background:'rgba(0,0,0,.6)',
                            border:'1px solid rgba(255,255,255,.15)',
                            backdropFilter:'blur(10px)',

                            padding:'.75rem 1.25rem',

                            borderRadius:'999rem',

                            color:'#00ff99',

                            fontWeight:'bold'
                          }}
                        >
                          Continue in {countdown}s
                        </div>

                        <Link
                          href="/es"
                          style={{
                            background:'rgba(0,0,0,.6)',
                            border:'1px solid rgba(255,255,255,.15)',
                            backdropFilter:'blur(10px)',

                            padding:'.75rem 1.25rem',

                            borderRadius:'999rem',

                            color:'#fff',

                            textDecoration:'none',

                            fontWeight:'bold'
                          }}
                        >
                          Español
                        </Link>

                      </div>

            </div>

          </div>

        )}


      {/* OVERLAY */}
          {overlayState && (

            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.34)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(9px)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all .45s ease'
            }}>

              <div style={{
                width: '100%',
                maxWidth: '32rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                transition: 'all .45s ease',
                opacity: 1,
                transform: 'translateY(0px) scale(1)'
              }}>

                {/* STATE 1 */}
                {overlayState === 'initial' && (

                  <>

                    <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '1rem'
                    }}>

                    </div>

                    <h2 style={{
                      fontSize: '2.8rem',
                      marginBottom: '.5rem',
                      textAlign: 'center'
                    }}>
                      Twuanis
                    </h2>

                    <p style={{
                      color: '#ff3b00',
                      marginBottom: '2rem',
                      textAlign: 'center',
                      lineHeight: 1.7
                    }}>
                      What would you like to do?
                    </p>

                    <button
                      onClick={() =>
                        setOverlayState('looking')
                      }
                      style={overlayPrimaryButton}
                    >
                      Buy, Rent, or Lease
                    </button>

                    <button
                      onClick={() =>
                        setOverlayState('posting')
                      }
                      style={overlaySecondaryButton}
                    >
                      Sell, Rent, or Lease Out
                    </button>

                  </>

                )}

                {/* STATE 2 — LOOKING */}
                {overlayState === 'looking' && (

                  <>

                    <button
                      onClick={() =>
                        setOverlayState('initial')
                      }
                      style={overlayBackButton}
                    >
                      ← Back
                    </button>

                    <h2 style={{
                      fontSize: '2.2rem',
                      marginBottom: '1.5rem'
                    }}>
                      Looking For?
                    </h2>

                    <button
                      onClick={() =>
                        window.location.href = '/en/buy'
                      }
                      style={overlayPrimaryButton}
                    >
                      Buy
                    </button>

                    <button
                      onClick={() =>
                        window.location.href =
                          '/en/rent-lease'
                      }
                      style={overlaySecondaryButton}
                    >
                      Rent / Lease
                    </button>

                  </>

                )}

                {/* STATE 2 — POSTING */}
                {overlayState === 'posting' && (

                  <>

                    <button
                      onClick={() =>
                        setOverlayState('initial')
                      }
                      style={overlayBackButton}
                    >
                      ← Back
                    </button>

                    <h2 style={{
                      fontSize: '2.2rem',
                      marginBottom: '1.5rem'
                    }}>
                      Posting A Property?
                    </h2>

                    <button
                      onClick={() =>
                        window.location.href =
                          '/en/sell'
                      }
                      style={overlayPrimaryButton}
                    >
                      Sell
                    </button>

                    <button
                      onClick={() =>
                        window.location.href =
                          '/en/rent-out-lease-out'
                      }
                      style={overlaySecondaryButton}
                    >
                      Rent Out, Lease Out
                    </button>

                  </>

                )}

              </div>

            </div>

          )}

          <div style={{
            width: '100%',
            padding: '.5rem',
            filter:
              homepageBlurred
                ? 'blur(5px)'
                : 'blur(0px)',
            transform:
              homepageBlurred
                ? 'scale(1.0005)'
                : 'scale(1)',
            transition: 'all .225s ease',
            pointerEvents:
              homepageBlurred
                ? 'none'
                : 'auto',
            userSelect:
              homepageBlurred
                ? 'none'
                : 'auto'
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

              {/* LEFT */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px'
              }}>

               <button
                  onClick={() => window.location.href = '/favorites'}
                  style={navButton}
                >
                  Favorite Properties <span style={{ color: '#ff3b30' }}>♥</span>
                </button>

                <button
                  onClick={() => window.location.href = '/swipe'}
                  style={navButton}
                >
                  Swipe View <span style={{ color: '#00ff99' }}>⇄</span>
                </button>
               

              </div>


{/* RIGHT */}
              <a
                href="/sell"
                style={sellButton}
              >
                + Sell Property
              </a>

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
            Property Marketing and Discovery
          </p>

        </div>

        {isMobile && (

          <button
            onClick={() =>
              setShowMobileFilters(true)
            }
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,

              background: '#00ff99',
              color: '#000',

              border: 'none',
              borderRadius: '999px',

              padding: '16px 22px',

              fontWeight: 'bold',
              fontSize: '16px',

              boxShadow: '0 10px 30px rgba(0,0,0,.45)'
            }}
          >
            Filters
          </button>

        )}

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
              overflow: 'hidden',
              textDecoration: 'none',
              color: '#fff',
              border: '1px solid #222',
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              minHeight: '620px'
            }}
          >

            {/* SIDEBAR */}
            {isMobile && (

                <button
                  onClick={() =>
                    setShowMobileFilters(false)
                  }
                  style={{
                    background: '#181818',
                    border: '1px solid #333',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Close Filters
                </button>

              )}

              <div
                style={{
                  background: '#0d0d0d',
                  borderRight: '1px solid #222',
                  padding: '25px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '28px',

                  position: isMobile
                    ? 'fixed'
                    : 'relative',

                  top: 0,
                  left: showMobileFilters ? 0 : '-100%',

                  width: isMobile
                    ? '85vw'
                    : '320px',

                  height: isMobile
                    ? '100vh'
                    : 'auto',

                  zIndex: 999,

                  transition: 'left .3s ease',

                  overflowY: 'auto'
                }}
              >

              {/* LOCATION */}
              <div>

                <h3 style={filterHeading}>
                  Location
                </h3>

                {/* province LEVEL */}
                {!selectedprovince && (

                  <div style={scrollPanel}>

                    {Object.keys(provinces).map((province) => (

                      <button
                        key={province}
                        onClick={(e) => {
                          e.preventDefault()
                          selectprovince(province)
                        }}
                        style={
                            selectedprovince === province
                              ? activeListButton
                              : listButton
                          }
                      >
                        {province}
                      </button>

                    ))}

                  </div>

                )}

                {/* canton LEVEL */}
                {selectedprovince && !selectedcanton && (

                  <div>

                    {/* BREADCRUMB */}
                    <div style={breadcrumbBar}>

                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedprovince('')
                        }}
                        style={backButton}
                      >
                        ← provinces
                      </button>

                      <span style={breadcrumbText}>
                        {selectedprovince}
                      </span>

                    </div>

                    {/* SCROLLABLE cantonS */}
                    <div style={scrollPanel}>

                      {provinces[selectedprovince].map((canton) => (

                        <button
                          key={canton}
                          onClick={(e) => {
                            e.preventDefault()
                            selectcanton(canton)
                          }}
                          style={listButton}
                        >
                          {canton}
                        </button>

                      ))}

                    </div>

                  </div>

                )}

                {/* district LEVEL */}
                {selectedprovince && selectedcanton && (

                  <div>

                    {/* BREADCRUMB */}
                    <div style={breadcrumbBar}>

                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedcanton('')
                        }}
                        style={backButton}
                      >
                        ← cantons
                      </button>

                      <span style={breadcrumbText}>
                        {selectedprovince} → {selectedcanton}
                      </span>

                    </div>

                    {/* SCROLLABLE districtS */}
                    <div style={scrollPanel}>

                      {districts[selectedcanton]?.map((district) => (

                        <button
                          key={district}
                          onClick={(e) => {
                            e.preventDefault()
                            selectdistrict(district)
                          }}
                          style={
                            selecteddistrict === district
                              ? activeListButton
                              : listButton
                          }
                        >
                          {district}
                        </button>

                      ))}

                    </div>

                  </div>

                )}

              </div>

              {/* price */}
                  <div>

                    <h3 style={filterHeading}>
                      price
                    </h3>

                    <div style={pillWrap}>

                      <button
                            onClick={() =>
                              setSelectedprice(
                                selectedprice === '-₡25M'
                                  ? ''
                                  : '-₡25M'
                              )
                            }
                            style={
                              selectedprice === '-₡25M'
                                ? activePill
                                : pill
                            }
                          >
                            -₡25M
                      </button>

                      <button
                            onClick={() =>
                              setSelectedprice(
                                selectedprice === '₡25M–₡75M'
                                  ? ''
                                  : '₡25M–₡75M'
                              )
                            }
                            style={
                              selectedprice === '₡25M–₡75M'
                                ? activePill
                                : pill
                            }
                          >
                            ₡25M–₡75M
                      </button>

                       <button
                            onClick={() =>
                              setSelectedprice(
                                selectedprice === '₡75M–₡125M'
                                  ? ''
                                  : '₡75M–₡125M'
                              )
                            }
                            style={
                              selectedprice === '₡75M–₡125M'
                                ? activePill
                                : pill
                            }
                          >
                            ₡75M–₡125M
                      </button>

                      <button
                            onClick={() =>
                              setSelectedprice(
                                selectedprice === '₡125M+'
                                  ? ''
                                  : '₡125M+'
                              )
                            }
                            style={
                              selectedprice === '₡125M+'
                                ? activePill
                                : pill
                            }
                          >
                            ₡125M+
                      </button>

                    </div>

                  </div>

                  {/* PROPERTY TYPE */}
                  <div>

                    <h3 style={filterHeading}>
                      Property Type
                    </h3>

                    <div style={pillWrap}>


                        <button
                          onClick={() =>
                            setSelectedproperty_type(
                              selectedproperty_type === 'House'
                                ? ''
                                : 'House'
                            )
                          }
                          style={
                            selectedproperty_type === 'House'
                              ? activePill
                              : pill
                          }
                        >
                          House
                        </button>

                        <button
                          onClick={() =>
                            setSelectedproperty_type(
                              selectedproperty_type === 'Condo'
                                ? ''
                                : 'Condo'
                            )
                          }
                          style={
                            selectedproperty_type === 'Condo'
                              ? activePill
                              : pill
                          }
                        >
                          Condo
                        </button>

                      <button
                        onClick={() =>
                          setSelectedproperty_type(
                            selectedproperty_type === 'Land'
                              ? ''
                              : 'Land'
                          )
                        }
                        style={
                          selectedproperty_type === 'Land'
                            ? activePill
                            : pill
                        }
                      >
                        Land
                      </button>

                      

                        <button
                          onClick={() =>
                            setSelectedproperty_type(
                              selectedproperty_type === 'Farm'
                                ? ''
                                : 'Farm'
                            )
                          }
                          style={
                            selectedproperty_type === 'Farm'
                              ? activePill
                              : pill
                          }
                        >
                          Farm
                        </button>

                        <button
                          onClick={() =>
                            setSelectedproperty_type(
                              selectedproperty_type === 'Cabin'
                                ? ''
                                : 'Cabin'
                            )
                          }
                          style={
                            selectedproperty_type === 'Cabin'
                              ? activePill
                              : pill
                          }
                        >
                          Cabin
                        </button>

                        <button
                          onClick={() =>
                            setSelectedproperty_type(
                              selectedproperty_type === 'Commercial Property'
                                ? ''
                                : 'Commercial Property'
                            )
                          }
                          style={
                            selectedproperty_type === 'Commercial Property'
                              ? activePill
                              : pill
                          }
                        >
                          Commercial Property
                        </button>

                    </div>

                  </div>

                  {/* USE TYPE */}
                  <div>

                    <h3 style={filterHeading}>
                      Use Type
                    </h3>

                    <div style={pillWrap}>

                      <button
                        onClick={() =>
                          setSelecteduse_type(
                            selecteduse_type === 'Residential'
                              ? ''
                              : 'Residential'
                          )
                        }
                        style={
                          selecteduse_type === 'Residential'
                            ? activePill
                            : pill
                        }
                      >
                        Residential
                      </button>

                      <button
                        onClick={() =>
                          setSelecteduse_type(
                            selecteduse_type === 'Commercial'
                              ? ''
                              : 'Commercial'
                          )
                        }
                        style={
                          selecteduse_type === 'Commercial'
                            ? activePill
                            : pill
                        }
                      >
                        Commercial
                      </button>

                      <button
                        onClick={() =>
                          setSelecteduse_type(
                            selecteduse_type === 'Agricultural'
                              ? ''
                              : 'Agricultural'
                          )
                        }
                        style={
                          selecteduse_type === 'Agricultural'
                            ? activePill
                            : pill
                        }
                      >
                        Agricultural
                      </button>

                      <button
                        onClick={() =>
                          setSelecteduse_type(
                            selecteduse_type === 'Tourism Commercial'
                              ? ''
                              : 'Tourism Commercial'
                          )
                        }
                        style={
                          selecteduse_type === 'Tourism Commercial'
                            ? activePill
                            : pill
                        }
                      >
                        Tourism Commercial
                      </button>

                      <button
                        onClick={() =>
                          setSelecteduse_type(
                            selecteduse_type === 'Mixed Use'
                              ? ''
                              : 'Mixed Use'
                          )
                        }
                        style={
                          selecteduse_type === 'Mixed Use'
                            ? activePill
                            : pill
                        }
                      >
                        Mixed Use
                      </button>

                    </div>

                  </div>

{/* LOT SIZE */}
                      <div>

                        <p style={miniHeading}>
                          Lot Size
                        </p>

                        <div style={pillWrap}>

                          <button
                              onClick={() =>
                                setSelectedproperty_area(
                                  selectedproperty_area === '<1,000m²'
                                    ? ''
                                    : '<1,000m²'
                                )
                              }
                              style={
                                selectedproperty_area === '<1,000m²'
                                  ? activePill
                                  : pill
                              }
                            >
                              {'<1,000m²'}
                            </button>

                            <button
                              onClick={() =>
                                setSelectedproperty_area(
                                  selectedproperty_area === '1,000–10,000m²'
                                    ? ''
                                    : '1,000–10,000m²'
                                )
                              }
                              style={
                                selectedproperty_area === '1,000–10,000m²'
                                  ? activePill
                                  : pill
                              }
                            >
                              1,000–10,000m²
                            </button>

                            <button
                              onClick={() =>
                                setSelectedproperty_area(
                                  selectedproperty_area === '10,000–50,000m²'
                                    ? ''
                                    : '10,000–50,000m²'
                                )
                              }
                              style={
                                selectedproperty_area === '10,000–50,000m²'
                                  ? activePill
                                  : pill
                              }
                            >
                              10,000–50,000m²
                            </button>

                            <button
                              onClick={() =>
                                setSelectedproperty_area(
                                  selectedproperty_area === '50,000m²+'
                                    ? ''
                                    : '50,000m²+'
                                )
                              }
                              style={
                                selectedproperty_area === '50,000m²+'
                                  ? activePill
                                  : pill
                              }
                            >
                              50,000m²+
                            </button>

                        </div>

                      </div>

{/* UTILITIES */}
                      <div>

                        <p style={miniHeading}>
                          Utilities
                        </p>

                        <div style={pillWrap}>

                          <button
                              onClick={() =>
                                setSelectedutility(
                                  selectedutility === 'Water'
                                    ? ''
                                    : 'Water'
                                )
                              }
                              style={
                                selectedutility === 'Water'
                                  ? activePill
                                  : pill
                              }
                            >
                              Water
                            </button>

                            <button
                              onClick={() =>
                                setSelectedutility(
                                  selectedutility === 'Electricity'
                                    ? ''
                                    : 'Electricity'
                                )
                              }
                              style={
                                selectedutility === 'Electricity'
                                  ? activePill
                                  : pill
                              }
                            >
                              Electricity
                            </button>

                            <button
                              onClick={() =>
                                setSelectedutility(
                                  selectedutility === 'Fiber Internet'
                                    ? ''
                                    : 'Fiber Internet'
                                )
                              }
                              style={
                                selectedutility === 'Fiber Internet'
                                  ? activePill
                                  : pill
                              }
                            >
                              Fiber Internet
                            </button>

                            <button
                              onClick={() =>
                                setSelectedutility(
                                  selectedutility === 'Septic'
                                    ? ''
                                    : 'Septic'
                                )
                              }
                              style={
                                selectedutility === 'Septic'
                                  ? activePill
                                  : pill
                              }
                            >
                              Septic
                            </button>

                            <button
                              onClick={() =>
                                setSelectedutility(
                                  selectedutility === 'Municipal Sewer'
                                    ? ''
                                    : 'Municipal Sewer'
                                )
                              }
                              style={
                                selectedutility === 'Municipal Sewer'
                                  ? activePill
                                  : pill
                              }
                            >
                              Municipal Sewer
                            </button>

                        </div>

                      </div>

                  
{/* ADVANCED FILTERS */}
                  <div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>

                      <h3 style={filterHeading}>
                        Advanced Filters
                      </h3>

                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setShowadvanced_filters(!showadvanced_filters)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#00ff99',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {showadvanced_filters ? 'Collapse' : 'Expand'}
                      </button>

                    </div>

                    {showadvanced_filters && (

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                      }}>

{/* LEGAL STATUS */}
                      <div>

                        <p style={miniHeading}>
                          Legal Status
                        </p>

                        <div style={pillWrap}>

                         <button
                              onClick={() =>
                                setSelectedlegal_status(
                                  selectedlegal_status === 'Titled Property'
                                    ? ''
                                    : 'Titled Property'
                                )
                              }
                              style={
                                selectedlegal_status === 'Titled Property'
                                  ? activePill
                                  : pill
                              }
                            >
                              Titled Property
                            </button>

                            <button
                              onClick={() =>
                                setSelectedlegal_status(
                                  selectedlegal_status === 'Survey Available'
                                    ? ''
                                    : 'Survey Available'
                                )
                              }
                              style={
                                selectedlegal_status === 'Survey Available'
                                  ? activePill
                                  : pill
                              }
                            >
                              Survey Available
                            </button>

                            <button
                              onClick={() =>
                                setSelectedlegal_status(
                                  selectedlegal_status === 'Concession Property'
                                    ? ''
                                    : 'Concession Property'
                                )
                              }
                              style={
                                selectedlegal_status === 'Concession Property'
                                  ? activePill
                                  : pill
                              }
                            >
                              Concession Property
                            </button>

                            <button
                              onClick={() =>
                                setSelectedlegal_status(
                                  selectedlegal_status === 'Financing Available'
                                    ? ''
                                    : 'Financing Available'
                                )
                              }
                              style={
                                selectedlegal_status === 'Financing Available'
                                  ? activePill
                                  : pill
                              }
                            >
                              Financing Available
                            </button>

                        </div>

                      </div>

{/* environment */}
                      <div>

                        <h3 style={filterHeading}>
                          environment
                        </h3>

                        <div style={pillWrap}>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Urban'
                                  ? ''
                                  : 'Urban'
                              )
                            }
                            style={
                              selectedenvironment === 'Urban'
                                ? activePill
                                : pill
                            }
                          >
                            Urban
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Riverfront'
                                  ? ''
                                  : 'Riverfront'
                              )
                            }
                            style={
                              selectedenvironment === 'Riverfront'
                                ? activePill
                                : pill
                            }
                          >
                            Riverfront
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Beachfront'
                                  ? ''
                                  : 'Beachfront'
                              )
                            }
                            style={
                              selectedenvironment === 'Beachfront'
                                ? activePill
                                : pill
                            }
                          >
                            Beachfront
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Mountain View'
                                  ? ''
                                  : 'Mountain View'
                              )
                            }
                            style={
                              selectedenvironment === 'Mountain View'
                                ? activePill
                                : pill
                            }
                          >
                            Mountain View
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Jungle'
                                  ? ''
                                  : 'Jungle'
                              )
                            }
                            style={
                              selectedenvironment === 'Jungle'
                                ? activePill
                                : pill
                            }
                          >
                            Jungle
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Rural'
                                  ? ''
                                  : 'Rural'
                              )
                            }
                            style={
                              selectedenvironment === 'Rural'
                                ? activePill
                                : pill
                            }
                          >
                            Rural
                          </button>

                          <button
                            onClick={() =>
                              setSelectedenvironment(
                                selectedenvironment === 'Lakefront'
                                  ? ''
                                  : 'Lakefront'
                              )
                            }
                            style={
                              selectedenvironment === 'Lakefront'
                                ? activePill
                                : pill
                            }
                          >
                            Lakefront
                          </button>

                        </div>

                      </div>

 {/* accessibility */}
                      <div>

                        <h3 style={filterHeading}>
                          accessibility
                        </h3>

                        <div style={pillWrap}>

                         <button
                            onClick={() =>
                              setSelectedaccessibility(
                                selectedaccessibility === '2WD Accessible'
                                  ? ''
                                  : '2WD Accessible'
                              )
                            }
                            style={
                              selectedaccessibility === '2WD Accessible'
                                ? activePill
                                : pill
                            }
                          >
                            2WD Accessible
                          </button>

                          <button
                            onClick={() =>
                              setSelectedaccessibility(
                                selectedaccessibility === 'Paved Road'
                                  ? ''
                                  : 'Paved Road'
                              )
                            }
                            style={
                              selectedaccessibility === 'Paved Road'
                                ? activePill
                                : pill
                            }
                          >
                            Paved Road
                          </button>

                          <button
                            onClick={() =>
                              setSelectedaccessibility(
                                selectedaccessibility === '4x4 Required'
                                  ? ''
                                  : '4x4 Required'
                              )
                            }
                            style={
                              selectedaccessibility === '4x4 Required'
                                ? activePill
                                : pill
                            }
                          >
                            4x4 Required
                          </button>

                          <button
                            onClick={() =>
                              setSelectedaccessibility(
                                selectedaccessibility === 'Walkable'
                                  ? ''
                                  : 'Walkable'
                              )
                            }
                            style={
                              selectedaccessibility === 'Walkable'
                                ? activePill
                                : pill
                            }
                          >
                            Walkable
                          </button>

                          <button
                            onClick={() =>
                              setSelectedaccessibility(
                                selectedaccessibility === 'Boat Access Only'
                                  ? ''
                                  : 'Boat Access Only'
                              )
                            }
                            style={
                              selectedaccessibility === 'Boat Access Only'
                                ? activePill
                                : pill
                            }
                          >
                            Boat Access Only
                          </button>

                        </div>

                      </div>
{/* Terrain */}
                      <div>

                        <p style={miniHeading}>
                          Terrain
                        </p>

                        <div style={pillWrap}>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Build Ready'
                                  ? ''
                                  : 'Build Ready'
                              )
                            }
                            style={
                              selectedterrain === 'Build Ready'
                                ? activePill
                                : pill
                            }
                          >
                            Build Ready
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Cleared Land'
                                  ? ''
                                  : 'Cleared Land'
                              )
                            }
                            style={
                              selectedterrain === 'Cleared Land'
                                ? activePill
                                : pill
                            }
                          >
                            Cleared Land
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Flat'
                                  ? ''
                                  : 'Flat'
                              )
                            }
                            style={
                              selectedterrain === 'Flat'
                                ? activePill
                                : pill
                            }
                          >
                            Flat
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Mostly Flat'
                                  ? ''
                                  : 'Mostly Flat'
                              )
                            }
                            style={
                              selectedterrain === 'Mostly Flat'
                                ? activePill
                                : pill
                            }
                          >
                            Mostly Flat
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Rolling Hills'
                                  ? ''
                                  : 'Rolling Hills'
                              )
                            }
                            style={
                              selectedterrain === 'Rolling Hills'
                                ? activePill
                                : pill
                            }
                          >
                            Rolling Hills
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Steep Slope'
                                  ? ''
                                  : 'Steep Slope'
                              )
                            }
                            style={
                              selectedterrain === 'Steep Slope'
                                ? activePill
                                : pill
                            }
                          >
                            Steep Slope
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Mountainous'
                                  ? ''
                                  : 'Mountainous'
                              )
                            }
                            style={
                              selectedterrain === 'Mountainous'
                                ? activePill
                                : pill
                            }
                          >
                            Mountainous
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Rocky'
                                  ? ''
                                  : 'Rocky'
                              )
                            }
                            style={
                              selectedterrain === 'Rocky'
                                ? activePill
                                : pill
                            }
                          >
                            Rocky
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Forested'
                                  ? ''
                                  : 'Forested'
                              )
                            }
                            style={
                              selectedterrain === 'Forested'
                                ? activePill
                                : pill
                            }
                          >
                            Forested
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'River Valley'
                                  ? ''
                                  : 'River Valley'
                              )
                            }
                            style={
                              selectedterrain === 'River Valley'
                                ? activePill
                                : pill
                            }
                          >
                            River Valley
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Jungle Terrain'
                                  ? ''
                                  : 'Jungle Terrain'
                              )
                            }
                            style={
                              selectedterrain === 'Jungle Terrain'
                                ? activePill
                                : pill
                            }
                          >
                            Jungle Terrain
                          </button>

                          <button
                            onClick={() =>
                              setSelectedterrain(
                                selectedterrain === 'Agricultural Terrain'
                                  ? ''
                                  : 'Agricultural Terrain'
                              )
                            }
                            style={
                              selectedterrain === 'Agricultural Terrain'
                                ? activePill
                                : pill
                            }
                          >
                            Agricultural Terrain
                          </button>

                        </div>

                      </div>


                    </div>

                  )}

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
                            No matching properties
                          </h2>

                          <p
                            style={{
                              color: '#777'
                            }}
                          >
                            Try adjusting your filters.
                          </p>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>

          </div>

        </div>

    </main>
  )
}

const overlayPrimaryButton = {
  width: '100%',
  background: '#00ff9950',
  color: '#fff',
  border: 'none',
  borderRadius: '999px',
  padding: '1.15rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all .25s ease'
}

const overlaySecondaryButton = {
  width: '100%',
  background: 'rgba(255,255,255,.06)',
  color: '#00ff99',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: '999px',
  padding: '1.15rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all .25s ease',
  backdropFilter: 'blur(12px)'
}

const overlayBackButton = {
  background: 'transparent',
  border: 'none',
  color: '#00ff99',
  cursor: 'pointer',
  marginBottom: '1rem',
  alignSelf: 'flex-start' as const,
  fontSize: '.95rem'
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

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  )
}

