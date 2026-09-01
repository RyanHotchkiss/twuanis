import type {
  PriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'


type PriceMeterComparisonAnalyticalCohorts = {
  sale: {
    vacantLandLand:
      PriceMeterAnalyticalCohort<'sale'>

    improvedLand:
      PriceMeterAnalyticalCohort<'sale'>

    improvedConstruction:
      PriceMeterAnalyticalCohort<'sale'>
  }

  rent: {
    vacantLandLand:
      PriceMeterAnalyticalCohort<'rent'>

    improvedLand:
      PriceMeterAnalyticalCohort<'rent'>

    improvedConstruction:
      PriceMeterAnalyticalCohort<'rent'>
  }
}


export function resolvePriceMeterComparisonAnalyticalCohort({
  request,
  cohorts
}: {
  request:
    PriceMeterComparisonRequest

  cohorts:
    PriceMeterComparisonAnalyticalCohorts
}): PriceMeterAnalyticalCohort<PriceMeterTransactionType> {
  const transactionCohorts =
    cohorts[
      request.transactionType
    ]

  if (
    request.propertyBasis ===
      'land_only'
  ) {
    if (
      request.normalizationBasis !==
        'land'
    ) {
      throw new Error(
        'Vacant Land cannot use construction normalization.'
      )
    }

    return transactionCohorts
      .vacantLandLand
  }

  if (
    request.normalizationBasis ===
      'land'
  ) {
    return transactionCohorts
      .improvedLand
  }

  return transactionCohorts
    .improvedConstruction
}