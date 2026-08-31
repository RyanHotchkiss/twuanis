/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND ANALYSIS
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Assemble the complete canonical Phase 9 analytical
 * pipeline for one explicit transaction universe.
 *
 * Pipeline:
 *
 * PriceMeterAnalyticalIdentity[]
 *   ↓
 * Construction-to-Land identities
 *   ↓
 * Construction-to-Land distribution
 *   ↓
 * Construction-to-Land cohort population
 *   ↓
 * Construction-to-Land cohort statistics
 *   ↓
 * Land-normalized relationship
 *   ↓
 * Construction-normalized relationship
 *
 * Sale and Rent are assembled independently.
 *
 * This layer DOES NOT:
 *
 * - infer physical Site Coverage
 * - perform presentation formatting
 * - generate user-facing synthesis
 * - calculate statistics inside UI components
 * - combine Sale and Rent
 */

import type {
  PriceMeterAnalyticalIdentity
} from '@/lib/price-meter-identity'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  resolvePriceMeterConstructionLandIdentity,
  type PriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  buildPriceMeterConstructionLandDistribution,
  type PriceMeterConstructionLandDistribution
} from '@/lib/price-meter-construction-land-distribution'

import {
  buildPriceMeterConstructionLandPopulation,
  type PriceMeterConstructionLandPopulation
} from '@/lib/price-meter-construction-land-population'

import {
  buildPriceMeterConstructionLandStatistics,
  type PriceMeterConstructionLandStatistics
} from '@/lib/price-meter-construction-land-statistics'

import {
  buildPriceMeterConstructionLandLandRelationship,
  buildPriceMeterConstructionLandConstructionRelationship,
  type PriceMeterConstructionLandLandRelationship,
  type PriceMeterConstructionLandConstructionRelationship
} from '@/lib/price-meter-construction-land-relationship'


export type PriceMeterConstructionLandAnalysis<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  identities:
    PriceMeterConstructionLandIdentity[]

  distribution:
    PriceMeterConstructionLandDistribution<T>

  population:
    PriceMeterConstructionLandPopulation<T>

  statistics:
    PriceMeterConstructionLandStatistics<T>

  relationships: {
    landNormalized:
      PriceMeterConstructionLandLandRelationship<T>

    constructionNormalized:
      PriceMeterConstructionLandConstructionRelationship<T>
  }

  representedObservationCount:
    number
}


export function buildPriceMeterConstructionLandAnalysis<
  T extends PriceMeterTransactionType
>({
  transactionType,
  analyticalIdentities
}: {
  transactionType:
    T

  analyticalIdentities:
    PriceMeterAnalyticalIdentity[]
}): PriceMeterConstructionLandAnalysis<T> {

  /*
   * -------------------------------------------------------
   * CANONICAL CONSTRUCTION-TO-LAND IDENTITIES
   * -------------------------------------------------------
   *
   * Resolve the Phase 9 identity from the already-canonical
   * Price / m² analytical identity.
   *
   * Ineligible properties fail closed in the resolver.
   *
   * The requested transaction universe is then selected
   * explicitly so Sale and Rent remain isolated.
   */

  const identities =
    analyticalIdentities
      .map(
        analyticalIdentity =>
          resolvePriceMeterConstructionLandIdentity(
            analyticalIdentity
          )
      )
      .filter(
        (
          identity
        ): identity is PriceMeterConstructionLandIdentity =>
          identity !==
            null &&
          identity.transactionType ===
            transactionType
      )


  /*
   * -------------------------------------------------------
   * EXACT RATIO DISTRIBUTION
   * -------------------------------------------------------
   */

  const distribution =
    buildPriceMeterConstructionLandDistribution({
      transactionType,

      observations:
        identities
    })


  /*
   * -------------------------------------------------------
   * CANONICAL COHORT POPULATION
   * -------------------------------------------------------
   */

  const population =
    buildPriceMeterConstructionLandPopulation({
      transactionType,

      observations:
        identities
    })


  /*
   * -------------------------------------------------------
   * COHORT PRICE / M² STATISTICS
   * -------------------------------------------------------
   *
   * The same canonical properties are evaluated through
   * both normalization lenses:
   *
   * - Land-normalized Price / m²
   * - Construction-normalized Price / m²
   */

  const statistics =
    buildPriceMeterConstructionLandStatistics(
      population
    )


  /*
   * -------------------------------------------------------
   * RELATIONSHIP EVIDENCE
   * -------------------------------------------------------
   *
   * These remain analytically distinct because each
   * normalization has a different mathematical coupling
   * with Construction-to-Land Ratio.
   */

  const landNormalizedRelationship =
    buildPriceMeterConstructionLandLandRelationship(
      statistics
    )


  const constructionNormalizedRelationship =
    buildPriceMeterConstructionLandConstructionRelationship(
      statistics
    )


  /*
   * -------------------------------------------------------
   * CROSS-LAYER REPRESENTATION INVARIANTS
   * -------------------------------------------------------
   *
   * Once a property resolves to a canonical Phase 9
   * identity, every descriptive analytical layer must
   * continue to represent it.
   */

  if (
    distribution.sampleSize !==
      identities.length
  ) {
    throw new Error(
      'Construction-to-Land distribution does not represent the complete canonical analysis population.'
    )
  }


  if (
    population
      .representedObservationCount !==
      identities.length
  ) {
    throw new Error(
      'Construction-to-Land cohort population does not represent the complete canonical analysis population.'
    )
  }


  if (
    statistics
      .representedObservationCount !==
      identities.length
  ) {
    throw new Error(
      'Construction-to-Land cohort statistics do not represent the complete canonical analysis population.'
    )
  }


  if (
    landNormalizedRelationship
      .evidence
      .representedObservationCount !==
      identities.length
  ) {
    throw new Error(
      'Construction-to-Land Land-normalized relationship does not represent the complete canonical analysis population.'
    )
  }


  if (
    constructionNormalizedRelationship
      .evidence
      .representedObservationCount !==
      identities.length
  ) {
    throw new Error(
      'Construction-to-Land Construction-normalized relationship does not represent the complete canonical analysis population.'
    )
  }


  return {
    transactionType,

    identities,

    distribution,

    population,

    statistics,

    relationships: {
      landNormalized:
        landNormalizedRelationship,

      constructionNormalized:
        constructionNormalizedRelationship
    },

    representedObservationCount:
      identities.length
  }
}