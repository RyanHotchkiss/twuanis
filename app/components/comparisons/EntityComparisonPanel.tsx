'use client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import ComparisonCard from './ComparisonCard'

import {
  getMarketHubEntityComparisons,
  type MarketHubEntityComparison
} from '@/lib/entity-comparisons'

import type {
  ComparisonLanguage
} from '@/lib/comparisons/types'

type EntityComparisonPanelProps = {
  language: ComparisonLanguage
}

export default function EntityComparisonPanel({
  language
}: EntityComparisonPanelProps) {
  const [
    comparisons,
    setComparisons
  ] = useState<
    MarketHubEntityComparison[]
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
          await getMarketHubEntityComparisons({
            language
          })

        setComparisons(rows)
      } catch (loadError) {
        console.error(
          'ENTITY COMPARISONS ERROR:',
          loadError
        )

        setError(
          language === 'es'
            ? 'No se pudieron cargar las comparaciones de entidades.'
            : 'Entity comparisons could not be loaded.'
        )
      } finally {
        setLoading(false)
      }
    }, [language])

  useEffect(() => {
    void loadComparisons()
  }, [loadComparisons])

  if (loading) {
    return (
      <div style={message}>
        {language === 'es'
          ? 'Cargando comparaciones...'
          : 'Loading comparisons...'}
      </div>
    )
  }

  if (error) {
    return (
      <div style={message}>
        {error}
      </div>
    )
  }

  if (!comparisons.length) {
    return (
      <div style={empty}>
        <h2 style={emptyTitle}>
          {language === 'es'
            ? 'No hay comparaciones disponibles'
            : 'No comparisons available'}
        </h2>

        <p style={emptyDescription}>
          {language === 'es'
            ? 'Las comparaciones aparecerán cuando se calculen estadísticas entre entidades.'
            : 'Comparisons will appear after statistics are calculated between entities.'}
        </p>
      </div>
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
              ? `${comparison.metricCount} métricas`
              : `${comparison.metricCount} metrics`
          }
        />
      ))}
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