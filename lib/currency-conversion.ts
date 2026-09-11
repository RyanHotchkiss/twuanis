/*
 * ---------------------------------------------------------
 * CANONICAL CURRENCY CONVERSION
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Perform deterministic currency arithmetic using an
 * exchange rate that has already been resolved by an
 * authoritative Twuanis FX boundary.
 *
 * IMPORTANT:
 *
 * This module does NOT:
 *
 * - choose an exchange rate
 * - resolve an analytical date
 * - call BCCR
 * - query the FX registry
 * - provide a fallback exchange rate
 * - infer currency from monetary magnitude
 *
 * Exchange-rate selection belongs to the canonical
 * server-side FX system.
 */


export type TwuanisCurrency =
  | 'USD'
  | 'CRC'


function validateAmount(
  amount:
    number
): number {

  if (
    !Number.isFinite(
      amount
    ) ||
    amount < 0
  ) {
    throw new Error(
      `Invalid monetary amount: ${amount}`
    )
  }


  return amount
}


function validateUsdToCrcRate(
  rate:
    number
): number {

  if (
    !Number.isFinite(
      rate
    ) ||
    rate <= 0
  ) {
    throw new Error(
      `Invalid USD to CRC exchange rate: ${rate}`
    )
  }


  return rate
}


export function convertUsdToCrc(
  amount:
    number,

  usdToCrcRate:
    number
): number {

  return (
    validateAmount(
      amount
    ) *
    validateUsdToCrcRate(
      usdToCrcRate
    )
  )
}


export function convertCrcToUsd(
  amount:
    number,

  usdToCrcRate:
    number
): number {

  return (
    validateAmount(
      amount
    ) /
    validateUsdToCrcRate(
      usdToCrcRate
    )
  )
}


export function normalizeAmountToCrc({
  amount,
  currency,
  usdToCrcRate
}: {
  amount:
    number

  currency:
    TwuanisCurrency

  usdToCrcRate:
    number
}): number {

  validateAmount(
    amount
  )


  if (
    currency ===
      'CRC'
  ) {
    return amount
  }


  if (
    currency ===
      'USD'
  ) {
    return convertUsdToCrc(
      amount,
      usdToCrcRate
    )
  }


  /*
   * Runtime defense.
   *
   * TypeScript protects known callers, but values crossing
   * database, API, or untyped boundaries must still fail
   * closed rather than silently assume a currency.
   */

  throw new Error(
    `Unsupported currency: ${String(currency)}`
  )
}


export function normalizeAmountToUsd({
  amount,
  currency,
  usdToCrcRate
}: {
  amount:
    number

  currency:
    TwuanisCurrency

  usdToCrcRate:
    number
}): number {

  validateAmount(
    amount
  )


  if (
    currency ===
      'USD'
  ) {
    return amount
  }


  if (
    currency ===
      'CRC'
  ) {
    return convertCrcToUsd(
      amount,
      usdToCrcRate
    )
  }


  throw new Error(
    `Unsupported currency: ${String(currency)}`
  )
}