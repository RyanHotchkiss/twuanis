'use server'
import {authorizePriceMeterIntelligenceExecution} from './price-meter-authorization'
import {PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS} from './price-meter-cross-dimensional-question'
import {getPriceMeterCrossDimensionalPresentation} from './price-meter-cross-dimensional-presentation'
import {executeCrossDimensionalRequest} from './price-meter-cross-dimensional-execution'
import type {PriceMeterCrossDimensionalResult} from './price-meter-cross-dimensional-result-contract'

export async function readCrossDimensionalQuestions(language:'en'|'es'){
 await authorizePriceMeterIntelligenceExecution()
 if(language!=='en'&&language!=='es')throw Error('Invalid language')
 return PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS.map(q=>({key:q.key,owner:q.owningPhase,primary:q.primaryRelationship,secondary:q.secondaryDimension,...getPriceMeterCrossDimensionalPresentation({question:q,language})}))
}

export async function executeCrossDimensionalHub(input:unknown){
 const response=await executeCrossDimensionalRequest({json:async()=>input})
 if(response.status!==200||!('analyticalContext' in response))return {state:'error' as const,status:response.status}
 const fx=response.analyticalContext.fxIdentity
 return {state:'complete' as const,result:response.body as PriceMeterCrossDimensionalResult,
  analyticalDate:response.analyticalContext.analyticalDate,
  fx:fx?{source:fx.source,rate:fx.rate,effectiveDate:fx.effectiveDate,rateType:fx.rateType,resolutionMode:fx.resolutionMode}:null}
}
