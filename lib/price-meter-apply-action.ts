'use server'

import { authorizePriceMeterIntelligenceExecution } from '@/lib/price-meter-authorization'

import { validateSelectedPriceMeterEngines } from './price-meter-selected-contract'

import { validatePriceMeterApply } from '@/lib/price-meter-apply-contract'
import { issuePriceMeterApplyPermit } from '@/lib/price-meter-apply-permit'

// This POST-backed Server Action is called only by the Apply click handler.
// Pages, URL restoration, prefetch, and filter effects never call it.
export async function executePriceMeterApply(
  input: unknown, language: 'en' | 'es', source: 'workspace' | 'standalone', selected:unknown
) {
  await authorizePriceMeterIntelligenceExecution()
  const filters = validatePriceMeterApply(input)
  const engines=validateSelectedPriceMeterEngines(selected)
  if ((language !== 'en' && language !== 'es') ||
      (source !== 'workspace' && source !== 'standalone')) {
    throw new Error('Invalid PPM2 Apply request.')
  }
  const engineFilters = { ...filters }
  // Both entry surfaces submit stable IDs/codes. The canonical request resolver
  // resolves exact identities; display labels never select analytical membership.
  const permit = issuePriceMeterApplyPermit(engineFilters, language)
  const { getSelectedPriceMeterAnalysis } = await import('./price-meter-selected-engine')
  return getSelectedPriceMeterAnalysis(engineFilters, language, permit, engines)
}
