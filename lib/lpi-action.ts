"use server"
import {authorizePopulationCapability,PackageCapabilityDenied,type AnalyticalCapability} from './package-capability-authorization'
import {bindQuestion,readRevision,requireLensQuestion} from './lpi-question'
import {executeSelected} from './lpi-execution-core'
import {lensDefinition,QuestionUnavailable,type Request} from './lpi-contract'
import {executeAskingPrice} from './asking-price-engine'
import {getMarketMatches} from './market-matching-engine'
import {getMarketScarcity} from './market-scarcity-engine'
import {getPositionConfiguration,executePropertyPositionWithWorkingEvidence} from './price-meter-property-position-execution'
import {getExplorerOptions} from './explorer-options-engine'
import {summaryIdentity,summaryOptions,summaryOptionMatches,type SummaryKey} from '@/app/components/market-summary/contract'
import type {ExplorerOptions} from '@/app/components/market-filters/types'
import {getCurrentAnalyticalDate} from './analysis-date'
import {toPositionDTO} from './price-meter-property-position-dto'
export async function runListingLens(request:Request){
 try{
  if(!request||!['en','es'].includes(request.language)||JSON.stringify(request).length>16000)throw new QuestionUnavailable('Invalid bounded request')
  lensDefinition(request.lens)
  const execution=await executeSelected(request,{
   authorize:cap=>authorizePopulationCapability(cap as AnalyticalCapability,'PRIVATE'),
   bind:()=>bindQuestion(request.context),validate:q=>{requireLensQuestion(q,request.lens)},
   execute:async q=>{
    switch(request.lens){
     case 'asking':return {kind:'asking' as const,value:await executeAskingPrice({version:1,transaction:q.transaction,geography:{level:'district',officialCode:q.district},propertyType:q.propertyType,filters:{semantics:{},facts:{}}})}
     case 'matching':{const value=await getMarketMatches(q.filters,request.language),presentation=await marketPresentation(q.filters,request.language);return {kind:'matching' as const,value,...presentation}}
     case 'frequency':{const value=await getMarketScarcity(q.filters,request.language);return {kind:'frequency' as const,value:{...value,state:value.marketSize?'ESTABLISHED' as const:'EMPTY_BASE_MARKET' as const},...await marketPresentation(q.filters,request.language)}}
     case 'position':{const config=await getPositionConfiguration(q.listingId!);if(!('geographies' in config)||config.defaultGeography!=='district')throw new QuestionUnavailable('Canonical Position configuration is unavailable');const input={listingId:q.listingId!,requestedGeographyLevel:'district' as const,requestedNormalizationBasis:config.defaultNormalization};const {result}=await executePropertyPositionWithWorkingEvidence(input,true);return {kind:'position' as const,value:toPositionDTO(result),fx:result.state==='ok'&&result.fx?{rate:result.fx.rate,effectiveDate:result.fx.effectiveDate,source:result.fx.source,resolutionMode:result.fx.resolutionMode}:null,request:input}}
    }
   },fresh:async q=>{if(q.listingId&&await readRevision(q.listingId)!==q.revision)throw new QuestionUnavailable('Property changed during execution; run again explicitly')}
  })
  return {state:'result' as const,...execution,analyticalDate:getCurrentAnalyticalDate()}
 }catch(error){
  if(error instanceof PackageCapabilityDenied)return {state:'access_required' as const}
  if(error instanceof QuestionUnavailable){
   const room=error.message==='ROOM_CONSTRAINT_NOT_APPLICABLE'
   return {state:'undefined' as const,reason:room?(request.language==='es'?'Esta propiedad está clasificada como terreno u otro tipo sin filtros de habitaciones/baños. La evidencia canónica de habitaciones/baños se conserva, pero esta pregunta no puede ejecutarse sin eliminar esas restricciones.':'This property is classified as Land or another type without Bedroom/Bathroom filters. Its canonical room evidence is preserved, but this question cannot run without removing those constraints.'):error.message,reasonLanguage:room?request.language:'en' as const}
  }
  return {state:'error' as const}
 }
}

// Reuse checks authorize and bind only; no reference population or calculation.
export async function validateListingLensReuse(request:Request,revision:string,account:string,analyticalDate:string){
 try{
  const cap=lensDefinition(request.lens).capability
  const current=await authorizePopulationCapability(cap,'PRIVATE')
  if(current!==account||getCurrentAnalyticalDate()!==analyticalDate)return false
  const q=await bindQuestion(request.context);requireLensQuestion(q,request.lens)
  return q.revision===revision&&await authorizePopulationCapability(cap,'PRIVATE')===current
 }catch{return false}
}

// Existing public Hub dictionary, acquired only inside an explicitly authorized Run.
// Return only selected display identities, not the full dictionary or another population.
async function marketPresentation(filters:Record<string,string|undefined>,language:'en'|'es'){
 const all=await getExplorerOptions(),options:ExplorerOptions={}
 for(const [key,value] of Object.entries(filters)){if(!value||key==='transaction_type')continue;const k=key as keyof ExplorerOptions;options[k]=summaryOptions(key as SummaryKey,all,language).filter(o=>value.split(',').some(v=>summaryOptionMatches(key as SummaryKey,o,v)))}
 return {options,labels:summaryIdentity(filters,options,language)}
}
