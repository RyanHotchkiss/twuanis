import 'server-only'
import { executePhase14ComparativeDiscovery } from './phase14-server-discovery'
import { toPhase14BrowserResult } from './phase14-browser-result'
import { getPhase14ListingPresentation } from './phase14-listing-presentation'
import type { Phase14ApplicationResponse } from './comparative-discovery-contract'

// The transport cannot carry analytical intermediates, identity claims or presentation controls.
export async function executePhase14Application(input: unknown): Promise<Phase14ApplicationResponse> {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).sort().join(',') !== 'normalization,request') {
    return { analysis: { state: 'error', contractVersion: 1, code: 'invalid_request' } }
  }
  const { request, normalization } = input as { request: unknown; normalization: unknown }
  try {
    const analysis = toPhase14BrowserResult(await executePhase14ComparativeDiscovery(request, normalization))
    if (analysis.state !== 'complete') return { analysis }
    if (analysis.n === 0) return { analysis, listings: [] }
    // Ordinary presentation is optional; its failure never discards established analytical rows.
    try {
      return { analysis, listings: await getPhase14ListingPresentation(analysis.results.map(row => row.listingId), analysis.transaction) }
    } catch {
      return { analysis, listings: [] }
    }
  } catch {
    return { analysis: { state: 'error', contractVersion: 1, code: 'execution_failed' } }
  }
}
