import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'


/*
 * ---------------------------------------------------------
 * FX RESOLVER
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve canonical historical FX observations already
 * preserved in the Twuanis FX registry.
 *
 * IMPORTANT:
 *
 * Exact-date resolution and prior-date resolution are
 * intentionally separate operations.
 *
 * Why?
 *
 * BCCR publishes calendar-dated observations for dates
 * including weekends and holidays.
 *
 * Therefore Twuanis MUST NOT accept a prior observation
 * merely because the exact analytical date has not yet
 * been ingested.
 *
 * The service layer must:
 *
 * 1. look for the exact registry observation
 * 2. ask BCCR for the exact date if missing
 * 3. register the authoritative observation
 * 4. only consider a prior observation if BCCR itself
 *    returns no exact observation
 */


export type FxResolutionMode =
  | 'exact'
  | 'latest_applicable_prior_observation'


export type ResolvedFxRate = {
  baseCurrency:
    'USD'

  quoteCurrency:
    'CRC'

  rate:
    number

  rateType:
    'reference_sale'

  source:
    'BCCR'

  analyticalDate:
    string

  effectiveDate:
    string

  resolutionMode:
    FxResolutionMode
}


type StoredFxRate = {
  base_currency:
    string

  quote_currency:
    string

  rate:
    number | string

  rate_type:
    string

  effective_date:
    string

  source:
    string
}


/*
 * ---------------------------------------------------------
 * DATE VALIDATION
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
      `Invalid analytical FX date: ${value}`
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
      `Invalid analytical FX calendar date: ${value}`
    )
  }
}


/*
 * ---------------------------------------------------------
 * RATE NORMALIZATION
 * ---------------------------------------------------------
 */


function normalizeRate(
  value:
    number | string
): number {

  const rate =
    Number(
      value
    )


  if (
    !Number.isFinite(
      rate
    ) ||
    rate <= 0
  ) {
    throw new Error(
      `Stored FX rate is invalid: ${value}`
    )
  }


  return rate
}


/*
 * ---------------------------------------------------------
 * CANONICAL ROW VALIDATION
 * ---------------------------------------------------------
 */


function validateCanonicalRow(
  row:
    StoredFxRate
): void {

  if (
    row.base_currency !==
      'USD' ||
    row.quote_currency !==
      'CRC' ||
    row.rate_type !==
      'reference_sale' ||
    row.source !==
      'BCCR'
  ) {
    throw new Error(
      'FX resolver encountered a non-canonical FX observation.'
    )
  }
}


/*
 * ---------------------------------------------------------
 * ROW → RESOLUTION
 * ---------------------------------------------------------
 */


function createResolvedFxRate({
  row,
  analyticalDate,
  resolutionMode
}: {
  row:
    StoredFxRate

  analyticalDate:
    string

  resolutionMode:
    FxResolutionMode
}): ResolvedFxRate {

  validateCanonicalRow(
    row
  )


  return {
    baseCurrency:
      'USD',

    quoteCurrency:
      'CRC',

    rate:
      normalizeRate(
        row.rate
      ),

    rateType:
      'reference_sale',

    source:
      'BCCR',

    analyticalDate,

    effectiveDate:
      row.effective_date,

    resolutionMode
  }
}


/*
 * ---------------------------------------------------------
 * EXACT RESOLUTION
 * ---------------------------------------------------------
 */


export async function resolveExactHistoricalFxRate(
  analyticalDate:
    string
): Promise<ResolvedFxRate | null> {

  validateIsoDate(
    analyticalDate
  )


  const {
    data,
    error
  } =
    await supabaseAdmin
      .from(
        'fx_rates'
      )
      .select(`
        base_currency,
        quote_currency,
        rate,
        rate_type,
        effective_date,
        source
      `)
      .eq(
        'base_currency',
        'USD'
      )
      .eq(
        'quote_currency',
        'CRC'
      )
      .eq(
        'rate_type',
        'reference_sale'
      )
      .eq(
        'source',
        'BCCR'
      )
      .eq(
        'effective_date',
        analyticalDate
      )
      .maybeSingle()


  if (error) {
    throw new Error(
      `Unable to resolve exact historical FX rate: ${error.message}`
    )
  }


  if (!data) {
    return null
  }


  return createResolvedFxRate({
    row:
      data as StoredFxRate,

    analyticalDate,

    resolutionMode:
      'exact'
  })
}


/*
 * ---------------------------------------------------------
 * PRIOR OBSERVATION RESOLUTION
 * ---------------------------------------------------------
 *
 * This resolver is intentionally separate from exact
 * resolution.
 *
 * It MUST only be used after the service has attempted to
 * obtain the exact analytical date from BCCR.
 */


export async function resolvePriorHistoricalFxRate(
  analyticalDate:
    string
): Promise<ResolvedFxRate | null> {

  validateIsoDate(
    analyticalDate
  )


  const {
    data,
    error
  } =
    await supabaseAdmin
      .from(
        'fx_rates'
      )
      .select(`
        base_currency,
        quote_currency,
        rate,
        rate_type,
        effective_date,
        source
      `)
      .eq(
        'base_currency',
        'USD'
      )
      .eq(
        'quote_currency',
        'CRC'
      )
      .eq(
        'rate_type',
        'reference_sale'
      )
      .eq(
        'source',
        'BCCR'
      )
      .lt(
        'effective_date',
        analyticalDate
      )
      .order(
        'effective_date',
        {
          ascending:
            false
        }
      )
      .limit(
        1
      )
      .maybeSingle()


  if (error) {
    throw new Error(
      `Unable to resolve prior historical FX rate: ${error.message}`
    )
  }


  if (!data) {
    return null
  }


  const row =
    data as StoredFxRate


  if (
    row.effective_date >=
      analyticalDate
  ) {
    throw new Error(
      [
        'Prior FX resolver returned a non-prior observation.',
        `analyticalDate=${analyticalDate}`,
        `effectiveDate=${row.effective_date}`
      ].join(' ')
    )
  }


  return createResolvedFxRate({
    row,

    analyticalDate,

    resolutionMode:
      'latest_applicable_prior_observation'
  })
}