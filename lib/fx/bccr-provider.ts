import 'server-only'

/*
 * ---------------------------------------------------------
 * BCCR FX PROVIDER
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Retrieve authoritative USD → CRC exchange-rate
 * observations from the Banco Central de Costa Rica.
 *
 * Canonical Twuanis FX policy:
 *
 * - Base currency: USD
 * - Quote currency: CRC
 * - Analytical currency: CRC
 * - Rate type: BCCR Reference Sale
 * - BCCR indicator: 318
 *
 * This provider:
 *
 * - calls BCCR's supported SDDE REST API
 * - retrieves JSON
 * - validates indicator identity
 * - validates dates
 * - validates numeric rates
 * - preserves authoritative BCCR effective dates
 *
 * This provider DOES NOT:
 *
 * - write to Supabase
 * - choose weekend / holiday fallback
 * - decide which historical observation an analysis uses
 * - perform Price / m² calculations
 * - mutate historical FX observations
 */


const BCCR_API_BASE =
  'https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API'


const BCCR_REFERENCE_SALE_INDICATOR: 318 =
  318


export type BccrFxObservation = {
  baseCurrency:
    'USD'

  quoteCurrency:
    'CRC'

  rate:
    number

  rateType:
    'reference_sale'

  effectiveDate:
    string

  source:
    'BCCR'

  indicatorCode:
    318
}


/*
 * ---------------------------------------------------------
 * BCCR RESPONSE TYPES
 * ---------------------------------------------------------
 */


type BccrSeriesPoint = {
  fecha:
    string

  valorDatoPorPeriodo:
    number | null
}


type BccrIndicatorSeries = {
  codigoIndicador:
    string

  nombreIndicador:
    string

  series:
    BccrSeriesPoint[]
}


type BccrSeriesResponse = {
  estado:
    boolean

  mensaje:
    string

  datos:
    BccrIndicatorSeries[]
}


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
      `Invalid ISO date for BCCR FX lookup: ${value}`
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
      `Invalid calendar date for BCCR FX lookup: ${value}`
    )
  }
}


function isoDateToBccrDate(
  value:
    string
): string {

  validateIsoDate(
    value
  )


  return value
    .replace(
      /-/g,
      '/'
    )
}


/*
 * ---------------------------------------------------------
 * CONFIGURATION
 * ---------------------------------------------------------
 */


function getBccrToken(): string {

  const token =
    process.env
      .BCCR_API_TOKEN
      ?.trim()


  if (!token) {
    throw new Error(
      'BCCR_API_TOKEN is not configured.'
    )
  }


  return token
}


/*
 * ---------------------------------------------------------
 * SERIES VALIDATION
 * ---------------------------------------------------------
 */


function normalizeBccrDate(
  value:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})/
      .exec(
        value
      )


  if (!match) {
    throw new Error(
      `Unable to parse BCCR observation date: ${value}`
    )
  }


  return [
    match[1],
    match[2],
    match[3]
  ].join('-')
}


function validateRate(
  value:
    number | null,

  effectiveDate:
    string
): number {

  if (
    value === null ||
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    throw new Error(
      `BCCR returned an invalid Reference Sale rate for ${effectiveDate}.`
    )
  }


  return value
}


/*
 * ---------------------------------------------------------
 * PROVIDER
 * ---------------------------------------------------------
 */


export async function fetchBccrReferenceSaleRates({
  startDate,
  endDate
}: {
  startDate:
    string

  endDate:
    string
}): Promise<BccrFxObservation[]> {

  validateIsoDate(
    startDate
  )

  validateIsoDate(
    endDate
  )


  if (
    startDate >
      endDate
  ) {
    throw new Error(
      `BCCR FX start date ${startDate} is after end date ${endDate}.`
    )
  }


  const token =
    getBccrToken()


  const url =
    new URL(
      `${BCCR_API_BASE}/indicadoresEconomicos/${BCCR_REFERENCE_SALE_INDICATOR}/series`
    )


  url.searchParams.set(
    'fechaInicio',
    isoDateToBccrDate(
      startDate
    )
  )

  url.searchParams.set(
    'fechaFin',
    isoDateToBccrDate(
      endDate
    )
  )

  url.searchParams.set(
    'idioma',
    'ES'
  )


  const response =
    await fetch(
      url,
      {
        method:
          'GET',

        cache:
          'no-store',

        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${token}`
        }
      }
    )


  if (!response.ok) {
    throw new Error(
      `BCCR FX request failed with HTTP ${response.status}.`
    )
  }


  const body =
  (await response.json()) as BccrSeriesResponse


  if (
    !body ||
    body.estado !==
      true
  ) {
    throw new Error(
      `BCCR FX request failed: ${
        body?.mensaje ||
        'Unknown BCCR response error'
      }`
    )
  }


  if (
    !Array.isArray(
      body.datos
    ) ||
    body.datos.length ===
      0
  ) {
    throw new Error(
      `BCCR returned no Reference Sale series for ${startDate} through ${endDate}.`
    )
  }


  const indicator =
    body.datos.find(
      item =>
        String(
          item.codigoIndicador
        ) ===
        String(
          BCCR_REFERENCE_SALE_INDICATOR
        )
    )


  if (!indicator) {
    throw new Error(
      `BCCR response did not contain indicator ${BCCR_REFERENCE_SALE_INDICATOR}.`
    )
  }


  if (
    !Array.isArray(
      indicator.series
    )
  ) {
    throw new Error(
      'BCCR Reference Sale series was malformed.'
    )
  }


  const observations =
    indicator.series
      .map(
        point => {

          const effectiveDate =
            normalizeBccrDate(
              point.fecha
            )


          const rate =
            validateRate(
              point.valorDatoPorPeriodo,
              effectiveDate
            )


          return {
            baseCurrency:
              'USD' as const,

            quoteCurrency:
              'CRC' as const,

            rate,

            rateType:
              'reference_sale' as const,

            effectiveDate,

            source:
              'BCCR' as const,

            indicatorCode:
              BCCR_REFERENCE_SALE_INDICATOR
          }
        }
      )
      .filter(
        observation =>
          observation.effectiveDate >=
            startDate &&
          observation.effectiveDate <=
            endDate
      )
      .sort(
        (
          left,
          right
        ) =>
          left.effectiveDate
            .localeCompare(
              right.effectiveDate
            )
      )


  return observations
}


/*
 * ---------------------------------------------------------
 * SINGLE-DATE PROVIDER
 * ---------------------------------------------------------
 *
 * This function requests one exact calendar date.
 *
 * It intentionally does NOT substitute a previous business
 * day when BCCR has no observation for that date.
 *
 * Weekend / holiday fallback belongs in the canonical
 * FX resolver above this provider.
 */


export async function fetchBccrReferenceSaleRate(
  effectiveDate:
    string
): Promise<BccrFxObservation | null> {

  const observations =
    await fetchBccrReferenceSaleRates({
      startDate:
        effectiveDate,

      endDate:
        effectiveDate
    })


  const exactObservation =
    observations.find(
      observation =>
        observation.effectiveDate ===
          effectiveDate
    )


  return (
    exactObservation ??
    null
  )
}