import 'server-only'

/*
 * ---------------------------------------------------------
 * PRICE / M² YEAR BUILT COHORTS
 * ---------------------------------------------------------
 *
 * Canonical Price / m² Year Built cohort vocabulary.
 *
 * These values preserve the existing Twuanis listing
 * Year Built identities exactly.
 *
 * This module does not:
 *
 * - estimate a construction year
 * - infer a cohort from missing data
 * - broaden a cohort
 * - use midpoint matching
 * - use nearest-cohort matching
 * - translate presentation labels into analytical identity
 */


export const PRICE_METER_YEAR_BUILT_COHORTS = [
  {
    key: 'Pre-1980',
    labelEn: 'Pre-1980',
    labelEs: 'Antes de 1980'
  },
  {
    key: '1980s',
    labelEn: '1980s',
    labelEs: 'Década de 1980'
  },
  {
    key: '1990s',
    labelEn: '1990s',
    labelEs: 'Década de 1990'
  },
  {
    key: '2000s',
    labelEn: '2000s',
    labelEs: 'Década de 2000'
  },
  {
    key: '2010s',
    labelEn: '2010s',
    labelEs: 'Década de 2010'
  },
  {
    key: '2020+',
    labelEn: '2020+',
    labelEs: '2020+'
  }
] as const


export type PriceMeterYearBuiltCohortKey =
  typeof PRICE_METER_YEAR_BUILT_COHORTS[number]['key']


export type PriceMeterYearBuiltCohort =
  typeof PRICE_METER_YEAR_BUILT_COHORTS[number]


export function isPriceMeterYearBuiltCohortKey(
  value: unknown
): value is PriceMeterYearBuiltCohortKey {
  return (
    typeof value === 'string' &&
    PRICE_METER_YEAR_BUILT_COHORTS.some(
      cohort =>
        cohort.key === value
    )
  )
}


export function resolvePriceMeterYearBuiltCohort(
  value: unknown
): PriceMeterYearBuiltCohort | null {
  if (
    !isPriceMeterYearBuiltCohortKey(
      value
    )
  ) {
    return null
  }

  return (
    PRICE_METER_YEAR_BUILT_COHORTS.find(
      cohort =>
        cohort.key === value
    ) ??
    null
  )
}


export function matchesPriceMeterYearBuiltCohort(
  listingYearBuiltRange: unknown,
  cohortKey: PriceMeterYearBuiltCohortKey
): boolean {
  if (
    typeof listingYearBuiltRange !==
      'string'
  ) {
    return false
  }

  return (
    listingYearBuiltRange.trim() ===
    cohortKey
  )
}