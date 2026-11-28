import 'server-only'
import {validateQuestion} from './asking-price-question'
import {FACTS,SEMANTICS,type Constraint,type Fact,type Question,type Semantic} from './asking-price-contract'
import {validateGeographicRow} from './geography/dta-identity'
import type {CanonicalMarketRequest} from './canonical-market-request'
import type {OrchestratorRequest} from './orchestrator-contract'

type ScopeTerm = {id:string;parent_id:string|null;term_type:string;level:number;official_code:string|null}
export type OrchestratorAskingQuestion =
 | {state:'ready';question:Question}
 | {state:'unavailable';reason:'geographic_scope_required'|'road_distance_not_representable'}

/** Translate only explicitly selected, canonically resolved inputs. */
export function deriveOrchestratorAskingQuestion(
 request:OrchestratorRequest,resolved:CanonicalMarketRequest,scopeTerms:readonly ScopeTerm[],
):OrchestratorAskingQuestion {
 const levels=['district','canton','province'] as const
 const level=levels.find(k=>request.scope.geography[k]!==null)
 if(!level)return {state:'unavailable',reason:'geographic_scope_required'}
 if(resolved.road)return {state:'unavailable',reason:'road_distance_not_representable'}
 const selectedId=request.scope.geography[level]
 const matches=scopeTerms.filter(t=>t.id===selectedId)
 if(matches.length!==1)throw Error('Selected analytical geography unavailable.')
 const geo=validateGeographicRow(matches[0],level)
 const selectedType=resolved.terms.filter(t=>t.dimension==='property_type')
 if(selectedType.length!==1||selectedType[0].id!==request.scope.propertyType)throw Error('Selected analytical property type disagrees.')
 const semantics:Partial<Record<Semantic,string[]>>={}
 const facts:Partial<Record<Fact,Constraint[]>>={}
 for(const t of resolved.terms){
  if((SEMANTICS as readonly string[]).includes(t.dimension)){
   const dim=t.dimension as Semantic;(semantics[dim]??=[]).push(t.id)
  }else if((FACTS as readonly string[]).includes(t.dimension)&&t.dimension!=='year_built'){
   if(t.dimension==='bathrooms'&&resolved.bathroomConstraints)continue
   const dim=t.dimension as Fact;(facts[dim]??=[]).push({kind:'category',termId:t.id})
  }
 }
 if(resolved.bathroomConstraints?.length){
  facts.bathrooms=resolved.bathroomConstraints.map(c=>c.kind==='interval'
   ? {kind:'interval',interval:{lower:c.lower,upper:c.upper,lowerInclusive:c.lowerInclusive,upperInclusive:c.upperInclusive}}
   : c)
 }
 if(resolved.year){const v=resolved.year.interval;facts.year_built=[{kind:'interval',interval:{
  lower:v.lower===null?null:String(v.lower),upper:v.upper===null?null:String(v.upper),
  lowerInclusive:v.lowerInclusive,upperInclusive:v.upperInclusive,
 }}]}
 const filters:Question['filters']={semantics,facts}
 if(request.filters.property_area)filters.propertyArea=request.filters.property_area
 if(request.filters.construction_area)filters.constructionArea=request.filters.construction_area
 const transaction=request.population==='BANK'?'sale':request.scope.transaction
 return {state:'ready',question:validateQuestion({version:1,transaction,geography:{level,officialCode:geo.officialCode},propertyType:request.scope.propertyType,filters})}
}
