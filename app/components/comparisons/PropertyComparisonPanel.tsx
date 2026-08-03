'use client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import ComparisonCard from './ComparisonCard'

import {
  deletePropertyComparison,
  duplicatePropertyComparison,
  getPropertyComparisons,
  updatePropertyComparison,
  type MarketHubPropertyComparison
} from '@/lib/property-comparisons'

import type {
  ComparisonLanguage
} from '@/lib/comparisons/types'

type PropertyComparisonPanelProps = {
  language: ComparisonLanguage
}

export default function PropertyComparisonPanel({
  language
}: PropertyComparisonPanelProps) {
  const [
    comparisons,
    setComparisons
  ] = useState<
    MarketHubPropertyComparison[]
  >([])

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState<string | null>(null)

  const loadComparisons =
    useCallback(async () => {
      try {
        setLoading(true)
        setError(null)

        const rows =
          await getPropertyComparisons({
            language
          })

        setComparisons(rows)
      } catch (loadError) {
        console.error(
          'PROPERTY COMPARISONS ERROR:',
          loadError
        )

        setError(
          language === 'es'
            ? 'No se pudieron cargar las comparaciones de propiedades.'
            : 'Property comparisons could not be loaded.'
        )
      } finally {
        setLoading(false)
      }
    }, [language])

  useEffect(() => {
    void loadComparisons()
  }, [loadComparisons])

  async function handleDelete(
      comparisonId: string
    ) {
      await deletePropertyComparison(
        comparisonId
      )

      setComparisons(current =>
        current.filter(
          comparison =>
            comparison.id !== comparisonId
        )
      )
    }

    async function handleRename(
      comparisonId: string,
      currentTitle: string
    ) 
    {
      const name = window.prompt(
        language === 'es'
          ? 'Nuevo nombre de la comparación'
          : 'New comparison name',
        currentTitle
      )

      if (!name?.trim()) {
        return
      }

      await updatePropertyComparison({
        comparisonId,
        name,
        language
      })

      setComparisons(current =>
        current.map(comparison =>
          comparison.id === comparisonId
            ? {
                ...comparison,
                title: name.trim()
              }
            : comparison
        )
      )
    }

    async function handleDuplicate(
      comparisonId: string
    ) {
      const comparison =
        await duplicatePropertyComparison({
          comparisonId,
          language
        })

      await loadComparisons()
    }

  if (loading) {
    return (
      <PanelMessage>
        {language === 'es'
          ? 'Cargando comparaciones...'
          : 'Loading comparisons...'}
      </PanelMessage>
    )
  }

  if (error) {
    return (
      <PanelMessage>
        {error}
      </PanelMessage>
    )
  }

  if (!comparisons.length) {
    return (
      <EmptyState
        title={
          language === 'es'
            ? 'No hay comparaciones guardadas'
            : 'No saved comparisons'
        }
        description={
          language === 'es'
            ? 'Selecciona dos o más propiedades para crear una comparación.'
            : 'Select two or more properties to create a comparison.'
        }
      />
    )
  }

  return (
    <div style={grid}>
      {comparisons.map(comparison => (
        <ComparisonCard
          key={comparison.id}
          {...comparison}
          language={language}
          countLabel={
            language === 'es'
              ? `${comparison.propertyCount} propiedades`
              : `${comparison.propertyCount} properties`
          }
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

function PanelMessage({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div style={message}>
      {children}
    </div>
  )
}

function EmptyState({
  title,
  description
}: {
  title: string
  description: string
}) {
  return (
    <div style={empty}>
      <h2 style={emptyTitle}>
        {title}
      </h2>

      <p style={emptyDescription}>
        {description}
      </p>
    </div>
  )
}

const grid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem'
}

const message = {
  padding: '2rem',
  border: '1px solid #262626',
  borderRadius: '16px',
  background: '#111',
  color: '#aaa',
  textAlign: 'center' as const
}

const empty = {
  padding: '3rem 2rem',
  border: '1px dashed #333',
  borderRadius: '16px',
  textAlign: 'center' as const
}

const emptyTitle = {
  margin: 0,
  color: '#fff'
}

const emptyDescription = {
  maxWidth: '520px',
  margin: '0.75rem auto 0',
  color: '#888',
  lineHeight: 1.6
}