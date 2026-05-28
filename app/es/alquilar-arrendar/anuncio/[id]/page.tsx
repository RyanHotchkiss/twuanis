'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'
import { createListingId } from '@/lib/createListingId'

import rawListings from '@/data/encuentra24-rent-lease-listings.json'

export default function ListingPage() {

  const params = useParams()

  const [listing, setListing] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function fetchListing() {

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

      // SEARCH SUPABASE FIRST
      const { data, error } = await supabase
        .from('rent_lease_listings')
        .select('*')
        .eq('id', String(params.id))
        .single()

      // IF SUPABASE FOUND MATCH
      if (data) {

        setListing({

          ...data,

          images:
            Array.isArray(data.images)
              ? data.images
              : typeof data.images === 'string'
              ? data.images.split('|')
              : []

        })

        setLoading(false)

        return

      }

      // FALLBACK TO JSON
      const jsonListing = normalizedJsonListings.find(
        (listing: any) =>
          listing.id === String(params.id)
      )

      if (jsonListing) {

        setListing(jsonListing)

      } else {

        console.error('Propiedad No Encontrada')

      }

      setLoading(false)

    }

    if (params.id) {
      fetchListing()
    }

  }, [params.id])

  if (loading) {

    return (

      <main style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '2rem'
      }}>

        Cargando Propiedad...

      </main>

    )

  }

  if (!listing) {

    return (

      <main style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '2rem'
      }}>

        Propiedad No Encontrada

      </main>

    )

  }

  return (

    <main style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      padding: '2rem'
    }}>

      {/* TOP BAR */}
      <div style={{
        marginBottom: '2rem'
      }}>

        <Link
          href="/es/alquilar-arrendar"
          style={{
            color: '#00ff99',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ← Volver al Marketplace
        </Link>

      </div>

      {/* MAIN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr .8fr',
        gap: '2rem'
      }}>

        {/* LEFT */}
        <div>

          {/* MAIN IMAGE */}
          <div style={{
            borderRadius: '1.5rem',
            overflow: 'hidden',
            marginBottom: '1rem',
            background: '#111'
          }}>

            {listing.images?.[0] ? (

              <img
                src={listing.images[0]}
                alt={listing.title}
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

            ) : (

              <div style={{
                height: '34rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#555'
              }}>
                Sin Imagen
              </div>

            )}

          </div>
                    <button
                    onClick={(e) => {

                        e.preventDefault()
                        e.stopPropagation()

                        const existingFavorites =
                        JSON.parse(
                            localStorage.getItem('rent_lease_favorites') || '[]'
                        )

                        const alreadySaved =
                        existingFavorites.includes(listing.id)

                        let updatedFavorites: string[] = []

                        if (alreadySaved) {

                        updatedFavorites =
                            existingFavorites.filter(
                            (id: string) => id !== listing.id
                            )

                        } else {

                        updatedFavorites = [
                            ...existingFavorites,
                            listing.id
                        ]

                        }

                        localStorage.setItem(
                            'rent_lease_favorites',
                        JSON.stringify(updatedFavorites)
                        )

                    }}
                    style={{
                        marginTop: '1rem',
                        width: '100%',
                        background: '#111',
                        border: '1px solid #333',
                        color: '#00ff99',
                        borderRadius: '999px',
                        marginBottom: '1rem',
                        padding: '.85rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                    >
                    Save To Favorites
                    </button>
          {/* IMAGE GRID */}
          {listing.images?.length > 1 && (

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>

              {listing.images.slice(1).map((image: string, index: number) => (

                <img
                  key={index}
                  src={image}
                  alt=""
                  style={{
                    width: '100%',
                    height: '8rem',
                    objectFit: 'cover',
                    borderRadius: '1rem',
                    border: '1px solid #222'
                  }}
                />

              ))}

            </div>

          )}

        </div>

        {/* RIGHT */}
        <div>

          <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '1.5rem',
            padding: '2rem',
            position: 'sticky',
            top: '2rem'
          }}>

            <h1 style={{
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {listing.title}
            </h1>

            <p style={{
              color: '#999',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              {listing.description}
            </p>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
            }}>

            {/* Ubicación */}
            <div>

            <span style={label}>
                Ubicación
            </span>

            <div style={entityCard}>
                {listing.province}
                {listing.canton && ` → ${listing.canton}`}
                {listing.district && ` → ${listing.district}`}
            </div>

            </div>

            {/* Tipo de Propiedad */}
            <div>

            <span style={label}>
                Tipo de Propiedad
            </span>

            <div style={entityCard}>
                {listing.property_type}
            </div>

            </div>

            {/* BEDROOMS */}
            {listing.bedrooms && (

            <div>

            <span style={label}>
                Habitaciones
            </span>

            <div style={entityCard}>
                {listing.bedrooms}
            </div>

            </div>

            )}

            {/* BATHROOMS */}
            {listing.bathrooms && (

            <div>

            <span style={label}>
                Baños
            </span>

            <div style={entityCard}>
                {listing.bathrooms}
            </div>

            </div>

            )}

            {/* PARKING */}
            {listing.parking && (

            <div>

            <span style={label}>
                Estacionamiento
            </span>

            <div style={entityCard}>
                {listing.parking}
            </div>

            </div>

            )}

            {/* YEAR BUILT */}
            {listing.year_built_range && (

            <div>

            <span style={label}>
                Año de Construcción
            </span>

            <div style={entityCard}>
                {listing.year_built_range}
            </div>

            </div>

            )}

            {/* CONSTRUCTION AREA */}
            {listing.construction_area && (

            <div>

            <span style={label}>
                Área de Construcción
            </span>

            <div style={entityCard}>
                {listing.construction_area}
            </div>

            </div>

            )}

            {/* PROPERTY AREA */}
            <div>

            <span style={label}>
                Área de la Propiedad
            </span>

            <div style={entityCard}>
                {listing.property_area}
            </div>

            </div>

            {/* ENVIRONMENT */}
            <div>

            <span style={label}>
                Entorno
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.environment}
                </span>

            </div>

            </div>

            {/* ACCESSIBILITY */}
            <div>

            <span style={label}>
                Accesibilidad
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.accessibility)
                ? listing.accessibility
                : typeof listing.accessibility === 'string'
                ? JSON.parse(listing.accessibility)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* TERRAIN */}
            <div>

            <span style={label}>
                Terreno
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.terrain)
                ? listing.terrain
                : typeof listing.terrain === 'string'
                ? JSON.parse(listing.terrain)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* UTILITIES */}
            <div>

            <span style={label}>
                Servicios
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.utility)
                ? listing.utility
                : typeof listing.utility === 'string'
                ? JSON.parse(listing.utility)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* LEGAL STATUS */}
            <div>

            <span style={label}>
                Estado Legal
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.legal_status}
                </span>

            </div>

            </div>

            {/* PRICE */}
            <div>

            <span style={label}>
                Precio
            </span>

            <div style={priceCard}>

                {listing.price
                    ? listing.price
                    : listing.price_millions
                    ? `₡${Number(
                        listing.price_millions
                        ).toLocaleString()}M`
                    : 'Precio No Disponible'}

            </div>

            </div>

            {/* WHATSAPP */}
            <div>

            <span style={label}>
                WhatsApp
            </span>

            <div style={entityCard}>
                +506 {listing.whatsapp}
            </div>

            </div>

            </div>

            {/* CONTACT BUTTON */}
            <a
              href={`https://wa.me/506${listing.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#00ff99',
                color: '#000',
                textDecoration: 'none',
                padding: '1rem',
                borderRadius: '999px',
                fontWeight: 'bold'
              }}
            >
              Contactar Vendedor por WhatsApp
            </a>

          </div>

        </div>

      </div>

    </main>

  )

}

const label = {
  color: '#777',
  fontSize: '.8rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '.35rem'
}

const entityCard = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.6
}

const pillContainer = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const pillEntity = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.75rem 1rem',
  color: '#ddd',
  fontSize: '.95rem'
}

const priceCard = {
  background: '#00ff99',
  color: '#000',
  borderRadius: '1rem',
  padding: '1.25rem',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  textAlign: 'center' as const
}
