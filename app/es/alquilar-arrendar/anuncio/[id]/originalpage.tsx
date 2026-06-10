'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'
import { createListingId } from '@/lib/createListingId'

import JsonLd from '@/app/components/JsonLd'

import {
  getGraphNeighbors,
  getOntologyTermsByIds
} from '@/lib/graph-engine'

import {
  buildListingSchema
} from '@/lib/schema-engine'

export default function ListingPage() {

  const params = useParams()

  const [listing, setListing] = useState<any>(null)

  const [ontologyTerms, setOntologyTerms] =
  useState<any[]>([])

  const [neighborTerms, setNeighborTerms] =
    useState<any[]>([])

  const [graphRows, setGraphRows] =
    useState<any[]>([])

  const [loading, setLoading] = useState(true)
  
  useEffect(() => {

          async function fetchListing() {

console.log('RENT PAGE SCHEMA MODE')

            const { data, error } = await supabase
              .from('listings')
              .select('*')
              .eq('id', String(params.id))
              .eq('transaction_type', 'rent')
              .single()

            if (data) {

             const normalizedListing = {

                    ...data,

                    images:
                      Array.isArray(data.images)
                        ? data.images
                        : typeof data.images === 'string'
                        ? (() => {

                            try {

                              return JSON.parse(data.images)

                            } catch {

                              return data.images
                                .split('|')
                                .map((img: string) => img.trim())
                                .filter(Boolean)

                            }

                          })()
                        : []

                  }

                  setListing(normalizedListing)

                  console.log(
                    'RENT IMAGES:',
                    normalizedListing.images
                  )

                  console.log(
                    'FIRST RENT IMAGE:',
                    normalizedListing.images?.[0]
                  )

              const { data: ontologyRows } = await supabase
                .from('listings_ontology_terms')
                .select(`
                  ontology_terms (
                    id,
                    parent_id,
                    term_name,
                    term_type,
                    slug,
                    description,
                    official_code,
                    term_name_en,
                    term_name_es,
                    slug_en,
                    slug_es
                  )
                `)
                .eq('listing_id', data.id)

              setOntologyTerms(
                ontologyRows
                  ?.map((row: any) => row.ontology_terms)
                  .filter(Boolean) || []
              )

              const termIds =
                  ontologyRows
                    ?.map(
                      (row: any) =>
                        row.ontology_terms?.id
                    )
                    .filter(Boolean) || []

                if (termIds.length > 0) {

                  const graphNeighbors =
                    await getGraphNeighbors(termIds)

                  setGraphRows(graphNeighbors)

                  const neighborIds = [
                    ...new Set([
                      ...graphNeighbors.map(
                        (row: any) =>
                          row.source_term_id
                      ),
                      ...graphNeighbors.map(
                        (row: any) =>
                          row.target_term_id
                      )
                    ])
                  ]

                  const neighborTermsData =
                    await getOntologyTermsByIds(
                      neighborIds
                    )

                  setNeighborTerms(
                    neighborTermsData || []
                  )

                }

              const graphNeighbors =
                await getGraphNeighbors(termIds)

              const filteredGraphNeighbors =
                graphNeighbors.filter(
                  (row: any) =>
                    termIds.includes(row.source_term_id) &&
                    termIds.includes(row.target_term_id)
                )

              setGraphRows(filteredGraphNeighbors)

              const neighborIds = [
                ...new Set([
                  ...filteredGraphNeighbors.map(
                    (row: any) => row.source_term_id
                  ),
                  ...filteredGraphNeighbors.map(
                    (row: any) => row.target_term_id
                  )
                ])
              ]

              const neighborTermsData =
                await getOntologyTermsByIds(neighborIds)

              setNeighborTerms(neighborTermsData || [])


            } else {

              console.error('Propiedad No Encontrada')

            }

            setLoading(false)

          }

          if (params.id) {

            fetchListing()

          }

        }, [params.id])

        const schema =
          listing
            ? buildListingSchema({
                listing,
                ontologyTerms,
                neighborTerms,
                graphRows,
                lang: 'es',
                mode: 'rent'
              })
            : null

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


return (

  <>

    {schema && <JsonLd data={schema} />}

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
            color: '#FFFFFF',
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
                referrerPolicy="no-referrer"
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
                        color: '#FFFFFF',
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

                {listing.monthly_price
                  ? `${listing.currency || 'CRC'} ${Number(
                      listing.monthly_price
                    ).toLocaleString()} / month`
                  : 'Price Not Available'}

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
                background: '#FFFFFF',
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
   </>
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
  background: '#FFFFFF',
  color: '#000',
  borderRadius: '1rem',
  padding: '1.25rem',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  textAlign: 'center' as const
}
