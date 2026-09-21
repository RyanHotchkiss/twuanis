import { changeCustomerListingLifecycle } from './canonicalCustomerLifecycle'
import {
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  recordListingArchived,
  recordListingDeleted,
  recordListingRestored,
  recordListingUnpublished
} from '@/lib/activity/listings'

type ListingLifecycleInput = {
  supabase: SupabaseClient
  listingId: string
  
}

type ListingLifecycleResult = {
  id: string
  title?: string | null
  listing_status?: string | null
  transaction_type?: string | null
}

type DuplicateListingResult = {
  id: string
  title: string
  listing_status: 'draft'
  transaction_type:
    | 'buy'
    | 'rent'
    | 'sale'
    | null
  province?: string | null
  canton?: string | null
  district?: string | null
  property_type?: string | null
  price_millions?: number | null
  monthly_price?: number | null
  currency?: string | null
  images?: string[] | null
}

export async function unpublishListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const listing =
    await changeCustomerListingLifecycle(supabase, listingId, 'unpublish')

  try {
    await recordListingUnpublished({
      listingId,
      
      metadata: {
        title:
          listing.title ??
            undefined,

        transactionType:
          listing.transaction_type,

        previousStatus:
          'active',

        listingStatus:
          'draft',

        source:
          'market-hub'
      }
    })
  } catch (activityError) {
    console.error(
      'LISTING UNPUBLISHED ACTIVITY ERROR:',
      activityError
    )
  }

  return listing
}

export async function archiveListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const listing =
    await changeCustomerListingLifecycle(supabase, listingId, 'archive')

  try {
    await recordListingArchived({
      listingId,
      
      metadata: {
        title:
          listing.title ??
            undefined,

        transactionType:
          listing.transaction_type,

        listingStatus:
          'archived',

        source:
          'market-hub'
      }
    })
  } catch (activityError) {
    console.error(
      'LISTING ARCHIVED ACTIVITY ERROR:',
      activityError
    )
  }

  return listing
}

export async function restoreListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const listing =
    await changeCustomerListingLifecycle(supabase, listingId, 'restore')

  try {
    await recordListingRestored({
      listingId,
      
      metadata: {
        title:
          listing.title ??
            undefined,

        transactionType:
          listing.transaction_type,

        previousStatus:
          'archived',

        listingStatus:
          'draft',

        source:
          'market-hub'
      }
    })
  } catch (activityError) {
    console.error(
      'LISTING RESTORED ACTIVITY ERROR:',
      activityError
    )
  }

  return listing
}

export async function deleteListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const listing =
    await changeCustomerListingLifecycle(supabase, listingId, 'delete')

  try {
    await recordListingDeleted({
      listingId,
      
      metadata: {
        title:
          listing.title ??
            undefined,

        transactionType:
          listing.transaction_type,

        listingStatus:
          'deleted',

        deletionType:
          'soft-delete',

        source:
          'market-hub'
      }
    })
  } catch (activityError) {
    console.error(
      'LISTING DELETED ACTIVITY ERROR:',
      activityError
    )
  }

  return listing
}

export async function duplicateListing({ supabase, listingId }: ListingLifecycleInput) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('You must be signed in to duplicate a listing.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your session could not be verified.')
  // Keep the operation across retries/remounts, including lost server responses.
  const key = `twuanis:duplicate:${user.id}:${listingId}`
  let requestId = window.localStorage.getItem(key)
  if (!requestId) {
    requestId = crypto.randomUUID()
    window.localStorage.setItem(key, requestId)
  }
  const response = await fetch('/api/duplicate-listing', {
    method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, requestId })
  })
  const result = await response.json()
  if (!response.ok || !result.success || typeof result.id !== 'string') throw new Error(result.error || 'Duplication failed. Retry the same operation.')
  if (result.mediaStatus === 'complete') window.localStorage.removeItem(key)
  return result as { id: string; mediaStatus: 'complete' | 'incomplete'; warning?: string }
}
