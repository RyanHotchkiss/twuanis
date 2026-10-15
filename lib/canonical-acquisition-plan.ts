import 'server-only'
import {populationEngine,type PopulationEngineId} from './population-engine-registry'
import type {AcquisitionRequest} from './canonical-population-acquisition'

/** ORCH-ACQ-01's verified engine matrices: Matching (both configurations) and
 * Configuration require the complete market before preferences. Geography uses
 * children inside that market, and canonical subjects stay in the same raw union.
 * The registry remains the authority for capabilities, profiles and membership. */
export function canonicalAcquisitionPlan(scope:Omit<AcquisitionRequest,'capability'|'profile'>,members:readonly PopulationEngineId[],capabilities:readonly string[]){
 const engines=members.map(id=>{const e=populationEngine(id);if(!capabilities.includes(e[3]))throw Error('Acquisition plan outside authorized engine membership.');return Object.freeze({id,capability:e[3],profile:e[5],referenceBeforePreferences:id==='matching'||id==='configuration',subjectIndependentOfPreferences:['position','comparables','weighted-price'].includes(id)})})
 return Object.freeze({schema:'canonical-acquisition-plan-v1' as const,scope:Object.freeze({...scope,geography:Object.freeze({...scope.geography})}),sources:Object.freeze(scope.population==='COMBINED'?['PRIVATE','BANK']: [scope.population]),engines:Object.freeze(engines),profiles:Object.freeze([...new Set(engines.map(e=>e.profile))]),rawEvidence:'complete canonical market; profile and preference eligibility remain independent',freshness:'independent source reacquisition before commitment'})
}
export type CanonicalAcquisitionPlan=ReturnType<typeof canonicalAcquisitionPlan>

export function assertAcquisitionPlan(plan:CanonicalAcquisitionPlan,r:AcquisitionRequest):void {
 const scope=plan.scope
 if(r.population!==scope.population||r.transaction!==scope.transaction||r.propertyType!==scope.propertyType||r.propertyBasis!==scope.propertyBasis||r.areaBasis!==scope.areaBasis||Object.entries(scope.geography).some(([k,v])=>r.geography[k as keyof typeof r.geography]!==v)||!plan.engines.some(e=>e.capability===r.capability&&e.profile===r.profile))throw Error('Acquisition outside authorized execution plan.')
}
