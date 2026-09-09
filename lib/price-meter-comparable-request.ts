import 'server-only'

import {
  PRICE_METER_COMPARABLE_DIMENSION_ORDER,
  isPriceMeterComparableDimension,
  type PriceMeterComparableDimension
} from '@/lib/price-meter-comparable-dimensions'

import type {
  PriceMeterComparableGeographyLevel
} from '@/lib/price-meter-comparable-geography'

import type {
  PriceMeterNormalizationBasis
} from '@/lib/price-meter-identity'


export type PriceMeterComparableRequest = {
  subjectListingId:
    string

  geographyLevel:
    PriceMeterComparableGeographyLevel

  normalizationBasis:
    PriceMeterNormalizationBasis

  activeDimensions:
    PriceMeterComparableDimension[]
}


export function validatePriceMeterComparableRequest(
  request:
    PriceMeterComparableRequest
): PriceMeterComparableRequest {

  if (
    typeof request.subjectListingId !==
      'string' ||
    request.subjectListingId.trim() ===
      ''
  ) {
    throw new Error(
      'Phase 12A requires an identifiable subject listing.'
    )
  }


  if (
    request.geographyLevel !==
      'province' &&
    request.geographyLevel !==
      'canton' &&
    request.geographyLevel !==
      'district'
  ) {
    throw new Error(
      'Phase 12A requires an explicit supported geography level.'
    )
  }


  if (
    request.normalizationBasis !==
      'land' &&
    request.normalizationBasis !==
      'construction'
  ) {
    throw new Error(
      'Phase 12A requires an explicit supported Normalization Basis.'
    )
  }


  if (
    !Array.isArray(
      request.activeDimensions
    ) ||
    request.activeDimensions.some(
      dimension =>
        !isPriceMeterComparableDimension(
          dimension
        )
    )
  ) {
    throw new Error(
      'Phase 12A request contains an invalid comparable dimension.'
    )
  }


  const uniqueDimensions =
    new Set(
      request.activeDimensions
    )


  if (
    uniqueDimensions.size !==
      request.activeDimensions.length
  ) {
    throw new Error(
      'Phase 12A request contains duplicate comparable dimensions.'
    )
  }


  const orderedDimensions =
    PRICE_METER_COMPARABLE_DIMENSION_ORDER
      .filter(
        dimension =>
          uniqueDimensions.has(
            dimension
          )
      )


  return {
    subjectListingId:
      request.subjectListingId.trim(),

    geographyLevel:
      request.geographyLevel,

    normalizationBasis:
      request.normalizationBasis,

    activeDimensions:
      orderedDimensions
  }
}