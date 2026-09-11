/*
 * ---------------------------------------------------------
 * CANONICAL LISTING MONETARY VALUE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Interpret the explicit monetary fields stored on a
 * listing and normalize that monetary value using an
 * exchange rate already supplied by an authoritative
 * Twuanis FX boundary.
 *
 * This module owns listing monetary interpretation.
 *
 * It does NOT:
 *
 * - choose an exchange rate
 * - resolve an analytical date
 * - call BCCR
 * - query the FX registry
 * - provide an exchange-rate fallback
 * - infer currency from monetary magnitude
 * - infer currency from listing title or description
 * - invent a monetary value from missing fields
 *
 * Sale compatibility contract:
 *
 * 1. Prefer current_price when it contains a valid,
 *    positive monetary amount.
 * 2. Otherwise permit historical price_millions as a
 *    compatibility fallback and convert that stored
 *    millions representation to its full amount.
 *
 * Rental contract:
 *
 * - Use monthly_price.
 *
 * Currency contract:
 *
 * - Only explicit USD and CRC are accepted.
 * - Unknown or unsupported currency fails closed.
 */


import {
  normalizeAmountToCrc,
  normalizeAmountToUsd,
  type TwuanisCurrency
} from '@/lib/currency-conversion'


export type ListingMonetaryInput = {
  transaction_type?:
    string | null

  currency?:
    string | null

  current_price?:
    number | string | null

  price_millions?:
    number | string | null

  monthly_price?:
    number | string | null
}


export type ListingOriginalMonetaryValue = {
  amount:
    number

  currency:
    TwuanisCurrency
}


function parsePositiveAmount(
  value:
    number | string | null | undefined
): number | null {

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  const amount =
    typeof value === 'number'
      ? value
      : Number(
          String(value).trim()
        )


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null
  }


  return amount
}


export function resolveListingCurrency(
  value:
    string | null | undefined
): TwuanisCurrency | null {

  const normalized =
    value
      ?.trim()
      .toUpperCase()


  if (
    normalized === 'USD' ||
    normalized === 'CRC'
  ) {
    return normalized
  }


  return null
}


function resolveSaleAmount(
  listing:
    ListingMonetaryInput
): number | null {

  const currentPrice =
    parsePositiveAmount(
      listing.current_price
    )


  if (
    currentPrice !== null &&
    currentPrice > 1
  ) {
    return currentPrice
  }


  const priceMillions =
    parsePositiveAmount(
      listing.price_millions
    )


  if (
    priceMillions === null
  ) {
    return null
  }


  return (
    priceMillions *
    1_000_000
  )
}


function resolveRentalAmount(
  listing:
    ListingMonetaryInput
): number | null {

  return parsePositiveAmount(
    listing.monthly_price
  )
}


export function resolveListingOriginalMonetaryValue(
  listing:
    ListingMonetaryInput
): ListingOriginalMonetaryValue | null {

  const transactionType =
    String(
      listing.transaction_type || ''
    )
      .trim()
      .toLowerCase()


  const currency =
    resolveListingCurrency(
      listing.currency
    )


  if (!currency) {
    return null
  }


  let amount:
    number | null


  if (
    transactionType === 'buy' ||
    transactionType === 'sale'
  ) {
    amount =
      resolveSaleAmount(
        listing
      )
  } else if (
    transactionType === 'rent' ||
    transactionType === 'lease'
  ) {
    amount =
      resolveRentalAmount(
        listing
      )
  } else {
    return null
  }


  if (amount === null) {
    return null
  }


  return {
    amount,
    currency
  }
}


export function resolveListingAmountCrc(
  listing:
    ListingMonetaryInput,

  usdToCrcRate:
    number
): number | null {

  const monetaryValue =
    resolveListingOriginalMonetaryValue(
      listing
    )


  if (!monetaryValue) {
    return null
  }


  return normalizeAmountToCrc({
    amount:
      monetaryValue.amount,

    currency:
      monetaryValue.currency,

    usdToCrcRate
  })
}


export function resolveListingAmountUsd(
  listing:
    ListingMonetaryInput,

  usdToCrcRate:
    number
): number | null {

  const monetaryValue =
    resolveListingOriginalMonetaryValue(
      listing
    )


  if (!monetaryValue) {
    return null
  }


  return normalizeAmountToUsd({
    amount:
      monetaryValue.amount,

    currency:
      monetaryValue.currency,

    usdToCrcRate
  })
}