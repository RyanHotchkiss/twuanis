'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  createPropertyNote,
  deletePropertyNote,
  getPropertyNotes,
  type PropertyNoteRecord,
  updatePropertyNote
} from '@/lib/property-notes'

type PropertyNotesProps = {
  listingId: string
  language: 'en' | 'es'
}

import DOMPurify
  from 'dompurify'

import PropertyNoteEditor
  from '@/app/components/PropertyNoteEditor'

export default function PropertyNotes({
  listingId,
  language
}: PropertyNotesProps) {
  const [
    notes,
    setNotes
  ] = useState<
    PropertyNoteRecord[]
  >([])

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    draft,
    setDraft
  ] = useState('')

  const [
    creating,
    setCreating
  ] = useState(false)

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

  const [
    errorMessage,
    setErrorMessage
  ] = useState('')

  const labels =
    language === 'es'
      ? {
          heading:
            'Mis Notas',
          description:
            'Guarde observaciones privadas sobre esta propiedad.',
          placeholder:
            'Escriba una nota sobre esta propiedad...',
          save:
            'Guardar Nota',
          saving:
            'Guardando...',
          empty:
            'Todavía no ha guardado notas sobre esta propiedad.',
          edit:
            'Editar',
          delete:
            'Eliminar',
          confirmDelete:
            '¿Eliminar esta nota?',
          confirm:
            'Sí, eliminar',
          cancel:
            'Cancelar',
          update:
            'Guardar Cambios',
          updating:
            'Guardando...',
          loadError:
            'No se pudieron cargar las notas.',
          createError:
            'No se pudo guardar la nota.',
          updateError:
            'No se pudo actualizar la nota.',
          deleteError:
            'No se pudo eliminar la nota.'
        }
      : {
          heading:
            'My Notes',
          description:
            'Save private observations about this property.',
          placeholder:
            'Write a note about this property...',
          save:
            'Save Note',
          saving:
            'Saving...',
          empty:
            'You have not saved any notes about this property yet.',
          edit:
            'Edit',
          delete:
            'Delete',
          confirmDelete:
            'Delete this note?',
          confirm:
            'Yes, delete',
          cancel:
            'Cancel',
          update:
            'Save Changes',
          updating:
            'Saving...',
          loadError:
            'Could not load property notes.',
          createError:
            'Could not save the note.',
          updateError:
            'Could not update the note.',
          deleteError:
            'Could not delete the note.'
        }

  useEffect(() => {
    let active = true

    async function loadNotes() {
      try {
        setLoading(true)
        setErrorMessage('')

        const loadedNotes =
          await getPropertyNotes(
            listingId
          )

        if (active) {
          setNotes(
            loadedNotes
          )
        }
      } catch (error) {
        console.error(
          'LOAD PROPERTY NOTES ERROR:',
          error
        )

        if (active) {
          setErrorMessage(
            labels.loadError
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadNotes()

    function handleNotesUpdated() {
      void loadNotes()
    }

    window.addEventListener(
      'property-notes-updated',
      handleNotesUpdated
    )

    return () => {
      active = false

      window.removeEventListener(
        'property-notes-updated',
        handleNotesUpdated
      )
    }
  }, [
    listingId,
    labels.loadError
  ])

  async function handleCreateNote() {
    const noteContent = draft

    if (
        !hasNoteContent(noteContent) ||
        creating
    ) {
        return
    }

    try {
        setCreating(true)
        setErrorMessage('')

        const createdNote =
        await createPropertyNote(
            listingId,
            noteContent
        )

        setNotes(
        currentNotes => [
            createdNote,
            ...currentNotes
        ]
        )

        setDraft('')
    } catch (error) {
        console.error(
        'CREATE PROPERTY NOTE ERROR:',
        error
        )

        setErrorMessage(
        labels.createError
        )
    } finally {
        setCreating(false)
    }
    }

  function handleStartEdit(
    note: PropertyNoteRecord
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
    const updatedContent =
        editDraft

    if (
        !hasNoteContent(
        updatedContent
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
            updatedContent
        )

        setNotes(
        currentNotes =>
            currentNotes.map(
            note =>
                note.id === noteId
                ? updatedNote
                : note
            )
        )

        setEditingNoteId(
        null
        )

        setEditDraft('')
    } catch (error) {
        console.error(
        'UPDATE PROPERTY NOTE ERROR:',
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
    if (deletingNoteId !== noteId) {
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
        'DELETE PROPERTY NOTE ERROR:',
        error
      )

      setErrorMessage(
        labels.deleteError
      )
    }
  }

  return (
    <section style={container}>
      <div style={header}>
        <h2 style={heading}>
          {labels.heading}
        </h2>

        <p style={description}>
          {labels.description}
        </p>
      </div>

      <div style={composer}>
        <PropertyNoteEditor
            value={draft}
            onChange={setDraft}
            placeholder={
                labels.placeholder
            }
            disabled={creating}
        />

        <button
          type="button"
          onClick={() =>
            void handleCreateNote()
          }
          disabled={
            creating ||
            !hasNoteContent(draft)
          }
          style={{
            ...primaryButton,
            opacity:
              creating ||
              !hasNoteContent(draft)
                ? 0.5
                : 1,
            cursor:
              creating ||
              !hasNoteContent(draft)
                ? 'not-allowed'
                : 'pointer'
          }}
        >
          {creating
            ? labels.saving
            : labels.save}
        </button>
      </div>

      {errorMessage && (
        <p style={errorText}>
          {errorMessage}
        </p>
      )}

      {loading ? (
        <div style={emptyState}>
          {language === 'es'
            ? 'Cargando notas...'
            : 'Loading notes...'}
        </div>
      ) : notes.length === 0 ? (
        <div style={emptyState}>
          {labels.empty}
        </div>
      ) : (
        <div style={notesList}>
          {notes.map(note => {
            const isEditing =
              editingNoteId ===
              note.id

            const isDeleting =
              deletingNoteId ===
              note.id

            const isSaving =
              savingNoteId ===
              note.id

            return (
              <article
                key={note.id}
                style={noteCard}
              >
                {isEditing ? (
                  <>
                    <PropertyNoteEditor
                        value={editDraft}
                        onChange={setEditDraft}
                        placeholder={
                            labels.placeholder
                        }
                        disabled={isSaving}
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
                          !hasNoteContent(editDraft)
                        }
                        style={primaryButton}
                      >
                        {isSaving
                          ? labels.updating
                          : labels.update}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleCancelEdit
                        }
                        disabled={isSaving}
                        style={secondaryButton}
                      >
                        {labels.cancel}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                        className="property-note-rendered"
                        style={noteContent}
                        dangerouslySetInnerHTML={{
                            __html:
                            DOMPurify.sanitize(
                                note.content
                            )
                        }}
                    />

                    <div style={noteFooter}>
                      <time
                        style={updatedAt}
                      >
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
          })}
        </div>
      )}

      <style jsx global>{`
        .property-note-rendered p {
            margin: 0 0 0.75rem;
        }

        .property-note-rendered p:last-child {
            margin-bottom: 0;
        }

        .property-note-rendered ul,
        .property-note-rendered ol {
            padding-left: 1.4rem;
        }

        .property-note-rendered blockquote {
            margin: 0.75rem 0;
            padding-left: 0.85rem;
            color: #aaa;
            border-left: 3px solid #c7a44b;
        }

        .property-note-rendered h3 {
            margin: 0.75rem 0 0.5rem;
            color: #fff;
        }
        `}</style>

    </section>
  )
}

function hasNoteContent(
  value: string
): boolean {
  if (
    typeof document ===
    'undefined'
  ) {
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
      .length > 0
  }

  const container =
    document.createElement('div')

  container.innerHTML =
    value

  return Boolean(
    container.textContent
      ?.replace(/\u00a0/g, ' ')
      .trim()
  )
}

const container = {
  display: 'grid',
  gap: '1rem',
  marginBottom: '2rem',
  padding: '1.25rem',
  background: '#0d0d0d',
  border: '1px solid #2a2a2a',
  borderRadius: '1rem'
}

const header = {
  display: 'grid',
  gap: '.35rem'
}

const heading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.15rem'
}

const description = {
  margin: 0,
  color: '#888',
  fontSize: '.85rem',
  lineHeight: 1.5
}

const composer = {
  display: 'grid',
  gap: '.75rem'
}

const textarea = {
  width: '100%',
  minHeight: '110px',
  resize: 'vertical' as const,
  padding: '.85rem',
  color: '#fff',
  background: '#111',
  border: '1px solid #3a3a3a',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontSize: '.9rem',
  lineHeight: 1.55,
  outline: 'none',
  boxSizing: 'border-box' as const
}

const primaryButton = {
  width: 'fit-content',
  padding: '.7rem 1rem',
  color: '#000',
  background: '#C7A44B',
  border: 'none',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontWeight: 700
}

const secondaryButton = {
  padding: '.55rem .75rem',
  color: '#ddd',
  background: '#1b1b1b',
  border: '1px solid #444',
  borderRadius: '8px',
  fontFamily: 'inherit',
  cursor: 'pointer'
}

const deleteButton = {
  padding: '.55rem .75rem',
  color: '#e58b8b',
  background: '#1b1b1b',
  border: '1px solid #5c3030',
  borderRadius: '8px',
  fontFamily: 'inherit',
  cursor: 'pointer'
}

const dangerButton = {
  padding: '.55rem .75rem',
  color: '#fff',
  background: '#8f2d2d',
  border: '1px solid #b34747',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer'
}

const errorText = {
  margin: 0,
  color: '#e58b8b',
  fontSize: '.85rem'
}

const emptyState = {
  padding: '1rem',
  color: '#777',
  background: '#111',
  border: '1px dashed #333',
  borderRadius: '10px',
  textAlign: 'center' as const
}

const notesList = {
  display: 'grid',
  gap: '.75rem'
}

const noteCard = {
  display: 'grid',
  gap: '.8rem',
  padding: '1rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '10px'
}

const noteContent = {
  margin: 0,
  color: '#ddd',
  fontSize: '.9rem',
  lineHeight: 1.6,
  overflowWrap:
    'anywhere' as const
}

const noteFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '.75rem',
  flexWrap: 'wrap' as const
}

const updatedAt = {
  color: '#777',
  fontSize: '.75rem'
}

const actions = {
  display: 'flex',
  alignItems: 'center',
  gap: '.5rem',
  flexWrap: 'wrap' as const
}

const confirmText = {
  color: '#aaa',
  fontSize: '.8rem'
}