/**
 * ---------------------------------------------------------
 * PHASE 12 — PROPERTY POSITION LANGUAGE BOUNDARY
 * ---------------------------------------------------------
 *
 * Phase 12 reports quantitative distributional evidence.
 *
 * It does not convert observed Price / m² position into:
 *
 * - valuation
 * - pricing advice
 * - decision advice
 * - qualitative market classification
 * - causal attribution
 *
 * Twuanis reports market evidence.
 * Twuanis does not prescribe decisions.
 */

export const PRICE_METER_PROPERTY_POSITION_FORBIDDEN_TERMS = [
  'cheap',
  'expensive',
  'bargain',
  'premium',
  'underpriced',
  'overpriced',
  'undervalued',
  'overvalued',
  'fairly priced',
  'correctly priced',
  'mispriced',
  'good deal',
  'bad deal',
] as const


export const PRICE_METER_PROPERTY_POSITION_ALLOWED_EVIDENCE = [
  'property_price_per_m2',
  'comparison_population_count',
  'minimum',
  'p10',
  'p25',
  'median',
  'p75',
  'p90',
  'maximum',
  'percentile',
  'below_count',
  'equal_count',
  'above_count',
  'difference_from_median',
  'percent_difference_from_median',
  'distribution_interval',
  'tail_threshold',
  'difference_from_tail_threshold',
  'percent_difference_from_tail_threshold',
  'construction_to_land_ratio',
  'confidence',
] as const


export type PriceMeterPropertyPositionForbiddenTerm =
  typeof PRICE_METER_PROPERTY_POSITION_FORBIDDEN_TERMS[number]


export type PriceMeterPropertyPositionAllowedEvidence =
  typeof PRICE_METER_PROPERTY_POSITION_ALLOWED_EVIDENCE[number]


/**
 * Phase 12 percentage statements must preserve their
 * explicit numerical reference.
 */
export type PriceMeterPropertyPositionPercentageReference =
  | 'selected_population_median'
  | 'selected_population_p10'
  | 'selected_population_p90'


/**
 * Canonical Phase 12 epistemic boundary.
 *
 * Presentation layers may describe the numerical evidence
 * represented by the canonical Property Position result.
 *
 * They may not reinterpret that evidence as a statement
 * about intrinsic value, fair value, appropriate price,
 * recommended action, or causal explanation.
 */
export const PRICE_METER_PROPERTY_POSITION_EPISTEMIC_BOUNDARY = {
  reports:
    'market_evidence',

  prescribes:
    false,

  establishesValue:
    false,

  establishesFairPrice:
    false,

  establishesRecommendedPrice:
    false,

  establishesDecision:
    false,

  establishesCausation:
    false,

  establishesQualitativePriceClassification:
    false,
} as const