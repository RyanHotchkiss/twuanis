import { getEntity, EntityType } from '@/lib/entity-engine'
import { getMarketIntelligence } from '@/lib/market-engine'

type ExplorerFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string
  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  year_built?: string
  property_area?: string
  construction_area?: string
  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  distance_to_paved_road_range?: string
  legal_status?: string
}

const PRIMARY_ENTITY_PRIORITY: Array<keyof ExplorerFilters> = [
  'district',
  'canton',
  'province',
  'property_type',
  'environment',
  'terrain',
  'utility',
  'accessibility',
  'legal_status',
  'bedrooms',
  'bathrooms',
  'parking',
  'year_built'
]

function getPrimaryEntity(filters: ExplorerFilters) {
  for (const key of PRIMARY_ENTITY_PRIORITY) {
    const value = filters[key]

    if (!value) continue

    if (String(value).includes(',')) {
      continue
    }
    
    return {
      entityType: key as EntityType,
      slug: value
    }
  }

  return null
}

export async function exploreMarket(filters: ExplorerFilters) {
  const market = await getMarketIntelligence(filters)

  const primaryEntity = getPrimaryEntity(filters)

  const entityData = primaryEntity
    ? await getEntity(
        primaryEntity.entityType,
        primaryEntity.slug
      ).catch(() => null)
    : null

  return {
    title: market.title,
    filters,

    cacheHit: market.cacheHit,
    mode: market.mode,

    statistics:
      'statistics' in market.data
        ? market.data.statistics
        : null,

    distributions:
      'distributions' in market.data
        ? market.data.distributions
        : [],

    listings: 'listings' in market.data
      ? market.data.listings
      : [],

    primaryEntity,

    entity: entityData?.entity || null,
    parentEntity: entityData?.parentEntity || null,
    childEntities: entityData?.childEntities || [],
    relatedEntities: entityData?.relatedEntities || [],
    graphNeighbors: entityData?.relatedEntities || [],

    listingCount: entityData?.listingCount || 0
  }
}