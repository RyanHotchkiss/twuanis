import {
  NextResponse
} from 'next/server'

import {
  saveAnalysis,
  getSavedAnalysesByEngine,
  updateSavedAnalysis,
  deleteSavedAnalysis
} from '@/lib/saved-analyses'


export async function GET() {

  let createdId:
    string | null =
    null


  try {

    /*
     * -----------------------------------------------------
     * HISTORICAL ANALYSIS INTEGRITY AUDIT
     * -----------------------------------------------------
     *
     * Simulate an immutable historical Price / m² result.
     *
     * Carlos will subsequently attempt to influence history.
     */


    const historicalResult = {
      analyticalDate:
        '2026-08-15',

      price: {
        originalAmount:
          199000,

        originalCurrency:
          'USD',

        analyticalAmount:
          89804720,

        analyticalCurrency:
          'CRC',

        fx: {
          conversionApplied:
            true,

          analyticalDate:
            '2026-08-15',

          baseCurrency:
            'USD',

          quoteCurrency:
            'CRC',

          rate:
            451.28,

          rateType:
            'reference_sale',

          effectiveDate:
            '2026-08-15',

          source:
            'BCCR',

          resolutionMode:
            'exact'
        }
      }
    }


    /*
     * -----------------------------------------------------
     * CREATE HISTORICAL FACT
     * -----------------------------------------------------
     */


    const created =
      await saveAnalysis({
        engineType:
        'price-meter',

        language:
          'en',

        name:
          'FX Historical Integrity Audit',

        filters: {
          transaction_type:
            'sale'
        },

        result:
          historicalResult
      })


    createdId =
      created.id


    /*
     * -----------------------------------------------------
     * LEGITIMATE MUTATION
     * -----------------------------------------------------
     *
     * Rename the saved analysis.
     *
     * This is allowed.
     *
     * The analytical result must remain untouched.
     */


    await updateSavedAnalysis(
      created.id,
      {
        name:
          'FX Historical Integrity Audit — Renamed'
      }
    )


    /*
     * -----------------------------------------------------
     * RELOAD FROM PERSISTENCE
     * -----------------------------------------------------
     *
     * Do not trust the in-memory object.
     */


    const savedAnalyses =
    await getSavedAnalysesByEngine(
        'price-meter'
    )


    const reloaded =
    savedAnalyses.find(
        analysis =>
        analysis.id ===
        created.id
    )


    if (!reloaded) {
    throw new Error(
        'Saved historical analysis could not be reloaded.'
    )
    }


    const reloadedResult =
      reloaded.result as
        typeof historicalResult


    const originalFx =
      historicalResult
        .price
        .fx


    const persistedFx =
      reloadedResult
        ?.price
        ?.fx


    /*
     * -----------------------------------------------------
     * REPRODUCE HISTORICAL ANALYTICAL AMOUNT
     * -----------------------------------------------------
     */


    const reconstructedAmount =
      reloadedResult
        .price
        .originalAmount *
      persistedFx
        .rate


    /*
     * -----------------------------------------------------
     * CARLOS APOCALYPSE
     * -----------------------------------------------------
     *
     * Hypothetical current FX:
     *
     * 1 USD = 100 CRC
     *
     * This value MUST have absolutely no bearing on the
     * historical saved analytical result.
     */


    const carlosRate =
      100


    const carlosRecalculatedAmount =
      reloadedResult
        .price
        .originalAmount *
      carlosRate


    const fxPreserved =
      persistedFx.rate ===
        originalFx.rate &&
      persistedFx.effectiveDate ===
        originalFx.effectiveDate &&
      persistedFx.analyticalDate ===
        originalFx.analyticalDate &&
      persistedFx.rateType ===
        originalFx.rateType &&
      persistedFx.source ===
        originalFx.source &&
      persistedFx.resolutionMode ===
        originalFx.resolutionMode


    const analyticalAmountPreserved =
      reloadedResult
        .price
        .analyticalAmount ===
      historicalResult
        .price
        .analyticalAmount


    const reproducible =
      reconstructedAmount ===
      reloadedResult
        .price
        .analyticalAmount


    const carlosRejected =
      reloadedResult
        .price
        .analyticalAmount !==
      carlosRecalculatedAmount


    const metadataMutationAllowed =
      reloaded.name ===
      'FX Historical Integrity Audit — Renamed'


    const passed =
      fxPreserved &&
      analyticalAmountPreserved &&
      reproducible &&
      carlosRejected &&
      metadataMutationAllowed


    const result = {
      historicalFact: {
        originalAmount:
          historicalResult
            .price
            .originalAmount,

        fx:
          originalFx,

        analyticalAmount:
          historicalResult
            .price
            .analyticalAmount
      },

      persistedHistoricalFact: {
        originalAmount:
          reloadedResult
            .price
            .originalAmount,

        fx:
          persistedFx,

        analyticalAmount:
          reloadedResult
            .price
            .analyticalAmount
      },

      reconstruction: {
        amount:
          reconstructedAmount,

        matchesPersistedHistory:
          reproducible
      },

      carlosAttack: {
        hypotheticalCurrentRate:
          carlosRate,

        hypotheticalRecalculatedAmount:
          carlosRecalculatedAmount,

        persistedHistoricalAmount:
          reloadedResult
            .price
            .analyticalAmount,

        rejected:
          carlosRejected
      },

      invariants: {
        fxPreserved,

        analyticalAmountPreserved,

        reproducible,

        metadataMutationAllowed,

        historicalResultMutationAllowed:
          false
      },

      passed
    }


    console.log(
      'SAVED ANALYSIS HISTORICAL INTEGRITY AUDIT',
      result
    )


    return NextResponse.json(
      result
    )

  } catch (error) {

    console.error(
      'SAVED ANALYSIS HISTORICAL INTEGRITY AUDIT FAILED',
      error
    )


    return NextResponse.json(
      {
        passed:
          false,

        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status:
          500
      }
    )

  } finally {

    /*
     * Keep debug garbage out of the user's
     * Saved Analyses.
     */

    if (createdId) {

      try {

        await deleteSavedAnalysis(
          createdId
        )

      } catch (cleanupError) {

        console.error(
          'HISTORICAL INTEGRITY AUDIT CLEANUP FAILED',
          cleanupError
        )
      }
    }
  }
}