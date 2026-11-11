import 'server-only'
import {validateBathroomConstraint,type BathroomConstraint} from './bathroom-selection'
import type { CanonicalFact } from './canonical-listing-reader'
import { evaluateMarketYearBuilt, resolveMarketYearBuiltConstraint } from './market-year-built-constraint'
import { COMPOSITION_NUMERICAL_CATEGORIES } from './market-composition-category-contract'
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
export function marketNumericalStates(request:CanonicalMarketRequest,facts:readonly CanonicalFact[],establishedTermIds:readonly string[]=[]):EvidenceState[]{
  const states:EvidenceState[]=[]
  if(request.year)states.push(evaluateMarketYearBuilt(request.year,facts.find(f=>f.dimension==='year_built')).state)
  for(const dimension of new Set(request.numericalTerms?.map(t=>t.dimension)??[])){
    if(dimension==='bathrooms'&&request.bathroomConstraints)continue
    const selected=request.numericalTerms!.filter(t=>t.dimension===dimension)
    const positive=selected.filter(t=>establishedTermIds.includes(t.id)).map(t=>t.id)
    const outcomes=selected.map(t=>evaluateCompositionNumericalCategory(t.id,facts.find(f=>f.dimension===dimension),positive).state)
    states.push(outcomes.includes('MATCH')?'MATCH':outcomes.every(s=>s==='NONMATCH')?'NONMATCH':'UNKNOWN')
  }
  if(request.bathroomConstraints){const outcomes=request.bathroomConstraints.map(c=>evaluateBathroomConstraint(c,facts.find(f=>f.dimension==='bathrooms'),establishedTermIds).state);states.push(outcomes.includes('MATCH')?'MATCH':outcomes.every(s=>s==='NONMATCH')?'NONMATCH':'UNKNOWN')}
  if(request.road)states.push(evaluateMarketRoadDistance(request.road,facts.find(f=>f.dimension==='distance_to_paved_road')))
  return states
}


export type CompositionCategoryEvaluation = Readonly<{
  state: EvidenceState
  evidenceKind: CanonicalFact['kind'] | 'membership' | 'missing' | 'incompatible'
}>
type DecimalInterval = Readonly<{lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean}>
// Precision-preserving comparison principles shared with Phase14; no population executor dependency.
function categoryDecimal(value:unknown):string {
  if(typeof value!=='string'||!/^\d+(?:\.\d+)?$/.test(value))throw Error('Invalid numerical evidence.')
  const [whole,fraction='']=value.split('.'),w=whole.replace(/^0+(?=\d)/,''),f=fraction.replace(/0+$/,'')
  return w+(f?'.'+f:'')
}
function categoryCompare(a:string,b:string):number {
  const [aw,af='']=a.split('.'),[bw,bf='']=b.split('.')
  if(aw.length!==bw.length)return aw.length<bw.length?-1:1
  if(aw!==bw)return aw<bw?-1:1
  const length=Math.max(af.length,bf.length),x=af.padEnd(length,'0'),y=bf.padEnd(length,'0')
  return x<y?-1:x>y?1:0
}
function numericalCategoryInterval(id:string):DecimalInterval|null {
  const exact:Record<string,string>={'1122':'1','1123':'2','1124':'3','1125':'4','1127':'1','1128':'2','1129':'3','1130':'4','1132':'0','1133':'1','1134':'2','1135':'3'}
  if(exact[id]!==undefined)return {lower:exact[id],upper:exact[id],lowerInclusive:true,upperInclusive:true}
  if(id==='1126'||id==='1131'||id==='1136')return {lower:id==='1136'?'4':'5',upper:null,lowerInclusive:true,upperInclusive:false}
  return null // Studio is not a numerical interval.
}
// Identity binding only: all year boundaries remain in the existing approved year contract.
const compositionYearKeys:Readonly<Record<string,string>>=Object.freeze({'1137':'Pre-1980','1138':'1980s','1139':'1990s','1140':'2000s','1141':'2010s','1142':'2020+'})
function categoryFactInterval(fact:CanonicalFact):DecimalInterval|null {
  if(fact.kind==='category') {
    if(fact.exact_value!==null||fact.range_lower!==null||fact.range_upper!==null||fact.lower_inclusive!==null||fact.upper_inclusive!==null)throw Error('Incoherent category evidence.')
    const category=COMPOSITION_NUMERICAL_CATEGORIES.find(c=>c.termId===fact.category_term_id)
    if(!category||category.dimension!==fact.dimension)throw Error('Incompatible category evidence.')
    return numericalCategoryInterval(category.termId)
  }
  if(fact.category_term_id!==null)throw Error('Incoherent numerical evidence.')
  const decimal=(value:unknown)=>{
    const n=categoryDecimal(value)
    if(fact.dimension!=='bathrooms'&&n.includes('.'))throw Error('Nonintegral count evidence.')
    return n
  }
  if(fact.kind==='exact') {
    if(fact.range_lower!==null||fact.range_upper!==null||fact.lower_inclusive!==null||fact.upper_inclusive!==null)throw Error('Incoherent exact evidence.')
    const n=decimal(fact.exact_value)
    return {lower:n,upper:n,lowerInclusive:true,upperInclusive:true}
  }
  if(fact.kind!=='range'||fact.exact_value!==null||typeof fact.lower_inclusive!=='boolean'||typeof fact.upper_inclusive!=='boolean')throw Error('Incoherent range evidence.')
  let lower=fact.range_lower===null?null:decimal(fact.range_lower),upper=fact.range_upper===null?null:decimal(fact.range_upper)
  if(lower===null&&fact.lower_inclusive||upper===null&&fact.upper_inclusive||lower===null&&upper===null)throw Error('Invalid open range.')
  let lowerInclusive=fact.lower_inclusive,upperInclusive=fact.upper_inclusive
  if(upper!==null&&upper.startsWith('-')||lower!==null&&upper!==null&&(categoryCompare(lower,upper)>0||categoryCompare(lower,upper)===0&&!(lowerInclusive&&upperInclusive)))throw Error('Empty range.')
  return {lower,upper,lowerInclusive,upperInclusive}
}
function compareCategoryIntervals(e:DecimalInterval,q:DecimalInterval):EvidenceState {
  const lower=q.lower===null||e.lower!==null&&(categoryCompare(e.lower,q.lower)>0||categoryCompare(e.lower,q.lower)===0&&(!e.lowerInclusive||q.lowerInclusive))
  const upper=q.upper===null||e.upper!==null&&(categoryCompare(e.upper,q.upper)<0||categoryCompare(e.upper,q.upper)===0&&(!e.upperInclusive||q.upperInclusive))
  if(lower&&upper)return 'MATCH'
  if(e.upper!==null&&q.lower!==null&&(categoryCompare(e.upper,q.lower)<0||categoryCompare(e.upper,q.lower)===0&&(!e.upperInclusive||!q.lowerInclusive))||
     e.lower!==null&&q.upper!==null&&(categoryCompare(e.lower,q.upper)>0||categoryCompare(e.lower,q.upper)===0&&(!e.lowerInclusive||!q.upperInclusive)))return 'NONMATCH'
  return 'UNKNOWN'
}
/** Server-only pure evaluator. establishedTermIds must come from verified canonical memberships,
 * never client claims. No I/O, classification persistence, filtering or aggregation occurs here. */
