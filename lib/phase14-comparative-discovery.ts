import 'server-only'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14CompletePopulation, type Phase14CompletePopulation, type Phase14PopulationComposition } from './phase14-complete-analytical-population'
import { calculatePopulationMidrank } from './population-midrank'
import { buildNumericalDistribution, type NumericalDistribution } from './numerical-distribution'
import { calculatePropertyPositionDifference, classifyPropertyPositionInterval, calculatePropertyPositionTail } from './price-meter-property-position-math'

type Unit = 'CRC/m²' | 'CRC/m²/month'
type Distribution = Readonly<{
  population: Phase14CompletePopulation
  analyticalQuestionIdentity: string
  executionAttemptId: string
  transaction: 'sale' | 'rent'
  normalization: 'land' | 'construction'
  unit: Unit
  n: number
  state: 'established' | 'empty'
  statistics: Readonly<NumericalDistribution>
}>
type ComparativeMetrics = Readonly<{
  participation: 'population_member'
  state: 'established'
  pricePerM2: number
  belowCount: number
  equalCount: number
  aboveCount: number
  percentilePosition: number
  percentileMethod: 'midrank'
  differenceFromMedian: number
  percentDifferenceFromMedian: number
  percentageReference: 'selected_population_median'
  interval: ReturnType<typeof classifyPropertyPositionInterval>
  strictTail: Readonly<ReturnType<typeof calculatePropertyPositionTail>>
}>
type Comparison = Readonly<{
  listingId: string
  observation: Phase14CompletePopulation['observations'][number]
  distribution: Distribution
  evidence: ComparativeMetrics
}>
export type Phase14DiscoveryEvidence = Readonly<{
  state: 'complete'; contractVersion: 1
  population: Phase14CompletePopulation
  analyticalQuestionIdentity: string; executionAttemptId: string
  transaction: 'sale' | 'rent'; normalization: 'land' | 'construction'; unit: Unit
  n: number; distribution: Distribution; comparisons: readonly Comparison[]
  completeness: Readonly<{everyObservationRepresented: true; snapshotGuaranteed: false}>
}>
export type Phase14DiscoveryResult = Phase14DiscoveryEvidence
  | Readonly<{state:'invalid_execution'}>
  | Readonly<{state:'execution_failed';reason:'comparative_evidence_failed'}>
