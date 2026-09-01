import {
  resolvePropertyAreaConstraint,
  resolveConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS
} from '@/lib/price-meter-construction-land-cohorts'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'


export type PriceMeterComparisonCohortDefinition = {
  geography:
    CanonicalGeographyTerm

  propertyType:
    PriceMeterCharacteristicIdentity

  characteristics:
    [
      PriceMeterCharacteristicIdentity,
      PriceMeterCharacteristicIdentity
    ]

  propertyAreaRange:
    string | null

  constructionAreaRange:
    string | null

  constructionLandCohortKey:
    string | null
}


export type PriceMeterComparisonCohortValidation = {
  valid:
    boolean

  reasons:
    PriceMeterComparisonCohortValidationReason[]
}


export type PriceMeterComparisonCohortValidationReason =
  | 'invalid_geography'
  | 'invalid_property_type'
  | 'invalid_characteristic_count'
  | 'invalid_characteristic_type'
  | 'duplicate_characteristic'
  | 'missing_area_constraint'
  | 'invalid_property_area_range'
  | 'invalid_construction_area_range'
  | 'invalid_construction_land_cohort'


export function validatePriceMeterComparisonCohortDefinition(
  definition:
    PriceMeterComparisonCohortDefinition
): PriceMeterComparisonCohortValidation {

  const reasons:
    PriceMeterComparisonCohortValidationReason[] =
      []


  /*
   * -------------------------------------------------------
   * GEOGRAPHY
   * -------------------------------------------------------
   *
   * Phase 10 requires one explicit canonical geography.
   *
   * Cohort A and Cohort B resolve geography independently.
   * This layer does not compare or broaden them.
   */

  if (
    !definition.geography ||
    ![
      'province',
      'canton',
      'district'
    ].includes(
      definition.geography.term_type
    )
  ) {
    reasons.push(
      'invalid_geography'
    )
  }


  /*
   * -------------------------------------------------------
   * PROPERTY TYPE
   * -------------------------------------------------------
   *
   * Property Type is mandatory cohort identity.
   *
   * It does not count as one of the two qualifying
   * characteristics.
   */

  if (
    !definition.propertyType ||
    definition.propertyType.termType !==
      'property_type'
  ) {
    reasons.push(
      'invalid_property_type'
    )
  }


  /*
   * -------------------------------------------------------
   * QUALIFYING CHARACTERISTICS
   * -------------------------------------------------------
   *
   * Phase 10 requires exactly two positive canonical
   * characteristic identities in addition to Property Type.
   *
   * Missing ontology membership is never interpreted as
   * negative evidence.
   */

  if (
    definition.characteristics.length !==
      2
  ) {
    reasons.push(
      'invalid_characteristic_count'
    )
  }


  if (
    definition.characteristics.some(
      characteristic =>
        characteristic.termType ===
          'property_type'
    )
  ) {
    reasons.push(
      'invalid_characteristic_type'
    )
  }


  const characteristicIds =
    definition.characteristics.map(
      characteristic =>
        characteristic.ontologyTermId
    )


  if (
    new Set(
      characteristicIds
    ).size !==
      characteristicIds.length
  ) {
    reasons.push(
      'duplicate_characteristic'
    )
  }


  /*
   * -------------------------------------------------------
   * AREA IDENTITY
   * -------------------------------------------------------
   *
   * At least one canonical exact-area constraint is required:
   *
   * - Property Area
   * - Construction Area
   *
   * If both are supplied, both become cohort identity.
   */

  if (
    !definition.propertyAreaRange &&
    !definition.constructionAreaRange
  ) {
    reasons.push(
      'missing_area_constraint'
    )
  }


  if (
    definition.propertyAreaRange &&
    !resolvePropertyAreaConstraint(
      definition.propertyAreaRange
    )
  ) {
    reasons.push(
      'invalid_property_area_range'
    )
  }


  if (
    definition.constructionAreaRange &&
    !resolveConstructionAreaConstraint(
      definition.constructionAreaRange
    )
  ) {
    reasons.push(
      'invalid_construction_area_range'
    )
  }


  /*
   * -------------------------------------------------------
   * CONSTRUCTION-TO-LAND IDENTITY
   * -------------------------------------------------------
   *
   * Construction-to-Land is optional Phase 10 cohort
   * identity.
   *
   * When selected, it must reference an existing canonical
   * Phase 9 cohort. No Phase 10-specific ratio ranges are
   * invented here.
   */

  if (
    definition.constructionLandCohortKey &&
    !PRICE_METER_CONSTRUCTION_LAND_COHORTS
      .some(
        cohort =>
          cohort.key ===
            definition.constructionLandCohortKey
      )
  ) {
    reasons.push(
      'invalid_construction_land_cohort'
    )
  }


  return {
    valid:
      reasons.length ===
        0,

    reasons
  }
}