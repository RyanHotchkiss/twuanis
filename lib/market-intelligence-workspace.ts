import {
  getExplorerOptions
} from '@/lib/explorer-options-engine'

import {
  exploreMarket
} from '@/lib/explorer-engine'

import {
  getPriceMeterAnalysis
} from '@/lib/price-meter-engine'

import {
  getPricingStrategy
} from '@/lib/pricing-strategy-engine'

import {
  getMarketScarcity
} from '@/lib/market-scarcity-engine'

import {
  getBuyerDemand
} from '@/lib/buyer-demand-engine'

import {
  getMarketMatches
} from '@/lib/market-matching-engine'

import {
  getValuation
} from '@/lib/valuation-engine'

import {
  getMarketComparison
} from '@/lib/market-comparison-engine'


export type MarketIntelligenceLanguage =
  | 'en'
  | 'es'


export type MarketIntelligenceSearchParams = {
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
  b_distance_to_paved_road_range?: string
  a_distance_to_paved_road_range?: string
  distance_to_paved_road_range?: string
  legal_status?: string
  tab?: string

  a_transaction_type?: string
  a_province?: string
  a_canton?: string
  a_district?: string
  a_property_type?: string
  a_bedrooms?: string
  a_bathrooms?: string
  a_parking?: string
  a_price_range?: string
  a_year_built?: string
  a_property_area?: string
  a_construction_area?: string
  a_utility?: string
  a_environment?: string
  a_terrain?: string
  a_accessibility?: string
  a_legal_status?: string

  b_transaction_type?: string
  b_province?: string
  b_canton?: string
  b_district?: string
  b_property_type?: string
  b_bedrooms?: string
  b_bathrooms?: string
  b_parking?: string
  b_price_range?: string
  b_year_built?: string
  b_property_area?: string
  b_construction_area?: string
  b_utility?: string
  b_environment?: string
  b_terrain?: string
  b_accessibility?: string
  b_legal_status?: string
}


export type ResolvedMarketIntelligenceWorkspace = {
  language:
    MarketIntelligenceLanguage

  activeTab:
    string

  options:
    any

  filters:
    Record<
      string,
      string | undefined
    >

  engineFilters:
    Record<
      string,
      string | undefined
    >

  comparisonFilters:
    Record<
      string,
      string | undefined
    >

  explorerResult:
    any

  priceMeterAnalysis:
    any

  pricingStrategy:
    any

  marketScarcity:
    any

  buyerDemand:
    any

  marketMatches:
    any

  valuation:
    any

  comparison:
    any
}


export async function resolveMarketIntelligenceWorkspace({
  params,
  language
}: {
  params:
    MarketIntelligenceSearchParams

  language:
    MarketIntelligenceLanguage
}): Promise<
  ResolvedMarketIntelligenceWorkspace
