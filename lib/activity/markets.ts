const RECENT_MARKETS_KEY =
  'recently-viewed-markets'

import {
  recordRecentActivity
} from '@/lib/account-storage'

export function getRecentlyViewedMarkets() {
  if (typeof window === 'undefined') {
    return []
  }

  return JSON.parse(
    localStorage.getItem(
      RECENT_MARKETS_KEY
    ) || '[]'
  )
}

export function recordMarketViewed(
  market: {
    id: string
    title: string
    type: string
    href: string
    summary?: string | null
  }
) {
  if (typeof window === 'undefined') {
    return
  }

  const updated = [
    {
      ...market,
      viewedAt: new Date().toISOString()
    },
    ...getRecentlyViewedMarkets().filter(
      (item: any) =>
        item.id !== market.id
    )
  ].slice(0, 25)

  localStorage.setItem(
    RECENT_MARKETS_KEY,
    JSON.stringify(updated)
  )

  window.dispatchEvent(
    new Event(
      'recent-markets-updated'
    )
  )

  recordRecentActivity(
    'market_viewed',
    'market',
    market.id,
    market
  )
}