import { validatePriceMeterComparisonCohortDefinition } from '@/lib/price-meter-comparison-cohort'
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
  if (!request || !['sale', 'rent'].includes(request.transactionType) ||
      !['land_only', 'improved_property'].includes(request.propertyBasis) ||
      !['land', 'construction'].includes(request.normalizationBasis)) {
    throw new Error('Comparison requires one explicit valid Price / m² analytical identity.')
  }
  for (const cohort of [request.cohortA, request.cohortB]) {
    const validation = validatePriceMeterComparisonCohortDefinition(cohort)
    if (!validation.valid) throw new Error('Invalid comparison cohort: ' + validation.reasons.join(', '))
  }
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
