'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import Link
  from 'next/link'

import DOMPurify
  from 'dompurify'

import {
  deletePropertyNote,
  getUserPropertyNotes,
  type PropertyNoteRecord,
  updatePropertyNote
} from '@/lib/property-notes'

import {
  supabase
} from '@/lib/supabase'

import PropertyNoteEditor
  from '@/app/components/PropertyNoteEditor'

type MarketHubPropertyNotesProps = {
  language: 'en' | 'es'
}

type ListingRecord = {
  id: string
  title: string | null
  transaction_type: string | null
  property_type: string | null
  province: string | null
  canton: string | null
  district: string | null
}

type SearchablePropertyNote =
  PropertyNoteRecord & {
    listing: ListingRecord | null
  }

export default function MarketHubPropertyNotes({
  language
}: MarketHubPropertyNotesProps) {
  const [
    notes,
    setNotes
  ] = useState<
    SearchablePropertyNote[]
  >([])

  const [
    search,
    setSearch
  ] = useState('')

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage
  ] = useState('')

  const [
    editingNoteId,
    setEditingNoteId
  ] = useState<
    string | null
  >(null)

  const [
    editDraft,
    setEditDraft
  ] = useState('')

  const [
    savingNoteId,
    setSavingNoteId
  ] = useState<
    string | null
  >(null)

  const [
    deletingNoteId,
    setDeletingNoteId
  ] = useState<
    string | null
  >(null)

  const labels =
    language === 'es'
      ? {
          heading:
            'Notas de Propiedades',

          description:
            'Busque todas sus notas privadas guardadas en MarketHub.',

          searchPlaceholder:
            'Buscar por nota, propiedad o ubicación...',

          loading:
            'Cargando notas...',

          empty:
            'Todavía no ha guardado notas de propiedades.',

          noResults:
            'No se encontraron notas para esta búsqueda.',

          loadError:
            'No se pudieron cargar las notas.',

          updateError:
            'No se pudo actualizar la nota.',

          deleteError:
            'No se pudo eliminar la nota.',

          untitled:
            'Propiedad sin título',

          unknownLocation:
            'Ubicación no disponible',

          updated:
            'Actualizada',

          openListing:
            'Abrir Propiedad',

          edit:
            'Editar',

          delete:
            'Eliminar',

          save:
            'Guardar Cambios',

          saving:
            'Guardando...',

          cancel:
            'Cancelar',

          confirmDelete:
            '¿Eliminar esta nota?',

          confirm:
            'Sí, eliminar',

          results:
            'notas'
        }
      : {
          heading:
            'Property Notes',

          description:
            'Search all your private property notes saved across MarketHub.',

          searchPlaceholder:
            'Search by note, property, or location...',

          loading:
            'Loading notes...',

          empty:
            'You have not saved any property notes yet.',

          noResults:
            'No notes matched your search.',

          loadError:
            'Could not load property notes.',

          updateError:
            'Could not update the note.',

          deleteError:
            'Could not delete the note.',

          untitled:
            'Untitled Property',

          unknownLocation:
            'Location unavailable',

          updated:
            'Updated',

          openListing:
            'Open Listing',

          edit:
            'Edit',

          delete:
            'Delete',

          save:
            'Save Changes',

          saving:
            'Saving...',

          cancel:
            'Cancel',

          confirmDelete:
            'Delete this note?',

          confirm:
            'Yes, delete',

          results:
            'notes'
        }

  const loadNotes =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setErrorMessage('')

          const loadedNotes =
            await getUserPropertyNotes()

          if (
            loadedNotes.length === 0
          ) {
            setNotes([])
            return
          }

          const listingIds = [
            ...new Set(
              loadedNotes.map(
                note =>
                  note.listingId
              )
            )
          ]

          const {
            data: listingData,
            error: listingError
          } = await supabase
            .from('listings')
            .select(`
              id,
              title,
              transaction_type,
              property_type,
              province,
              canton,
              district
            `)
            .in(
              'id',
              listingIds
            )

          if (listingError) {
            throw listingError
          }

          const listingsById =
            new Map<
              string,
              ListingRecord
            >()

          for (
            const listing
            of listingData || []
          ) {
            const typedListing =
              listing as ListingRecord

            listingsById.set(
              typedListing.id,
              typedListing
            )
          }

          setNotes(
            loadedNotes.map(
              note => ({
                ...note,

                listing:
                  listingsById.get(
                    note.listingId
                  ) || null
              })
            )
          )
        } catch (error) {
          console.error(
            'LOAD MARKETHUB PROPERTY NOTES ERROR:',
            error
          )

          setErrorMessage(
            labels.loadError
          )
        } finally {
          setLoading(false)
        }
      },
      [
        labels.loadError
      ]
    )

  useEffect(() => {
    void loadNotes()

    function handleNotesUpdated() {
      void loadNotes()
    }

    window.addEventListener(
      'property-notes-updated',
      handleNotesUpdated
    )

    return () => {
      window.removeEventListener(
        'property-notes-updated',
        handleNotesUpdated
      )
    }
  }, [
    loadNotes
  ])

  const filteredNotes =
    useMemo(
      () => {
        const searchTerm =
          normalizeSearchText(
            search
          )

        if (!searchTerm) {
          return notes
        }

        return notes.filter(
          note => {
            const listing =
              note.listing

            const searchableText = [
              htmlToPlainText(
                note.content
              ),
              listing?.title,
              listing?.property_type,
              listing?.province,
              listing?.canton,
              listing?.district
            ]
              .filter(Boolean)
              .join(' ')

            return normalizeSearchText(
              searchableText
            ).includes(
              searchTerm
            )
          }
        )
      },
      [
        notes,
        search
      ]
    )

  function handleStartEdit(
    note: SearchablePropertyNote
  ) {
    setEditingNoteId(
      note.id
    )

    setEditDraft(
      note.content
    )

    setDeletingNoteId(
      null
    )

    setErrorMessage('')
  }

  function handleCancelEdit() {
    setEditingNoteId(
      null
    )

    setEditDraft('')
  }

  async function handleUpdateNote(
    noteId: string
  ) {
    if (
      !hasNoteContent(
        editDraft
      ) ||
      savingNoteId
    ) {
      return
    }

    try {
      setSavingNoteId(
        noteId
      )

      setErrorMessage('')

      const updatedNote =
        await updatePropertyNote(
          noteId,
          editDraft
        )

      setNotes(
        currentNotes =>
          currentNotes.map(
            note =>
              note.id === noteId
                ? {
                    ...note,
                    ...updatedNote
                  }
                : note
          )
      )

      setEditingNoteId(
        null
      )

      setEditDraft('')
    } catch (error) {
      console.error(
        'UPDATE MARKETHUB PROPERTY NOTE ERROR:',
        error
      )

      setErrorMessage(
        labels.updateError
      )
    } finally {
      setSavingNoteId(
        null
      )
    }
  }

  async function handleDeleteNote(
    noteId: string
  ) {
    if (
      deletingNoteId !== noteId
    ) {
      setDeletingNoteId(
        noteId
      )

      setEditingNoteId(
        null
      )

      return
    }

    try {
      setErrorMessage('')

      await deletePropertyNote(
        noteId
      )

      setNotes(
        currentNotes =>
          currentNotes.filter(
            note =>
              note.id !== noteId
          )
      )

      setDeletingNoteId(
        null
      )
    } catch (error) {
      console.error(
        'DELETE MARKETHUB PROPERTY NOTE ERROR:',
        error
      )

      setErrorMessage(
        labels.deleteError
      )
    }
  }

  return (
    <section
      id="property-notes"
      style={container}
    >
      <div style={header}>
        <div>
          <h2 style={heading}>
            {labels.heading}
          </h2>

          <p style={description}>
            {labels.description}
          </p>
        </div>

        {!loading && (
          <div style={noteCount}>
            {filteredNotes.length}{' '}
            {labels.results}
          </div>
        )}
      </div>

      <div style={searchContainer}>
        <input
          type="search"
          value={search}
          onChange={event =>
            setSearch(
              event.target.value
            )
          }
          placeholder={
            labels.searchPlaceholder
          }
          style={searchInput}
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              setSearch('')
            }
            style={clearButton}
            aria-label={
              language === 'es'
                ? 'Limpiar búsqueda'
                : 'Clear search'
            }
          >
            ×
          </button>
        )}
      </div>

      {errorMessage && (
        <p style={errorText}>
          {errorMessage}
        </p>
      )}

      {loading ? (
        <div style={emptyState}>
          {labels.loading}
        </div>
      ) : notes.length === 0 ? (
        <div style={emptyState}>
          {labels.empty}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div style={emptyState}>
          {labels.noResults}
        </div>
      ) : (
        <div style={notesGrid}>
          {filteredNotes.map(
            note => {
              const listing =
                note.listing

              const isEditing =
                editingNoteId ===
                note.id

              const isDeleting =
                deletingNoteId ===
                note.id

              const isSaving =
                savingNoteId ===
                note.id

              const title =
                listing?.title ||
                labels.untitled

              const location =
                formatLocation(
                  listing,
                  labels.unknownLocation
                )

              const listingUrl =
                getListingUrl(
                  note.listingId,
                  listing
                    ?.transaction_type,
                  language
                )

              return (
                <article
                  key={note.id}
                  style={noteCard}
                >
                  <div style={propertyHeader}>
                    <div>
                      <h3 style={propertyTitle}>
                        {title}
                      </h3>

                      <p style={propertyLocation}>
                        {location}
                      </p>

                      {listing
                        ?.property_type && (
                        <span
                          style={
                            propertyTypeBadge
                          }
                        >
                          {
                            listing.property_type
                          }
                        </span>
                      )}
                    </div>

                    <time style={updatedAt}>
                      {labels.updated}{' '}
                      {new Date(
                        note.updatedAt
                      ).toLocaleString(
                        language === 'es'
                          ? 'es-CR'
                          : 'en-US',
                        {
                          dateStyle:
                            'medium',
                          timeStyle:
                            'short'
                        }
                      )}
                    </time>
                  </div>

                  {isEditing ? (
                    <>
                      <PropertyNoteEditor
                        value={editDraft}
                        onChange={
                          setEditDraft
                        }
                        placeholder={
                          language === 'es'
                            ? 'Edite esta nota...'
                            : 'Edit this note...'
                        }
                        disabled={
                          isSaving
                        }
                      />

                      <div style={actions}>
                        <button
                          type="button"
                          onClick={() =>
                            void handleUpdateNote(
                              note.id
                            )
                          }
                          disabled={
                            isSaving ||
                            !hasNoteContent(
                              editDraft
                            )
                          }
                          style={{
                            ...primaryButton,

                            opacity:
                              isSaving ||
                              !hasNoteContent(
                                editDraft
                              )
                                ? 0.5
                                : 1,

                            cursor:
                              isSaving ||
                              !hasNoteContent(
                                editDraft
                              )
                                ? 'not-allowed'
                                : 'pointer'
                          }}
                        >
                          {isSaving
                            ? labels.saving
                            : labels.save}
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleCancelEdit
                          }
                          disabled={
                            isSaving
                          }
                          style={
                            secondaryButton
                          }
                        >
                          {labels.cancel}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="markethub-property-note-rendered"
                        style={noteContent}
                        dangerouslySetInnerHTML={{
                          __html:
                            DOMPurify.sanitize(
                              note.content
                            )
                        }}
                      />

                      <div style={footer}>
                        <Link
                          href={listingUrl}
                          style={listingLink}
                        >
                          {labels.openListing}
                        </Link>

                        <div style={actions}>
                          {isDeleting ? (
                            <>
                              <span
                                style={
                                  confirmText
                                }
                              >
                                {
                                  labels.confirmDelete
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteNote(
                                    note.id
                                  )
                                }
                                style={
                                  dangerButton
                                }
                              >
                                {labels.confirm}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingNoteId(
                                    null
                                  )
                                }
                                style={
                                  secondaryButton
                                }
                              >
                                {labels.cancel}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEdit(
                                    note
                                  )
                                }
                                style={
                                  secondaryButton
                                }
                              >
                                {labels.edit}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteNote(
                                    note.id
                                  )
                                }
                                style={
                                  deleteButton
                                }
                              >
                                {labels.delete}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </article>
              )
            }
          )}
        </div>
      )}

      <style jsx global>{`
        .markethub-property-note-rendered p {
          margin: 0 0 0.75rem;
        }

        .markethub-property-note-rendered p:last-child {
          margin-bottom: 0;
        }

        .markethub-property-note-rendered ul,
        .markethub-property-note-rendered ol {
          margin: 0.5rem 0;
          padding-left: 1.4rem;
        }

        .markethub-property-note-rendered blockquote {
          margin: 0.75rem 0;
          padding-left: 0.85rem;
          color: #aaa;
          border-left: 3px solid #c7a44b;
        }

        .markethub-property-note-rendered h3 {
          margin: 0.75rem 0 0.5rem;
          color: #fff;
        }
      `}</style>
    </section>
  )
}

