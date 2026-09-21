'use server'

import { authorizePriceMeterIntelligenceExecution } from '@/lib/price-meter-authorization'

import { toPriceMeterBrowserResult } from '@/lib/price-meter-browser-result'

import { validatePriceMeterApply } from '@/lib/price-meter-apply-contract'
import { issuePriceMeterApplyPermit } from '@/lib/price-meter-apply-permit'

// This POST-backed Server Action is called only by the Apply click handler.
// Pages, URL restoration, prefetch, and filter effects never call it.
export async function executePriceMeterApply(
  input: unknown, language: 'en' | 'es', source: 'workspace' | 'standalone'
) {
  await authorizePriceMeterIntelligenceExecution()
  const filters = validatePriceMeterApply(input)
  if ((language !== 'en' && language !== 'es') ||
      (source !== 'workspace' && source !== 'standalone')) {
    throw new Error('Invalid PPM2 Apply request.')
  }
  const engineFilters = { ...filters }
  if (source === 'workspace') {
    // Preserve the workspace's existing option-to-term-name conversion.
    const { getExplorerOptions } = await import('@/lib/explorer-options-engine')
    const options = await getExplorerOptions()
    const keys = ['property_type', 'bedrooms', 'bathrooms', 'parking', 'year_built',
      'property_area', 'construction_area', 'utility', 'environment', 'terrain',
      'accessibility', 'legal_status'] as const
    for (const key of keys) {
      const value = filters[key]
      if (!value) continue
      const match = options[key].find(option =>
        option.slug === value || option.slug_en === value || option.slug_es === value ||
        option.term_name === value || option.term_name_en === value || option.term_name_es === value
      )
      engineFilters[key] = match?.term_name ?? value
    }
  }
  const permit = issuePriceMeterApplyPermit(engineFilters, language)
  const { getPriceMeterAnalysis } = await import('@/lib/price-meter-engine')
  const result = await getPriceMeterAnalysis(engineFilters, language, permit)
  return toPriceMeterBrowserResult(result, filters.transaction_type as 'sale' | 'rent')
}
