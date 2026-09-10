import type {
  ExplorerOptions
} from './types'


/*
 * =====================================================
 * CANONICAL INTELLIGENCE FILTER REGISTRY
 * =====================================================
 *
 * This module defines which market filters exist and
 * which Intelligence workspaces may use them.
 *
 * It does NOT:
 *
 * - hold filter state
 * - perform navigation
 * - execute analytical engines
 * - query Supabase
 * - normalize filter values
 * - render controls
 *
 * Intelligence engines declare filter requirements.
 * They do not implement filter behavior.
 * =====================================================
 */


export const INTELLIGENCE_FILTER_KEYS = [
  'transaction_type',
  'province',
  'canton',
  'district',
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'price_range',
  'property_area',
  'construction_area',
  'year_built',
  'environment',
  'terrain',
  'utility',
  'accessibility',
  'distance_to_paved_road_range',
  'legal_status'
] as const


export type IntelligenceFilterKey =
  typeof INTELLIGENCE_FILTER_KEYS[number]


export type IntelligenceFilterSection =
  | 'location'
  | 'market'


export type IntelligenceFilterOptionSource =
  | keyof ExplorerOptions
  | 'transaction'
  | 'price_range'
  | 'paved_road_distance'


export type IntelligenceFilterDefinition = {
  key:
    IntelligenceFilterKey

  section:
    IntelligenceFilterSection

  optionSource:
    IntelligenceFilterOptionSource

  order:
    number
}


/*
 * =====================================================
 * FILTER DEFINITIONS
 * =====================================================
 *
 * This is the canonical inventory of Intelligence
 * filters.
 *
 * Presentation labels remain in translations.ts.
 * Option values remain in their canonical sources.
 * Dependency behavior remains in utils.ts.
 * =====================================================
 */


export const INTELLIGENCE_FILTER_REGISTRY:
  Record<
    IntelligenceFilterKey,
    IntelligenceFilterDefinition
  > = {

  transaction_type: {
    key:
      'transaction_type',
    section:
      'market',
    optionSource:
      'transaction',
    order:
      10
  },

  province: {
    key:
      'province',
    section:
      'location',
    optionSource:
      'province',
    order:
      20
  },

  canton: {
    key:
      'canton',
    section:
      'location',
    optionSource:
      'canton',
    order:
      30
  },

  district: {
    key:
      'district',
    section:
      'location',
    optionSource:
      'district',
    order:
      40
  },

  property_type: {
    key:
      'property_type',
    section:
      'market',
    optionSource:
      'property_type',
    order:
      50
  },

  bedrooms: {
    key:
      'bedrooms',
    section:
      'market',
    optionSource:
      'bedrooms',
    order:
      60
  },

  bathrooms: {
    key:
      'bathrooms',
    section:
      'market',
    optionSource:
      'bathrooms',
    order:
      70
  },

  parking: {
    key:
      'parking',
    section:
      'market',
    optionSource:
      'parking',
    order:
      80
  },

  price_range: {
    key:
      'price_range',
    section:
      'market',
    optionSource:
      'price_range',
    order:
      90
  },

  property_area: {
    key:
      'property_area',
    section:
      'market',
    optionSource:
      'property_area',
    order:
      100
  },

  construction_area: {
    key:
      'construction_area',
    section:
      'market',
    optionSource:
      'construction_area',
    order:
      110
  },

  year_built: {
    key:
      'year_built',
    section:
      'market',
    optionSource:
      'year_built',
    order:
      120
  },

  environment: {
    key:
      'environment',
    section:
      'market',
    optionSource:
      'environment',
    order:
      130
  },

  terrain: {
    key:
      'terrain',
    section:
      'market',
    optionSource:
      'terrain',
    order:
      140
  },

  utility: {
    key:
      'utility',
    section:
      'market',
    optionSource:
      'utility',
    order:
      150
  },

  accessibility: {
    key:
      'accessibility',
    section:
      'market',
    optionSource:
      'accessibility',
    order:
      160
  },

  distance_to_paved_road_range: {
    key:
      'distance_to_paved_road_range',
    section:
      'market',
    optionSource:
      'paved_road_distance',
    order:
      170
  },

  legal_status: {
    key:
      'legal_status',
    section:
      'market',
    optionSource:
      'legal_status',
    order:
      180
  }
}


