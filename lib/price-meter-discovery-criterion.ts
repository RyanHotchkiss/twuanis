/*
 * ---------------------------------------------------------
 * COMPARATIVE PRICE / M² DISCOVERY CRITERION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Apply one user-selected Comparative Price / m² Discovery
 * criterion to one already-established geographic
 * Price / m² distribution.
 *
 * This layer answers:
 *
 * Does this canonical Price / m² observation satisfy the
 * selected numerical distribution condition?
 *
 * ---------------------------------------------------------
 * CRITERION SEMANTICS
 * ---------------------------------------------------------
 *
 * at_or_below_p10
 *   Price / m² <= distribution P10
 *
 * at_or_below_p25
 *   Price / m² <= distribution P25
 *
 * below_median
 *   Price / m² < distribution median
 *
 * above_median
 *   Price / m² > distribution median
 *
 * at_or_above_p75
 *   Price / m² >= distribution P75
 *
 * at_or_above_p90
 *   Price / m² >= distribution P90
 *
 * P10, P25, median, P75 and P90 are canonical numerical
 * boundaries produced by the Price / m² distribution
 * layer.
 *
 * Qualification compares observed Price / m² directly
 * against those boundaries.
 *
 * It does NOT calculate or require a separate percentile
 * rank.
 *
 * ---------------------------------------------------------
 * CRITICAL BOUNDARY
 * ---------------------------------------------------------
 *
 * District observations must be evaluated against the
 * District distribution.
 *
 * Canton observations must be evaluated against the
 * Canton distribution.
 *
 * This module does not select or substitute geography.
 *
 * ---------------------------------------------------------
 * THIS LAYER DOES NOT
 * ---------------------------------------------------------
 *
 * - establish analytical population identity
 * - calculate Price / m²
 * - build distributions
 * - calculate percentile rank
 * - apply ordinary Intelligence Hub filters
 * - broaden geography
 * - relax criteria
 * - infer market value
 * - classify bargains, deals or opportunities
 */


import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  isPriceMeterDiscoveryCriterion,
  type PriceMeterDiscoveryCriterion
} from '@/lib/price-meter-discovery-request'


/*
 * ---------------------------------------------------------
 * CRITERION RESULT
 * ---------------------------------------------------------
 *
 * Preserve the numerical boundary used for qualification so
 * downstream evidence does not need to reconstruct which
 * distribution statistic was applied.
 */


export type PriceMeterDiscoveryCriterionResult = {
  qualifies:
    boolean

  criterion:
    PriceMeterDiscoveryCriterion

  pricePerM2:
    number

  boundaryValue:
    number
}


/*
 * ---------------------------------------------------------
 * DISTRIBUTION BOUNDARY
 * ---------------------------------------------------------
 */


export function resolvePriceMeterDiscoveryCriterionBoundary<
  T extends PriceMeterTransactionType
>({
  criterion,
  distribution
}: {
  criterion:
    PriceMeterDiscoveryCriterion

  distribution:
    PriceMeterDistribution<T>
}): number {

  let boundary:
    number | null


  switch (
    criterion
  ) {

    case 'at_or_below_p10':
      boundary =
        distribution.p10
      break


    case 'at_or_below_p25':
      boundary =
        distribution.p25
      break


    case 'below_median':
    case 'above_median':
      boundary =
        distribution.median
      break


    case 'at_or_above_p75':
      boundary =
        distribution.p75
      break


    case 'at_or_above_p90':
      boundary =
        distribution.p90
      break


    default: {
      const exhaustiveCheck:
        never =
          criterion

      throw new Error(
        `Unsupported Comparative Price / m² Discovery criterion: ${exhaustiveCheck}.`
      )
    }
  }


  /*
   * A valid Discovery distribution used for qualification
   * must contain a finite positive numerical boundary.
   *
   * Empty or malformed distributions fail closed.
   */

  if (
    boundary ===
      null ||
    !Number.isFinite(
      boundary
    ) ||
    boundary <=
      0
  ) {
    throw new Error(
      `Comparative Price / m² Discovery criterion ${criterion} requires a finite positive distribution boundary.`
    )
  }


  return boundary
}


/*
 * ---------------------------------------------------------
 * OBSERVATION QUALIFICATION
 * ---------------------------------------------------------
 */


export function evaluatePriceMeterDiscoveryCriterion<
  T extends PriceMeterTransactionType
>({
  observation,
  criterion,
  distribution
}: {
  observation:
    PriceMeterObservation

  criterion:
    PriceMeterDiscoveryCriterion

  distribution:
    PriceMeterDistribution<T>
}): PriceMeterDiscoveryCriterionResult {

  /*
   * -------------------------------------------------------
   * CRITERION IDENTITY
   * -------------------------------------------------------
   */

  if (
    !isPriceMeterDiscoveryCriterion(
      criterion
    )
  ) {
    throw new Error(
      'Comparative Price / m² Discovery requires a valid distribution criterion.'
    )
  }


  /*
   * -------------------------------------------------------
   * TRANSACTION INTEGRITY
   * -------------------------------------------------------
   *
   * The observation and distribution must belong to the
   * same Sale/Rent universe.
   */

  if (
    observation.transactionType !==
      distribution.transactionType
  ) {
    throw new Error(
      'Comparative Price / m² Discovery cannot evaluate an observation against a distribution from another transaction universe.'
    )
  }


  /*
   * -------------------------------------------------------
   * OBSERVED PRICE / M²
   * -------------------------------------------------------
   */

  const pricePerM2 =
    observation.pricePerM2


  if (
    !Number.isFinite(
      pricePerM2
    ) ||
    pricePerM2 <=
      0
  ) {
    throw new Error(
      'Comparative Price / m² Discovery criterion requires a finite positive Price / m² observation.'
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL NUMERICAL BOUNDARY
   * -------------------------------------------------------
   */

  const boundaryValue =
    resolvePriceMeterDiscoveryCriterionBoundary({
      criterion,
      distribution
    })


  /*
   * -------------------------------------------------------
   * QUALIFICATION
   * -------------------------------------------------------
   */


  let qualifies:
    boolean


  switch (
    criterion
  ) {

    case 'at_or_below_p10':
    case 'at_or_below_p25':
      qualifies =
        pricePerM2 <=
          boundaryValue
      break


    case 'below_median':
      qualifies =
        pricePerM2 <
          boundaryValue
      break


    case 'above_median':
      qualifies =
        pricePerM2 >
          boundaryValue
      break


    case 'at_or_above_p75':
    case 'at_or_above_p90':
      qualifies =
        pricePerM2 >=
          boundaryValue
      break


    default: {
      const exhaustiveCheck:
        never =
          criterion

      throw new Error(
        `Unsupported Comparative Price / m² Discovery criterion: ${exhaustiveCheck}.`
      )
    }
  }


  return {
    qualifies,
    criterion,
    pricePerM2,
    boundaryValue
  }
}


/*
 * ---------------------------------------------------------
 * POPULATION QUALIFICATION
 * ---------------------------------------------------------
 *
 * Convenience operation for applying one criterion to one
 * already-established geographic population.
 *
 * This operation does not build or alter that population.
 */


export function qualifyPriceMeterDiscoveryObservations<
  T extends PriceMeterTransactionType
>({
  observations,
  criterion,
  distribution
}: {
  observations:
    PriceMeterObservation[]

  criterion:
    PriceMeterDiscoveryCriterion

  distribution:
    PriceMeterDistribution<T>
}): PriceMeterObservation[] {

  return observations.filter(
    observation =>
      evaluatePriceMeterDiscoveryCriterion({
        observation,
        criterion,
        distribution
      }).qualifies
  )
}