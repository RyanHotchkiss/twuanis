import { convertCrcToUsd, convertUsdToCrc } from './currency-conversion'

export function monetaryPreview(amount: unknown, currency: unknown, unit: 'major' | 'crc_millions', rate: number | null, language: 'en' | 'es') {
  const original = Number(amount)
  const missing = language === 'es' ? 'Aún No Definido' : 'Not Yet Defined'
  if (!Number.isFinite(original) || original <= 0 || !['CRC', 'USD'].includes(String(currency)) || (unit === 'crc_millions' && currency !== 'CRC')) return missing
  const value = unit === 'crc_millions' ? original * 1_000_000 : original
  if (!Number.isFinite(value)) return missing
  const format = (n: number, c: string) => new Intl.NumberFormat(language === 'es' ? 'es-CR' : 'en-US', { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n) + ' ' + c
  const native = format(value, String(currency))
  if (rate === null || !Number.isFinite(rate) || rate <= 0) return native + ' · ' + (language === 'es' ? 'Conversión no disponible' : 'Conversion unavailable')
  const target = currency === 'CRC' ? 'USD' : 'CRC'
  const converted = currency === 'CRC' ? convertCrcToUsd(value, rate) : convertUsdToCrc(value, rate)
  return native + ' · ≈ ' + format(converted, target)
}
