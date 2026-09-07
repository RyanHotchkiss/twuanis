/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL QUESTION MATRIX
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Define the complete canonical set of analytical questions
 * that Phase 11 is authorized to ask.
 *
 * Phase 11 grammar:
 *
 * One existing relationship
 * → One explicit analytical question
 * → One secondary dimension
 * → One bounded canonical population
 * → One analysis
 * → One evidence set
 * → One synthesis
 *
 * The owning phase determines the primary analytical
 * relationship.
 *
 * The selected secondary dimension determines the
 * populations across which that relationship is examined.
 *
 * Reciprocal pairings are permitted when their analytical
 * orientation differs.
 *
 * Mathematical computability does not constitute
 * analytical authorization.
 *
 * This file DOES NOT:
 *
 * - construct analytical populations
 * - assign listings to secondary cohorts
 * - calculate statistics
 * - calculate Persistence
 * - calculate Variation
 * - calculate Reversal
 * - calculate Non-establishment
 * - generate synthesis
 * - execute Phase 11 analysis
 */

import type {
  PriceMeterSizeRelationshipKind
} from '@/lib/price-meter-size-relationship'


/*
 * ---------------------------------------------------------
 * OWNING PHASE
 * ---------------------------------------------------------
 */

export type PriceMeterCrossDimensionalOwningPhase =
  | 'phase_7_geography'
  | 'phase_8_property_area'
  | 'phase_8_construction_area'
  | 'phase_9_construction_to_land'


/*
 * ---------------------------------------------------------
 * PRIMARY ANALYTICAL RELATIONSHIP
 * ---------------------------------------------------------
 */

export type PriceMeterCrossDimensionalPrimaryRelationship =
  | 'geographic_price_per_m2'
  | PriceMeterSizeRelationshipKind
  | 'construction_to_land_to_price_per_m2'


/*
 * ---------------------------------------------------------
 * SECONDARY DIMENSION
 * ---------------------------------------------------------
 *
 * These are the only dimensions authorized to partition
 * a Phase 11 bounded canonical population.
 *
 * Transaction Type, Property Basis, Normalization Basis,
 * arbitrary characteristics, Phase 10 populations, and
 * tertiary dimensions are intentionally excluded.
 */

export type PriceMeterCrossDimensionalSecondaryDimension =
  | 'geography'
  | 'property_area'
  | 'construction_area'
  | 'construction_to_land'


/*
 * ---------------------------------------------------------
 * MATHEMATICAL AUTHORIZATION
 * ---------------------------------------------------------
 *
 * "owning_phase" means the mathematical contract of the
 * owning Phase 7, 8, or 9 relationship travels unchanged
 * into the Cross-Dimensional analysis.
 *
 * The two Construction-to-Land secondary pairings under
 * Phase 8 require explicit validation before modeled
 * mathematics may be exposed.
 *
 * Phase 9 preserves its existing mathematical-coupling
 * restrictions.
 */

export type PriceMeterCrossDimensionalMathematicalAuthorization =
  | 'owning_phase'
  | 'explicit_coupling_validation_required'
  | 'phase_9_coupling_restrictions'


/*
 * ---------------------------------------------------------
 * QUESTION KEY
 * ---------------------------------------------------------
 *
 * Exactly ten keys are authorized.
 */

export type PriceMeterCrossDimensionalQuestionKey =
  | 'geography_by_property_area'
  | 'geography_by_construction_area'
  | 'geography_by_construction_to_land'
  | 'property_area_by_geography'
  | 'property_area_by_construction_to_land'
  | 'construction_area_by_geography'
  | 'construction_area_by_construction_to_land'
  | 'construction_to_land_by_geography'
  | 'construction_to_land_by_property_area'
  | 'construction_to_land_by_construction_area'


/*
 * ---------------------------------------------------------
 * QUESTION DEFINITION
 * ---------------------------------------------------------
 */

export type PriceMeterCrossDimensionalQuestionDefinition = {
  key:
    PriceMeterCrossDimensionalQuestionKey

  owningPhase:
    PriceMeterCrossDimensionalOwningPhase

  primaryRelationship:
    PriceMeterCrossDimensionalPrimaryRelationship

  secondaryDimension:
    PriceMeterCrossDimensionalSecondaryDimension

  mathematicalAuthorization:
    PriceMeterCrossDimensionalMathematicalAuthorization

  definition:
    string

  question:
    string

  reports:
    readonly string[]
}


/*
 * ---------------------------------------------------------
 * CANONICAL QUESTION MATRIX
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This matrix is the complete Phase 11 analytical
 * authorization surface.
 *
 * Adding a new Cross-Dimensional question requires an
 * explicit future analytical authorization decision.
 *
 * Do not dynamically manufacture pairings from the
 * available dimensions.
 */

