import { supabase } from '@/lib/supabase'

import {
  matchesConstructionAreaConstraint,
  matchesPropertyAreaConstraint,
  resolveConstructionAreaConstraint,
  resolvePropertyAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  resolveListingAmountCrc,
  resolveListingAmountUsd
} from '@/lib/listing-monetary-value'

import {
  resolveMarketAnalyticalContext,
  type MarketAnalyticalContext
} from '@/lib/market-analytical-context'

const MIN_SAMPLE_SIZE = 10

const INTELLIGENCE_TERM_TYPES = [
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
  distance_to_paved_road_range?: string
  legal_status?: string
}

type Listing = {
  province: string | null
  canton: string | null
  district: string | null
  id: string
  transaction_type: string | null
  currency: string | null
  price_millions: number | null
  current_price: number | null
  monthly_price: number | null
  property_area: number | null
  construction_area: number | null
  created_at: string | null
  distance_to_paved_road_range: string | null
}

type DistributionRow = {
  value: string
  count: number
  percentage: number
}

const PROPERTY_AREA_COHORTS = [
  { value: 'under-100m2', label: '<100m²' },
  { value: '100-500m2', label: '100–500m²' },
  { value: '500-1000m2', label: '500–1,000m²' },
  { value: '1000-5000m2', label: '1,000–5,000m²' },
  { value: '5000m2-1-hectare', label: '5,000m²–1 Hectare' },
  { value: '1-5-hectares', label: '1–5 Hectares' },
  { value: 'over-5-hectares', label: '5 Hectares+' }
] as const

const CONSTRUCTION_AREA_COHORTS = [
  { value: 'under-50m2', label: '<50m²' },
  { value: '50-100m2', label: '50–100m²' },
  { value: '100-200m2', label: '100–200m²' },
  { value: '200-400m2', label: '200–400m²' },
  { value: '400-800m2', label: '400–800m²' },
  { value: '800m2-plus', label: '800m²+' }
] as const

function normalize(value?: string) {
  return value?.trim().toLowerCase()
}

function median(values: number[]) {
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeText(value: any) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Client request budgets, not assumptions about PostgREST response limits.
function populationInputChunks<T extends string | number>(values: T[]): T[][] {
  const chunks: T[][] = []
  let chunk: T[] = []
  let encodedLength = 0
  for (const value of new Set(values)) {
    const length = encodeURIComponent(JSON.stringify(value)).length + 3
    if (length > 1500) {
      throw new Error('Population filter value exceeds the request budget.')
    }
    if (chunk.length && (chunk.length >= 25 || encodedLength + length > 1500)) {
      chunks.push(chunk)
      chunk = []
      encodedLength = 0
    }
    chunk.push(value)
    encodedLength += length
  }
  if (chunk.length) chunks.push(chunk)
  return chunks
}

async function completePopulationRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{
    data: unknown[] | null
    error: unknown
    count: number | null
  }>
): Promise<T[]> {
  const rows: T[] = []
  let expectedCount: number | null = null
  do {
    const { data, error, count } = await queryPage(rows.length, rows.length + 499)
    if (error) throw error
    if (count === null || !Number.isSafeInteger(count) || count < 0) {
      throw new Error('Population completeness requires an exact row count.')
    }
    if (expectedCount !== null && count !== expectedCount) {
      throw new Error('Population evidence changed during pagination.')
    }
    expectedCount = count
    const page = data ?? []
    if (rows.length + page.length > count || (!page.length && rows.length < count)) {
      throw new Error('Population pagination returned incomplete evidence.')
    }
    rows.push(...page as T[])
    // Advance by rows actually received; a short page is not completion.
  } while (rows.length < expectedCount)
  return rows
}

async function getDistrictNamesFromSlugs(districtSlugs: string[]) {
  const data: { term_name: string; term_name_en: string | null; slug: string }[] = []
  for (const slugs of populationInputChunks(districtSlugs)) {
    data.push(...await completePopulationRows<(typeof data)[number]>((from, to) =>
      supabase.from('ontology_terms')
        .select('term_name, term_name_en, slug', { count: 'exact' })
        .eq('term_type', 'district')
        .in('slug', slugs)
        .order('id', { ascending: true })
        .range(from, to)
    ))
  }

  return (data || []).map(term =>
    term.term_name_en || term.term_name || term.slug
  )
}

