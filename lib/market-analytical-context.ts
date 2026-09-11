import 'server-only'

import {
  getCurrentAnalyticalDate
} from '@/lib/analysis-date'

import {
  getHistoricalUsdToCrcRate
} from '@/lib/fx/fx-service'

import type {
  ResolvedFxRate
} from '@/lib/fx/fx-resolver'


/*
 * ---------------------------------------------------------
 * MARKET ANALYTICAL CONTEXT
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve the shared analytical monetary identity for a
 * Twuanis market-intelligence computation.
 *
 * A single analytical request may calculate multiple
 * statistics, cohorts, comparison sides, or candidate
 * markets.
 *
 * Those calculations should share the same analytical
 * date and the same authoritative FX observation.
 *
 * This context therefore establishes monetary identity
 * before downstream calculation begins.
 */


export type MarketAnalyticalContext = {
  analyticalDate:
    string

  fx:
    ResolvedFxRate
}


/*
 * ---------------------------------------------------------
 * CONTEXT RESOLUTION
 * ---------------------------------------------------------
 */


export async function resolveMarketAnalyticalContext():
  Promise<MarketAnalyticalContext> {

  const analyticalDate =
    getCurrentAnalyticalDate()


  const fx =
    await getHistoricalUsdToCrcRate(
      analyticalDate
    )


  /*
   * Defensive invariant:
   *
   * The FX service must return a resolution associated
   * with the analytical date requested by this context.
   */

  if (
    fx.analyticalDate !==
      analyticalDate
  ) {
    throw new Error(
      [
        'Resolved FX analytical date does not match',
        'the market analytical context.',
        `requested=${analyticalDate}`,
        `resolved=${fx.analyticalDate}`
      ].join(' ')
    )
  }


  return {
    analyticalDate,
    fx
  }
}