export function evaluateCompositionNumericalCategory(categoryId:string,fact?:CanonicalFact,establishedTermIds:readonly string[]=[]):CompositionCategoryEvaluation {
  const result=(state:EvidenceState,evidenceKind:CompositionCategoryEvaluation['evidenceKind']):CompositionCategoryEvaluation=>Object.freeze({state,evidenceKind})
  const category=COMPOSITION_NUMERICAL_CATEGORIES.find(c=>c.termId===categoryId)
  if(!category)return result('UNKNOWN','incompatible')
  if(establishedTermIds.some(id=>!COMPOSITION_NUMERICAL_CATEGORIES.some(c=>c.termId===id&&c.dimension===category.dimension)))return result('UNKNOWN','incompatible')
  if(establishedTermIds.includes(categoryId))return result('MATCH','membership')
  if(!fact)return result('UNKNOWN','missing')
  if(fact.dimension!==category.dimension)return result('UNKNOWN','incompatible')
  try {
    if(category.dimension==='year_built') {
      const definitions=new Map(COMPOSITION_NUMERICAL_CATEGORIES.filter(c=>c.dimension==='year_built').map(c=>[c.termId,resolveMarketYearBuiltConstraint(compositionYearKeys[c.termId]).interval]))
      return result(evaluateMarketYearBuilt(resolveMarketYearBuiltConstraint(compositionYearKeys[categoryId]),fact,definitions).state,fact.kind)
    }
    const evidence=categoryFactInterval(fact)
    // Explicit categorical identity proves Studio; numerical zero never does.
    if(fact.kind==='category'&&fact.category_term_id===categoryId)return result('MATCH','category')
    const requested=numericalCategoryInterval(categoryId)
    if(!requested||!evidence)return result('UNKNOWN',fact.kind)
    return result(compareCategoryIntervals(evidence,requested),fact.kind)
  }catch{return result('UNKNOWN','incompatible')}
}

// Older selector keys bind to existing canonical identities, never translated labels.
export function compositionYearCategoryId(selectorKey:string):string|undefined {
  return Object.entries(compositionYearKeys).find(([,key])=>key===selectorKey)?.[0]
}

// Same canonical decimal/full-containment logic; typed request predicates are not ontology memberships.
export function evaluateBathroomConstraint(input:BathroomConstraint,fact?:CanonicalFact,positive:readonly string[]=[]):CompositionCategoryEvaluation{
 const c=validateBathroomConstraint(input)
 if(c.kind==='category')return evaluateCompositionNumericalCategory(c.termId,fact,positive.filter(id=>COMPOSITION_NUMERICAL_CATEGORIES.some(t=>t.dimension==='bathrooms'&&t.termId===id)))
 const result=(state:EvidenceState,evidenceKind:CompositionCategoryEvaluation['evidenceKind']):CompositionCategoryEvaluation=>({state,evidenceKind})
 const q:DecimalInterval=c.kind==='exact'?{lower:c.value,upper:c.value,lowerInclusive:true,upperInclusive:true}:{lower:c.lower,upper:c.upper,lowerInclusive:c.lowerInclusive,upperInclusive:c.upperInclusive}
 try{
  if(fact){if(fact.dimension!=='bathrooms')return result('UNKNOWN','incompatible');const interval=categoryFactInterval(fact);return interval?result(compareCategoryIntervals(interval,q),fact.kind):result('UNKNOWN',fact.kind)}
  for(const id of positive){if(!COMPOSITION_NUMERICAL_CATEGORIES.some(t=>t.dimension==='bathrooms'&&t.termId===id))continue;const interval=numericalCategoryInterval(id);if(interval&&compareCategoryIntervals(interval,q)==='MATCH')return result('MATCH','membership')}
  return result('UNKNOWN','missing')
 }catch{return result('UNKNOWN','incompatible')}
}
