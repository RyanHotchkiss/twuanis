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

  let belowCount = 0
  let equalCount = 0
  let aboveCount = 0

  for (const observation of population.observations) {
    const observationPricePerM2 = observation.pricePerM2

    if (
      !Number.isFinite(observationPricePerM2) ||
      observationPricePerM2 <= 0
    ) {
      throw new Error(
        'Property Price / m² comparison population contains an invalid Price / m² observation.',
      )
    }

    if (observationPricePerM2 < subjectPricePerM2) {
      belowCount += 1
      continue
    }

    if (observationPricePerM2 > subjectPricePerM2) {
      aboveCount += 1
      continue
    }

    equalCount += 1
  }

  if (
    belowCount + equalCount + aboveCount !==
    comparisonPopulationCount
  ) {
    throw new Error(
      'Property Price / m² percentile population accounting failed.',
    )
  }

  if (equalCount < 1) {
    throw new Error(
      'Subject property is not represented in its canonical Price / m² comparison population.',
    )
  }

  const percentilePosition =
    (100 * (belowCount + 0.5 * equalCount)) /
    comparisonPopulationCount

  if (
    !Number.isFinite(percentilePosition) ||
    percentilePosition < 0 ||
    percentilePosition > 100
  ) {
    throw new Error(
      'Property Price / m² percentile calculation produced an invalid result.',
    )
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