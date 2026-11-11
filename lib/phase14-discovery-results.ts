import 'server-only'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14DiscoveryForPopulation, type Phase14DiscoveryEvidence, type Phase14DiscoveryResult } from './phase14-comparative-discovery'

type ObservationResult = Phase14DiscoveryEvidence['comparisons'][number]
export type Phase14ComparativeDiscoveryResults = Readonly<{
  state: 'complete'
  contractVersion: 1
  source: Phase14DiscoveryEvidence
  analyticalQuestionIdentity: string
  executionAttemptId: string
  transaction: Phase14DiscoveryEvidence['transaction']
  normalization: Phase14DiscoveryEvidence['normalization']
  unit: Phase14DiscoveryEvidence['unit']
  n: number
  resultCount: number
  distribution: Phase14DiscoveryEvidence['distribution']
  results: readonly ObservationResult[]
  resultOrder: Readonly<{
    primary: 'price_per_square_meter_ascending'
    exactTieOrder: 'canonical_listing_id_ascending'
    exactTieOrderMeaning: 'transport_only'
  }>
  completeness: Readonly<{everyObservationRepresented:true; snapshotGuaranteed:false}>
}>
export type Phase14ResultComposition = Phase14ComparativeDiscoveryResults
  | Readonly<{state:'invalid_execution'}>
  | Readonly<{state:'execution_failed';reason:'discovery_result_contract_failed'}>
const owners = new WeakMap<object, Phase14DiscoveryEvidence>()
function requireEvidence(condition: unknown): asserts condition {
  if (!condition) throw new Error('Incoherent Phase 14 discovery results.')
}
// Numerical observation ordering only. The secondary key carries no analytical meaning.
function compareResults(a: ObservationResult, b: ObservationResult): number {
  const av = a.evidence.pricePerM2, bv = b.evidence.pricePerM2
  if (av < bv) return -1
  if (av > bv) return 1
  return a.listingId < b.listingId ? -1 : a.listingId > b.listingId ? 1 : 0
}
function validateSource(source: Phase14DiscoveryEvidence) {
  const p = source.population, d = source.distribution
  requireEvidence(source.state === 'complete' && Number.isSafeInteger(source.n) && source.n >= 0)
  requireEvidence(source.n === source.comparisons.length && source.n === p.finalAnalyticalN && source.n === p.observations.length)
  requireEvidence(d.population === p && d.n === source.n && d.statistics.sampleSize === source.n)
  requireEvidence(source.analyticalQuestionIdentity === p.analyticalQuestionIdentity && source.executionAttemptId === p.executionAttemptId)
  requireEvidence(d.analyticalQuestionIdentity === source.analyticalQuestionIdentity && d.executionAttemptId === source.executionAttemptId)
  requireEvidence(source.transaction === p.marketExecution.question.transaction && source.normalization === p.normalizationBasis)
  requireEvidence(d.transaction === source.transaction && d.normalization === source.normalization && d.unit === source.unit)
  requireEvidence(source.unit === (source.transaction === 'sale' ? 'CRC/m²' : 'CRC/m²/month'))
  requireEvidence(source.completeness.everyObservationRepresented === true && source.completeness.snapshotGuaranteed === false)
  const seen = new Set<string>()
  for (const [i, record] of source.comparisons.entries()) {
    const o = record.observation.observation, value = record.evidence.pricePerM2
    requireEvidence(typeof record.listingId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(record.listingId))
    requireEvidence(!seen.has(record.listingId) && record.listingId === o.listingId && record.listingId === p.finalListingIds[i])
    seen.add(record.listingId)
    requireEvidence(record.observation === p.observations[i] && record.distribution === d)
    requireEvidence(Number.isFinite(value) && value > 0 && value === o.pricePerM2)
    requireEvidence(o.transactionType === source.transaction && o.normalizationBasis === source.normalization && record.observation.unit === source.unit)
  }
}
function validateResults(result: Phase14ComparativeDiscoveryResults, source: Phase14DiscoveryEvidence) {
  requireEvidence(result.state === 'complete' && result.contractVersion === 1 && result.source === source)
  requireEvidence(result.n === source.n && result.resultCount === source.n && result.results.length === source.n)
  requireEvidence(result.distribution === source.distribution)
  requireEvidence(result.analyticalQuestionIdentity === source.analyticalQuestionIdentity && result.executionAttemptId === source.executionAttemptId)
  requireEvidence(result.transaction === source.transaction && result.normalization === source.normalization && result.unit === source.unit)
  requireEvidence(result.resultOrder.primary === 'price_per_square_meter_ascending' && result.resultOrder.exactTieOrder === 'canonical_listing_id_ascending' && result.resultOrder.exactTieOrderMeaning === 'transport_only')
  requireEvidence(result.completeness.everyObservationRepresented === true && result.completeness.snapshotGuaranteed === source.completeness.snapshotGuaranteed)
  const expected = new Map(source.comparisons.map(record => [record.listingId, record]))
  requireEvidence(expected.size === source.n)
  for (const [i, record] of result.results.entries()) {
    requireEvidence(expected.get(record.listingId) === record)
    expected.delete(record.listingId)
    requireEvidence(record.distribution === result.distribution)
    requireEvidence(i === 0 || compareResults(result.results[i-1], record) <= 0)
  }
  requireEvidence(expected.size === 0)
}
function buildResults(source: Phase14DiscoveryEvidence): Phase14ComparativeDiscoveryResults {
  validateSource(source)
  const results = [...source.comparisons].sort(compareResults)
  const result: Phase14ComparativeDiscoveryResults = {
    state:'complete', contractVersion:1, source,
    analyticalQuestionIdentity:source.analyticalQuestionIdentity, executionAttemptId:source.executionAttemptId,
    transaction:source.transaction, normalization:source.normalization, unit:source.unit,
    n:source.n, resultCount:results.length, distribution:source.distribution, results,
    resultOrder:{primary:'price_per_square_meter_ascending',exactTieOrder:'canonical_listing_id_ascending',exactTieOrderMeaning:'transport_only'},
    completeness:{everyObservationRepresented:true,snapshotGuaranteed:source.completeness.snapshotGuaranteed}
  }
  validateResults(result, source)
  // Source, distribution, records and their transitive evidence are already frozen by Step 9.
  Object.freeze(results)
  Object.freeze(result.resultOrder)
  Object.freeze(result.completeness)
  Object.freeze(result)
  owners.set(result, source)
  return result
}
export function composePhase14DiscoveryResults(envelope: Phase14ExecutionEnvelope, source: Phase14DiscoveryResult): Phase14ResultComposition {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    requireEvidence(source && source.state === 'complete')
    assertPhase14DiscoveryForPopulation(source, source.population)
    requireEvidence(source.population.marketExecution === envelope)
  } catch { return Object.freeze({state:'invalid_execution'}) }
  try { return buildResults(source) }
  catch { return Object.freeze({state:'execution_failed',reason:'discovery_result_contract_failed'}) }
}
export function assertPhase14ResultsForDiscovery(result: Phase14ResultComposition, source: Phase14DiscoveryEvidence): asserts result is Phase14ComparativeDiscoveryResults {
  assertPhase14DiscoveryForPopulation(source, source.population)
  if (result.state !== 'complete' || owners.get(result) !== source || result.source !== source) {
    throw new Error('Invalid Phase 14 discovery result provenance.')
  }
}
