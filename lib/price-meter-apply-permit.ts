import 'server-only'
import { priceMeterConfigurationKey, validatePriceMeterApply } from '@/lib/price-meter-apply-contract'

export type PriceMeterApplyPermit = Readonly<{ kind: 'price-meter-apply' }>
// Ephemeral capabilities, never serialized, persisted, or reconstructed from a URL.
const permits = new WeakMap<PriceMeterApplyPermit, string>()

export function issuePriceMeterApplyPermit(filters: unknown, language: 'en' | 'es'): PriceMeterApplyPermit {
  validatePriceMeterApply(filters)
  const permit = Object.freeze({ kind: 'price-meter-apply' as const })
  permits.set(permit, language + ':' + priceMeterConfigurationKey(filters))
  return permit
}

export function consumePriceMeterApplyPermit(
  permit: PriceMeterApplyPermit | undefined, filters: unknown, language: 'en' | 'es'
): void {
  const identity = permit && permits.get(permit)
  if (permit) permits.delete(permit)
  if (!identity || identity !== language + ':' + priceMeterConfigurationKey(filters)) {
    throw new Error('Ordinary PPM2 requires an explicit valid Apply execution.')
  }
  validatePriceMeterApply(filters)
}
