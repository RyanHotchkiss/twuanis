'use client'

import {
  FormEvent,
  useState
} from 'react'

import {
  createFavoriteCollection
} from '@/lib/collections'

type Props = {
  language:
    | 'en'
    | 'es'
}

export default function CreateCollectionButton({
  language
}: Props) {
  const [
    open,
    setOpen
  ] = useState(false)

  const [
    name,
    setName
  ] = useState('')

  const [
    saving,
    setSaving
  ] = useState(false)

  const [
    error,
    setError
  ] = useState('')

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      await createFavoriteCollection(
        name
      )

      setName('')
      setOpen(false)
    } catch (caughtError) {
      console.error(
        'CREATE COLLECTION ERROR:',
        caughtError
      )

      setError(
        language === 'es'
          ? 'No se pudo crear la colección.'
          : 'Unable to create the collection.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        style={button}
      >
        {language === 'es'
          ? 'Crear Colección'
          : 'Create Collection'}
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={form}
    >
      <input
        value={name}
        onChange={event =>
          setName(
            event.target.value
          )
        }
        placeholder={
          language === 'es'
            ? 'Nombre de la colección'
            : 'Collection name'
        }
        autoFocus
        style={input}
      />

      <div style={actions}>
        <button
          type="submit"
          disabled={
            saving ||
            !name.trim()
          }
          style={saveButton}
        >
          {saving
            ? language === 'es'
              ? 'Guardando...'
              : 'Saving...'
            : language === 'es'
            ? 'Guardar'
            : 'Save'}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setName('')
            setError('')
          }}
          style={cancelButton}
        >
          {language === 'es'
            ? 'Cancelar'
            : 'Cancel'}
        </button>
      </div>

      {error && (
        <p style={errorText}>
          {error}
        </p>
      )}
    </form>
  )
}

const button = {
  padding: 0,
  color: '#C7A44B',
  background: 'transparent',
  border: 'none',
  fontFamily: 'inherit',
  fontWeight: 600,
  cursor: 'pointer'
}

const form = {
  display: 'grid',
  gap: '.75rem',
  width: '100%',
  maxWidth: '360px'
}

const input = {
  width: '100%',
  padding: '.8rem',
  color: '#fff',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '10px',
  fontFamily: 'inherit'
}

const actions = {
  display: 'flex',
  gap: '.75rem'
}

const saveButton = {
  padding: '.65rem 1rem',
  color: '#000',
  background: '#C7A44B',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer'
}

const cancelButton = {
  padding: '.65rem 1rem',
  color: '#aaa',
  background: 'transparent',
  border: '1px solid #444',
  borderRadius: '8px',
  cursor: 'pointer'
}

const errorText = {
  margin: 0,
  color: '#ff6b6b',
  fontSize: '.8rem'
}