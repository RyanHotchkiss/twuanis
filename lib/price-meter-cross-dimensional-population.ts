/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL POPULATION
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Partition one already-bounded canonical Price / m²
 * population by exactly one authorized secondary dimension.
 *
 * Computational contract:
 *
 * Already-bounded canonical population
 * → one selected secondary dimension
 * → one assignment pass
 * → one bounded Cross-Dimensional population
 *
 * This layer DOES NOT:
 *
 * - fetch listings
 * - widen the owning-phase population
 * - calculate distributions
 * - calculate relationship statistics
 * - calculate Persistence
 * - calculate Variation
 * - calculate Reversal
 * - calculate Non-establishment
 * - execute multiple Cross-Dimensional questions
 */

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterGeographyLevel
} from '@/lib/price-meter-geographic-distribution'

import type {
  PriceMeterCrossDimensionalIdentity
} from '@/lib/price-meter-cross-dimensional-identity'

import {
  getPriceMeterCrossDimensionalSecondaryCohorts,
  resolvePriceMeterCrossDimensionalNumericalSecondaryCohort,
  type PriceMeterCrossDimensionalNumericalSecondaryDimension
} from '@/lib/price-meter-cross-dimensional-secondary-cohort'

import {
  resolvePriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

export type PriceMeterCrossDimensionalPopulationCohort = {
  key:
    string

  label:
    string

  observations:
    PriceMeterObservation[]

  observationCount:
    number
}


export type PriceMeterCrossDimensionalPopulation<
  T extends PriceMeterTransactionType
> = {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  cohorts:
    PriceMeterCrossDimensionalPopulationCohort[]

  populatedCohorts:
    PriceMeterCrossDimensionalPopulationCohort[]

  inputObservationCount:
    number

  representedObservationCount:
    number

  excludedObservationCount:
    number
}


/*
 * ---------------------------------------------------------
 * NUMERICAL SECONDARY VALUE
 * ---------------------------------------------------------
 *
 * Property Area and Construction Area come directly from
 * the canonical analytical identity retained by every
 * PriceMeterObservation.
 *
 * Construction-to-Land is calculated only from those two
 * exact canonical measurements.
 *
 * No midpoint, tolerance, imputation, or nearest-cohort
 * assignment is permitted.
 */

function resolveNumericalSecondaryValue({
  observation,
  dimension
}: {
  observation:
    PriceMeterObservation

  dimension:
    PriceMeterCrossDimensionalNumericalSecondaryDimension
}): number | null {

  const propertyAreaM2 =
    observation
      .analyticalIdentity
      .propertyArea
      .exactM2

  const constructionAreaM2 =
    observation
      .analyticalIdentity
      .constructionArea
      .exactM2


  if (
    dimension ===
      'property_area'
  ) {
    return propertyAreaM2
  }


  if (
    dimension ===
      'construction_area'
  ) {
    return constructionAreaM2
  }


    const constructionLandIdentity =
    resolvePriceMeterConstructionLandIdentity(
      observation
        .analyticalIdentity
    )


  return (
    constructionLandIdentity
      ?.constructionToLandRatio ??
    null
  )
}


/*
 * ---------------------------------------------------------
 * CANONICAL GEOGRAPHIC KEY
 * ---------------------------------------------------------
 *
 * Geographic identity is based only on canonical ontology
 * IDs, matching the existing Phase 7 grouping contract.
 */

function resolveGeographicSecondaryIdentity({
  observation,
  level
}: {
  observation:
    PriceMeterObservation

  level:
    PriceMeterGeographyLevel
}): {
  key:
    string

  label:
    string
} | null {

  const {
    province,
    canton,
    district
  } =
    observation.geography


  if (
    level ===
      'province'
  ) {
    if (
      !province
    ) {
      return null
    }

    return {
      key:
        `province:${province.id}`,

      label:
        province.term_name_en ??
        province.term_name ??
        province.term_name_es ??
        `Province ${province.id}`
    }
  }


  if (
    level ===
      'canton'
  ) {
    if (
      !province ||
      !canton
    ) {
      return null
    }

    return {
      key:
        `province:${province.id}|canton:${canton.id}`,

      label:
        canton.term_name_en ??
        canton.term_name ??
        canton.term_name_es ??
        `Canton ${canton.id}`
    }
  }


  if (
    !province ||
    !canton ||
    !district
  ) {
    return null
  }


  return {
    key:
      `province:${province.id}` +
      `|canton:${canton.id}` +
      `|district:${district.id}`,

    label:
      district.term_name_en ??
      district.term_name ??
      district.term_name_es ??
      `District ${district.id}`
  }
}


/*
 * ---------------------------------------------------------
 * BOUNDED COHORT INVARIANT
 * ---------------------------------------------------------
 */

function assertBoundedPopulationIdentity<
  T extends PriceMeterTransactionType
>({
  identity,
  observations
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]
}): void {

  if (
    observations.length !==
      identity.boundedObservationCount
  ) {
    throw new Error(
      'Cross-Dimensional population does not match its bounded analytical identity.'
    )
  }


  if (
    observations.some(
      observation =>
        observation.transactionType !==
          identity.transactionType ||
        observation.propertyBasis !==
          identity.propertyBasis ||
        observation.normalizationBasis !==
          identity.normalizationBasis
    )
  ) {
    throw new Error(
      'Cross-Dimensional population contains observations outside its bounded analytical identity.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * NUMERICAL SECONDARY POPULATION
 * ---------------------------------------------------------
 */

function buildNumericalSecondaryPopulation<
  T extends PriceMeterTransactionType
>({
  identity,
  observations,
  dimension
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]

  dimension:
    PriceMeterCrossDimensionalNumericalSecondaryDimension
}): PriceMeterCrossDimensionalPopulation<T> {

  const definitions =
    getPriceMeterCrossDimensionalSecondaryCohorts(
      dimension
    )


  const groups =
    new Map<
      string,
      PriceMeterObservation[]
    >(
      definitions.map(
        definition => [
          definition.key,
          []
        ]
      )
    )


  let excludedObservationCount =
    0


  for (
    const observation
    of observations
  ) {

    const exactValue =
      resolveNumericalSecondaryValue({
        observation,
        dimension
      })


    const cohort =
      resolvePriceMeterCrossDimensionalNumericalSecondaryCohort({
        dimension,
        exactValue
      })


    if (
      cohort ===
        null
    ) {
      excludedObservationCount +=
        1

      continue
    }


    const group =
      groups.get(
        cohort.key
      )


    if (
      !group
    ) {
      throw new Error(
        'Cross-Dimensional observation resolved to an unknown canonical secondary cohort.'
      )
    }


    group.push(
      observation
    )
  }


  const cohorts =
    definitions.map(
      definition => {

        const cohortObservations =
          groups.get(
            definition.key
          ) ?? []


        return {
          key:
            definition.key,

          label:
            definition.label,

          observations:
            cohortObservations,

          observationCount:
            cohortObservations.length
        }
      }
    )


  const populatedCohorts =
    cohorts.filter(
      cohort =>
        cohort.observationCount >
          0
    )


  const representedObservationCount =
    populatedCohorts.reduce(
      (
        total,
        cohort
      ) =>
        total +
        cohort.observationCount,
      0
    )


  if (
    representedObservationCount +
      excludedObservationCount !==
    observations.length
  ) {
    throw new Error(
      'Cross-Dimensional numerical population did not account for every bounded observation exactly once.'
    )
  }


  return {
    identity,

    cohorts,

    populatedCohorts,

    inputObservationCount:
      observations.length,

    representedObservationCount,

    excludedObservationCount
  }
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC SECONDARY POPULATION
 * ---------------------------------------------------------
 */

function buildGeographicSecondaryPopulation<
  T extends PriceMeterTransactionType
>({
  identity,
  observations,
  level
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]

  level:
    PriceMeterGeographyLevel
}): PriceMeterCrossDimensionalPopulation<T> {

  const groups =
    new Map<
      string,
      {
        label:
          string

        observations:
          PriceMeterObservation[]
      }
    >()


  let excludedObservationCount =
    0


  for (
    const observation
    of observations
  ) {

    const geography =
      resolveGeographicSecondaryIdentity({
        observation,
        level
      })


    if (
      geography ===
        null
    ) {
      excludedObservationCount +=
        1

      continue
    }


    const existing =
      groups.get(
        geography.key
      )


    if (
      existing
    ) {
      existing.observations.push(
        observation
      )

      continue
    }


    groups.set(
      geography.key,
      {
        label:
          geography.label,

        observations: [
          observation
        ]
      }
    )
  }


  const cohorts =
    [...groups.entries()]
      .map(
        ([
          key,
          group
        ]) => ({
          key,

          label:
            group.label,

          observations:
            group.observations,

          observationCount:
            group.observations.length
        })
      )
      .sort(
        (a, b) =>
          a.label.localeCompare(
            b.label
          ) ||
          a.key.localeCompare(
            b.key
          )
      )


  const representedObservationCount =
    cohorts.reduce(
      (
        total,
        cohort
      ) =>
        total +
        cohort.observationCount,
      0
    )


  if (
    representedObservationCount +
      excludedObservationCount !==
    observations.length
  ) {
    throw new Error(
      'Cross-Dimensional geographic population did not account for every bounded observation exactly once.'
    )
  }


  return {
    identity,

    cohorts,

    populatedCohorts:
      cohorts,

    inputObservationCount:
      observations.length,

    representedObservationCount,

    excludedObservationCount
  }
}


/*
 * ---------------------------------------------------------
 * CROSS-DIMENSIONAL POPULATION BUILDER
 * ---------------------------------------------------------
 *
 * Exactly one secondary dimension is processed.
 *
 * The caller supplies the already-bounded owning-phase
 * observations. This function performs no fetching and no
 * expansion into other Cross-Dimensional questions.
 */

export function buildPriceMeterCrossDimensionalPopulation<
  T extends PriceMeterTransactionType
>({
  identity,
  observations
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]
}): PriceMeterCrossDimensionalPopulation<T> {

  assertBoundedPopulationIdentity({
    identity,
    observations
  })


  if (
    identity.secondaryDimension ===
      'geography'
  ) {

    const level =
      identity
        .geography
        .comparisonLevel


    if (
      level ===
        null
    ) {
      throw new Error(
        'Cross-Dimensional geographic population requires a canonical geographic comparison level.'
      )
    }


    return buildGeographicSecondaryPopulation({
      identity,
      observations,
      level
    })
  }


  return buildNumericalSecondaryPopulation({
    identity,
    observations,

    dimension:
      identity.secondaryDimension
  })
}