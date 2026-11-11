import 'server-only'
import { calculatePopulationMidrank } from './population-midrank'

// Neutral arithmetic only. Owning adapters establish identity, compatibility,
// reference membership and participation before calling this module.
export type PropertyPositionInterval =
  | 'below_p10' | 'p10_to_p25' | 'p25_to_median' | 'at_median'
  | 'median_to_p75' | 'p75_to_p90' | 'above_p90'

export type PropertyPositionQuantiles = {
  p10: number | null
  p25: number | null
  median: number | null
  p75: number | null
  p90: number | null
}

function positive(value: number | null, label: string): asserts value is number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Property position requires a finite positive ${label}.`)
  }
}

export function calculatePropertyPositionCounts(
  subjectValue: number,
  referenceValues: readonly number[],
  populationCount: number
) {
  positive(subjectValue, 'subject value')
  if (!Number.isInteger(populationCount) || populationCount <= 0 ||
      referenceValues.length !== populationCount) {
    throw new Error('Property position requires a non-empty reconciled reference population.')
  }
  let belowCount = 0
  let equalCount = 0
  let aboveCount = 0
  for (const value of referenceValues) {
    positive(value, 'reference observation')
    if (value < subjectValue) belowCount += 1
    else if (value > subjectValue) aboveCount += 1
    else equalCount += 1
  }
  return calculatePopulationMidrank(belowCount, equalCount, aboveCount, populationCount)
}


export function calculatePropertyPositionDifference(subjectValue: number, referenceValue: number | null) {
  positive(subjectValue, 'subject value')
  positive(referenceValue, 'reference denominator')
  const difference = subjectValue - referenceValue
  const percentDifference = (difference / referenceValue) * 100
  if (!Number.isFinite(difference) || !Number.isFinite(percentDifference)) {
    throw new Error('Property position difference is invalid.')
  }
  return { difference, percentDifference }
}

export function classifyPropertyPositionInterval(
  subjectValue: number,
  quantiles: PropertyPositionQuantiles
): PropertyPositionInterval {
  positive(subjectValue, 'subject value')
  const { p10, p25, median, p75, p90 } = quantiles
  positive(p10, 'P10'); positive(p25, 'P25'); positive(median, 'median')
  positive(p75, 'P75'); positive(p90, 'P90')
  if (p10 > p25 || p25 > median || median > p75 || p75 > p90) {
    throw new Error('Property position quantiles are not in ascending order.')
  }
  if (subjectValue < p10) return 'below_p10'
  if (subjectValue < p25) return 'p10_to_p25'
  if (subjectValue < median) return 'p25_to_median'
  if (subjectValue === median) return 'at_median'
  if (subjectValue <= p75) return 'median_to_p75'
  if (subjectValue <= p90) return 'p75_to_p90'
  return 'above_p90'
}

export function calculatePropertyPositionTail(
  subjectValue: number,
  quantiles: Pick<PropertyPositionQuantiles, 'p10' | 'p90'>,
  interval: PropertyPositionInterval
) {
  if (interval !== 'below_p10' && interval !== 'above_p90') return null
  positive(subjectValue, 'subject value')
  const thresholdPercentile: 10 | 90 = interval === 'below_p10' ? 10 : 90
  const thresholdPricePerM2 = thresholdPercentile === 10 ? quantiles.p10 : quantiles.p90
  positive(thresholdPricePerM2, 'tail threshold')
  if ((interval === 'below_p10' && subjectValue >= thresholdPricePerM2) ||
      (interval === 'above_p90' && subjectValue <= thresholdPricePerM2)) {
    throw new Error('Property position tail conflicts with its threshold.')
  }
  const { difference, percentDifference } = calculatePropertyPositionDifference(subjectValue, thresholdPricePerM2)
  return {
    thresholdPercentile,
    thresholdPricePerM2,
    differenceFromThreshold: difference,
    percentDifferenceFromThreshold: percentDifference,
    percentageReference: thresholdPercentile === 10
      ? 'selected_population_p10' as const : 'selected_population_p90' as const
  }
}
