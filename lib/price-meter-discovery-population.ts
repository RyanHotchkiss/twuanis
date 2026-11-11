/*
 * ---------------------------------------------------------
 * COMPARATIVE PRICE / M² DISCOVERY POPULATION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve one validated Comparative Price / m² Discovery
 * comparison definition against an already-canonical set
 * of Price / m² observations and positive ontology
 * memberships.
 *
 * This layer establishes two related analytical
 * populations:
 *
 * 1. Canton population
 * 2. District population
 *
 * Both populations use exactly the same non-geographic
 * analytical identity.
 *
 * The District population is a strict geographic subset
 * of the Canton population.
 *
 * ---------------------------------------------------------
 * ANALYTICAL IDENTITY
 * ---------------------------------------------------------
 *
 * Every admitted observation must satisfy:
 *
 * - Transaction Type
 * - Property Basis
 * - Normalization Basis
 * - canonical Property Type membership
 * - canonical Property Area cohort
 * - canonical Construction Area cohort when applicable
 * - selected Canton
 *
 * District additionally requires the selected District.
 *
 * ---------------------------------------------------------
 * CRITICAL BOUNDARY
 * ---------------------------------------------------------
 *
 * Ordinary Intelligence Hub filters do not participate in
 * population resolution.
 *
 * This module knows nothing about:
 *
 * - bedrooms
 * - bathrooms
 * - parking
 * - year built
 * - environment
 * - terrain
 * - utilities
 * - accessibility
 * - legal status
 * - asking price
 *
 * Those belong downstream after Price / m² criterion
 * qualification.
 *
 * ---------------------------------------------------------
 * THIS LAYER DOES NOT
 * ---------------------------------------------------------
 *
 * - query Supabase
 * - discover listings
 * - load ontology membership
 * - calculate Price / m²
 * - calculate distributions
 * - apply percentile criteria
 * - apply ordinary viewing filters
 * - broaden geography
 * - relax analytical requirements
 */


import {
  matchesConstructionAreaConstraint,
  matchesPropertyAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterOntologyMembership
} from '@/lib/price-meter-ontology-membership'

import type {
  PriceMeterTransactionCohort
} from '@/lib/price-meter-transaction-cohort'

import {
  assertValidPriceMeterDiscoveryRequest,
  type PriceMeterDiscoveryComparisonDefinition,
  type PriceMeterDiscoveryRequest
} from '@/lib/price-meter-discovery-request'


/*
 * ---------------------------------------------------------
 * POPULATION RESULT
 * ---------------------------------------------------------
 */


export type PriceMeterDiscoveryPopulation<
  T extends 'sale' | 'rent'
> = {
  geographyLevel:
    'district' | 'canton'

  geographyTermId:
    number

  transactionType:
    T

  observations:
    PriceMeterObservation[]

  matchingListingIds:
    string[]

  sampleSize:
    number
}


export type PriceMeterDiscoveryPopulations<
  T extends 'sale' | 'rent'
> = {
  canton:
    PriceMeterDiscoveryPopulation<T>

  district:
    PriceMeterDiscoveryPopulation<T>
}


/*
 * ---------------------------------------------------------
 * CANONICAL LISTING ID
 * ---------------------------------------------------------
 *
 * Comparative Discovery requires canonical listing identity
 * because Property Type membership is ontology-backed.
 *
 * Observations without listing IDs fail closed.
 */


function hasCanonicalListingId(
  observation:
    PriceMeterObservation
): observation is PriceMeterObservation & {
  listingId: string
} {

  return (
    typeof observation.listingId ===
      'string' &&
    observation.listingId.length >
      0
  )
}


/*
 * ---------------------------------------------------------
 * MEMBERSHIP INDEX
 * ---------------------------------------------------------
 *
 * Ontology membership is positive evidence only.
 *
 * Absence of Property Type membership never means the
 * listing possesses another Property Type.
 */


function buildOntologyMembershipIndex(
  memberships:
    PriceMeterOntologyMembership[]
): Map<
  string,
  Set<number>
> {

  const index =
    new Map<
      string,
      Set<number>
    >()


  for (
    const membership of
      memberships
  ) {

    index.set(
      membership.listingId,
      new Set(
        membership.ontologyTermIds
      )
    )
  }


  return index
}


/*
 * ---------------------------------------------------------
 * IMMUTABLE ANALYTICAL IDENTITY
 * ---------------------------------------------------------
 */


