import { supabase } from '@/lib/supabase'
import {
  getMarketStatistics,
  saveMarketStatistics
} from '@/lib/statistics-engine'

const CACHE_ENTITY_TYPES = [
  'province',
  'canton',
  'district',
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'year_built',
  'property_area',
  'construction_area',
  'utility',
  'environment',
  'terrain',
  'accessibility',
  'legal_status'
]

type CacheRebuildOptions = {
  limit?: number
  offset?: number
}

export async function rebuildMarketStatisticsCache({
  limit = 100,
  offset = 0
}: CacheRebuildOptions = {}) {
  const { data: log, error: logError } = await supabase
    .from('market_cache_rebuild_logs')
    .insert({
      limit_count: limit,
      offset_count: offset,
      status: 'running'
    })
    .select('id')
    .single()

  if (logError) throw logError

  try {
    const { data: entities, error } = await supabase
      .from('ontology_terms')
      .select('term_type, slug')
      .in('term_type', CACHE_ENTITY_TYPES)
      .range(offset, offset + limit - 1)

    if (error) throw error

    const results = []

    for (const entity of entities || []) {
      const filters = {
        [entity.term_type]: entity.slug
      }

      const data = await getMarketStatistics(filters)

      await saveMarketStatistics(
        entity.term_type,
        entity.slug,
        data
      )

      results.push({
        entityType: entity.term_type,
        entitySlug: entity.slug,
        totalListings: data.statistics.totalListings
      })
    }

    await supabase
      .from('market_cache_rebuild_logs')
      .update({
        status: 'completed',
        rebuilt_count: results.length,
        finished_at: new Date().toISOString()
      })
      .eq('id', log.id)

    return {
      rebuilt: results.length,
      limit,
      offset,
      nextOffset: offset + limit,
      logId: log.id,
      results
    }
  } catch (error: any) {
    await supabase
      .from('market_cache_rebuild_logs')
      .update({
        status: 'failed',
        error_message: error?.message || String(error),
        finished_at: new Date().toISOString()
      })
      .eq('id', log.id)

    throw error
  }
}