const owners = new WeakMap<object, Phase14CompletePopulation>()
function requireEvidence(condition: unknown): asserts condition {
  if (!condition) throw new Error('Incoherent Phase 14 comparative evidence.')
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
function validateInput(p: Phase14CompletePopulation) {
  const n = p.finalAnalyticalN
  requireEvidence(Number.isSafeInteger(n) && n >= 0 && p.observations.length === n && p.finalListingIds.length === n)
  requireEvidence(p.completeness.snapshotGuaranteed === false && p.completeness.stagedPopulationComplete === true)
  const seen = new Set<string>()
  for (const [i, item] of p.observations.entries()) {
    const o = item.observation
    requireEvidence(o.listingId === p.finalListingIds[i] && typeof o.listingId === 'string' && !seen.has(o.listingId))
    seen.add(o.listingId)
    requireEvidence(Number.isFinite(o.pricePerM2) && o.pricePerM2 > 0)
    requireEvidence(o.transactionType === p.marketExecution.question.transaction && o.normalizationBasis === p.normalizationBasis)
    requireEvidence(item.unit === (o.transactionType === 'sale' ? 'CRC/m²' : 'CRC/m²/month'))
  }
}
function validateDistribution(d: Distribution, p: Phase14CompletePopulation) {
  requireEvidence(d.population === p && d.n === p.finalAnalyticalN && d.statistics.sampleSize === d.n)
  requireEvidence(d.analyticalQuestionIdentity === p.analyticalQuestionIdentity && d.executionAttemptId === p.executionAttemptId)
  requireEvidence(d.transaction === p.marketExecution.question.transaction && d.normalization === p.normalizationBasis)
  requireEvidence(d.unit === (d.transaction === 'sale' ? 'CRC/m²' : 'CRC/m²/month'))
  const s = d.statistics, keys = ['minimum','p10','p25','median','p75','p90','maximum'] as const
  if (!d.n) {
    requireEvidence(d.state === 'empty' && keys.every(k => s[k] === null) && s.average === null && s.iqr === null)
    return
  }
  requireEvidence(d.state === 'established')
  requireEvidence(keys.every(k => s[k] !== null && Number.isFinite(s[k]) && s[k]! > 0))
  requireEvidence(keys.every((k,i) => i === 0 || s[keys[i-1]]! <= s[k]!))
  requireEvidence(s.average !== null && Number.isFinite(s.average) && s.average > 0)
  requireEvidence(s.iqr !== null && Number.isFinite(s.iqr) && s.iqr >= 0)
}
// Independently checks coverage and provenance before anything is returned as complete.
function validateResult(result: Phase14DiscoveryEvidence, p: Phase14CompletePopulation) {
  validateDistribution(result.distribution, p)
  const d = result.distribution
  requireEvidence(result.state === 'complete' && result.population === p && result.n === d.n && result.comparisons.length === d.n)
  requireEvidence(result.analyticalQuestionIdentity === d.analyticalQuestionIdentity && result.executionAttemptId === d.executionAttemptId)
  requireEvidence(result.transaction === d.transaction && result.normalization === d.normalization && result.unit === d.unit)
  requireEvidence(result.completeness.everyObservationRepresented === true && result.completeness.snapshotGuaranteed === false)
  const seen = new Set<string>()
  for (const [i, record] of result.comparisons.entries()) {
    const item = p.observations[i], e = record.evidence
    requireEvidence(record.listingId === item.observation.listingId && !seen.has(record.listingId))
    seen.add(record.listingId)
    requireEvidence(record.observation === item && record.distribution === d && e.pricePerM2 === item.observation.pricePerM2)
    requireEvidence(e.state === 'established' && e.participation === 'population_member' && e.percentileMethod === 'midrank')
    requireEvidence([e.belowCount,e.equalCount,e.aboveCount].every(x => Number.isSafeInteger(x) && x >= 0) && e.equalCount > 0)
    requireEvidence(e.belowCount + e.equalCount + e.aboveCount === d.n)
    requireEvidence(Number.isFinite(e.percentilePosition) && e.percentilePosition >= 0 && e.percentilePosition <= 100)
    requireEvidence(Number.isFinite(e.differenceFromMedian) && Number.isFinite(e.percentDifferenceFromMedian))
  }
}
export function analyzePhase14Population(envelope: Phase14ExecutionEnvelope, population: Phase14PopulationComposition): Phase14DiscoveryResult {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    assertPhase14CompletePopulation(population)
    requireEvidence(population.marketExecution === envelope)
  } catch { return Object.freeze({state:'invalid_execution'}) }
  try {
    validateInput(population)
    const values = population.observations.map(item => item.observation.pricePerM2)
    // The GREEN calculator owns interpolation and makes its own sorted numerical copy.
    const statistics = buildNumericalDistribution(values)
    const transaction = envelope.question.transaction
    const distribution: Distribution = {
      population, analyticalQuestionIdentity: population.analyticalQuestionIdentity,
      executionAttemptId: population.executionAttemptId, transaction,
      normalization: population.normalizationBasis, unit: transaction === 'sale' ? 'CRC/m²' : 'CRC/m²/month',
      n: population.finalAnalyticalN, state: population.finalAnalyticalN ? 'established' : 'empty', statistics
    }
    validateDistribution(distribution, population)
    // Group exact numerical values. Sort unique keys once; never scan N values per observation.
    const groups = new Map<number, number>()
    for (const value of values) groups.set(value, (groups.get(value) ?? 0) + 1)
    const evidence = new Map<number, ComparativeMetrics>()
    let below = 0
    for (const value of [...groups.keys()].sort((a,b) => a-b)) {
      const equal = groups.get(value)!
      const counts = calculatePopulationMidrank(below, equal, distribution.n-below-equal, distribution.n)
      const difference = calculatePropertyPositionDifference(value, statistics.median)
      const interval = classifyPropertyPositionInterval(value, statistics)
      evidence.set(value, {
        participation:'population_member', state:'established', pricePerM2:value, ...counts,
        percentileMethod:'midrank', differenceFromMedian:difference.difference,
        percentDifferenceFromMedian:difference.percentDifference, percentageReference:'selected_population_median',
        interval, strictTail:calculatePropertyPositionTail(value, statistics, interval)
      })
      below += equal
    }
    const comparisons = population.observations.map(observation => ({
      listingId:observation.observation.listingId!, observation, distribution,
      evidence:evidence.get(observation.observation.pricePerM2)!
    }))
    const result: Phase14DiscoveryEvidence = {
      state:'complete', contractVersion:1, population,
      analyticalQuestionIdentity:population.analyticalQuestionIdentity, executionAttemptId:population.executionAttemptId,
      transaction, normalization:population.normalizationBasis, unit:distribution.unit,
      n:distribution.n, distribution, comparisons,
      completeness:{everyObservationRepresented:true,snapshotGuaranteed:population.completeness.snapshotGuaranteed}
    }
    validateResult(result, population)
    freeze(result)
    owners.set(result, population)
    return result
  } catch { return Object.freeze({state:'execution_failed',reason:'comparative_evidence_failed'}) }
}
export function assertPhase14DiscoveryForPopulation(result: Phase14DiscoveryResult, population: Phase14CompletePopulation): asserts result is Phase14DiscoveryEvidence {
  assertPhase14CompletePopulation(population)
  if (result.state !== 'complete' || owners.get(result) !== population || result.population !== population) {
    throw new Error('Invalid Phase 14 comparative evidence provenance.')
  }
}
