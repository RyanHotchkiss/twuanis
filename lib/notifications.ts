import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export async function createNotification({
  userId,
  title,
  message,
  url,
  metadata
}: {
  userId: string
  title: string
  message: string
  url?: string
  metadata?: any
}) {
  const {
    error
    } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,

      type:
        'saved_search',

      title,

      message,

      url,

      metadata
    })

  if (error) {
    console.error(
      'Unable to create notification:',
      error
    )
  }
}