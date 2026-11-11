import {cache} from 'react'
import type { CanonicalEvidence } from '@/lib/canonical-listing-reader'
import { hydrateCanonicalPopulation } from '@/lib/canonical-population'
import 'server-only'
import {canonicalAddonPlacementEnabled} from '@/lib/addon-placement-server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export const PUBLIC_LISTING_DISCOVERY_COLUMNS = `
  id,
  title,
  province,
  canton,
  district,
  property_type,
  property_area,
  construction_area,
  bedrooms,
  bathrooms,
  parking,
  year_built_range,
  environment,
  terrain,
  utility,
  accessibility,
  legal_status,
  price_millions,
  monthly_price,
  current_price,
  canonical_domain_version,
  currency,
  transaction_type,
  images
`

export const PUBLIC_LISTING_DETAIL_COLUMNS = `
  id,
  listing_status,
  canonical_revision::text,
  title,
  description,
  province,
  canton,
  district,
  property_type,
  property_area,
  construction_area,
  bedrooms,
  bathrooms,
  parking,
  year_built_range,
  environment,
  terrain,
  utility,
  accessibility,
  legal_status,
  price_millions,
  monthly_price,
  current_price,
  canonical_domain_version,
  currency,
  transaction_type,
  images
`

export type PublicListingTransaction =
  | 'sale'
  | 'rent'

export async function getPublicListingCounts() {
  const counts = await Promise.all((['sale', 'rent'] as const).map(async transaction => {
    const {count, error} = await supabaseAdmin.from('listings')
      .select('id', {count: 'exact', head: true})
      .eq('listing_status', 'active').eq('transaction_type', transaction)
    if (error || count === null) return null
    return count
  }))
  return {sale: counts[0], rent: counts[1]}
}

export async function getPublicListings(
  transactionType?: PublicListingTransaction
) {
  let query =
    supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DISCOVERY_COLUMNS
      )
      .eq(
        'listing_status',
        'active'
      )

  if (transactionType) {
    query =
      query.eq(
        'transaction_type',
        transactionType
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    throw new Error(
      `Public listing discovery failed: ${error.message}`
    )
  }

  return hydrateCanonicalPopulation(data || [])
}

export const getPublicListingById=cache(async function getPublicListingById(
  listingId: string
) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DETAIL_COLUMNS
      )
      .eq(
        'id',
        listingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Public listing detail failed: ${error.message}`
    )
  }

  if(!data)return null
  const hydrated=(await hydrateCanonicalPopulation([data],new Map(),undefined,['property_type','utility','environment','terrain','accessibility','legal_status']))[0]
  const {data:current,error:revisionError}=await supabaseAdmin.from('listings')
    .select('listing_status,canonical_revision::text,transaction_type').eq('id',listingId).maybeSingle()
  if(revisionError)throw new Error('Public listing verification unavailable.')
  if(!current||current.listing_status!=='active')return null
  if(String(current.canonical_revision)!==String(data.canonical_revision)||current.transaction_type!==data.transaction_type)throw new Error('Public listing changed during retrieval. Retry.')
  const {canonical_revision,...publicData}=hydrated
  void canonical_revision // Source coherence is verified server-side, never serialized as a private record.
  return publicData
})

export async function getPublicListingSitemapRows() {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(`
        id,
        created_at,
        transaction_type
      `)
      .eq(
        'listing_status',
        'active'
      )

  if (error) {
    throw new Error(
      `Public listing sitemap failed: ${error.message}`
    )
  }

  return data || []
}

export async function getPublicListingContact(
  listingId: string
) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(`
        id,
        whatsapp
      `)
      .eq(
        'id',
        listingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Public listing contact failed: ${error.message}`
    )
  }

  return data
}

export async function getPublicListingsByIds(
  listingIds: string[],
  existingEvidence?: ReadonlyMap<string,CanonicalEvidence>
) {
  const uniqueListingIds =
    [...new Set(
      listingIds.filter(Boolean)
    )]

  if (
    uniqueListingIds.length === 0
  ) {
    return []
  }

  const {
    data,
    error
  } =
    await supabaseAdmin
      .from('listings')
      .select(
        PUBLIC_LISTING_DISCOVERY_COLUMNS
      )
      .in(
        'id',
        uniqueListingIds
      )
      .eq(
        'listing_status',
        'active'
      )

  if (error) {
    throw new Error(
      `Public listing ID lookup failed: ${error.message}`
    )
  }

  return hydrateCanonicalPopulation(data || [],existingEvidence)
}
export async function getPublicListingPage(transaction:PublicListingTransaction,filters:Record<string,unknown>,page:number,size:number,fx:number) {
 const {data,error}=await supabaseAdmin.rpc('read_marketplace_listing_page',{p_transaction:transaction,p_filters:filters,p_page:page-1,p_size:size,p_fx:fx,p_addon:canonicalAddonPlacementEnabled()})
 if(error||!data||!Number.isSafeInteger(data.count)||data.count<0||!Array.isArray(data.items)||data.items.length>size)throw new Error('Bounded listing page unavailable')
 return {count:data.count,listings:await hydrateCanonicalPopulation(data.items)}
}
