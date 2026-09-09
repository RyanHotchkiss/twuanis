/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL RELATIONSHIP ANALYZER
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Reconstruct one authorized owning-phase analytical
 * question independently inside every population produced
 * by one selected secondary dimension.
 *
 * Hard grammar:
 *
 * One existing relationship
 * → one explicit analytical question
 * → one secondary dimension
 * → one bounded canonical population
 * → one analysis
 * → one evidence set
 *
 * Computational contract:
 *
 * Already-bounded canonical population
 * → one secondary partition
 * → owning-phase analysis inside each secondary cohort
 * → one Cross-Dimensional evidence set
 *
 * This layer DOES NOT:
 *
 * - fetch listings
 * - widen the bounded population
 * - execute multiple Phase 11 questions
 * - precompute alternative dimensions
 * - construct Phase 10 comparisons
 * - infer causality
 * - generate user-facing synthesis
 */

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import {
  buildPriceMeterDistribution
} from '@/lib/price-meter-distribution'

import {
  buildPriceMeterGeographicDistributions,
  type PriceMeterGeographicIdentity
} from '@/lib/price-meter-geographic-distribution'

import {
  buildPriceMeterGeographicStatistics
} from '@/lib/price-meter-geographic-statistics'

import {
  buildPriceMeterSizeRelationshipPopulation
} from '@/lib/price-meter-size-relationship-population'

import {
  buildPriceMeterSizeRelationshipResult
} from '@/lib/price-meter-size-relationship-math'

import {
  resolvePriceMeterConstructionLandIdentity,
  type PriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  buildPriceMeterConstructionLandPopulation
} from '@/lib/price-meter-construction-land-population'

import {
  buildPriceMeterConstructionLandStatistics
} from '@/lib/price-meter-construction-land-statistics'

import {
  buildPriceMeterConstructionLandLandRelationship,
  buildPriceMeterConstructionLandConstructionRelationship
} from '@/lib/price-meter-construction-land-relationship'

import type {
  PriceMeterCrossDimensionalIdentity
} from '@/lib/price-meter-cross-dimensional-identity'

import {
  buildPriceMeterCrossDimensionalPopulation,
  type PriceMeterCrossDimensionalPopulation,
  type PriceMeterCrossDimensionalPopulationCohort
} from '@/lib/price-meter-cross-dimensional-population'

import type {
  PriceMeterCrossDimensionalEvidence,
  PriceMeterCrossDimensionalEvidenceSet,
  PriceMeterCrossDimensionalGeographicCohortStatistic,
  PriceMeterCrossDimensionalGeographicEvidence,
  PriceMeterCrossDimensionalSizeEvidence,
  PriceMeterCrossDimensionalConstructionLandEvidence
} from '@/lib/price-meter-cross-dimensional-evidence'


/*
 * ---------------------------------------------------------
 * CANONICAL GEOGRAPHIC KEY
 * ---------------------------------------------------------
 *
 * This key matches the existing Phase 7 geographic
 * identity contract:
 *
 * Province:
 *   province:{id}
 *
 * Canton:
 *   province:{id}|canton:{id}
 *
 * District:
 *   province:{id}|canton:{id}|district:{id}
 */

function geographicIdentityKey(
  geography:
    PriceMeterGeographicIdentity
): string | null {

  if (
    geography.district
  ) {
    if (
      !geography.province ||
      !geography.canton
    ) {
      return null
    }

    return (
      `province:${geography.province.id}` +
      `|canton:${geography.canton.id}` +
      `|district:${geography.district.id}`
    )
  }


  if (
    geography.canton
  ) {
    if (
      !geography.province
    ) {
      return null
    }

    return (
      `province:${geography.province.id}` +
      `|canton:${geography.canton.id}`
    )
  }


  if (
    geography.province
  ) {
    return (
      `province:${geography.province.id}`
    )
  }


  return null
}


function geographicIdentityLabel(
  geography:
    PriceMeterGeographicIdentity
): string {

  const term =
    geography.district ??
    geography.canton ??
    geography.province


  return (
    term?.term_name_en ??
    term?.term_name ??
    term?.term_name_es ??
    'Unknown geography'
  )
}


/*
 * ---------------------------------------------------------
 * ANALYTICAL COHORT RECONSTRUCTION
 * ---------------------------------------------------------
 *
 * Phase 11 receives an already-bounded canonical cohort.
 *
 * Each secondary population therefore inherits exactly the
 * same transaction, property-basis, and normalization
 * identity.
 */

function buildSecondaryAnalyticalCohort<
  T extends PriceMeterTransactionType
>({
  identity,
  observations
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]
}): PriceMeterAnalyticalCohort<T> {

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
      'Cross-Dimensional secondary cohort violates the bounded analytical identity.'
    )
  }


  return {
    transactionType:
      identity.transactionType,

    propertyBasis:
      identity.propertyBasis,

    normalizationBasis:
      identity.normalizationBasis,

    observations
  }
}


