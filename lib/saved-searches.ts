import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

import {
  recordSearchSaved
} from '@/lib/activity'

export type SavedSearchAlertFrequency =
  | 'daily'
  | 'weekly'
  | null

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
      alerts_enabled,
      alert_frequency,
      last_alert_sent_at,
      last_checked_at,
      created_at,
      updated_at
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
      alerts_enabled,
      alert_frequency,
      last_alert_sent_at,
      last_checked_at,
      created_at,
      updated_at
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
export async function renameSavedSearch(
  savedSearchId: string,
  name: string
) {
  const user =
    await getCurrentUser()

  if (!user) {
    return false
  }

  const trimmedName =
    name.trim()

  if (!trimmedName) {
    return false
  }

  const {
    error
  } = await supabase
    .from('saved_searches')
    .update({
      name: trimmedName
    })
    .eq('id', savedSearchId)
    .eq('user_id', user.id)

  if (error) {
    console.error(
      'Unable to rename saved search:',
      error
    )

    return false
  }

  return true
}

export async function deleteSavedSearch(
  savedSearchId: string
) {
  const user =
    await getCurrentUser()

  if (!user) {
    return false
  }

  const {
    error
  } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', savedSearchId)
    .eq('user_id', user.id)

  if (error) {
    console.error(
      'Unable to delete saved search:',
      error
    )

    return false
  }

  return true
}

export async function updateSavedSearchAlert(
  savedSearchId: string,
  enabled: boolean,
  frequency: SavedSearchAlertFrequency
) {
  const user =
    await getCurrentUser()

  if (!user) {
    return false
  }

  if (
    enabled &&
    frequency === null
  ) {
    console.error(
      'An enabled saved-search alert requires a frequency.'
    )

    return false
  }

  const {
    error
  } = await supabase
    .from('saved_searches')
    .update({
      alerts_enabled:
        enabled,

      alert_frequency:
        enabled
          ? frequency
          : null,

      updated_at:
        new Date().toISOString()
    })
    .eq('id', savedSearchId)
    .eq('user_id', user.id)

  if (error) {
    console.error(
      'Unable to update saved-search alert:',
      error
    )

    return false
  }

  return true
}