'use client'

import {
  useEffect,
  useState
} from 'react'

import Link from 'next/link'
import {
  useSearchParams
} from 'next/navigation'

import {
  Suspense
} from 'react'
import CollectionPicker from '@/app/components/CollectionPicker'

import {
  addPropertiesToCollection,
  FavoriteCollectionRecord,
  getCollectionListingIds,
  getFavoriteCollections,
  movePropertiesBetweenCollections,
  removePropertiesFromCollection
} from '@/lib/collections'

import TopBarES from '@/app/components/TopBarES'


import { supabase } from '@/lib/supabase'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

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

  const [
      collections,
      setCollections
    ] = useState<
      FavoriteCollectionRecord[]
    >([])

    const [
      selectedIds,
      setSelectedIds
    ] = useState<
      Set<string>
    >(new Set())

    const [
      targetCollectionId,
      setTargetCollectionId
    ] = useState('')

    const [
      bulkWorking,
      setBulkWorking
    ] = useState(false)

    const [
      bulkStatus,
      setBulkStatus
    ] = useState('')

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
        setSelectedIds(
            new Set()
          )
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


        useEffect(() => {
          async function loadCollections() {
            const loadedCollections =
              await getFavoriteCollections()

            setCollections(
              loadedCollections
            )
          }

          function handleCollectionsUpdated() {
            void loadCollections()
          }

          void loadCollections()

          window.addEventListener(
            'collections-updated',
            handleCollectionsUpdated
          )

          return () => {
            window.removeEventListener(
              'collections-updated',
              handleCollectionsUpdated
            )
          }
        }, [])

            const normalizedSupabaseListings =
            (data || []).map(
                (listing: any) => ({

                ...listing,

                images:
                resolveListingImages(
                  listing.images
                )

                })
            )

           setFavorites([
                ...normalizedSupabaseListings
                ])

      setLoading(false)

    }

    fetchFavorites()

  }, [collectionId])

  const selectedListingIds =
      Array.from(selectedIds)

    const availableCollections =
      collections.filter(
        collection =>
          collection.id !==
          collectionId
      )

    const allSelected =
      favorites.length > 0 &&
      selectedIds.size ===
        favorites.length

    function handleToggleSelection(
      listingId: string
    ) {
      setSelectedIds(
        currentIds => {
          const nextIds =
            new Set(currentIds)

          if (
            nextIds.has(listingId)
          ) {
            nextIds.delete(
              listingId
            )
          } else {
            nextIds.add(
              listingId
            )
          }

          return nextIds
        }
      )

      setBulkStatus('')
    }

    function handleSelectAll() {
      setSelectedIds(
        new Set(
          favorites.map(
            property =>
              property.id
          )
        )
      )

      setBulkStatus('')
    }

    function handleClearSelection() {
      setSelectedIds(
        new Set()
      )

      setBulkStatus('')
    }

    async function handleBulkAdd() {
      if (
        selectedListingIds.length === 0 ||
        !targetCollectionId
      ) {
        return
      }

      try {
        setBulkWorking(true)
        setBulkStatus(
          'Agregando propiedades...'
        )

        await addPropertiesToCollection(
          targetCollectionId,
          selectedListingIds
        )

        setBulkStatus(
          `${selectedListingIds.length} propiedades agregadas.`
        )

        setSelectedIds(
          new Set()
        )
      } catch (error) {
        console.error(
          'BULK ADD ERROR:',
          error
        )

        setBulkStatus(
          'No se pudieron agregar las propiedades seleccionadas.'
        )
      } finally {
        setBulkWorking(false)
      }
    }

    async function handleBulkRemove() {
      if (
        !collectionId ||
        selectedListingIds.length === 0
      ) {
        return
      }

      try {
        setBulkWorking(true)
        setBulkStatus(
          'Eliminando propiedades...'
        )

        await removePropertiesFromCollection(
          collectionId,
          selectedListingIds
        )

        const removedIds =
          new Set(
            selectedListingIds
          )

        setFavorites(
          currentFavorites =>
            currentFavorites.filter(
              property =>
                !removedIds.has(
                  property.id
                )
            )
        )

        setSelectedIds(
          new Set()
        )

        setBulkStatus(
          `${selectedListingIds.length} propiedades eliminadas.`
        )
      } catch (error) {
        console.error(
          'BULK REMOVE ERROR:',
          error
        )

        setBulkStatus(
          'No se pudieron eliminar las propiedades seleccionadas.'
        )
      } finally {
        setBulkWorking(false)
      }
    }

    async function handleBulkMove() {
      if (
        !collectionId ||
        !targetCollectionId ||
        selectedListingIds.length === 0
      ) {
        return
      }

      try {
        setBulkWorking(true)
        setBulkStatus(
          'Moviendo propiedades...'
        )

        await movePropertiesBetweenCollections(
          collectionId,
          targetCollectionId,
          selectedListingIds
        )

        const movedIds =
          new Set(
            selectedListingIds
          )

        setFavorites(
          currentFavorites =>
            currentFavorites.filter(
              property =>
                !movedIds.has(
                  property.id
                )
            )
        )

        setSelectedIds(
          new Set()
        )

        setBulkStatus(
          `${selectedListingIds.length} propiedades movidas.`
        )
      } catch (error) {
        console.error(
          'BULK MOVE ERROR:',
          error
        )

        setBulkStatus(
          'No se pudieron mover las propiedades seleccionadas.'
        )
      } finally {
        setBulkWorking(false)
      }
    }

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

      {favorites.length > 0 && (
        <section style={bulkToolbar}>
          <div style={selectionActions}>
            <strong>
              {selectedIds.size}{' '}
              seleccionadas
            </strong>

            <button
              type="button"
              onClick={
                allSelected
                  ? handleClearSelection
                  : handleSelectAll
              }
              disabled={bulkWorking}
              style={secondaryButton}
            >
              {allSelected
                ? 'Limpiar selección'
                : 'Seleccionar todas'}
            </button>
          </div>

          <div style={bulkActions}>
            <select
              value={
                targetCollectionId
              }
              onChange={event =>
                setTargetCollectionId(
                  event.target.value
                )
              }
              disabled={
                bulkWorking ||
                availableCollections.length ===
                  0
              }
              style={collectionSelect}
            >
              <option value="">
                Elegir colección
              </option>

              {availableCollections.map(
                collection => (
                  <option
                    key={
                      collection.id
                    }
                    value={
                      collection.id
                    }
                  >
                    {collection.name}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void handleBulkAdd()
              }
              disabled={
                bulkWorking ||
                selectedIds.size === 0 ||
                !targetCollectionId
              }
              style={primaryButton}
            >
              Agregar
            </button>

            {collectionId && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void handleBulkMove()
                  }
                  disabled={
                    bulkWorking ||
                    selectedIds.size === 0 ||
                    !targetCollectionId
                  }
                  style={primaryButton}
                >
                  Mover
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleBulkRemove()
                  }
                  disabled={
                    bulkWorking ||
                    selectedIds.size === 0
                  }
                  style={dangerButton}
                >
                  Eliminar
                </button>
              </>
            )}
          </div>

          {bulkStatus && (
            <p style={bulkStatusStyle}>
              {bulkStatus}
            </p>
          )}
        </section>
      )}

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

            <div
              key={property.id}
              style={{
                position: 'relative',
                background: '#181818',
                border:
                  selectedIds.has(
                    property.id
                  )
                    ? '1px solid #C7A44B'
                    : '1px solid #222',
                borderRadius: '1.5rem',
                overflow: 'visible'
              }}
            >
              <label style={cardCheckbox}>
                <input
                  type="checkbox"
                  checked={
                    selectedIds.has(
                      property.id
                    )
                  }
                  onChange={() =>
                    handleToggleSelection(
                      property.id
                    )
                  }
                  disabled={bulkWorking}
                  style={checkboxInput}
                />

                <span>
                  Seleccionar
                </span>
              </label>
                <Link
                  href={
                          property.transaction_type ===
                            'rent' ||
                          property.transaction_type ===
                            'lease'
                            ? `/es/alquilar-arrendar/anuncio/${property.id}`
                            : `/es/comprar/anuncio/${property.id}`
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
                        Sin Imagen
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
                    language="es"
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

const bulkToolbar = {
  display: 'grid',
  gap: '.8rem',
  marginBottom: '2rem',
  padding: '1rem',
  background: '#111',
  border: '1px solid #292929',
  borderRadius: '1rem'
}

const selectionActions = {
  display: 'flex',
  alignItems: 'center',
  justifyContent:
    'space-between',
  gap: '1rem',
  flexWrap: 'wrap' as const
}

const bulkActions = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem',
  flexWrap: 'wrap' as const
}

const collectionSelect = {
  minWidth: '210px',
  padding: '.7rem',
  color: '#fff',
  background: '#090909',
  border: '1px solid #444',
  borderRadius: '8px'
}

const primaryButton = {
  padding: '.7rem 1rem',
  color: '#000',
  background: '#C7A44B',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700
}

const secondaryButton = {
  padding: '.7rem 1rem',
  color: '#fff',
  background: '#1c1c1c',
  border: '1px solid #444',
  borderRadius: '8px',
  cursor: 'pointer'
}

const dangerButton = {
  padding: '.7rem 1rem',
  color: '#fff',
  background: '#5c1c1c',
  border: '1px solid #883434',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700
}

const bulkStatusStyle = {
  margin: 0,
  color: '#aaa',
  fontSize: '.85rem'
}

const cardCheckbox = {
  position: 'absolute' as const,
  zIndex: 20,
  top: '.75rem',
  left: '.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '.4rem',
  padding: '.45rem .65rem',
  color: '#fff',
  background:
    'rgba(0,0,0,.82)',
  border: '1px solid #555',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '.78rem',
  fontWeight: 700
}

const checkboxInput = {
  width: '1rem',
  height: '1rem',
  accentColor: '#C7A44B'
}