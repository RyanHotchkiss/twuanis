/** Analytical identity, independent of the existing PRIVATE/BANK commercial grants. */
export type AnalyticalUniverse = 'SALE' | 'RENT' | 'BANK'
export type UniverseScope =
 | {population:'SALE';transaction:'sale'}
 | {population:'RENT';transaction:'rent'}
 | {population:'BANK';transaction:'bank'}
export function analyticalUniverse(value:unknown):AnalyticalUniverse {
 if(value!=='SALE'&&value!=='RENT'&&value!=='BANK')throw Error('One explicit SALE, RENT or BANK analytical universe is required.')
 return value
}
// Existing ordinary actions already carry an explicit source-bound transaction.
// Its identity is lossless; absence/Any is never interpreted as two populations.
export function ordinaryUniverse(transaction:unknown):'SALE'|'RENT' {
 if(transaction==='sale')return 'SALE'
 if(transaction==='rent')return 'RENT'
 throw Error('One explicit ordinary Sale or Rent transaction is required.')
}
export function assertUniverseScope(population:unknown,transaction:unknown):UniverseScope {
 const p=analyticalUniverse(population)
 if(transaction!==(p==='SALE'?'sale':p==='RENT'?'rent':'bank'))throw Error('Analytical universe and source transaction disagree.')
 return {population:p,transaction} as UniverseScope
}
export function assertSameUniverse(a:unknown,b:unknown){if(analyticalUniverse(a)!==analyticalUniverse(b))throw Error('Cross-universe analytical comparison is prohibited.')}
export const universePriceBasis=(p:AnalyticalUniverse)=>p==='BANK'?'BANK_LISTED_SELLING_PRICE':p==='RENT'?'MONTHLY_ASKING_PRICE':'TOTAL_ASKING_PRICE'
