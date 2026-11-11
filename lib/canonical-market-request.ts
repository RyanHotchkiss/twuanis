import {ordinaryUniverse,analyticalUniverse,type AnalyticalUniverse} from './analytical-universe'
import 'server-only'
import {isTypedBathroomSelection,decodeBathroomSelection,type BathroomConstraint} from './bathroom-selection'
import { supabaseAdmin } from './supabase-admin'
import { resolvePopulationGeography } from './canonical-population'
import { resolvePropertyAreaConstraint, resolveConstructionAreaConstraint } from './market-intelligence-area-ranges'
import { resolveMarketYearBuiltConstraint, type YearConstraint } from './market-year-built-constraint'
import type { CanonicalMarketBoundary } from './canonical-market-population'
import { customerRoadDistanceRange } from './canonical-customer-road-distance'
import { validateOntologyTermId } from './geography/dta-identity'
import { COMPOSITION_NUMERICAL_CATEGORIES } from './market-composition-category-contract'
import {hasRoomEligiblePropertyType} from './intelligence-room-filter-visibility'
import { compositionYearCategoryId } from './canonical-market-numerical-evidence'

export const MARKET_SEMANTIC_DIMENSIONS = ['property_type','bedrooms','bathrooms','parking','utility',
  'environment','terrain','accessibility','legal_status'] as const
