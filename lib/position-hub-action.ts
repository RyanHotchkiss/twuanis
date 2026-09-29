'use server'
import {authorizePriceMeterIntelligenceExecution,PriceMeterComparableAuthenticationError,PriceMeterComparableAuthorizationError} from './price-meter-authorization'
import {parsePositionRequest,type PositionRequest} from './price-meter-property-position-request'
import {executePropertyPositionWithWorkingEvidence} from './price-meter-property-position-execution'
import {toPositionDTO} from './price-meter-property-position-dto'
import type {PositionHubResponse} from './position-hub-contract'

export async function executePositionHub(input:unknown):Promise<PositionHubResponse>{
 try{
  await authorizePriceMeterIntelligenceExecution()
  let request:PositionRequest
  try{request=parsePositionRequest(input) as PositionRequest}catch{return{result:{state:'reference_definition_invalid',reason:'invalid_request'},fx:null}}
  const {result}=await executePropertyPositionWithWorkingEvidence(request,true)
  return {result:toPositionDTO(result),fx:result.state==='ok'&&result.fx?{rate:result.fx.rate,effectiveDate:result.fx.effectiveDate,source:result.fx.source,resolutionMode:result.fx.resolutionMode}:null}
 }catch(error){
  if(error instanceof PriceMeterComparableAuthenticationError)return{access:'authentication_required'}
  if(error instanceof PriceMeterComparableAuthorizationError)return{access:'entitlement_required'}
  return{result:{state:'execution_unavailable',reason:'request_unavailable'},fx:null}
 }
}
