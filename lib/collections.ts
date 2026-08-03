import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

export type FavoriteCollectionRecord = {
  id: string
  name: string
  propertyCount: number
  updatedAt: string
}

export async function getFavoriteCollections():
  Promise<FavoriteCollectionRecord[]> {
  const user =
  await getCurrentUser()

if (!user) {
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
        'sort_order',
        {
          ascending: true
        }
      )
      .order(
        'id',
        {
          ascending: true
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

  const user =
  await getCurrentUser()

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

export async function renameFavoriteCollection(
    collectionId: string,
    name: string
  ) {
    const trimmedName =
      name.trim()

    if (!trimmedName) {
      throw new Error(
        'Collection name is required.'
      )
    }

    const user =
      await getCurrentUser()

    if (!user) {
      throw new Error(
        'You must sign in to rename a collection.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from('favorite_collections')
      .update({
        name: trimmedName,
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        collectionId
      )
      .eq(
        'user_id',
        user.id
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    window.dispatchEvent(
      new Event(
        'collections-updated'
      )
    )

    return data
  }

export async function deleteFavoriteCollection(
      collectionId: string
    ) {
      const user =
        await getCurrentUser()

      if (!user) {
        throw new Error(
          'You must sign in to delete a collection.'
        )
      }

      const {
        error
      } = await supabase
        .from('favorite_collections')
        .delete()
        .eq(
          'id',
          collectionId
        )
        .eq(
          'user_id',
          user.id
        )

      if (error) {
        throw error
      }

      window.dispatchEvent(
        new Event(
          'collections-updated'
        )
      )
    }

export async function reorderFavoriteCollections(
      collectionIds: string[]
    ) {
      const user =
        await getCurrentUser()

      if (!user) {
        throw new Error(
          'You must sign in to reorder collections.'
        )
      }

      const {
        error
      } = await supabase.rpc(
        'reorder_favorite_collections',
        {
          collection_ids:
            collectionIds
        }
      )

      if (error) {
        throw error
      }

      window.dispatchEvent(
        new Event(
          'collections-updated'
        )
      )
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

export async function addPropertiesToCollection(
  collectionId: string,
  listingIds: string[]
) {
  const uniqueListingIds = [
    ...new Set(listingIds)
  ]

  if (
    !collectionId ||
    uniqueListingIds.length === 0
  ) {
    return
  }

  const {
    error
  } = await supabase
    .from(
      'favorite_collection_items'
    )
    .upsert(
      uniqueListingIds.map(
        listingId => ({
          collection_id:
            collectionId,
          listing_id:
            listingId
        })
      ),
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
    new Event(
      'collections-updated'
    )
  )
}

export async function removePropertiesFromCollection(
  collectionId: string,
  listingIds: string[]
) {
  const uniqueListingIds = [
    ...new Set(listingIds)
  ]

  if (
    !collectionId ||
    uniqueListingIds.length === 0
  ) {
    return
  }

  const {
    error
  } = await supabase
    .from(
      'favorite_collection_items'
    )
    .delete()
    .eq(
      'collection_id',
      collectionId
    )
    .in(
      'listing_id',
      uniqueListingIds
    )

  if (error) {
    throw error
  }

  window.dispatchEvent(
    new Event(
      'collections-updated'
    )
  )
}

export async function movePropertiesBetweenCollections(
  sourceCollectionId: string,
  targetCollectionId: string,
  listingIds: string[]
) {
  const uniqueListingIds = [
    ...new Set(listingIds)
  ]

  if (
    !sourceCollectionId ||
    !targetCollectionId ||
    sourceCollectionId ===
      targetCollectionId ||
    uniqueListingIds.length === 0
  ) {
    return
  }

  const {
    error: addError
  } = await supabase
    .from(
      'favorite_collection_items'
    )
    .upsert(
      uniqueListingIds.map(
        listingId => ({
          collection_id:
            targetCollectionId,
          listing_id:
            listingId
        })
      ),
      {
        onConflict:
          'collection_id,listing_id',
        ignoreDuplicates: true
      }
    )

  if (addError) {
    throw addError
  }

  const {
    error: removeError
  } = await supabase
    .from(
      'favorite_collection_items'
    )
    .delete()
    .eq(
      'collection_id',
      sourceCollectionId
    )
    .in(
      'listing_id',
      uniqueListingIds
    )

  if (removeError) {
    throw removeError
  }

  await supabase
    .from('favorite_collections')
    .update({
      updated_at:
        new Date().toISOString()
    })
    .eq(
      'id',
      targetCollectionId
    )

  window.dispatchEvent(
    new Event(
      'collections-updated'
    )
  )
}

export async function getListingCollectionIds(
  listingId: string
): Promise<string[]> {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('favorite_collection_items')
    .select(`
      collection_id,
      favorite_collections!inner (
        user_id
      )
    `)
    .eq(
      'listing_id',
      listingId
    )
    .eq(
      'favorite_collections.user_id',
      user.id
    )

  if (error) {
    console.error(
      'GET LISTING COLLECTIONS ERROR:',
      error
    )

    return []
  }

  return (data || []).map(
    item =>
      item.collection_id
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