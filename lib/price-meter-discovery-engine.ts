/*
 * ---------------------------------------------------------
 * COMPARATIVE PRICE / M² DISCOVERY ENGINE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Execute the canonical analytical sequence for
 * Comparative Price / m² Discovery after observations and
 * positive ontology memberships have already been supplied.
 *
 * This engine:
 *
 * 1. validates the Discovery request
 * 2. resolves Canton and District analytical populations
 * 3. builds one independent Price / m² distribution for
 *    each geography
 * 4. applies the same user-selected criterion against each
 *    geography's own distribution boundary
 * 5. preserves the analytical population count
 * 6. preserves the criterion-qualifying count
 * 7. preserves the exact numerical boundary used
 *
 * ---------------------------------------------------------
 * GEOGRAPHIC SOVEREIGNTY
 * ---------------------------------------------------------
 *
 * District results are calculated against the District
 * distribution.
 *
 * Canton results are calculated against the Canton
 * distribution.
 *
 * The same observation may therefore qualify in one
 * geography and not qualify in the other.
 *
 * No geography is substituted, relaxed or discarded based
 * on population size.
 *
 * ---------------------------------------------------------
 * COUNT BOUNDARY
 * ---------------------------------------------------------
 *
 * This engine owns the first two Comparative Discovery
 * counts:
 *
 * comparisonPopulationCount
 * criterionQualifyingCount
 *
 * It DOES NOT own:
 *
 * displayedMatchingCount
 *
 * That third count belongs downstream after ordinary
 * Intelligence Hub view filters have been applied to the
 * already-qualified observations.
 *
 * ---------------------------------------------------------
 * CRITICAL BOUNDARY
 * ---------------------------------------------------------
 *
 * Ordinary Intelligence Hub filters never enter this
 * engine.
 *
 * Bedrooms, bathrooms, parking, year built, environment,
 * terrain, utilities, accessibility, legal status, asking
 * price and similar viewing preferences cannot alter:
 *
 * - analytical population identity
 * - Price / m² distribution
 * - distribution boundaries
 * - criterion qualification
 *
 * ---------------------------------------------------------
 * THIS LAYER DOES NOT
 * ---------------------------------------------------------
 *
 * - query Supabase
 * - discover listings
 * - load ontology membership
 * - build Price / m² observations
 * - calculate currency conversion
 * - reconstruct exact areas
 * - apply ordinary viewing filters
 * - calculate displayed-result counts
 * - automatically broaden geography
 * - impose a population ceiling
 * - truncate analytical populations
 * - classify bargains, deals or opportunities
 */


import {
  buildPriceMeterDistribution,
  type PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterOntologyMembership
} from '@/lib/price-meter-ontology-membership'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  qualifyPriceMeterDiscoveryObservations,
  resolvePriceMeterDiscoveryCriterionBoundary
} from '@/lib/price-meter-discovery-criterion'

import {
  buildPriceMeterDiscoveryPopulations,
  type PriceMeterDiscoveryPopulation
} from '@/lib/price-meter-discovery-population'

import {
  assertValidPriceMeterDiscoveryRequest,
  type PriceMeterDiscoveryComparisonDefinition,
  type PriceMeterDiscoveryCriterion,
  type PriceMeterDiscoveryRequest
} from '@/lib/price-meter-discovery-request'


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC ANALYTICAL RESULT
 * ---------------------------------------------------------
 *
 * One result represents one independent geographic Price /
 * m² evidence population.
 *
 * The complete canonical distribution is retained because
 * downstream server-side evidence and presentation may need
 * more than the selected criterion boundary.
 */


export type PriceMeterDiscoveryGeographicResult<
  T extends PriceMeterTransactionType
