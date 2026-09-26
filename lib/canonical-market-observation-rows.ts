import 'server-only'
import { resolveCanonicalMarketRequest,canonicalMarketFilterBoundary } from './canonical-market-request'
import { acquireCanonicalMarketRows } from './canonical-market-acquisition'
import { hydrateCanonicalPopulation } from './canonical-population'
// Analytical hydration only: no titles, images, descriptions, contacts, source
// metadata, legacy price authority, or unrelated optional analytical questions.
export async function loadCanonicalMarketObservationRows(filters:Record<string,string|undefined>){
  const request=await resolveCanonicalMarketRequest(filters)
  const {rows,evidence}=await acquireCanonicalMarketRows(request,canonicalMarketFilterBoundary(request),
    ['canonical_domain_version','transaction_type','currency','current_price','monthly_price','property_area','construction_area'],true)
  return hydrateCanonicalPopulation(rows as Array<{id:string;canonical_domain_version:number;transaction_type:string}&Record<string,any>>,evidence,[])
}
