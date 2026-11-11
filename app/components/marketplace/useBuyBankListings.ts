'use client'

import { useEffect, useState } from 'react'
import { readBuyBankPage } from '@/app/actions/remates-buy'
import { collectBuyBankPages, type BuyBankListing } from '@/lib/remates/buy-marketplace'

export function useBuyBankListings(active: boolean, language: 'en' | 'es', bathrooms = '') {
  const [state, setState] = useState<{ listings: BuyBankListing[]; loading: boolean; error: boolean }>({ listings: [], loading: false, error: false })
  useEffect(() => {
    if (!active) {
      setState({ listings: [], loading: false, error: false })
      return
    }
    let cancelled = false
    setState({ listings: [], loading: true, error: false })
    collectBuyBankPages(page => readBuyBankPage(page, language, bathrooms ? {size: 50, filters: {bathrooms}} : undefined), () => cancelled, bathrooms ? 50 : 20)
      .then(listings => { if (!cancelled) setState({ listings, loading: false, error: false }) })
      .catch(() => { if (!cancelled) setState({ listings: [], loading: false, error: true }) })
    return () => { cancelled = true }
  }, [active, language, bathrooms])
  return state
}
