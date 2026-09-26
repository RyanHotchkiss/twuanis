import 'server-only'
import type { CanonicalFact } from './canonical-listing-reader'
import { evaluateMarketYearBuilt } from './market-year-built-constraint'
import type { CanonicalMarketRequest } from './canonical-market-request'
export type EvidenceState='MATCH'|'NONMATCH'|'UNKNOWN'
// Continuous distance containment, never a midpoint or representative exact value.
export function evaluateMarketRoadDistance(request:NonNullable<CanonicalMarketRequest['road']>,fact?:CanonicalFact):EvidenceState{
  if(!fact)return 'UNKNOWN'
  if(fact.dimension!=='distance_to_paved_road')throw Error('Wrong distance evidence.')
  if(fact.kind==='category')return 'UNKNOWN'
  const number=(v:string|null)=>{if(v===null)return null;if(!/^\d+(?:\.\d+)?$/.test(v)||!Number.isFinite(Number(v)))throw Error('Invalid distance evidence.');return Number(v)}
  const lo=fact.kind==='exact'?number(fact.exact_value):number(fact.range_lower)
  const hi=fact.kind==='exact'?lo:number(fact.range_upper)
  const li=fact.kind==='exact'?true:fact.lower_inclusive,ui=fact.kind==='exact'?true:fact.upper_inclusive
  if(typeof li!=='boolean'||typeof ui!=='boolean'||lo===null&&hi===null||lo!==null&&hi!==null&&(lo>hi||lo===hi&&(!li||!ui)))throw Error('Invalid distance interval.')
  const qlo=Number(request.lower),qhi=request.upper===null?null:Number(request.upper)
  const containedLower=lo!==null&&(lo>qlo||lo===qlo&&(!li||request.lower_inclusive))
  const containedUpper=qhi===null||hi!==null&&(hi<qhi||hi===qhi&&(!ui||request.upper_inclusive))
  if(containedLower&&containedUpper)return 'MATCH'
  if(hi!==null&&(hi<qlo||hi===qlo&&(!ui||!request.lower_inclusive))||qhi!==null&&lo!==null&&(lo>qhi||lo===qhi&&(!li||!request.upper_inclusive)))return 'NONMATCH'
  return 'UNKNOWN'
}
export function marketNumericalStates(request:CanonicalMarketRequest,facts:readonly CanonicalFact[]):EvidenceState[]{
  const states:EvidenceState[]=[]
  if(request.year)states.push(evaluateMarketYearBuilt(request.year,facts.find(f=>f.dimension==='year_built')).state)
  if(request.road)states.push(evaluateMarketRoadDistance(request.road,facts.find(f=>f.dimension==='distance_to_paved_road')))
  return states
}
