import { convertCrcToUsd, convertUsdToCrc } from './currency-conversion'

export const buyPriceRanges = [
  { key: '₡0 - ₡25M', min: 0, max: 25_000_000 },
  { key: '₡25M - ₡75M', min: 25_000_000, max: 75_000_000 },
  { key: '₡75M - ₡150M', min: 75_000_000, max: 150_000_000 },
  { key: '₡150M - ₡250M', min: 150_000_000, max: 250_000_000 },
  { key: '₡250M+', min: 250_000_000, max: null }
] as const
export const rentPriceRanges = [
  { key: '$0 - $500/mo', min: 0, max: 500 },
  { key: '$500 - $1K/mo', min: 500, max: 1000 },
  { key: '$1K - $2K/mo', min: 1000, max: 2000 },
  { key: '$2K - $5K/mo', min: 2000, max: 5000 },
  { key: '$5K+/mo', min: 5000, max: null }
] as const

// Inclusive endpoints preserve the existing marketplace contract.
export function matchesMarketplacePriceRange(kind: 'buy' | 'rent', key: string, value: unknown) {
  if (!key) return true
  const range = (kind === 'buy' ? buyPriceRanges : rentPriceRanges).find(r => r.key === key)
  const amount = Number(value)
  return !!range && Number.isFinite(amount) && amount > 0 && amount >= range.min && (range.max === null || amount <= range.max)
}

export function priceOptions(kind: 'buy' | 'rent', language: 'en' | 'es', rate: number | null) {
  const available = rate !== null && Number.isFinite(rate) && rate > 0
  const format = (amount: number, currency: 'USD' | 'CRC') => new Intl.NumberFormat(language === 'es' ? 'es-CR' : 'en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 2 }).format(amount)
  return (kind === 'buy' ? buyPriceRanges : rentPriceRanges).map(range => {
    const convert = (amount: number) => kind === 'buy' ? convertCrcToUsd(amount, rate!) : convertUsdToCrc(amount, rate!)
    const currency = kind === 'buy' ? 'USD' : 'CRC'
    const equivalent = available ? `${format(convert(range.min), currency)}${range.max === null ? '+' : ` – ${format(convert(range.max), currency)}`}` : language === 'es' ? 'Conversión no disponible' : 'Conversion unavailable'
    return { label: range.key, display: language === 'es' ? range.key.replace('/mo', '/mes') : range.key, usd: equivalent, crc: equivalent }
  })
}