function matchesDiscoveryAnalyticalIdentity({
  observation,
  comparison,
  ontologyTermIds
}: {
  observation:
    PriceMeterObservation

  comparison:
    PriceMeterDiscoveryComparisonDefinition

  ontologyTermIds:
    Set<number>
}): boolean {

  /*
   * Transaction Type
   */

  if (
    observation.transactionType !==
      comparison.transactionType
  ) {
    return false
  }


  /*
   * Property Basis
   */

  if (
    observation.propertyBasis !==
      comparison.propertyBasis
  ) {
    return false
  }


  /*
   * Normalization Basis
   */

  if (
    observation.normalizationBasis !==
      comparison.normalizationBasis
  ) {
    return false
  }


  /*
   * Canonical Property Type
   *
   * Positive ontology membership is required.
   */

  if (
    !ontologyTermIds.has(
      comparison
        .propertyType
        .ontologyTermId
    )
  ) {
    return false
  }


  /*
   * Canonical Property Area cohort
   *
   * Membership derives from the exact canonical property
   * area stored in analytical identity.
   */

  if (
    !matchesPropertyAreaConstraint(
      observation
        .analyticalIdentity
        .propertyAreaM2,

      comparison.propertyAreaRange
    )
  ) {
    return false
  }


  /*
   * Canonical Construction Area cohort
   *
   * Land Only structurally has no Construction Area cohort.
   *
   * Improved Property requires one because the Discovery
   * request validator already establishes that invariant.
   */

  if (
    comparison.propertyBasis ===
      'improved_property'
  ) {

    if (
      !comparison.constructionAreaRange
    ) {
      return false
    }


    if (
      !matchesConstructionAreaConstraint(
        observation
          .analyticalIdentity
          .constructionAreaM2,

        comparison.constructionAreaRange
      )
    ) {
      return false
    }
  }


  return true
}


/*
 * ---------------------------------------------------------
 * CANTON GEOGRAPHY
 * ---------------------------------------------------------
 */


function matchesDiscoveryCanton(
  observation:
    PriceMeterObservation,

  comparison:
    PriceMeterDiscoveryComparisonDefinition
): boolean {

  return (
    observation
      .geography
      .province
      ?.id ===
        comparison.province.id &&
    observation
      .geography
      .canton
      ?.id ===
        comparison.canton.id
  )
}


/*
 * ---------------------------------------------------------
 * DISTRICT GEOGRAPHY
 * ---------------------------------------------------------
 *
 * District membership is evaluated only after Canton
 * population membership has already been established.
 *
 * This preserves:
 *
 * District ⊆ Canton
 */


function matchesDiscoveryDistrict(
  observation:
    PriceMeterObservation,

  comparison:
    PriceMeterDiscoveryComparisonDefinition
): boolean {

  return (
    observation
      .geography
      .district
      ?.id ===
        comparison.district.id
  )
}


/*
 * ---------------------------------------------------------
 * DUPLICATE OBSERVATION INTEGRITY
 * ---------------------------------------------------------
 *
 * For one Discovery analytical identity, one listing may
 * contribute at most one observation.
 *
 * A duplicate listing observation inside the resolved
 * population indicates upstream analytical corruption and
 * fails closed.
 */


function assertUniqueDiscoveryObservations(
  observations:
    PriceMeterObservation[],

  geographyLevel:
    'district' | 'canton'
): void {

  const seenListingIds =
    new Set<string>()


  for (
    const observation of
      observations
  ) {

    if (
      !hasCanonicalListingId(
        observation
      )
    ) {
      throw new Error(
        `Comparative Price / m² Discovery ${geographyLevel} population contains an observation without canonical listing identity.`
      )
    }


    if (
      seenListingIds.has(
        observation.listingId
      )
    ) {
      throw new Error(
        `Comparative Price / m² Discovery ${geographyLevel} population contains duplicate observation identity for listing ${observation.listingId}.`
      )
    }


    seenListingIds.add(
      observation.listingId
    )
  }
}


/*
 * ---------------------------------------------------------
 * DISTRICT ⊆ CANTON INTEGRITY
 * ---------------------------------------------------------
 */