function average(values: number[]) {
    if (!values.length) return null

    return values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  }


  function validNumbers(values: Array<number | null>) {
            return values.filter((value): value is number => {
              return typeof value === 'number' && Number.isFinite(value)
            })
          }

          function metricWithMinimumSample(values: number[]) {
            if (values.length < MIN_SAMPLE_SIZE) return null

            return average(values)
          }

          async function resolveFilterTerms(filters: MarketFilters) {
            const entries = Object.entries(filters).filter(([, value]) => value)

            if (!entries.length) return []

            const resolvedTerms: {
                id: number
                term_name: string
                term_type: string
                slug: string
              }[] = []

            for (const [termType, rawValue] of entries) {
              const values = String(rawValue)
                .split(',')
                .map(value => normalize(value))
                .filter(Boolean)

              const data: typeof resolvedTerms = []
              for (const slugs of populationInputChunks(values.filter(
                (value): value is string => value !== undefined
              ))) {
                data.push(...await completePopulationRows<(typeof resolvedTerms)[number]>((from, to) =>
                  supabase.from('ontology_terms')
                    .select('id, term_name, term_type, slug', { count: 'exact' })
                    .eq('term_type', termType)
                    .in('slug', slugs)
                    .order('id', { ascending: true })
                    .range(from, to)
                ))
              }

              if (!data || data.length === 0) {
                throw new Error(
                  `No ontology term found for ${termType}: ${rawValue}`
                )
              }

              resolvedTerms.push(...data)
            }

            return resolvedTerms
          }

              function calculateListingFieldDistribution(
                listings: Listing[],
                field: 'province' | 'canton' | 'district'
              ): DistributionRow[] {
                if (!listings.length) return []

                const counts = new Map<string, number>()

                for (const listing of listings) {
                  const value = listing[field]

                  if (!value) continue

                  counts.set(value, (counts.get(value) || 0) + 1)
                }

                return Array.from(counts.entries())
                  .map(([value, count]) => ({
                    value,
                    count,
                    percentage: Number(((count / listings.length) * 100).toFixed(2))
                  }))
                  .sort((a, b) => b.count - a.count)
              }

              function calculatePropertyAreaDistribution(
                listings: Listing[]
              ): DistributionRow[] {
                const validListings = listings.filter(
                  listing =>
                    typeof listing.property_area === 'number' &&
                    Number.isFinite(listing.property_area)
                )

                if (!validListings.length) return []

                return PROPERTY_AREA_COHORTS.map(cohort => {
                  const constraint =
                    resolvePropertyAreaConstraint(cohort.value)

                  if (!constraint) {
                    throw new Error(
                      `Unknown property area cohort: ${cohort.value}`
                    )
                  }

                  const count = validListings.filter(listing =>
                    matchesPropertyAreaConstraint(
                      listing.property_area,
                      cohort.value
                    )
                  ).length

                  return {
                    value: cohort.label,
                    count,
                    percentage: Number(
                      ((count / validListings.length) * 100).toFixed(2)
                    )
                  }
                })
              }

              function calculateConstructionAreaDistribution(
                listings: Listing[]
              ): DistributionRow[] {
                const validListings = listings.filter(
                  listing =>
                    typeof listing.construction_area === 'number' &&
                    Number.isFinite(listing.construction_area)
                )

                if (!validListings.length) return []

                return CONSTRUCTION_AREA_COHORTS.map(cohort => {
                  const constraint =
                    resolveConstructionAreaConstraint(cohort.value)

                  if (!constraint) {
                    throw new Error(
                      `Unknown construction area cohort: ${cohort.value}`
                    )
                  }

                  const count = validListings.filter(listing =>
                    matchesConstructionAreaConstraint(
                      listing.construction_area,
                      cohort.value
                    )
                  ).length

                  return {
                    value: cohort.label,
                    count,
                    percentage: Number(
                      ((count / validListings.length) * 100).toFixed(2)
                    )
                  }
                })
              }

          function applyTransactionFilter(
            listings: Listing[],
            transactionType?: string
          ) {
            if (transactionType === 'sale') {
              return listings.filter((listing) => {
                const type =
                  listing.transaction_type
                    ?.toLowerCase()
                    .trim()

                return type === 'buy' || type === 'sale'
              })
            }

            if (transactionType === 'rent') {
              return listings.filter((listing) => {
                const type =
                  listing.transaction_type
                    ?.toLowerCase()
                    .trim()

                return type === 'rent' || type === 'lease'
              })
            }

            return listings
          }

          export async function getMatchingListings(
                filters: MarketFilters
              ) {
                const {
                transaction_type,
                province,
                canton,
                district,
                property_area,
                construction_area,
                distance_to_paved_road_range,
                ...ontologyFilters
              } = filters

                const listingSelect = `
                    id,
                    title,
                    images,
                    transaction_type,
                    currency,
                    monthly_price,
                    property_area,
                    construction_area,
                    distance_to_paved_road_range,
                    province,
                    canton,
                    district,
                    property_type,
                    bedrooms,
                    bathrooms,
                    parking,
                    price_millions,
                    current_price,
                    created_at
                  `

                const terms = await resolveFilterTerms(ontologyFilters)

                const listingQuery = () => {
                  let query = supabase.from('listings')
                    .select(listingSelect, { count: 'exact' })
                    .eq('listing_status', 'active')
                  if (transaction_type === 'sale') {
                    query = query.or('transaction_type.ilike.*sale*,transaction_type.ilike.*buy*')
                  } else if (transaction_type === 'rent') {
                    query = query.or('transaction_type.ilike.*rent*,transaction_type.ilike.*lease*')
                  }
                  return query.order('id', { ascending: true })
                }

                let listings: Listing[] = []

                if (!terms.length) {
                  listings = await completePopulationRows<Listing>((from, to) =>
                    listingQuery().range(from, to)
                  )
                } else {
                  const termsByType = new Map<string, number[]>()

                  for (const term of terms) {
                    const existing =
                      termsByType.get(term.term_type) || []

                    existing.push(term.id)

                    termsByType.set(term.term_type, existing)
                  }

                  const termIds = terms.map(term => term.id)

                  const assignedRows: { listing_id: string; ontology_term_id: number }[] = []
                  for (const ids of populationInputChunks(termIds)) {
                    assignedRows.push(...await completePopulationRows<(typeof assignedRows)[number]>((from, to) =>
                      supabase.from('listings_ontology_terms')
                        .select('listing_id, ontology_term_id', { count: 'exact' })
                        .in('ontology_term_id', ids)
                        .order('listing_id', { ascending: true })
                        .order('ontology_term_id', { ascending: true })
                        .range(from, to)
                    ))
                  }

                  const listingsByType = new Map<string, Set<string>>()

                  for (const [termType, ids] of termsByType) {
                    const matchingRows = (assignedRows || []).filter(row =>
                      ids.includes(row.ontology_term_id)
                    )

                    listingsByType.set(
                      termType,
                      new Set(
                        matchingRows.map(row => row.listing_id)
                      )
                    )
                  }

                  const listingSets =
                    Array.from(listingsByType.values())

                  if (!listingSets.length) return []

                  let matchingListingIds =
                    Array.from(listingSets[0])

                  for (let i = 1; i < listingSets.length; i++) {
                    matchingListingIds =
                      matchingListingIds.filter(id =>
                        listingSets[i].has(id)
                      )
                  }

                  if (!matchingListingIds.length) return []

                  for (const ids of populationInputChunks(matchingListingIds)) {
                    listings.push(...await completePopulationRows<Listing>((from, to) =>
                      listingQuery().in('id', ids).range(from, to)
                    ))
                  }
                }

                // Recombine disjoint chunks into one stable population order.
                listings.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
                if (new Set(listings.map(listing => listing.id)).size !== listings.length) {
                  throw new Error('Population pagination returned duplicate listing IDs.')
                }

                if (province) {
                    listings = listings.filter(listing =>
                      slugify(listing.province || '') === province ||
                      slugify(listing.province || '').includes(province)
                    )
                  }

                  if (canton) {
                    listings = listings.filter(listing =>
                      slugify(listing.canton || '') === canton ||
                      slugify(listing.canton || '').includes(canton)
                    )
                  }

                  if (district) {
                    const selectedDistrictSlugs =
                      district.split(',')

                    const selectedDistrictNames =
                      await getDistrictNamesFromSlugs(selectedDistrictSlugs)

                    listings = listings.filter(listing => {
                      const listingDistrictSlug =
                        slugify(listing.district || '')

                      const listingDistrictName =
                        normalizeText(listing.district || '')

                      return (
                        listingDistrictSlug.length > 0 &&
                          selectedDistrictSlugs.some(selectedSlug =>
                            selectedSlug.startsWith(listingDistrictSlug)
                          ) ||
                        selectedDistrictNames.some(selectedName =>
                          normalizeText(selectedName) === listingDistrictName
                        )
                      )
                    })
                  }

                  if (property_area) {
                    listings = listings.filter(listing =>
                      matchesPropertyAreaConstraint(
                        listing.property_area,
                        property_area
                      )
                    )
                  }

                  if (construction_area) {
                    listings = listings.filter(listing =>
                      matchesConstructionAreaConstraint(
                        listing.construction_area,
                        construction_area
                      )
                    )
                  }

                  if (distance_to_paved_road_range) {
                    listings = listings.filter(
                      listing =>
                        listing.distance_to_paved_road_range ===
                        distance_to_paved_road_range
                    )
                  }

                return applyTransactionFilter(
                  listings,
                  transaction_type
                )
          }