/*
 * ---------------------------------------------------------
 * PHASE 7 — GEOGRAPHIC EVIDENCE
 * ---------------------------------------------------------
 *
 * Reconstruct the canonical Phase 7 question independently
 * inside one secondary cohort.
 */

function buildGeographicEvidence<
  T extends PriceMeterTransactionType
>({
  identity,
  cohort
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  cohort:
    PriceMeterCrossDimensionalPopulationCohort
}): PriceMeterCrossDimensionalGeographicEvidence {

  const comparisonLevel =
    identity
      .geography
      .comparisonLevel


  if (
    comparisonLevel ===
      null
  ) {
    throw new Error(
      'Cross-Dimensional geographic analysis requires a canonical comparison level.'
    )
  }


  /*
   * The selected-market distribution is calculated from
   * exactly this secondary population.
   */

  const selectedMarketDistribution =
    buildPriceMeterDistribution({
      transactionType:
        identity.transactionType,

      observations:
        cohort.observations
    })


  /*
   * Reconstruct Phase 7 geographic distributions inside
   * this secondary population and consume only the
   * comparison level authorized by the canonical scope.
   */

  const geographicDistributions =
    buildPriceMeterGeographicDistributions({
      observations:
        cohort.observations,

      transactionType:
        identity.transactionType
    })


  const comparisonDistributions =
    geographicDistributions[
      comparisonLevel
    ]


  const statistics =
    buildPriceMeterGeographicStatistics({
      selectedMarketDistribution,
      geographicDistributions:
        comparisonDistributions,
      comparisonLevel
    })


  const geographicStatistics:
    PriceMeterCrossDimensionalGeographicCohortStatistic[] =
    statistics.map(
      statistic => {

        const geographyKey =
          geographicIdentityKey(
            statistic.geography
          )


        if (
          geographyKey ===
            null
        ) {
          throw new Error(
            'Cross-Dimensional geographic statistic is missing canonical geographic identity.'
          )
        }


        return {
          geographyKey,

          geographyLabel:
            geographicIdentityLabel(
              statistic.geography
            ),

          rank:
            statistic.rank,

          sampleSize:
            statistic
              .distribution
              .sampleSize,

          medianPricePerM2:
            statistic
              .distribution
              .median,

          medianDifferenceFromSelectedMarket:
            statistic
              .medianDifferenceFromSelectedMarket,

          medianPercentAboveOrBelowSelectedMarket:
            statistic
              .medianPercentAboveOrBelowSelectedMarket
        }
      }
    )


  /*
   * A geographic relationship requires:
   *
   * - a selected-market median
   * - at least two comparison geographies with calculable
   *   medians
   *
   * This introduces no qualitative sufficiency label.
   */

    const comparisonGeographyCount =
    geographicStatistics.filter(
      statistic =>
        statistic
          .medianPricePerM2 !==
        null
    ).length


  const requiredComparisonGeographyCount =
    2 as const


  const established =
    selectedMarketDistribution
      .median !==
      null &&
    comparisonGeographyCount >=
      requiredComparisonGeographyCount


  return {
    secondaryCohortKey:
      cohort.key,

    secondaryCohortLabel:
      cohort.label,

    kind:
      'geographic',

    representedObservationCount:
      cohort.observationCount,

    status:
      established
        ? 'established'
        : 'not_established',

    selectedMarketSampleSize:
      selectedMarketDistribution
        .sampleSize,

    selectedMarketMedianPricePerM2:
      selectedMarketDistribution
        .median,

    comparisonGeographyCount,

    requiredComparisonGeographyCount,

    geographicStatistics
  }
}


/*
 * ---------------------------------------------------------
 * PHASE 8 — SIZE-RELATIONSHIP EVIDENCE
 * ---------------------------------------------------------
 */

function buildSizeEvidence<
  T extends PriceMeterTransactionType
