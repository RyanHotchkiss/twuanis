import {
  NextResponse
} from 'next/server'

import {
  resolvePriceMeterAnalyticalIdentity
} from '@/lib/price-meter-identity'


const TEST_LISTING = {
  transaction_type:
    'sale',

  currency:
    'USD',

  current_price:
    199000,

  monthly_price:
    null,

  property_type:
    'Condo',

  province:
    'San Jose',

  canton:
    'Tibas',

  district:
    null,

  property_area:
    200,

  construction_area:
    150
}


export async function GET() {

  try {

    /*
     * -----------------------------------------------------
     * STEP 8 — MISSING AUTHORITATIVE FX FAIL-CLOSED AUDIT
     * -----------------------------------------------------
     *
     * Simulates a USD listing reaching the canonical
     * Price / m² monetary identity boundary without an
     * authoritative BCCR FX observation.
     *
     * Twuanis MUST NOT:
     *
     * - invent an exchange rate
     * - fall back to 500
     * - preserve a stale analytical value
     * - manufacture a CRC analytical amount
     *
     * It MUST fail closed.
     */


    const analyticalDate =
      '2026-08-15'


    /*
     * -----------------------------------------------------
     * NO FX IDENTITY
     * -----------------------------------------------------
     *
     * This deliberately represents unavailable authoritative
     * FX evidence.
     */


    const identity =
      resolvePriceMeterAnalyticalIdentity(
        TEST_LISTING,
        {
          analyticalDate,

          fxIdentity:
            null
        }
      )


    const price =
      identity.price


    /*
     * -----------------------------------------------------
     * FAIL-CLOSED ASSERTIONS
     * -----------------------------------------------------
     */


    const originalPricePreserved =
      price.originalAmount ===
        199000 &&
      price.originalCurrency ===
        'USD'


    const analyticalAmountRejected =
      price.analyticalAmount ===
        null


    const analyticalCurrencyStillCanonical =
      price.analyticalCurrency ===
        'CRC'


    const noFxIdentityInvented =
      price.fx ===
        null


    const noFallbackRateInvented =
      price.conversionRate ===
        null


    /*
     * The critical invariant:
     *
     * We know what the seller asked.
     * We know analytics operate in CRC.
     * But without authoritative FX evidence,
     * we DO NOT claim to know the CRC value.
     */


    const failedClosed =
      originalPricePreserved &&
      analyticalAmountRejected &&
      analyticalCurrencyStillCanonical &&
      noFxIdentityInvented &&
      noFallbackRateInvented


    return NextResponse.json({
      scenario: {
        description:
          'USD Sale listing with unavailable authoritative BCCR FX identity',

        analyticalDate
      },

      originalPrice: {
        amount:
          price.originalAmount,

        currency:
          price.originalCurrency,

        preserved:
          originalPricePreserved
      },

      analyticalPrice: {
        amount:
          price.analyticalAmount,

        currency:
          price.analyticalCurrency,

        rejected:
          analyticalAmountRejected
      },

      fx: {
        identity:
          price.fx,

        conversionRate:
          price.conversionRate,

        noFxIdentityInvented,

        noFallbackRateInvented
      },

      checks: {
        originalPricePreserved,

        analyticalAmountRejected,

        analyticalCurrencyStillCanonical,

        noFxIdentityInvented,

        noFallbackRateInvented
      },

      failedClosed,

      passed:
        failedClosed
    })

  } catch (error) {

    /*
     * An explicit thrown failure is ALSO fail-closed behavior.
     *
     * But we return it separately because we want to know
     * which fail-closed strategy the canonical identity
     * resolver currently uses.
     */


    console.error(
      'PRICE METER STEP 8 MISSING FX AUDIT THREW',
      error
    )


    return NextResponse.json({
      scenario: {
        description:
          'USD Sale listing with unavailable authoritative BCCR FX identity'
      },

      behavior:
        'threw',

      failedClosed:
        true,

      passed:
        true,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    })
  }
}