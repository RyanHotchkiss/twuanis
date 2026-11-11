'use server'

import {validateMarketplacePage} from '@/lib/marketplace-pagination'
import { readBankProperties } from './remates-public'
import { getCurrentAnalyticalDate } from '@/lib/analysis-date'
import { resolveExactHistoricalFxRate } from '@/lib/fx/fx-resolver'
import { projectBuyBankListing } from '@/lib/remates/buy-marketplace'

// Use the canonical public reader, including its discovery/publication/visibility guards.
// FX lookup is read-only: this UI never acquires or registers provider observations.
export async function readBuyBankPage(page: number, language: 'en' | 'es', options?:{size:number;filters:Record<string,unknown>}) {
  if (!Number.isInteger(page) || page < 0 || page > 9999 || !['en', 'es'].includes(language)) return { ok: false as const }
  const analyticalDate=getCurrentAnalyticalDate()
  let fx=null
  let query:Record<string,string>={page:String(page)}
  if(options){
   try{validateMarketplacePage(page+1,options.size,options.filters)}catch{return {ok:false as const}}
   const filters={...options.filters};if(language==='es'&&filters.property_type==='commercial')filters.property_type='Commercial Property'
   query={...query,page_size:String(options.size),filters:JSON.stringify(filters)}
   if(filters.price_range){try{fx=await resolveExactHistoricalFxRate(analyticalDate);if(fx)query.fx=String(fx.rate)}catch{/* Unknown conversion fails closed in the existing predicate. */}}
  }
  const result = await readBankProperties(query)
  if (!result.ok) return result
  if (!result.data.enabled) return { ok: true as const, data: { ...result.data, count: 0, items: [] } }
  if (fx===null && result.data.enabled && result.data.items.some(item => item.currency === 'USD')) {
    try { fx = await resolveExactHistoricalFxRate(analyticalDate) } catch { /* Missing evidence disables CRC normalization only. */ }
  }
  return { ok: true as const, data: { ...result.data, items: result.data.items.map(item => projectBuyBankListing(item, language, fx)) } }
}
