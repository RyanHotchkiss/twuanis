import 'server-only'

import {
  fetchBccrReferenceSaleRate,
  fetchBccrReferenceSaleRates
} from '@/lib/fx/bccr-provider'

import {
  registerFxObservation
} from '@/lib/fx/fx-registry'

import {
  resolveExactHistoricalFxRate,
  resolvePriorHistoricalFxRate,
  type ResolvedFxRate
} from '@/lib/fx/fx-resolver'


/*
 * ---------------------------------------------------------
 * FX SERVICE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Provide the canonical entry point for historical
 * USD → CRC analytical FX resolution.
 *
 * Canonical resolution policy:
 *
 * 1. Prefer an exact registered observation.
 *
 * 2. If exact history is missing locally, ask BCCR
 *    specifically for the analytical date.
 *
 * 3. If BCCR returns that exact date:
 *      - register it
 *      - resolve again from the registry
 *      - return exact
 *
 * 4. Only if BCCR itself returns no exact observation:
 *      - backfill a bounded historical window
 *      - register authoritative observations
 *      - resolve the latest prior observation
 *
 * This prevents an un-ingested exact BCCR observation from
 * being mistaken for a genuinely unavailable observation.
 */


const DEFAULT_BACKFILL_DAYS =
  10


/*
 * ---------------------------------------------------------
 * DATE HELPERS
 * ---------------------------------------------------------
 */


function validateIsoDate(
  value:
    string
): void {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        value
      )


  if (!match) {
    throw new Error(
      `Invalid FX service date: ${value}`
    )
  }


  const year =
    Number(
      match[1]
    )

  const month =
    Number(
      match[2]
    )

  const day =
    Number(
      match[3]
    )


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )


  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      `Invalid FX service calendar date: ${value}`
    )
  }
}


function subtractUtcDays(
  isoDate:
    string,

  days:
    number
): string {

  validateIsoDate(
    isoDate
  )


  const [
    year,
    month,
    day
  ] =
    isoDate
      .split('-')
      .map(Number)


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )


  date.setUTCDate(
    date.getUTCDate() -
      days
  )


  return date
    .toISOString()
    .slice(
      0,
      10
    )
}


/*
 * ---------------------------------------------------------
 * EXACT BCCR INGESTION
 * ---------------------------------------------------------
 */


async function ingestExactBccrDate(
  analyticalDate:
    string
): Promise<boolean> {

  const observation =
    await fetchBccrReferenceSaleRate(
      analyticalDate
    )


  if (!observation) {
    return false
  }


  /*
   * Defensive invariant:
   *
   * The exact-date provider must not satisfy this request
   * with a different BCCR effective date.
   */

  if (
    observation.effectiveDate !==
      analyticalDate
  ) {
    throw new Error(
      [
        'BCCR exact-date request returned a different effective date.',
        `analyticalDate=${analyticalDate}`,
        `effectiveDate=${observation.effectiveDate}`
      ].join(' ')
    )
  }


  await registerFxObservation(
    observation
  )


  return true
}


/*
 * ---------------------------------------------------------
 * PRIOR-HISTORY BACKFILL
 * ---------------------------------------------------------
 */


async function backfillBccrHistory(
  analyticalDate:
    string
): Promise<void> {

  const startDate =
    subtractUtcDays(
      analyticalDate,
      DEFAULT_BACKFILL_DAYS
    )


  const observations =
    await fetchBccrReferenceSaleRates({
      startDate,

      endDate:
        analyticalDate
    })


  if (
    observations.length ===
      0
  ) {
    throw new Error(
      [
        'BCCR returned no Reference Sale observations',
        `for ${startDate} through ${analyticalDate}.`
      ].join(' ')
    )
  }


  for (
    const observation
    of observations
  ) {

    await registerFxObservation(
      observation
    )
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL HISTORICAL RESOLUTION
 * ---------------------------------------------------------
 */


export async function getHistoricalUsdToCrcRate(
  analyticalDate:
    string
): Promise<ResolvedFxRate> {

  validateIsoDate(
    analyticalDate
  )


  /*
   * -------------------------------------------------------
   * 1. EXACT REGISTRY LOOKUP
   * -------------------------------------------------------
   */


  const existingExact =
    await resolveExactHistoricalFxRate(
      analyticalDate
    )


  if (existingExact) {
    return existingExact
  }


  /*
   * -------------------------------------------------------
   * 2. EXACT BCCR LOOKUP
   * -------------------------------------------------------
   *
   * Missing locally does NOT mean missing from BCCR.
   */


  const exactWasIngested =
    await ingestExactBccrDate(
      analyticalDate
    )


  if (exactWasIngested) {

    const resolvedExact =
      await resolveExactHistoricalFxRate(
        analyticalDate
      )


    if (!resolvedExact) {
      throw new Error(
        [
          'Exact BCCR FX observation was registered',
          'but could not be resolved from the registry.',
          `analyticalDate=${analyticalDate}`
        ].join(' ')
      )
    }


    return resolvedExact
  }


  /*
   * -------------------------------------------------------
   * 3. AUTHORITATIVE PRIOR-HISTORY BACKFILL
   * -------------------------------------------------------
   *
   * Only reached if BCCR itself did not return an exact
   * observation for the analytical calendar date.
   */


  await backfillBccrHistory(
    analyticalDate
  )


  /*
   * Exact may conceivably have appeared in the returned
   * range even though the single-date endpoint did not
   * return it.
   *
   * Check exact again before accepting prior history.
   */


  const exactAfterBackfill =
    await resolveExactHistoricalFxRate(
      analyticalDate
    )


  if (exactAfterBackfill) {
    return exactAfterBackfill
  }


  /*
   * -------------------------------------------------------
   * 4. PRIOR OBSERVATION FALLBACK
   * -------------------------------------------------------
   */


  const prior =
    await resolvePriorHistoricalFxRate(
      analyticalDate
    )


  if (!prior) {
    throw new Error(
      [
        'Unable to resolve canonical historical FX rate',
        `for analytical date ${analyticalDate}`,
        'after authoritative BCCR lookup and backfill.'
      ].join(' ')
    )
  }


  return prior
}