> = {
  geographyLevel:
    'district' | 'canton'

  geographyTermId:
    number

  transactionType:
    T

  criterion:
    PriceMeterDiscoveryCriterion

  comparisonPopulationCount:
    number

  criterionQualifyingCount:
    number

  criterionBoundaryValue:
    number | null

  distribution:
    PriceMeterDistribution<T>

  comparisonObservations:
    PriceMeterObservation[]

  qualifyingObservations:
    PriceMeterObservation[]

  qualifyingListingIds:
    string[]
}


/*
 * ---------------------------------------------------------
 * COMPLETE DISCOVERY RESULT
 * ---------------------------------------------------------
 */


export type PriceMeterDiscoveryResult<
  T extends PriceMeterTransactionType
> = {
  comparison:
    PriceMeterDiscoveryComparisonDefinition & {
      transactionType:
        T
    }

  criterion:
    PriceMeterDiscoveryCriterion

  district:
    PriceMeterDiscoveryGeographicResult<T>

  canton:
    PriceMeterDiscoveryGeographicResult<T>
}


/*
 * ---------------------------------------------------------
 * EMPTY POPULATION
 * ---------------------------------------------------------
 *
 * Empty populations are legitimate evidence states.
 *
 * They are not broadened automatically.
 *
 * The canonical distribution layer returns null numerical
 * boundaries for an empty population. Criterion
 * qualification therefore remains empty without attempting
 * to evaluate a nonexistent boundary.
 */


function buildEmptyDiscoveryGeographicResult<
  T extends PriceMeterTransactionType
