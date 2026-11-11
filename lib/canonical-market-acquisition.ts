import {ordinaryUniverse} from './analytical-universe'
import 'server-only'
import {BATHROOM_CATEGORY_IDS} from './bathroom-selection'
import { readCanonicalListingEvidence } from './canonical-listing-reader'
import { readCanonicalMarketScalars, countCanonicalMarket, type CanonicalMarketBoundary, type MarketScalarField } from './canonical-market-population'
import type { CanonicalMarketRequest } from './canonical-market-request'
import { marketNumericalStates, evaluateCompositionNumericalCategory } from './canonical-market-numerical-evidence'
import { positiveClassifications } from './canonical-selected-classifications'
// Selected numerical predicates use the existing bounded canonical fact reader.
// Transport does not add new table privileges or expose private methodology.
type NumericalCombination = 'population'|'configuration'
export async function acquireCanonicalMarketRows(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary,fields:readonly MarketScalarField[],includeIdentity=false,combination:NumericalCombination='population'){
  if(request.universe!==ordinaryUniverse(boundary.transaction))throw Error('Ordinary acquisition cannot consume another analytical universe.')
  const rows=await readCanonicalMarketScalars(boundary,fields)
  const dimensions=[...new Set([...(request.numericalTerms?.map(t=>t.dimension)??[]),...(request.bathroomConstraints?['bathrooms']:[]),...(request.year?['year_built']:[]),...(request.road?['distance_to_paved_road']:[])])]
  if((!dimensions.length&&!includeIdentity)||!rows.length)return {rows,evidence:new Map(),classifications:new Map<string,Set<string>>()} 
  const evidence=await readCanonicalListingEvidence(rows.map(row=>row.id),{facts:dimensions,semantics:includeIdentity?['property_type']:[]})
  const classifications=await positiveClassifications(rows.map(row=>row.id),[...(request.numericalTerms?.map(t=>t.id)??[]),...(request.bathroomConstraints?BATHROOM_CATEGORY_IDS:[])])
  return {rows:rows.filter(row=>{
    const facts=evidence.get(row.id)!.facts,established=classifications.get(row.id)??new Set<string>()
    if(combination==='configuration'){
      // Reuse the same pure category evaluator, but require every selected term.
      // Population filtering below continues to use OR within each dimension.
      return marketNumericalStates({...request,numericalTerms:[]},facts).every(s=>s==='MATCH')&&
        (request.numericalTerms??[]).every(t=>evaluateCompositionNumericalCategory(t.id,facts.find(f=>f.dimension===t.dimension),established.has(t.id)?[t.id]:[]).state==='MATCH')
    }
    return marketNumericalStates(request,facts,[...established]).every(s=>s==='MATCH')
  }),evidence,classifications}
}
export async function countMarketNumericalSurvivors(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary,combination:NumericalCombination='population'){
  if(request.universe!==ordinaryUniverse(boundary.transaction))throw Error('Ordinary acquisition cannot consume another analytical universe.')
  if(!request.year&&!request.road&&!request.numericalTerms?.length&&!request.bathroomConstraints)return countCanonicalMarket(boundary)
  return (await readMarketNumericalSurvivors(request,boundary,[],combination)).length
}

export async function readMarketNumericalSurvivors(request:CanonicalMarketRequest,boundary:CanonicalMarketBoundary,fields:readonly MarketScalarField[],combination:NumericalCombination='population'){
  return (await acquireCanonicalMarketRows(request,boundary,fields,false,combination)).rows
}
