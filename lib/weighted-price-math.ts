import 'server-only'
import {analyzeAreaRatio,type Observation} from './asking-area-ratio-math'
import type {WeightedEvidence} from './weighted-price-contract'
import {percentile} from './numerical-distribution'
import {calculatePropertyPositionCounts,calculatePropertyPositionDifference} from './price-meter-property-position-math'
function positive(v:number){if(!Number.isFinite(v)||v<=0)throw Error('Invalid weighted evidence');return v}
export function weightedObservation(P:number,L:number,C:number,r:number){return positive(positive(P)/positive(positive(L)+positive(r)*positive(C)))}
export function analyzeWeightedPrice(observations:readonly Observation[],subject:{P:number|null;L:number;C:number}):WeightedEvidence{
 const weighting=analyzeAreaRatio(observations)
 if(weighting.state!=='established')return{state:'weighting_not_established',weighting}
 const r=weighting.ratio
 if(![r,weighting.coefficients.propertyArea,weighting.coefficients.constructionArea].every(v=>Number.isFinite(v)&&v>0))return{state:'weighting_not_applicable',weighting}
 // One map and one sort over exactly the same observations used by Engine 16.
 const values=observations.map(o=>weightedObservation(o.P,o.L,o.C,r));values.sort((a,b)=>a-b)
 const distribution={p25:positive(percentile(values,.25)!),median:positive(percentile(values,.5)!),p75:positive(percentile(values,.75)!),n:values.length}
 if(subject.P===null)return{state:'distribution_only',weighting,distribution}
 const weightedPrice=weightedObservation(subject.P,subject.L,subject.C,r)
 return{state:'subject_position',weighting,distribution,subject:{weightedPrice,...calculatePropertyPositionCounts(weightedPrice,values,values.length),...calculatePropertyPositionDifference(weightedPrice,distribution.median)}}
}
