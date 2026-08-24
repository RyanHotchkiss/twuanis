import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'


export type PriceMeterPropertyPriceVsMedian<
  T extends PriceMeterTransactionType
> = {
  listingId:
    string | null

  transactionType:
    T

  propertyBasis:
    PriceMeterObservation['propertyBasis']

  normalizationBasis:
    PriceMeterObservation['normalizationBasis']

  propertyPricePerM2:
    number

  medianPricePerM2:
    number | null

  absoluteDifference:
    number | null

  percentageDifference:
    number | null

  comparison:
    | 'above_median'
    | 'below_median'
    | 'equal_to_median'
    | 'unavailable'
}


export function buildPriceMeterPropertyPricesVsMedian<
  T extends PriceMeterTransactionType
>({
  observations,
  distribution
}: {
  observations:
    PriceMeterObservation[]

  distribution:
    PriceMeterDistribution<T>
}): PriceMeterPropertyPriceVsMedian<T>[] {

  /*
   * PROPERTY PRICE ABOVE OR BELOW MEDIAN
   *
   * Every property is compared only with the median
   * of its own transaction / property / normalization
   * cohort.
   */

  if (
    observations.some(
      observation =>
        observation.transactionType !==
        distribution.transactionType
    )
  ) {
    throw new Error(
      'Price / m² property comparison contains mixed Sale/Rent observations.'
    )
  }


  const medianPricePerM2 =
    distribution.median


  return observations.map(observation => {

    if (
      medianPricePerM2 === null ||
      medianPricePerM2 <= 0
    ) {
      return {
        listingId:
          observation.listingId,

        transactionType:
          distribution.transactionType,

        propertyBasis:
          observation.propertyBasis,

        normalizationBasis:
          observation.normalizationBasis,

        propertyPricePerM2:
          observation.pricePerM2,

        medianPricePerM2,

        absoluteDifference:
          null,

        percentageDifference:
          null,

        comparison:
          'unavailable' as const
      }
    }


    const absoluteDifference =
      observation.pricePerM2 -
      medianPricePerM2


    const percentageDifference =
      (
        absoluteDifference /
        medianPricePerM2
      ) * 100


    const comparison =
      absoluteDifference > 0
        ? 'above_median' as const
        : absoluteDifference < 0
          ? 'below_median' as const
          : 'equal_to_median' as const


    return {
      listingId:
        observation.listingId,

      transactionType:
        distribution.transactionType,

      propertyBasis:
        observation.propertyBasis,

      normalizationBasis:
        observation.normalizationBasis,

      propertyPricePerM2:
        observation.pricePerM2,

      medianPricePerM2,

      absoluteDifference,

      percentageDifference,

      comparison
    }
  })
}