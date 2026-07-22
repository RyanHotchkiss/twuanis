'use client'

import {
  useEffect,
  useState
} from 'react'

import Link from 'next/link'
import {
  useSearchParams
} from 'next/navigation'

import CollectionPicker from '@/app/components/CollectionPicker'

import {
  getCollectionListingIds
} from '@/lib/collections'

import TopBar from '@/app/components/TopBar'

import {
  Suspense
} from 'react'

import { supabase } from '@/lib/supabase'

export default function FavoritesPage() {
      return (
        <Suspense fallback={null}>
          <FavoritesContent />
        </Suspense>
      )
    }

    function FavoritesContent() {
      const searchParams =
        useSearchParams()

  const collectionId =
    searchParams.get(
      'collection'
    )

  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showMobileFilters, setShowMobileFilters] =
  useState(false)

  useEffect(() => {

    async function fetchFavorites() {

            const favoriteIds =
              collectionId
                ? await getCollectionListingIds(
                    collectionId
                  )
                : JSON.parse(
                    localStorage.getItem(
                      'favorites'
                    ) || '[]'
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

            setFavorites(
                normalizedSupabaseListings
              )

      setLoading(false)

    }

    fetchFavorites()

  }, [collectionId])

  if (loading) {

    return (

      <main style={mainStyle}>
        Loading Favorites...
      </main>

    )

  }

  return (

    <main style={mainStyle}>

                    <TopBar
                        onFilterClick={() =>
                          setShowMobileFilters(true)
                        }
                      />

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

            <div
                key={property.id}
                style={{
                  background: '#181818',
                  border: '1px solid #222',
                  borderRadius: '1.5rem',
                  overflow: 'visible'
                }}
              >
                <Link
                  href={
                    property.transaction_type ===
                      'rent' ||
                    property.transaction_type ===
                      'lease'
                      ? `/en/rent-lease/listing/${property.id}`
                      : `/en/buy/listing/${property.id}`
                  }
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    color: '#fff',
                    borderRadius: '1.5rem',
                    textDecoration: 'none'
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '4 / 3',
                      overflow: 'hidden',
                      background: '#111'
                    }}
                  >
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
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          justifyContent:
                            'center',
                          alignItems: 'center',
                          color: '#555'
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '1.25rem'
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '1.1rem',
                        marginBottom: '.5rem'
                      }}
                    >
                      {property.title}
                    </h2>

                    <p style={{ color: '#888' }}>
                      {property.province}
                      {' → '}
                      {property.canton}
                    </p>
                  </div>
                </Link>

                <div
                  style={{
                    padding:
                      '0 1.25rem 1.25rem'
                  }}
                >
                  <CollectionPicker
                    listingId={property.id}
                    language="en"
                  />
                </div>
              </div>

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