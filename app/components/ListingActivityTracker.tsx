'use client'
import {useListingSections} from './measurement/useListingSections'
import {internalDiscovery} from '@/lib/measurement/attribution'
import {context,once} from '@/lib/measurement/runtime'

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
  useListingSections(listingId)
  useEffect(()=>{const observe=()=>{if(document.visibilityState==='visible')once('tw_listing_view',{...context(location.pathname.startsWith('/es')?'es':'en'),listing_id:listingId,listing_market:'private',context_digest:'unknown',internal_discovery:internalDiscovery()},'listing:'+listingId)};observe();window.addEventListener('tw-measurement-consent',observe);document.addEventListener('visibilitychange',observe);return()=>{window.removeEventListener('tw-measurement-consent',observe);document.removeEventListener('visibilitychange',observe)}},[listingId])

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
        } catch {
          // Anonymous public listing views are not
          // persisted as authenticated activity.
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