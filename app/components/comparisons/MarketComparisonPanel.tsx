'use client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import ComparisonCard from './ComparisonCard'

import {
  deleteMarketComparison,
  getMarketComparisons,
  type MarketHubMarketComparison
} from '@/lib/market-comparisons'

import type {
  ComparisonLanguage
} from '@/lib/comparisons/types'

type MarketComparisonPanelProps = {
  language: ComparisonLanguage
}

export default function MarketComparisonPanel({
  language
}: MarketComparisonPanelProps) {
  const [
    comparisons,
    setComparisons
  ] = useState<
    MarketHubMarketComparison[]
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
          await getMarketComparisons({
            language
          })

        setComparisons(rows)
      } catch (loadError) {
        console.error(
          'MARKET COMPARISONS ERROR:',
          loadError
        )

        setError(
          language === 'es'
            ? 'No se pudieron cargar las comparaciones de mercados.'
            : 'Market comparisons could not be loaded.'
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
    await deleteMarketComparison(
      comparisonId
    )

    setComparisons(current =>
      current.filter(
        comparison =>
          comparison.id !== comparisonId
      )
    )
  }

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
            ? 'No hay comparaciones guardadas'
            : 'No saved comparisons'}
        </h2>

        <p style={emptyDescription}>
          {language === 'es'
            ? 'Ejecuta una comparación de mercados y guárdala para verla aquí.'
            : 'Run a market comparison and save it to view it here.'}
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
              ? `${comparison.marketCount} mercados`
              : `${comparison.marketCount} markets`
          }
          onDelete={handleDelete}
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