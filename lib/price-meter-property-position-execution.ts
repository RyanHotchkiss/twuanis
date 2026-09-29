import 'server-only'
import { getCurrentAnalyticalDate } from './analysis-date'
import { getHistoricalUsdToCrcRate } from './fx/fx-service'
import { resolvePriceMeterAnalyticalIdentity, type PriceMeterFxIdentity } from './price-meter-identity'
import { buildPriceMeterObservations } from './price-meter-observation-builder'
import { resolvePriceMeterPropertyPositionIdentity } from './price-meter-property-position-identity'
import { buildPriceMeterPropertyPositionNormalization } from './price-meter-property-position-normalization'
import { buildPriceMeterPropertyPositionPopulation } from './price-meter-property-position-population'
import { buildPriceMeterDistribution } from './price-meter-distribution'
import { buildPriceMeterPropertyPositionPercentile } from './price-meter-property-position-percentile'
import { buildPriceMeterPropertyPositionMedian } from './price-meter-property-position-median'
import { buildPriceMeterPropertyPositionInterval } from './price-meter-property-position-interval'
import { buildPriceMeterPropertyPositionTail } from './price-meter-property-position-tail'
import { buildPriceMeterPropertyPositionConstructionLandContext } from './price-meter-property-position-construction-land'
import { buildPriceMeterPropertyPositionEvidence } from './price-meter-property-position-evidence'
import { loadPositionSubject, loadPositionReference, type PositionRow } from './price-meter-property-position-loader'
import type { PositionConfiguration, PositionFailure, PositionPlace } from './price-meter-property-position-browser-contract'
import type { PositionRequest } from './price-meter-property-position-request'
import type { PositionReference, PositionResult } from './price-meter-property-position-result-contract'

// Failure diagnostics stay server-internal; route/DTO projections deliberately omit them.
const failure = (state: PositionFailure['state'], reason: string, cause?: unknown): PositionFailure & { cause?: unknown } => ({ state, reason, cause })
export async function resolvePositionFx(rows: PositionRow[], analyticalDate: string): Promise<PriceMeterFxIdentity | null> {
  if (!rows.some(row => String(row.currency ?? '').trim().toUpperCase() === 'USD')) return null
  const fx = await getHistoricalUsdToCrcRate(analyticalDate)
  if (fx.analyticalDate !== analyticalDate) throw new Error('Incoherent analytical date.')
  return { conversionApplied: true, analyticalDate, baseCurrency: 'USD', quoteCurrency: 'CRC',
    rate: fx.rate, rateType: 'reference_sale', effectiveDate: fx.effectiveDate, source: 'BCCR', resolutionMode: fx.resolutionMode }
}
export function buildPositionObservations(rows: PositionRow[], analyticalDate: string, fxIdentity: PriceMeterFxIdentity | null, normalization?:PositionRequest['requestedNormalizationBasis']) {
  return buildPriceMeterObservations(rows.map(row => ({ ...row, analyticalIdentity: resolvePriceMeterAnalyticalIdentity(row,{analyticalDate,fxIdentity}) })),normalization)
}
function configuration(row: PositionRow, date: string, fx: PriceMeterFxIdentity | null, selectedOnly = false): PositionConfiguration | PositionFailure {
  // The Hub reads eligibility metadata without constructing sibling observations.
  const identity = selectedOnly ? resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:date,fxIdentity:fx}) : null
  const observed = selectedOnly ? [] : buildPositionObservations([row],date,fx)
  if (identity ? (!identity.eligibility.eligible || !identity.price.analyticallyUsable || identity.price.analyticalAmount === null || identity.transactionType === null || identity.propertyBasis === 'unknown' || !identity.availableNormalizationBases.length) : !observed.length) return failure('subject_ineligible','canonical_observation_not_established')
  const normalized = selectedOnly ? null : buildPriceMeterPropertyPositionNormalization({ identities: observed.map(resolvePriceMeterPropertyPositionIdentity) })
  const geographies: PositionConfiguration['geographies'] = {}
  for (const term of row.canonicalEvidence.geography) {
    geographies[term.term_type] = { id: term.id, label: term.term_name, labelEn: term.term_name_en, labelEs: term.term_name_es }
  }
  const type = row.canonicalEvidence.selections.find(s => s.dimension === 'property_type')!
  const normalizations = identity ? identity.availableNormalizationBases : ([normalized!.land,normalized!.construction]).flatMap(lens => lens ? [lens.normalizationBasis] : [])
  return { state: geographies.district ? 'ok' : 'reference_definition_invalid', listingId: row.id, geographies, normalizations,
    defaultGeography: geographies.district ? 'district' : null,
    defaultNormalization: normalizations.includes('construction') ? 'construction' : 'land',
    propertyType: { id: type.ontology_term_id, label: type.term_name }, reason: geographies.district ? 'ready' : 'district_not_established' }
}
// Only called after the dedicated route has authorized the cookie-backed caller.
export async function getPositionConfiguration(listingId: string): Promise<PositionConfiguration | PositionFailure> {
  try {
    const row = await loadPositionSubject(listingId)
    if (!row) return failure('subject_unavailable','active_canonical_subject_not_found')
    const date = getCurrentAnalyticalDate()
    return configuration(row,date,await resolvePositionFx([row],date))
  } catch (cause) { return failure('execution_unavailable','configuration_unavailable',cause) }
}

