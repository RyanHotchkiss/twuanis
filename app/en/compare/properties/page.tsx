'use client'

import {
  Suspense
} from 'react'

import {
  useSearchParams
} from 'next/navigation'

import TopBar
  from '@/app/components/TopBar'

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
      <TopBar />

      <ComparisonShell
        language="en"
        activeKind="property"
        title={
          hasActiveComparison
            ? 'Property Comparison'
            : 'Property Comparisons'
        }
        description={
          hasActiveComparison
            ? 'Compare selected Costa Rica property listings side by side.'
            : 'Compare saved groups of individual Costa Rica property listings.'
        }
      >
        {hasActiveComparison ? (
          <PropertyComparisonEngine
            language="en"
          />
        ) : (
          <PropertyComparisonPanel
            language="en"
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