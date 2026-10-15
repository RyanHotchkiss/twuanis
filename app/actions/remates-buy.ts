'use server'

import { readBankProperties } from './remates-public'
import { getCurrentAnalyticalDate } from '@/lib/analysis-date'
import { resolveExactHistoricalFxRate } from '@/lib/fx/fx-resolver'
import { projectBuyBankListing } from '@/lib/remates/buy-marketplace'

// Use the canonical public reader, including its discovery/publication/visibility guards.
// FX lookup is read-only: this UI never acquires or registers provider observations.
export async function readBuyBankPage(page: number, language: 'en' | 'es') {
  if (!Number.isInteger(page) || page < 0 || page > 9999 || !['en', 'es'].includes(language)) return { ok: false as const }
  const result = await readBankProperties({ page: String(page) })
  if (!result.ok) return result
  if (!result.data.enabled) return { ok: true as const, data: { ...result.data, count: 0, items: [] } }
  let fx = null
  if (result.data.enabled && result.data.items.some(item => item.currency === 'USD')) {
    try { fx = await resolveExactHistoricalFxRate(getCurrentAnalyticalDate()) } catch { /* Missing evidence disables CRC normalization only. */ }
  }
  return { ok: true as const, data: { ...result.data, items: result.data.items.map(item => projectBuyBankListing(item, language, fx)) } }
}
