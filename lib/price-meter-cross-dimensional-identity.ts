/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL ANALYTICAL IDENTITY
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Establish the analytical identity of one authorized
 * Cross-Dimensional question before population construction
 * or mathematics occur.
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
 * This layer DOES NOT:
 *
 * - fetch listings
 * - construct secondary cohorts
 * - calculate distributions
 * - calculate relationship statistics
 * - calculate Persistence
 * - calculate Variation
 * - calculate Reversal
 * - calculate Non-establishment
 * - generate synthesis
 */

import type {
  PriceMeterAnalyticalCohort,
  PriceMeterNormalizationBasis,
  PriceMeterPropertyBasis
} from '@/lib/price-meter-analytical-cohort'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterGeographicScope
} from '@/lib/price-meter-geographic-scope'

import {
  getPriceMeterCrossDimensionalQuestion,
  type PriceMeterCrossDimensionalMathematicalAuthorization,
  type PriceMeterCrossDimensionalOwningPhase,
  type PriceMeterCrossDimensionalPrimaryRelationship,
  type PriceMeterCrossDimensionalQuestionKey,
  type PriceMeterCrossDimensionalSecondaryDimension
} from '@/lib/price-meter-cross-dimensional-question'


export type PriceMeterCrossDimensionalGeographicIdentity = {
  selectedLevel:
    PriceMeterGeographicScope['selectedLevel']

  comparisonLevel:
    PriceMeterGeographicScope['comparisonLevel']
}


export type PriceMeterCrossDimensionalIdentity<
  T extends PriceMeterTransactionType
> = {
  questionKey:
    PriceMeterCrossDimensionalQuestionKey

  owningPhase:
    PriceMeterCrossDimensionalOwningPhase

  primaryRelationship:
    PriceMeterCrossDimensionalPrimaryRelationship

  secondaryDimension:
    PriceMeterCrossDimensionalSecondaryDimension

  mathematicalAuthorization:
    PriceMeterCrossDimensionalMathematicalAuthorization

  transactionType:
    T

  propertyBasis:
    PriceMeterPropertyBasis

  normalizationBasis:
    PriceMeterNormalizationBasis

  geography:
    PriceMeterCrossDimensionalGeographicIdentity

  boundedObservationCount:
    number

  eligible:
    true
}


/*
 * ---------------------------------------------------------
 * OWNING-PHASE IDENTITY INVARIANTS
 * ---------------------------------------------------------
 *
 * Phase 11 does not redefine the analytical identity of
 * Phases 7–9.
 *
 * The owning phase determines which normalization and
 * property basis are legitimate for the primary question.
 */