export function calculateStatistics(
  listings:
    Listing[],

  context:
    MarketAnalyticalContext
) {

  const usdToCrcRate =
    context.fx.rate


  const saleListings =
    listings.filter(
      listing =>
        listing.transaction_type ===
          'buy' ||
        listing.transaction_type ===
          'sale'
    )


  const rentalListings =
    listings.filter(
      listing =>
        listing.transaction_type ===
          'rent' ||
        listing.transaction_type ===
          'lease'
    )


  const salePrices =
  validNumbers(
    saleListings.map(
      listing =>
        resolveListingAmountCrc(
          listing,
          usdToCrcRate
        )
    )
  )


  const rentValuesCRC =
  validNumbers(
    rentalListings.map(
      listing =>
        resolveListingAmountCrc(
          listing,
          usdToCrcRate
        )
    )
  )


  const rentValuesUSD =
  validNumbers(
    rentalListings.map(
      listing =>
        resolveListingAmountUsd(
          listing,
          usdToCrcRate
        )
    )
  )


  const propertyAreas =
    validNumbers(
      listings.map(
        listing =>
          listing.property_area
      )
    )


  const constructionAreas =
    validNumbers(
      listings.map(
        listing =>
          listing.construction_area
      )
    )


  const pricePerM2Values =
  saleListings
    .map(
      listing => {
        const priceCRC =
          resolveListingAmountCrc(
            listing,
            usdToCrcRate
          )

        const area =
          listing.property_area

        if (
          priceCRC === null ||
          area === null ||
          !Number.isFinite(area) ||
          area <= 0
        ) {
          return null
        }

        return priceCRC / area
      }
    )
    .filter(
      (value): value is number =>
        typeof value === 'number' &&
        Number.isFinite(value)
    )


  const thirtyDaysAgo =
    Date.now() -
      30 *
      24 *
      60 *
      60 *
      1000


  const recentListingCount =
    listings.filter(
      listing => {

        if (
          !listing.created_at
        ) {
          return false
        }


        return (
          new Date(
            listing.created_at
          ).getTime() >=
          thirtyDaysAgo
        )
      }
    ).length


  return {
    totalListings:
      listings.length,

    saleListings:
      saleListings.length,

    rentalListings:
      rentalListings.length,

    averageSalePrice:
      average(
        salePrices
      ),

    medianSalePrice:
      median(
        salePrices
      ),

    averageRentCRC:
      average(
        rentValuesCRC
      ),

    medianRentCRC:
      median(
        rentValuesCRC
      ),

    averageRentUSD:
      average(
        rentValuesUSD
      ),

    medianRentUSD:
      median(
        rentValuesUSD
      ),

    averagePropertyArea:
      metricWithMinimumSample(
        propertyAreas
      ),

    averageConstructionArea:
      metricWithMinimumSample(
        constructionAreas
      ),

    averagePricePerM2:
      metricWithMinimumSample(
        pricePerM2Values
      ),

    propertyAreaSampleSize:
      propertyAreas.length,

    constructionAreaSampleSize:
      constructionAreas.length,

    pricePerM2SampleSize:
      pricePerM2Values.length,

    rentCRCSampleSize:
      rentValuesCRC.length,

    rentUSDSampleSize:
      rentValuesUSD.length,

    salePriceSampleSize:
      salePrices.length,

    recentListingCount
  }
}

