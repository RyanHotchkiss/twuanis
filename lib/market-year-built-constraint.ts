import 'server-only'
import { validateOntologyTermId } from './geography/dta-identity'
import type { CanonicalFact } from './canonical-listing-reader'

import { MARKET_YEAR_BUILT_OPTIONS } from './market-year-built-options'
export { MARKET_YEAR_BUILT_OPTIONS } from './market-year-built-options'
export type YearInterval = Readonly<{
  lower: number | null; upper: number | null
  lowerInclusive: boolean; upperInclusive: boolean
}>
export type YearConstraint = Readonly<{ kind: 'interval'; dimension: 'year_built'; interval: YearInterval }>
export type YearEvaluation = Readonly<{
  state: 'MATCH' | 'NONMATCH' | 'UNKNOWN'
  evidenceKind: CanonicalFact['kind'] | 'missing'
}>
function fail(): never { throw new Error('Invalid canonical Year Built evidence or constraint.') }
function year(value: unknown): number {
  if (typeof value !== 'string' || !/^\d+(?:\.0+)?$/.test(value)) fail()
  const n = Number(value)
  if (!Number.isSafeInteger(n) || n < 1 || n > 9999) fail()
  return n
}
function bounds(r: YearInterval): readonly [number, number] {
  if (!r || typeof r.lowerInclusive !== 'boolean' || typeof r.upperInclusive !== 'boolean' ||
      r.lower === null && r.lowerInclusive || r.upper === null && r.upperInclusive) fail()
  for (const n of [r.lower, r.upper]) if (n !== null && (!Number.isSafeInteger(n) || n < 1 || n > 9999)) fail()
  const first = r.lower === null ? 1 : r.lower + (r.lowerInclusive ? 0 : 1)
  const last = r.upper === null ? 9999 : r.upper - (r.upperInclusive ? 0 : 1)
  if (first > last) fail()
  return [first, last]
}
export function resolveMarketYearBuiltConstraint(code: unknown): YearConstraint {
  const option = MARKET_YEAR_BUILT_OPTIONS.find(o => o.key === code)
  if (!option) throw new Error('Unsupported Year Built input code.')
  return Object.freeze({ kind: 'interval', dimension: 'year_built', interval: Object.freeze({
    lower: option.lower, upper: option.upper, lowerInclusive: option.lower !== null, upperInclusive: false,
  }) })
}
// Category intervals must come from established server-owned canonical definitions.
// The caller must not build this map by parsing names/slugs, nor accept it from a browser.
export function evaluateMarketYearBuilt(
  constraint: YearConstraint,
  fact: CanonicalFact | undefined,
  categoryDefinitions: ReadonlyMap<string, YearInterval> = new Map(),
): YearEvaluation {
  if (constraint?.kind !== 'interval' || constraint.dimension !== 'year_built') fail()
  const requested = bounds(constraint.interval)
  const result = (state: YearEvaluation['state']): YearEvaluation => Object.freeze({state, evidenceKind: fact?.kind ?? 'missing'})
  if (!fact) return result('UNKNOWN')
  if (fact.dimension !== 'year_built') fail()
  let evidence: readonly [number, number]
  if (fact.kind === 'exact') {
    if (fact.category_term_id !== null || fact.range_lower !== null || fact.range_upper !== null ||
        fact.lower_inclusive !== null || fact.upper_inclusive !== null) fail()
    const n = year(fact.exact_value); evidence = [n, n]
  } else if (fact.kind === 'range') {
    if (fact.exact_value !== null || fact.category_term_id !== null ||
        fact.range_lower === null && fact.range_upper === null ||
        typeof fact.lower_inclusive !== 'boolean' || typeof fact.upper_inclusive !== 'boolean') fail()
    evidence = bounds({lower: fact.range_lower === null ? null : year(fact.range_lower),
      upper: fact.range_upper === null ? null : year(fact.range_upper),
      lowerInclusive: fact.lower_inclusive, upperInclusive: fact.upper_inclusive})
  } else if (fact.kind === 'category') {
    const categoryId=validateOntologyTermId(fact.category_term_id)
    if (fact.exact_value !== null || fact.range_lower !== null || fact.range_upper !== null ||
        fact.lower_inclusive !== null || fact.upper_inclusive !== null) fail()
    const definition = categoryDefinitions.get(categoryId)
    if (!definition) return result('UNKNOWN')
    evidence = bounds(definition)
  } else return fail()
  if (evidence[0] >= requested[0] && evidence[1] <= requested[1]) return result('MATCH')
  if (evidence[1] < requested[0] || evidence[0] > requested[1]) return result('NONMATCH')
  return result('UNKNOWN')
}
