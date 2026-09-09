import 'server-only'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import {
  resolvePriceMeterPropertyPositionIdentity,
  type PriceMeterPropertyPositionIdentity
} from '@/lib/price-meter-property-position-identity'

import {
  PROPERTY_AREA_RANGE_OPTIONS,
  CONSTRUCTION_AREA_RANGE_OPTIONS,
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import {
  resolvePriceMeterYearBuiltCohort,
  type PriceMeterYearBuiltCohort
} from '@/lib/price-meter-year-built-cohorts'


export type PriceMeterComparableSubjectIdentity = {
  positionIdentity:
    PriceMeterPropertyPositionIdentity

  propertyType:
    PriceMeterCharacteristicIdentity

  propertyAreaRange:
    string

  constructionAreaRange:
    string | null

  yearBuiltCohort:
    PriceMeterYearBuiltCohort | null

  characteristics:
    PriceMeterCharacteristicIdentity[]
}


function resolveSingleRange({
  exactAreaM2,
  basis
}: {
  exactAreaM2:
    number

  basis:
    'property' | 'construction'
}): string {

  const options =
    basis ===
      'property'
      ? PROPERTY_AREA_RANGE_OPTIONS
      : CONSTRUCTION_AREA_RANGE_OPTIONS


  const matches =
    options.filter(
      option =>
        basis ===
          'property'
          ? matchesPropertyAreaConstraint(
              exactAreaM2,
              option.value
            )
          : matchesConstructionAreaConstraint(
              exactAreaM2,
              option.value
            )
    )


  if (
    matches.length !==
      1
  ) {
    throw new Error(
      `Phase 12A requires exactly one canonical ${basis} area range for the subject property.`
    )
  }


  return matches[0].value
}


export function resolvePriceMeterComparableSubjectIdentity({
  observation,
  characteristics,
  yearBuiltRange
}: {
  observation:
    PriceMeterObservation

  characteristics:
    PriceMeterCharacteristicIdentity[]

  yearBuiltRange:
    unknown
}): PriceMeterComparableSubjectIdentity {

  const positionIdentity =
    resolvePriceMeterPropertyPositionIdentity(
      observation
    )


  const propertyTypeMatches =
    characteristics.filter(
      characteristic =>
        characteristic.termType ===
          'property_type'
    )


  if (
    propertyTypeMatches.length !==
      1
  ) {
    throw new Error(
      'Phase 12A requires exactly one canonical Property Type identity.'
    )
  }


  const propertyAreaM2 =
    observation
      .analyticalIdentity
      .propertyAreaM2


  if (
    propertyAreaM2 ===
      null ||
    !Number.isFinite(
      propertyAreaM2
    ) ||
    propertyAreaM2 <=
      0
  ) {
    throw new Error(
      'Phase 12A requires exact canonical Property Area.'
    )
  }


  const propertyAreaRange =
    resolveSingleRange({
      exactAreaM2:
        propertyAreaM2,

      basis:
        'property'
    })


  let constructionAreaRange:
    string | null =
      null


  if (
    positionIdentity.propertyBasis ===
      'improved_property'
  ) {
    const constructionAreaM2 =
      observation
        .analyticalIdentity
        .constructionAreaM2


    if (
      constructionAreaM2 ===
        null ||
      !Number.isFinite(
        constructionAreaM2
      ) ||
      constructionAreaM2 <=
        0
    ) {
      throw new Error(
        'Improved Property Phase 12A identity requires exact canonical Construction Area.'
      )
    }


    constructionAreaRange =
      resolveSingleRange({
        exactAreaM2:
          constructionAreaM2,

        basis:
          'construction'
      })
  }


  const yearBuiltCohort =
    yearBuiltRange ===
      null ||
    yearBuiltRange ===
      undefined ||
    yearBuiltRange ===
      ''
      ? null
      : resolvePriceMeterYearBuiltCohort(
          yearBuiltRange
        )


  if (
    yearBuiltRange !==
      null &&
    yearBuiltRange !==
      undefined &&
    yearBuiltRange !==
      '' &&
    yearBuiltCohort ===
      null
  ) {
    throw new Error(
      'Subject Year Built identity is not a canonical Price / m² Year Built cohort.'
    )
  }


  return {
    positionIdentity,

    propertyType:
      propertyTypeMatches[0],

    propertyAreaRange,

    constructionAreaRange,

    yearBuiltCohort,

    characteristics:
      [...characteristics]
  }
}