>({
  identity,
  cohort
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  cohort:
    PriceMeterCrossDimensionalPopulationCohort
}): PriceMeterCrossDimensionalSizeEvidence {

  if (
    identity.primaryRelationship !==
      'property_area_to_land_normalized_ratio' &&
    identity.primaryRelationship !==
      'construction_area_to_construction_normalized_ratio'
  ) {
    throw new Error(
      'Cross-Dimensional size analysis received a non-size primary relationship.'
    )
  }


  const analyticalCohort =
    buildSecondaryAnalyticalCohort({
      identity,
      observations:
        cohort.observations
    })


  const population =
    buildPriceMeterSizeRelationshipPopulation({
      cohort:
        analyticalCohort,

      relationshipKind:
        identity.primaryRelationship
    })


  const relationship =
    buildPriceMeterSizeRelationshipResult({
      coordinates:
        population.coordinates,

      representedObservationCount:
        population
          .representedObservationCount
    })


  /*
   * Phase 8 requires three populated canonical bands.
   */

  const requiredPopulatedBandCount =
    3


  const hasRequiredPopulatedBands =
    relationship
      .evidence
      .hasSufficientBandEvidence


  /*
   * Pairings whose secondary dimension is
   * Construction-to-Land require the explicit Phase 11
   * mathematical-coupling restriction.
   *
   * Spearman remains descriptive and is retained.
   *
   * Regression, beta, modeled 10% change, and R² are
   * withheld because the secondary population itself is
   * defined using one of the variables participating in
   * the modeled relationship.
   */

  const modeledStatisticsWithheld =
    identity
      .mathematicalAuthorization ===
      'explicit_coupling_validation_required'


  const regression =
    modeledStatisticsWithheld
      ? null
      : relationship.regression


  const modeledStatisticsWithheldReason =
    modeledStatisticsWithheld
      ? identity
          .primaryRelationship ===
          'property_area_to_land_normalized_ratio'
        ? 'property_area_construction_to_land_coupling'
        : 'construction_area_construction_to_land_coupling'
      : null


  return {
    secondaryCohortKey:
      cohort.key,

    secondaryCohortLabel:
      cohort.label,

    kind:
      'size_relationship',

    relationshipKind:
      identity.primaryRelationship,

    representedObservationCount:
      relationship
        .evidence
        .representedObservationCount,

    populatedBandCount:
      relationship
        .evidence
        .populatedBandCount,

    requiredPopulatedBandCount,

    hasRequiredPopulatedBands,

    coordinates:
      population
        .populatedBands
        .map(
          band => ({
            areaM2:
              band.medianExactArea as number,

            normalizedPricePerM2:
              band.medianNormalizedRatio as number,

            observationCount:
              band.observationCount
          })
        ),

    spearmanRho:
      relationship.spearmanRho,

    logLogSlope:
      regression?.beta ??
      null,

    modeledTenPercentAreaChangePercent:
      regression
        ?.modeledTenPercentAreaChange ??
      null,

    rSquared:
      regression?.rSquared ??
      null,

    modeledStatisticsAuthorization:
      modeledStatisticsWithheld
        ? 'withheld_mathematical_coupling'
        : 'authorized',

    modeledStatisticsWithheldReason,

    status:
      hasRequiredPopulatedBands
        ? 'established'
        : 'not_established'
  }
}


/*
 * ---------------------------------------------------------
 * PHASE 9 — CONSTRUCTION-TO-LAND EVIDENCE
 * ---------------------------------------------------------
 */

function buildConstructionLandEvidence<
  T extends PriceMeterTransactionType
>({
  identity,
  cohort
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  cohort:
    PriceMeterCrossDimensionalPopulationCohort
}): PriceMeterCrossDimensionalConstructionLandEvidence {

  /*
   * Phase 9 owns a stricter canonical identity than an
   * ordinary PriceMeterObservation.
   *
   * Resolve every observation through that canonical
   * identity boundary again inside the secondary cohort.
   */

  const constructionLandIdentities:
    PriceMeterConstructionLandIdentity[] =
    cohort
      .observations
      .map(
        observation =>
          resolvePriceMeterConstructionLandIdentity(
            observation
              .analyticalIdentity
          )
      )
      .filter(
        (
          constructionLandIdentity
        ): constructionLandIdentity is PriceMeterConstructionLandIdentity =>
          constructionLandIdentity !==
            null
      )


  /*
   * The owning Phase 9 question must not silently admit a
   * different canonical population inside Phase 11.
   */

  if (
    constructionLandIdentities.length !==
      cohort.observationCount
  ) {
    throw new Error(
      'Cross-Dimensional Phase 9 cohort contains observations outside the canonical Construction-to-Land identity.'
    )
  }

    const population =
    buildPriceMeterConstructionLandPopulation({
      observations:
        constructionLandIdentities,

      transactionType:
        identity.transactionType
    })


  const statistics =
    buildPriceMeterConstructionLandStatistics(
      population
    )


    /*
   * Phase 9 exposes two analytically distinct relationship
   * builders.
   *
   * The bounded Phase 11 normalization identity determines
   * which canonical relationship is reconstructed.
   */

  const phase9Relationship =
    identity.normalizationBasis ===
      'land'
      ? buildPriceMeterConstructionLandLandRelationship(
          statistics
        )
      : buildPriceMeterConstructionLandConstructionRelationship(
          statistics
        )


  const hasRequiredPopulatedCohorts =
    phase9Relationship
      .evidence
      .hasSufficientCohortEvidence


  const hasRequiredObservations =
    phase9Relationship
      .evidence
      .hasSufficientObservationEvidence


  const hasRequiredEvidence =
    phase9Relationship
      .evidence
      .hasSufficientEvidence


  return {
    secondaryCohortKey:
      cohort.key,

    secondaryCohortLabel:
      cohort.label,

    kind:
      'construction_to_land_relationship',

    normalizationBasis:
      identity.normalizationBasis,

    representedObservationCount:
      phase9Relationship
        .evidence
        .representedObservationCount,

    populatedCohortCount:
      phase9Relationship
        .evidence
        .populatedCohortCount,

    requiredPopulatedCohortCount:
      phase9Relationship
        .evidence
        .requiredPopulatedCohortCount,

    requiredObservationCount:
      phase9Relationship
        .evidence
        .requiredObservationCount,

    hasRequiredPopulatedCohorts,

    hasRequiredObservations,

    coordinates:
      phase9Relationship
        .coordinates
        .map(
          coordinate => ({
            constructionToLandRatio:
              coordinate
                .constructionToLandRatio,

            normalizedPricePerM2:
              coordinate
                .normalizedPricePerM2,

            observationCount:
              coordinate
                .observationCount
          })
        ),

    spearmanRho:
      phase9Relationship
        .spearmanRho,

    regression:
      null,

    rSquared:
      null,

    modeledTenPercentChangePercent:
      null,

    regressionWithheldReason:
      phase9Relationship
        .regressionWithheldReason,

    status:
      hasRequiredEvidence
        ? 'established'
        : 'not_established'
  }
}


