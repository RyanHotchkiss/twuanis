'use client'


import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'
import { createListingId } from '@/lib/createListingId'
import TopBar from '@/app/components/TopBar'
import JsonLd from '@/app/components/JsonLd'
import { buildListingSchema } from '@/lib/schema-engine'
import {
  getGraphNeighbors,
  getOntologyTermsByIds
}
from '@/lib/graph-engine'

export default function ListingPage() {

  const navButton = {
            background:'#FFFFFF',
            border:'.0625rem solid #FFFFFF',
            color:'#000',
            borderRadius:'999rem',
            padding:'.85rem 1.25rem',
            fontWeight:'bold',
            cursor:'pointer',
            transition:'all .2s ease',
            backdropFilter:'blur(10px)'
          }

  const params = useParams()

  const [listing, setListing] = useState<any>(null)
  const [ontologyTerms, setOntologyTerms] = useState<any[]>([])

  const [neighborTerms, setNeighborTerms] =
  useState<any[]>([])

const [graphRows, setGraphRows] =
  useState<any[]>([])

  const [loading, setLoading] = useState(true)
  
  const [showMobileFilters, setShowMobileFilters] =
  useState(false)

  useEffect(() => {

    async function fetchListing() {

      // SEARCH SUPABASE FIRST
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', String(params.id))
        .single()

      // IF SUPABASE FOUND MATCH
      if (data) {

            const normalizedListing = {

              ...data,

              images:
                    Array.isArray(data.images)
                      ? data.images
                      : typeof data.images === 'string'
                      ? (() => {

                          try {

                            return JSON.parse(
                              data.images
                            )

                          } catch {

                            return data.images
                              .split('|')
                              .map((img: string) =>
                                img.trim()
                              )
                              .filter(Boolean)

                          }

                        })()
                      : []

            }

            setListing(normalizedListing)

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

console.log(
  'LISTING ID',
  data.id
)

console.log(
  'ONTOLOGY ROWS',
  ontologyRows
)

console.log(
  'ONTOLOGY ROWS',
  ontologyRows
)

console.log(
  'LISTING ID',
  data.id
)

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

            setLoading(false)

            return

          }


      setLoading(false)

    }

    if (params.id) {
      fetchListing()
    }

  }, [params.id])

console.log(
  'NEIGHBOR TERMS STATE',
  neighborTerms
)

console.log(
  'GRAPH ROWS STATE',
  graphRows
)

const schema =
  listing
    ? buildListingSchema({
        listing,
        ontologyTerms,
        neighborTerms,
        graphRows,
        lang: 'en',
        mode: 'buy'
      })
    : null

    console.log('LISTING', listing)
console.log('ONTOLOGY TERMS', ontologyTerms)
console.log('SCHEMA', schema)

  if (loading) {

return (

    <main style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '2rem'
      }}>

        Loading Property...

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

        Property Not Found

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

            <TopBar
              onFilterClick={() =>
                setShowMobileFilters(true)
              }
            />

        {/* MAIN LAYOUT */}
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
                No Image
              </div>

            )}

          </div>
                    
        <button
            onClick={(e) => {

              e.preventDefault()
              e.stopPropagation()

              const existingFavorites =
                JSON.parse(
                  localStorage.getItem('buy_favorites') || '[]'
                )

              const alreadySaved =
                existingFavorites.includes(listing.id)

              let updatedFavorites:string[] = []

              if (alreadySaved) {

                updatedFavorites =
                  existingFavorites.filter(
                    (id:string) => id !== listing.id
                  )

              } else {

                updatedFavorites = [
                  ...existingFavorites,
                  listing.id
                ]

              }

              localStorage.setItem(
                'buy_favorites',
                JSON.stringify(updatedFavorites)
              )

            }}
            style={{
              marginTop:'1rem',
              width:'100%',
              background:'#111',
              border:'1px solid #333',
              color:'#fff',
              borderRadius:'999px',
              marginBottom:'1rem',
              padding:'.85rem',
              cursor:'pointer',
              fontWeight:'bold'
            }}
          >
            Save To Favorites
          </button>

          {/* IMAGE GRID */}
          {listing.images?.length > 1 && (

            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(4, 1fr)',
              gap:'1rem'
            }}>

              {listing.images.slice(1).map(
                (image:string, index:number) => (

                  <img
                    key={index}
                    referrerPolicy="no-referrer"
                    src={image}
                    alt=""
                    style={{
                      width:'100%',
                      height:'8rem',
                      objectFit:'cover',
                      borderRadius:'1rem',
                      border:'1px solid #222'
                    }}
                  />

                )
              )}

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

            {/* LOCATION */}
            <div>

            <span style={label}>
                Location
            </span>

            <div style={entityCard}>
                {listing.province}
                {listing.canton && ` → ${listing.canton}`}
                {listing.district && ` → ${listing.district}`}
            </div>

            </div>

            {/* PROPERTY TYPE */}
            <div>

            <span style={label}>
                Property Type
            </span>

            <div style={entityCard}>
                {listing.property_type}
            </div>

            </div>

            {/* BEDROOMS */}
            {listing.bedrooms && (

            <div>

            <span style={label}>
                Bedrooms
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
                Bathrooms
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
                Parking
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
                Year Constructed
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
                Construction Area
            </span>

            <div style={entityCard}>
                {listing.construction_area}
            </div>

            </div>

            )}

            {/* PROPERTY AREA */}
            <div>

            <span style={label}>
                Property Area
            </span>

            <div style={entityCard}>
                {listing.property_area}
            </div>

            </div>

            {/* ENVIRONMENT */}
            <div>

            <span style={label}>
                Environment
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.environment}
                </span>

            </div>

            </div>

            {/* ACCSIBILITY */}
            <div>

            <span style={label}>
                Accessibility
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.accessibility)
                ? listing.accessibility
                : Array.isArray(listing.accessibility)
                ? listing.accessibility
                : typeof listing.accessibility === 'string'
                ? [listing.accessibility]
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
                Terrain
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

            {/* UTILITI */}
            <div>

            <span style={label}>
                Utilities
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
                Legal Status
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
                Price
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
                background: '#FFFFFF',
                color: '#000',
                textDecoration: 'none',
                padding: '1rem',
                borderRadius: '999px',
                fontWeight: 'bold'
              }}
            >
              Contact Seller on WhatsApp
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