'use client'

import {
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import EmailAuthModal
  from '@/app/components/EmailAuthModal'

import {
  savePropertyComparison
} from '@/lib/property-comparisons'

import {
  usePropertyComparisonSelection
} from '@/lib/property-comparison-selection'

import {
  supabase
} from '@/lib/supabase'

type PropertySummary = {
  id: string
  title?: string | null
}

type PropertyComparisonTrayProps = {
  properties: PropertySummary[]
  language: 'en' | 'es'
}

export default function PropertyComparisonTray({
  properties,
  language
}: PropertyComparisonTrayProps) {
  const router =
    useRouter()

  const {
    propertyIds,
    removeProperty,
    clear
  } =
    usePropertyComparisonSelection()

  const [
    saving,
    setSaving
  ] = useState(false)

  const [
    error,
    setError
  ] = useState('')

  const [
    showAuth,
    setShowAuth
  ] = useState(false)

  const spanish =
    language === 'es'

  const selectedProperties =
    propertyIds.map(propertyId => {
      const property =
        properties.find(
          item =>
            item.id === propertyId
        )

      return {
        id: propertyId,
        title:
          property?.title ||
          (
            spanish
              ? 'Propiedad seleccionada'
              : 'Selected property'
          )
      }
    })

  if (!propertyIds.length) {
    return null
  }

  async function handleCompare() {
    setError('')

    if (propertyIds.length < 2) {
      setError(
        spanish
          ? 'Selecciona al menos dos propiedades.'
          : 'Select at least two properties.'
      )

      return
    }

    const {
      data: {
        session
      }
    } =
      await supabase.auth.getSession()

    if (!session?.user) {
      setShowAuth(true)
      return
    }

    try {
      setSaving(true)

      await savePropertyComparison({
        name:
          spanish
            ? 'Comparación de propiedades'
            : 'Property Comparison',

        propertyIds,

        language
      })

      const params =
        new URLSearchParams()

      propertyIds.forEach(
        propertyId => {
          params.append(
            'property',
            propertyId
          )
        }
      )

      router.push(
        spanish
          ? `/es/comparar/propiedades?${params.toString()}`
          : `/en/compare/properties?${params.toString()}`
      )
    } catch (saveError) {
      console.error(
        'PROPERTY COMPARISON SAVE ERROR:',
        {
            error: saveError,
            message:
            saveError instanceof Error
                ? saveError.message
                : (saveError as any)?.message,
            code:
            (saveError as any)?.code,
            details:
            (saveError as any)?.details,
            hint:
            (saveError as any)?.hint,
            propertyIds
        }
        )

      const errorMessage =
        saveError instanceof Error
            ? saveError.message
            : (saveError as any)?.message

        setError(
        errorMessage ||
            (
            spanish
                ? 'No se pudo guardar la comparación.'
                : 'The comparison could not be saved.'
            )
        )
        
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {showAuth && (
        <EmailAuthModal
          onClose={() =>
            setShowAuth(false)
          }
          redirectTo={
            typeof window !== 'undefined'
              ? window.location.pathname
              : language === 'es'
              ? '/es/comprar'
              : '/en/buy'
          }
        />
      )}

      <aside style={tray}>
        <div style={header}>
          <div>
            <strong style={title}>
              {spanish
                ? `${propertyIds.length} seleccionadas`
                : `${propertyIds.length} selected`}
            </strong>

            <div style={limit}>
              {spanish
                ? 'Máximo 4 propiedades'
                : 'Maximum 4 properties'}
            </div>
          </div>

          <button
            type="button"
            onClick={clear}
            style={clearButton}
          >
            {spanish
              ? 'Limpiar'
              : 'Clear'}
          </button>
        </div>

        <div style={propertyList}>
          {selectedProperties.map(
            property => (
              <div
                key={property.id}
                style={propertyRow}
              >
                <span style={propertyTitle}>
                  {property.title}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removeProperty(
                      property.id
                    )
                  }
                  aria-label={
                    spanish
                      ? 'Eliminar propiedad'
                      : 'Remove property'
                  }
                  style={removeButton}
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleCompare}
          disabled={
            saving ||
            propertyIds.length < 2
          }
          style={{
            ...compareButton,

            opacity:
              propertyIds.length < 2 ||
              saving
                ? 0.5
                : 1,

            cursor:
              propertyIds.length < 2 ||
              saving
                ? 'not-allowed'
                : 'pointer'
          }}
        >
          {saving
            ? spanish
              ? 'Guardando...'
              : 'Saving...'
            : spanish
            ? 'Guardar y comparar'
            : 'Save and Compare'}
        </button>

        {error && (
          <p style={errorStyle}>
            {error}
          </p>
        )}
      </aside>
    </>
  )
}

const tray = {
  position: 'fixed' as const,
  right: '1.5rem',
  bottom: '1.5rem',
  zIndex: 1000,
  width: 'min(380px, calc(100vw - 2rem))',
  padding: '1rem',
  border: '1px solid #333',
  borderRadius: '18px',
  background: 'rgba(15,15,15,.96)',
  boxShadow:
    '0 20px 60px rgba(0,0,0,.55)',
  backdropFilter: 'blur(16px)',
  color: '#fff'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem'
}

const title = {
  display: 'block',
  color: '#fff',
  fontSize: '1rem'
}

const limit = {
  marginTop: '.25rem',
  color: '#777',
  fontSize: '.75rem'
}

const clearButton = {
  border: 0,
  background: 'transparent',
  color: '#aaa',
  cursor: 'pointer'
}

const propertyList = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.5rem',
  margin: '1rem 0'
}

const propertyRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '.75rem',
  padding: '.7rem .8rem',
  border: '1px solid #292929',
  borderRadius: '10px',
  background: '#171717'
}

const propertyTitle = {
  overflow: 'hidden',
  color: '#ddd',
  fontSize: '.85rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const
}

const removeButton = {
  flex: '0 0 auto',
  width: '1.75rem',
  height: '1.75rem',
  border: 0,
  borderRadius: '999px',
  background: '#292929',
  color: '#fff',
  cursor: 'pointer'
}

const compareButton = {
  width: '100%',
  border: '1px solid #fff',
  borderRadius: '999px',
  padding: '.85rem 1rem',
  background: '#fff',
  color: '#000',
  fontWeight: 700
}

const errorStyle = {
  margin: '.75rem 0 0',
  color: '#ff8a8a',
  fontSize: '.8rem',
  lineHeight: 1.4
}