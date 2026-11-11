import 'server-only'

// Neutral count arithmetic shared by scanned and grouped populations.
export function calculatePopulationMidrank(
  belowCount: number, equalCount: number, aboveCount: number, populationCount: number
) {
  if (![belowCount, equalCount, aboveCount, populationCount].every(Number.isSafeInteger) ||
      belowCount < 0 || equalCount < 0 || aboveCount < 0 || populationCount <= 0) {
    throw new Error('Population midrank requires valid nonnegative counts and positive n.')
  }
  if (belowCount + equalCount + aboveCount !== populationCount) {
    throw new Error('Property position population accounting failed.')
  }
  const percentilePosition = (100 * (belowCount + 0.5 * equalCount)) / populationCount
  if (!Number.isFinite(percentilePosition) || percentilePosition < 0 || percentilePosition > 100) {
    throw new Error('Property position percentile is invalid.')
  }
  return { belowCount, equalCount, aboveCount, percentilePosition }
}
