'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import {
  recordMarketViewed
} from '@/lib/activity/markets'

type MarketActivityTrackerProps = {
  id: string
  title: string
  type: string
  summary?: string | null
}

export default function MarketActivityTracker({
  id,
  title,
  type,
  summary
}: MarketActivityTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    recordMarketViewed({
      id,
      title,
      marketType: type,
      href: pathname,
      summary
    })
  }, [
    id,
    title,
    type,
    pathname,
    summary
  ])

  return null
}