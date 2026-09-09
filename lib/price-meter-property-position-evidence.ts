import type {
  PriceMeterDistribution,
} from './price-meter-distribution'

import type {
  PriceMeterPropertyPositionPopulation,
} from './price-meter-property-position-population'

import type {
  PriceMeterPropertyPositionPercentile,
} from './price-meter-property-position-percentile'

import type {
  PriceMeterPropertyPositionMedian,
} from './price-meter-property-position-median'

import type {
  PriceMeterPropertyPositionIntervalResult,
} from './price-meter-property-position-interval'

import type {
  PriceMeterPropertyPositionTailResult,
} from './price-meter-property-position-tail'

import type {
  PriceMeterPropertyPositionConstructionLandContext,
} from './price-meter-property-position-construction-land'

import {
  getPriceMeterConfidenceScore,
  type PriceMeterConfidenceScore,
} from './confidence'

export type PriceMeterPropertyPositionEvidence = {
  listingId:
    string

  transactionType:
    PriceMeterPropertyPositionPopulation['transactionType']

  propertyBasis:
    PriceMeterPropertyPositionPopulation['propertyBasis']

  normalizationBasis:
    PriceMeterPropertyPositionPopulation['normalizationBasis']

  geography:
    PriceMeterPropertyPositionPopulation['subject']['geography']

  analyticalCurrency:
    PriceMeterPropertyPositionPopulation['subject']['analyticalCurrency']

  propertyPricePerM2:
    number

    comparisonPopulationCount:
    number

  confidence: {
    score:
      PriceMeterConfidenceScore
  }

  distribution: {
    minimum:
      number | null

    p10:
      number | null

    p25:
      number | null

    median:
      number | null

    p75:
      number | null

    p90:
      number | null

    maximum:
      number | null

    iqr:
      number | null
  }

  percentile: {
    position:
      number

    method:
      'midrank'

    belowCount:
      number

    equalCount:
      number

    aboveCount:
      number
  }

  medianPosition: {
    difference:
      number

    percentDifference:
      number

    percentageReference:
      'selected_population_median'
  }

  distributionInterval:
    PriceMeterPropertyPositionIntervalResult['interval']

  tail:
    PriceMeterPropertyPositionTailResult | null

  constructionToLandContext:
    PriceMeterPropertyPositionConstructionLandContext | null
}


/**
 * Composes the canonical Phase 12 Property Price / m² Position
 * evidence for one subject observation and one already-bounded
 * canonical comparison population.
 *
 * This layer does not recreate analytical mathematics.
 *
 * It verifies that the independently calculated Phase 12 results
 * represent:
 *
 * - one subject listing
 * - one Transaction Type
 * - one Property Basis
 * - one Normalization Basis
 * - one comparison population
 * - one canonical Price / m² observation
 *
 * and then assembles those results into one evidence object.
 *
 * Confidence is intentionally composed later from the canonical
 * confidence architecture rather than recalculated here.
 */
