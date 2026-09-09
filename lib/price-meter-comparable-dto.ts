import 'server-only'

import type {
  PriceMeterComparableEngineResult
} from '@/lib/price-meter-comparable-engine'

import type {
  PriceMeterComparableBrowserEvidence,
  PriceMeterComparableBrowserPopulationTrail
} from '@/lib/price-meter-comparable-browser-contract'


/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE DTO
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * Serialization firewall between Crown Jewel analytical
 * machinery and browser code.
 *
 * REQUEST FIRST.
 * AUTHORIZE SECOND.
 * RETURN MINIMUM THIRD.
 *
 * Crown Jewel analytical machinery is server-only.
 * It must never use or enter a "use client" import graph.
 *
 * Browser code receives authorized minimum evidence only.
 *
 * It MUST NOT receive:
 *
 * - raw peer observations
 * - matching listing IDs
 * - ontology term IDs
 * - canonical geography internals
 * - geography resolution reasons
 * - internal cohort objects
 * - internal subject identity objects
 * - nested Construction-to-Land identities
 * - FX identities
 * - price-integrity identities
 * - proprietary analytical machinery
 */


function mapPopulationTrail(
  analysis:
    PriceMeterComparableEngineResult
): PriceMeterComparableBrowserPopulationTrail {

  return {
    basePopulationCount:
      analysis
        .population
        .populationTrail
        .basePopulationCount,

    steps:
      analysis
        .population
        .populationTrail
        .steps
        .map(
          step => ({
            dimension:
              step.dimension,

            beforeCount:
              step.beforeCount,

            afterCount:
              step.afterCount,

            removedCount:
              step.removedCount
          })
        ),

    finalPopulationCount:
      analysis
        .population
        .populationTrail
        .finalPopulationCount
  }
}


export function toPriceMeterComparableEvidenceDTO(
  analysis:
    PriceMeterComparableEngineResult
): PriceMeterComparableBrowserEvidence {

  const subjectPosition =
    analysis
      .subject
      .positionIdentity


  const common = {
    listingId:
      subjectPosition.listingId,

    transactionType:
      subjectPosition.transactionType,

    propertyBasis:
      subjectPosition.propertyBasis,

    normalizationBasis:
      subjectPosition.normalizationBasis,

    analyticalCurrency:
      subjectPosition.analyticalCurrency,

    activeDimensions:
      [...analysis.request.activeDimensions],

    propertyPricePerM2:
      subjectPosition.propertyPricePerM2,

    comparisonPopulationCount:
      analysis.population.sampleSize,

    subjectExcluded:
      true as const,

    populationTrail:
      mapPopulationTrail(
        analysis
      )
  }


  /*
   * Zero peers is itself evidence about the explicitly
   * selected population.
   *
   * No distribution, percentile, median, tail, confidence,
   * or C:L statistics are fabricated for an empty cohort.
   */

  if (
    analysis.evidence ===
      null
  ) {
    if (
      analysis.population.sampleSize !==
        0
    ) {
      throw new Error(
        'Phase 12A missing evidence for a non-empty comparable population.'
      )
    }


    return {
      ...common,

      status:
        'no_peers'
    }
  }


  const evidence =
    analysis.evidence


  if (
    evidence.comparisonPopulationCount !==
      analysis.population.sampleSize
  ) {
    throw new Error(
      'Phase 12A DTO evidence population count does not match the analytical population.'
    )
  }


  /*
   * Explicit reconstruction is intentional.
   *
   * Do NOT spread the complete internal evidence object.
   * Every browser-visible field must be authorized here.
   */

  return {
    ...common,

    status:
      'ok',

    confidence: {
      score:
        evidence.confidence.score
    },

    distribution: {
      minimum:
        evidence.distribution.minimum,

      p10:
        evidence.distribution.p10,

      p25:
        evidence.distribution.p25,

      median:
        evidence.distribution.median,

      p75:
        evidence.distribution.p75,

      p90:
        evidence.distribution.p90,

      maximum:
        evidence.distribution.maximum,

      iqr:
        evidence.distribution.iqr
    },

    percentile: {
      position:
        evidence.percentile.position,

      method:
        evidence.percentile.method,

      belowCount:
        evidence.percentile.belowCount,

      equalCount:
        evidence.percentile.equalCount,

      aboveCount:
        evidence.percentile.aboveCount
    },

    medianPosition: {
      difference:
        evidence.medianPosition.difference,

      percentDifference:
        evidence.medianPosition.percentDifference,

      percentageReference:
        evidence
          .medianPosition
          .percentageReference
    },

    distributionInterval:
      evidence.distributionInterval,

    tail:
      evidence.tail
        ? {
            propertyPricePerM2:
              evidence.tail.propertyPricePerM2,

            comparisonPopulationCount:
              evidence
                .tail
                .comparisonPopulationCount,

            percentilePosition:
              evidence.tail.percentilePosition,

            tail:
              evidence.tail.tail,

            thresholdPercentile:
              evidence.tail.thresholdPercentile,

            thresholdPricePerM2:
              evidence.tail.thresholdPricePerM2,

            differenceFromThreshold:
              evidence
                .tail
                .differenceFromThreshold,

            percentDifferenceFromThreshold:
              evidence
                .tail
                .percentDifferenceFromThreshold,

            percentageReference:
              evidence
                .tail
                .percentageReference
          }
        : null,

    constructionToLandContext:
      evidence.constructionToLandContext
        ? {
            propertyAreaM2:
              evidence
                .constructionToLandContext
                .propertyAreaM2,

            constructionAreaM2:
              evidence
                .constructionToLandContext
                .constructionAreaM2,

            constructionToLandRatio:
              evidence
                .constructionToLandContext
                .constructionToLandRatio
          }
        : null
  }
}