export type MarketTerm = Readonly<{id:string;dimension:string;label:string}>
export type CanonicalMarketRequest = Readonly<{
  universe:AnalyticalUniverse
  base:CanonicalMarketBoundary
  terms:readonly MarketTerm[]
  // Explicit opt-in: other callers retain their established membership/preference semantics.
  numericalTerms?:readonly MarketTerm[]
  bathroomConstraints?:readonly BathroomConstraint[]
  bathroomLanguage?:'en'|'es'
  year:YearConstraint|null
  road:ReturnType<typeof customerRoadDistanceRange>|null
  propertyArea:CanonicalMarketBoundary['propertyArea']
  constructionArea:CanonicalMarketBoundary['constructionArea']
}>
// Resolve the older URL boundary once. Exact canonical slugs are compatibility
// keys only; downstream identity is the lossless term ID. Never match labels.
export async function resolveCanonicalMarketRequest(input:Record<string,string|undefined>,language:'en'|'es'='en',options:Readonly<{numericalCategoryFilters?:boolean;universe?:AnalyticalUniverse}>={}):Promise<CanonicalMarketRequest>{
  const population=ordinaryUniverse(input.transaction_type),universe=options.universe??population
  if(input.population!==undefined&&input.population!==universe)throw Error('Conflicting analytical universe.')
  if(options.universe!==undefined&&analyticalUniverse(options.universe)!=='BANK'&&options.universe!==population)throw Error('Conflicting analytical universe.')
  const road=input.distance_to_paved_road_range?customerRoadDistanceRange(input.distance_to_paved_road_range):null
  const bathroomConstraints=isTypedBathroomSelection(input.bathrooms)?decodeBathroomSelection(input.bathrooms!):undefined
  if(input.bathrooms?.startsWith('bn')&&!bathroomConstraints)throw Error('Unsupported Bathroom selection version.')
  const numericalMode=options.numericalCategoryFilters===true
  const year=input.year_built&&!numericalMode?resolveMarketYearBuiltConstraint(input.year_built):null
  const area=(value:string|undefined,resolve:typeof resolvePropertyAreaConstraint)=>{
    const result=resolve(value);if(value&&!result)throw Error('Invalid area constraint.');return result??undefined
  }
  const propertyArea=area(input.property_area,resolvePropertyAreaConstraint)
  const constructionArea=area(input.construction_area,resolveConstructionAreaConstraint)
  const {resolved}=await resolvePopulationGeography({province:input.province,canton:input.canton,district:input.district})
  const groups=Object.values(resolved).map(entities=>entities!.map(e=>e.ontologyTermId as string))
  const terms:MarketTerm[]=[]
  for(const dimension of numericalMode?[...MARKET_SEMANTIC_DIMENSIONS,'year_built']:MARKET_SEMANTIC_DIMENSIONS){
    const raw=dimension==='bathrooms'&&bathroomConstraints?bathroomConstraints.flatMap(c=>c.kind==='category'?[c.termId]:[]).join(','):input[dimension];if(!raw)continue
    const codes=raw.split(',').map(code=>dimension==='year_built'?compositionYearCategoryId(code)??code:code)
    if(codes.length>25||new Set(codes).size!==codes.length||codes.some(c=>!c||c.length>160))throw Error('Invalid canonical selection.')
    // Separate ID and exact-slug inputs avoids an OR expression assembled from user text.
    for(const code of codes){
      const isId=/^-?\d+$/.test(code)
      if(isId)validateOntologyTermId(code)
      else if(!/^[a-z0-9-]+$/.test(code))throw Error('Canonical selection requires an ID or canonical slug.')
      const {data,error,count}=await supabaseAdmin.from('ontology_terms')
        .select('id::text,term_type,level,slug,term_name,term_name_en,term_name_es',{count:'exact'}).eq('term_type',dimension)
        .eq(isId?'id':'slug',code).limit(2)
      if(error||count!==1||data?.length!==1)throw Error('Unresolved or ambiguous canonical selection.')
      const term=data[0]
      if(term.term_type!==dimension||term.level!==1||!isId&&term.slug!==code||isId&&term.id!==code)throw Error('Mismatched canonical selection.')
      validateOntologyTermId(term.id)
      if(numericalMode&&['bedrooms','bathrooms','parking','year_built'].includes(dimension)&&!COMPOSITION_NUMERICAL_CATEGORIES.some(c=>c.termId===term.id&&c.dimension===dimension))throw Error('Unavailable numerical category.')
      if(terms.some(t=>t.dimension===dimension&&t.id===term.id))throw Error('Duplicate canonical selection.')
      terms.push(Object.freeze({id:term.id,dimension,label:typeof term[language==='es'?'term_name_es':'term_name_en']==='string'?term[language==='es'?'term_name_es':'term_name_en']:typeof term.term_name==='string'?term.term_name:''}))
    }
  }
  const propertyType=terms.filter(t=>t.dimension==='property_type').map(t=>t.id)
  if((numericalMode||bathroomConstraints)&&(input.bedrooms||input.bathrooms)&&!hasRoomEligiblePropertyType(propertyType))throw Error('Bedrooms and Bathrooms require an eligible explicit property type.')
  if(propertyType.length)groups.push(propertyType)
  return Object.freeze({universe,...(bathroomConstraints?{bathroomConstraints:Object.freeze(bathroomConstraints),bathroomLanguage:language}:{}),base:Object.freeze({population:universe,transaction:input.transaction_type as 'sale'|'rent',
    membershipGroups:Object.freeze(groups.map(g=>Object.freeze(g)))}),terms:Object.freeze(terms),...(numericalMode?{numericalTerms:Object.freeze(terms.filter(t=>['bedrooms','bathrooms','parking','year_built'].includes(t.dimension)))}:{}),year,road,propertyArea,constructionArea})
}
// Population-filter semantics: OR within a selected semantic dimension, AND
// across dimensions. Matching and Configuration deliberately compose separately.
export function canonicalMarketFilterBoundary(request:CanonicalMarketRequest):CanonicalMarketBoundary{
  const groups=[...request.base.membershipGroups]
  for(const dimension of MARKET_SEMANTIC_DIMENSIONS){if(dimension==='property_type'||dimension==='bathrooms'&&request.bathroomConstraints||request.numericalTerms!==undefined&&['bedrooms','bathrooms','parking'].includes(dimension))continue
    const ids=request.terms.filter(t=>t.dimension===dimension).map(t=>t.id);if(ids.length)groups.push(ids)
  }
  return {...request.base,membershipGroups:groups,propertyArea:request.propertyArea,constructionArea:request.constructionArea}
}
