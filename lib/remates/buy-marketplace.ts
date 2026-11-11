import { generateListingTitle, generateListingDescription } from '@/app/utils/listing-utils'
import type { BankProperty, PublicProperty, PublicResult, ReadResult } from './public-types'
import type { ResolvedFxRate } from '@/lib/fx/fx-resolver'
import { convertUsdToCrc } from '@/lib/currency-conversion'

// Project public evidence into the existing Buy card/filter contract. Unknowns stay unknown.
function propertyFields(property: PublicProperty, language: 'en' | 'es') {
  const term = (type: string) => {
    const terms = property.terms.filter(value => value.type === type)
    return terms.length === 1 ? terms[0] : undefined
  }
  const propertyType = term('property_type')
  // The existing ES selector uses 'commercial'; EN uses 'Commercial Property'.
  const typeFilter = language === 'es' && propertyType?.en === 'Commercial Property'
    ? 'commercial' : propertyType?.en
  return {
    canonical_property_id: property.id,
    canonical_terms: property.terms,
    province: term('province')?.en,
    canton: term('canton')?.en,
    district: term('district')?.en,
    property_type: typeFilter,
    marketplace_property_type_label: propertyType?.[language],
    property_area: property.area,
    construction_area: property.construction_area ?? null,
  }
}
export function projectBuyBankListing(item: BankProperty, language: 'en' | 'es', fx: ResolvedFxRate | null) {
  const amount = item.amount === null ? null : Number(item.amount)
  const validAmount = amount !== null && Number.isFinite(amount) && amount > 0
  const price = validAmount && item.currency === 'CRC' ? amount
    : validAmount && item.currency === 'USD' && fx ? convertUsdToCrc(amount!, fx.rate) : null
  const candidates = item.properties.map(property => propertyFields(property, language))
  const consensus = (field: keyof ReturnType<typeof propertyFields>) => {
    const values = candidates.map(value => value[field])
    return values.length && values.every(value => value === values[0]) ? values[0] : undefined
  }
  return {
    id: item.id, market: 'remates' as const,
    // Never publish retained bank prose. Use only canonical fields exposed by the public reader.
    title: generateListingTitle({property_type: consensus('marketplace_property_type_label'), district: consensus('district'), canton: consensus('canton')}, language),
    description: generateListingDescription({property_area: candidates.length === 1 ? candidates[0].property_area : undefined}, language),
    // References are property-scoped and display-authorized at the database boundary.
    images: item.properties.flatMap(property => property.images || []),
    offering_id: item.offering_id, institution_id: item.institution_id,
    bank_evidence: item, bank_filter_candidates: candidates,
    province: consensus('province'), canton: consensus('canton'), district: consensus('district'),
    property_type: consensus('property_type'), marketplace_property_type_label: consensus('marketplace_property_type_label'),
    // Multiple parcels have no invented aggregate area.
    property_area: candidates.length === 1 ? candidates[0].property_area : undefined,
    construction_area: candidates.length === 1 ? candidates[0].construction_area : undefined,
    marketplace_original_price: item.amount, marketplace_original_currency: item.currency,
    marketplace_price_crc: price, marketplace_fx: fx,
  }
}
export type BuyBankListing = ReturnType<typeof projectBuyBankListing>
export function buyBankFilterCandidates(listing: BuyBankListing) {
  return listing.bank_filter_candidates.length
    ? listing.bank_filter_candidates.map(property => ({ ...listing, ...property })) : [listing]
}
// The existing Buy grid shows all results; consume the canonical reader's pages in order.
// Reject inconsistent/duplicate populations rather than silently publishing a partial cohort.
export async function collectBuyBankPages<T extends { id: string }>(
  read: (page: number) => Promise<ReadResult<Omit<PublicResult, 'items'> & { items: T[] }>>,
  cancelled: () => boolean = () => false,
  pageSize: 20 | 50 = 20,
): Promise<T[]> {
  const items: T[] = [], ids = new Set<string>(); let count: number | undefined
  for (let page = 0; page <= 9999; page++) {
    if (cancelled()) return []
    const result = await read(page)
    if (!result.ok) throw new Error('Bank listings unavailable')
    if (!result.data.enabled) return []
    const data = result.data
    if (data.page !== page || (count !== undefined && data.count !== count)) throw new Error('Bank population changed')
    count = data.count
    for (const item of data.items) {
      if (ids.has(item.id)) throw new Error('Duplicate bank listing')
      ids.add(item.id); items.push(item)
    }
    if (items.length === count) return items
    if (items.length > count || data.items.length !== pageSize) throw new Error('Incomplete bank population')
  }
  throw new Error('Bank population exceeds reader bounds')
}
