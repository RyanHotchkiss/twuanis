/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND COHORT STATISTICS
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Calculate Price / m² distributions for each canonical
 * Construction-to-Land cohort using the same underlying
 * eligible properties.
 *
 * Each property contributes:
 *
 * - one Land-normalized Price / m² observation
 * - one Construction-normalized Price / m² observation
 *
 * Land-normalized Price / m²:
 *
 *   analytical price / property area
 *
 * Construction-normalized Price / m²:
 *
 *   analytical price / construction area
 *
 * This layer preserves:
 *
 * - Sale / Rent separation
 * - Improved Property identity
 * - exact Construction-to-Land Ratio
 * - cohort identity
 * - analytical CRC price
 * - canonical Property Area
 * - canonical Construction Area
 *
 * This layer DOES NOT:
 *
 * - compare adjacent cohorts
 * - calculate percentage differences between cohorts
 * - calculate Spearman correlation
 * - calculate regression
 * - calculate R²
 * - infer causality
 * - infer physical Site Coverage
 * - generate user-facing synthesis
 */

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  NumericalDistribution
} from '@/lib/numerical-distribution'

import {
  buildNumericalDistribution
} from '@/lib/numerical-distribution'

import type {
  PriceMeterConstructionLandCohortDefinition
} from '@/lib/price-meter-construction-land-cohorts'

import type {
  PriceMeterConstructionLandPopulation
} from '@/lib/price-meter-construction-land-population'


export type PriceMeterConstructionLandCohortStatistic = {
  definition:
    PriceMeterConstructionLandCohortDefinition

  observationCount:
    number

  medianExactRatio:
    number | null

  landNormalized:
    NumericalDistribution

  constructionNormalized:
    NumericalDistribution
}

export type PriceMeterConstructionLandAdjacentComparison = {
  lowerCohort:
    PriceMeterConstructionLandCohortDefinition

  higherCohort:
    PriceMeterConstructionLandCohortDefinition

  lowerObservationCount:
    number

  higherObservationCount:
    number

  landNormalized: {
    lowerMedian:
      number

    higherMedian:
      number

    absoluteDifference:
      number

    percentageDifference:
      number
  }

  constructionNormalized: {
    lowerMedian:
      number

    higherMedian:
      number

    absoluteDifference:
      number

    percentageDifference:
      number
  }
}

export type PriceMeterConstructionLandStatistics<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  cohorts:
    PriceMeterConstructionLandCohortStatistic[]

   populatedCohorts:
    PriceMeterConstructionLandCohortStatistic[]

    adjacentComparisons:
        PriceMeterConstructionLandAdjacentComparison[]

    representedObservationCount:
        number
}


export function buildPriceMeterConstructionLandStatistics<
  T extends PriceMeterTransactionType
