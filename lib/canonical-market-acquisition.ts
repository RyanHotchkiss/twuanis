import 'server-only'
import { readCanonicalListingEvidence } from './canonical-listing-reader'
import { readCanonicalMarketScalars, countCanonicalMarket, type CanonicalMarketBoundary, type MarketScalarField } from './canonical-market-population'
import type { CanonicalMarketRequest } from './canonical-market-request'
import { marketNumericalStates } from './canonical-market-numerical-evidence'
// Selected numerical predicates use the existing bounded canonical fact reader.
// Transport does not add new table privileges or expose private methodology.
export async function acquireCanonicalMarketRows(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary,fields:readonly MarketScalarField[],includeIdentity=false){
  const rows=await readCanonicalMarketScalars(boundary,fields)
  const dimensions=[...(request.year?['year_built']:[]),...(request.road?['distance_to_paved_road']:[])]
  if((!dimensions.length&&!includeIdentity)||!rows.length)return {rows,evidence:new Map()}
  const evidence=await readCanonicalListingEvidence(rows.map(row=>row.id),{facts:dimensions,semantics:includeIdentity?['property_type']:[]})
  return {rows:rows.filter(row=>marketNumericalStates(request,evidence.get(row.id)!.facts).every(s=>s==='MATCH')),evidence}
}
export async function countMarketNumericalSurvivors(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary){
  if(!request.year&&!request.road)return countCanonicalMarket(boundary)
  return (await readMarketNumericalSurvivors(request,boundary,[])).length
}

export async function readMarketNumericalSurvivors(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary,fields:readonly MarketScalarField[]){
  return (await acquireCanonicalMarketRows(request,boundary,fields)).rows
}
