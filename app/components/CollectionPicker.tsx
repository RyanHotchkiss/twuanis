'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  addPropertyToCollection,
  createFavoriteCollection,
  FavoriteCollectionRecord,
  getFavoriteCollections
} from '@/lib/collections'

type Props = {
  listingId: string
  language:
    | 'en'
    | 'es'
}

export default function CollectionPicker({
  listingId,
  language
}: Props) {
  const [
    open,
    setOpen
  ] = useState(false)

  const [
    collections,
    setCollections
  ] = useState<
    FavoriteCollectionRecord[]
  >([])

  const [
    newCollectionName,
    setNewCollectionName
  ] = useState('')

  const [
    status,
    setStatus
  ] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    loadCollections()
  }, [open])

  async function loadCollections() {
    const loadedCollections =
      await getFavoriteCollections()

    setCollections(
      loadedCollections
    )
  }

  async function handleAdd(
    collectionId: string
  ) {
    try {
      setStatus(
        language === 'es'
          ? 'Guardando...'
          : 'Saving...'
      )

      await addPropertyToCollection(
        collectionId,
        listingId
      )

      setStatus(
        language === 'es'
          ? 'Propiedad agregada.'
          : 'Property added.'
      )
    } catch (error) {
      console.error(
        'ADD TO COLLECTION ERROR:',
        error
      )

      setStatus(
        language === 'es'
          ? 'No se pudo guardar.'
          : 'Unable to save.'
      )
    }
  }

  async function handleCreateAndAdd() {
    if (
      !newCollectionName.trim()
    ) {
      return
    }

    try {
      const collection =
        await createFavoriteCollection(
          newCollectionName
        )

      await addPropertyToCollection(
        collection.id,
        listingId
      )

      setNewCollectionName('')
      await loadCollections()

      setStatus(
        language === 'es'
          ? 'Colección creada.'
          : 'Collection created.'
      )
    } catch (error) {
      console.error(
        'CREATE COLLECTION ERROR:',
        error
      )

      setStatus(
        language === 'es'
          ? 'No se pudo crear.'
          : 'Unable to create.'
      )
    }
  }

  return (
    <div style={wrapper}>
      <button
        type="button"
        onClick={() =>
          setOpen(current =>
            !current
          )
        }
        style={trigger}
      >
        {language === 'es'
          ? 'Agregar a colección'
          : 'Add to Collection'}
      </button>

      {open && (
        <div style={panel}>
          <strong style={heading}>
            {language === 'es'
              ? 'Colecciones'
              : 'Collections'}
          </strong>

          {collections.length === 0 ? (
            <p style={empty}>
              {language === 'es'
                ? 'Todavía no hay colecciones.'
                : 'No collections yet.'}
            </p>
          ) : (
            <div style={collectionList}>
              {collections.map(
                collection => (
                  <button
                    key={
                      collection.id
                    }
                    type="button"
                    onClick={() =>
                      handleAdd(
                        collection.id
                      )
                    }
                    style={
                      collectionButton
                    }
                  >
                    {collection.name}

                    <span style={count}>
                      {
                        collection.propertyCount
                      }
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          <div style={createRow}>
            <input
              value={
                newCollectionName
              }
              onChange={event =>
                setNewCollectionName(
                  event.target.value
                )
              }
              placeholder={
                language === 'es'
                  ? 'Nueva colección'
                  : 'New collection'
              }
              style={input}
            />

            <button
              type="button"
              onClick={
                handleCreateAndAdd
              }
              disabled={
                !newCollectionName.trim()
              }
              style={createButton}
            >
              +
            </button>
          </div>

          {status && (
            <p style={statusText}>
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const wrapper = {
  position: 'relative' as const
}

const trigger = {
  width: '100%',
  padding: '.65rem',
  color: '#C7A44B',
  background: '#151515',
  border: '1px solid #333',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600
}

const panel = {
  position: 'absolute' as const,
  zIndex: 30,
  right: 0,
  top: 'calc(100% + .5rem)',
  width: '280px',
  padding: '1rem',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '12px',
  boxShadow:
    '0 18px 45px rgba(0,0,0,.55)'
}

const heading = {
  color: '#fff'
}

const empty = {
  color: '#888',
  fontSize: '.8rem'
}

const collectionList = {
  display: 'grid',
  gap: '.45rem',
  marginTop: '.75rem'
}

const collectionButton = {
  display: 'flex',
  justifyContent:
    'space-between',
  padding: '.65rem',
  color: '#fff',
  background: '#1c1c1c',
  border: '1px solid #333',
  borderRadius: '8px',
  cursor: 'pointer'
}

const count = {
  color: '#888'
}

const createRow = {
  display: 'grid',
  gridTemplateColumns:
    '1fr auto',
  gap: '.5rem',
  marginTop: '.75rem'
}

const input = {
  minWidth: 0,
  padding: '.65rem',
  color: '#fff',
  background: '#090909',
  border: '1px solid #333',
  borderRadius: '8px'
}

const createButton = {
  width: '2.5rem',
  color: '#000',
  background: '#C7A44B',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1.2rem',
  fontWeight: 700
}

const statusText = {
  margin: '.65rem 0 0',
  color: '#aaa',
  fontSize: '.78rem'
}