> {

  /*
   * -----------------------------------------------------
   * CANONICAL EXPLORER OPTIONS
   * -----------------------------------------------------
   */

  const options =
    await getExplorerOptions()


  /*
   * -----------------------------------------------------
   * SINGLE-MARKET FILTERS
   * -----------------------------------------------------
   */

  const enginefilters = {
    transaction_type:
      params.transaction_type,

    province:
      params.province,

    canton:
      params.canton,

    district:
      params.district,

    property_type:
      params.property_type,

    bedrooms:
      params.bedrooms,

    bathrooms:
      params.bathrooms,

    parking:
      params.parking,

    year_built:
      params.year_built,

    property_area:
      params.property_area,

    construction_area:
      params.construction_area,

    utility:
      params.utility,

    environment:
      params.environment,

    terrain:
      params.terrain,

    accessibility:
      params.accessibility,

    distance_to_paved_road_range:
      params.distance_to_paved_road_range,

    legal_status:
      params.legal_status
  }


  /*
   * -----------------------------------------------------
   * MARKET COMPARISON FILTERS
   * -----------------------------------------------------
   */

  const comparisonFilters = {
    a_transaction_type:
      params.a_transaction_type,

    a_province:
      params.a_province,

    a_canton:
      params.a_canton,

    a_district:
      params.a_district,

    a_property_type:
      params.a_property_type,

    a_bedrooms:
      params.a_bedrooms,

    a_bathrooms:
      params.a_bathrooms,

    a_parking:
      params.a_parking,

    a_price_range:
      params.a_price_range,

    a_year_built:
      params.a_year_built,

    a_property_area:
      params.a_property_area,

    a_construction_area:
      params.a_construction_area,

    a_utility:
      params.a_utility,

    a_environment:
      params.a_environment,

    a_terrain:
      params.a_terrain,

    a_accessibility:
      params.a_accessibility,

    a_distance_to_paved_road_range:
      params.a_distance_to_paved_road_range,

    a_legal_status:
      params.a_legal_status,


    b_transaction_type:
      params.b_transaction_type,

    b_province:
      params.b_province,

    b_canton:
      params.b_canton,

    b_district:
      params.b_district,

    b_property_type:
      params.b_property_type,

    b_bedrooms:
      params.b_bedrooms,

    b_bathrooms:
      params.b_bathrooms,

    b_parking:
      params.b_parking,

    b_price_range:
      params.b_price_range,

    b_year_built:
      params.b_year_built,

    b_property_area:
      params.b_property_area,

    b_construction_area:
      params.b_construction_area,

    b_utility:
      params.b_utility,

    b_environment:
      params.b_environment,

    b_terrain:
      params.b_terrain,

    b_accessibility:
      params.b_accessibility,

    b_distance_to_paved_road_range:
      params.b_distance_to_paved_road_range,

    b_legal_status:
      params.b_legal_status
  }


  /*
   * -----------------------------------------------------
   * ONTOLOGY FILTER NORMALIZATION
   * -----------------------------------------------------
   */

  function resolveFilterValue(
    value:
      string | undefined,

    filterOptions:
      any[] = []
  ): string | undefined {

    if (!value) {
      return undefined
    }


    const match =
      filterOptions.find(
        (
          option:
            any
        ) =>
          option.slug ===
            value ||

          option.slug_en ===
            value ||

          option.slug_es ===
            value ||

          option.term_name ===
            value ||

          option.term_name_en ===
            value ||

          option.term_name_es ===
            value
      )


    return (
      match?.term_name ??
      value
    )
  }


  const engineFilters = {
    ...enginefilters,

    province:
      enginefilters.province,

    canton:
      enginefilters.canton,

    district:
      enginefilters.district,

    property_type:
      resolveFilterValue(
        enginefilters.property_type,
        options.property_type
      ),

    bedrooms:
      resolveFilterValue(
        enginefilters.bedrooms,
        options.bedrooms
      ),

    bathrooms:
      resolveFilterValue(
        enginefilters.bathrooms,
        options.bathrooms
      ),

    parking:
      resolveFilterValue(
        enginefilters.parking,
        options.parking
      ),

    year_built:
      resolveFilterValue(
        enginefilters.year_built,
        options.year_built
      ),

    property_area:
      resolveFilterValue(
        enginefilters.property_area,
        options.property_area
      ),

    construction_area:
      resolveFilterValue(
        enginefilters.construction_area,
        options.construction_area
      ),

    utility:
      resolveFilterValue(
        enginefilters.utility,
        options.utility
      ),

    environment:
      resolveFilterValue(
        enginefilters.environment,
        options.environment
      ),

    terrain:
      resolveFilterValue(
        enginefilters.terrain,
        options.terrain
      ),

    accessibility:
      resolveFilterValue(
        enginefilters.accessibility,
        options.accessibility
      ),

    distance_to_paved_road_range:
      enginefilters.distance_to_paved_road_range,

    legal_status:
      resolveFilterValue(
        enginefilters.legal_status,
        options.legal_status
      )
  }


  /*
   * -----------------------------------------------------
   * ACTIVE ENGINE
   * -----------------------------------------------------
   */

  const activeTab =
    params.tab ||
    'explorer'


  const hasFilters =
    Object.values(
      engineFilters
    ).some(
      Boolean
    )


  /*
   * -----------------------------------------------------
   * CANONICAL INTELLIGENCE RESOLUTION
   * -----------------------------------------------------
   *
   * Preserve the current public Intelligence behavior
   * exactly while moving ownership out of the pages.
   * -----------------------------------------------------
   */

  let explorerResult = null
  let priceMeterAnalysis = null
  let pricingStrategy = null
  let marketScarcity = null
  let marketMatches = null
  let valuation = null
  let buyerDemand = null
  let comparison = null

  switch (activeTab) {
    case 'explorer':
      explorerResult = hasFilters
        ? await exploreMarket(engineFilters)
        : null
      break

    case 'price-meter':
      priceMeterAnalysis =
        engineFilters.transaction_type === 'sale' ||
        engineFilters.transaction_type === 'rent'
          ? await getPriceMeterAnalysis(
              engineFilters,
              language
            )
          : null
      break

    case 'pricing':
      pricingStrategy =
        await getPricingStrategy(
          engineFilters,
          language
        )
      break

    case 'scarcity':
      marketScarcity =
        await getMarketScarcity(
          engineFilters,
          language
        )
      break

    case 'matching':
      marketMatches =
        await getMarketMatches(
          engineFilters,
          language
        )
      break

    case 'valuation':
      valuation =
        await getValuation(
          engineFilters,
          language
        )
      break

    case 'buyer-demand':
      buyerDemand =
        await getBuyerDemand(
          engineFilters,
          language
        )
      break

    case 'comparison':
      comparison =
        await getMarketComparison(
          comparisonFilters,
          comparisonFilters,
          language
        )
      break
  }


  /*
   * -----------------------------------------------------
   * ACTIVE PRESENTATION FILTERS
   * -----------------------------------------------------
   */

  const filters =
    activeTab ===
      'comparison'
      ? comparisonFilters
      : enginefilters


  /*
   * -----------------------------------------------------
   * CANONICAL WORKSPACE STATE
   * -----------------------------------------------------
   */

  return {
    language,

    activeTab,

    options,

    filters,

    engineFilters,

    comparisonFilters,

    explorerResult,

    priceMeterAnalysis,

    pricingStrategy,

    marketScarcity,

    buyerDemand,

    marketMatches,

    valuation,

    comparison
  }
}