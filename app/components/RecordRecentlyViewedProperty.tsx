'use client'

import { useEffect } from 'react'

import {
  recordPropertyViewed
} from '@/lib/activity/listings'

type Props = {
  listing: {
    id: string
    title: string
    images?: string[]
    province?: string
    canton?: string
    district?: string
    current_price?: number
    currency?: string
  }
}

export default function RecordRecentlyViewedProperty({
  listing
}: Props) {
  useEffect(() => {
    recordPropertyViewed({
      id: listing.id,
      title: listing.title,
      image: listing.images?.[0] ?? null,
      location: [
        listing.district,
        listing.canton,
        listing.province
      ]
        .filter(Boolean)
        .join(', '),
      price:
        listing.current_price
          ? `$${Number(
              listing.current_price
            ).toLocaleString()}`
          : null,
      href: `/en/buy/listing/${listing.id}`
    })
  }, [listing])

  return null
}