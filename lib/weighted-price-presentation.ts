import type {WeightedSuccess} from './weighted-price-contract'
import {resultSynthesis} from './universal-result-synthesis'

// Presentation only; preserves the existing four states and returned evidence.
export function weightedResultSynthesis(committed:WeightedSuccess,language:'en'|'es'){
 return resultSynthesis('weighted-price',committed,language,committed.question.cohort.transaction==='rent'?'RENT':'SALE')
}
