import 'server-only'
import type { CanonicalMarketRequest } from './canonical-market-request'
import type { CanonicalFact } from './canonical-listing-reader'
import type { AtomicPreferenceEvidence, acquireMarketPreferenceEvidence } from './canonical-market-preferences'
import type { MatchEvidence, MatchExplanation } from './market-matching-evidence-contract'
function factEvidence(f?:CanonicalFact):MatchEvidence{
 if(!f)return {kind:'unknown'}
 if(f.kind==='exact')return {kind:'exact',value:f.exact_value!}
 if(f.kind==='category')return {kind:'term',id:f.category_term_id!}
 return {kind:'range',lower:f.range_lower,upper:f.range_upper,lowerInclusive:f.lower_inclusive!,upperInclusive:f.upper_inclusive!}
}
// Pure projection after ranking. No clients, query functions, scoring or label parsing.
export function explainMarketPreference(request:CanonicalMarketRequest,row:Record<string,unknown>,evidence:Awaited<ReturnType<typeof acquireMarketPreferenceEvidence>>,p:AtomicPreferenceEvidence):MatchExplanation{
 const canonical=evidence.canonical.get(String(row.id)),term=request.terms.find(t=>t.dimension===p.dimension&&t.id===p.identity)
 if(term){
  const selected:MatchEvidence={kind:'term',id:term.id,label:term.label}
  if(['bedrooms','bathrooms','parking'].includes(p.dimension)){
   if(evidence.classifications.get(String(row.id))?.has(term.id))return {selected,candidate:{kind:'term',id:term.id,label:term.label}}
   const candidate=factEvidence(canonical?.facts.find(f=>f.dimension===p.dimension))
   if(candidate.kind==='term'&&candidate.id===term.id)candidate.label=term.label
   return {selected,candidate}
  }
  const selections=canonical?.selections.filter(s=>s.dimension===p.dimension)??[]
  const actual=selections.find(s=>s.ontology_term_id===term.id)??(p.state==='NONMATCH'?selections[0]:undefined)
  return {selected,candidate:actual?{kind:'term',id:actual.ontology_term_id,label:actual.ontology_term_id===term.id?term.label:actual.term_name}:{kind:'unknown'}}
 }
 const area=p.dimension==='property_area'?request.propertyArea:p.dimension==='construction_area'?request.constructionArea:undefined
 if(area){const v=row[p.dimension];return {selected:{kind:'range',lower:area.min===null?null:String(area.min),upper:area.max===null?null:String(area.max),lowerInclusive:area.min!==null,upperInclusive:false},candidate:p.state==='UNKNOWN'?{kind:'unknown'}:{kind:'exact',value:String(v)}}}
 const interval=p.dimension==='year_built'?request.year?.interval:null
 const road=p.dimension==='distance_to_paved_road'?request.road:null
 if(!interval&&!road)throw Error('Unsupported matching explanation dimension.')
 return {selected:interval?{kind:'range',lower:interval.lower===null?null:String(interval.lower),upper:interval.upper===null?null:String(interval.upper),lowerInclusive:interval.lowerInclusive,upperInclusive:interval.upperInclusive}:{kind:'range',lower:road!.lower,upper:road!.upper,lowerInclusive:road!.lower_inclusive,upperInclusive:road!.upper_inclusive},candidate:factEvidence(canonical?.facts.find(f=>f.dimension===p.dimension))}
}
