import 'server-only'

import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import {
  buildPriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterPropertyPositionInterval
} from '@/lib/price-meter-property-position-interval'

import type {
  PriceMeterPropertyPositionTailResult
} from '@/lib/price-meter-property-position-tail'

import type {
  PriceMeterPropertyPositionConstructionLandContext
} from '@/lib/price-meter-property-position-construction-land'

import {
  buildPriceMeterPropertyPositionConstructionLandContext
} from '@/lib/price-meter-property-position-construction-land'

import {
  getPriceMeterConfidenceScore,
  type PriceMeterConfidenceScore
} from '@/lib/confidence'

import type {
  PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import type {
  PriceMeterComparablePopulation
} from '@/lib/price-meter-comparable-population'


export type PriceMeterComparablePercentile = {
  position:
    number

  method:
    'midrank'

  belowCount:
    number

  equalCount:
    number

  aboveCount:
    number
}


export type PriceMeterComparableMedianPosition = {
  difference:
    number

  percentDifference:
    number

  percentageReference:
    'selected_population_median'
}


export type PriceMeterComparableEvidence = {
  listingId:
    string

  transactionType:
    'sale' | 'rent'

  propertyBasis:
    'land_only' | 'improved_property'

  normalizationBasis:
    'land' | 'construction'

  geography:
    PriceMeterComparableSubjectIdentity[
      'positionIdentity'
    ]['geography']

  analyticalCurrency:
    PriceMeterComparableSubjectIdentity[
      'positionIdentity'
    ]['analyticalCurrency']

  propertyPricePerM2:
    number

  comparisonPopulationCount:
    number

  subjectExcluded:
    true

  confidence: {
    score:
      PriceMeterConfidenceScore
  }

  distribution: {
    minimum:
      number

    p10:
      number

    p25:
      number

    median:
      number

    p75:
      number

    p90:
      number

    maximum:
      number

    iqr:
      number
  }

  percentile:
    PriceMeterComparablePercentile

  medianPosition:
    PriceMeterComparableMedianPosition

  distributionInterval:
    PriceMeterPropertyPositionInterval

  tail:
    PriceMeterPropertyPositionTailResult | null

  constructionToLandContext:
    PriceMeterPropertyPositionConstructionLandContext | null

  populationTrail:
    PriceMeterComparablePopulation['populationTrail']

  matchingListingIds:
    string[]
}


function buildComparableDistribution({
  subject,
  population
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  population:
    PriceMeterComparablePopulation
}):
  PriceMeterDistribution<'sale'> |
  PriceMeterDistribution<'rent'> {

  const transactionType =
    subject
      .positionIdentity
      .transactionType


  if (
    population.observations.some(
      observation =>
        observation.transactionType !==
          transactionType
    )
  ) {
    throw new Error(
      'Phase 12A peer population contains mixed transaction identities.'
    )
  }


  if (
    transactionType ===
      'sale'
  ) {
    return (
      buildPriceMeterDistribution({
        transactionType:
          'sale',

        observations:
          population.observations
      })
    )
  }


  if (
    transactionType ===
      'rent'
  ) {
    return (
      buildPriceMeterDistribution({
        transactionType:
          'rent',

        observations:
          population.observations
      })
    )
  }


  throw new Error(
    'Phase 12A requires an explicit Sale or Rent transaction identity.'
  )
}


function buildComparablePercentile({
  subject,
  population
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  population:
    PriceMeterComparablePopulation
}): PriceMeterComparablePercentile {

  const subjectPricePerM2 =
    subject
      .positionIdentity
      .propertyPricePerM2


  const comparisonPopulationCount =
    population.sampleSize


  if (
    !Number.isFinite(
      subjectPricePerM2
    ) ||
    subjectPricePerM2 <=
      0
  ) {
    throw new Error(
      'Phase 12A percentile requires a positive canonical subject Price / m².'
    )
  }


  if (
    !Number.isInteger(
      comparisonPopulationCount
    ) ||
    comparisonPopulationCount <=
      0
  ) {
    throw new Error(
      'Phase 12A percentile requires a non-empty subject-excluded peer population.'
    )
  }


  let belowCount =
    0

  let equalCount =
    0

  let aboveCount =
    0


  for (
    const observation of
      population.observations
  ) {
    const peerPricePerM2 =
      observation.pricePerM2


    if (
      !Number.isFinite(
        peerPricePerM2
      ) ||
      peerPricePerM2 <=
        0
    ) {
      throw new Error(
        'Phase 12A peer population contains an invalid Price / m² observation.'
      )
    }


    if (
      peerPricePerM2 <
        subjectPricePerM2
    ) {
      belowCount +=
        1

      continue
    }


    if (
      peerPricePerM2 >
        subjectPricePerM2
    ) {
      aboveCount +=
        1

      continue
    }


    equalCount +=
      1
  }


  if (
    belowCount +
      equalCount +
      aboveCount !==
    comparisonPopulationCount
  ) {
    throw new Error(
      'Phase 12A percentile population accounting failed.'
    )
  }


  /*
   * Unlike Phase 12, equalCount may legitimately be zero.
   *
   * The subject is external to the Phase 12A peer population.
   */

  const position =
    (
      100 *
      (
        belowCount +
        0.5 *
        equalCount
      )
    ) /
    comparisonPopulationCount


  if (
    !Number.isFinite(
      position
    ) ||
    position < 0 ||
    position > 100
  ) {
    throw new Error(
      'Phase 12A percentile calculation produced an invalid result.'
    )
  }


  return {
    position,

    method:
      'midrank',

    belowCount,

    equalCount,

    aboveCount
  }
}


function resolveComparableInterval({
  propertyPricePerM2,
  distribution
}: {
  propertyPricePerM2:
    number

  distribution:
    PriceMeterDistribution<
      'sale' | 'rent'
    >
}): PriceMeterPropertyPositionInterval {

  const {
    p10,
    p25,
    median,
    p75,
    p90
  } =
    distribution


  if (
    p10 === null ||
    p25 === null ||
    median === null ||
    p75 === null ||
    p90 === null
  ) {
    throw new Error(
      'Phase 12A requires canonical peer distribution thresholds.'
    )
  }


  if (
    p10 > p25 ||
    p25 > median ||
    median > p75 ||
    p75 > p90
  ) {
    throw new Error(
      'Phase 12A peer distribution thresholds are not in canonical ascending order.'
    )
  }


  if (
    propertyPricePerM2 <
      p10
  ) {
    return 'below_p10'
  }


  if (
    propertyPricePerM2 <
      p25
  ) {
    return 'p10_to_p25'
  }


  if (
    propertyPricePerM2 <
      median
  ) {
    return 'p25_to_median'
  }


  if (
    propertyPricePerM2 ===
      median
  ) {
    return 'at_median'
  }


  if (
    propertyPricePerM2 <=
      p75
  ) {
    return 'median_to_p75'
  }


  if (
    propertyPricePerM2 <=
      p90
  ) {
    return 'p75_to_p90'
  }


  return 'above_p90'
}


function buildComparableTail({
  listingId,
  propertyPricePerM2,
  comparisonPopulationCount,
  percentilePosition,
  distribution,
  interval
}: {
  listingId:
    string

  propertyPricePerM2:
    number

  comparisonPopulationCount:
    number

  percentilePosition:
    number

  distribution:
    PriceMeterDistribution<
      'sale' | 'rent'
    >

  interval:
    PriceMeterPropertyPositionInterval
}): PriceMeterPropertyPositionTailResult | null {

  if (
    interval !==
      'below_p10' &&
    interval !==
      'above_p90'
  ) {
    return null
  }


  const thresholdPercentile:
    10 | 90 =
      interval ===
        'below_p10'
        ? 10
        : 90


  const thresholdPricePerM2 =
    thresholdPercentile ===
      10
      ? distribution.p10
      : distribution.p90


  if (
    thresholdPricePerM2 ===
      null ||
    !Number.isFinite(
      thresholdPricePerM2
    ) ||
    thresholdPricePerM2 <=
      0
  ) {
    throw new Error(
      'Phase 12A tail evidence requires a valid canonical peer threshold.'
    )
  }


  const differenceFromThreshold =
    propertyPricePerM2 -
    thresholdPricePerM2


  const percentDifferenceFromThreshold =
    (
      differenceFromThreshold /
      thresholdPricePerM2
    ) *
    100


  if (
    !Number.isFinite(
      differenceFromThreshold
    ) ||
    !Number.isFinite(
      percentDifferenceFromThreshold
    )
  ) {
    throw new Error(
      'Phase 12A tail calculation produced an invalid result.'
    )
  }


  return {
    listingId,

    propertyPricePerM2,

    comparisonPopulationCount,

    percentilePosition,

    tail:
      interval,

    thresholdPercentile,

    thresholdPricePerM2,

    differenceFromThreshold,

    percentDifferenceFromThreshold,

    percentageReference:
      thresholdPercentile ===
        10
        ? 'selected_population_p10'
        : 'selected_population_p90'
  }
}


export function buildPriceMeterComparableEvidence({
  subject,
  population
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  population:
    PriceMeterComparablePopulation
}): PriceMeterComparableEvidence {

  const subjectPosition =
    subject.positionIdentity


  if (
    population.subjectListingId !==
      subjectPosition.listingId
  ) {
    throw new Error(
      'Phase 12A subject and peer population do not represent the same analytical question.'
    )
  }


  if (
    population.subjectExcluded !==
      true ||
    population.observations.some(
      observation =>
        observation.listingId ===
          subjectPosition.listingId
    )
  ) {
    throw new Error(
      'Phase 12A evidence requires a subject-excluded peer population.'
    )
  }


  const comparisonPopulationCount =
    population.sampleSize


  if (
    !Number.isInteger(
      comparisonPopulationCount
    ) ||
    comparisonPopulationCount <=
      0 ||
    comparisonPopulationCount !==
      population.observations.length
  ) {
    throw new Error(
      'Phase 12A evidence requires a non-empty canonical peer population.'
    )
  }


  if (
    population.observations.some(
      observation =>
        observation.transactionType !==
          subjectPosition.transactionType ||
        observation.propertyBasis !==
          subjectPosition.propertyBasis ||
        observation.normalizationBasis !==
          subjectPosition.normalizationBasis
    )
  ) {
    throw new Error(
      'Phase 12A peer population violates immutable analytical identity.'
    )
  }


  const distribution =
    buildComparableDistribution({
      subject,
      population
    })


  if (
    distribution.sampleSize !==
      comparisonPopulationCount
  ) {
    throw new Error(
      'Phase 12A distribution sample size does not match the final peer population.'
    )
  }


  const {
    minimum,
    p10,
    p25,
    median,
    p75,
    p90,
    maximum,
    iqr
  } =
    distribution


  if (
    minimum === null ||
    p10 === null ||
    p25 === null ||
    median === null ||
    p75 === null ||
    p90 === null ||
    maximum === null ||
    iqr === null
  ) {
    throw new Error(
      'Phase 12A peer distribution is incomplete.'
    )
  }


  const propertyPricePerM2 =
    subjectPosition
      .propertyPricePerM2


  const percentile =
    buildComparablePercentile({
      subject,
      population
    })


  const difference =
    propertyPricePerM2 -
    median


  const percentDifference =
    (
      difference /
      median
    ) *
    100


  if (
    !Number.isFinite(
      difference
    ) ||
    !Number.isFinite(
      percentDifference
    )
  ) {
    throw new Error(
      'Phase 12A median-position calculation produced an invalid result.'
    )
  }


  const distributionInterval =
    resolveComparableInterval({
      propertyPricePerM2,
      distribution
    })


  const tail =
    buildComparableTail({
      listingId:
        subjectPosition.listingId,

      propertyPricePerM2,

      comparisonPopulationCount,

      percentilePosition:
        percentile.position,

      distribution,

      interval:
        distributionInterval
    })


  const constructionToLandContext =
    buildPriceMeterPropertyPositionConstructionLandContext({
      subject:
        subjectPosition
    })


  const confidenceScore =
    getPriceMeterConfidenceScore(
      comparisonPopulationCount
    )


  return {
    listingId:
      subjectPosition.listingId,

    transactionType:
      subjectPosition.transactionType,

    propertyBasis:
      subjectPosition.propertyBasis,

    normalizationBasis:
      subjectPosition.normalizationBasis,

    geography:
      subjectPosition.geography,

    analyticalCurrency:
      subjectPosition.analyticalCurrency,

    propertyPricePerM2,

    comparisonPopulationCount,

    subjectExcluded:
      true,

    confidence: {
      score:
        confidenceScore
    },

    distribution: {
      minimum,
      p10,
      p25,
      median,
      p75,
      p90,
      maximum,
      iqr
    },

    percentile,

    medianPosition: {
      difference,

      percentDifference,

      percentageReference:
        'selected_population_median'
    },

    distributionInterval,

    tail,

    constructionToLandContext,

    populationTrail:
      population.populationTrail,

    matchingListingIds:
      [...population.matchingListingIds]
  }
}