export type PositionWorkingEvidence = {
 subjectRow: PositionRow; rows: PositionRow[];
 observations: ReturnType<typeof buildPriceMeterObservations>;
 distribution: ReturnType<typeof buildPriceMeterDistribution>
}
export type PositionExecution =
 | {result: Extract<PositionResult,{state:'ok'}>; working: PositionWorkingEvidence}
 | {result: Exclude<PositionResult,{state:'ok'}>; working: null}
export async function executePropertyPositionWithWorkingEvidence(request: PositionRequest, selectedOnly = false): Promise<PositionExecution> {
  try {
    const row = await loadPositionSubject(request.listingId)
    if (!row) return {result:failure('subject_unavailable','active_canonical_subject_not_found'),working:null}
    const analyticalDate = getCurrentAnalyticalDate()
    let fx = await resolvePositionFx([row],analyticalDate)
    const config = configuration(row,analyticalDate,fx,selectedOnly)
    if (!('geographies' in config)) return {result:config,working:null}
    const geography: PositionPlace | undefined = config.geographies[request.requestedGeographyLevel]
    if (!geography) return {result:failure('reference_definition_invalid','canonical_geography_not_established'),working:null}
    if (!config.normalizations.includes(request.requestedNormalizationBasis)) return {result:failure('normalization_not_applicable','exact_normalization_not_established'),working:null}
    let subjectObservation = buildPositionObservations([row],analyticalDate,fx,selectedOnly ? request.requestedNormalizationBasis : undefined).find(o => o.normalizationBasis === request.requestedNormalizationBasis)!
    const reference: PositionReference = {
      subjectListingId: row.id, geographyLevel: request.requestedGeographyLevel, geography, propertyType: config.propertyType,
      transactionType: subjectObservation.transactionType, propertyBasis: subjectObservation.propertyBasis,
      normalizationBasis: request.requestedNormalizationBasis, participation: 'SUBJECT_INCLUDED',
      canonicalVersion: 1, listingStatus: 'active', propertyArea: 'unconstrained', constructionArea: 'unconstrained',
      analyticalDate, monetaryPolicy: 'canonical_crc_bccr_reference_sale', eligibility: 'canonical_exact_normalization'
    }
    let rows: PositionRow[]
    try { rows = await loadPositionReference(reference) }
    catch (cause) { return {result:failure('reference_evidence_incomplete','complete_canonical_reference_not_established',cause),working:null} }
    // Resolve at most one USD rate per execution. Rebuild both sides in the same context.
    if (!fx) fx = await resolvePositionFx(rows,analyticalDate)
    // A USD subject already resolved FX; a native CRC subject is unaffected by
    // reference-only USD conversion. Keep its single selected observation.
    if (!selectedOnly) subjectObservation = buildPositionObservations([row],analyticalDate,fx).find(o => o.normalizationBasis === request.requestedNormalizationBasis)!
    const subject = resolvePriceMeterPropertyPositionIdentity(subjectObservation)
    const candidates = buildPositionObservations(rows,analyticalDate,fx,selectedOnly ? request.requestedNormalizationBasis : undefined).filter(o => o.propertyBasis === reference.propertyBasis && o.normalizationBasis === reference.normalizationBasis)
    let population
    try { population = buildPriceMeterPropertyPositionPopulation({ subject, observations: candidates, participation: 'SUBJECT_INCLUDED' }) }
    catch (cause) { return {result:failure('subject_participation_invalid','actual_subject_not_represented_once_consistently',cause),working:null} }
    const distribution = buildPriceMeterDistribution({ transactionType: population.transactionType, observations: population.observations })
    const percentile = buildPriceMeterPropertyPositionPercentile({population})
    const medianPosition = buildPriceMeterPropertyPositionMedian({population,distribution})
    const interval = buildPriceMeterPropertyPositionInterval({population,distribution})
    const tail = buildPriceMeterPropertyPositionTail({population,distribution,percentile,interval})
    const constructionToLandContext = buildPriceMeterPropertyPositionConstructionLandContext({subject})
    const evidence = buildPriceMeterPropertyPositionEvidence({population,distribution,percentile,medianPosition,interval,tail,constructionToLandContext})
    const result: Extract<PositionResult,{state:'ok'}> = { state:'ok', contractVersion:1, subject, subjectAnalyticalIdentity:subjectObservation.analyticalIdentity,
      reference, unit:reference.transactionType === 'sale' ? 'CRC/m²' : 'CRC/m²/month', analyticalDate, fx,
      completeness:{ established:true, candidateCount:rows.length, observationCount:population.comparisonPopulationCount }, evidence }
    return {result,working:{subjectRow:row,rows,observations:population.observations,distribution}}
  } catch (cause) { return {result:failure('execution_unavailable','analysis_unavailable',cause),working:null} }
}