export async function calculateDistribution(
  listingIds: string[],
  termType: string
): Promise<DistributionRow[]> {
  if (!listingIds.length) return []

  if (!INTELLIGENCE_TERM_TYPES.includes(termType)) {
    return []
  }

  const { data, error } = await supabase
    .from('listings_ontology_terms')
    .select(`
      listing_id,
      ontology_terms (
        id,
        term_name,
        term_name_en,
        term_type,
        slug,
        official_code
      )
    `)
    .in('listing_id', listingIds)

  if (error) throw error

  const listingIdsByValue = new Map<string, Set<string>>()

  for (const row of data || []) {
    const term = Array.isArray(row.ontology_terms)
      ? row.ontology_terms[0]
      : row.ontology_terms

    if (!term) continue
    if (term.term_type !== termType) continue
    if (term.term_type === 'root') continue
    if (term.term_type === 'country') continue

    const value =
      term.term_name_en ||
      term.term_name ||
      term.slug

    const existing =
      listingIdsByValue.get(value) || new Set<string>()

    existing.add(row.listing_id)

    listingIdsByValue.set(value, existing)
  }

  return Array.from(listingIdsByValue.entries())
    .map(([value, ids]) => ({
      value,
      count: ids.size,
      percentage: Number(((ids.size / listingIds.length) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getMarketStatistics(
  filters:
    MarketFilters,

  suppliedContext?:
    MarketAnalyticalContext
) {

  const context =
    suppliedContext ??
    await resolveMarketAnalyticalContext()


  const listings =
    await getMatchingListings(
      filters
    )


  const listingIds =
    listings.map(
      listing =>
        listing.id
    )


  const statistics =
    calculateStatistics(
      listings,
      context
    )

 const distributions = {
            province: calculateListingFieldDistribution(listings, 'province'),
            canton: calculateListingFieldDistribution(listings, 'canton'),
            district: calculateListingFieldDistribution(listings, 'district'),

            property_type: await calculateDistribution(listingIds, 'property_type'),

            bedrooms: await calculateDistribution(listingIds, 'bedrooms'),
            bathrooms: await calculateDistribution(listingIds, 'bathrooms'),
            parking: await calculateDistribution(listingIds, 'parking'),

            year_built: await calculateDistribution(listingIds, 'year_built'),

            property_area:
            calculatePropertyAreaDistribution(listings),

            construction_area:
            calculateConstructionAreaDistribution(listings),

            utility: await calculateDistribution(listingIds, 'utility'),
            environment: await calculateDistribution(listingIds, 'environment'),
            terrain: await calculateDistribution(listingIds, 'terrain'),
            accessibility: await calculateDistribution(listingIds, 'accessibility'),
            legal_status: await calculateDistribution(listingIds, 'legal_status')
          }

    return {
        filters,
        statistics,
        distributions,
        listings,

        analyticalContext:
          context
      }
    }

export async function saveMarketStatistics(
  entityType: string,
  entitySlug: string,
  data: Awaited<ReturnType<typeof getMarketStatistics>>
) {
  const stats = data.statistics

  const { error: upsertStatsError } = await supabase
      .from('market_statistics')
      .upsert(
        {
          entity_type: entityType,
          entity_slug: entitySlug,

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

          recent_listing_count: stats.recentListingCount,

          rent_crc_sample_size: stats.rentCRCSampleSize,
          rent_usd_sample_size: stats.rentUSDSampleSize,
          sale_price_sample_size: stats.salePriceSampleSize,
          property_area_sample_size: stats.propertyAreaSampleSize,
          construction_area_sample_size: stats.constructionAreaSampleSize,
          price_per_m2_sample_size: stats.pricePerM2SampleSize
        },
        {
          onConflict: 'entity_type,entity_slug'
        }
      )

    if (upsertStatsError) throw upsertStatsError

      const distributionRows = Object.entries(data.distributions).flatMap(
        ([distributionType, rows]) =>
          rows.map(row => ({
            entity_type: entityType,
            entity_slug: entitySlug,
            distribution_type: distributionType,
            value: row.value,
            listing_count: row.count,
            percentage: row.percentage
          }))
      )

      const { error: deleteDistributionError } = await supabase
        .from('market_distribution_statistics')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_slug', entitySlug)

      if (deleteDistributionError) throw deleteDistributionError

      if (distributionRows.length) {
        const { error: insertDistributionError } = await supabase
          .from('market_distribution_statistics')
          .insert(distributionRows)

        if (insertDistributionError) throw insertDistributionError
      }

      return {
        saved: true,
        entityType,
        entitySlug
      }
    }
  
    export async function getCachedMarketStatistics(
      entityType: string,
      entitySlug: string
    ) {
      const { data: statistics, error: statisticsError } = await supabase
        .from('market_statistics')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_slug', entitySlug)
        .single()

      if (statisticsError) throw statisticsError

      const { data: distributions, error: distributionsError } =
        await supabase
          .from('market_distribution_statistics')
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_slug', entitySlug)

      if (distributionsError) throw distributionsError

      return {
        statistics,
        distributions
      }
    }

  