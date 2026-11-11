import { convertCrcToUsd, convertUsdToCrc } from './currency-conversion'

export const buyPriceRanges = [
  { key: '₡0 - ₡25M', min: 0, max: 25_000_000 },
  { key: '₡25M - ₡75M', min: 25_000_000, max: 75_000_000 },
  { key: '₡75M - ₡150M', min: 75_000_000, max: 150_000_000 },
  { key: '₡150M - ₡250M', min: 150_000_000, max: 250_000_000 },
  { key: '₡250M - ₡500M', min: 250_000_000, max: 500_000_000 },
  { key: '₡500M - ₡1B', min: 500_000_000, max: 1_000_000_000 },
  { key: '₡1B+', min: 1_000_000_000, max: null }
] as const
export const rentPriceRanges = [
  { key: '$0 - $500/mo', min: 0, max: 500 },
  { key: '$500 - $1K/mo', min: 500, max: 1000 },
  { key: '$1K - $2K/mo', min: 1000, max: 2000 },
  { key: '$2K - $5K/mo', min: 2000, max: 5000 },
  { key: '$5K+/mo', min: 5000, max: null }
] as const

// Retain the old serialized open-ended selection without narrowing saved searches.
export const legacyBuyPriceRange = { key: '₡250M+', min: 250_000_000, max: null } as const
export function resolveBuyPriceRange(key: string) {
  return key === legacyBuyPriceRange.key ? legacyBuyPriceRange : buyPriceRanges.find(r => r.key === key)
}

// Sale bands are half-open; Rent preserves its existing inclusive endpoints.
export function matchesMarketplacePriceRange(kind: 'buy' | 'rent', key: string, value: unknown) {
  if (!key) return true
  const range = kind === 'buy' ? resolveBuyPriceRange(key) : rentPriceRanges.find(r => r.key === key)
  const amount = Number(value)
  return !!range && (kind === 'rent' || typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(amount) && (kind === 'buy' ? amount >= 0 : amount > 0) && amount >= range.min && (range.max === null || (kind === 'buy' ? amount < range.max : amount <= range.max))
}

export function priceOptions(kind: 'buy' | 'rent', language: 'en' | 'es', rate: number | null, selectedKey = '') {
  const available = rate !== null && Number.isFinite(rate) && rate > 0
  const format = (amount: number, currency: 'USD' | 'CRC') => new Intl.NumberFormat(language === 'es' ? 'es-CR' : 'en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 2 }).format(amount)
  const ranges = kind === 'buy' ? [...buyPriceRanges, ...(selectedKey === legacyBuyPriceRange.key ? [legacyBuyPriceRange] : [])] : rentPriceRanges
  return ranges.map(range => {
    const convert = (amount: number) => kind === 'buy' ? convertCrcToUsd(amount, rate!) : convertUsdToCrc(amount, rate!)
    const currency = kind === 'buy' ? 'USD' : 'CRC'
    const equivalent = available ? `${format(convert(range.min), currency)}${range.max === null ? '+' : ` – ${format(convert(range.max), currency)}`}` : language === 'es' ? 'Conversión no disponible' : 'Conversion unavailable'
    return { label: range.key, display: language === 'es' ? range.key.replace('/mo', '/mes') : range.key, usd: equivalent, crc: equivalent }
  })
}
