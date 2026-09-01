/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARISON ORCHESTRATOR
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Coordinate one Phase 10 Cohort A versus Cohort B
 * comparison inside one already-compatible Price / m²
 * analytical cohort.
 *
 * This layer:
 *
 * - receives one analytical cohort
 * - receives Cohort A and Cohort B definitions
 * - loads bounded positive ontology membership once
 * - resolves both comparison populations
 * - builds the numerical A/B comparison analysis
 *
 * This layer DOES NOT:
 *
 * - establish Transaction Type
 * - establish Property Basis
 * - establish Normalization Basis
 * - define cohort specificity rules
 * - query the entire ontology population
 * - calculate distributions directly
 * - calculate confidence directly
 * - attribute observed differences to characteristics
 */


import type {
  PriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterComparisonCohortDefinition
} from '@/lib/price-meter-comparison-cohort'

import {
  buildPriceMeterComparisonCohortPopulation
} from '@/lib/price-meter-comparison-cohort-population'

import {
  loadPriceMeterOntologyMemberships
} from '@/lib/price-meter-ontology-membership'

import {
  buildPriceMeterComparisonAnalysis,
  type PriceMeterComparisonAnalysis,
  type PriceMeterComparisonReferenceCohort
} from '@/lib/price-meter-comparison-analysis'

import type {
  PriceMeterConfidenceLanguage
} from '@/lib/price-meter-confidence'


export async function buildPriceMeterComparison<
  T extends PriceMeterTransactionType
>({
  analyticalCohort,
  cohortA,
  cohortB,
  referenceCohort,
  language
}: {
  analyticalCohort:
    PriceMeterAnalyticalCohort<T>

  cohortA:
    PriceMeterComparisonCohortDefinition

  cohortB:
    PriceMeterComparisonCohortDefinition

  referenceCohort:
    PriceMeterComparisonReferenceCohort

  language:
    PriceMeterConfidenceLanguage
}): Promise<
  PriceMeterComparisonAnalysis<T>
> {

  /*
   * -------------------------------------------------------
   * BOUNDED LISTING UNIVERSE
   * -------------------------------------------------------
   *
   * Phase 10 begins with observations already admitted to
   * one analytical universe.
   *
   * Ontology membership is therefore loaded only for
   * listing IDs represented inside that universe.
   */

  const listingIds =
    Array.from(
      new Set(
        analyticalCohort
          .observations
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
    )


  /*
   * One bounded membership query serves both Cohort A
   * and Cohort B.
   */

  const memberships =
    await loadPriceMeterOntologyMemberships(
      listingIds
    )


  /*
   * -------------------------------------------------------
   * USER-DEFINED POPULATIONS
   * -------------------------------------------------------
   *
   * Both populations are resolved against the SAME
   * analytical observation universe and the SAME bounded
   * ontology membership result.
   */

  const populationA =
    buildPriceMeterComparisonCohortPopulation({
      definition:
        cohortA,

      observations:
        analyticalCohort.observations,

      memberships
    })


  const populationB =
    buildPriceMeterComparisonCohortPopulation({
      definition:
        cohortB,

      observations:
        analyticalCohort.observations,

      memberships
    })


  /*
   * -------------------------------------------------------
   * NUMERICAL COMPARISON
   * -------------------------------------------------------
   */

  return buildPriceMeterComparisonAnalysis({
    transactionType:
      analyticalCohort.transactionType,

    cohortA:
      populationA,

    cohortB:
      populationB,

    referenceCohort,

    language
  })
}