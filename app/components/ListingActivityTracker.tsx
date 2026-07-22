'use client'

import {
  useEffect,
  useRef
} from 'react'

import {
  recordPropertyViewed
} from '@/lib/activity'

type ListingActivityTrackerProps = {
  listingId: string
  title?: string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  propertyType?: string | null
  transactionType:
    | 'buy'
    | 'rent'
    | 'lease'
}

export default function ListingActivityTracker({
  listingId,
  title,
  province,
  canton,
  district,
  propertyType,
  transactionType
}: ListingActivityTrackerProps) {
  const hasTracked =
    useRef(false)

  useEffect(() => {
    if (hasTracked.current) {
      return
    }

    const storageKey =
      `twuanis:listing-viewed:${listingId}`

    if (
      window.sessionStorage.getItem(
        storageKey
      )
    ) {
      hasTracked.current = true
      return
    }

    hasTracked.current = true

    async function recordView() {
        try {
            await recordPropertyViewed({
            propertyId: listingId,
            metadata: {
                title: title ?? undefined,
                location: [
                district,
                canton,
                province
                ]
                .filter(Boolean)
                .join(', '),
                source: transactionType,
                href: window.location.pathname,
                propertyType,
                pathname:
                window.location.pathname
            }
            })

            window.sessionStorage.setItem(
            storageKey,
            'true'
            )
        } catch (activityError) {
            console.error(
            'Unable to record listing view:',
            activityError
            )
        }
        }

    void recordView()
  }, [
    listingId,
    title,
    province,
    canton,
    district,
    propertyType,
    transactionType
  ])

  return null
}