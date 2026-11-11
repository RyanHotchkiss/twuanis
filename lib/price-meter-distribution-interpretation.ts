import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'


export type PriceMeterDistributionBand =
  | 'below_p10'
  | 'p10_to_p25'
  | 'p25_to_median'
  | 'median_to_p75'
  | 'p75_to_p90'
  | 'above_p90'


export type PriceMeterObservationDistributionPosition = {
  listingId:
    string | null

  transactionType:
    PriceMeterObservation['transactionType']

  propertyBasis:
    PriceMeterObservation['propertyBasis']

  normalizationBasis:
    PriceMeterObservation['normalizationBasis']

  pricePerM2:
    number

  distributionBand:
    PriceMeterDistributionBand

  siteCoverage:
  number | null
}


export type PriceMeterDistributionInterpretation<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  sampleSize:
    number

  medianPricePerM2:
    number | null

  interquartileRange: {
    p25:
      number | null

    p75:
      number | null

    width:
      number | null

    containsMiddlePercentageOfObservations:
      50
  }

  observationsBelowP10:
    PriceMeterObservationDistributionPosition[]

  observationsAboveP90:
    PriceMeterObservationDistributionPosition[]

  observationPositions:
    PriceMeterObservationDistributionPosition[]
}


function classifyDistributionBand(
  pricePerM2:
    number,

  distribution:
    PriceMeterDistribution<PriceMeterTransactionType>
): PriceMeterDistributionBand {

  if (
    distribution.p10 === null ||
    distribution.p25 === null ||
    distribution.median === null ||
    distribution.p75 === null ||
    distribution.p90 === null
  ) {
    throw new Error(
      'Price / m² distribution interpretation requires P10, P25, Median, P75, and P90.'
    )
  }


  if (
    pricePerM2 <
      distribution.p10
  ) {
    return 'below_p10'
  }


  if (
    pricePerM2 <
      distribution.p25
  ) {
    return 'p10_to_p25'
  }


  if (
    pricePerM2 <
      distribution.median
  ) {
    return 'p25_to_median'
  }


  if (
    pricePerM2 <=
      distribution.p75
  ) {
    return 'median_to_p75'
  }


  if (
    pricePerM2 <=
      distribution.p90
  ) {
    return 'p75_to_p90'
  }


  return 'above_p90'
}


export function buildPriceMeterDistributionInterpretation<
  T extends PriceMeterTransactionType
>({
  observations,
  distribution
}: {
  observations:
    PriceMeterObservation[]

  distribution:
    PriceMeterDistribution<T>
}): PriceMeterDistributionInterpretation<T> {

  /*
   * -------------------------------------------------------
   * TRANSACTION ISOLATION
   * -------------------------------------------------------
   *
   * Distribution interpretation may never compare an
   * observation against a distribution from another
   * transaction universe.
   */

  if (
    observations.some(
      observation =>
        observation.transactionType !==
          distribution.transactionType
    )
  ) {
    throw new Error(
      'Price / m² distribution interpretation contains mixed Sale/Rent observations.'
    )
  }


  /*
   * An empty canonical distribution produces an empty
   * interpretation rather than invented market meaning.
   */

  if (
    distribution.sampleSize ===
      0
  ) {
    return {
      transactionType:
        distribution.transactionType,

      sampleSize:
        0,

      medianPricePerM2:
        null,

      interquartileRange: {
        p25:
          null,

        p75:
          null,

        width:
          null,

        containsMiddlePercentageOfObservations:
          50
      },

      observationsBelowP10:
        [],

      observationsAboveP90:
        [],

      observationPositions:
        []
    }
  }


  if (
    distribution.p10 === null ||
    distribution.p25 === null ||
    distribution.median === null ||
    distribution.p75 === null ||
    distribution.p90 === null ||
    distribution.iqr === null
  ) {
    throw new Error(
      'Price / m² distribution interpretation received an incomplete populated distribution.'
    )
  }


  const observationPositions =
    observations.map(
      observation => ({
        listingId:
          observation.listingId,

        transactionType:
          observation.transactionType,

        propertyBasis:
          observation.propertyBasis,

        normalizationBasis:
          observation.normalizationBasis,

        pricePerM2:
          observation.pricePerM2,

        siteCoverage:
            observation.analyticalIdentity.siteCoverage,

        distributionBand:
          classifyDistributionBand(
            observation.pricePerM2,
            distribution
          )
      })
    )


  return {
    transactionType:
      distribution.transactionType,

    sampleSize:
      distribution.sampleSize,

    medianPricePerM2:
      distribution.median,

    interquartileRange: {
      p25:
        distribution.p25,

      p75:
        distribution.p75,

      width:
        distribution.iqr,

      containsMiddlePercentageOfObservations:
        50
    },

    observationsBelowP10:
      observationPositions.filter(
        observation =>
          observation.distributionBand ===
            'below_p10'
      ),

    observationsAboveP90:
      observationPositions.filter(
        observation =>
          observation.distributionBand ===
            'above_p90'
      ),

    observationPositions
  }
}