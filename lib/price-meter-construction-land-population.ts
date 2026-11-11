/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND COHORT POPULATION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Classify canonical Construction-to-Land identities into
 * the canonical Phase 9 numerical cohorts.
 *
 * This layer preserves:
 *
 * - every canonical Construction-to-Land identity
 * - every exact Construction-to-Land Ratio
 * - empty cohorts
 * - observation count per cohort
 * - median exact ratio per populated cohort
 *
 * This layer DOES NOT:
 *
 * - calculate Price / m² cohort statistics
 * - compare Land-normalized Price / m²
 * - compare Construction-normalized Price / m²
 * - calculate Spearman correlation
 * - calculate regression
 * - calculate R²
 * - infer physical Site Coverage
 * - generate user-facing synthesis
 */

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS,
  resolvePriceMeterConstructionLandCohort,
  type PriceMeterConstructionLandCohortDefinition
} from '@/lib/price-meter-construction-land-cohorts'

import {
  buildNumericalDistribution
} from '@/lib/numerical-distribution'


export type PriceMeterConstructionLandCohortPopulation = {
  definition:
    PriceMeterConstructionLandCohortDefinition

  observations:
    PriceMeterConstructionLandIdentity[]

  exactRatios:
    number[]

  observationCount:
    number

  medianExactRatio:
    number | null
}


export type PriceMeterConstructionLandPopulation<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  cohorts:
    PriceMeterConstructionLandCohortPopulation[]

  populatedCohorts:
    PriceMeterConstructionLandCohortPopulation[]

  representedObservationCount:
    number
}


export function buildPriceMeterConstructionLandPopulation<
  T extends PriceMeterTransactionType
>({
  transactionType,
  observations
}: {
  transactionType:
    T

  observations:
    PriceMeterConstructionLandIdentity[]
}): PriceMeterConstructionLandPopulation<T> {

  /*
   * -------------------------------------------------------
   * TRANSACTION INVARIANT
   * -------------------------------------------------------
   *
   * Sale and Rent are analytically different universes.
   */

  if (
    observations.some(
      observation =>
        observation.transactionType !==
          transactionType
    )
  ) {
    throw new Error(
      'Construction-to-Land cohort population contains mixed Sale/Rent observations.'
    )
  }


  /*
   * Resolve every canonical observation exactly once before
   * cohort statistics are calculated.
   *
   * resolvePriceMeterConstructionLandCohort() itself
   * requires exactly one matching canonical cohort for every
   * eligible positive ratio.
   */

  const assignments =
    observations.map(
      observation => {

        const definition =
          resolvePriceMeterConstructionLandCohort(
            observation
              .constructionToLandRatio
          )


        if (
          definition ===
            null
        ) {
          throw new Error(
            'Canonical Construction-to-Land observation could not be assigned to a cohort.'
          )
        }


        return {
          observation,
          cohortKey:
            definition.key
        }
      }
    )


  /*
   * Build from the complete canonical cohort definition list,
   * not from observed values.
   *
   * Therefore empty cohorts remain structurally present.
   */

  const cohorts =
    PRICE_METER_CONSTRUCTION_LAND_COHORTS
      .map(
        definition => {

          const cohortObservations =
            assignments
              .filter(
                assignment =>
                  assignment.cohortKey ===
                    definition.key
              )
              .map(
                assignment =>
                  assignment.observation
              )


          const exactRatios =
            cohortObservations
              .map(
                observation =>
                  observation
                    .constructionToLandRatio
              )


          const distribution =
            buildNumericalDistribution(
              exactRatios
            )


          /*
           * Canonical observations entering this layer have
           * already passed the Construction-to-Land identity
           * resolver.
           *
           * Numerical distribution must therefore retain
           * every observation assigned to the cohort.
           */

          if (
            distribution.sampleSize !==
              cohortObservations.length
          ) {
            throw new Error(
              'Construction-to-Land cohort distribution rejected one or more canonical ratios.'
            )
          }


          return {
            definition,

            observations:
              cohortObservations,

            exactRatios,

            observationCount:
              cohortObservations.length,

            medianExactRatio:
              distribution.median
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


  /*
   * Every canonical observation must survive cohort
   * assignment and representation exactly once.
   */

  if (
    representedObservationCount !==
      observations.length
  ) {
    throw new Error(
      'Construction-to-Land cohort population did not represent every canonical observation exactly once.'
    )
  }


  return {
    transactionType,

    cohorts,

    populatedCohorts,

    representedObservationCount
  }
}
