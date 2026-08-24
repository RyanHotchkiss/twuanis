import type {
  PriceMeterTransactionCohort,
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'


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


/*
 * Linear interpolation percentile.
 *
 * The percentile position is calculated against the
 * zero-based sorted observation population.
 *
 * Examples:
 *
 * n = 5
 * values = [100, 200, 300, 400, 500]
 *
 * P25 = 200
 * P50 = 300
 * P75 = 400
 */
function percentile(
  sortedValues:
    number[],

  percentileValue:
    number
): number | null {

  if (
    sortedValues.length ===
      0
  ) {
    return null
  }


  if (
    percentileValue < 0 ||
    percentileValue > 1
  ) {
    throw new Error(
      'Price / m² percentile must be between 0 and 1.'
    )
  }


  const position =
    (sortedValues.length - 1) *
    percentileValue


  const lowerIndex =
    Math.floor(
      position
    )


  const upperIndex =
    Math.ceil(
      position
    )


  if (
    lowerIndex ===
      upperIndex
  ) {
    return sortedValues[
      lowerIndex
    ]
  }


  const weight =
    position -
    lowerIndex


  return (
    sortedValues[
      lowerIndex
    ] *
      (1 - weight)
  ) +
    (
      sortedValues[
        upperIndex
      ] *
        weight
    )
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


  const values =
    cohort.observations
      .map(
        observation =>
          observation.pricePerM2
      )
      .filter(
        value =>
          Number.isFinite(
            value
          ) &&
          value > 0
      )
      .sort(
        (a, b) =>
          a - b
      )


  if (
    values.length ===
      0
  ) {
      return {
        transactionType:
          cohort.transactionType,

        sampleSize:
          0,

        minimum:
          null,

        p10:
          null,

        p25:
          null,

        median:
          null,

        average:
          null,

        p75:
          null,

        p90:
          null,

        maximum:
          null,

        iqr:
          null
      }
  }

  const p10 =
    percentile(
      values,
      0.1
    )

  const p25 =
    percentile(
      values,
      0.25
    )


  const median =
    percentile(
      values,
      0.5
    )

  const average =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length  

  const p75 =
    percentile(
      values,
      0.75
    )

  const p90 =
    percentile(
      values,
      0.9
    )

  return {
  transactionType:
    cohort.transactionType,

  sampleSize:
    values.length,

  minimum:
    values[0],

  p10,

  p25,

  median,

  average,

  p75,

  p90,

  maximum:
    values[
      values.length - 1
    ],

  iqr:
    p25 !== null &&
    p75 !== null
      ? p75 - p25
      : null
}
}