import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

import {
  recordSearchSaved
} from '@/lib/activity'

export async function saveSearch(
  transactionType: string,
  language: string,
  filters: any,
  name = 'My Search'
) {
  const user =
    await getCurrentUser()

  if (!user) return

  const {
      data,
      error
    } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        transaction_type: transactionType,
        language,
        filters,
        name
      })
      .select('id')
      .single()

    if (error) {
      console.error(
        'Unable to save search:',
        error
      )

      return
    }

    await recordSearchSaved({
      searchId: data.id,
      metadata: {
        name,
        transactionType,
        language,
        filters,
        source: 'marketplace'
      }
    })
}

export async function getSavedSearches() {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('saved_searches')
    .select(`
      id,
      transaction_type,
      language,
      filters,
      name,
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false
    })

  if (error) {
    console.error(
      'Unable to load saved searches:',
      error
    )

    return []
  }

  return data ?? []
}

export async function getSavedSearch(
  savedSearchId: string
) {
  const user =
    await getCurrentUser()

  if (!user) {
    return null
  }

  const {
    data,
    error
  } = await supabase
    .from('saved_searches')
    .select(`
      id,
      transaction_type,
      language,
      filters,
      name,
      created_at
    `)
    .eq('id', savedSearchId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error(
      'Unable to load saved search:',
      error
    )

    return null
  }

  return data
}