export function buildPriceMeterPropertyPositionEvidence({
  population,
  distribution,
  percentile,
  medianPosition,
  interval,
  tail,
  constructionToLandContext,
}: {
  population:
    PriceMeterPropertyPositionPopulation

  distribution:
    PriceMeterDistribution<
      PriceMeterPropertyPositionPopulation['transactionType']
    >

  percentile:
    PriceMeterPropertyPositionPercentile

  medianPosition:
    PriceMeterPropertyPositionMedian

  interval:
    PriceMeterPropertyPositionIntervalResult

  tail:
    PriceMeterPropertyPositionTailResult | null

  constructionToLandContext:
    PriceMeterPropertyPositionConstructionLandContext | null
}): PriceMeterPropertyPositionEvidence {
  const subject =
    population.subject

  const listingId =
    subject.listingId

  const propertyPricePerM2 =
    subject.propertyPricePerM2

   const comparisonPopulationCount =
    population.comparisonPopulationCount


  /*
   * -------------------------------------------------------
   * POPULATION INTEGRITY
   * -------------------------------------------------------
   */

    if (
    !Number.isInteger(
      comparisonPopulationCount
    ) ||
    comparisonPopulationCount <= 0 ||
    comparisonPopulationCount !==
      population.observations.length
  ) {
    throw new Error(
      'Cannot assemble property Price / m² evidence from an invalid canonical comparison population.',
    )
  }


  const confidenceScore =
    getPriceMeterConfidenceScore(
      comparisonPopulationCount
    )


  /*
   * -------------------------------------------------------
   * DISTRIBUTION INTEGRITY
   * -------------------------------------------------------
   */

  if (
    distribution.transactionType !==
      population.transactionType ||
    distribution.sampleSize !==
      comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² distribution does not represent the canonical comparison population.',
    )
  }


  /*
   * -------------------------------------------------------
   * SUBJECT IDENTITY INTEGRITY
   * -------------------------------------------------------
   */

  if (
    percentile.listingId !==
      listingId ||
    medianPosition.listingId !==
      listingId ||
    interval.listingId !==
      listingId
  ) {
    throw new Error(
      'Property Price / m² evidence components do not represent one subject listing.',
    )
  }

  if (
    percentile.propertyPricePerM2 !==
      propertyPricePerM2 ||
    medianPosition.propertyPricePerM2 !==
      propertyPricePerM2 ||
    interval.propertyPricePerM2 !==
      propertyPricePerM2
  ) {
    throw new Error(
      'Property Price / m² evidence components do not preserve one canonical subject Price / m².',
    )
  }


  /*
   * -------------------------------------------------------
   * POPULATION COUNT INTEGRITY
   * -------------------------------------------------------
   */

  if (
    percentile.comparisonPopulationCount !==
      comparisonPopulationCount ||
    medianPosition.comparisonPopulationCount !==
      comparisonPopulationCount ||
    interval.comparisonPopulationCount !==
      comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² evidence components do not represent one comparison population.',
    )
  }


  /*
   * -------------------------------------------------------
   * PERCENTILE ACCOUNTING
   * -------------------------------------------------------
   */

  if (
    percentile.belowCount +
      percentile.equalCount +
      percentile.aboveCount !==
      comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² percentile accounting does not equal the canonical comparison population.',
    )
  }


  /*
   * -------------------------------------------------------
   * MEDIAN REFERENCE INTEGRITY
   * -------------------------------------------------------
   */

  if (
    distribution.median ===
      null ||
    medianPosition.comparisonPopulationMedian !==
      distribution.median ||
    medianPosition.percentageReference !==
      'selected_population_median'
  ) {
    throw new Error(
      'Property Price / m² median-position evidence does not preserve the canonical distribution median.',
    )
  }


  /*
   * -------------------------------------------------------
   * INTERVAL THRESHOLD INTEGRITY
   * -------------------------------------------------------
   */

  if (
    interval.p10 !==
      distribution.p10 ||
    interval.p25 !==
      distribution.p25 ||
    interval.median !==
      distribution.median ||
    interval.p75 !==
      distribution.p75 ||
    interval.p90 !==
      distribution.p90
  ) {
    throw new Error(
      'Property Price / m² interval evidence does not preserve the canonical distribution thresholds.',
    )
  }


  /*
   * -------------------------------------------------------
   * TAIL INTEGRITY
   * -------------------------------------------------------
   */

  const intervalIsTail =
    interval.interval ===
      'below_p10' ||
    interval.interval ===
      'above_p90'

  if (
    intervalIsTail &&
    tail === null
  ) {
    throw new Error(
      'Property Price / m² tail interval is missing canonical tail evidence.',
    )
  }

  if (
    !intervalIsTail &&
    tail !== null
  ) {
    throw new Error(
      'Property Price / m² evidence contains tail evidence for a property inside the P10–P90 distribution interval.',
    )
  }

  if (
    tail !== null
  ) {
    if (
      tail.listingId !==
        listingId ||
      tail.propertyPricePerM2 !==
        propertyPricePerM2 ||
      tail.comparisonPopulationCount !==
        comparisonPopulationCount ||
      tail.percentilePosition !==
        percentile.percentilePosition ||
      tail.tail !==
        interval.interval
    ) {
      throw new Error(
        'Property Price / m² tail evidence does not preserve the canonical subject and population identity.',
      )
    }
  }


  /*
   * -------------------------------------------------------
   * CONSTRUCTION-TO-LAND CONTEXT INTEGRITY
   * -------------------------------------------------------
   */

  if (
    constructionToLandContext !==
      null &&
    constructionToLandContext.listingId !==
      listingId
  ) {
    throw new Error(
      'Property Price / m² Construction-to-Land context does not represent the subject listing.',
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL EVIDENCE
   * -------------------------------------------------------
   */

  return {
    listingId,

    transactionType:
      population.transactionType,

    propertyBasis:
      population.propertyBasis,

    normalizationBasis:
      population.normalizationBasis,

    geography:
      subject.geography,

    analyticalCurrency:
      subject.analyticalCurrency,

    propertyPricePerM2,

    comparisonPopulationCount,

    confidence: {
      score:
        confidenceScore,
    },

    distribution: {
      minimum:
        distribution.minimum,

      p10:
        distribution.p10,

      p25:
        distribution.p25,

      median:
        distribution.median,

      p75:
        distribution.p75,

      p90:
        distribution.p90,

      maximum:
        distribution.maximum,

      iqr:
        distribution.iqr,
    },

    percentile: {
      position:
        percentile.percentilePosition,

      method:
        percentile.percentileMethod,

      belowCount:
        percentile.belowCount,

      equalCount:
        percentile.equalCount,

      aboveCount:
        percentile.aboveCount,
    },

    medianPosition: {
      difference:
        medianPosition.differenceFromMedian,

      percentDifference:
        medianPosition.percentDifferenceFromMedian,

      percentageReference:
        medianPosition.percentageReference,
    },

    distributionInterval:
      interval.interval,

    tail,

    constructionToLandContext,
  }
}