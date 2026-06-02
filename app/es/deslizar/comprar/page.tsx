'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

import TopBar from '@/app/components/TopBarES'

export default function SwipePage() {

  const [properties, setProperties] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCanton, setSelectedCanton] = useState('')
  const [selectedPropertyType, setSelectedPropertyType] = useState('')
  const [selectedEnvironment, setSelectedEnvironment] = useState('')
  const [selectedPriceRange, setSelectedPriceRange] = useState('')

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)

  useEffect(() => {
    fetchProperties()
        }, [])

        async function fetchProperties() {


  const { data, error } = await supabase
            .from('listings')
            .select('*')

          if (error) {

            console.error(
              JSON.stringify(error, null, 2)
            )

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

            setProperties([
            ...normalizedSupabaseListings
            ])
        }

  function saveProperty(propertyId: string) {

    const existingbuy_favorites =
      JSON.parse(
        localStorage.getItem('buy_favorites') || '[]'
      )

    if (!existingbuy_favorites.includes(propertyId)) {

      localStorage.setItem(
        'buy_favorites',
        JSON.stringify([
          ...existingbuy_favorites,
          propertyId
        ])
      )

    }

  }

  const filteredProperties = useMemo(() => {

    return properties.filter((property) => {

      const matchesProvince =
        !selectedProvince ||
        property.province === selectedProvince

      const matchesCanton =
        !selectedCanton ||
        property.canton === selectedCanton

      const matchesPropertyType =
        !selectedPropertyType ||
        property.property_type === selectedPropertyType

      const matchesEnvironment =
        !selectedEnvironment ||
        property.environment === selectedEnvironment

      const matchesPrice = (() => {

        if (!selectedPriceRange) return true

        const price =
          Number(property.price_millions)

        if (selectedPriceRange === 'under-50') {
          return price < 50
        }

        if (selectedPriceRange === '50-100') {
          return price >= 50 && price <= 100
        }

        if (selectedPriceRange === '100-plus') {
          return price > 100
        }

        return true

      })()

      return (
        matchesProvince &&
        matchesCanton &&
        matchesPropertyType &&
        matchesEnvironment &&
        matchesPrice
      )

    })

  }, [
    properties,
    selectedProvince,
    selectedCanton,
    selectedPropertyType,
    selectedEnvironment,
    selectedPriceRange
  ])

  async function completeSwipe(
    direction: 'left' | 'right'
  ) {

    const currentProperty =
      filteredProperties[currentIndex]

    if (!currentProperty) return

    if (direction === 'right') {
      saveProperty(currentProperty.id)
    }

    setDragX(direction === 'right' ? 1000 : -1000)

    setTimeout(() => {

      setCurrentIndex((prev) => prev + 1)
      setDragX(0)

    }, 220)

  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>
  ) {

    setIsDragging(true)
    setStartX(e.clientX)

  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>
  ) {

    if (!isDragging) return

    setDragX(e.clientX - startX)

  }

  function handlePointerUp() {

    setIsDragging(false)

    if (dragX > 80) {

      completeSwipe('right')

    } else if (dragX < -80) {

      completeSwipe('left')

    } else {

      setDragX(0)

    }

  }

  const currentProperty =
    filteredProperties[currentIndex]

  const nextProperty =
    filteredProperties[currentIndex + 1]

  const rotation = dragX / 20

  const [showMobileFilters, setShowMobileFilters] =
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

          const topNav = (
            <div
              style={{
                position: 'fixed',
                top: '1.25rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3000
              }}
            >
                        <TopBar
                          onFilterClick={() =>
                            setShowMobileFilters(true)
                          }
                        />
            </div>
          )

const filterSidebar = (
  <div
    style={{
      position: 'fixed',

      top: 0,

      left:
        showMobileFilters
          ? '0'
          : '-100%',

      width: isMobile
        ? '85vw'
        : '320px',

      height: '100vh',

      background: '#000000ee',

      backdropFilter: 'blur(14px)',

      borderRight: '1px solid #222',

      padding: '25px',

      display: 'flex',
      flexDirection: 'column',

      gap: '1.25rem',

      overflowY: 'auto',

      zIndex: 4000,

      transition: 'left .3s ease'
    }}
  >

    <button
      onClick={() =>
        setShowMobileFilters(false)
      }
      style={{
        background: '#FFFFFF80',
        border: '1px solid #333',
        color: '#fff',

        fontSize: '18px',

        padding: '12px',

        borderRadius: '12px',

        marginBottom: '10px',

        cursor: 'pointer'
      }}
    >
      Cerrar Filtros
    </button>

    <select
      value={selectedProvince}
      onChange={(e) => {

        setSelectedProvince(
          e.target.value
        )

        setCurrentIndex(0)

      }}
      style={filterSelect}
    >
      <option value="">
        Todas las Provincias
      </option>

      {[...new Set(
        properties.map(
          (p) => p.province
        )
      )]
      .filter(Boolean)
      .map((province, index) => (

        <option
          key={`${province}-${index}`}
          value={province}
        >
          {province}
        </option>

      ))}

    </select>

    <select
      value={selectedCanton}
      onChange={(e) => {

        setSelectedCanton(
          e.target.value
        )

        setCurrentIndex(0)

      }}
      style={filterSelect}
    >
      <option value="">
        Todos los Cantones
      </option>

      {[...new Set(
        properties
          .filter((p) =>
            !selectedProvince ||
            p.province === selectedProvince
          )
          .map((p) => p.canton)
      )]
      .filter(Boolean)
      .map((canton, index) => (

        <option
          key={`${canton}-${index}`}
          value={canton}
        >
          {canton}
        </option>

      ))}

    </select>

    <select
      value={selectedPropertyType}
      onChange={(e) => {

        setSelectedPropertyType(
          e.target.value
        )

        setCurrentIndex(0)

      }}
      style={filterSelect}
    >
      <option value="">
        Todos los Tipos de Propiedad
      </option>

      {[...new Set(
        properties.map(
          (p) => p.property_type
        )
      )]
      .filter(Boolean)
      .map((type, index) => (

        <option
          key={`${type}-${index}`}
          value={type}
        >
          {type}
        </option>

      ))}

    </select>

    <select
      value={selectedEnvironment}
      onChange={(e) => {

        setSelectedEnvironment(
          e.target.value
        )

        setCurrentIndex(0)

      }}
      style={filterSelect}
    >
      <option value="">
        Todos los Entornos
      </option>

      {[...new Set(
        properties.map(
          (p) => p.environment
        )
      )]
      .filter(Boolean)
      .map((environment, index) => (

        <option
          key={`${environment}-${index}`}
          value={environment}
        >
          {environment}
        </option>

      ))}

    </select>

    <select
      value={selectedPriceRange}
      onChange={(e) => {

        setSelectedPriceRange(
          e.target.value
        )

        setCurrentIndex(0)

      }}
      style={filterSelect}
    >
      <option value="">
        Todos los Precios
      </option>

      <option value="under-50">
        Menos de ₡50M
      </option>

      <option value="50-100">
        ₡50M – ₡100M
      </option>

      <option value="100-plus">
        ₡100M+
      </option>

    </select>

  </div>
)

// END
if (!currentProperty) {

  return (

    <main style={{
      background: '#000',
      minHeight: '100vh',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '6rem 2rem 8rem'
    }}>

      {topNav}

      {filterSidebar}

      {/* EMPTY STATE */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center',
        maxWidth: '40rem'
      }}>

        <h1 style={{
          fontSize: '3rem',
          margin: 0
        }}>
          No Hay Más Propiedades
        </h1>

        <p style={{
          color: '#888',
          fontSize: '1.2rem',
          lineHeight: '1.7'
        }}>
          Quita filtros para ver más resultados.
        </p>

        <button
          onClick={() => {

            setSelectedProvince('')
            setSelectedCanton('')
            setSelectedPropertyType('')
            setSelectedEnvironment('')
            setSelectedPriceRange('')
            setCurrentIndex(0)

          }}
          style={{
            background: '#FFFFFF',
            color: '#000',
            border: 'none',
            borderRadius: '999px',
            padding: '1rem 1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Limpiar Filtros
        </button>

      </div>

    </main>

  )

}

return (

  <main style={{
    background: '#000',
    minHeight: '100vh',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0rem 2rem 8rem'
  }}>

    {topNav}

    {filterSidebar}

    {/* NEXT CARD */}
      {nextProperty && (

        <div style={{
          position: 'absolute',
          width: '100%',
          maxWidth: '420px',
          background: '#1a1a1a',
          borderRadius: '2rem',
          overflow: 'hidden',
          transform: 'scale(.95) translateY(12px)',
          opacity: .55,
          zIndex: 1
        }}>

          <div style={{
            height: '340px',
            background: '#111'
          }} />

        </div>

      )}

      {/* ACTIVE CARD */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          marginTop: '8rem',
          zIndex: 2,
          width: '100%',
          maxWidth: '420px',
          background: '#111',
          borderRadius: '2rem',
          overflow: 'hidden',
          color: '#fff',
          boxShadow: '0 0 50px rgba(0,0,0,.55)',
          transform:
            `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition:
            isDragging
              ? 'none'
              : 'transform .22s ease',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >

        {/* SAVE */}
        {dragX > 40 && (

          <div style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            color: '#FFFFFF',
            fontSize: '2rem',
            fontWeight: 'bold',
            zIndex: 5
          }}>
            GUARDAR
          </div>

        )}

        {/* NOPE */}
        {dragX < -40 && (

          <div style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            color: '#ff4444',
            fontSize: '2rem',
            fontWeight: 'bold',
            zIndex: 5
          }}>
            NO
          </div>

        )}

        {/* IMAGE */}
        <div style={{
          height: '340px',
          background: '#111'
        }}>

          {currentProperty.images?.[0] ? (

            <img
              src={currentProperty.images[0]}
              alt={currentProperty.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

          ) : (

            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#555'
            }}>
              Sin Imagen
            </div>

          )}

        </div>

        {/* CONTENT */}
        <div style={{
          padding: '1.75rem'
        }}>

          <h1 style={{
            fontSize: '1.2rem',
            marginBottom: '.75rem'
          }}>
            {currentProperty.title}
          </h1>

          <p style={{
            color: '#999',
            marginBottom: '2rem'
          }}>
            {currentProperty.district}
            {' '}
            {currentProperty.canton}
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '.5rem',
            marginBottom: '1.25rem'
          }}>

            <div style={metaPill}>
              {currentProperty.property_type}
            </div>

            <div style={metaPill}>
              {currentProperty.environment}
            </div>

          </div>

          <div style={{
            color: '#FFFFFF',
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '2rem'
          }}>
           {currentProperty.price
              ? currentProperty.price
              : currentProperty.price_millions
              ? `₡${Number(
                  currentProperty.price_millions
                ).toLocaleString()}M`
              : 'Precio No Disponible'}
          </div>

          {/* BUTTONS */}
          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>

            <button
              onClick={() => completeSwipe('left')}
              style={rejectButton}
            >
              Rechazar
            </button>

            <button
              onClick={() => completeSwipe('right')}
              style={saveButton}
            >
              Guardar
            </button>

          </div>

        </div>

      </div>

    </main>

  )

}

const navButton = {
  background: '#18181899',
  border: '1px solid #2a2a2a',
  color: '#fff',
  padding: '.5rem .5rem',
  borderRadius: '999px',
  textDecoration: 'none',
  
}

const filterSelect = {
  background: '#111',
  border: '1px solid #222',
  color: '#fff',
  borderRadius: '999px',
  padding: '.85rem 1rem'
}

const metaPill = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.5rem .85rem',
  color: '#aaa',
  fontSize: '.85rem'
}

const rejectButton = {
  flex: 1,
  background: '#ff4444',
  border: 'none',
  color: '#fff',
  padding: '1rem',
  borderRadius: '999px',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const saveButton = {
  flex: 1,
  background: '#FFFFFF',
  border: 'none',
  color: '#000',
  padding: '1rem',
  borderRadius: '999px',
  fontWeight: 'bold',
  cursor: 'pointer'
}