import 'server-only'
import type { PriceMeterComparisonRequest } from '@/lib/price-meter-comparison-request'

export type PriceMeterComparisonPermit = Readonly<{ kind: 'price-meter-comparison' }>
const permits = new WeakMap<PriceMeterComparisonPermit, string>()
export function issuePriceMeterComparisonPermit(request: PriceMeterComparisonRequest, language: 'en' | 'es') {
  const permit = Object.freeze({ kind: 'price-meter-comparison' as const })
  permits.set(permit, language + ':' + JSON.stringify(request))
  return permit
}
export function consumePriceMeterComparisonPermit(permit: PriceMeterComparisonPermit | undefined, request: PriceMeterComparisonRequest, language: 'en' | 'es') {
  const identity = permit && permits.get(permit)
  if (permit) permits.delete(permit)
  if (!identity || identity !== language + ':' + JSON.stringify(request)) {
    throw new Error('Price / m² comparison requires an explicit authorized Compare action.')
  }
}
