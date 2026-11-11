/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND DISTRIBUTION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Build the descriptive numerical distribution of exact
 * Construction-to-Land Ratios within one explicit
 * transaction universe.
 *
 * Construction-to-Land Ratio:
 *
 *   reported construction area / property area
 *
 * This layer consumes already-resolved canonical
 * Construction-to-Land identities.
 *
 * It DOES NOT:
 *
 * - infer physical Site Coverage
 * - create Construction-to-Land cohorts
 * - calculate Price / m² cohort statistics
 * - calculate Spearman correlation
 * - calculate regression
 * - calculate R²
 * - generate user-facing synthesis
 */

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  buildNumericalDistribution,
  type NumericalDistribution
} from '@/lib/numerical-distribution'


export type PriceMeterConstructionLandPopulation<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  observations:
    PriceMeterConstructionLandIdentity[]
}


export type PriceMeterConstructionLandDistribution<
  T extends PriceMeterTransactionType
> =
  NumericalDistribution & {
    transactionType:
      T

    exactRatios:
      number[]
  }


export function buildPriceMeterConstructionLandDistribution<
  T extends PriceMeterTransactionType
>(
  population:
    PriceMeterConstructionLandPopulation<T>
): PriceMeterConstructionLandDistribution<T> {

  /*
   * Defensive invariant.
   *
   * Sale and Rent are analytically different universes.
   * A Construction-to-Land distribution may never contain
   * identities from another transaction universe.
   */

  if (
    population.observations.some(
      observation =>
        observation.transactionType !==
          population.transactionType
    )
  ) {
    throw new Error(
      'Construction-to-Land distribution contains mixed Sale/Rent observations.'
    )
  }


  /*
   * Preserve the exact canonical ratios.
   *
   * Cohort assignment later in Phase 9 may classify these
   * observations into explicit intervals, but classification
   * must never replace the underlying exact ratio.
   */

  const exactRatios =
    population.observations.map(
      observation =>
        observation.constructionToLandRatio
    )


  const distribution =
    buildNumericalDistribution(
      exactRatios
    )


  /*
   * Every canonical Construction-to-Land identity entering
   * this layer is already required to contain a finite,
   * positive ratio.
   *
   * Therefore the numerical distribution must represent
   * exactly the same number of observations as the
   * canonical population.
   *
   * Fail closed if that invariant is ever violated.
   */

  if (
    distribution.sampleSize !==
      population.observations.length
  ) {
    throw new Error(
      'Construction-to-Land distribution rejected one or more canonical ratios.'
    )
  }


  return {
    transactionType:
      population.transactionType,

    exactRatios,

    sampleSize:
      distribution.sampleSize,

    minimum:
      distribution.minimum,

    p10:
      distribution.p10,

    p25:
      distribution.p25,

    median:
      distribution.median,

    average:
      distribution.average,

    p75:
      distribution.p75,

    p90:
      distribution.p90,

    maximum:
      distribution.maximum,

    iqr:
      distribution.iqr
  }
}
