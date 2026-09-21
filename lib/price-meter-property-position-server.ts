import 'server-only'
import type { PositionRequest } from './price-meter-property-position-request'
import type { PositionResult } from './price-meter-property-position-result-contract'
import { executePropertyPositionWithWorkingEvidence } from './price-meter-property-position-execution'
export { getPositionConfiguration } from './price-meter-property-position-execution'
// Ordinary B1 callers retain precisely the completed result, never working evidence.
export async function executePropertyPosition(request: PositionRequest): Promise<PositionResult> {
 return (await executePropertyPositionWithWorkingEvidence(request)).result
}
