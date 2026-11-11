import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import type {
  BccrFxObservation
} from '@/lib/fx/bccr-provider'


/*
 * ---------------------------------------------------------
 * FX REGISTRY
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Persist canonical historical FX observations without
 * allowing ingestion to silently rewrite monetary history.
 *
 * The registry distinguishes:
 *
 * - new observation
 * - exact duplicate
 * - historical conflict
 *
 * Historical conflicts FAIL CLOSED.
 */


export type FxRegistryResult =
  | {
      status:
        'inserted'

      observation:
        BccrFxObservation
    }

  | {
      status:
        'duplicate'

      observation:
        BccrFxObservation
    }


type StoredFxRate = {
  id:
    string

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

  retrieved_at:
    string

  created_at:
    string
}


/*
 * ---------------------------------------------------------
 * NORMALIZATION
 * ---------------------------------------------------------
 */


function normalizeStoredRate(
  value:
    number | string
): number {

  const normalized =
    Number(
      value
    )


  if (
    !Number.isFinite(
      normalized
    ) ||
    normalized <= 0
  ) {
    throw new Error(
      `Stored FX rate is invalid: ${value}`
    )
  }


  return normalized
}


/*
 * ---------------------------------------------------------
 * CANONICAL IDENTITY VALIDATION
 * ---------------------------------------------------------
 */


function validateCanonicalObservation(
  observation:
    BccrFxObservation
): void {

  if (
    observation.baseCurrency !==
      'USD'
  ) {
    throw new Error(
      `Unsupported FX base currency: ${observation.baseCurrency}`
    )
  }


  if (
    observation.quoteCurrency !==
      'CRC'
  ) {
    throw new Error(
      `Unsupported FX quote currency: ${observation.quoteCurrency}`
    )
  }


  if (
    observation.rateType !==
      'reference_sale'
  ) {
    throw new Error(
      `Unsupported FX rate type: ${observation.rateType}`
    )
  }


  if (
    observation.source !==
      'BCCR'
  ) {
    throw new Error(
      `Unsupported FX source: ${observation.source}`
    )
  }


  if (
    observation.indicatorCode !==
      318
  ) {
    throw new Error(
      `Unexpected BCCR indicator: ${observation.indicatorCode}`
    )
  }


  if (
    !Number.isFinite(
      observation.rate
    ) ||
    observation.rate <=
      0
  ) {
    throw new Error(
      `Invalid FX rate: ${observation.rate}`
    )
  }


  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(
        observation.effectiveDate
      )
  ) {
    throw new Error(
      `Invalid FX effective date: ${observation.effectiveDate}`
    )
  }
}


/*
 * ---------------------------------------------------------
 * EXISTING OBSERVATION LOOKUP
 * ---------------------------------------------------------
 */


async function getExistingObservation(
  observation:
    BccrFxObservation
): Promise<StoredFxRate | null> {

  const {
    data,
    error
  } =
    await supabaseAdmin
      .from(
        'fx_rates'
      )
      .select(`
        id,
        base_currency,
        quote_currency,
        rate,
        rate_type,
        effective_date,
        source,
        retrieved_at,
        created_at
      `)
      .eq(
        'base_currency',
        observation.baseCurrency
      )
      .eq(
        'quote_currency',
        observation.quoteCurrency
      )
      .eq(
        'rate_type',
        observation.rateType
      )
      .eq(
        'effective_date',
        observation.effectiveDate
      )
      .eq(
        'source',
        observation.source
      )
      .maybeSingle()


  if (error) {
    throw new Error(
      `Unable to inspect FX registry: ${error.message}`
    )
  }


  return (
    data as StoredFxRate | null
  )
}


/*
 * ---------------------------------------------------------
 * PERSISTENCE
 * ---------------------------------------------------------
 */


export async function registerFxObservation(
  observation:
    BccrFxObservation
): Promise<FxRegistryResult> {

  validateCanonicalObservation(
    observation
  )


  const existing =
    await getExistingObservation(
      observation
    )


  if (existing) {

    const existingRate =
      normalizeStoredRate(
        existing.rate
      )


    if (
      existingRate ===
        observation.rate
    ) {
      return {
        status:
          'duplicate',

        observation
      }
    }


    /*
     * CRITICAL:
     *
     * Same canonical identity,
     * different historical rate.
     *
     * Never update it automatically.
     */

    throw new Error(
      [
        'FX historical conflict detected.',
        `${observation.source}`,
        `${observation.rateType}`,
        `${observation.effectiveDate}`,
        `stored=${existingRate}`,
        `incoming=${observation.rate}`
      ].join(' ')
    )
  }


  const {
    error
  } =
    await supabaseAdmin
      .from(
        'fx_rates'
      )
      .insert({
        base_currency:
          observation.baseCurrency,

        quote_currency:
          observation.quoteCurrency,

        rate:
          observation.rate,

        rate_type:
          observation.rateType,

        effective_date:
          observation.effectiveDate,

        source:
          observation.source
      })


  if (error) {
    throw new Error(
      `Unable to register FX observation: ${error.message}`
    )
  }


  return {
    status:
      'inserted',

    observation
  }
}