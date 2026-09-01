/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARISON COHORT POPULATION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve one validated Phase 10 comparison cohort
 * definition against one already-compatible Price / m²
 * analytical cohort.
 *
 * This layer answers:
 *
 * Which observations belong to this user-defined
 * Phase 10 population?
 *
 * It filters by:
 *
 * - canonical geography
 * - canonical Property Type
 * - exactly two canonical qualifying characteristics
 * - Property Area range when selected
 * - Construction Area range when selected
 * - Construction-to-Land cohort when selected
 *
 * This layer DOES NOT:
 *
 * - establish Sale / Rent compatibility
 * - establish Property Basis compatibility
 * - establish Normalization Basis compatibility
 * - calculate Price / m² distributions
 * - calculate medians
 * - compare Cohort A with Cohort B
 * - calculate confidence
 * - infer negative characteristic membership
 * - broaden geography
 */


import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterComparisonCohortDefinition
} from '@/lib/price-meter-comparison-cohort'

import {
  validatePriceMeterComparisonCohortDefinition
} from '@/lib/price-meter-comparison-cohort'

import {
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS,
  matchesPriceMeterConstructionLandCohort
} from '@/lib/price-meter-construction-land-cohorts'


export type PriceMeterComparisonCohortMembership = {
  listingId:
    string

  ontologyTermIds:
    number[]
}


export type PriceMeterComparisonCohortPopulation = {
  definition:
    PriceMeterComparisonCohortDefinition

  observations:
    PriceMeterObservation[]

  matchingListingIds:
    string[]

  sampleSize:
    number
}


function matchesComparisonCohortGeography(
  observation:
    PriceMeterObservation,

  definition:
    PriceMeterComparisonCohortDefinition
): boolean {

  const selectedGeography =
    definition.geography


  if (
    selectedGeography.term_type ===
      'province'
  ) {
    return (
      observation
        .geography
        .province
        ?.id ===
      selectedGeography.id
    )
  }


  if (
    selectedGeography.term_type ===
      'canton'
  ) {
    return (
      observation
        .geography
        .canton
        ?.id ===
      selectedGeography.id
    )
  }


  if (
    selectedGeography.term_type ===
      'district'
  ) {
    return (
      observation
        .geography
        .district
        ?.id ===
      selectedGeography.id
    )
  }


  return false
}


function matchesComparisonCohortOntologyTerms({
  definition,
  membership
}: {
  definition:
    PriceMeterComparisonCohortDefinition

  membership:
    PriceMeterComparisonCohortMembership
}): boolean {

  const requiredTermIds = [
    definition
      .propertyType
      .ontologyTermId,

    ...definition
      .characteristics
      .map(
        characteristic =>
          characteristic
            .ontologyTermId
      )
  ]


  const membershipTermIds =
    new Set(
      membership
        .ontologyTermIds
    )


  return requiredTermIds.every(
    termId =>
      membershipTermIds.has(
        termId
      )
  )
}


function matchesComparisonCohortArea({
  observation,
  definition
}: {
  observation:
    PriceMeterObservation

  definition:
    PriceMeterComparisonCohortDefinition
}): boolean {

  if (
    !matchesPropertyAreaConstraint(
      observation
        .analyticalIdentity
        .propertyAreaM2,

      definition
        .propertyAreaRange ??
        undefined
    )
  ) {
    return false
  }


  if (
    !matchesConstructionAreaConstraint(
      observation
        .analyticalIdentity
        .constructionAreaM2,

      definition
        .constructionAreaRange ??
        undefined
    )
  ) {
    return false
  }


  return true
}


function matchesComparisonCohortConstructionLand({
  observation,
  definition
}: {
  observation:
    PriceMeterObservation

  definition:
    PriceMeterComparisonCohortDefinition
}): boolean {

  const selectedCohortKey =
    definition
      .constructionLandCohortKey


  if (
    !selectedCohortKey
  ) {
    return true
  }


  const propertyAreaM2 =
    observation
      .analyticalIdentity
      .propertyAreaM2


  const constructionAreaM2 =
    observation
      .analyticalIdentity
      .constructionAreaM2


  if (
    propertyAreaM2 ===
      null ||
    constructionAreaM2 ===
      null ||
    !Number.isFinite(
      propertyAreaM2
    ) ||
    !Number.isFinite(
      constructionAreaM2
    ) ||
    propertyAreaM2 <=
      0 ||
    constructionAreaM2 <=
      0
  ) {
    return false
  }


  const constructionToLandRatio =
    constructionAreaM2 /
    propertyAreaM2


  const selectedCohort =
    PRICE_METER_CONSTRUCTION_LAND_COHORTS
      .find(
        cohort =>
          cohort.key ===
            selectedCohortKey
      )


  if (
    !selectedCohort
  ) {
    return false
  }


  return (
    matchesPriceMeterConstructionLandCohort(
      constructionToLandRatio,
      selectedCohort
    )
  )
}


export function buildPriceMeterComparisonCohortPopulation({
  definition,
  observations,
  memberships
}: {
  definition:
    PriceMeterComparisonCohortDefinition

  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterComparisonCohortMembership[]
}): PriceMeterComparisonCohortPopulation {

  /*
   * -------------------------------------------------------
   * DEFINITION VALIDATION
   * -------------------------------------------------------
   *
   * Invalid Phase 10 cohort definitions never enter
   * population resolution.
   */

  const validation =
    validatePriceMeterComparisonCohortDefinition(
      definition
    )


  if (
    !validation.valid
  ) {
    throw new Error(
      `Invalid Price / m² comparison cohort definition: ${
        validation.reasons.join(
          ', '
        )
      }.`
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL ONTOLOGY MEMBERSHIP
   * -------------------------------------------------------
   *
   * Membership is positive evidence only.
   *
   * Absence of a term never means the listing possesses
   * the opposite characteristic.
   */

  const membershipsByListingId =
    new Map(
      memberships.map(
        membership => [
          membership.listingId,
          membership
        ]
      )
    )


  /*
   * -------------------------------------------------------
   * POPULATION RESOLUTION
   * -------------------------------------------------------
   *
   * Every selected cohort dimension is intersectional.
   *
   * A listing must satisfy every selected identity.
   */
const matchingObservations =
  observations.filter(
    (
      observation
    ): observation is PriceMeterObservation & {
      listingId: string
    } => {

      /*
       * Phase 10 ontology membership requires a canonical
       * listing identity.
       *
       * An observation without a listing ID cannot be
       * matched safely against canonical ontology
       * membership and therefore fails closed.
       */

      if (
        observation.listingId ===
          null
      ) {
        return false
      }


      if (
        !matchesComparisonCohortGeography(
            observation,
            definition
          )
        ) {
          return false
        }


        const membership =
          membershipsByListingId.get(
            observation.listingId
          )


        if (
          !membership
        ) {
          return false
        }


        if (
          !matchesComparisonCohortOntologyTerms({
            definition,
            membership
          })
        ) {
          return false
        }


        if (
          !matchesComparisonCohortArea({
            observation,
            definition
          })
        ) {
          return false
        }


        if (
          !matchesComparisonCohortConstructionLand({
            observation,
            definition
          })
        ) {
          return false
        }


        return true
      }
    )


  const matchingListingIds =
    matchingObservations.map(
      observation =>
        observation.listingId
    )


  return {
    definition,

    observations:
      matchingObservations,

    matchingListingIds,

    sampleSize:
      matchingObservations.length
  }
}