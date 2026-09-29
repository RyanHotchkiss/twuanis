import 'server-only'
import { executePhase14ComparativeDiscovery } from './phase14-server-discovery'
import { toPhase14BrowserResult } from './phase14-browser-result'
import { getPhase14ListingPresentation } from './phase14-listing-presentation'
import type { Phase14ApplicationResponse } from './comparative-discovery-contract'

// The transport cannot carry analytical intermediates, identity claims or presentation controls.
export async function executePhase14Application(input: unknown): Promise<Phase14ApplicationResponse> {
  return execute(input,false)
}
export async function executePhase14HubApplication(input:unknown):Promise<Phase14ApplicationResponse>{
  return execute(input,true)
}
async function execute(input:unknown,hub:boolean):Promise<Phase14ApplicationResponse>{
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).sort().join(',') !== 'normalization,request') {
    return { analysis: { state: 'error', contractVersion: 1, code: 'invalid_request' } }
  }
  const { request, normalization } = input as { request: unknown; normalization: unknown }
  try {
    const outcome=await executePhase14ComparativeDiscovery(request, normalization)
    const analysis = toPhase14BrowserResult(outcome)
    if (analysis.state !== 'complete') return { analysis }
    const source=outcome.state==='complete'?outcome.result.source.population.source:undefined
    const fx=source?.fx
    const context:Phase14ApplicationResponse['context']=hub&&source?{analyticalDate:source.analyticalDate,
      propertyBases:[...new Set(source.observations.map(o=>o.observation.propertyBasis))],
      hydratedCount:source.hydratedInputCount,excludedCount:source.excludedListingCount,
      fx:fx?.source==='BCCR'?{source:fx.source,rate:fx.rate,effectiveDate:fx.effectiveDate,rateType:fx.rateType,resolutionMode:fx.resolutionMode}:null}:undefined
    const base={analysis,...(context?{context}:{})}
    if (analysis.n === 0) return { ...base, listings: [] }
    // Ordinary presentation is optional; its failure never discards established analytical rows.
    try {
      return { ...base, listings: await getPhase14ListingPresentation(analysis.results.map(row => row.listingId), analysis.transaction) }
    } catch {
      return { ...base, listings: [] }
    }
  } catch {
    return { analysis: { state: 'error', contractVersion: 1, code: 'execution_failed' } }
  }
}
