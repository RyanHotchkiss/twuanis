'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import TopBarES from '@/app/components/TopBarES'


import { supabase } from '@/lib/supabase'

export default function FavoritesPage() {

  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showMobileFilters, setShowMobileFilters] =
  useState(false)

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

        const supabaseFavoriteIds =
        favoriteIds.filter(
            (id: string) => {

            return /^[0-9a-fA-F-]{36}$/.test(id)

            }
        )

        let data = []
        let error = null

        if (supabaseFavoriteIds.length > 0) {

        const response = await supabase
            .from('listings')
            .select('*')
            .in('id', supabaseFavoriteIds)

        data = response.data || []
        error = response.error

        }       


            const normalizedSupabaseListings =
            (data || []).map(
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

           setFavorites([
                ...normalizedSupabaseListings
                ])

      setLoading(false)

    }

    fetchFavorites()

  }, [])

  if (loading) {

    return (

      <main style={mainStyle}>
        Cargando Favoritos...
      </main>

    )

  }

  return (

    <main style={mainStyle}>

                    <TopBarES
                        onFilterClick={() =>
                          setShowMobileFilters(true)
                        }
                      />

      <h1 style={{
        fontSize: '3rem',
        marginBottom: '2rem'
      }}>
        Favoritos
      </h1>

      {favorites.length === 0 ? (

        <div style={{
          color: '#777'
        }}>
          Todavía no hay propiedades guardadas.
        </div>

      ) : (

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem'
        }}>

          {favorites.map((property) => (

            <Link
                key={property.id}
                href={`/listing/${property.id}`}
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
                      Sin Imagen
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