>(
  population:
    PriceMeterConstructionLandPopulation<T>
): PriceMeterConstructionLandStatistics<T> {

  const cohorts =
    population.cohorts.map(
      cohort => {

        /*
         * Every canonical Phase 9 identity reaching this
         * layer must retain a usable analytical price.
         */

        const landNormalizedValues =
          cohort.observations.map(
            observation => {

              const analyticalPrice =
                observation
                  .price
                  .analyticalAmount


              if (
                analyticalPrice ===
                  null ||
                !observation
                  .price
                  .analyticallyUsable ||
                !observation
                  .priceIntegrity
                  .analyticallyAdmissible ||
                !Number.isFinite(
                  analyticalPrice
                ) ||
                analyticalPrice <=
                  0
              ) {
                throw new Error(
                  'Construction-to-Land cohort contains an unusable analytical price.'
                )
              }


              const value =
                analyticalPrice /
                observation
                  .propertyAreaM2


              if (
                !Number.isFinite(
                  value
                ) ||
                value <=
                  0
              ) {
                throw new Error(
                  'Construction-to-Land cohort produced an invalid Land-normalized Price / m².'
                )
              }


              return value
            }
          )


        const constructionNormalizedValues =
          cohort.observations.map(
            observation => {

              const analyticalPrice =
                observation
                  .price
                  .analyticalAmount


              if (
                analyticalPrice ===
                  null ||
                !observation
                  .price
                  .analyticallyUsable ||
                !observation
                  .priceIntegrity
                  .analyticallyAdmissible ||
                !Number.isFinite(
                  analyticalPrice
                ) ||
                analyticalPrice <=
                  0
              ) {
                throw new Error(
                  'Construction-to-Land cohort contains an unusable analytical price.'
                )
              }


              const value =
                analyticalPrice /
                observation
                  .constructionAreaM2


              if (
                !Number.isFinite(
                  value
                ) ||
                value <=
                  0
              ) {
                throw new Error(
                  'Construction-to-Land cohort produced an invalid Construction-normalized Price / m².'
                )
              }


              return value
            }
          )


        const landNormalized =
          buildNumericalDistribution(
            landNormalizedValues
          )


        const constructionNormalized =
          buildNumericalDistribution(
            constructionNormalizedValues
          )


        /*
         * Both normalization lenses MUST represent the same
         * canonical properties in the cohort.
         *
         * Phase 9 must never silently lose a property from
         * one normalization while retaining it in the other.
         */

        if (
          landNormalized.sampleSize !==
            cohort.observationCount ||
          constructionNormalized.sampleSize !==
            cohort.observationCount
        ) {
          throw new Error(
            'Construction-to-Land normalization distributions do not represent the complete canonical cohort.'
          )
        }


        return {
          definition:
            cohort.definition,

          observationCount:
            cohort.observationCount,

          medianExactRatio:
            cohort.medianExactRatio,

          landNormalized,

          constructionNormalized
        }
      }
    )


  const populatedCohorts =
    cohorts.filter(
      cohort =>
        cohort.observationCount >
          0 &&
        cohort.medianExactRatio !==
          null
    )

      /*
   * -------------------------------------------------------
   * ADJACENT POPULATED COHORT COMPARISONS
   * -------------------------------------------------------
   *
   * Compare neighboring populated cohorts in canonical
   * cohort order.
   *
   * These are descriptive differences only.
   *
   * They DO NOT represent:
   *
   * - correlation
   * - regression
   * - modeled effects
   * - causality
   */

  const adjacentComparisons:
    PriceMeterConstructionLandAdjacentComparison[] =
      []


  for (
    let index =
      1;

    index <
      populatedCohorts.length;

    index +=
      1
  ) {

    const lowerCohort =
      populatedCohorts[
        index - 1
      ]

    const higherCohort =
      populatedCohorts[
        index
      ]


    const lowerLandMedian =
      lowerCohort
        .landNormalized
        .median

    const higherLandMedian =
      higherCohort
        .landNormalized
        .median

    const lowerConstructionMedian =
      lowerCohort
        .constructionNormalized
        .median

    const higherConstructionMedian =
      higherCohort
        .constructionNormalized
        .median


    /*
     * Populated canonical cohorts must have usable medians
     * for both normalization lenses.
     */

    if (
      lowerLandMedian ===
        null ||
      higherLandMedian ===
        null ||
      lowerConstructionMedian ===
        null ||
      higherConstructionMedian ===
        null
    ) {
      throw new Error(
        'Populated Construction-to-Land cohort is missing a canonical Price / m² median.'
      )
    }


    const landAbsoluteDifference =
      higherLandMedian -
      lowerLandMedian


    const constructionAbsoluteDifference =
      higherConstructionMedian -
      lowerConstructionMedian


    adjacentComparisons.push({
      lowerCohort:
        lowerCohort.definition,

      higherCohort:
        higherCohort.definition,

      lowerObservationCount:
        lowerCohort.observationCount,

      higherObservationCount:
        higherCohort.observationCount,

      landNormalized: {
        lowerMedian:
          lowerLandMedian,

        higherMedian:
          higherLandMedian,

        absoluteDifference:
          landAbsoluteDifference,

        percentageDifference:
          (
            landAbsoluteDifference /
            lowerLandMedian
          ) *
          100
      },

      constructionNormalized: {
        lowerMedian:
          lowerConstructionMedian,

        higherMedian:
          higherConstructionMedian,

        absoluteDifference:
          constructionAbsoluteDifference,

        percentageDifference:
          (
            constructionAbsoluteDifference /
            lowerConstructionMedian
          ) *
          100
      }
    })
  }

  const representedObservationCount =
    populatedCohorts.reduce(
      (
        total,
        cohort
      ) =>
        total +
        cohort.observationCount,
      0
    )


  if (
    representedObservationCount !==
      population
        .representedObservationCount
  ) {
    throw new Error(
      'Construction-to-Land statistics do not represent the complete canonical population.'
    )
  }


    return {
        transactionType:
        population.transactionType,

        cohorts,

        populatedCohorts,

        adjacentComparisons,

        representedObservationCount
    }
}