import 'server-only'
import {BATHROOM_CATEGORY_IDS,encodeBathroomSelection,bathroomConstraintLabel} from './bathroom-selection'
import { readCanonicalListingEvidence, type CanonicalEvidence } from './canonical-listing-reader'
import type { CanonicalMarketRequest } from './canonical-market-request'
import { evaluateMarketYearBuilt } from './market-year-built-constraint'
import { evaluateMarketRoadDistance, evaluateBathroomConstraint, evaluateCompositionNumericalCategory, type EvidenceState } from './canonical-market-numerical-evidence'
export type AtomicPreferenceEvidence=Readonly<{dimension:string;identity:string;label:string;state:EvidenceState;alternatives?:readonly AtomicPreferenceEvidence[]}>
const numericalCategories=new Set(['bedrooms','bathrooms','parking'])
import { positiveClassifications } from './canonical-selected-classifications'
export async function acquireMarketPreferenceEvidence(request:CanonicalMarketRequest,ids:string[]){
  const selected=request.terms.filter(t=>t.dimension!=='property_type')
  const facts=[...new Set([...selected.filter(t=>numericalCategories.has(t.dimension)).map(t=>t.dimension),...(request.bathroomConstraints?['bathrooms']:[]),...(request.year?['year_built']:[]),...(request.road?['distance_to_paved_road']:[])])]
  const semantics=[...new Set(selected.filter(t=>!numericalCategories.has(t.dimension)).map(t=>t.dimension))]
  const canonical=facts.length||semantics.length?await readCanonicalListingEvidence(ids,{facts,semantics}):new Map<string,CanonicalEvidence>()
  const classifications=await positiveClassifications(ids,[...selected.filter(t=>numericalCategories.has(t.dimension)).map(t=>t.id),...(request.bathroomConstraints?BATHROOM_CATEGORY_IDS:[])])
  return {canonical,classifications}
}
export function evaluateMarketPreferences(request:CanonicalMarketRequest,row:Record<string,any>,evidence:{canonical:Map<string,Pick<CanonicalEvidence,'facts'|'selections'>>;classifications:Map<string,Set<string>>},options:Readonly<{matchingNumericalEvidence?:boolean;matchingAttributeScoring?:boolean}>={}):AtomicPreferenceEvidence[]{
  const facts=evidence.canonical.get(row.id)?.facts??[],selections=evidence.canonical.get(row.id)?.selections??[]
  const output:AtomicPreferenceEvidence[]=request.terms.filter(t=>t.dimension!=='property_type'&&!(t.dimension==='bathrooms'&&request.bathroomConstraints)).map(t=>{
    let state:EvidenceState='UNKNOWN'
    if(numericalCategories.has(t.dimension)){
      const fact=facts.find(f=>f.dimension===t.dimension)
      if(evidence.classifications.get(row.id)?.has(t.id)||fact?.kind==='category'&&fact.category_term_id===t.id)state='MATCH'
      else if(fact?.kind==='category')state='NONMATCH'
      // Preserve each option’s canonical evidence before any Matching-only attribute reduction.
      else if(options.matchingNumericalEvidence===true)state=evaluateCompositionNumericalCategory(t.id,fact).state
    }else{
      const actual=selections.filter(s=>s.dimension===t.dimension)
      if(actual.some(s=>s.ontology_term_id===t.id))state='MATCH'
      // Legal status is the only selected soft semantic dimension whose frozen
      // canonical contract establishes one exclusive current selection.
      else if(t.dimension==='legal_status'&&actual.length===1)state='NONMATCH'
    }
    return {dimension:t.dimension,identity:t.id,label:t.label,state}
  })
  if(request.bathroomConstraints)for(const c of request.bathroomConstraints)output.push({dimension:'bathrooms',identity:encodeBathroomSelection([c]),label:bathroomConstraintLabel(c,request.bathroomLanguage??'en'),state:evaluateBathroomConstraint(c,facts.find(f=>f.dimension==='bathrooms'),[...(evidence.classifications.get(row.id)??[])]).state})
  for(const [dimension,r]of [['property_area',request.propertyArea],['construction_area',request.constructionArea]]as const)if(r){
    const value=row[dimension];const numeric=(typeof value==='number'||typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value))?Number(value):null
    const state:EvidenceState=numeric===null||!Number.isFinite(numeric)||numeric<=0?'UNKNOWN':
      (r.min===null||numeric>=r.min)&&(r.max===null||numeric<r.max)?'MATCH':'NONMATCH'
    output.push({dimension,identity:JSON.stringify(r),label:dimension,state})
  }
  if(request.year)output.push({dimension:'year_built',identity:JSON.stringify(request.year.interval),label:'year_built',state:evaluateMarketYearBuilt(request.year,facts.find(f=>f.dimension==='year_built')).state})
  if(request.road)output.push({dimension:'distance_to_paved_road',identity:JSON.stringify(request.road),label:'distance_to_paved_road',state:evaluateMarketRoadDistance(request.road,facts.find(f=>f.dimension==='distance_to_paved_road'))})
  return options.matchingAttributeScoring===true?groupMatchingAttributes(output):output
}
// Matching only: acceptable alternatives contribute one three-valued vote per dimension.
export function groupMatchingAttributes(options:readonly AtomicPreferenceEvidence[]):AtomicPreferenceEvidence[]{
  const groups=new Map<string,AtomicPreferenceEvidence[]>()
  for(const option of options){const group=groups.get(option.dimension)??[];if(group.some(p=>p.identity===option.identity))throw Error('Duplicate matching alternative.');group.push(option);groups.set(option.dimension,group)}
  return [...groups].map(([dimension,alternatives])=>({dimension,identity:JSON.stringify(alternatives.map(p=>p.identity)),label:alternatives.map(p=>p.label).join(' / '),
    state:alternatives.some(p=>p.state==='MATCH')?'MATCH':alternatives.every(p=>p.state==='NONMATCH')?'NONMATCH':'UNKNOWN',alternatives}))
}
export function rankMarketPreferences(rows:readonly {id:string;preferences:readonly AtomicPreferenceEvidence[]}[]){
  return rows.map(row=>{
    const confirmedMatches=row.preferences.filter(p=>p.state==='MATCH').length
    const confirmedNonmatches=row.preferences.filter(p=>p.state==='NONMATCH').length
    const unknown=row.preferences.length-confirmedMatches-confirmedNonmatches
    const known=confirmedMatches+confirmedNonmatches
    return {...row,confirmedMatches,confirmedNonmatches,unknown,matchScore:known?confirmedMatches/known*100:null,
      matchState:known?'ESTABLISHED':'NO_EVALUABLE_MATCH_EVIDENCE'}
  }).sort((a,b)=>(b.matchScore??-1)-(a.matchScore??-1)||b.confirmedMatches-a.confirmedMatches||(a.id<b.id?-1:a.id>b.id?1:0))
}
