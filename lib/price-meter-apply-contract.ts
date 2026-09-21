// Browser-safe configuration validation only. No analytical imports.
export const PRICE_METER_APPLY_FILTER_KEYS = [
  'transaction_type', 'province', 'canton', 'district', 'property_type',
  'bedrooms', 'bathrooms', 'parking', 'year_built', 'property_area',
  'construction_area', 'utility', 'environment', 'terrain', 'accessibility',
  'legal_status', 'distance_to_paved_road_range'
] as const

export type PriceMeterApplyFilters = Partial<Record<
  typeof PRICE_METER_APPLY_FILTER_KEYS[number], string
>>

export function priceMeterFilterConfiguration(value: unknown): PriceMeterApplyFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid filter configuration.')
  }
  const input = value as Record<string, unknown>
  const filters: PriceMeterApplyFilters = {}
  for (const key of PRICE_METER_APPLY_FILTER_KEYS) {
    if (input[key] === undefined || input[key] === '') continue
    if (typeof input[key] !== 'string') throw new Error('Invalid filter value.')
    filters[key] = input[key]
  }
  return filters
}

export function validatePriceMeterApply(value: unknown): PriceMeterApplyFilters {
  const filters = priceMeterFilterConfiguration(value)
  if (!filters.province?.trim() || !filters.canton?.trim() ||
      !filters.property_type?.trim() ||
      (filters.transaction_type !== 'sale' && filters.transaction_type !== 'rent')) {
    throw new Error('Province, Canton, Transaction Type and Property Type are required.')
  }
  return filters
}

export function priceMeterConfigurationKey(value: unknown): string {
  return JSON.stringify(priceMeterFilterConfiguration(value))
}
