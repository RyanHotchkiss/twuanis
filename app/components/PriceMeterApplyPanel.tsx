'use client'

import { startTransition, useState } from 'react'
import MarketFilters from '@/app/components/MarketFilters'
import AnalysisActions from '@/app/components/AnalysisActions'
import PriceMeterResults from '@/app/price-per-square-meter/PriceMeterResults'
import ResultadosPrecioMetro from '@/app/es/precio-por-metro-cuadrado/ResultadosPrecioMetro'
import { executePriceMeterApply } from '@/lib/price-meter-apply-action'
import { validatePriceMeterApply, type PriceMeterApplyFilters } from '@/lib/price-meter-apply-contract'

type Result = Awaited<ReturnType<typeof executePriceMeterApply>>

export default function PriceMeterApplyPanel({ options, filters, language, source }: {
  options: any
  filters: Record<string, string | undefined>
  language: 'en' | 'es'
  source: 'workspace' | 'standalone'
}) {
  const [applied, setApplied] = useState<{ filters: PriceMeterApplyFilters; result: Result } | null>(null)
  const spanish = language === 'es'

  function apply(draft: Record<string, string | undefined>): Promise<void> {
    const snapshot = validatePriceMeterApply(draft)
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await executePriceMeterApply(snapshot, language, source)
          // Replace result and its identity together, only after success.
          setApplied({ filters: snapshot, result })
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  return <>
    <MarketFilters workspace="price-meter" options={options} filters={filters}
      language={language} onApply={apply} appliedFilters={applied?.filters} />
    {applied ? <>
      <AnalysisActions engineType="price-meter" language={language}
        filters={applied.filters} result={applied.result}
        defaultName={spanish ? 'Precio por Metro Cuadrado' : 'Price per Square Meter'} />
      {spanish
        ? <ResultadosPrecioMetro filters={applied.filters} analysis={applied.result} />
        : <PriceMeterResults filters={applied.filters} analysis={applied.result} />}
    </> : <p role="status" style={{ color: '#aaa' }}>
      {spanish ? 'Aplica los filtros para generar el análisis.' : 'Apply Filters to generate the analysis.'}
    </p>}
  </>
}
