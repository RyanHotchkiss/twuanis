'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'

export default function FavoritesPage() {

  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function fetchFavorites() {

      const favoriteIds =
        JSON.parse(
          localStorage.getItem('favorites') || '[]'
        )

      if (favoriteIds.length === 0) {

        setFavorites([])
        setLoading(false)

        return

      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', favoriteIds)

      if (error) {

        console.error(
          JSON.stringify(error, null, 2)
        )

      } else {

        setFavorites(data || [])

      }

      setLoading(false)

    }

    fetchFavorites()

  }, [])

  if (loading) {

    return (

      <main style={mainStyle}>
        Loading Favorites...
      </main>

    )

  }

  return (

    <main style={mainStyle}>

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

      <h1 style={{
        fontSize: '3rem',
        marginBottom: '2rem'
      }}>
        Favorites
      </h1>

      {favorites.length === 0 ? (

        <div style={{
          color: '#777'
        }}>
          No saved listings yet.
        </div>

      ) : (

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem'
        }}>

          {favorites.map((property) => (

            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              style={{
                textDecoration: 'none',
                color: '#fff'
              }}
            >

              <div style={{
                background: '#181818',
                border: '1px solid #222',
                borderRadius: '1.5rem',
                overflow: 'hidden'
              }}>

                {/* IMAGE */}
                <div style={{
                  aspectRatio: '4 / 3',
                  overflow: 'hidden',
                  background: '#111'
                }}>

                  {property.images?.[0] ? (

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

                    <div style={{
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#555'
                    }}>
                      No Image
                    </div>

                  )}

                </div>

                {/* CONTENT */}
                <div style={{
                  padding: '1.25rem'
                }}>

                  <h2 style={{
                    fontSize: '1.1rem',
                    marginBottom: '.5rem'
                  }}>
                    {property.title}
                  </h2>

                  <p style={{
                    color: '#888'
                  }}>
                    {property.province} → {property.canton}
                  </p>

                </div>

              </div>

            </Link>

          ))}

        </div>

      )}

    </main>

  )

}

const mainStyle = {
  background: '#000',
  minHeight: '100vh',
  color: '#fff',
  padding: '2rem'
}