'use server'
import { resolveMarketIntelligenceWorkspace } from './market-intelligence-workspace'
import { PRICE_METER_APPLY_FILTER_KEYS } from './price-meter-apply-contract'

// Transitional execution gate: retain the existing resolver normalization and
// engine contracts. Navigation never supplies this explicit command.
export async function executeLegacyHubQuestion(engine: unknown, input: unknown, language: 'en' | 'es') {
  if (engine !== 'pricing' && engine !== 'valuation' && engine !== 'buyer-demand') throw Error('Invalid Hub command.')
  if (!['en','es'].includes(language) || !input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid Hub input.')
  const filters: Record<string,string> = {}
  for (const key of PRICE_METER_APPLY_FILTER_KEYS) {
    const value = (input as Record<string,unknown>)[key]
    if (value === undefined || value === '') continue
    if (typeof value !== 'string' || value.length > 4096) throw Error('Invalid Hub filter.')
    filters[key] = value
  }
  const workspace = await resolveMarketIntelligenceWorkspace({params:{...filters,tab:engine},language,explicitLegacyCommand:engine})
  return engine === 'pricing' ? workspace.pricingStrategy : engine === 'valuation' ? workspace.valuation : workspace.buyerDemand
}
