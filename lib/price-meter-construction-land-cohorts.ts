/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND COHORTS
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Define the canonical numerical cohorts used to classify
 * exact Construction-to-Land Ratios.
 *
 * Construction-to-Land Ratio:
 *
 *   reported construction area / property area
 *
 * These cohorts classify an exact canonical ratio.
 * They DO NOT replace or alter the underlying exact ratio.
 *
 * They DO NOT represent physical Site Coverage.
 */


export type PriceMeterConstructionLandCohortDefinition = {
  key:
    string

  minimumExclusive:
    number | null

  minimumInclusive:
    number | null

  maximumExclusive:
    number | null

  label:
    string
}


/*
 * Canonical Phase 9 cohort boundaries.
 *
 * Eligible Construction-to-Land Ratios are always
 * finite and greater than zero.
 *
 * Boundary semantics:
 *
 *   0 < R < 0.25
 *   0.25 <= R < 0.50
 *   0.50 <= R < 1.00
 *   1.00 <= R < 2.00
 *   2.00 <= R
 *
 * The intervals contain no gaps and no overlaps across
 * the complete eligible positive ratio domain.
 */

export const
PRICE_METER_CONSTRUCTION_LAND_COHORTS:
  PriceMeterConstructionLandCohortDefinition[] = [
    {
      key:
        'gt_0_lt_0_25',

      minimumExclusive:
        0,

      minimumInclusive:
        null,

      maximumExclusive:
        0.25,

      label:
        '0–0.25'
    },

    {
      key:
        'gte_0_25_lt_0_50',

      minimumExclusive:
        null,

      minimumInclusive:
        0.25,

      maximumExclusive:
        0.5,

      label:
        '0.25–0.50'
    },

    {
      key:
        'gte_0_50_lt_1_00',

      minimumExclusive:
        null,

      minimumInclusive:
        0.5,

      maximumExclusive:
        1,

      label:
        '0.50–1.00'
    },

    {
      key:
        'gte_1_00_lt_2_00',

      minimumExclusive:
        null,

      minimumInclusive:
        1,

      maximumExclusive:
        2,

      label:
        '1.00–2.00'
    },

    {
      key:
        'gte_2_00',

      minimumExclusive:
        null,

      minimumInclusive:
        2,

      maximumExclusive:
        null,

      label:
        '2.00+'
    }
  ]


export function matchesPriceMeterConstructionLandCohort(
  ratio:
    number,

  cohort:
    PriceMeterConstructionLandCohortDefinition
): boolean {

  if (
    !Number.isFinite(
      ratio
    ) ||
    ratio <= 0
  ) {
    return false
  }


  if (
    cohort.minimumExclusive !==
      null &&
    ratio <=
      cohort.minimumExclusive
  ) {
    return false
  }


  if (
    cohort.minimumInclusive !==
      null &&
    ratio <
      cohort.minimumInclusive
  ) {
    return false
  }


  if (
    cohort.maximumExclusive !==
      null &&
    ratio >=
      cohort.maximumExclusive
  ) {
    return false
  }


  return true
}


export function resolvePriceMeterConstructionLandCohort(
  ratio:
    number
): PriceMeterConstructionLandCohortDefinition | null {

  if (
    !Number.isFinite(
      ratio
    ) ||
    ratio <= 0
  ) {
    return null
  }


  const matches =
    PRICE_METER_CONSTRUCTION_LAND_COHORTS
      .filter(
        cohort =>
          matchesPriceMeterConstructionLandCohort(
            ratio,
            cohort
          )
      )


  /*
   * Every eligible positive ratio must belong to exactly
   * one canonical cohort.
   *
   * Zero matches means the cohort definitions contain a gap.
   * More than one match means the definitions overlap.
   *
   * Both conditions are architectural failures.
   */

  if (
    matches.length !==
      1
  ) {
    throw new Error(
      'Construction-to-Land ratio does not resolve to exactly one canonical cohort.'
    )
  }


  return matches[0]
}
