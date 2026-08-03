'use client'

import {
  Suspense
} from 'react'

import {
  useSearchParams
} from 'next/navigation'

import TopBarES
  from '@/app/components/TopBarES'

import ComparisonShell
  from '@/app/components/comparisons/ComparisonShell'

import PropertyComparisonPanel
  from '@/app/components/comparisons/PropertyComparisonPanel'

import PropertyComparisonEngine
  from '@/app/components/comparisons/PropertyComparisonEngine'

export default function PropertyComparisonsPage() {
  return (
    <Suspense fallback={null}>
      <PropertyComparisonsContent />
    </Suspense>
  )
}

function PropertyComparisonsContent() {
  const searchParams =
    useSearchParams()

  const propertyIds =
    searchParams.getAll(
      'property'
    )

  const hasActiveComparison =
    propertyIds.length >= 2

  return (
    <main style={main}>
      <TopBarES />

      <ComparisonShell
        language="es"
        activeKind="property"
        title={
          hasActiveComparison
            ? 'Comparación de Propiedades'
            : 'Comparaciones de Propiedades'
        }
        description={
          hasActiveComparison
            ? 'Compara propiedades seleccionadas de Costa Rica lado a lado.'
            : 'Compara grupos guardados de propiedades individuales de Costa Rica.'
        }
      >
        {hasActiveComparison ? (
          <PropertyComparisonEngine
            language="es"
          />
        ) : (
          <PropertyComparisonPanel
            language="es"
          />
        )}
      </ComparisonShell>
    </main>
  )
}

const main = {
  minHeight: '100vh',
  background: '#0a0a0a',
  color: '#ededed'
}