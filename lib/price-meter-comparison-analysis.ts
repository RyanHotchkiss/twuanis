/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARISON ANALYSIS
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Compare two already-resolved Phase 10 comparison
 * populations inside one already-compatible Price / m²
 * analytical universe.
 *
 * This layer answers:
 *
 * - What is Cohort A's Price / m² distribution?
 * - What is Cohort B's Price / m² distribution?
 * - What is the absolute difference between their medians?
 * - What is the percentage difference between their
 *   medians relative to an explicitly identified reference
 *   cohort?
 *
 * This layer DOES NOT:
 *
 * - define Cohort A or Cohort B
 * - resolve cohort populations
 * - establish Sale / Rent compatibility
 * - establish Property Basis compatibility
 * - establish Normalization Basis compatibility
 * - query ontology membership
 * - attribute the observed difference to any characteristic
 * - describe the difference as a premium or discount
 */


import {
  buildPriceMeterDistribution,
  type PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterComparisonCohortPopulation
} from '@/lib/price-meter-comparison-cohort-population'

import {
  PRICE_METER_COMPARISON_MINIMUM_SAMPLE_SIZE,
  hasSufficientPriceMeterComparisonEvidence
} from '@/lib/price-meter-comparison-evidence'

export type PriceMeterComparisonReferenceCohort =
  | 'A'
  | 'B'


export type PriceMeterComparisonAnalysis<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  cohortA: {
    population:
        PriceMeterComparisonCohortPopulation

    distribution:
        PriceMeterDistribution<T>

    }

  cohortB: {
    population:
        PriceMeterComparisonCohortPopulation

    distribution:
        PriceMeterDistribution<T>

    }

  evidence: {
    minimumSampleSize:
      number

    cohortA: {
      sampleSize:
        number

      sufficient:
        boolean
    }

    cohortB: {
      sampleSize:
        number

      sufficient:
        boolean
    }

    comparisonSufficient:
      boolean
  }

  medianDifference: {
    cohortAMedian:
      number | null

    cohortBMedian:
      number | null

    absoluteDifference:
      number | null

    percentageDifference:
      number | null

    referenceCohort:
      PriceMeterComparisonReferenceCohort
  }
}


export function buildPriceMeterComparisonAnalysis<
  T extends PriceMeterTransactionType
>({
  transactionType,
  cohortA,
  cohortB,
  referenceCohort,
  language
}: {
  transactionType:
    T

  cohortA:
    PriceMeterComparisonCohortPopulation

  cohortB:
    PriceMeterComparisonCohortPopulation

  referenceCohort:
    PriceMeterComparisonReferenceCohort

  language:
    'en' | 'es'
    }): PriceMeterComparisonAnalysis<T> {

  /*
   * -------------------------------------------------------
   * TRANSACTION INVARIANT
   * -------------------------------------------------------
   *
   * Cohort A and Cohort B are populations inside one
   * upstream analytical universe.
   *
   * This layer does not repair mixed transaction identity.
   * If incompatible observations arrive here, fail loudly.
   */

  const allObservations = [
    ...cohortA.observations,
    ...cohortB.observations
  ]


  if (
    allObservations.some(
      observation =>
        observation.transactionType !==
          transactionType
    )
  ) {
    throw new Error(
      'Price / m² comparison analysis contains observations outside the supplied transaction universe.'
    )
  }


  /*
   * -------------------------------------------------------
   * EXISTING PRICE / M² DISTRIBUTIONS
   * -------------------------------------------------------
   *
   * Distribution mathematics remain owned by the existing
   * Price / m² distribution layer.
   */

  const distributionA =
    buildPriceMeterDistribution({
      transactionType,

      observations:
        cohortA.observations
    })


  const distributionB =
    buildPriceMeterDistribution({
      transactionType,

      observations:
        cohortB.observations
    })





    /*
    * -------------------------------------------------------
    * COMPARISON EVIDENCE
    * -------------------------------------------------------
    *
    * Distribution mathematics remain available for each
    * resolved cohort regardless of comparison authorization.
    *
    * Phase 10 authorizes median-difference evidence only
    * when BOTH cohorts satisfy the canonical comparison
    * evidence requirement.
    *
    * Insufficient evidence is an analytical result.
    * It is not a software error and does not broaden or
    * alter either user-defined cohort.
    */

    const cohortAEvidenceSufficient =
      hasSufficientPriceMeterComparisonEvidence(
        distributionA.sampleSize
      )


    const cohortBEvidenceSufficient =
      hasSufficientPriceMeterComparisonEvidence(
        distributionB.sampleSize
      )


    const comparisonSufficient =
      cohortAEvidenceSufficient &&
      cohortBEvidenceSufficient

  /*
   * -------------------------------------------------------
   * MEDIAN DIFFERENCE
   * -------------------------------------------------------
   *
   * Difference is always:
   *
   * Cohort A median - Cohort B median
   *
   * Percentage difference uses the explicitly selected
   * reference cohort as its denominator.
   *
   * No causal interpretation is authorized.
   */

  const cohortAMedian =
    distributionA.median


  const cohortBMedian =
    distributionB.median


  let absoluteDifference:
    number | null =
      null


  let percentageDifference:
    number | null =
      null


    if (
      comparisonSufficient &&
      cohortAMedian !==
        null &&
      cohortBMedian !==
        null
    ) {

    absoluteDifference =
      cohortAMedian -
      cohortBMedian


    const referenceMedian =
      referenceCohort ===
        'A'
        ? cohortAMedian
        : cohortBMedian


    if (
      referenceMedian !==
        0
    ) {
      percentageDifference =
        (
          absoluteDifference /
          referenceMedian
        ) *
        100
    }
  }


  return {
    transactionType,

    cohortA: {
        population:
            cohortA,

        distribution:
            distributionA
        },

        cohortB: {
        population:
            cohortB,

        distribution:
            distributionB
        },

    evidence: {
      minimumSampleSize:
        PRICE_METER_COMPARISON_MINIMUM_SAMPLE_SIZE,

      cohortA: {
        sampleSize:
          distributionA.sampleSize,

        sufficient:
          cohortAEvidenceSufficient
      },

      cohortB: {
          sampleSize:
            distributionB.sampleSize,

          sufficient:
            cohortBEvidenceSufficient
        },

        comparisonSufficient
      },

      medianDifference: {
      cohortAMedian,

      cohortBMedian,

      absoluteDifference,

      percentageDifference,

      referenceCohort
    }
  }
}