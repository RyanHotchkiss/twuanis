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

type RenewListingResult = {
  id: string
  title: string
  listing_status: 'active'
  transaction_type:
    | 'buy'
    | 'rent'
    | 'sale'
    | null
  created_at?: string | null
}

async function updateListingStatus({
  supabase,
  listingId,
  listingStatus
}: {
  supabase: SupabaseClient
  listingId: string
  listingStatus:
    | 'draft'
    | 'archived'
    | 'deleted'
}) {
  const {
    data,
    error
  } = await supabase
    .from('listings')
    .update({
      listing_status:
        listingStatus
    })
    .eq(
      'id',
      listingId
    )
    .select(`
      id,
      title,
      listing_status,
      transaction_type
    `)
    .single()

  if (error) {
    throw new Error(
      error.message
    )
  }

  if (!data) {
    throw new Error(
      'Listing was not found.'
    )
  }

  return data as ListingLifecycleResult
}

export async function unpublishListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const listing =
    await updateListingStatus({
      supabase,
      listingId,
      listingStatus:
        'draft'
    })

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
    await updateListingStatus({
      supabase,
      listingId,
      listingStatus:
        'archived'
    })

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
    await updateListingStatus({
      supabase,
      listingId,
      listingStatus:
        'draft'
    })

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
    await updateListingStatus({
      supabase,
      listingId,
      listingStatus:
        'deleted'
    })

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

export async function duplicateListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const {
    data: sourceListing,
    error: sourceError
  } = await supabase
    .from('listings')
    .select(`
      province,
      canton,
      district,
      property_type,
      bedrooms,
      bathrooms,
      parking,
      year_built_range,
      construction_area,
      property_area,
      utility,
      environment,
      accessibility,
      terrain,
      legal_status,
      price_millions,
      monthly_price,
      transaction_type,
      currency,
      whatsapp,
      title,
      description,
      images
    `)
    .eq(
      'id',
      listingId
    )
    .single()

  if (sourceError) {
    throw new Error(
      sourceError.message
    )
  }

  if (!sourceListing) {
    throw new Error(
      'Listing was not found.'
    )
  }

  const duplicateTitle =
    sourceListing.title
      ? `${sourceListing.title} — Copy`
      : 'Listing Copy'

  const {
    data: duplicatedListing,
    error: duplicateError
  } = await supabase
    .from('listings')
    .insert([
      {
        province:
          sourceListing.province,

        canton:
          sourceListing.canton,

        district:
          sourceListing.district,

        property_type:
          sourceListing.property_type,

        bedrooms:
          sourceListing.bedrooms,

        bathrooms:
          sourceListing.bathrooms,

        parking:
          sourceListing.parking,

        year_built_range:
          sourceListing.year_built_range,

        construction_area:
          sourceListing.construction_area,

        property_area:
          sourceListing.property_area,

        utility:
          sourceListing.utility,

        environment:
          sourceListing.environment,

        accessibility:
          sourceListing.accessibility,

        terrain:
          sourceListing.terrain,

        legal_status:
          sourceListing.legal_status,

        price_millions:
          sourceListing.price_millions,

        monthly_price:
          sourceListing.monthly_price,

        transaction_type:
          sourceListing.transaction_type,

        currency:
          sourceListing.currency,

        whatsapp:
          sourceListing.whatsapp,

        title:
          duplicateTitle,

        description:
          sourceListing.description,

        images:
          sourceListing.images,

        listing_status:
          'draft'
      }
    ])
    .select(`
      id,
      title,
      listing_status,
      transaction_type,
      province,
      canton,
      district,
      property_type,
      price_millions,
      monthly_price,
      currency,
      images
    `)
    .single()

  if (duplicateError) {
    throw new Error(
      duplicateError.message
    )
  }

  if (!duplicatedListing) {
    throw new Error(
      'The duplicate listing was not created.'
    )
  }

  return duplicatedListing as DuplicateListingResult
}

export async function renewListing({
  supabase,
  listingId
}: ListingLifecycleInput) {
  const renewedAt =
    new Date().toISOString()

  const {
    data,
    error
  } = await supabase
    .from('listings')
    .update({
      listing_status:
        'active',

      created_at:
        renewedAt
    })
    .eq(
      'id',
      listingId
    )
    .select(`
      id,
      title,
      listing_status,
      transaction_type,
      created_at
    `)
    .single()

  if (error) {
    throw new Error(
      error.message
    )
  }

  if (!data) {
    throw new Error(
      'Listing was not found.'
    )
  }

  return data as RenewListingResult
}