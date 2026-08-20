'use client'

import { buildHomePageSchema }
from '@/lib/schema/buildHomePageSchema'
import JsonLd from '@/app/components/JsonLd'
import Link from 'next/link'
import TopBar from '@/app/components/TopBar'
import {
  Compass,
  BadgeDollarSign,
  CircleDot,
  HandHeart,
  Scale,
  ChartNoAxesColumnIncreasing,
  Ruler,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createListingId } from '@/lib/createListingId'
import { supabase } from '@/lib/supabase'
import {
  isFavorite,
  toggleFavorite
} from '@/lib/favorites'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import {
  provinces,
  districts,
  property_types,
  property_areas,
  utilities,
  environments,
  accessibilityOptions,
  terrainOptions,
  legal_statuses
} from '@/data/property-data'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

import {
  matchesPropertyAreaRange
} from '@/lib/marketplace-area-ranges'

function HomePageContent({
                ontologyTerms,
                ontologyRelationships,
                listings,
                homePageSchema
                }: {
                ontologyTerms: any[]
                ontologyRelationships: any[]
                listings: any[]
                homePageSchema: any[]
                }) {


  const [properties, setProperties] = useState(listings)

  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  const [selectedprovince, setSelectedprovince] = useState('')
  const [selectedcanton, setSelectedcanton] = useState('')
  const [selecteddistrict, setSelecteddistrict] = useState('')

  const [selectedprice, setSelectedprice] = useState('')
  const [selectedproperty_type, setSelectedproperty_type] = useState('')
  
  const [selectedproperty_area, setSelectedproperty_area] = useState('')
  const [selectedutility, setSelectedutility] = useState('')

  const [showMobileFilters, setShowMobileFilters] = useState(false)
 
  const [showPoster, setShowPoster] = useState(true)

const [showMainOverlay, setShowMainOverlay] =
  useState(false)

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

      console.log(
          'OVERLAY PARAM:',
          searchParams.get('overlay')
        )

        console.log(
          'INITIAL OVERLAY STATE:',
          initialOverlayState
        )

  const [overlayState, setOverlayState] =
  useState<'initial' | 'looking' | 'posting' | null>(
    initialOverlayState
  )

  const homepageBlurred =
  showPoster || showMainOverlay

        useEffect(() => {

                const normalizedListings =
                    listings.map(
                    (listing: any) => ({

                        ...listing,

                        id: createListingId(listing),

                        images:
                    resolveListingImages(
                      listing.images
                    )

                    })
                    )

                setProperties(
                    normalizedListings
                )

                setLoading(false)

                }, [listings])    
                          
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
                      selectedproperty_area &&
                      !matchesPropertyAreaRange(
                        property.property_area,
                        selectedproperty_area
                      )
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


  /* OVERLAY over OVERLAY */
        return (
  <>
    <JsonLd
      data={homePageSchema}
    />

    <main style={{        
              background: '#000',
              minHeight: '100vh',
              color: '#fff',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
            {/* OVERLAY */}

              {/*
              -----------------------------------
              POSTER
              -----------------------------------
              */}
                  <div
                    style={{
                      position:'fixed',
                      inset:0,
                      zIndex:9998,

                      backgroundImage:
                        'url(/images/twuanis-intro-es.png)',

                      backgroundSize:
                            isMobile
                              ? '22rem auto'
                              : '35rem auto',

                          backgroundPosition:'center center',
                          backgroundRepeat:'no-repeat',

                      opacity: showPoster ? 1 : .15,

                      filter:
                        showPoster
                          ? 'blur(0px)'
                          : 'blur(12px)',

                      transform:
                        showPoster
                          ? 'scale(1)'
                          : 'scale(1.03)',

                      transition:
                        'all .9s ease',

                      pointerEvents:
                        showPoster
                          ? 'auto'
                          : 'none'
                    }}
                  >

{/* MOBILE ES INTRO */}
      {showPoster && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: '#080808',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <TopBar />

          <main
            style={{
              width: '100%',
              maxWidth: 720,
              margin: '0 auto',
              padding: '24px 18px 42px',
              boxSizing: 'border-box',
            }}
          >
            {/* TWUANIS INTRO */}
            <section
              style={{
                textAlign: 'center',
                padding: '30px 12px 38px',
              }}
            >
              <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: 20,
                  }}
                >
                  {/* TWUANIS + MOBIUS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        color: '#ffffff',
                        fontFamily: 'var(--font-cinzel), serif',
                        fontSize: 'clamp(52px, 16vw, 82px)',
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        textShadow:
                          '1px 1px 0 #c99a32, -1px -1px 0 #c99a32, 0 2px 10px rgba(201,154,50,0.35)',
                      }}
                    >
                      Twuanis
                    </div>

                    <img
                      src="/images/twuanis-mobius.svg"
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        display: 'block',
                      }}
                    />
                  </div>

                  <div style={mobileDivider0}>
                    <span>◆</span>
                  </div>
                </div>

              <div
                style={{
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  textShadow:
                          '1px 1px 0 #c99a32, 1px 1px 0 #c99a32, 0 2px 10px rgba(201,154,50,0.35)',
                  letterSpacing: '0.11em',
                  lineHeight: 2,
                }}
              >
                INTELIGENCIA PARA DECISIONES DEL MERCADO INMOBILIARIO
              </div>

                <div style={mobileDivider}>
                    <span>◆</span>
                  </div>

            </section>

            {/* ENGINE EXAMPLES */}
            <section
              style={{
                border: '1px solid rgba(201, 154, 50, 0.45)',
                borderRadius: 24,
                padding: '8px 16px',
                background: '#101820',
              }}
            >
              {mobileEngineExamples.map(
                ({ id, title, Icon, color, question, answer }, index) => (
                  <article
                    key={id}
                    style={{
                      padding: '28px 0 30px',
                      borderBottom:
                        index < mobileEngineExamples.length - 1
                          ? '1px solid rgba(201, 154, 50, 0.35)'
                          : 'none',
                    }}
                  >
                    {/* CLICKABLE ENGINE CARD */}
                    <Link
                      href={`/es/inteligencia-de-mercado?tab=${id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        marginBottom: 18,
                        border: `2px solid ${color}`,
                        borderRadius: 18,
                        background: '#171717',
                        color,
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          flexShrink: 0,
                          border: `1px solid ${color}`,
                          borderRadius: 15,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={32} strokeWidth={1.35} />
                      </div>

                      <div
                        style={{
                          textAlign: 'left',
                          fontFamily: 'var(--font-cinzel), serif',
                          fontSize: 20,
                          lineHeight: 1.15,
                          color: '#ffffff',
                        }}
                      >
                        {title}
                      </div>
                    </Link>

                    {/* QUESTION */}
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: '#f4f4f4',
                        marginBottom: 12,
                      }}
                    >
                      <strong style={{ color }}>Pregunta Hipotética:</strong>{' '}
                      {question}
                    </div>

                    {/* ANSWER */}
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: '#dddddd',
                      }}
                    >
                      <strong style={{ color }}>Respuesta Potencial:</strong>{' '}
                      {answer}
                    </div>
                  </article>
                )
              )}
            </section>

            {/* CONTINUE */}
            <button
              type="button"
              onClick={() => {
                setShowPoster(false)
                setShowMainOverlay(true)
              }}
              style={{
                width: '100%',
                minHeight: 62,
                marginTop: 24,
                border: '1px solid #e0b65a',
                borderRadius: 999,
                background:
                  'linear-gradient(180deg, #efc76c 0%, #c99632 100%)',
                color: '#07111d',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              CONTINUAR →
            </button>
          </main>
        </div>
      )}

            </div>

            {showMainOverlay && overlayState && (

                        <div style={{
                          position: 'fixed',
                          inset: 0,
                          background: 'rgba(0,0,0,.12)',
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
                            background:'rgba(0,0,0,0)',
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

                      <div
                        style={{
                          width:'100%',
                          display:'flex',
                          justifyContent:'flex-end'
                        }}
                      >
                        <Link
                          href="/en"
                          style={{
                            background:'#000',
                            color:'#fff',
                            border:'2px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'.45rem .9rem',
                            fontSize:'.8rem',
                            fontWeight:'bold',
                            textDecoration:'none',
                            boxShadow:'0 4px 12px rgba(0,0,0,.15)'
                          }}
                        >
                          English
                        </Link>
                      </div>

                        <h2
                          style={{
                            fontSize:'3rem',
                            marginBottom:'.75rem',
                            textAlign:'center',
                            color:'#fff',
                            fontWeight:'700',
                            letterSpacing:'.05em',
                            textShadow:
                              '-1px -1px 0 #C9A86A, ' +
                              '1px -1px 0 #C9A86A, ' +
                              '-1px 1px 0 #C9A86A, ' +
                              '1px 1px 0 #C9A86A'
                          }}
                        >
                          Twuanis
                        </h2>

                        <p
                          style={{
                            color:'#C9A86A',
                            marginBottom:'2rem',
                            textAlign:'center',
                            lineHeight:1.7,
                            fontSize:'1.05rem',
                            fontWeight:'600'
                          }}
                        >
                          ¿Qué te gustaría hacer?
                        </p>

                        <button
                          onClick={() => setOverlayState('looking')}
                          style={{
                            width:'100%',
                            background:'#fff',
                            color:'#162A45',
                            border:'3px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'1.15rem 1.5rem',
                            fontSize:'1rem',
                            fontWeight:'bold',
                            cursor:'pointer',
                            boxShadow:'0 4px 16px rgba(0,0,0,.15)'
                          }}
                        >
                          Comprar, Alquilar o Arrendar
                        </button>

                        <button
                          onClick={() => setOverlayState('posting')}
                          style={{
                            width:'100%',
                            background:'#fff',
                            color:'#162A45',
                            border:'3px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'1.15rem 1.5rem',
                            fontSize:'1rem',
                            fontWeight:'bold',
                            cursor:'pointer',
                            boxShadow:'0 4px 16px rgba(0,0,0,.15)'
                          }}
                        >
                          Vender, Alquilar o Arrendar
                        </button>

                      </>

                    )}

{/* STATE 2 — LOOKING */}
                  {overlayState === 'looking' && (

                    <>

                    <div
                      style={{
                        width:'100%',
                        display:'flex',
                        justifyContent:'flex-end'
                      }}
                    >
                      <Link
                        href="/en"
                        style={{
                          background:'#000',
                          color:'#fff',
                          border:'2px solid #C9A86A',
                          borderRadius:'999px',
                          padding:'.45rem .9rem',
                          fontSize:'.8rem',
                          fontWeight:'bold',
                          textDecoration:'none',
                          boxShadow:'0 4px 12px rgba(0,0,0,.15)'
                        }}
                      >
                        English
                      </Link>
                    </div>

                      <button
                        onClick={() => setOverlayState('initial')}
                        style={{
                          background:'#fff',
                          color:'#162A45',
                          border:'3px solid #C9A86A',
                          borderRadius:'999px',
                          padding:'.75rem 1.25rem',
                          fontWeight:'bold',
                          cursor:'pointer',
                          alignSelf:'flex-start'
                        }}
                      >
                        ← Volver
                      </button>

                      <h2
                        style={{
                          fontSize:'2.2rem',
                          marginBottom:'1.5rem',
                          color:'#C9A86A'
                        }}
                      >
                        ¿Qué estás buscando?
                      </h2>

                      <button
                        onClick={() =>
                          window.location.href = '/es/comprar'
                        }
                        style={{
                          width:'100%',
                          background:'#fff',
                          color:'#162A45',
                          border:'3px solid #C9A86A',
                          borderRadius:'999px',
                          padding:'1.15rem 1.5rem',
                          fontSize:'1rem',
                          fontWeight:'bold',
                          cursor:'pointer'
                        }}
                      >
                        Comprar
                      </button>

                      <button
                        onClick={() =>
                          window.location.href =
                            '/es/alquilar-arrendar'
                        }
                        style={{
                          width:'100%',
                          background:'#fff',
                          color:'#162A45',
                          border:'3px solid #C9A86A',
                          borderRadius:'999px',
                          padding:'1.15rem 1.5rem',
                          fontSize:'1rem',
                          fontWeight:'bold',
                          cursor:'pointer'
                        }}
                      >
                        Alquilar / Arrendar
                      </button>

                    </>

                  )}

{/* STATE 1 (was state 2) — POSTING */}
                    {overlayState === 'posting' && (

                      <>

                      <div
                        style={{
                          width:'100%',
                          display:'flex',
                          justifyContent:'flex-end'
                        }}
                      >
                        <Link
                          href="/en"
                          style={{
                            background:'#000',
                            color:'#fff',
                            border:'2px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'.45rem .9rem',
                            fontSize:'.8rem',
                            fontWeight:'bold',
                            textDecoration:'none',
                            boxShadow:'0 4px 12px rgba(0,0,0,.15)'
                          }}
                        >
                          English
                        </Link>
                      </div>

                        <button
                          onClick={() => setOverlayState('initial')}
                          style={{
                            background:'#fff',
                            color:'#162A45',
                            border:'3px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'.75rem 1.25rem',
                            fontWeight:'bold',
                            cursor:'pointer',
                            alignSelf:'flex-start'
                          }}
                        >
                          ← Volver
                        </button>

                        <h2
                          style={{
                            fontSize:'2.2rem',
                            marginBottom:'1.5rem',
                            color:'#C9A86A'
                          }}
                        >
                          ¿Publicando una propiedad?
                        </h2>

                        <button
                          onClick={() =>
                            window.location.href =
                              '/es/vender'
                          }
                          style={{
                            width:'100%',
                            background:'#fff',
                            color:'#162A45',
                            border:'3px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'1.15rem 1.5rem',
                            fontSize:'1rem',
                            fontWeight:'bold',
                            cursor:'pointer'
                          }}
                        >
                          Vender
                        </button>

                        <button
                          onClick={() =>
                            window.location.href =
                              '/es/publicar-alquiler-arrendamiento'
                          }
                          style={{
                            width:'100%',
                            background:'#fff',
                            color:'#162A45',
                            border:'3px solid #C9A86A',
                            borderRadius:'999px',
                            padding:'1.15rem 1.5rem',
                            fontSize:'1rem',
                            fontWeight:'bold',
                            cursor:'pointer'
                          }}
                        >
                          Poner en Alquiler o Arrendamiento
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

               
               </div>

              </div>


{/* RIGHT */}
            

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
              background: '#11111100',
              borderRadius: '28px',
              overflow: 'hidden',
              textDecoration: 'none',
              color: '#ffffff00',
              border: '1px solid #',
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              minHeight: '620px'
            }}
          >

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
                  Ubicación
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
                        ← provincias
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
                        ← cantones
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
                      Precio
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
                    Tipo de Propiedad
                  </h3>

                  <div style={pillWrap}>

                    {property_types.map((propertyType) => (

                      <button
                        key={propertyType.en}
                        onClick={() =>
                          setSelectedproperty_type(
                            selectedproperty_type === propertyType.en
                              ? ''
                              : propertyType.en
                          )
                        }
                        style={
                          selectedproperty_type === propertyType.en
                            ? activePill
                            : pill
                        }
                      >
                        {propertyType.es}
                      </button>

                    ))}

                  </div>

                </div>


{/* PROPERTY AREA */}
              <div>

                <p style={miniHeading}>
                  Área de la Propiedad
                </p>

                <div style={pillWrap}>

                  {property_areas.map((area) => (

                    <button
                      key={area.en}
                      onClick={() =>
                        setSelectedproperty_area(
                          selectedproperty_area === area.en
                            ? ''
                            : area.en
                        )
                      }
                      style={
                        selectedproperty_area === area.en
                          ? activePill
                          : pill
                      }
                    >
                      {area.es}
                    </button>

                  ))}

                </div>

              </div>

{/* UTILITIES */}
            <div>

              <p style={miniHeading}>
                Servicios
              </p>

              <div style={pillWrap}>

                {utilities.map((utility) => (

                  <button
                    key={utility.en}
                    onClick={() =>
                      setSelectedutility(
                        selectedutility === utility.en
                          ? ''
                          : utility.en
                      )
                    }
                    style={
                      selectedutility === utility.en
                        ? activePill
                        : pill
                    }
                  >
                    {utility.es}
                  </button>

                ))}

              </div>

            </div>

                  

{/* LEGAL STATUS */}
                <div>

                  <p style={miniHeading}>
                    Estado Legal
                  </p>

                  <div style={pillWrap}>

                    {legal_statuses.map((status) => (

                      <button
                        key={status.en}
                        onClick={() =>
                          setSelectedlegal_status(
                            selectedlegal_status === status.en
                              ? ''
                              : status.en
                          )
                        }
                        style={
                          selectedlegal_status === status.en
                            ? activePill
                            : pill
                        }
                      >
                        {status.es}
                      </button>

                    ))}

                  </div>

                </div>

{/* ENVIRONMENT */}
                <div>

                  <h3 style={filterHeading}>
                    Entorno
                  </h3>

                  <div style={pillWrap}>

                    {environments.map((environment) => (

                      <button
                        key={environment.en}
                        onClick={() =>
                          setSelectedenvironment(
                            selectedenvironment === environment.en
                              ? ''
                              : environment.en
                          )
                        }
                        style={
                          selectedenvironment === environment.en
                            ? activePill
                            : pill
                        }
                      >
                        {environment.es}
                      </button>

                    ))}

                  </div>

                </div>

{/* ACCESSIBILITY */}
                <div>

                  <h3 style={filterHeading}>
                    Accesibilidad
                  </h3>

                  <div style={pillWrap}>

                    {accessibilityOptions.map((accessibility) => (

                      <button
                        key={accessibility.en}
                        onClick={() =>
                          setSelectedaccessibility(
                            selectedaccessibility === accessibility.en
                              ? ''
                              : accessibility.en
                          )
                        }
                        style={
                          selectedaccessibility === accessibility.en
                            ? activePill
                            : pill
                        }
                      >
                        {accessibility.es}
                      </button>

                    ))}

                  </div>

                </div>

{/* TERRAIN */}
                <div>

                  <p style={miniHeading}>
                    Terreno
                  </p>

                  <div style={pillWrap}>

                    {terrainOptions.map((terrain) => (

                      <button
                        key={terrain.en}
                        onClick={() =>
                          setSelectedterrain(
                            selectedterrain === terrain.en
                              ? ''
                              : terrain.en
                          )
                        }
                        style={
                          selectedterrain === terrain.en
                            ? activePill
                            : pill
                        }
                      >
                        {terrain.es}
                      </button>

                    ))}

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
                          href={`/es/comprar/listing/${property.id}`}
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
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()

                      toggleFavorite(
                        property.id
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
                      border:
                        '1px solid rgba(255,255,255,.15)',
                      background:
                        'rgba(0,0,0,.55)',
                      backdropFilter:
                        'blur(8px)',
                      display: 'flex',
                      justifyContent:
                        'center',
                      alignItems:
                        'center',
                      cursor: 'pointer',
                      zIndex: 20
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.25rem',
                        color: isFavorite(
                          property.id
                        )
                          ? '#D4AF37'
                          : '#fff',
                        transition:
                          'all .2s ease'
                      }}
                    >
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

                    </div>

                  </div>

                </div>

              </div>

          </div>

        </div>

        </main>
    </>
  )
}

const overlayPrimaryButton = {
  width: '100%',
  background: '#FFFFFF50',
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
  color: '#FFFFFF',
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
  color: '#FFFFFF',
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
  border: '.0625rem solid #222',
  color: '#fff',
  padding: '.75rem 1rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '.875rem'
}

const sellButton = {
  background: '#FFFFFF',
  color: '#000',
  textDecoration: 'none',
  padding: '.75rem 1.125rem',
  borderRadius: '.875rem',
  fontWeight: 'bold',
  fontSize: '.875rem'
}

        type HomePageClientProps = {
                    ontologyTerms: any[]
                    ontologyRelationships: any[]
                    listings: any[]
                    homePageSchema: any[]
                    }

const mobileEngineExamples = [
  {
    id: 'explorer',
    title: 'MOTOR DE EXPLORACIÓN DE MERCADO',
    Icon: Compass,
    color: '#3ddc84',
    question:
      '¿Cómo se ve el mercado de condominios con 100–180 m² de construcción, vista a la montaña y un rango de año de construcción de 2015 o más reciente en Escazú, San José?',
    answer:
      'Con base en los 463 listados actuales en la provincia de San José, 187 listados en el cantón de Escazú y 74 listados en el distrito de San Rafael, el inventario actual de condominios se concentra entre 120–165 m² de construcción. Las propiedades con vista a la montaña forman un segmento más pequeño del mercado, mientras que las propiedades construidas desde 2015 se concentran de manera desproporcionada hacia el extremo superior del rango de área de construcción.',
  },
  {
    id: 'valuation',
    title: 'MOTOR DE VALORACIÓN',
    Icon: BadgeDollarSign,
    color: '#1687ff',
    question:
      '¿Cuánto vale una casa en San José con 1.000 m² de área de propiedad, 124 m² de construcción, 4 dormitorios, 3 baños, 2 espacios de estacionamiento, vista a la montaña y acceso por calle pavimentada?',
    answer:
      'Con base en los 512 listados actuales en la provincia de San José, 146 listados en el cantón de Santa Ana y 61 listados en el distrito de Santa Ana, las propiedades comparables indican un valor de mercado de aproximadamente ₡148–₡162 millones. Los 1.000 m² de área de propiedad y el acceso por calle pavimentada ejercen presión al alza sobre el valor, mientras que la cobertura del terreno relativamente baja de 12,4% y los 124 m² de construcción distinguen la propiedad de comparables con un mayor nivel de construcción.',
  },
  {
    id: 'pricing',
    title: 'MOTOR DE ESTRATEGIA DE PRECIOS',
    Icon: CircleDot,
    color: '#1687ff',
    question:
      '¿A qué precio debería publicar una casa en Heredia con 450 m² de área de propiedad, 210 m² de construcción, vista a la montaña, acceso por calle pavimentada, servicio de agua pública y un rango de año de construcción de 2015 o más reciente?',
    answer:
      'Con base en los 387 listados actuales en la provincia de Heredia, 121 listados en el cantón de Heredia y 48 listados en el distrito de San Francisco, un precio de publicación de ₡185 millones posicionaría la propiedad por encima de la mayoría del inventario comparable. Un precio cercano a ₡169 millones la colocaría dentro del rango competitivo de publicación, mientras que sus 210 m² de construcción, vista a la montaña, acceso por calle pavimentada y construcción más reciente mantienen su diferenciación frente al inventario de menor precio.',
  },
  {
    id: 'scarcity',
    title: 'MOTOR DE FRECUENCIA DE MERCADO',
    Icon: ChartNoAxesColumnIncreasing,
    color: '#ff3b00',
    question:
      '¿Qué tan comunes son las casas en Guanacaste con al menos 1.500 m² de área de propiedad, 250+ m² de construcción, entorno frente a un río, electricidad, agua pública, acceso por calle pavimentada y condición legal titulada?',
    answer:
      'Con base en los 624 listados actuales en la provincia de Guanacaste, 138 listados en el cantón de Santa Cruz y 52 listados en el distrito de Tamarindo, solo el 4,8% de los listados comparables contiene esa combinación completa de atributos. Un área de propiedad grande y el acceso a servicios aparecen de manera independiente con una frecuencia razonable, pero combinar 250+ m² de construcción, entorno frente a un río, acceso por calle pavimentada y condición legal titulada hace que el perfil completo de la propiedad sea escaso.',
  },
  {
    id: 'price-meter',
    title: 'MOTOR DE INTELIGENCIA DE PRECIO / M²',
    Icon: Ruler,
    color: '#ffd500',
    question:
      '¿Es caro pagar ₡365 millones por una propiedad mejorada en Escazú con 600 m² de terreno, 250 m² de construcción, 41,7% de cobertura del terreno, vista a la montaña, acceso por calle pavimentada y un rango de año de construcción de 2015 o más reciente?',
    answer:
      'Con base en los 463 listados actuales en la provincia de San José, 187 listados en el cantón de Escazú y 74 listados en el distrito de San Rafael, las propiedades mejoradas comparables tienen un precio mediano normalizado por construcción de ₡1,21 millones/m². A ₡1,46 millones/m², esta propiedad se encuentra aproximadamente un 21% por encima del centro del mercado y pertenece al grupo de propiedades caras. Su vista a la montaña, acceso por calle pavimentada, construcción más reciente y cobertura del terreno de 41,7% pueden evaluarse frente a grupos comparables para determinar qué atributos parecen estar asociados con esa prima.',
  },
]

export default function HomePageClient(
                    props: HomePageClientProps
                    ) {

  return (

    <Suspense fallback={null}>

      <HomePageContent
  {...props}
/>

    </Suspense>

  )

}

const mobileDivider: React.CSSProperties = {
  width: '72%',
  margin: '22px auto',
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(201,154,50,.8), transparent)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#c99a32',
  fontSize: 10,
}

const mobileDivider0: React.CSSProperties = {
  width: '72%',
  margin: '22px auto',
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(255, 59, 0, 0.8), transparent)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ff3b00',
  fontSize: 10,
}

const mobileDivider1: React.CSSProperties = {
  width: '72%',
  margin: '22px auto',
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(252, 252, 252, 252), transparent)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: 10,
}

const mobileHeroStatement: React.CSSProperties = {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  lineHeight: 1.45,
}