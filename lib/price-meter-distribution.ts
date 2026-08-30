import type {
  PriceMeterTransactionCohort,
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  buildNumericalDistribution
} from '@/lib/numerical-distribution'


export type PriceMeterDistribution<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  sampleSize:
    number

  minimum:
    number | null

  p10:
    number | null

  p25:
    number | null

  median:
    number | null

  average:
    number | null

  p75:
    number | null

  p90:
    number | null

  maximum:
    number | null

  iqr:
    number | null
}


export function buildPriceMeterDistribution<
  T extends PriceMeterTransactionType
>(
  cohort:
    PriceMeterTransactionCohort<T>
): PriceMeterDistribution<T> {

  /*
   * Defensive invariant.
   *
   * The transaction cohort is the analytical boundary.
   * Distribution statistics may never contain observations
   * from another transaction universe.
   */

  if (
    cohort.observations.some(
      observation =>
        observation.transactionType !==
          cohort.transactionType
    )
  ) {
    throw new Error(
      'Price / m² distribution contains mixed Sale/Rent observations.'
    )
  }


  /*
   * Price / m² semantics remain owned by this layer.
   *
   * The generic numerical distribution calculator receives
   * only the numerical Price / m² observations after the
   * analytical population boundary has been established.
   */

  const distribution =
    buildNumericalDistribution(
      cohort.observations.map(
        observation =>
          observation.pricePerM2
      )
    )


  return {
    transactionType:
      cohort.transactionType,

    sampleSize:
      distribution.sampleSize,

    minimum:
      distribution.minimum,

    p10:
      distribution.p10,

    p25:
      distribution.p25,

    median:
      distribution.median,

    average:
      distribution.average,

    p75:
      distribution.p75,

    p90:
      distribution.p90,

    maximum:
      distribution.maximum,

    iqr:
      distribution.iqr
  }
}
