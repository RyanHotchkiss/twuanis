import {
  supabase
} from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

export type PropertyNoteRecord = {
  id: string
  userId: string
  listingId: string
  content: string
  createdAt: string
  updatedAt: string
}

type PropertyNoteRow = {
  id: string
  user_id: string
  listing_id: string
  content: string
  created_at: string
  updated_at: string
}

function mapPropertyNote(
  note: PropertyNoteRow
): PropertyNoteRecord {
  return {
    id:
      note.id,

    userId:
      note.user_id,

    listingId:
      note.listing_id,

    content:
      note.content,

    createdAt:
      note.created_at,

    updatedAt:
      note.updated_at
  }
}

function dispatchPropertyNotesUpdated() {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }

  window.dispatchEvent(
    new Event(
      'property-notes-updated'
    )
  )
}

export async function getPropertyNotes(
  listingId: string
): Promise<PropertyNoteRecord[]> {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('property_notes')
    .select(`
      id,
      user_id,
      listing_id,
      content,
      created_at,
      updated_at
    `)
    .eq(
      'user_id',
      user.id
    )
    .eq(
      'listing_id',
      listingId
    )
    .order(
      'updated_at',
      {
        ascending: false
      }
    )
    .order(
      'id',
      {
        ascending: false
      }
    )

  if (error) {
    console.error(
      'GET PROPERTY NOTES ERROR:',
      error
    )

    return []
  }

  return (
    data || []
  ).map(
    note =>
      mapPropertyNote(
        note as PropertyNoteRow
      )
  )
}

export async function getUserPropertyNotes():
  Promise<PropertyNoteRecord[]> {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('property_notes')
    .select(`
      id,
      user_id,
      listing_id,
      content,
      created_at,
      updated_at
    `)
    .eq(
      'user_id',
      user.id
    )
    .order(
      'updated_at',
      {
        ascending: false
      }
    )
    .order(
      'id',
      {
        ascending: false
      }
    )

  if (error) {
    console.error(
      'GET USER PROPERTY NOTES ERROR:',
      error
    )

    return []
  }

  return (
    data || []
  ).map(
    note =>
      mapPropertyNote(
        note as PropertyNoteRow
      )
  )
}

export async function createPropertyNote(
  listingId: string,
  content: string
): Promise<PropertyNoteRecord> {
  const trimmedContent =
    content.trim()

  if (!listingId) {
    throw new Error(
      'Listing ID is required.'
    )
  }

  if (!trimmedContent) {
    throw new Error(
      'Note content is required.'
    )
  }

  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      'You must sign in to create a property note.'
    )
  }

  const {
    data,
    error
  } = await supabase
    .from('property_notes')
    .insert({
      user_id:
        user.id,

      listing_id:
        listingId,

      content:
        trimmedContent
    })
    .select(`
      id,
      user_id,
      listing_id,
      content,
      created_at,
      updated_at
    `)
    .single()

  if (error) {
    throw error
  }

  dispatchPropertyNotesUpdated()

  return mapPropertyNote(
    data as PropertyNoteRow
  )
}

export async function updatePropertyNote(
  noteId: string,
  content: string
): Promise<PropertyNoteRecord> {
  const trimmedContent =
    content.trim()

  if (!noteId) {
    throw new Error(
      'Note ID is required.'
    )
  }

  if (!trimmedContent) {
    throw new Error(
      'Note content is required.'
    )
  }

  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      'You must sign in to update a property note.'
    )
  }

  const {
    data,
    error
  } = await supabase
    .from('property_notes')
    .update({
      content:
        trimmedContent
    })
    .eq(
      'id',
      noteId
    )
    .eq(
      'user_id',
      user.id
    )
    .select(`
      id,
      user_id,
      listing_id,
      content,
      created_at,
      updated_at
    `)
    .single()

  if (error) {
    throw error
  }

  dispatchPropertyNotesUpdated()

  return mapPropertyNote(
    data as PropertyNoteRow
  )
}

export async function deletePropertyNote(
  noteId: string
): Promise<void> {
  if (!noteId) {
    throw new Error(
      'Note ID is required.'
    )
  }

  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      'You must sign in to delete a property note.'
    )
  }

  const {
    error
  } = await supabase
    .from('property_notes')
    .delete()
    .eq(
      'id',
      noteId
    )
    .eq(
      'user_id',
      user.id
    )

  if (error) {
    throw error
  }

  dispatchPropertyNotesUpdated()
}