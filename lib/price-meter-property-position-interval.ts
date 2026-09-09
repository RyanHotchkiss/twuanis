import type { PriceMeterDistribution } from './price-meter-distribution'
import type { PriceMeterPropertyPositionPopulation } from './price-meter-property-position-population'

export type PriceMeterPropertyPositionInterval =
  | 'below_p10'
  | 'p10_to_p25'
  | 'p25_to_median'
  | 'at_median'
  | 'median_to_p75'
  | 'p75_to_p90'
  | 'above_p90'

export type PriceMeterPropertyPositionIntervalResult = {
  listingId: string
  propertyPricePerM2: number
  comparisonPopulationCount: number

  p10: number
  p25: number
  median: number
  p75: number
  p90: number

  interval: PriceMeterPropertyPositionInterval
}

/**
 * Determines the subject property's numerical interval within the
 * canonical Price / m² distribution of its comparison population.
 *
 * Canonical intervals:
 *
 *   below P10
 *   P10–P25
 *   P25–Median
 *   at Median
 *   Median–P75
 *   P75–P90
 *   above P90
 *
 * Boundary convention:
 *
 *   x < P10             -> below_p10
 *   P10 <= x < P25      -> p10_to_p25
 *   P25 <= x < Median   -> p25_to_median
 *   x === Median        -> at_median
 *   Median < x <= P75   -> median_to_p75
 *   P75 < x <= P90      -> p75_to_p90
 *   x > P90             -> above_p90
 *
 * This function:
 * - consumes the canonical distribution
 * - does not recalculate quantiles
 * - preserves numerical thresholds
 * - does not calculate percentile position
 * - does not calculate distance from a tail threshold
 * - does not calculate confidence
 * - does not classify the property qualitatively
 * - does not make valuation or pricing claims
 */
export function buildPriceMeterPropertyPositionInterval({
  population,
  distribution,
}: {
  population: PriceMeterPropertyPositionPopulation
  distribution: PriceMeterDistribution<
    PriceMeterPropertyPositionPopulation['transactionType']
  >
}): PriceMeterPropertyPositionIntervalResult {
  const propertyPricePerM2 = population.subject.propertyPricePerM2
  const comparisonPopulationCount = population.comparisonPopulationCount

  const p10 = distribution.p10
  const p25 = distribution.p25
  const median = distribution.median
  const p75 = distribution.p75
  const p90 = distribution.p90

  if (
    !Number.isFinite(propertyPricePerM2) ||
    propertyPricePerM2 <= 0
  ) {
    throw new Error(
      'Cannot determine property Price / m² distribution interval without a valid positive subject Price / m².',
    )
  }

  if (
    !Number.isInteger(comparisonPopulationCount) ||
    comparisonPopulationCount <= 0
  ) {
    throw new Error(
      'Cannot determine property Price / m² distribution interval without a non-empty canonical comparison population.',
    )
  }

  if (
    distribution.transactionType !== population.transactionType
  ) {
    throw new Error(
      'Property Price / m² distribution transaction type does not match the canonical comparison population.',
    )
  }

  if (
    distribution.sampleSize !== comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² distribution sample size does not match the canonical comparison population.',
    )
  }

  if (
    p10 === null ||
    p25 === null ||
    median === null ||
    p75 === null ||
    p90 === null ||
    !Number.isFinite(p10) ||
    !Number.isFinite(p25) ||
    !Number.isFinite(median) ||
    !Number.isFinite(p75) ||
    !Number.isFinite(p90) ||
    p10 <= 0 ||
    p25 <= 0 ||
    median <= 0 ||
    p75 <= 0 ||
    p90 <= 0
  ) {
    throw new Error(
      'Cannot determine property Price / m² distribution interval without valid canonical distribution thresholds.',
    )
  }

  if (
    p10 > p25 ||
    p25 > median ||
    median > p75 ||
    p75 > p90
  ) {
    throw new Error(
      'Property Price / m² distribution thresholds are not in canonical ascending order.',
    )
  }

  let interval: PriceMeterPropertyPositionInterval

  if (propertyPricePerM2 < p10) {
    interval = 'below_p10'
  } else if (propertyPricePerM2 < p25) {
    interval = 'p10_to_p25'
  } else if (propertyPricePerM2 < median) {
    interval = 'p25_to_median'
  } else if (propertyPricePerM2 === median) {
    interval = 'at_median'
  } else if (propertyPricePerM2 <= p75) {
    interval = 'median_to_p75'
  } else if (propertyPricePerM2 <= p90) {
    interval = 'p75_to_p90'
  } else {
    interval = 'above_p90'
  }

  return {
    listingId: population.subject.listingId,
    propertyPricePerM2,
    comparisonPopulationCount,

    p10,
    p25,
    median,
    p75,
    p90,

    interval,
  }
}