export const PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS = [
  /*
   * -------------------------------------------------------
   * PHASE 7 — GEOGRAPHIC PRICE / M²
   * -------------------------------------------------------
   */

  {
    key:
      'geography_by_property_area',

    owningPhase:
      'phase_7_geography',

    primaryRelationship:
      'geographic_price_per_m2',

    secondaryDimension:
      'property_area',

    mathematicalAuthorization:
      'owning_phase',

    definition:
      'Examines whether and how the observed geographic Price / m² relationship changes across canonical Property Area cohorts.',

    question:
      'Do the geographic Price / m² ordering and differences observed in this market persist, vary, or reverse across Property Area cohorts?',

    reports: [
      'geographic_median_price_per_m2',
      'represented_property_populations',
      'absolute_differences',
      'percentage_differences_with_explicit_reference_populations',
      'geographic_ordering',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'geography_by_construction_area',

    owningPhase:
      'phase_7_geography',

    primaryRelationship:
      'geographic_price_per_m2',

    secondaryDimension:
      'construction_area',

    mathematicalAuthorization:
      'owning_phase',

    definition:
      'Examines whether and how the observed geographic Price / m² relationship changes across canonical Construction Area cohorts.',

    question:
      'Do the geographic Price / m² ordering and differences observed in this market persist, vary, or reverse across Construction Area cohorts?',

    reports: [
      'geographic_median_price_per_m2',
      'represented_property_populations',
      'absolute_differences',
      'percentage_differences_with_explicit_reference_populations',
      'geographic_ordering',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'geography_by_construction_to_land',

    owningPhase:
      'phase_7_geography',

    primaryRelationship:
      'geographic_price_per_m2',

    secondaryDimension:
      'construction_to_land',

    mathematicalAuthorization:
      'owning_phase',

    definition:
      'Examines whether and how the observed geographic Price / m² relationship changes across canonical Construction-to-Land cohorts.',

    question:
      'Do the geographic Price / m² ordering and differences observed in this market persist, vary, or reverse across Construction-to-Land cohorts?',

    reports: [
      'geographic_median_price_per_m2',
      'represented_property_populations',
      'absolute_differences',
      'percentage_differences_with_explicit_reference_populations',
      'geographic_ordering',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },


  /*
   * -------------------------------------------------------
   * PHASE 8 — PROPERTY AREA
   * -------------------------------------------------------
   */

  {
    key:
      'property_area_by_geography',

    owningPhase:
      'phase_8_property_area',

    primaryRelationship:
      'property_area_to_land_normalized_ratio',

    secondaryDimension:
      'geography',

    mathematicalAuthorization:
      'owning_phase',

    definition:
      'Examines whether and how the observed relationship between Property Area and land-normalized Price / m² changes across canonical geographic populations.',

    question:
      'Does the Property Area → land-normalized Price / m² relationship persist, vary, or reverse across geographic populations?',

    reports: [
      'canonical_property_area_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_authorized',
      'modeled_relationship_statistics_where_authorized',
      'r_squared_where_authorized',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'property_area_by_construction_to_land',

    owningPhase:
      'phase_8_property_area',

    primaryRelationship:
      'property_area_to_land_normalized_ratio',

    secondaryDimension:
      'construction_to_land',

    mathematicalAuthorization:
      'explicit_coupling_validation_required',

    definition:
      'Examines whether and how the observed relationship between Property Area and land-normalized Price / m² changes across canonical Construction-to-Land populations.',

    question:
      'Does the Property Area → land-normalized Price / m² relationship persist, vary, or reverse across Construction-to-Land cohorts?',

    reports: [
      'canonical_property_area_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_analytically_authorized',
      'modeled_relationship_statistics_only_where_explicitly_authorized',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },


  /*
   * -------------------------------------------------------
   * PHASE 8 — CONSTRUCTION AREA
   * -------------------------------------------------------
   */

  {
    key:
      'construction_area_by_geography',

    owningPhase:
      'phase_8_construction_area',

    primaryRelationship:
      'construction_area_to_construction_normalized_ratio',

    secondaryDimension:
      'geography',

    mathematicalAuthorization:
      'owning_phase',

    definition:
      'Examines whether and how the observed relationship between Construction Area and construction-normalized Price / m² changes across canonical geographic populations.',

    question:
      'Does the Construction Area → construction-normalized Price / m² relationship persist, vary, or reverse across geographic populations?',

    reports: [
      'canonical_construction_area_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_authorized',
      'modeled_relationship_statistics_where_authorized',
      'r_squared_where_authorized',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'construction_area_by_construction_to_land',

    owningPhase:
      'phase_8_construction_area',

    primaryRelationship:
      'construction_area_to_construction_normalized_ratio',

    secondaryDimension:
      'construction_to_land',

    mathematicalAuthorization:
      'explicit_coupling_validation_required',

    definition:
      'Examines whether and how the observed relationship between Construction Area and construction-normalized Price / m² changes across canonical Construction-to-Land populations.',

    question:
      'Does the Construction Area → construction-normalized Price / m² relationship persist, vary, or reverse across Construction-to-Land cohorts?',

    reports: [
      'canonical_construction_area_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_analytically_authorized',
      'modeled_relationship_statistics_only_where_explicitly_authorized',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },


  /*
   * -------------------------------------------------------
   * PHASE 9 — CONSTRUCTION-TO-LAND
   * -------------------------------------------------------
   */

  {
    key:
      'construction_to_land_by_geography',

    owningPhase:
      'phase_9_construction_to_land',

    primaryRelationship:
      'construction_to_land_to_price_per_m2',

    secondaryDimension:
      'geography',

    mathematicalAuthorization:
      'phase_9_coupling_restrictions',

    definition:
      'Examines whether and how the observed relationship between Construction-to-Land Ratio and Price / m² changes across canonical geographic populations.',

    question:
      'Does the Construction-to-Land → Price / m² relationship persist, vary, or reverse across geographic populations?',

    reports: [
      'canonical_construction_to_land_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_phase_9_requirements_are_met',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'construction_to_land_by_property_area',

    owningPhase:
      'phase_9_construction_to_land',

    primaryRelationship:
      'construction_to_land_to_price_per_m2',

    secondaryDimension:
      'property_area',

    mathematicalAuthorization:
      'phase_9_coupling_restrictions',

    definition:
      'Examines whether and how the observed Construction-to-Land → Price / m² relationship changes across canonical Property Area populations.',

    question:
      'Does the Construction-to-Land → Price / m² relationship persist, vary, or reverse across Property Area populations?',

    reports: [
      'canonical_construction_to_land_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_phase_9_requirements_are_met',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  },

  {
    key:
      'construction_to_land_by_construction_area',

    owningPhase:
      'phase_9_construction_to_land',

    primaryRelationship:
      'construction_to_land_to_price_per_m2',

    secondaryDimension:
      'construction_area',

    mathematicalAuthorization:
      'phase_9_coupling_restrictions',

    definition:
      'Examines whether and how the observed Construction-to-Land → Price / m² relationship changes across canonical Construction Area populations.',

    question:
      'Does the Construction-to-Land → Price / m² relationship persist, vary, or reverse across Construction Area populations?',

    reports: [
      'canonical_construction_to_land_cohort_medians',
      'represented_property_populations',
      'populated_cohort_counts',
      'spearman_rho_where_phase_9_requirements_are_met',
      'persistence',
      'variation',
      'reversal',
      'non_establishment'
    ]
  }
] as const satisfies readonly PriceMeterCrossDimensionalQuestionDefinition[]


/*
 * ---------------------------------------------------------
 * STRUCTURAL ASSERTION
 * ---------------------------------------------------------
 *
 * Phase 11 contains exactly ten authorized questions.
 *
 * This runtime assertion protects the canonical matrix from
 * accidental addition or removal during future development.
 */

if (
  PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS.length !==
    10
) {
  throw new Error(
    'Phase 11 must contain exactly ten authorized Cross-Dimensional analytical questions.'
  )
}


/*
 * ---------------------------------------------------------
 * QUESTION LOOKUP
 * ---------------------------------------------------------
 */

export function getPriceMeterCrossDimensionalQuestion(
  key:
    PriceMeterCrossDimensionalQuestionKey
): PriceMeterCrossDimensionalQuestionDefinition {

  const definition =
    PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS
      .find(
        candidate =>
          candidate.key ===
            key
      )


  if (
    !definition
  ) {
    throw new Error(
      `Unknown Price / m² Cross-Dimensional analytical question: ${key}.`
    )
  }


  return definition
}


/*
 * ---------------------------------------------------------
 * OWNERSHIP LOOKUP
 * ---------------------------------------------------------
 *
 * The UI may expose only questions belonging to the
 * analytical relationship currently being presented.
 *
 * This lookup does not execute analysis.
 */

export function getPriceMeterCrossDimensionalQuestionsForPhase(
  owningPhase:
    PriceMeterCrossDimensionalOwningPhase
): readonly PriceMeterCrossDimensionalQuestionDefinition[] {

  return PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS
    .filter(
      definition =>
        definition.owningPhase ===
          owningPhase
    )
}