import type {
  PriceMeterPropertyBasis,
  PriceMeterNormalizationBasis
} from '@/lib/price-meter-analytical-cohort'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterComparisonCohortDefinition
} from '@/lib/price-meter-comparison-cohort'

import type {
  PriceMeterComparisonReferenceCohort
} from '@/lib/price-meter-comparison-analysis'


export type PriceMeterComparisonRequest = {
  transactionType:
    PriceMeterTransactionType

  propertyBasis:
    PriceMeterPropertyBasis

  normalizationBasis:
    PriceMeterNormalizationBasis

  cohortA:
    PriceMeterComparisonCohortDefinition

  cohortB:
    PriceMeterComparisonCohortDefinition

  referenceCohort:
    PriceMeterComparisonReferenceCohort
}


export function validatePriceMeterComparisonRequest(
  request:
    PriceMeterComparisonRequest
): void {
  if (
    request.propertyBasis ===
      'land_only' &&
    request.normalizationBasis ===
      'construction'
  ) {
    throw new Error(
      'Vacant Land cannot use construction normalization.'
    )
  }

  if (
    request.referenceCohort !==
      'A' &&
    request.referenceCohort !==
      'B'
  ) {
    throw new Error(
      'Price / m² comparison reference cohort must be A or B.'
    )
  }
}