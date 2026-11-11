import type {CanonicalFact} from './canonical-listing-reader'
import type {PriceMeterCharacteristicIdentity} from './price-meter-characteristic-identity'
import {canonicalDecimal} from './asking-area-ratio-contract'
export type ExactCohortCharacteristic={kind:'exact';termType:'bedrooms'|'bathrooms';exactValue:string}
export type CohortCharacteristic=PriceMeterCharacteristicIdentity|ExactCohortCharacteristic
export function isExactCohortCharacteristic(v:CohortCharacteristic):v is ExactCohortCharacteristic{return 'kind' in v&&v.kind==='exact'}
export function normalizeCohortCount(dimension:string,value:string):string{
 if(dimension!=='bedrooms'&&dimension!=='bathrooms')throw Error('Unsupported exact cohort dimension')
 const v=/^0(?:\.0+)?$/.test(value)?'0':canonicalDecimal(value)
 if(dimension==='bedrooms'&&!Number.isSafeInteger(Number(v))||dimension==='bathrooms'&&v==='0')throw Error('Invalid exact cohort count')
 return v
}
export function exactCohortFactState(constraint:ExactCohortCharacteristic,facts:readonly CanonicalFact[]):'MATCH'|'NONMATCH'|'ABSENT'|'UNKNOWN'|'INVALID'{
 const found=facts.filter(f=>f.dimension===constraint.termType)
 if(!found.length)return 'ABSENT'
 if(found.length!==1)return 'INVALID'
 if(found[0].kind!=='exact')return 'UNKNOWN'
 if(found[0].exact_value===null)return 'INVALID'
 try{return normalizeCohortCount(constraint.termType,found[0].exact_value)===normalizeCohortCount(constraint.termType,constraint.exactValue)?'MATCH':'NONMATCH'}catch{return 'INVALID'}
}
export function matchesExactCohortFact(constraint:ExactCohortCharacteristic,facts:readonly CanonicalFact[]):boolean{return exactCohortFactState(constraint,facts)==='MATCH'}
export function cohortCharacteristicLabel(c:CohortCharacteristic,language:'en'|'es'):string{
 if(!isExactCohortCharacteristic(c))return (language==='es'?c.termNameEs:c.termNameEn)??c.termName
 const name=c.termType==='bedrooms'?(language==='es'?'dormitorios':'bedrooms'):(language==='es'?'baños':'bathrooms')
 return `${language==='es'?'Exactamente':'Exactly'} ${c.exactValue} ${name}`
}

export function isMembershipCohortCharacteristic(c:CohortCharacteristic):c is PriceMeterCharacteristicIdentity{return !isExactCohortCharacteristic(c)}
export function requireMembershipCohortCharacteristic(c:CohortCharacteristic):PriceMeterCharacteristicIdentity{if(isExactCohortCharacteristic(c))throw Error('Exact counts require the Cohort Comparison canonical fact pathway');return c}
