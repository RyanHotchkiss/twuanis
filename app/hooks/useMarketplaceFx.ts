'use client'

import { useEffect, useState } from 'react'
import { marketplaceDate, validateMarketplaceFx, type MarketplaceFxEvidence } from '@/lib/marketplace-fx-evidence'

export function useMarketplaceFx() {
  const [fxEvidence, setFxEvidence] = useState<MarketplaceFxEvidence | null>(null)
  useEffect(() => {
    let cancelled = false
    let pending = false
    let loadedDate = ''
    const controller = new AbortController()
    async function loadFx() {
      const date = marketplaceDate()
      if (date !== loadedDate) setFxEvidence(null)
      if (pending || date === loadedDate) return
      pending = true
      try {
        const response = await fetch('/api/marketplace-fx', { cache: 'no-store', signal: controller.signal })
        const evidence = response.ok ? validateMarketplaceFx(await response.json(), marketplaceDate()) : null
        if (!cancelled) { setFxEvidence(evidence); loadedDate = evidence?.analyticalDate ?? '' }
      } catch {
        if (!cancelled) setFxEvidence(null)
      } finally { pending = false }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void loadFx() }
    void loadFx()
    const timer = window.setInterval(() => void loadFx(), 60_000)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', onVisible); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  return fxEvidence && fxEvidence.analyticalDate === marketplaceDate() ? fxEvidence : null
}
