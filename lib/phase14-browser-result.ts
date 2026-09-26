import 'server-only'
import { assertPhase14ServerOutcome, type Phase14ServerOutcome } from './phase14-server-discovery'
import type { Phase14BrowserResult, Phase14BrowserFailure, Phase14BrowserFailureCode, Phase14BrowserFilters, Phase14BrowserConstraint } from './phase14-browser-contract'

function failure(code: Phase14BrowserFailureCode): Phase14BrowserFailure {
  return {state:'error', contractVersion:1, code}
}
function requireEvidence(condition: unknown): asserts condition {
  if (!condition) throw new Error('Inconsistent Phase 14 projection evidence.')
}

// Fixed allowlist. No acquisition, calculation, caller overrides, or reverse conversion.
export function toPhase14BrowserResult(outcome: Phase14ServerOutcome): Phase14BrowserResult {
  try {
    assertPhase14ServerOutcome(outcome)
    if (outcome.state !== 'complete') {
      if (outcome.state === 'invalid_execution') {
        switch (outcome.reason) {
          case 'authentication_required': return failure('authentication_required')
          case 'entitlement_required': return failure('entitlement_required')
          case 'invalid_question': case 'invalid_normalization':
          case 'INVALID_REQUEST': case 'MALFORMED_CODE': case 'REQUEST_TOO_LARGE':
          case 'INVALID_ONTOLOGY_ID': case 'EMPTY_SELECTION': return failure('invalid_request')
        }
      }
      return failure('execution_failed')
    }
    const q=outcome.marketExecution.question, r=outcome.result, d=r.distribution, s=d.statistics
    requireEvidence(r.state==='complete' && r.source.state==='complete')
    requireEvidence(q.transaction===outcome.transaction && outcome.transaction===r.transaction && r.transaction===r.source.transaction && r.transaction===d.transaction)
    requireEvidence(outcome.normalization===r.normalization && r.normalization===r.source.normalization && r.normalization===d.normalization)
    requireEvidence(r.unit===d.unit && r.unit===r.source.unit && r.unit===(r.transaction==='sale'?'CRC/m²':'CRC/m²/month'))
    requireEvidence(Number.isSafeInteger(r.n) && r.n>=0 && r.n===r.resultCount && r.n===r.results.length && r.n===d.n && r.n===s.sampleSize && r.n===r.source.n)
    requireEvidence(r.distribution===r.source.distribution && d.state===(r.n===0?'empty':'established'))
    requireEvidence(r.resultOrder.primary==='price_per_square_meter_ascending' && r.resultOrder.exactTieOrder==='canonical_listing_id_ascending' && r.resultOrder.exactTieOrderMeaning==='transport_only')
    requireEvidence(outcome.completeness.snapshotGuaranteed===false && r.completeness.snapshotGuaranteed===false)
    requireEvidence(['province','canton','district'].includes(q.geography.level) && q.geography.termId && q.geography.officialCode && q.propertyType.termId)
    const semantics: Partial<Record<'environment'|'terrain'|'utility'|'accessibility'|'legal_status', readonly string[]>>={}
    for (const key of ['environment','terrain','utility','accessibility','legal_status'] as const) {
      const selected=q.filters.semantics?.[key]
      if (selected) semantics[key]=selected.map(id=>id)
    }
    const facts: Partial<Record<'bedrooms'|'bathrooms'|'parking'|'year_built', readonly Phase14BrowserConstraint[]>>={}
    for (const key of ['bedrooms','bathrooms','parking','year_built'] as const) {
      const selected=q.filters.facts?.[key]
      if (selected) facts[key]=selected.map(c=>{
        if(c.kind==='exact')return {kind:'exact',value:c.value}
        if(c.kind==='category')return {kind:'category',termId:c.termId}
        return {kind:'interval',interval:{lower:c.interval.lower,upper:c.interval.upper,lowerInclusive:c.interval.lowerInclusive,upperInclusive:c.interval.upperInclusive}}
      })
    }
    const filters: {semantics?:Phase14BrowserFilters['semantics'];facts?:Phase14BrowserFilters['facts'];propertyArea?:Phase14BrowserFilters['propertyArea'];constructionArea?:Phase14BrowserFilters['constructionArea']}={}
    if(q.filters.semantics)filters.semantics=semantics
    if(q.filters.facts)filters.facts=facts
    if(q.filters.propertyArea)filters.propertyArea=q.filters.propertyArea
    if(q.filters.constructionArea)filters.constructionArea=q.filters.constructionArea
    return {
      state:'complete',contractVersion:1,
      question:{transaction:q.transaction,geography:{level:q.geography.level,officialCode:q.geography.officialCode,termId:q.geography.termId},propertyType:{termId:q.propertyType.termId},filters},
      transaction:r.transaction,normalization:r.normalization,unit:r.unit,n:r.n,resultCount:r.resultCount,
      distribution:{state:d.state,minimum:s.minimum,p10:s.p10,p25:s.p25,median:s.median,average:s.average,p75:s.p75,p90:s.p90,maximum:s.maximum,iqr:s.iqr},
      results:r.results.map(record=>{
        requireEvidence(record.distribution===d)
        const e=record.evidence,t=e.strictTail
        return {listingId:record.listingId,pricePerM2:e.pricePerM2,belowCount:e.belowCount,equalCount:e.equalCount,aboveCount:e.aboveCount,
          percentilePosition:e.percentilePosition,percentileMethod:e.percentileMethod,differenceFromMedian:e.differenceFromMedian,
          percentDifferenceFromMedian:e.percentDifferenceFromMedian,percentageReference:e.percentageReference,interval:e.interval,
          strictTail:t?{thresholdPercentile:t.thresholdPercentile,thresholdPricePerM2:t.thresholdPricePerM2,differenceFromThreshold:t.differenceFromThreshold,percentDifferenceFromThreshold:t.percentDifferenceFromThreshold,percentageReference:t.percentageReference}:null}
      }),
      resultOrder:{primary:r.resultOrder.primary,exactTieOrder:r.resultOrder.exactTieOrder,exactTieOrderMeaning:r.resultOrder.exactTieOrderMeaning},
      snapshotGuaranteed:r.completeness.snapshotGuaranteed
    }
  } catch { return failure('execution_failed') }
}
