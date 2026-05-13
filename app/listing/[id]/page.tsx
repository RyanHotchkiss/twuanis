'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'


import { supabase } from '@/lib/supabase'

export default function ListingPage() {

  const params = useParams()

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function fetchListing() {

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', String(params.id))
        .single()

      if (error) {

        console.error(error)

      } else {

        setListing(data)

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

        Loading Listing...

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

        Listing Not Found

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
          href="/"
          style={{
            color: '#00ff99',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ← Back To Marketplace
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

              <div>
                <span style={label}>
                  Province
                </span>

                <div>
                  {listing.province}
                </div>
              </div>

              <div>
                <span style={label}>
                  Canton
                </span>

                <div>
                  {listing.canton}
                </div>
              </div>

              <div>
                <span style={label}>
                  District
                </span>

                <div>
                  {listing.district}
                </div>
              </div>

              <div>
                <span style={label}>
                  Property Type
                </span>

                <div>
                  {listing.property_type}
                </div>
              </div>

              <div>
                <span style={label}>
                  Environment
                </span>

                <div>
                  {listing.environment}
                </div>
              </div>

              <div>
                <span style={label}>
                  Accessibility
                </span>

                <div>
                {typeof listing.accessibility === 'string'
                    ? JSON.parse(listing.accessibility).join(', ')
                    : Array.isArray(listing.accessibility)
                    ? listing.accessibility.join(', ')
                    : listing.accessibility}
                </div>
              </div>

              <div>
                <span style={label}>
                  Terrain
                </span>

                <div>
                  {Array.isArray(listing.terrain)
                    ? listing.terrain.join(', ')
                    : listing.terrain}
                </div>
              </div>

              <div>
                <span style={label}>
                  Utilities
                </span>

                <div>
                  {Array.isArray(listing.utility)
                    ? listing.utility.join(', ')
                    : listing.utility}
                </div>
              </div>

              <div>
                <span style={label}>
                  Legal Status
                </span>

                <div>
                  {listing.legal_status}
                </div>
              </div>

              <div>
                <span style={label}>
                  WhatsApp
                </span>

                <div>
                  {listing.whatsapp}
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
              Contact Seller On WhatsApp
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