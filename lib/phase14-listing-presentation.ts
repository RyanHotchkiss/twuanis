import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { hydrateCanonicalPopulation } from './canonical-population'
import { resolveListingOriginalMonetaryValue } from './listing-monetary-value'
import type { Phase14ListingPresentation } from './comparative-discovery-contract'

export const PHASE14_PRESENTATION_CHUNK = 25
// Same public active-listing authority as public-listings-server; no contacts, descriptions or source identities.
const columns = 'id,title,images,current_price,monthly_price,currency,transaction_type,canonical_domain_version,property_area,construction_area'
const text = (v: unknown): string | null => typeof v === 'string' && v.trim() ? v : null
const number = (v: unknown): number | null => (typeof v === 'number' || typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null
function thumbnail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:' ? value : null } catch { return value.startsWith('/') && !value.startsWith('//') ? value : null }
}
export async function getPhase14ListingPresentation(ids: readonly string[], transaction: 'sale' | 'rent'): Promise<Phase14ListingPresentation[]> {
  const unique = [...new Set(ids)], output: Phase14ListingPresentation[] = []
  for (let offset = 0; offset < unique.length; offset += PHASE14_PRESENTATION_CHUNK) {
    const chunk = unique.slice(offset, offset + PHASE14_PRESENTATION_CHUNK), wanted = new Set(chunk)
    const { data, error } = await supabaseAdmin.from('listings').select(columns).in('id', chunk)
      .eq('listing_status', 'active').eq('canonical_domain_version', 1).eq('transaction_type', transaction)
    if (error || !Array.isArray(data) || data.length > chunk.length) throw new Error('Listing presentation unavailable.')
    const seen = new Set<string>()
    for (const row of data) {
      if (!wanted.has(row.id) || seen.has(row.id) || row.canonical_domain_version !== 1 || row.transaction_type !== transaction) throw new Error('Listing presentation unavailable.')
      seen.add(row.id)
    }
    // Reuse the ordinary canonical public reader, never the analytical execution envelope.
    const rows = await hydrateCanonicalPopulation(data)
    for (const source of rows) {
      const row = source as typeof source & Record<string, unknown>
      const money = resolveListingOriginalMonetaryValue(row)
      output.push({ listingId: row.id, title: text(row.title), thumbnail: thumbnail(Array.isArray(row.images) ? row.images[0] : null),
        price: money?.amount ?? null, currency: money?.currency ?? null,
        propertyArea: number(row.property_area), constructionArea: number(row.construction_area),
        bedrooms: number(row.bedrooms), bathrooms: number(row.bathrooms), parking: number(row.parking), yearBuilt: number(row.year_built),
        province: text(row.province), canton: text(row.canton), district: text(row.district) })
    }
  }
  return output
}
