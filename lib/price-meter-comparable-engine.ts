import 'server-only'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import {
  validatePriceMeterComparableRequest,
  type PriceMeterComparableRequest
} from '@/lib/price-meter-comparable-request'

import {
  resolvePriceMeterComparableSubjectIdentity,
  type PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import {
  resolvePriceMeterComparableGeography
} from '@/lib/price-meter-comparable-geography'

import {
  buildPriceMeterComparableBaseCohort,
  type PriceMeterComparableBaseCohort,
  type PriceMeterComparableMembership
} from '@/lib/price-meter-comparable-base-cohort'

import {
  buildPriceMeterComparablePopulation,
  type PriceMeterComparablePopulation
} from '@/lib/price-meter-comparable-population'

import {
  buildPriceMeterComparableEvidence,
  type PriceMeterComparableEvidence
} from '@/lib/price-meter-comparable-evidence'


/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE COHORT ENGINE
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * Purpose:
 *
 * Execute one already-bounded comparable-cohort analytical
 * question for one identifiable subject property.
 *
 * The property supplies the values.
 * The user supplies the definition of comparability.
 * Twuanis supplies the evidence.
 *
 * Execution order:
 *
 *   request validation
 *   → subject identity
 *   → explicit geography
 *   → canonical base cohort
 *   → subject exclusion
 *   → cumulative optional-dimension intersection
 *   → subject-excluded Phase 12A evidence
 *
 * This engine DOES NOT:
 *
 * - load listings
 * - discover an unbounded market population
 * - query Supabase
 * - broaden geography
 * - expand area ranges
 * - relax selected dimensions
 * - use fuzzy matching
 * - use nearest-neighbor matching
 * - weight characteristics
 * - precompute combinations
 * - cache combinatorial populations
 * - prescribe a decision
 * - make valuation claims
 *
 * BOUND FIRST.
 * FETCH SECOND.
 * CALCULATE THIRD.
 */


export type PriceMeterComparableEngineInput = {
  request:
    PriceMeterComparableRequest

  subjectObservation:
    PriceMeterObservation

  subjectCharacteristics:
    PriceMeterCharacteristicIdentity[]

  subjectYearBuiltRange:
    unknown

  boundedObservations:
    PriceMeterObservation[]

  memberships:
    PriceMeterComparableMembership[]
}


export type PriceMeterComparableEngineResult = {
  request:
    PriceMeterComparableRequest

  subject:
    PriceMeterComparableSubjectIdentity

  baseCohort:
    PriceMeterComparableBaseCohort

  population:
    PriceMeterComparablePopulation

  evidence:
    PriceMeterComparableEvidence | null
}


function assertSubjectRequestIdentity({
  request,
  subjectObservation
}: {
  request:
    PriceMeterComparableRequest

  subjectObservation:
    PriceMeterObservation
}): void {

  if (
    subjectObservation.listingId ===
      null
  ) {
    throw new Error(
      'Phase 12A requires an identifiable subject observation.'
    )
  }


  if (
    subjectObservation.listingId !==
      request.subjectListingId
  ) {
    throw new Error(
      'Phase 12A request listing ID does not match the canonical subject observation.'
    )
  }
}


function assertBoundedObservationIdentity({
  subject,
  observations
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  observations:
    PriceMeterObservation[]
}): void {

  const subjectPosition =
    subject.positionIdentity


  for (
    const observation of
      observations
  ) {
    /*
     * The server loader may return observations that do not
     * survive geography, Property Type, or area constraints.
     *
     * Those constraints belong to the base-cohort layer.
     *
     * But observations entering this analytical execution
     * must remain inside the immutable analytical universe.
     */

    if (
      observation.transactionType !==
        subjectPosition.transactionType
    ) {
      throw new Error(
        'Phase 12A bounded observations contain a different Transaction Type.'
      )
    }


    if (
      observation.propertyBasis !==
        subjectPosition.propertyBasis
    ) {
      throw new Error(
        'Phase 12A bounded observations contain a different Property Basis.'
      )
    }


    if (
      observation.normalizationBasis !==
        subjectPosition.normalizationBasis
    ) {
      throw new Error(
        'Phase 12A bounded observations contain a different Normalization Basis.'
      )
    }


    if (
      !observation
        .analyticalIdentity
        .eligibility
        .eligible
    ) {
      throw new Error(
        'Phase 12A bounded observations contain an analytically ineligible observation.'
      )
    }
  }
}


function assertMembershipBoundary({
  observations,
  memberships
}: {
  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterComparableMembership[]
}): void {

  const boundedListingIds =
    new Set(
      observations
        .map(
          observation =>
            observation.listingId
        )
        .filter(
          (
            listingId
          ): listingId is string =>
            listingId !== null
        )
    )


  for (
    const membership of
      memberships
  ) {
    if (
      !boundedListingIds.has(
        membership.listingId
      )
    ) {
      throw new Error(
        `Phase 12A received ontology membership outside the bounded listing population: ${membership.listingId}.`
      )
    }
  }
}


export function runPriceMeterComparableEngine(
  input:
    PriceMeterComparableEngineInput
): PriceMeterComparableEngineResult {

  /*
   * -------------------------------------------------------
   * 1. REQUEST
   * -------------------------------------------------------
   */

  const request =
    validatePriceMeterComparableRequest(
      input.request
    )


  assertSubjectRequestIdentity({
    request,
    subjectObservation:
      input.subjectObservation
  })


  /*
   * -------------------------------------------------------
   * 2. SUBJECT IDENTITY
   * -------------------------------------------------------
   */

  const subject =
    resolvePriceMeterComparableSubjectIdentity({
      observation:
        input.subjectObservation,

      characteristics:
        input.subjectCharacteristics,

      yearBuiltRange:
        input.subjectYearBuiltRange
    })


  /*
   * -------------------------------------------------------
   * 3. EXPLICIT GEOGRAPHY
   * -------------------------------------------------------
   *
   * The request chooses the level.
   *
   * The subject's canonical geography supplies the actual
   * Province, Canton, or District identity.
   */

  const geography =
    resolvePriceMeterComparableGeography({
      observation:
        input.subjectObservation,

      level:
        request.geographyLevel
    })


  /*
   * -------------------------------------------------------
   * 4. BOUNDED INPUT INTEGRITY
   * -------------------------------------------------------
   *
   * This engine never performs broad market discovery.
   *
   * The caller must supply an already-bounded candidate
   * population inside the immutable analytical universe.
   */

  assertBoundedObservationIdentity({
    subject,

    observations:
      input.boundedObservations
  })


  assertMembershipBoundary({
    observations:
      input.boundedObservations,

    memberships:
      input.memberships
  })


  /*
   * -------------------------------------------------------
   * 5. BASE COMPARABLE COHORT
   * -------------------------------------------------------
   *
   * Geography
   * ∩ Property Type
   * ∩ Property Area Range
   * ∩ Construction Area Range when applicable
   */

  const baseCohort =
    buildPriceMeterComparableBaseCohort({
      subject,

      geography,

      observations:
        input.boundedObservations,

      memberships:
        input.memberships
    })


  /*
   * -------------------------------------------------------
   * 6. USER-DEFINED PEER POPULATION
   * -------------------------------------------------------
   *
   * Subject exclusion occurs here.
   *
   * Optional dimensions are applied cumulatively in the
   * canonical deterministic order.
   */

  const population =
    buildPriceMeterComparablePopulation({
      subject,

      baseCohort,

      memberships:
        input.memberships,

      activeDimensions:
        request.activeDimensions
    })


  /*
   * -------------------------------------------------------
   * 7. PHASE 12A EVIDENCE
   * -------------------------------------------------------
   *
   * The subject remains external to the peer distribution.
   */

  /*
   * -------------------------------------------------------
   * 7. POPULATION INTEGRITY
   * -------------------------------------------------------
   *
   * Zero peers is a valid analytical outcome.
   *
   * It means the explicitly defined comparable population
   * contains zero peer properties after subject exclusion
   * and cumulative optional-dimension intersection.
   *
   * Do not fabricate a distribution for that state.
   */

  if (
    population.subjectListingId !==
      request.subjectListingId
  ) {
    throw new Error(
      'Phase 12A analytical population does not preserve the requested subject listing identity.'
    )
  }


  if (
    population.populationTrail.finalPopulationCount !==
      population.sampleSize
  ) {
    throw new Error(
      'Phase 12A final population does not match its population trail.'
    )
  }


  if (
    population.sampleSize ===
      0
  ) {
    return {
      request,

      subject,

      baseCohort,

      population,

      evidence:
        null
    }
  }


  /*
   * -------------------------------------------------------
   * 8. PHASE 12A EVIDENCE
   * -------------------------------------------------------
   *
   * Distribution, percentile, median-position, interval,
   * tail, and confidence evidence require at least one
   * subject-excluded peer observation.
   */

  const evidence =
    buildPriceMeterComparableEvidence({
      subject,
      population
    })


  /*
   * -------------------------------------------------------
   * 9. FINAL EVIDENCE INTEGRITY
   * -------------------------------------------------------
   */

  if (
    evidence.listingId !==
      request.subjectListingId
  ) {
    throw new Error(
      'Phase 12A analytical evidence does not preserve the requested subject listing identity.'
    )
  }


  if (
    evidence.comparisonPopulationCount !==
      population.sampleSize
  ) {
    throw new Error(
      'Phase 12A evidence population count does not match the final comparable population.'
    )
  }


  return {
    request,

    subject,

    baseCohort,

    population,

    evidence
  }
}