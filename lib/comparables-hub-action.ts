'use server'
import {PROPERTY_AREA_RANGE_OPTIONS,CONSTRUCTION_AREA_RANGE_OPTIONS} from './market-intelligence-area-ranges'
import {executePriceMeterComparableAnalysis} from './price-meter-comparable-server'
import {PriceMeterComparableAuthenticationError,PriceMeterComparableAuthorizationError} from './price-meter-authorization'
import {toPriceMeterComparableEvidenceDTO} from './price-meter-comparable-dto'
import {parseComparablesRequest,type ComparablesResponse} from './comparables-hub-contract'
export async function executeComparablesHub(input:unknown):Promise<ComparablesResponse>{
 let request;try{request=parseComparablesRequest(input)}catch{return{error:'invalid_request'}}
 try{
  const result=await executePriceMeterComparableAnalysis(request,true)
  if(!result.context)throw Error('Missing execution context')
  const fx=result.context.fx
  return {evidence:toPriceMeterComparableEvidenceDTO(result.analysis),presentation:result.presentation,subjectTitle:result.context.subjectTitle,areaLabels:{property:PROPERTY_AREA_RANGE_OPTIONS.find(o=>o.value===result.presentation.baseCohort.propertyAreaRange)?.label??result.presentation.baseCohort.propertyAreaRange,construction:CONSTRUCTION_AREA_RANGE_OPTIONS.find(o=>o.value===result.presentation.baseCohort.constructionAreaRange)?.label??result.presentation.baseCohort.constructionAreaRange},analyticalDate:result.context.analyticalDate,fx:fx?{rate:fx.rate,effectiveDate:fx.effectiveDate,source:fx.source,resolutionMode:fx.resolutionMode}:null}
 }catch(error){
  if(error instanceof PriceMeterComparableAuthenticationError)return{access:'authentication_required'}
  if(error instanceof PriceMeterComparableAuthorizationError)return{access:'entitlement_required'}
  return{error:'execution_unavailable'}
 }
}
