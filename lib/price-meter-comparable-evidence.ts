import 'server-only'
import { calculatePropertyPositionCounts, calculatePropertyPositionDifference, classifyPropertyPositionInterval, calculatePropertyPositionTail } from '@/lib/price-meter-property-position-math'

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


  const { belowCount, equalCount, aboveCount, percentilePosition: position } =
    calculatePropertyPositionCounts(subjectPricePerM2,
      population.observations.map(observation => observation.pricePerM2), comparisonPopulationCount)

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

  return classifyPropertyPositionInterval(propertyPricePerM2, distribution)
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


  const tail = calculatePropertyPositionTail(propertyPricePerM2, distribution, interval)
  if (tail === null) return null
  return { listingId, propertyPricePerM2, comparisonPopulationCount, percentilePosition, tail: interval, ...tail }
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


  const { difference, percentDifference } = calculatePropertyPositionDifference(propertyPricePerM2, median)

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