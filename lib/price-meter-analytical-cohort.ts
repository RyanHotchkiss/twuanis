import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionCohort,
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'


export type PriceMeterPropertyBasis =
  | 'land_only'
  | 'improved_property'


export type PriceMeterNormalizationBasis =
  | 'land'
  | 'construction'


export type PriceMeterAnalyticalCohort<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  propertyBasis:
    PriceMeterPropertyBasis

  normalizationBasis:
    PriceMeterNormalizationBasis

  observations:
    PriceMeterObservation[]
}


/*
 * ---------------------------------------------------------
 * ANALYTICAL COHORT RESOLUTION
 * ---------------------------------------------------------
 *
 * Price / m² distributions must be homogeneous across:
 *
 * - Transaction Type
 * - Property Basis
 * - Normalization Basis
 *
 * Examples of distinct populations:
 *
 * Sale + Land Only + Land
 * Sale + Improved Property + Land
 * Sale + Improved Property + Construction
 *
 * These populations MUST NOT be merged into one
* distribution or comparison calculation.
 */

export function buildPriceMeterAnalyticalCohort<
  T extends PriceMeterTransactionType
>({
  transactionCohort,
  propertyBasis,
  normalizationBasis
}: {
  transactionCohort:
    PriceMeterTransactionCohort<T>

  propertyBasis:
    PriceMeterPropertyBasis

  normalizationBasis:
    PriceMeterNormalizationBasis
}): PriceMeterAnalyticalCohort<T> {

  /*
   * Vacant Land can never be construction-normalized.
   */

  if (
    propertyBasis ===
      'land_only' &&
    normalizationBasis ===
      'construction'
  ) {
    throw new Error(
      'Land Only Price / m² cohorts cannot use Construction normalization.'
    )
  }


  const observations =
    transactionCohort
      .observations
      .filter(
        observation =>
          observation.propertyBasis ===
            propertyBasis &&
          observation.normalizationBasis ===
            normalizationBasis
      )


  /*
   * Defensive invariant.
   *
   * Every observation surviving this boundary must match
   * all three dimensions of the cohort identity.
   */

  if (
    observations.some(
      observation =>
        observation.transactionType !==
          transactionCohort.transactionType ||
        observation.propertyBasis !==
          propertyBasis ||
        observation.normalizationBasis !==
          normalizationBasis
    )
  ) {
    throw new Error(
      'Price / m² analytical cohort contains incompatible observations.'
    )
  }


  return {
    transactionType:
      transactionCohort.transactionType,

    propertyBasis,

    normalizationBasis,

    observations
  }
}