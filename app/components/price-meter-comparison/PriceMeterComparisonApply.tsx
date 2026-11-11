'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { executePriceMeterComparison } from '@/lib/price-meter-comparison-action'

export default function PriceMeterComparisonApply({ filters, language }: {
  filters: Record<string, string | undefined>; language: 'en' | 'es'
}) {
  const [result, setResult] = useState<ReactNode>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const spanish = language === 'es'
  return <>
    <button type="button" disabled={pending} onClick={() => {
      const snapshot = { ...filters }
      setError(null)
      startTransition(async () => {
        try { setResult(await executePriceMeterComparison(snapshot, language)) }
        catch { setError(spanish ? 'No se pudo completar la comparación. Revisa los filtros y tu acceso.' : 'Unable to complete the comparison. Check your filters and access.') }
      })
    }}>{pending ? (spanish ? 'Comparando…' : 'Comparing…') : (spanish ? 'Comparar' : 'Compare')}</button>
    {error && <p role="alert">{error}</p>}
    {result ?? <p role="status">{spanish ? 'Selecciona los filtros y pulsa Comparar.' : 'Select filters and click Compare.'}</p>}
  </>
}
