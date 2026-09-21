import { calculatePropertyPositionCounts } from './price-meter-property-position-math'
import { assertPriceMeterPropertyPositionParticipation } from './price-meter-property-position-population'
import type { PriceMeterPropertyPositionPopulation } from './price-meter-property-position-population'

export type PriceMeterPropertyPositionPercentileMethod = 'midrank'

export type PriceMeterPropertyPositionPercentile = {
  listingId: string
  propertyPricePerM2: number

  comparisonPopulationCount: number

  belowCount: number
  equalCount: number
  aboveCount: number

  percentilePosition: number
  percentileMethod: PriceMeterPropertyPositionPercentileMethod
}

/**
 * Calculates the subject property's percentile position within the
 * already-bounded canonical Phase 12 comparison population.
 *
 * Midrank percentile:
 *
 *   100 * (B + 0.5E) / N
 *
 * where:
 *   B = observations strictly below the subject Price / m²
 *   E = observations exactly equal to the subject Price / m²
 *   N = comparison-population observations
 *
 * This function:
 * - uses actual canonical Price / m² observations
 * - preserves exact ties
 * - does not use percentile thresholds from the distribution
 * - does not introduce tie tolerances
 * - does not round the analytical result
 * - does not calculate distribution, median, confidence, or presentation
 */
export function buildPriceMeterPropertyPositionPercentile({
  population,
}: {
  population: PriceMeterPropertyPositionPopulation
}): PriceMeterPropertyPositionPercentile {
  assertPriceMeterPropertyPositionParticipation(population)
  const subjectPricePerM2 = population.subject.propertyPricePerM2
  const comparisonPopulationCount = population.comparisonPopulationCount

  if (
    !Number.isFinite(subjectPricePerM2) ||
    subjectPricePerM2 <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² percentile without a valid positive subject Price / m².',
    )
  }

  if (
    !Number.isInteger(comparisonPopulationCount) ||
    comparisonPopulationCount <= 0
  ) {
    throw new Error(
      'Cannot calculate property Price / m² percentile without a non-empty canonical comparison population.',
    )
  }

  if (
    population.observations.length !== comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² comparison-population count does not match the canonical observation population.',
    )
  }

  const { belowCount, equalCount, aboveCount, percentilePosition } =
    calculatePropertyPositionCounts(subjectPricePerM2,
      population.observations.map(observation => observation.pricePerM2), comparisonPopulationCount)

  if (population.participation === 'SUBJECT_INCLUDED' && equalCount < 1) {
    throw new Error('Subject property is not represented in its canonical Price / m² comparison population.')
  }

  return {
    listingId: population.subject.listingId,
    propertyPricePerM2: subjectPricePerM2,

    comparisonPopulationCount,

    belowCount,
    equalCount,
    aboveCount,

    percentilePosition,
    percentileMethod: 'midrank',
  }
}