>({
  population,
  criterion,
  distribution
}: {
  population:
    PriceMeterDiscoveryPopulation<T>

  criterion:
    PriceMeterDiscoveryCriterion

  distribution:
    PriceMeterDistribution<T>
}): PriceMeterDiscoveryGeographicResult<T> {

  return {
    geographyLevel:
      population.geographyLevel,

    geographyTermId:
      population.geographyTermId,

    transactionType:
      population.transactionType,

    criterion,

    comparisonPopulationCount:
      0,

    criterionQualifyingCount:
      0,

    criterionBoundaryValue:
      null,

    distribution,

    comparisonObservations:
      [],

    qualifyingObservations:
      [],

    qualifyingListingIds:
      []
  }
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC ANALYSIS
 * ---------------------------------------------------------
 *
 * One geography enters.
 *
 * One canonical distribution is built from that geography's
 * analytical population.
 *
 * The selected criterion is then evaluated against that
 * same distribution.
 */


function analyzePriceMeterDiscoveryGeography<
  T extends PriceMeterTransactionType
>({
  population,
  criterion
}: {
  population:
    PriceMeterDiscoveryPopulation<T>

  criterion:
    PriceMeterDiscoveryCriterion
}): PriceMeterDiscoveryGeographicResult<T> {

  /*
   * -------------------------------------------------------
   * CANONICAL DISTRIBUTION
   * -------------------------------------------------------
   *
   * PriceMeterDiscoveryPopulation deliberately carries the
   * same transaction identity + observations structure
   * required by the canonical distribution builder.
   */


  const distribution =
    buildPriceMeterDistribution({
      transactionType:
        population.transactionType,

      observations:
        population.observations
    })


  /*
   * -------------------------------------------------------
   * DISTRIBUTION / POPULATION INTEGRITY
   * -------------------------------------------------------
   *
   * The canonical numerical distribution filters invalid
   * numerical values defensively.
   *
   * Discovery populations should already contain canonical
   * valid Price / m² observations.
   *
   * If those counts ever diverge, upstream analytical
   * integrity has been violated and Discovery fails closed.
   */


  if (
    distribution.sampleSize !==
      population.sampleSize
  ) {
    throw new Error(
      `Comparative Price / m² Discovery ${population.geographyLevel} distribution sample size does not match its analytical population.`
    )
  }


  /*
   * -------------------------------------------------------
   * EMPTY POPULATION
   * -------------------------------------------------------
   */


  if (
    population.sampleSize ===
      0
  ) {
    return (
      buildEmptyDiscoveryGeographicResult({
        population,
        criterion,
        distribution
      })
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL CRITERION BOUNDARY
   * -------------------------------------------------------
   */


  const criterionBoundaryValue =
    resolvePriceMeterDiscoveryCriterionBoundary({
      criterion,
      distribution
    })


  /*
   * -------------------------------------------------------
   * CRITERION QUALIFICATION
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Population construction has already finished.
   *
   * The criterion cannot alter the distribution from which
   * its own boundary was calculated.
   */


  const qualifyingObservations =
    qualifyPriceMeterDiscoveryObservations({
      observations:
        population.observations,

      criterion,

      distribution
    })


  /*
   * -------------------------------------------------------
   * QUALIFICATION INTEGRITY
   * -------------------------------------------------------
   */


  if (
    qualifyingObservations.length >
      population.sampleSize
  ) {
    throw new Error(
      `Comparative Price / m² Discovery ${population.geographyLevel} qualifying population cannot exceed its analytical population.`
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL GEOGRAPHIC RESULT
   * -------------------------------------------------------
   */


  return {
    geographyLevel:
      population.geographyLevel,

    geographyTermId:
      population.geographyTermId,

    transactionType:
      population.transactionType,

    criterion,

    comparisonPopulationCount:
      population.sampleSize,

    criterionQualifyingCount:
      qualifyingObservations.length,

    criterionBoundaryValue,

    distribution,

    comparisonObservations:
      population.observations,

    qualifyingObservations,

    qualifyingListingIds:
        qualifyingObservations.map(
            observation => {

            if (
                observation.listingId ===
                null
            ) {
                throw new Error(
                'Comparative Price / m² Discovery qualifying observation is missing canonical listing identity.'
                )
            }


            return observation.listingId
            }
        )
  }
}


/*
 * ---------------------------------------------------------
 * DISCOVERY ENGINE
 * ---------------------------------------------------------
 */


export function runPriceMeterDiscovery<
  T extends PriceMeterTransactionType
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
}): PriceMeterDiscoveryResult<T> {

  /*
   * -------------------------------------------------------
   * REQUEST VALIDATION
   * -------------------------------------------------------
   */


  assertValidPriceMeterDiscoveryRequest(
    request
  )


  /*
   * -------------------------------------------------------
   * ANALYTICAL POPULATIONS
   * -------------------------------------------------------
   *
   * Population construction happens exactly once.
   *
   * Canton establishes the parent analytical population.
   * District is derived from that Canton population.
   */


  const populations =
    buildPriceMeterDiscoveryPopulations({
      request,
      observations,
      memberships
    })


  /*
   * -------------------------------------------------------
   * INDEPENDENT GEOGRAPHIC ANALYSIS
   * -------------------------------------------------------
   *
   * The SAME requested criterion is applied independently
   * against TWO different canonical distributions.
   */


  const district =
    analyzePriceMeterDiscoveryGeography({
      population:
        populations.district,

      criterion:
        request.criterion
    })


  const canton =
    analyzePriceMeterDiscoveryGeography({
      population:
        populations.canton,

      criterion:
        request.criterion
    })


  /*
   * -------------------------------------------------------
   * CROSS-GEOGRAPHY INTEGRITY
   * -------------------------------------------------------
   *
   * District is structurally contained within Canton at the
   * population layer.
   *
   * Criterion-qualified counts do NOT need to preserve that
   * same numerical relationship because District and Canton
   * use different distribution boundaries.
   *
   * Example:
   *
   * A listing may satisfy District <= P25 while failing
   * Canton <= P25.
   */


  if (
    district.comparisonPopulationCount >
      canton.comparisonPopulationCount
  ) {
    throw new Error(
      'Comparative Price / m² Discovery District analytical population cannot exceed the Canton analytical population.'
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL RESULT
   * -------------------------------------------------------
   */


  return {
    comparison:
      request.comparison,

    criterion:
      request.criterion,

    district,

    canton
  }
}