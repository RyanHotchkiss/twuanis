import 'server-only'
import {validateGeographicApply,validateGeographicCommand,type GeographicCommand} from './price-meter-geographic-command'
import { priceMeterConfigurationKey, validatePriceMeterApply } from '@/lib/price-meter-apply-contract'

export type PriceMeterApplyPermit = Readonly<{ kind: 'price-meter-apply' }>
// Ephemeral capabilities, never serialized, persisted, or reconstructed from a URL.
const permits = new WeakMap<PriceMeterApplyPermit, string>()

export function issuePriceMeterApplyPermit(filters: unknown, language: 'en' | 'es', geography?:GeographicCommand): PriceMeterApplyPermit {
  if(geography)validateGeographicApply(filters,geography);else validatePriceMeterApply(filters)
  const permit = Object.freeze({ kind: 'price-meter-apply' as const })
  permits.set(permit, language + ':' + priceMeterConfigurationKey(filters) + ':' + (geography?JSON.stringify(validateGeographicCommand(geography)):'ordinary'))
  return permit
}

export function consumePriceMeterApplyPermit(
  permit: PriceMeterApplyPermit | undefined, filters: unknown, language: 'en' | 'es', geography?:GeographicCommand
): void {
  const identity = permit && permits.get(permit)
  if (permit) permits.delete(permit)
  if (!identity || identity !== language + ':' + priceMeterConfigurationKey(filters) + ':' + (geography?JSON.stringify(validateGeographicCommand(geography)):'ordinary')) {
    throw new Error('Ordinary PPM2 requires an explicit valid Apply execution.')
  }
  if(geography)validateGeographicApply(filters,geography);else validatePriceMeterApply(filters)
}
