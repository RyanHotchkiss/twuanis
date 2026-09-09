/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL SYNTHESIS
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Construct the canonical analytical synthesis produced by
 * one completed Cross-Dimensional analysis.
 *
 * The synthesis consumes:
 *
 * - one authorized analytical question
 * - one completed numerical evidence set
 * - the four completed Cross-Dimensional outcomes
 *
 * It DOES NOT:
 *
 * - fetch listings
 * - construct populations
 * - calculate owning-phase statistics
 * - recalculate Persistence
 * - recalculate Variation
 * - recalculate Reversal
 * - recalculate Non-establishment
 * - invent missing statistics
 * - assign causal meaning
 * - generate localized prose
 *
 * This layer returns structured analytical facts.
 *
 * Presentation layers may translate those facts into
 * English, Spanish, or another future presentation form.
 */

import type {
  PriceMeterCrossDimensionalEvidenceSet
} from '@/lib/price-meter-cross-dimensional-evidence'

import type {
  PriceMeterCrossDimensionalOutcomes,
  PriceMeterCrossDimensionalVariation
} from '@/lib/price-meter-cross-dimensional-outcomes'

import type {
  PriceMeterCrossDimensionalQuestionDefinition,
  PriceMeterCrossDimensionalQuestionKey,
  PriceMeterCrossDimensionalOwningPhase,
  PriceMeterCrossDimensionalPrimaryRelationship,
  PriceMeterCrossDimensionalSecondaryDimension,
  PriceMeterCrossDimensionalMathematicalAuthorization
} from '@/lib/price-meter-cross-dimensional-question'


/*
 * ---------------------------------------------------------
 * VARIATION SYNTHESIS
 * ---------------------------------------------------------
 *
 * Variation is preserved in the numerical form appropriate
 * to the owning analytical relationship.
 */

export type PriceMeterCrossDimensionalGeographicVariationSynthesis = {
  kind:
    'geographic'

  establishedSecondaryCohortCount:
    number

  observedMedianDifferenceMinimum:
    number | null

  observedMedianDifferenceMaximum:
    number | null

  observedMedianDifferenceRange:
    number | null

  observedPercentDifferenceMinimum:
    number | null

  observedPercentDifferenceMaximum:
    number | null

  observedPercentDifferenceRange:
    number | null
}


export type PriceMeterCrossDimensionalSizeVariationSynthesis = {
  kind:
    'size_relationship'

  establishedSecondaryCohortCount:
    number

  spearmanRhoMinimum:
    number | null

  spearmanRhoMaximum:
    number | null

  spearmanRhoRange:
    number | null

  logLogSlopeMinimum:
    number | null

  logLogSlopeMaximum:
    number | null

  logLogSlopeRange:
    number | null

  modeledTenPercentAreaChangeMinimum:
    number | null

  modeledTenPercentAreaChangeMaximum:
    number | null

  modeledTenPercentAreaChangeRange:
    number | null

  rSquaredMinimum:
    number | null

  rSquaredMaximum:
    number | null

  rSquaredRange:
    number | null
}


export type PriceMeterCrossDimensionalConstructionLandVariationSynthesis = {
  kind:
    'construction_to_land_relationship'

  establishedSecondaryCohortCount:
    number

  spearmanRhoMinimum:
    number | null

  spearmanRhoMaximum:
    number | null

  spearmanRhoRange:
    number | null
}


export type PriceMeterCrossDimensionalVariationSynthesis =
  | PriceMeterCrossDimensionalGeographicVariationSynthesis
  | PriceMeterCrossDimensionalSizeVariationSynthesis
  | PriceMeterCrossDimensionalConstructionLandVariationSynthesis


/*
 * ---------------------------------------------------------
 * COMPLETE SYNTHESIS
 * ---------------------------------------------------------
 *
 * Every synthesis explicitly identifies:
 *
 * - the authorized question
 * - the owning relationship
 * - the secondary dimension
 * - the bounded represented population
 * - Persistence
 * - Variation
 * - Reversal
 * - Non-establishment
 *
 * No qualitative strength or market-value classification
 * is introduced.
 */

