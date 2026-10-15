export type MarketplaceFxEvidence = {
  baseCurrency: 'USD'
  quoteCurrency: 'CRC'
  usdToCrcRate: number
  analyticalDate: string
  effectiveDate: string
  source: 'BCCR'
  rateType: 'reference_sale'
  resolutionMode: 'exact' | 'latest_applicable_prior_observation'
}
export function marketplaceDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (name: string) => parts.find(p => p.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function validateMarketplaceFx(data: unknown, date = marketplaceDate()): MarketplaceFxEvidence | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const validDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
  if (d.baseCurrency !== 'USD' || d.quoteCurrency !== 'CRC' || typeof d.usdToCrcRate !== 'number' || !Number.isFinite(d.usdToCrcRate) || d.usdToCrcRate <= 0 || d.source !== 'BCCR' || d.rateType !== 'reference_sale' || !validDate(d.analyticalDate) || !validDate(d.effectiveDate) || d.analyticalDate !== date) return null
  if (d.resolutionMode === 'exact' ? d.effectiveDate !== date : d.resolutionMode !== 'latest_applicable_prior_observation' || d.effectiveDate >= date) return null
  return { baseCurrency: 'USD', quoteCurrency: 'CRC', usdToCrcRate: d.usdToCrcRate, analyticalDate: d.analyticalDate, effectiveDate: d.effectiveDate, source: 'BCCR', rateType: 'reference_sale', resolutionMode: d.resolutionMode as MarketplaceFxEvidence['resolutionMode'] }
}
