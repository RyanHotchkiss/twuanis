import { supabase } from '@/lib/supabase'

export type FavoriteCollectionRecord = {
  id: string
  name: string
  propertyCount: number
  updatedAt: string
}

export async function getFavoriteCollections():
  Promise<FavoriteCollectionRecord[]> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (
    userError ||
    !user
  ) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('favorite_collections')
    .select(`
      id,
      name,
      updated_at,
      favorite_collection_items (
        listing_id
      )
    `)
    .eq('user_id', user.id)
    .order(
      'updated_at',
      {
        ascending: false
      }
    )

  if (error) {
    console.error(
      'GET COLLECTIONS ERROR:',
      error
    )

    return []
  }

  return (data || []).map(
    collection => ({
      id: collection.id,
      name: collection.name,
      propertyCount:
        collection
          .favorite_collection_items
          ?.length || 0,
      updatedAt:
        collection.updated_at
    })
  )
}

export async function createFavoriteCollection(
  name: string
) {
  const trimmedName =
    name.trim()

  if (!trimmedName) {
    throw new Error(
      'Collection name is required.'
    )
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      'You must sign in to create a collection.'
    )
  }

  const {
    data,
    error
  } = await supabase
    .from('favorite_collections')
    .insert({
      user_id: user.id,
      name: trimmedName
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  window.dispatchEvent(
    new Event('collections-updated')
  )

  return data
}

export async function addPropertyToCollection(
  collectionId: string,
  listingId: string
) {
  const {
    error
  } = await supabase
    .from('favorite_collection_items')
    .upsert(
      {
        collection_id:
          collectionId,
        listing_id:
          listingId
      },
      {
        onConflict:
          'collection_id,listing_id',
        ignoreDuplicates: true
      }
    )

  if (error) {
    throw error
  }

  await supabase
    .from('favorite_collections')
    .update({
      updated_at:
        new Date().toISOString()
    })
    .eq(
      'id',
      collectionId
    )

  window.dispatchEvent(
    new Event('collections-updated')
  )
}

export async function removePropertyFromCollection(
  collectionId: string,
  listingId: string
) {
  const {
    error
  } = await supabase
    .from('favorite_collection_items')
    .delete()
    .eq(
      'collection_id',
      collectionId
    )
    .eq(
      'listing_id',
      listingId
    )

  if (error) {
    throw error
  }

  window.dispatchEvent(
    new Event('collections-updated')
  )
}

export async function getCollectionListingIds(
  collectionId: string
): Promise<string[]> {
  const {
    data,
    error
  } = await supabase
    .from('favorite_collection_items')
    .select('listing_id')
    .eq(
      'collection_id',
      collectionId
    )

  if (error) {
    console.error(
      'GET COLLECTION ITEMS ERROR:',
      error
    )

    return []
  }

  return (data || []).map(
    item =>
      item.listing_id
  )
}