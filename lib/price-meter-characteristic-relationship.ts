import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterCharacteristicDistribution
} from '@/lib/price-meter-characteristic-distribution'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'


export type PriceMeterCharacteristicRelationship<
  T extends PriceMeterTransactionType
> = {
  characteristic:
    PriceMeterCharacteristicDistribution<T>[
      'characteristic'
    ]

  transactionType:
    T

  sampleSize:
    number

  parentSampleSize:
    number

  characteristicMedian:
    number | null

  parentMedian:
    number | null

  absoluteDifferenceFromParentMedian:
    number | null

  percentageDifferenceFromParentMedian:
    number | null

  direction:
  | 'above_parent_median'
  | 'below_parent_median'
  | 'equal_to_parent_median'
  | 'unavailable'

  distribution:
    PriceMeterDistribution<T>
}


export function buildPriceMeterCharacteristicRelationships<
  T extends PriceMeterTransactionType
>({
  parentDistribution,
  characteristicDistributions
}: {
  parentDistribution:
    PriceMeterDistribution<T>

  characteristicDistributions:
    PriceMeterCharacteristicDistribution<T>[]
}): PriceMeterCharacteristicRelationship<T>[] {

  /*
   * -------------------------------------------------------
   * TRANSACTION ISOLATION
   * -------------------------------------------------------
   *
   * Every characteristic relationship must remain inside
   * the same transaction universe as its parent cohort.
   */


  if (
    characteristicDistributions.some(
      characteristic =>
        characteristic
          .distribution
          .transactionType !==
        parentDistribution.transactionType
    )
  ) {
    throw new Error(
      'Price / m² characteristic relationship contains mixed Sale/Rent distributions.'
    )
  }


  const parentMedian =
    parentDistribution.median


  return characteristicDistributions.map(
    characteristicDistribution => {

      const characteristicMedian =
        characteristicDistribution
          .distribution
          .median


      if (
        parentMedian === null ||
        parentMedian <= 0 ||
        characteristicMedian === null
      ) {
        return {
          characteristic:
            characteristicDistribution
              .characteristic,

          transactionType:
            parentDistribution
              .transactionType,

          sampleSize:
            characteristicDistribution
              .sampleSize,

          parentSampleSize:
            parentDistribution
              .sampleSize,

          characteristicMedian,

          parentMedian,

          absoluteDifferenceFromParentMedian:
            null,

          percentageDifferenceFromParentMedian:
            null,

          direction:
            'unavailable' as const,

          distribution:
            characteristicDistribution
              .distribution
        }
      }


      const absoluteDifferenceFromParentMedian =
        characteristicMedian -
        parentMedian


      const percentageDifferenceFromParentMedian =
        (
          absoluteDifferenceFromParentMedian /
          parentMedian
        ) * 100


      const direction =
        absoluteDifferenceFromParentMedian > 0
          ? 'above_parent_median' as const
          : absoluteDifferenceFromParentMedian < 0
            ? 'below_parent_median' as const
            : 'equal_to_parent_median' as const


      return {
        characteristic:
          characteristicDistribution
            .characteristic,

        transactionType:
          parentDistribution
            .transactionType,

        sampleSize:
          characteristicDistribution
            .sampleSize,

        parentSampleSize:
          parentDistribution
            .sampleSize,

        characteristicMedian,

        parentMedian,

        absoluteDifferenceFromParentMedian,

        percentageDifferenceFromParentMedian,

        direction,

        distribution:
          characteristicDistribution
            .distribution
      }
    }
  )
}