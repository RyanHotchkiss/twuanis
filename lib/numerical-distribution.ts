/*
 * ---------------------------------------------------------
 * GENERIC NUMERICAL DISTRIBUTION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Calculate descriptive distribution statistics for a
 * population of finite positive numerical observations.
 *
 * This module contains mathematics only.
 *
 * It has no knowledge of:
 *
 * - Price / m²
 * - Construction-to-Land Ratio
 * - Sale or Rent
 * - Property Basis
 * - geography
 * - currency
 * - analytical cohorts
 *
 * Analytical layers remain responsible for establishing
 * population identity before calling this module.
 */


export type NumericalDistribution = {
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
 * Position is calculated against the zero-based sorted
 * numerical population.
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
      'Numerical percentile must be between 0 and 1.'
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


export function buildNumericalDistribution(
  observations:
    number[]
): NumericalDistribution {

  const values =
    observations
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