/*
 * ---------------------------------------------------------
 * ONE SECONDARY COHORT → ONE OWNING-PHASE QUESTION
 * ---------------------------------------------------------
 */

function analyzeSecondaryCohort<
  T extends PriceMeterTransactionType
>({
  identity,
  cohort
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  cohort:
    PriceMeterCrossDimensionalPopulationCohort
}): PriceMeterCrossDimensionalEvidence {

  if (
    identity.owningPhase ===
      'phase_7_geography'
  ) {
    return buildGeographicEvidence({
      identity,
      cohort
    })
  }


  if (
    identity.owningPhase ===
      'phase_8_property_area' ||
    identity.owningPhase ===
      'phase_8_construction_area'
  ) {
    return buildSizeEvidence({
      identity,
      cohort
    })
  }


  if (
    identity.owningPhase ===
      'phase_9_construction_to_land'
  ) {
    return buildConstructionLandEvidence({
      identity,
      cohort
    })
  }


  throw new Error(
    'Unsupported Cross-Dimensional owning phase.'
  )
}


/*
 * ---------------------------------------------------------
 * EVIDENCE SET
 * ---------------------------------------------------------
 */

function buildEvidenceSet<
  T extends PriceMeterTransactionType
>({
  population,
  evidence
}: {
  population:
    PriceMeterCrossDimensionalPopulation<T>

  evidence:
    PriceMeterCrossDimensionalEvidence[]
}): PriceMeterCrossDimensionalEvidenceSet {

  const establishedSecondaryCohortCount =
    evidence.filter(
      item =>
        item.status ===
          'established'
    ).length


  const nonEstablishedSecondaryCohortCount =
    evidence.filter(
      item =>
        item.status ===
          'not_established'
    ).length


  return {
    questionKey:
      population
        .identity
        .questionKey,

    inputObservationCount:
      population
        .inputObservationCount,

    representedObservationCount:
      population
        .representedObservationCount,

    excludedObservationCount:
      population
        .excludedObservationCount,

    secondaryCohortCount:
      population
        .cohorts
        .length,

    populatedSecondaryCohortCount:
      population
        .populatedCohorts
        .length,

    establishedSecondaryCohortCount,

    nonEstablishedSecondaryCohortCount,

    evidence
  }
}


/*
 * ---------------------------------------------------------
 * COMPLETE CROSS-DIMENSIONAL ANALYSIS
 * ---------------------------------------------------------
 *
 * This is the single public Step 10 entry point.
 *
 * One call:
 *
 * 1. receives one already-bounded population
 * 2. partitions it by one selected secondary dimension
 * 3. reconstructs the owning-phase question independently
 *    inside each populated secondary cohort
 * 4. returns one evidence set
 *
 * No other Phase 11 question is evaluated.
 */

export function analyzePriceMeterCrossDimensionalRelationship<
  T extends PriceMeterTransactionType
>({
  identity,
  observations
}: {
  identity:
    PriceMeterCrossDimensionalIdentity<T>

  observations:
    PriceMeterObservation[]
}): PriceMeterCrossDimensionalEvidenceSet {

  const population =
    buildPriceMeterCrossDimensionalPopulation({
      identity,
      observations
    })


  const evidence =
    population
      .populatedCohorts
      .map(
        cohort =>
          analyzeSecondaryCohort({
            identity,
            cohort
          })
      )


  return buildEvidenceSet({
    population,
    evidence
  })
}