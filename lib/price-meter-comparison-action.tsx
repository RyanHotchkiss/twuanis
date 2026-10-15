'use server'

import { authorizePriceMeterIntelligenceExecution } from '@/lib/price-meter-authorization'
import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { parsePriceMeterComparisonRequest } from '@/lib/price-meter-comparison-request-parser'
import { issuePriceMeterComparisonPermit } from '@/lib/price-meter-comparison-permit'
import { getPriceMeterComparisonAnalysis } from '@/lib/price-meter-comparison-engine'
import EnglishResults from '@/app/price-per-square-meter/PriceMeterComparisonResults'
import SpanishResults from '@/app/es/precio-por-metro-cuadrado/ResultadosComparacionPrecioMetro'

export async function executePriceMeterComparison(input: unknown, language: 'en' | 'es') {
  await authorizePriceMeterIntelligenceExecution('cap-user-defined-cohort-price-m2-comparison')
  if ((language !== 'en' && language !== 'es') || !input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid comparison request.')
  }
  const params: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (typeof value !== 'string') throw new Error('Invalid comparison filter.')
    params[key] = value
  }
  // Resolve identities on the server; browser-provided term objects are never authority.
  const options = await getExplorerOptions()
  const request = parsePriceMeterComparisonRequest({ params, options })
  const permit = issuePriceMeterComparisonPermit(request, language)
  const analysis = await getPriceMeterComparisonAnalysis({ request, language, permit })
  // Render the existing presentation on the server, without exporting raw cohort populations.
  return language === 'es' ? <SpanishResults analysis={analysis} /> : <EnglishResults analysis={analysis} />
}
