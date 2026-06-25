import { supabase } from '@/lib/supabase'

import {
  getCachedMarketStatistics,
  getMarketStatistics
} from '@/lib/statistics-engine'

type MarketFilters = {
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
  legal_status?: string
}


function cleanFilters(filters: MarketFilters) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => Boolean(value))
      .sort(([a], [b]) => a.localeCompare(b))
  )
}

function createCombinationHash(filters: MarketFilters) {
  return JSON.stringify(cleanFilters(filters))
}

export function createMarketTitle(filters: MarketFilters) {
  const parts = []

  if (filters.environment) parts.push(filters.environment)
  if (filters.terrain) parts.push(filters.terrain)
  if (filters.bedrooms) parts.push(filters.bedrooms)
  if (filters.property_type) parts.push(filters.property_type)

  const location =
    filters.district ||
    filters.canton ||
    filters.province

  if (location) parts.push(`${location}`)

  if (!parts.length) return 'Costa Rica Real Estate Market'

  return parts
    .join(' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

  function groupDistributionRows(rows: any[]) {
    return rows.reduce((groups, row) => {
      const type = row.distribution_type

      if (!groups[type]) groups[type] = []

      groups[type].push({
        value: row.value,
        count: row.listing_count,
        listing_count: row.listing_count,
        percentage: row.percentage
      })

      return groups
    }, {} as Record<string, any[]>)
  }

  async function getCachedCombination(filters: MarketFilters) {
    const combinationHash = createCombinationHash(filters)

    const { data: statistics, error: statisticsError } = await supabase
      .from('market_combination_statistics')
      .select('*')
      .eq('combination_hash', combinationHash)
      .maybeSingle()

    if (statisticsError) throw statisticsError
    if (!statistics) return null

    const { data: distributionRows, error: distributionError } = await supabase
      .from('market_combination_distribution_statistics')
      .select('*')
      .eq('combination_hash', combinationHash)

    if (distributionError) throw distributionError

    const distributions = groupDistributionRows(distributionRows || [])

    return {
      statistics,
      distributions
    }
  }

  

async function saveCombinationStatistics(
  filters: MarketFilters,
  data: Awaited<ReturnType<typeof getMarketStatistics>>
) {
  const stats = data.statistics
  const cleanedFilters = cleanFilters(filters)
  const combinationHash = createCombinationHash(filters)

  const distributionRows = Object.entries(data.distributions).flatMap(
    ([distributionType, rows]) =>
      rows.map(row => ({
        combination_hash: combinationHash,
        distribution_type: distributionType,
        value: row.value,
        listing_count: row.count,
        percentage: row.percentage
      }))
  )

  const { error: deleteDistributionError } = await supabase
    .from('market_combination_distribution_statistics')
    .delete()
    .eq('combination_hash', combinationHash)

  if (deleteDistributionError) throw deleteDistributionError

  if (distributionRows.length) {
    const { error: insertDistributionError } = await supabase
      .from('market_combination_distribution_statistics')
      .upsert(
          distributionRows,
          {
            onConflict: 'combination_hash,distribution_type,value'
          }
        )

    if (insertDistributionError) throw insertDistributionError
  }

  const { error } = await supabase
    .from('market_combination_statistics')
    .upsert(
      {
        combination_hash: combinationHash,
        filters: cleanedFilters,

        total_listings: stats.totalListings,
        sale_listings: stats.saleListings,
        rental_listings: stats.rentalListings,

        average_sale_price: stats.averageSalePrice,
        median_sale_price: stats.medianSalePrice,

        average_rent_crc: stats.averageRentCRC,
        median_rent_crc: stats.medianRentCRC,
        average_rent_usd: stats.averageRentUSD,
        median_rent_usd: stats.medianRentUSD,

        average_property_area: stats.averagePropertyArea,
        average_construction_area: stats.averageConstructionArea,
        average_price_per_m2: stats.averagePricePerM2,

        rent_crc_sample_size: stats.rentCRCSampleSize,
        rent_usd_sample_size: stats.rentUSDSampleSize,
        sale_price_sample_size: stats.salePriceSampleSize,
        property_area_sample_size: stats.propertyAreaSampleSize,
        construction_area_sample_size: stats.constructionAreaSampleSize,
        price_per_m2_sample_size: stats.pricePerM2SampleSize
      },
      {
        onConflict: 'combination_hash'
      }
    )

  if (error) throw error

  return combinationHash
}

function filledFilters(filters: MarketFilters) {
  return Object.entries(filters).filter(([, value]) => Boolean(value))
}

function filledEntityFilters(filters: MarketFilters) {
  return Object.entries(filters).filter(([key, value]) => {
    if (!value) return false
    if (key === 'transaction_type') return false

    return true
  })
}

export async function getMarketIntelligence(filters: MarketFilters) {
  const entries = filledFilters(filters)
  const entityEntries = filledEntityFilters(filters)


  if (!entries.length) {
    const data = await getMarketStatistics({})

    return {
      title: 'Costa Rica Real Estate Market',
      filters,
      cacheHit: false,
      mode: 'live',
      data
    }
  }

  if (
      !filters.transaction_type &&
      entityEntries.length === 1 &&
      entries.length === 1
    ) {
    const [entityType, entitySlug] = entityEntries[0]

    try {

      const cached = await getCachedMarketStatistics(
          entityType,
          String(entitySlug)
        )

        const live = await getMarketStatistics(filters)

        return {
          title: createMarketTitle(filters),
          filters,
          cacheHit: true,
          mode: 'cached-entity',
          data: {
            ...cached,
            listings: live.listings
          }
        }

    } catch {
      const live = await getMarketStatistics(filters)

      return {
        title: createMarketTitle(filters),
        filters,
        cacheHit: false,
        mode: 'live-entity',
        data: live
      }
    }
  }

console.log('ABOUT TO READ COMBO CACHE')
const cachedCombination = await getCachedCombination(filters)
console.log('READ COMBO CACHE DONE')

    if (cachedCombination) {
      const live = await getMarketStatistics(filters)

      return {
        title: createMarketTitle(filters),
        filters,
        cacheHit: true,
        mode: 'cached-combination',
        data: {
          ...cachedCombination,
          listings: live.listings
        }
      }
    }

console.log('ABOUT TO GET LIVE STATS')
const live = await getMarketStatistics(filters)
console.log('LIVE STATS DONE')

console.log('ABOUT TO SAVE COMBO STATS')
const combinationHash = await saveCombinationStatistics(filters, live)
console.log('SAVE COMBO STATS DONE')


  return {
    title: createMarketTitle(filters),
    filters,
    cacheHit: false,
    mode: 'live-combination-saved',
    combinationHash,
    data: live
  }
}