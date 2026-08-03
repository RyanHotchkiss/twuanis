import { loadAnalysis } from '@/lib/load-analysis'

import { redirect } from 'next/navigation'

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

  const query = new URLSearchParams()

    const engineTabMap: Record<string, string> = {
            explorer: 'explorer',
            valuation: 'valuation',
            pricing: 'pricing-strategy',
            matching: 'property-matching',
            comparison: 'market-comparison',
            scarcity: 'market-frequency',
            'price-meter': 'price-per-square-meter',
            'buyer-demand': 'buyer-demand'
          }

          query.set(
            'tab',
            engineTabMap[analysis.engine_type] ??
              'explorer'
          )

    Object.entries(analysis.filters ?? {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {
          query.set(key, String(value))
        }
      }
    )

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
      `/en/market-intelligence?${query.toString()}`
    )

}

const error = {
  maxWidth: '1200px',
  margin: '4rem auto',
  padding: '2rem',
  border: '1px solid #333',
  borderRadius: '16px',
  background: '#111',
  color: '#fff'
}