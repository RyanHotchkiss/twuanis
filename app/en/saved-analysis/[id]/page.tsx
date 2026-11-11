import {savedAnalysisDestination} from '@/lib/saved-analysis-destination'
import { loadAnalysis } from '@/lib/load-analysis'

import { notFound, redirect } from 'next/navigation'

import {
  recordRecentActivity
} from '@/lib/account-storage'

export default async function SavedAnalysisPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const analysis =
    await loadAnalysis(id)

  if (!analysis) notFound()

  const query = new URLSearchParams()

    await recordRecentActivity(
      'market_reopened',
      'market',
      analysis.id,
      {
        engine: analysis.engine_type,
        filters: analysis.filters
      }
    )

    redirect(
      savedAnalysisDestination(analysis,'en')
    )

}

const error = {
  maxWidth: '1200px',
  margin: '4rem auto',
  padding: '2rem',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  background: 'var(--surface)',
  color: 'var(--foreground)'
}