/*
 * =====================================================
 * INTELLIGENCE WORKSPACES
 * =====================================================
 */


export const INTELLIGENCE_WORKSPACE_IDS = [
  'explorer',
  'valuation',
  'pricing',
  'matching',
  'comparison',
  'scarcity',
  'price-meter',
  'buyer-demand',
  'market-velocity',
  'price-dynamics',
  'listing-lifecycle',
  'seller-behavior'
] as const


export type IntelligenceWorkspaceId =
  typeof INTELLIGENCE_WORKSPACE_IDS[number]


export type IntelligenceFilterAssemblyMode =
  | 'single'
  | 'comparison'


export type IntelligenceWorkspaceFilterDefinition = {
  id:
    IntelligenceWorkspaceId

  mode:
    IntelligenceFilterAssemblyMode

  filters:
    readonly IntelligenceFilterKey[]
}


/*
 * =====================================================
 * CURRENT CANONICAL FILTER SET
 * =====================================================
 *
 * Existing single-market Intelligence workspaces
 * currently expose the same canonical filter assembly.
 *
 * Individual workspaces may narrow this declaration
 * later without creating another filtering system.
 * =====================================================
 */


export const SINGLE_MARKET_INTELLIGENCE_FILTERS =
  INTELLIGENCE_FILTER_KEYS


/*
 * =====================================================
 * WORKSPACE FILTER REGISTRY
 * =====================================================
 *
 * Comparison uses two scoped instances of the same
 * canonical filter system:
 *
 *   a_<filter>
 *   b_<filter>
 *
 * It does not receive a separate filter architecture.
 * =====================================================
 */


export const INTELLIGENCE_WORKSPACE_FILTER_REGISTRY:
  Record<
    IntelligenceWorkspaceId,
    IntelligenceWorkspaceFilterDefinition
  > = {

  explorer: {
    id:
      'explorer',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  valuation: {
    id:
      'valuation',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  pricing: {
    id:
      'pricing',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  matching: {
    id:
      'matching',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  comparison: {
    id:
      'comparison',
    mode:
      'comparison',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  scarcity: {
    id:
      'scarcity',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'price-meter': {
    id:
      'price-meter',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'buyer-demand': {
    id:
      'buyer-demand',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'market-velocity': {
    id:
      'market-velocity',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'price-dynamics': {
    id:
      'price-dynamics',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'listing-lifecycle': {
    id:
      'listing-lifecycle',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  },

  'seller-behavior': {
    id:
      'seller-behavior',
    mode:
      'single',
    filters:
      SINGLE_MARKET_INTELLIGENCE_FILTERS
  }
}


/*
 * =====================================================
 * REGISTRY ACCESS
 * =====================================================
 */


export function getIntelligenceWorkspaceFilterDefinition(
  workspace:
    IntelligenceWorkspaceId
): IntelligenceWorkspaceFilterDefinition {

  return (
    INTELLIGENCE_WORKSPACE_FILTER_REGISTRY[
      workspace
    ]
  )
}


export function getIntelligenceFilterDefinition(
  key:
    IntelligenceFilterKey
): IntelligenceFilterDefinition {

  return (
    INTELLIGENCE_FILTER_REGISTRY[
      key
    ]
  )
}


export function getIntelligenceFiltersForSection(
  keys:
    readonly IntelligenceFilterKey[],

  section:
    IntelligenceFilterSection
): IntelligenceFilterDefinition[] {

  return keys
    .map(
      key =>
        getIntelligenceFilterDefinition(
          key
        )
    )
    .filter(
      definition =>
        definition.section ===
        section
    )
    .sort(
      (a, b) =>
        a.order -
        b.order
    )
}