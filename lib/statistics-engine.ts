import { supabase } from '@/lib/supabase'

const MIN_SAMPLE_SIZE = 10
const CRC_PER_USD = 500

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
  property_area: string | null
  construction_area: string | null
  created_at: string | null
}

type DistributionRow = {
  value: string
  count: number
  percentage: number
}

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

async function getDistrictNamesFromSlugs(districtSlugs: string[]) {
  const { data, error } = await supabase
    .from('ontology_terms')
    .select('term_name, term_name_en, slug')
    .eq('term_type', 'district')
    .in('slug', districtSlugs)

  if (error) throw error

  return (data || []).map(term =>
    term.term_name_en || term.term_name || term.slug
  )
}

function average(values: number[]) {
            if (!values.length) return null

            return values.reduce((sum, value) => sum + value, 0) / values.length
          }

          function usdToCRC(value: number) {
            return value * CRC_PER_USD
          }

          function crcToUSD(value: number) {
            return value / CRC_PER_USD
          }

          function numericArea(value: string | null) {
            if (!value) return null

            const cleaned = value.replace(/[^0-9.]/g, '')
            const number = Number(cleaned)

            return Number.isFinite(number) ? number : null
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

              const { data, error } = await supabase
                .from('ontology_terms')
                .select('id, term_name, term_type, slug')
                .eq('term_type', termType)
                .in('slug', values)

              if (error) throw error

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

                let listings: Listing[] = []

                if (!terms.length) {
                  const { data, error } = await supabase
                    .from('listings')
                    .select(listingSelect)
                    .eq('listing_status', 'active')

                  if (error) throw error

                  listings = data || []
                } else {
                  const termsByType = new Map<string, number[]>()

                  for (const term of terms) {
                    const existing =
                      termsByType.get(term.term_type) || []

                    existing.push(term.id)

                    termsByType.set(term.term_type, existing)
                  }

                  const termIds = terms.map(term => term.id)

                  const { data: assignedRows, error: assignmentError } =
                    await supabase
                      .from('listings_ontology_terms')
                      .select('listing_id, ontology_term_id')
                      .in('ontology_term_id', termIds)

                  if (assignmentError) throw assignmentError

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

                  const { data, error } = await supabase
                    .from('listings')
                    .select(listingSelect)
                    .in('id', matchingListingIds)
                    .eq('listing_status', 'active')

                  if (error) throw error

                  listings = data || []
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

                return applyTransactionFilter(
                  listings,
                  transaction_type
                )
          }

export function calculateStatistics(listings: Listing[]) {
  const saleListings = listings.filter(listing => {
    return listing.transaction_type === 'buy' || listing.transaction_type === 'sale'
  })

  const rentalListings = listings.filter(listing => {
    return listing.transaction_type === 'rent' || listing.transaction_type === 'lease'
  })

  const salePrices = validNumbers(
      saleListings.map(listing => {
        const price =
          listing.current_price

        if (!price || price <= 1) return null

        return listing.currency === 'CRC'
          ? price
          : usdToCRC(price)
      })
    )

  const rentValuesCRC = validNumbers(
      rentalListings.map(listing => {
        if (listing.monthly_price === null) return null

        const price = listing.monthly_price

        if (price >= 100000) {
          return price
        }

        return usdToCRC(price)
      })
    )

    const rentValuesUSD = rentValuesCRC.map(value =>
      crcToUSD(value)
    )

  const propertyAreas = validNumbers(
    listings.map(listing => numericArea(listing.property_area))
  )

  const constructionAreas = validNumbers(
    listings.map(listing => numericArea(listing.construction_area))
  )

  const pricePerM2Values = saleListings
      .map(listing => {
        const price =
          listing.current_price

        const area =
          numericArea(listing.property_area)

        if (!price || !area) return null

        const priceCRC =
          listing.currency === 'CRC'
            ? price
            : usdToCRC(price)

        return priceCRC / area
      })
      .filter((value): value is number => {
        return typeof value === 'number' && Number.isFinite(value)
      })

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  const recentListingCount = listings.filter(listing => {
    if (!listing.created_at) return false

    return new Date(listing.created_at).getTime() >= thirtyDaysAgo
  }).length

  console.log(
  'SALE PRICE DEBUG:',
  saleListings.slice(0, 10).map(l => ({
    currency: l.currency,
    current_price: l.current_price,
    price_millions: l.price_millions
  }))
)

  return {
    totalListings: listings.length,

    saleListings: saleListings.length,
    rentalListings: rentalListings.length,

    averageSalePrice: average(salePrices),
    medianSalePrice: median(salePrices),

    averageRentCRC: average(rentValuesCRC),
    medianRentCRC: median(rentValuesCRC),

    averageRentUSD: average(rentValuesUSD),
    medianRentUSD: median(rentValuesUSD),

    averagePropertyArea: metricWithMinimumSample(propertyAreas),
    averageConstructionArea: metricWithMinimumSample(constructionAreas),
    averagePricePerM2: metricWithMinimumSample(pricePerM2Values),

    propertyAreaSampleSize: propertyAreas.length,
    constructionAreaSampleSize: constructionAreas.length,
    pricePerM2SampleSize: pricePerM2Values.length,

    rentCRCSampleSize: rentValuesCRC.length,
    rentUSDSampleSize: rentValuesUSD.length,
    salePriceSampleSize: salePrices.length,

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

export async function getMarketStatistics(filters: MarketFilters) {
  const listings = await getMatchingListings(filters)


  const listingIds = listings.map(listing => listing.id)

  const statistics = calculateStatistics(listings)

 const distributions = {
            province: calculateListingFieldDistribution(listings, 'province'),
            canton: calculateListingFieldDistribution(listings, 'canton'),
            district: calculateListingFieldDistribution(listings, 'district'),

            property_type: await calculateDistribution(listingIds, 'property_type'),

            bedrooms: await calculateDistribution(listingIds, 'bedrooms'),
            bathrooms: await calculateDistribution(listingIds, 'bathrooms'),
            parking: await calculateDistribution(listingIds, 'parking'),

            year_built: await calculateDistribution(listingIds, 'year_built'),

            property_area: await calculateDistribution(listingIds, 'property_area'),
            construction_area: await calculateDistribution(listingIds, 'construction_area'),

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
    listings
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

  