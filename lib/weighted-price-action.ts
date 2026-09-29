'use server'
import {authorizePriceMeterIntelligenceExecution,PriceMeterComparableAuthenticationError,PriceMeterComparableAuthorizationError} from './price-meter-authorization'
import {parseWeightedQuestion,type WeightedResponse} from './weighted-price-contract'
import {establishWeightedSubject,WeightedQuestionError} from './weighted-price-data'
import {acquireAreaRatio,acquireAreaRatioOptions} from './asking-area-ratio-data'
import {analyzeWeightedPrice} from './weighted-price-math'
import {RATIO_METHOD} from './asking-area-ratio-math'
export async function executeWeightedPrice(input:unknown):Promise<WeightedResponse>{
 try{
  const userId=await authorizePriceMeterIntelligenceExecution()
  let question;try{question=parseWeightedQuestion(input)}catch{return{error:'invalid_question'}}
  const subject=await establishWeightedSubject(question,userId)
  const population=await acquireAreaRatio(question.cohort,{excludedListingId:subject.listingId,subjectNeedsUsd:subject.money?.currency==='USD'})
  const P=subject.money?subject.money.amount*(subject.money.currency==='USD'?population.fx!.rate:1):null
  if(P!==null&&(!Number.isFinite(P)||P<=0))throw Error('Invalid normalized subject money')
  const evidence=analyzeWeightedPrice(population.observations,{P,L:subject.L,C:subject.C})
  // The analytical result contains aggregates only, never working observations or solver arrays.
  return{question,evidence,methodology:`weighted-price-v1 / ${RATIO_METHOD.version}`,analyticalDate:population.analyticalDate,fx:population.fx,excluded:population.excluded,participation:subject.listingId?'subject_excluded':'no_subject_identity',subjectAreas:{propertyArea:subject.L,constructionArea:subject.C},subjectMoney:subject.money?{amount:subject.money.amount,currency:subject.money.currency,normalizedAmount:P!}:null,marketLabel:population.marketLabel,propertyTypeLabel:population.propertyTypeLabel}
 }catch(e){
  if(e instanceof PriceMeterComparableAuthenticationError)return{access:'authentication_required'}
  if(e instanceof PriceMeterComparableAuthorizationError)return{access:'entitlement_required'}
  if(e instanceof WeightedQuestionError)return{error:'invalid_question'}
  return{error:'execution_unavailable'}
 }
}
export async function loadWeightedPriceOptions(){await authorizePriceMeterIntelligenceExecution();return acquireAreaRatioOptions()}