export type PriceMeterCrossDimensionalSynthesis = {
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

  inputObservationCount:
    number

  representedObservationCount:
    number

  excludedObservationCount:
    number

  examinedSecondaryCohortCount:
    number

  establishedSecondaryCohortCount:
    number

  nonEstablishedSecondaryCohortCount:
    number

  persistenceRatePercent:
    number | null

  establishedObservationCount:
    number

  variation:
    PriceMeterCrossDimensionalVariationSynthesis | null

  reversalCount:
    number

  nonEstablishmentCount:
    number

  hasReversal:
    boolean

  hasNonEstablishment:
    boolean
}


/*
 * ---------------------------------------------------------
 * QUESTION / EVIDENCE INVARIANT
 * ---------------------------------------------------------
 *
 * One synthesis may describe only the evidence produced for
 * the exact authorized question supplied to this function.
 */

function assertQuestionEvidenceInvariant(
  question:
    PriceMeterCrossDimensionalQuestionDefinition,
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): void {

  if (
    question.key !==
      evidenceSet.questionKey
  ) {
    throw new Error(
      'Cross-Dimensional synthesis question does not match the completed evidence set.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * OUTCOME / EVIDENCE INVARIANTS
 * ---------------------------------------------------------
 *
 * The outcome layer has already calculated the four
 * canonical analytical outcomes.
 *
 * These assertions ensure the synthesis cannot silently
 * combine outcomes from a different evidence set.
 */

function assertOutcomeEvidenceInvariants(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet,
  outcomes:
    PriceMeterCrossDimensionalOutcomes
): void {

  const persistence =
    outcomes.persistence


  if (
    persistence
      .examinedSecondaryCohortCount !==
      evidenceSet.evidence.length
  ) {
    throw new Error(
      'Cross-Dimensional synthesis examined-population count does not match the completed evidence set.'
    )
  }


  if (
    persistence
      .establishedSecondaryCohortCount !==
      evidenceSet
        .establishedSecondaryCohortCount
  ) {
    throw new Error(
      'Cross-Dimensional synthesis established-population count does not match the completed evidence set.'
    )
  }


  if (
    persistence
      .nonEstablishedSecondaryCohortCount !==
      evidenceSet
        .nonEstablishedSecondaryCohortCount
  ) {
    throw new Error(
      'Cross-Dimensional synthesis non-establishment count does not match the completed evidence set.'
    )
  }


  if (
    persistence
      .representedObservationCount !==
      evidenceSet
        .representedObservationCount
  ) {
    throw new Error(
      'Cross-Dimensional synthesis represented population does not match the completed evidence set.'
    )
  }


  if (
    outcomes
      .nonEstablishment
      .length !==
      evidenceSet
        .nonEstablishedSecondaryCohortCount
  ) {
    throw new Error(
      'Cross-Dimensional synthesis non-establishment outcomes do not match the completed evidence set.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * VARIATION COPY
 * ---------------------------------------------------------
 *
 * Variation is copied from the completed outcome contract.
 *
 * No statistic is recalculated here.
 */

function buildVariationSynthesis(
  variation:
    PriceMeterCrossDimensionalVariation | null
): PriceMeterCrossDimensionalVariationSynthesis | null {

  if (
    variation ===
      null
  ) {
    return null
  }


  if (
    variation.kind ===
      'geographic'
  ) {
    return {
      kind:
        'geographic',

      establishedSecondaryCohortCount:
        variation
          .establishedSecondaryCohortCount,

      observedMedianDifferenceMinimum:
        variation
          .observedMedianDifferenceMinimum,

      observedMedianDifferenceMaximum:
        variation
          .observedMedianDifferenceMaximum,

      observedMedianDifferenceRange:
        variation
          .observedMedianDifferenceRange,

      observedPercentDifferenceMinimum:
        variation
          .observedPercentDifferenceMinimum,

      observedPercentDifferenceMaximum:
        variation
          .observedPercentDifferenceMaximum,

      observedPercentDifferenceRange:
        variation
          .observedPercentDifferenceRange
    }
  }


  if (
    variation.kind ===
      'size_relationship'
  ) {
    return {
      kind:
        'size_relationship',

      establishedSecondaryCohortCount:
        variation
          .establishedSecondaryCohortCount,

      spearmanRhoMinimum:
        variation
          .spearmanRhoMinimum,

      spearmanRhoMaximum:
        variation
          .spearmanRhoMaximum,

      spearmanRhoRange:
        variation
          .spearmanRhoRange,

      logLogSlopeMinimum:
        variation
          .logLogSlopeMinimum,

      logLogSlopeMaximum:
        variation
          .logLogSlopeMaximum,

      logLogSlopeRange:
        variation
          .logLogSlopeRange,

      modeledTenPercentAreaChangeMinimum:
        variation
          .modeledTenPercentAreaChangeMinimum,

      modeledTenPercentAreaChangeMaximum:
        variation
          .modeledTenPercentAreaChangeMaximum,

      modeledTenPercentAreaChangeRange:
        variation
          .modeledTenPercentAreaChangeRange,

      rSquaredMinimum:
        variation
          .rSquaredMinimum,

      rSquaredMaximum:
        variation
          .rSquaredMaximum,

      rSquaredRange:
        variation
          .rSquaredRange
    }
  }


  return {
    kind:
      'construction_to_land_relationship',

    establishedSecondaryCohortCount:
      variation
        .establishedSecondaryCohortCount,

    spearmanRhoMinimum:
      variation
        .spearmanRhoMinimum,

    spearmanRhoMaximum:
      variation
        .spearmanRhoMaximum,

    spearmanRhoRange:
      variation
        .spearmanRhoRange
  }
}


/*
 * ---------------------------------------------------------
 * BUILD CANONICAL SYNTHESIS
 * ---------------------------------------------------------
 */

export function buildPriceMeterCrossDimensionalSynthesis({
  question,
  evidenceSet,
  outcomes
}: {
  question:
    PriceMeterCrossDimensionalQuestionDefinition

  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet

  outcomes:
    PriceMeterCrossDimensionalOutcomes
}): PriceMeterCrossDimensionalSynthesis {

  assertQuestionEvidenceInvariant(
    question,
    evidenceSet
  )


  assertOutcomeEvidenceInvariants(
    evidenceSet,
    outcomes
  )


  const persistence =
    outcomes.persistence


  const reversalCount =
    outcomes
      .reversals
      .length


  const nonEstablishmentCount =
    outcomes
      .nonEstablishment
      .length


  return {
    questionKey:
      question.key,

    owningPhase:
      question.owningPhase,

    primaryRelationship:
      question.primaryRelationship,

    secondaryDimension:
      question.secondaryDimension,

    mathematicalAuthorization:
      question
        .mathematicalAuthorization,

    inputObservationCount:
      evidenceSet
        .inputObservationCount,

    representedObservationCount:
      evidenceSet
        .representedObservationCount,

    excludedObservationCount:
      evidenceSet
        .excludedObservationCount,

    examinedSecondaryCohortCount:
      persistence
        .examinedSecondaryCohortCount,

    establishedSecondaryCohortCount:
      persistence
        .establishedSecondaryCohortCount,

    nonEstablishedSecondaryCohortCount:
      persistence
        .nonEstablishedSecondaryCohortCount,

    persistenceRatePercent:
      persistence
        .persistenceRatePercent,

    establishedObservationCount:
      persistence
        .establishedObservationCount,

    variation:
      buildVariationSynthesis(
        outcomes.variation
      ),

    reversalCount,

    nonEstablishmentCount,

    hasReversal:
      reversalCount >
      0,

    hasNonEstablishment:
      nonEstablishmentCount >
      0
  }
}