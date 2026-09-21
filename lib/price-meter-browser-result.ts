import 'server-only'
import type { getPriceMeterAnalysis } from '@/lib/price-meter-engine'

type InternalResult = Awaited<ReturnType<typeof getPriceMeterAnalysis>>

// These are the aggregate sections consumed by the EN/ES result panels.
// Raw listings, observations, construction/land identities and unused engine
// sections never cross the Apply response (or become new saved snapshots).
export function toPriceMeterBrowserResult(result: InternalResult, transaction: 'sale' | 'rent') {
  const key = transaction === 'sale' ? 'saleIntelligence' : 'rentIntelligence'
  const intelligence = result[key]
  const construction = intelligence.constructionToLand
  return {
    geographicScope: result.geographicScope,
    [key]: {
      distributions: intelligence.distributions,
      geographicStatistics: intelligence.geographicStatistics,
      geographicConclusions: intelligence.geographicConclusions,
      sizeRelationships: intelligence.sizeRelationships,
      constructionToLand: {
        identity: construction.identity,
        analysis: {
          transactionType: construction.analysis.transactionType,
          distribution: construction.analysis.distribution,
          statistics: construction.analysis.statistics,
          relationships: construction.analysis.relationships,
          representedObservationCount: construction.analysis.representedObservationCount,
        },
      },
    },
  }
}
