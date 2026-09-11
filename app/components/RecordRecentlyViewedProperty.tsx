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
  }

  price:
    string | null

  href:
    string
}

export default function RecordRecentlyViewedProperty({
  listing,
  price,
  href
}: Props) {
  useEffect(() => {
    recordPropertyViewed({
      id:
        listing.id,

      title:
        listing.title,

      image:
        listing.images?.[0] ??
        null,

      location:
        [
          listing.district,
          listing.canton,
          listing.province
        ]
          .filter(Boolean)
          .join(', '),

      price,

      href
    })
  }, [
    listing,
    price,
    href
  ])

  return null
}