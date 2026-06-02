'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'


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

    const existingrent_lease_favorites =
      JSON.parse(
        localStorage.getItem('rent_lease_favorites') || '[]'
      )

    if (!existingrent_lease_favorites.includes(propertyId)) {

      localStorage.setItem(
        'rent_lease_favorites',
        JSON.stringify([
          ...existingrent_lease_favorites,
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
      padding: '2rem'
    }}>

      {/* TOP NAV */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        zIndex: 20,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>

        <a
          href="/"
          style={navButton}
        >
          Salir del Modo Deslizar
        </a>

        <a
          href="/rent_lease_favorites"
          style={{
            ...navButton,
            color: '#FFFFFF'
          }}
        >
          Propiedades Favoritas ♥
        </a>

      </div>

      {/* FILTER BAR */}
      <div style={{
        position: 'absolute',
        top: '6rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: '.75rem',
        flexWrap: 'wrap',
        zIndex: 20,
        padding: '0 1rem'
      }}>

        <select
          value={selectedProvince}
          onChange={(e) => {
            setSelectedProvince(e.target.value)
            setCurrentIndex(0)
          }}
          style={filterSelect}
        >
          <option value="">
            Todas las Provincias
          </option>

          {[...new Set(
            properties.map((p) => p.province)
          )].map((province) => (

            <option
              key={province}
              value={province}
            >
              {province}
            </option>

          ))}

        </select>

        <select
          value={selectedCanton}
          onChange={(e) => {
            setSelectedCanton(e.target.value)
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
          )].map((canton) => (

            <option
              key={canton}
              value={canton}
            >
              {canton}
            </option>

          ))}

        </select>

        <select
          value={selectedPropertyType}
          onChange={(e) => {
            setSelectedPropertyType(e.target.value)
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
          )].map((type) => (

            <option
              key={type}
              value={type}
            >
              {type}
            </option>

          ))}

        </select>

        <select
          value={selectedEnvironment}
          onChange={(e) => {
            setSelectedEnvironment(e.target.value)
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
          )].map((environment) => (

            <option
              key={environment}
              value={environment}
            >
              {environment}
            </option>

          ))}

        </select>

        <select
          value={selectedPriceRange}
          onChange={(e) => {
            setSelectedPriceRange(e.target.value)
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
      padding: '2rem'
    }}>

      {/* TOP NAV */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        zIndex: 20,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>

        <a
          href="/"
          style={navButton}
        >
          Salir del Modo Deslizar
        </a>

        <a
          href="/rent_lease_favorites"
          style={{
            ...navButton,
            color: '#FFFFFF'
          }}
        >
          Propiedades Favoritas <span style={{ color: '#D4AF37' }}>♥</span>
        </a>

      </div>

      {/* FILTER BAR */}
      <div style={{
        position: 'absolute',
        top: '6rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: '.75rem',
        flexWrap: 'wrap',
        zIndex: 20,
        padding: '0 1rem'
      }}>

        <select
          value={selectedProvince}
          onChange={(e) => {
            setSelectedProvince(e.target.value)
            setCurrentIndex(0)
          }}
          style={filterSelect}
        >
          <option value="">
            Todas las Provincias
          </option>

          {[...new Set(
            properties.map((p) => p.province)
          )].map((province) => (

            <option
              key={province}
              value={province}
            >
              {province}
            </option>

          ))}

        </select>

        <select
          value={selectedCanton}
          onChange={(e) => {
            setSelectedCanton(e.target.value)
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
          )].map((canton) => (

            <option
              key={canton}
              value={canton}
            >
              {canton}
            </option>

          ))}

        </select>

        <select
          value={selectedPropertyType}
          onChange={(e) => {
            setSelectedPropertyType(e.target.value)
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
          )].map((type) => (

            <option
              key={type}
              value={type}
            >
              {type}
            </option>

          ))}

        </select>

        <select
          value={selectedEnvironment}
          onChange={(e) => {
            setSelectedEnvironment(e.target.value)
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
          )].map((environment) => (

            <option
              key={environment}
              value={environment}
            >
              {environment}
            </option>

          ))}

        </select>

        <select
          value={selectedPriceRange}
          onChange={(e) => {
            setSelectedPriceRange(e.target.value)
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

        {/* GUARDAR */}
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

        {/* NO */}
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
            fontSize: '1.8rem',
            marginBottom: '.75rem'
          }}>
            {currentProperty.title}
          </h1>

          <p style={{
            color: '#999',
            marginBottom: '1rem'
          }}>
            {currentProperty.district},
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
              Reject
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
  background: '#181818',
  border: '1px solid #2a2a2a',
  color: '#fff',
  padding: '.9rem 1.25rem',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 'bold'
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