function htmlToPlainText(
  value: string
): string {
  if (
    typeof document ===
    'undefined'
  ) {
    return value
      .replace(
        /<[^>]*>/g,
        ' '
      )
      .replace(
        /&nbsp;/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
  }

  const container =
    document.createElement(
      'div'
    )

  container.innerHTML =
    DOMPurify.sanitize(
      value
    )

  return (
    container.textContent || ''
  )
    .replace(
      /\u00a0/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function normalizeSearchText(
  value: string
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim()
}

function hasNoteContent(
  value: string
): boolean {
  return (
    htmlToPlainText(
      value
    ).length > 0
  )
}

function formatLocation(
  listing: ListingRecord | null,
  fallback: string
): string {
  if (!listing) {
    return fallback
  }

  const locationParts = [
    listing.province,
    listing.canton,
    listing.district
  ].filter(
    (
      value
    ): value is string =>
      Boolean(value)
  )

  return (
    locationParts.join(
      ' → '
    ) || fallback
  )
}

function getListingUrl(
  listingId: string,
  transactionType:
    string | null | undefined,
  language: 'en' | 'es'
): string {
  const normalizedType =
    transactionType
      ?.toLowerCase()
      .trim() || ''

  const isRental =
    normalizedType.includes(
      'rent'
    ) ||
    normalizedType.includes(
      'lease'
    ) ||
    normalizedType.includes(
      'alquiler'
    ) ||
    normalizedType.includes(
      'arrendar'
    )

  if (language === 'es') {
    return isRental
      ? `/es/alquilar-arrendar/listing/${listingId}`
      : `/es/comprar/listing/${listingId}`
  }

  return isRental
    ? `/en/rent-lease/listing/${listingId}`
    : `/en/buy/listing/${listingId}`
}

const container = {
  display: 'grid',
  gap: '1.25rem',
  maxWidth: '1200px',
  margin:
    '1.25rem auto 0',
  padding: '1.5rem',
  background: '#0d0d0d',
  border:
    '1px solid #222',
  borderRadius: '1.5rem'
}

const header = {
  display: 'flex',
  alignItems:
    'flex-start',
  justifyContent:
    'space-between',
  gap: '1rem',
  flexWrap: 'wrap' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.6rem'
}

const description = {
  maxWidth: '680px',
  margin:
    '.45rem 0 0',
  color: '#888',
  fontSize: '.9rem',
  lineHeight: 1.6
}

const noteCount = {
  padding:
    '.45rem .75rem',
  color: '#c7a44b',
  background:
    '#18150d',
  border:
    '1px solid #4a3d1b',
  borderRadius: '999px',
  fontSize: '.78rem',
  fontWeight: 700
}

const searchContainer = {
  position:
    'relative' as const
}

const searchInput = {
  width: '100%',
  padding:
    '.85rem 2.75rem .85rem 1rem',
  color: '#fff',
  background: '#111',
  border:
    '1px solid #333',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontSize: '.9rem',
  outline: 'none',
  boxSizing:
    'border-box' as const
}

const clearButton = {
  position:
    'absolute' as const,
  top: '50%',
  right: '.7rem',
  transform:
    'translateY(-50%)',
  width: '1.8rem',
  height: '1.8rem',
  padding: 0,
  color: '#aaa',
  background:
    'transparent',
  border: 'none',
  fontSize: '1.35rem',
  lineHeight: 1,
  cursor: 'pointer'
}

const notesGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
  gap: '1rem'
}

const noteCard = {
  display: 'grid',
  alignContent: 'start',
  gap: '1rem',
  padding: '1.1rem',
  background: '#141414',
  border:
    '1px solid #303030',
  borderRadius: '12px'
}

const propertyHeader = {
  display: 'flex',
  alignItems:
    'flex-start',
  justifyContent:
    'space-between',
  gap: '1rem',
  flexWrap: 'wrap' as const
}

const propertyTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1.05rem',
  lineHeight: 1.4
}

const propertyLocation = {
  margin:
    '.35rem 0 .5rem',
  color: '#888',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const propertyTypeBadge = {
  display:
    'inline-block',
  padding:
    '.3rem .5rem',
  color: '#bbb',
  background: '#222',
  border:
    '1px solid #3a3a3a',
  borderRadius: '6px',
  fontSize: '.7rem'
}

const updatedAt = {
  color: '#666',
  fontSize: '.7rem',
  lineHeight: 1.4
}

const noteContent = {
  maxHeight: '240px',
  overflow: 'auto',
  padding: '.9rem',
  color: '#ddd',
  background: '#101010',
  border:
    '1px solid #292929',
  borderRadius: '9px',
  fontSize: '.88rem',
  lineHeight: 1.6,
  overflowWrap:
    'anywhere' as const
}

const footer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent:
    'space-between',
  gap: '.75rem',
  flexWrap: 'wrap' as const
}

const listingLink = {
  color: '#c7a44b',
  fontSize: '.82rem',
  fontWeight: 700,
  textDecoration: 'none'
}

const actions = {
  display: 'flex',
  alignItems: 'center',
  gap: '.5rem',
  flexWrap: 'wrap' as const
}

const primaryButton = {
  width: 'fit-content',
  padding:
    '.65rem .9rem',
  color: '#000',
  background: '#c7a44b',
  border: 'none',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontWeight: 700
}

const secondaryButton = {
  padding:
    '.55rem .75rem',
  color: '#ddd',
  background: '#1b1b1b',
  border:
    '1px solid #444',
  borderRadius: '8px',
  fontFamily: 'inherit',
  cursor: 'pointer'
}

const deleteButton = {
  padding:
    '.55rem .75rem',
  color: '#e58b8b',
  background: '#1b1b1b',
  border:
    '1px solid #5c3030',
  borderRadius: '8px',
  fontFamily: 'inherit',
  cursor: 'pointer'
}

const dangerButton = {
  padding:
    '.55rem .75rem',
  color: '#fff',
  background: '#8f2d2d',
  border:
    '1px solid #b34747',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer'
}

const confirmText = {
  color: '#aaa',
  fontSize: '.78rem'
}

const errorText = {
  margin: 0,
  color: '#e58b8b',
  fontSize: '.85rem'
}

const emptyState = {
  padding: '1.25rem',
  color: '#777',
  background: '#111',
  border:
    '1px dashed #333',
  borderRadius: '10px',
  textAlign:
    'center' as const
}