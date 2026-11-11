'use server'
import {validatePopulationEngineRequest,executePopulationEngine,deliverPopulationEngine,readBankAnalyticalSubjectConfiguration,type PopulationEngineRequest,type PopulationEngineResult} from './population-engine-execution'
import {universePriceBasis} from './analytical-universe'

// Algorithm-specific results are assembled by their current shared owners. This
// boundary never returns an acquisition, source dossier, authority grant or closure.
function projection(result:PopulationEngineResult){
 if(result.population!=='BANK'||result.private!==null||!result.bank||result.crossMarket!==null)throw Error('Invalid independent Bank result.')
 return {engine:result.engine,population:'BANK' as const,transaction:'bank' as const,priceBasis:universePriceBasis('BANK'),scopeInventoryCount:result.inventoryCount,scopePriceEligibleCount:result.priceEligibleCount,eligibilityProfile:result.eligibilityProfile,propertyBasis:result.propertyBasis,normalizationBasis:result.areaBasis,analyticalDate:result.analyticalDate,fx:result.fx,questionIdentity:result.cacheIdentity,result:result.bank.result}
}
function parse(input:unknown):PopulationEngineRequest{
 if(!input||typeof input!=='object'||Array.isArray(input)||JSON.stringify(input).length>32768)throw Error('Invalid Bank analytical command.')
 const request=validatePopulationEngineRequest(input as PopulationEngineRequest)
 if(request.scope.population!=='BANK'||request.scope.transaction!=='bank')throw Error('Bank action requires an independent Bank question.')
 return request
}
/** No mount/change/save handler invokes this action; explicit customer Run is required. */
export async function executeBankAnalyticalQuestion(input:unknown){
 const request=parse(input)
 if(request.engine==='comparison')throw Error('Use the two-sided Market Comparison command.')
 if(request.subject&&!/^[0-9a-f]{64}$/.test(request.subjectRevision??''))throw Error('Current Bank subject configuration revision required.')
 const result=await executePopulationEngine(request)
 await deliverPopulationEngine(result)
 return projection(result)
}
/** Both real market definitions acquire and revalidate the same authorized universe independently. */
export async function executeBankMarketComparison(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='left,right')throw Error('Two explicit market definitions required.')
 const pair=input as {left:unknown;right:unknown},left=parse(pair.left),right=parse(pair.right)
 if(left.engine!=='comparison'||right.engine!=='comparison'||left.language!==right.language)throw Error('Conflicting comparison command.')
 const a=await executePopulationEngine(left),b=await executePopulationEngine(right)
 if(a.analyticalDate!==b.analyticalDate||JSON.stringify(a.fx)!==JSON.stringify(b.fx))throw Error('Comparison monetary context changed.')
 await deliverPopulationEngine(a);await deliverPopulationEngine(b)
 return {language:left.language,population:'BANK' as const,priceBasis:universePriceBasis('BANK'),analyticalContext:{analyticalDate:a.analyticalDate,fx:a.fx},left:projection(a),right:projection(b)}
}

export async function readBankSubjectConfiguration(input:Parameters<typeof readBankAnalyticalSubjectConfiguration>[0]){
 return readBankAnalyticalSubjectConfiguration(input)
}
