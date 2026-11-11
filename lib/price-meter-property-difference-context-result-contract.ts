import 'server-only'
import type { PositionResult } from './price-meter-property-position-result-contract'
import type { DifferenceRequest } from './price-meter-property-difference-context-request'
import type { ContextItemDTO } from './price-meter-property-difference-context-browser-contract'
import type { PriceMeterFxIdentity } from './price-meter-identity'
// Full provenance/diagnostics stay internal; numerical projections have a closed shape.
export type ContextItem=ContextItemDTO & {monetaryProvenance?:PriceMeterFxIdentity|null;privateEvidence?:unknown;cause?:unknown}
export type DifferenceResult={contractVersion:1;request:DifferenceRequest;positionResult:PositionResult;items:ContextItem[]}
