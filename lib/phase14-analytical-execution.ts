import 'server-only'
import { randomUUID } from 'node:crypto'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { authorizePriceMeterIntelligenceExecution } from './price-meter-authorization'

export type Phase14Normalization = 'land' | 'construction'
export type Phase14AnalyticalExecution = Readonly<{
  contractVersion: 1; marketExecution: Phase14ExecutionEnvelope; normalizationBasis: Phase14Normalization
  analyticalIdentity: string; analyticalExecutionId: string; authenticatedUserId: string
}>
const executions = new WeakSet<object>()
export async function commitPhase14AnalyticalExecution(marketExecution: Phase14ExecutionEnvelope, normalization: unknown): Promise<Phase14AnalyticalExecution> {
  assertPhase14ExecutionEnvelope(marketExecution)
  if (normalization !== 'land' && normalization !== 'construction') throw new Error('Explicit Phase 14 normalization required.')
  const user = await authorizePriceMeterIntelligenceExecution('cap-comparative-price-m2-discovery')
  if (user !== marketExecution.authenticatedUserId) throw new Error('Phase 14 caller identity mismatch.')
  const execution: Phase14AnalyticalExecution = Object.freeze({contractVersion:1,marketExecution,normalizationBasis:normalization,
    analyticalIdentity:JSON.stringify({version:1,question:marketExecution.canonicalQuestionSerialization,normalizationBasis:normalization}),
    analyticalExecutionId:randomUUID(),authenticatedUserId:user})
  executions.add(execution); return execution
}
export function assertPhase14AnalyticalExecution(value: Phase14AnalyticalExecution): void {
  if (!value || !executions.has(value)) throw new Error('Invalid Phase 14 analytical execution.')
  assertPhase14ExecutionEnvelope(value.marketExecution)
}
export function equalPhase14AnalyticalExecutions(a: Phase14AnalyticalExecution, b: Phase14AnalyticalExecution): boolean {
  assertPhase14AnalyticalExecution(a); assertPhase14AnalyticalExecution(b)
  return a.analyticalIdentity === b.analyticalIdentity
}
