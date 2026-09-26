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

import { resolveStructuralComparableDimensions, matchesStructuralComparableDimension, intersectStructuralComparables } from './structural-comparable-population'


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
    resolveStructuralComparableDimensions({
      subject: { characteristics: subject.characteristics, constructionToLandIdentity: subject.positionIdentity.constructionToLandIdentity },
      activeDimensions
    })


  /*
   * Cumulative intersection.
   */

  const intersection = intersectStructuralComparables({
    rows: basePeerObservations,
    subjectId: subjectListingId,
    listingId: observation => observation.listingId!,
    dimensions: resolvedActiveDimensions,
    matches: (observation, activeDimension) => {
      const ratio = activeDimension.dimension === 'construction_land'
        ? resolvePriceMeterConstructionLandIdentity(observation.analyticalIdentity)?.constructionToLandRatio ?? null
        : null
      return matchesStructuralComparableDimension(
        membershipsByListingId.get(observation.listingId!), ratio, activeDimension
      )
    }
  })
  const currentObservations = intersection.rows
  const trailSteps = intersection.steps


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