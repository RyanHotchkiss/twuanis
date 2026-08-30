/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND RELATIONSHIP
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Measure the descriptive cohort-level relationship between
 * canonical Construction-to-Land Ratio and normalized
 * Price / m².
 *
 * Phase 9 relationship evidence requires:
 *
 * - at least 3 populated Construction-to-Land cohorts
 * - at least 12 represented canonical properties
 *
 * IMPORTANT MATHEMATICAL BOUNDARY:
 *
 * Construction-to-Land Ratio:
 *
 *   R = C / L
 *
 * Land-normalized Price / m²:
 *
 *   Pl = P / L
 *
 * Therefore R and Pl share Property Area L.
 *
 * Additionally:
 *
 *   Pl = Pc × R
 *
 * Because of this mathematical coupling, this layer may
 * calculate descriptive rank correlation, but MUST NOT
 * interpret the relationship causally.
 *
 * Log-log regression, modeled percentage change, and R² are
 * intentionally withheld for the Land-normalized
 * relationship because the independent variable is a
 * multiplicative component of the dependent variable.
 */

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  calculateSpearmanCorrelation
} from '@/lib/price-meter-size-relationship-math'

import type {
  PriceMeterConstructionLandStatistics
} from '@/lib/price-meter-construction-land-statistics'


export type PriceMeterConstructionLandRelationshipCoordinate = {
  constructionToLandRatio:
    number

  normalizedPricePerM2:
    number

  observationCount:
    number
}


export type PriceMeterConstructionLandRelationshipEvidence = {
  populatedCohortCount:
    number

  representedObservationCount:
    number

  requiredPopulatedCohortCount:
    3

  requiredObservationCount:
    12

  hasSufficientCohortEvidence:
    boolean

  hasSufficientObservationEvidence:
    boolean

  hasSufficientEvidence:
    boolean
}


export type PriceMeterConstructionLandLandRelationship<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  normalizationBasis:
    'land'

  coordinates:
    PriceMeterConstructionLandRelationshipCoordinate[]

  evidence:
    PriceMeterConstructionLandRelationshipEvidence

  spearmanRho:
    number | null

  regression:
    null

  regressionWithheldReason:
    'shared_property_area_mathematical_coupling'
}


export function buildPriceMeterConstructionLandLandRelationship<
  T extends PriceMeterTransactionType
>(
  statistics:
    PriceMeterConstructionLandStatistics<T>
): PriceMeterConstructionLandLandRelationship<T> {

  const coordinates =
    statistics
      .populatedCohorts
      .map(
        cohort => {

          const constructionToLandRatio =
            cohort.medianExactRatio

          const normalizedPricePerM2 =
            cohort
              .landNormalized
              .median


          if (
            constructionToLandRatio ===
              null ||
            normalizedPricePerM2 ===
              null
          ) {
            throw new Error(
              'Populated Construction-to-Land cohort is missing canonical Land-normalized relationship coordinates.'
            )
          }


          return {
            constructionToLandRatio,

            normalizedPricePerM2,

            observationCount:
              cohort.observationCount
          }
        }
      )


  const populatedCohortCount =
    coordinates.length


  const representedObservationCount =
    coordinates.reduce(
      (
        total,
        coordinate
      ) =>
        total +
        coordinate.observationCount,
      0
    )


  const hasSufficientCohortEvidence =
    populatedCohortCount >=
      3


  const hasSufficientObservationEvidence =
    representedObservationCount >=
      12


  const hasSufficientEvidence =
    hasSufficientCohortEvidence &&
    hasSufficientObservationEvidence


  const spearmanRho =
    hasSufficientEvidence
      ? calculateSpearmanCorrelation(
          coordinates.map(
            coordinate =>
              coordinate
                .constructionToLandRatio
          ),

          coordinates.map(
            coordinate =>
              coordinate
                .normalizedPricePerM2
          )
        )
      : null


  return {
    transactionType:
      statistics.transactionType,

    normalizationBasis:
      'land',

    coordinates,

    evidence: {
      populatedCohortCount,

      representedObservationCount,

      requiredPopulatedCohortCount:
        3,

      requiredObservationCount:
        12,

      hasSufficientCohortEvidence,

      hasSufficientObservationEvidence,

      hasSufficientEvidence
    },

    spearmanRho,

    regression:
      null,

    regressionWithheldReason:
      'shared_property_area_mathematical_coupling'
  }
}

export type PriceMeterConstructionLandConstructionRelationship<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  normalizationBasis:
    'construction'

  coordinates:
    PriceMeterConstructionLandRelationshipCoordinate[]

  evidence:
    PriceMeterConstructionLandRelationshipEvidence

  spearmanRho:
    number | null

  regression:
    null

  regressionWithheldReason:
    'shared_construction_area_mathematical_coupling'
}


export function buildPriceMeterConstructionLandConstructionRelationship<
  T extends PriceMeterTransactionType
>(
  statistics:
    PriceMeterConstructionLandStatistics<T>
): PriceMeterConstructionLandConstructionRelationship<T> {

  const coordinates =
    statistics
      .populatedCohorts
      .map(
        cohort => {

          const constructionToLandRatio =
            cohort.medianExactRatio

          const normalizedPricePerM2 =
            cohort
              .constructionNormalized
              .median


          if (
            constructionToLandRatio ===
              null ||
            normalizedPricePerM2 ===
              null
          ) {
            throw new Error(
              'Populated Construction-to-Land cohort is missing canonical Construction-normalized relationship coordinates.'
            )
          }


          return {
            constructionToLandRatio,

            normalizedPricePerM2,

            observationCount:
              cohort.observationCount
          }
        }
      )


  const populatedCohortCount =
    coordinates.length


  const representedObservationCount =
    coordinates.reduce(
      (
        total,
        coordinate
      ) =>
        total +
        coordinate.observationCount,
      0
    )


  const hasSufficientCohortEvidence =
    populatedCohortCount >=
      3


  const hasSufficientObservationEvidence =
    representedObservationCount >=
      12


  const hasSufficientEvidence =
    hasSufficientCohortEvidence &&
    hasSufficientObservationEvidence


  const spearmanRho =
    hasSufficientEvidence
      ? calculateSpearmanCorrelation(
          coordinates.map(
            coordinate =>
              coordinate
                .constructionToLandRatio
          ),

          coordinates.map(
            coordinate =>
              coordinate
                .normalizedPricePerM2
          )
        )
      : null


  return {
    transactionType:
      statistics.transactionType,

    normalizationBasis:
      'construction',

    coordinates,

    evidence: {
      populatedCohortCount,

      representedObservationCount,

      requiredPopulatedCohortCount:
        3,

      requiredObservationCount:
        12,

      hasSufficientCohortEvidence,

      hasSufficientObservationEvidence,

      hasSufficientEvidence
    },

    spearmanRho,

    regression:
      null,

    regressionWithheldReason:
      'shared_construction_area_mathematical_coupling'
  }
}