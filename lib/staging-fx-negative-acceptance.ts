import 'server-only'
import {getHistoricalUsdToCrcRate} from './fx/fx-service'
import {resolveExactHistoricalFxRate, resolvePriorHistoricalFxRate} from './fx/fx-resolver'
import {normalizeAmountToCrc} from './currency-conversion'
import {resolvePriceMeterPriceIdentity, normalizePriceMeterCurrency} from './price-meter-identity'

// Fixed probes only. No analytical execution, arbitrary dates, registry writes,
// transport replacement, or provider credentials are permitted by this contract.
export async function runStagingFxNegativeAcceptance() {
  if (process.env.BCCR_API_TOKEN) throw new Error('Provider credential must be absent')
  const checks: Record<string, boolean> = {}
  const genuine = await resolveExactHistoricalFxRate('2026-10-10')
  if (!genuine || genuine.rate !== 455.60 || genuine.source !== 'BCCR' ||
      genuine.effectiveDate !== '2026-10-10' || genuine.resolutionMode !== 'exact') {
    throw new Error('Reviewed historical evidence prerequisite differs')
  }
  checks.genuineHistoricalResolution = (await getHistoricalUsdToCrcRate('2026-10-10')).rate === genuine.rate
  checks.missingExactEvidence = (await resolveExactHistoricalFxRate('2026-10-09')) === null
  if (!checks.missingExactEvidence) throw new Error('Reviewed missing-date prerequisite differs')
  try { await getHistoricalUsdToCrcRate('2026-10-09'); checks.unconfiguredProviderDenied = false }
  catch (e) { checks.unconfiguredProviderDenied = e instanceof Error && e.message === 'BCCR_API_TOKEN is not configured.' }
  for (const [key, date] of [['invalidDateFormat', 'not-a-date'], ['invalidCalendarDate', '2026-02-30']] as const) {
    try { await getHistoricalUsdToCrcRate(date); checks[key] = false }
    catch (e) { checks[key] = e instanceof Error && e.message.startsWith('Invalid FX service') }
  }
  try {
    normalizeAmountToCrc({amount: 1, currency: 'EUR' as 'USD', usdToCrcRate: genuine.rate})
    checks.unsupportedCurrencyDenied = false
  } catch (e) { checks.unsupportedCurrencyDenied = e instanceof Error && e.message === 'Unsupported currency: EUR' }
  // In-memory negative monetary inputs, never persisted as listings or FX evidence.
  const money = {transactionType: 'sale' as const, currentPrice: 1, monthlyPrice: null, analyticalDate: '2026-10-10', fxIdentity: null}
  const usd = resolvePriceMeterPriceIdentity({...money, currency: 'USD'})
  checks.analyticalBoundaryMissingFx = usd.originalAmount === 1 && usd.analyticalAmount === null && usd.fx === null && usd.conversionRate === null
  const unsupported = resolvePriceMeterPriceIdentity({...money, currency: normalizePriceMeterCurrency('EUR')})
  checks.analyticalBoundaryUnsupportedCurrency = unsupported.analyticalAmount === null
  // This verifies the prior reader, not the service's provider-dependent fallback.
  const prior = await resolvePriorHistoricalFxRate('2026-10-11')
  checks.genuinePriorReader = prior?.effectiveDate === genuine.effectiveDate && prior.rate === genuine.rate
  return {scope: 'shared-fx-boundaries', checks, passed: Object.values(checks).every(Boolean)}
}
