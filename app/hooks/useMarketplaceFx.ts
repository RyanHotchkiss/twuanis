'use client'

import {
  useEffect,
  useState
} from 'react'

type MarketplaceFxEvidence = {
  usdToCrcRate: number
  analyticalDate: string
  effectiveDate: string
  source: string
  rateType: string
  resolutionMode: string
}

export function useMarketplaceFx() {
  const [
    fxEvidence,
    setFxEvidence
  ] = useState<MarketplaceFxEvidence | null>(
    null
  )

  useEffect(() => {
    let cancelled = false

    async function loadFx() {
      try {
        const response =
          await fetch(
            '/api/marketplace-fx'
          )

        if (!response.ok) {
          return
        }

        const data =
          await response.json()

        if (
          cancelled ||
          !Number.isFinite(
            Number(data.usdToCrcRate)
          ) ||
          Number(data.usdToCrcRate) <= 0
        ) {
          return
        }

        setFxEvidence({
          usdToCrcRate:
            Number(data.usdToCrcRate),

          analyticalDate:
            String(data.analyticalDate),

          effectiveDate:
            String(data.effectiveDate),

          source:
            String(data.source),

          rateType:
            String(data.rateType),

          resolutionMode:
            String(data.resolutionMode)
        })
      } catch {
        // Fail closed.
      }
    }

    loadFx()

    return () => {
      cancelled = true
    }
  }, [])

  return fxEvidence
}