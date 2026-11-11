/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL SECONDARY COHORTS
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Reuse the canonical cohort definitions and membership
 * rules already established by Phases 7–9.
 *
 * Phase 11 MUST NOT define alternate:
 *
 * - Property Area ranges
 * - Construction Area ranges
 * - Construction-to-Land ranges
 * - geographic hierarchy
 * - tolerance bands
 * - midpoint membership
 * - nearest-cohort membership
 *
 * Exact canonical observations either belong to one
 * applicable secondary cohort or they do not.
 *
 * This layer DOES NOT:
 *
 * - construct Cross-Dimensional populations
 * - calculate distributions
 * - calculate relationship statistics
 * - calculate Persistence
 * - calculate Variation
 * - calculate Reversal
 * - calculate Non-establishment
 */

import {
  PROPERTY_AREA_RANGE_OPTIONS,
  CONSTRUCTION_AREA_RANGE_OPTIONS,
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS,
  resolvePriceMeterConstructionLandCohort
} from '@/lib/price-meter-construction-land-cohorts'

import type {
  PriceMeterGeographyLevel
} from '@/lib/price-meter-geographic-distribution'

import type {
  PriceMeterCrossDimensionalSecondaryDimension
} from '@/lib/price-meter-cross-dimensional-question'


export type PriceMeterCrossDimensionalNumericalSecondaryDimension =
  Exclude<
    PriceMeterCrossDimensionalSecondaryDimension,
    'geography'
  >


export type PriceMeterCrossDimensionalSecondaryCohort = {
  dimension:
    PriceMeterCrossDimensionalNumericalSecondaryDimension

  key:
    string

  label:
    string
}


export type PriceMeterCrossDimensionalGeographicSecondaryCohort = {
  dimension:
    'geography'

  level:
    PriceMeterGeographyLevel

  key:
    string

  label:
    string
}


/*
 * ---------------------------------------------------------
 * CANONICAL NUMERICAL COHORT DEFINITIONS
 * ---------------------------------------------------------
 *
 * These arrays expose existing canonical definitions to
 * Phase 11 without recreating their boundaries.
 */

export function getPriceMeterCrossDimensionalSecondaryCohorts(
  dimension:
    PriceMeterCrossDimensionalNumericalSecondaryDimension
): readonly PriceMeterCrossDimensionalSecondaryCohort[] {

  if (
    dimension ===
      'property_area'
  ) {
    return PROPERTY_AREA_RANGE_OPTIONS
      .map(
        option => ({
          dimension:
            'property_area' as const,

          key:
            option.value,

          label:
            option.label
        })
      )
  }


  if (
    dimension ===
      'construction_area'
  ) {
    return CONSTRUCTION_AREA_RANGE_OPTIONS
      .map(
        option => ({
          dimension:
            'construction_area' as const,

          key:
            option.value,

          label:
            option.label
        })
      )
  }


  return PRICE_METER_CONSTRUCTION_LAND_COHORTS
    .map(
      cohort => ({
        dimension:
          'construction_to_land' as const,

        key:
          cohort.key,

        label:
          cohort.label
      })
    )
}


/*
 * ---------------------------------------------------------
 * PROPERTY AREA MEMBERSHIP
 * ---------------------------------------------------------
 */

export function resolvePriceMeterCrossDimensionalPropertyAreaCohort(
  exactPropertyAreaM2:
    number | null | undefined
): PriceMeterCrossDimensionalSecondaryCohort | null {

  if (
    exactPropertyAreaM2 ===
      null ||
    exactPropertyAreaM2 ===
      undefined ||
    !Number.isFinite(
      exactPropertyAreaM2
    ) ||
    exactPropertyAreaM2 <=
      0
  ) {
    return null
  }


  const matches =
    PROPERTY_AREA_RANGE_OPTIONS
      .filter(
        option =>
          matchesPropertyAreaConstraint(
            exactPropertyAreaM2,
            option.value
          )
      )


  if (
    matches.length !==
      1
  ) {
    throw new Error(
      'Exact Property Area does not resolve to exactly one canonical Phase 8 cohort.'
    )
  }


  return {
    dimension:
      'property_area',

    key:
      matches[0].value,

    label:
      matches[0].label
  }
}


/*
 * ---------------------------------------------------------
 * CONSTRUCTION AREA MEMBERSHIP
 * ---------------------------------------------------------
 */

export function resolvePriceMeterCrossDimensionalConstructionAreaCohort(
  exactConstructionAreaM2:
    number | null | undefined
): PriceMeterCrossDimensionalSecondaryCohort | null {

  if (
    exactConstructionAreaM2 ===
      null ||
    exactConstructionAreaM2 ===
      undefined ||
    !Number.isFinite(
      exactConstructionAreaM2
    ) ||
    exactConstructionAreaM2 <=
      0
  ) {
    return null
  }


  const matches =
    CONSTRUCTION_AREA_RANGE_OPTIONS
      .filter(
        option =>
          matchesConstructionAreaConstraint(
            exactConstructionAreaM2,
            option.value
          )
      )


  if (
    matches.length !==
      1
  ) {
    throw new Error(
      'Exact Construction Area does not resolve to exactly one canonical Phase 8 cohort.'
    )
  }


  return {
    dimension:
      'construction_area',

    key:
      matches[0].value,

    label:
      matches[0].label
  }
}


/*
 * ---------------------------------------------------------
 * CONSTRUCTION-TO-LAND MEMBERSHIP
 * ---------------------------------------------------------
 */

export function resolvePriceMeterCrossDimensionalConstructionLandCohort(
  exactConstructionToLandRatio:
    number | null | undefined
): PriceMeterCrossDimensionalSecondaryCohort | null {

  if (
    exactConstructionToLandRatio ===
      null ||
    exactConstructionToLandRatio ===
      undefined ||
    !Number.isFinite(
      exactConstructionToLandRatio
    ) ||
    exactConstructionToLandRatio <=
      0
  ) {
    return null
  }


  const cohort =
    resolvePriceMeterConstructionLandCohort(
      exactConstructionToLandRatio
    )


  if (
    cohort ===
      null
  ) {
    return null
  }


  return {
    dimension:
      'construction_to_land',

    key:
      cohort.key,

    label:
      cohort.label
  }
}


/*
 * ---------------------------------------------------------
 * GENERIC NUMERICAL MEMBERSHIP RESOLVER
 * ---------------------------------------------------------
 *
 * The caller supplies the exact canonical value appropriate
 * to the selected secondary dimension.
 *
 * No value is derived or estimated here.
 */

export function resolvePriceMeterCrossDimensionalNumericalSecondaryCohort({
  dimension,
  exactValue
}: {
  dimension:
    PriceMeterCrossDimensionalNumericalSecondaryDimension

  exactValue:
    number | null | undefined
}): PriceMeterCrossDimensionalSecondaryCohort | null {

  if (
    dimension ===
      'property_area'
  ) {
    return resolvePriceMeterCrossDimensionalPropertyAreaCohort(
      exactValue
    )
  }


  if (
    dimension ===
      'construction_area'
  ) {
    return resolvePriceMeterCrossDimensionalConstructionAreaCohort(
      exactValue
    )
  }


  return resolvePriceMeterCrossDimensionalConstructionLandCohort(
    exactValue
  )
}