function assertDistrictContainedInCanton({
  districtObservations,
  cantonObservations
}: {
  districtObservations:
    PriceMeterObservation[]

  cantonObservations:
    PriceMeterObservation[]
}): void {

  const cantonListingIds =
    new Set(
      cantonObservations
        .filter(
          hasCanonicalListingId
        )
        .map(
          observation =>
            observation.listingId
        )
    )


  for (
    const observation of
      districtObservations
  ) {

    if (
      !hasCanonicalListingId(
        observation
      )
    ) {
      throw new Error(
        'Comparative Price / m² Discovery District population contains an observation without canonical listing identity.'
      )
    }


    if (
      !cantonListingIds.has(
        observation.listingId
      )
    ) {
      throw new Error(
        `Comparative Price / m² Discovery District population contains listing ${observation.listingId} outside the Canton population.`
      )
    }
  }


  if (
    districtObservations.length >
      cantonObservations.length
  ) {
    throw new Error(
      'Comparative Price / m² Discovery District population cannot exceed the Canton population.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * TRANSACTION COHORT INTEGRITY
 * ---------------------------------------------------------
 *
 * Population output is deliberately compatible with the
 * canonical PriceMeterTransactionCohort shape used by the
 * distribution layer.
 */


function assertTransactionIntegrity<
  T extends 'sale' | 'rent'
>({
  transactionType,
  observations
}: PriceMeterTransactionCohort<T>): void {

  if (
    observations.some(
      observation =>
        observation.transactionType !==
          transactionType
    )
  ) {
    throw new Error(
      'Comparative Price / m² Discovery population contains mixed Sale/Rent observations.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * POPULATION BUILDER
 * ---------------------------------------------------------
 */


export function buildPriceMeterDiscoveryPopulations<
  T extends 'sale' | 'rent'
>({
  request,
  observations,
  memberships
}: {
  request:
    PriceMeterDiscoveryRequest & {
      comparison:
        PriceMeterDiscoveryComparisonDefinition & {
          transactionType:
            T
        }
    }

  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterOntologyMembership[]
}): PriceMeterDiscoveryPopulations<T> {

  /*
   * -------------------------------------------------------
   * REQUEST BOUNDARY
   * -------------------------------------------------------
   */

  assertValidPriceMeterDiscoveryRequest(
    request
  )


  const {
    comparison
  } = request


  /*
   * -------------------------------------------------------
   * POSITIVE ONTOLOGY MEMBERSHIP
   * -------------------------------------------------------
   */

  const ontologyMembershipIndex =
    buildOntologyMembershipIndex(
      memberships
    )


  /*
   * -------------------------------------------------------
   * CANTON POPULATION
   * -------------------------------------------------------
   *
   * Canton is resolved first.
   *
   * Every District observation is subsequently selected
   * from this already-compatible Canton population.
   */


  const cantonObservations =
    observations.filter(
      (
        observation
      ): observation is PriceMeterObservation & {
        listingId: string
      } => {

        if (
          !hasCanonicalListingId(
            observation
          )
        ) {
          return false
        }


        const ontologyTermIds =
          ontologyMembershipIndex.get(
            observation.listingId
          )


        if (
          !ontologyTermIds
        ) {
          return false
        }


        if (
          !matchesDiscoveryAnalyticalIdentity({
            observation,
            comparison,
            ontologyTermIds
          })
        ) {
          return false
        }


        if (
          !matchesDiscoveryCanton(
            observation,
            comparison
          )
        ) {
          return false
        }


        return true
      }
    )


  /*
   * -------------------------------------------------------
   * DISTRICT POPULATION
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * District is derived FROM the Canton analytical
   * population.
   *
   * It is not independently reconstructed from the original
   * observation universe.
   */


  const districtObservations =
    cantonObservations.filter(
      observation =>
        matchesDiscoveryDistrict(
          observation,
          comparison
        )
    )


  /*
   * -------------------------------------------------------
   * INTEGRITY ASSERTIONS
   * -------------------------------------------------------
   */


  assertUniqueDiscoveryObservations(
    cantonObservations,
    'canton'
  )


  assertUniqueDiscoveryObservations(
    districtObservations,
    'district'
  )


  assertDistrictContainedInCanton({
    districtObservations,
    cantonObservations
  })


  assertTransactionIntegrity({
    transactionType:
      comparison.transactionType,

    observations:
      cantonObservations
  })


  assertTransactionIntegrity({
    transactionType:
      comparison.transactionType,

    observations:
      districtObservations
  })


  /*
   * -------------------------------------------------------
   * CANONICAL OUTPUT
   * -------------------------------------------------------
   */


  return {
    canton: {
      geographyLevel:
        'canton',

      geographyTermId:
        comparison.canton.id,

      transactionType:
        comparison.transactionType,

      observations:
        cantonObservations,

      matchingListingIds:
        cantonObservations.map(
          observation =>
            observation.listingId
        ),

      sampleSize:
        cantonObservations.length
    },

    district: {
      geographyLevel:
        'district',

      geographyTermId:
        comparison.district.id,

      transactionType:
        comparison.transactionType,

      observations:
        districtObservations,

      matchingListingIds:
        districtObservations.map(
          observation =>
            observation.listingId
        ),

      sampleSize:
        districtObservations.length
    }
  }
}