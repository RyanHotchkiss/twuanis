import 'server-only'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import type {
  PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import type {
  PriceMeterComparableBaseCohort,
  PriceMeterComparableMembership
} from '@/lib/price-meter-comparable-base-cohort'

import {
  PRICE_METER_COMPARABLE_DIMENSION_ORDER,
  type PriceMeterComparableDimension
} from '@/lib/price-meter-comparable-dimensions'

import {
  buildPriceMeterComparablePopulationTrail,
  type PriceMeterComparablePopulationTrail
} from '@/lib/price-meter-comparable-population-trail'

import {
  resolvePriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  resolvePriceMeterConstructionLandCohort
} from '@/lib/price-meter-construction-land-cohorts'


export type PriceMeterComparableActiveDimension = {
  dimension:
    PriceMeterComparableDimension

  characteristic:
    PriceMeterCharacteristicIdentity | null

  constructionLandCohortKey:
    string | null
}


export type PriceMeterComparablePopulation = {
  subjectListingId:
    string

  subjectExcluded:
    true

  basePeerPopulationCount:
    number

  activeDimensions:
    PriceMeterComparableActiveDimension[]

  populationTrail:
    PriceMeterComparablePopulationTrail

  observations:
    PriceMeterObservation[]

  matchingListingIds:
    string[]

  sampleSize:
    number
}


function canonicalObservationKey(
  observation:
    PriceMeterObservation
): string {

  if (
    observation.listingId ===
      null
  ) {
    throw new Error(
      'Phase 12A peer population requires canonical listing identity.'
    )
  }


  return [
    observation.listingId,
    observation.transactionType,
    observation.propertyBasis,
    observation.normalizationBasis
  ].join('::')
}


function assertNoDuplicateCanonicalObservations(
  observations:
    PriceMeterObservation[]
): void {

  const keys =
    new Set<string>()


  for (
    const observation of
      observations
  ) {
    const key =
      canonicalObservationKey(
        observation
      )


    if (
      keys.has(
        key
      )
    ) {
      throw new Error(
        `Duplicate canonical Phase 12A analytical observation: ${key}.`
      )
    }


    keys.add(
      key
    )
  }
}


function getSubjectCharacteristic({
  subject,
  dimension
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  dimension:
    PriceMeterComparableDimension
}): PriceMeterCharacteristicIdentity | null {

  if (
    dimension ===
      'construction_land'
  ) {
    return null
  }


  const matches =
    subject.characteristics.filter(
      characteristic =>
        characteristic.termType ===
          dimension
    )


  if (
    matches.length >
      1
  ) {
    throw new Error(
      `Phase 12A subject contains multiple canonical ${dimension} identities.`
    )
  }


  return (
    matches[0] ??
    null
  )
}


function resolveActiveDimensions({
  subject,
  activeDimensions
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  activeDimensions:
    PriceMeterComparableDimension[]
}): PriceMeterComparableActiveDimension[] {

  const requested =
    new Set(
      activeDimensions
    )


  if (
    requested.size !==
      activeDimensions.length
  ) {
    throw new Error(
      'Phase 12A active dimensions contain duplicates.'
    )
  }


  const ordered =
    PRICE_METER_COMPARABLE_DIMENSION_ORDER
      .filter(
        dimension =>
          requested.has(
            dimension
          )
      )


  if (
    ordered.length !==
      activeDimensions.length
  ) {
    throw new Error(
      'Phase 12A active dimensions contain an unsupported dimension.'
    )
  }


  return ordered.map(
    dimension => {

      if (
        dimension ===
          'construction_land'
      ) {
        const identity =
          subject
            .positionIdentity
            .constructionToLandIdentity


        if (
          identity ===
            null
        ) {
          throw new Error(
            'Construction-to-Land cannot constrain this Phase 12A subject.'
          )
        }


        const cohort =
          resolvePriceMeterConstructionLandCohort(
            identity
              .constructionToLandRatio
          )


        if (
          cohort ===
            null
        ) {
          throw new Error(
            'Subject Construction-to-Land ratio does not resolve to a canonical cohort.'
          )
        }


        return {
          dimension,

          characteristic:
            null,

          constructionLandCohortKey:
            cohort.key
        }
      }


      const characteristic =
        getSubjectCharacteristic({
          subject,
          dimension
        })


      if (
        !characteristic
      ) {
        throw new Error(
          `Phase 12A cannot activate ${dimension} because the subject has no canonical value for that dimension.`
        )
      }


      return {
        dimension,

        characteristic,

        constructionLandCohortKey:
          null
      }
    }
  )
}


function matchesOntologyDimension({
  observation,
  activeDimension,
  membershipsByListingId
}: {
  observation:
    PriceMeterObservation

  activeDimension:
    PriceMeterComparableActiveDimension

  membershipsByListingId:
    Map<
      string,
      Set<number>
    >
}): boolean {

  if (
    observation.listingId ===
      null
  ) {
    return false
  }


  const requiredTermId =
    activeDimension
      .characteristic
      ?.ontologyTermId


  if (
    requiredTermId ===
      undefined
  ) {
    return false
  }


  return (
    membershipsByListingId
      .get(
        observation.listingId
      )
      ?.has(
        requiredTermId
      ) ??
    false
  )
}


function matchesConstructionLandDimension({
  observation,
  activeDimension
}: {
  observation:
    PriceMeterObservation

  activeDimension:
    PriceMeterComparableActiveDimension
}): boolean {

  const requiredCohortKey =
    activeDimension
      .constructionLandCohortKey


  if (
    requiredCohortKey ===
      null
  ) {
    return false
  }


  const identity =
    resolvePriceMeterConstructionLandIdentity(
      observation
        .analyticalIdentity
    )


  if (
    identity ===
      null
  ) {
    return false
  }


  const cohort =
    resolvePriceMeterConstructionLandCohort(
      identity
        .constructionToLandRatio
    )


  if (
    cohort ===
      null
  ) {
    return false
  }


  return (
    cohort.key ===
      requiredCohortKey
  )
}


export function buildPriceMeterComparablePopulation({
  subject,
  baseCohort,
  memberships,
  activeDimensions
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  baseCohort:
    PriceMeterComparableBaseCohort

  memberships:
    PriceMeterComparableMembership[]

  activeDimensions:
    PriceMeterComparableDimension[]
}): PriceMeterComparablePopulation {

  const subjectListingId =
    subject
      .positionIdentity
      .listingId


  /*
   * Duplicate analytical observations fail closed before
   * subject exclusion.
   */

  assertNoDuplicateCanonicalObservations(
    baseCohort.observations
  )


  /*
   * Phase 12A peer populations exclude the subject.
   */

  const subjectObservations =
    baseCohort
      .observations
      .filter(
        observation =>
          observation.listingId ===
            subjectListingId
      )


  if (
    subjectObservations.length >
      1
  ) {
    throw new Error(
      'Phase 12A found multiple subject observations inside the canonical base cohort.'
    )
  }


  const basePeerObservations =
    baseCohort
      .observations
      .filter(
        observation =>
          observation.listingId !==
            subjectListingId
      )


  if (
    basePeerObservations.some(
      observation =>
        observation.listingId ===
          subjectListingId
    )
  ) {
    throw new Error(
      'Phase 12A subject exclusion failed.'
    )
  }


  /*
   * Build one canonical ontology-membership lookup.
   */

  const membershipsByListingId =
    new Map<
      string,
      Set<number>
    >()


  for (
    const membership of
      memberships
  ) {
    if (
      membershipsByListingId.has(
        membership.listingId
      )
    ) {
      throw new Error(
        `Duplicate Phase 12A ontology membership record for listing ${membership.listingId}.`
      )
    }


    membershipsByListingId.set(
      membership.listingId,
      new Set(
        membership.ontologyTermIds
      )
    )
  }


  /*
   * The user selects dimensions.
   * The subject supplies their canonical values.
   */

  const resolvedActiveDimensions =
    resolveActiveDimensions({
      subject,
      activeDimensions
    })


  /*
   * Cumulative intersection.
   */

  let currentObservations =
    basePeerObservations


  const trailSteps:
    Array<{
      dimension:
        PriceMeterComparableDimension

      beforeCount:
        number

      afterCount:
        number
    }> =
      []


  for (
    const activeDimension of
      resolvedActiveDimensions
  ) {
    const beforeCount =
      currentObservations.length


    currentObservations =
      currentObservations.filter(
        observation => {

          if (
            activeDimension.dimension ===
              'construction_land'
          ) {
            return (
              matchesConstructionLandDimension({
                observation,
                activeDimension
              })
            )
          }


          return (
            matchesOntologyDimension({
              observation,
              activeDimension,
              membershipsByListingId
            })
          )
        }
      )


    trailSteps.push({
      dimension:
        activeDimension.dimension,

      beforeCount,

      afterCount:
        currentObservations.length
    })
  }


  /*
   * Final population integrity.
   */

  assertNoDuplicateCanonicalObservations(
    currentObservations
  )


  if (
    currentObservations.some(
      observation =>
        observation.listingId ===
          subjectListingId
    )
  ) {
    throw new Error(
      'Phase 12A final peer population contains the subject listing.'
    )
  }


  const matchingListingIds =
    currentObservations.map(
      observation => {

        if (
          observation.listingId ===
            null
        ) {
          throw new Error(
            'Phase 12A final peer population contains an unidentified listing.'
          )
        }


        return observation.listingId
      }
    )


  if (
    new Set(
      matchingListingIds
    ).size !==
      matchingListingIds.length
  ) {
    throw new Error(
      'Phase 12A final peer population contains duplicate listing identities.'
    )
  }


  const populationTrail =
    buildPriceMeterComparablePopulationTrail({
      basePopulationCount:
        basePeerObservations.length,

      steps:
        trailSteps
    })


  if (
    populationTrail.finalPopulationCount !==
      currentObservations.length
  ) {
    throw new Error(
      'Phase 12A population trail does not match final peer population.'
    )
  }


  return {
    subjectListingId,

    subjectExcluded:
      true,

    basePeerPopulationCount:
      basePeerObservations.length,

    activeDimensions:
      resolvedActiveDimensions,

    populationTrail,

    observations:
      currentObservations,

    matchingListingIds,

    sampleSize:
      currentObservations.length
  }
}