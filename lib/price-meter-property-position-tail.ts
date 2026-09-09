import type { PriceMeterDistribution } from './price-meter-distribution'
import type { PriceMeterPropertyPositionPopulation } from './price-meter-property-position-population'
import type { PriceMeterPropertyPositionPercentile } from './price-meter-property-position-percentile'
import type {
  PriceMeterPropertyPositionIntervalResult,
} from './price-meter-property-position-interval'

export type PriceMeterPropertyPositionTail =
  | 'below_p10'
  | 'above_p90'

export type PriceMeterPropertyPositionTailResult = {
  listingId: string
  propertyPricePerM2: number

  comparisonPopulationCount: number
  percentilePosition: number

  tail: PriceMeterPropertyPositionTail
  thresholdPercentile: 10 | 90
  thresholdPricePerM2: number

  differenceFromThreshold: number
  percentDifferenceFromThreshold: number

  percentageReference:
    | 'selected_population_p10'
    | 'selected_population_p90'
}

/**
 * Calculates quantitative tail evidence when the subject property's
 * canonical Price / m² falls below P10 or above P90.
 *
 * Difference:
 *
 *   Subject Price / m² - Tail Threshold Price / m²
 *
 * Percentage difference:
 *
 *   ((Subject Price / m² - Tail Threshold Price / m²)
 *     / Tail Threshold Price / m²) * 100
 *
 * The sign is preserved:
 *
 *   below P10 -> negative difference
 *   above P90 -> positive difference
 *
 * A property inside P10-P90 has no tail result and returns null.
 *
 * This function:
 * - consumes existing canonical population evidence
 * - consumes the canonical percentile result
 * - consumes the canonical interval result
 * - consumes the canonical distribution
 * - does not recreate percentile or distribution mathematics
 * - preserves explicit threshold references
 * - does not calculate confidence
 * - does not classify the property qualitatively
 * - does not make valuation, pricing, or decision claims
 */
export function buildPriceMeterPropertyPositionTail({
  population,
  distribution,
  percentile,
  interval,
}: {
  population: PriceMeterPropertyPositionPopulation
  distribution: PriceMeterDistribution<
    PriceMeterPropertyPositionPopulation['transactionType']
  >
  percentile: PriceMeterPropertyPositionPercentile
  interval: PriceMeterPropertyPositionIntervalResult
}): PriceMeterPropertyPositionTailResult | null {
  const propertyPricePerM2 = population.subject.propertyPricePerM2
  const comparisonPopulationCount = population.comparisonPopulationCount

  if (
    interval.interval !== 'below_p10' &&
    interval.interval !== 'above_p90'
  ) {
    return null
  }

  if (
    !Number.isFinite(propertyPricePerM2) ||
    propertyPricePerM2 <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² tail position without a valid positive subject Price / m².',
    )
  }

  if (
    !Number.isInteger(comparisonPopulationCount) ||
    comparisonPopulationCount <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² tail position without a non-empty canonical comparison population.',
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
    distribution.sampleSize !== comparisonPopulationCount ||
    percentile.comparisonPopulationCount !== comparisonPopulationCount ||
    interval.comparisonPopulationCount !== comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² tail evidence does not represent one canonical comparison population.',
    )
  }

  if (
    percentile.listingId !== population.subject.listingId ||
    interval.listingId !== population.subject.listingId
  ) {
    throw new Error(
      'Property Price / m² tail evidence does not represent the subject property.',
    )
  }

  if (
    percentile.propertyPricePerM2 !== propertyPricePerM2 ||
    interval.propertyPricePerM2 !== propertyPricePerM2
  ) {
    throw new Error(
      'Property Price / m² tail evidence does not preserve the subject Price / m².',
    )
  }

  if (
    !Number.isFinite(percentile.percentilePosition) ||
    percentile.percentilePosition < 0 ||
    percentile.percentilePosition > 100
  ) {
    throw new Error(
      'Property Price / m² tail evidence contains an invalid percentile position.',
    )
  }

  const thresholdPercentile: 10 | 90 =
    interval.interval === 'below_p10' ? 10 : 90

  const thresholdPricePerM2 =
    thresholdPercentile === 10
      ? distribution.p10
      : distribution.p90

  if (
    thresholdPricePerM2 === null ||
    !Number.isFinite(thresholdPricePerM2) ||
    thresholdPricePerM2 <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² tail position without a valid canonical tail threshold.',
    )
  }

  if (
    interval.interval === 'below_p10' &&
    propertyPricePerM2 >= thresholdPricePerM2
  ) {
    throw new Error(
      'Property Price / m² tail identity conflicts with the canonical P10 threshold.',
    )
  }

  if (
    interval.interval === 'above_p90' &&
    propertyPricePerM2 <= thresholdPricePerM2
  ) {
    throw new Error(
      'Property Price / m² tail identity conflicts with the canonical P90 threshold.',
    )
  }

  const differenceFromThreshold =
    propertyPricePerM2 - thresholdPricePerM2

  const percentDifferenceFromThreshold =
    (differenceFromThreshold / thresholdPricePerM2) * 100

  if (
    !Number.isFinite(differenceFromThreshold) ||
    !Number.isFinite(percentDifferenceFromThreshold)
  ) {
    throw new Error(
      'Property Price / m² tail calculation produced an invalid result.',
    )
  }

  return {
    listingId: population.subject.listingId,
    propertyPricePerM2,

    comparisonPopulationCount,
    percentilePosition: percentile.percentilePosition,

    tail: interval.interval,
    thresholdPercentile,
    thresholdPricePerM2,

    differenceFromThreshold,
    percentDifferenceFromThreshold,

    percentageReference:
      thresholdPercentile === 10
        ? 'selected_population_p10'
        : 'selected_population_p90',
  }
}