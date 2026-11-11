import {
  getCurrentUser
} from '@/lib/auth/current-user'

import {
  supabase
} from '@/lib/supabase'

export type IntelligenceEngineUsage = {
  engineType: string
  usageCount: number
  lastUsedAt: string | null
}

export async function getIntelligenceEngineUsage():
  Promise<IntelligenceEngineUsage[]> {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('user_recent_activity')
    .select(`
      entity_id,
      created_at
    `)
    .eq('user_id', user.id)
    .eq(
      'activity_type',
      'market_viewed'
    )
    .order(
      'created_at',
      {
        ascending: false
      }
    )

  if (error) {
    throw error
  }

  const usage =
    new Map<
      string,
      IntelligenceEngineUsage
    >()

  for (const activity of data ?? []) {
    const entityId =
      activity.entity_id

    if (
      typeof entityId !== 'string' ||
      !entityId.includes(':')
    ) {
      continue
    }

    const engineType =
      entityId.split(':')[0]

    const existing =
      usage.get(engineType)

    if (existing) {
      existing.usageCount += 1
      continue
    }

    usage.set(
      engineType,
      {
        engineType,
        usageCount: 1,
        lastUsedAt:
          activity.created_at
      }
    )
  }

  return Array.from(
    usage.values()
  ).sort(
    (a, b) =>
      b.usageCount -
      a.usageCount
  )
}