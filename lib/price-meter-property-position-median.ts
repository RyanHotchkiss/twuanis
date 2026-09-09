import type { PriceMeterDistribution } from './price-meter-distribution'
import type { PriceMeterPropertyPositionPopulation } from './price-meter-property-position-population'

export type PriceMeterPropertyPositionMedian = {
  listingId: string
  propertyPricePerM2: number

  comparisonPopulationMedian: number
  comparisonPopulationCount: number

  differenceFromMedian: number
  percentDifferenceFromMedian: number

  percentageReference: 'selected_population_median'
}

/**
 * Calculates the subject property's signed Price / m² position
 * relative to the median of its canonical comparison population.
 *
 * Absolute difference:
 *
 *   Subject Price / m² - Population Median
 *
 * Percentage difference:
 *
 *   ((Subject Price / m² - Population Median) / Population Median) * 100
 *
 * The selected-population median is always the explicit percentage
 * reference.
 *
 * This function:
 * - preserves the sign of both differences
 * - does not round analytical results
 * - does not calculate the distribution
 * - does not calculate percentile position
 * - does not calculate confidence
 * - does not classify the property
 * - does not make valuation or pricing claims
 */
export function buildPriceMeterPropertyPositionMedian({
  population,
  distribution,
}: {
  population: PriceMeterPropertyPositionPopulation
  distribution: PriceMeterDistribution<
    PriceMeterPropertyPositionPopulation['transactionType']
  >
}): PriceMeterPropertyPositionMedian {
  const propertyPricePerM2 = population.subject.propertyPricePerM2
  const comparisonPopulationMedian = distribution.median
  const comparisonPopulationCount = population.comparisonPopulationCount

  if (
    !Number.isFinite(propertyPricePerM2) ||
    propertyPricePerM2 <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² median position without a valid positive subject Price / m².',
    )
  }

  if (
    comparisonPopulationMedian === null ||
    !Number.isFinite(comparisonPopulationMedian) ||
    comparisonPopulationMedian <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² median position without a valid positive comparison-population median.',
    )
  }

  if (
    !Number.isInteger(comparisonPopulationCount) ||
    comparisonPopulationCount <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² median position without a non-empty canonical comparison population.',
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

  const differenceFromMedian =
    propertyPricePerM2 - comparisonPopulationMedian

  const percentDifferenceFromMedian =
    (differenceFromMedian / comparisonPopulationMedian) * 100

  if (
    !Number.isFinite(differenceFromMedian) ||
    !Number.isFinite(percentDifferenceFromMedian)
  ) {
    throw new Error(
      'Property Price / m² median-position calculation produced an invalid result.',
    )
  }

  return {
    listingId: population.subject.listingId,
    propertyPricePerM2,

    comparisonPopulationMedian,
    comparisonPopulationCount,

    differenceFromMedian,
    percentDifferenceFromMedian,

    percentageReference: 'selected_population_median',
  }
}