function assertOwningPhaseIdentity({
  owningPhase,
  secondaryDimension,
  propertyBasis,
  normalizationBasis
}: {
  owningPhase:
    PriceMeterCrossDimensionalOwningPhase

  secondaryDimension:
    PriceMeterCrossDimensionalSecondaryDimension

  propertyBasis:
    PriceMeterPropertyBasis

  normalizationBasis:
    PriceMeterNormalizationBasis
}): void {

  if (
    owningPhase ===
      'phase_7_geography' &&
    propertyBasis ===
      'land_only' &&
    secondaryDimension !==
      'property_area'
  ) {
    throw new Error(
      'Phase 7 Vacant Land Cross-Dimensional analysis permits Property Area as its only secondary dimension.'
    )
  }

  if (
    owningPhase ===
      'phase_8_property_area' &&
    (
      propertyBasis !==
        'improved_property' ||
      normalizationBasis !==
        'land'
    )
  ) {
    throw new Error(
      'Phase 8 Property Area Cross-Dimensional analysis requires Improved Property with Land normalization.'
    )
  }


  if (
    owningPhase ===
      'phase_8_construction_area' &&
    (
      propertyBasis !==
        'improved_property' ||
      normalizationBasis !==
        'construction'
    )
  ) {
    throw new Error(
      'Phase 8 Construction Area Cross-Dimensional analysis requires Improved Property with Construction normalization.'
    )
  }


  if (
    owningPhase ===
      'phase_9_construction_to_land' &&
    propertyBasis !==
      'improved_property'
  ) {
    throw new Error(
      'Phase 9 Construction-to-Land Cross-Dimensional analysis requires Improved Property.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC IDENTITY INVARIANT
 * ---------------------------------------------------------
 *
 * Geographic primary or secondary analysis requires a
 * canonical comparison level.
 *
 * District is terminal in the existing Phase 7 hierarchy.
 * Therefore a selected District cannot produce a lower
 * geographic comparison.
 */

function assertGeographicIdentity({
  primaryRelationship,
  secondaryDimension,
  geography
}: {
  primaryRelationship:
    PriceMeterCrossDimensionalPrimaryRelationship

  secondaryDimension:
    PriceMeterCrossDimensionalSecondaryDimension

  geography:
    PriceMeterCrossDimensionalGeographicIdentity
}): void {

  const requiresGeographicComparison =
    primaryRelationship ===
      'geographic_price_per_m2' ||
    secondaryDimension ===
      'geography'


  if (
    requiresGeographicComparison &&
    geography.comparisonLevel ===
      null
  ) {
    throw new Error(
      'Cross-Dimensional geographic analysis requires a canonical geographic comparison level.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * CROSS-DIMENSIONAL IDENTITY RESOLUTION
 * ---------------------------------------------------------
 *
 * The supplied cohort must already be bounded by the
 * canonical upstream Price / m² analytical boundaries.
 *
 * Phase 11 consumes that bounded cohort. It does not widen
 * it or reconstruct its Transaction Type, Property Basis,
 * or Normalization Basis.
 */

export function resolvePriceMeterCrossDimensionalIdentity<
  T extends PriceMeterTransactionType
>({
  questionKey,
  cohort,
  geographicScope
}: {
  questionKey:
    PriceMeterCrossDimensionalQuestionKey

  cohort:
    PriceMeterAnalyticalCohort<T>

  geographicScope:
    PriceMeterGeographicScope
}): PriceMeterCrossDimensionalIdentity<T> {

  const question =
    getPriceMeterCrossDimensionalQuestion(
      questionKey
    )


  assertOwningPhaseIdentity({
    owningPhase:
      question.owningPhase,

    secondaryDimension:
      question.secondaryDimension,

    propertyBasis:
      cohort.propertyBasis,

    normalizationBasis:
      cohort.normalizationBasis
  })


  const geography:
    PriceMeterCrossDimensionalGeographicIdentity = {
      selectedLevel:
        geographicScope.selectedLevel,

      comparisonLevel:
        geographicScope.comparisonLevel
    }


  assertGeographicIdentity({
    primaryRelationship:
      question.primaryRelationship,

    secondaryDimension:
      question.secondaryDimension,

    geography
  })


  /*
   * Defensive cohort invariant.
   *
   * Phase 11 must never receive observations outside the
   * cohort identity supplied by the owning phase.
   */

  if (
    cohort.observations.some(
      observation =>
        observation.transactionType !==
          cohort.transactionType ||
        observation.propertyBasis !==
          cohort.propertyBasis ||
        observation.normalizationBasis !==
          cohort.normalizationBasis
    )
  ) {
    throw new Error(
      'Cross-Dimensional analytical identity received an incompatible bounded cohort.'
    )
  }


  return {
    questionKey,

    owningPhase:
      question.owningPhase,

    primaryRelationship:
      question.primaryRelationship,

    secondaryDimension:
      question.secondaryDimension,

    mathematicalAuthorization:
      question.mathematicalAuthorization,

    transactionType:
      cohort.transactionType,

    propertyBasis:
      cohort.propertyBasis,

    normalizationBasis:
      cohort.normalizationBasis,

    geography,

    boundedObservationCount:
      cohort.observations.length,

    eligible:
      true
  }
}