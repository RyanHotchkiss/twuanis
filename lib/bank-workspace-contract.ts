import type {Catalog} from './asking-price-contract'
import type {PopulationEngineRequest,PopulationCohortCommand} from './population-engine-execution'
import {decodeBathroomSelection} from './bathroom-selection'
import {MARKET_YEAR_BUILT_OPTIONS} from './market-year-built-options'
import {FACTS,SEMANTICS} from './asking-price-contract'
export class BankQuestionInputError extends Error {
 constructor(readonly field:string){super('Required Bank question input: '+field);this.name='BankQuestionInputError'}
}
export function bankQuestionInputMessage(error:unknown,language:'en'|'es'):string|null {
 if(!(error instanceof BankQuestionInputError))return null
 const es=language==='es'
 if(error.field==='property_type')return es?'Seleccione un tipo de propiedad antes de ejecutar.':'Select a property type before running.'
 if(error.field==='geography')return es?'Seleccione una provincia, un cantón o un distrito antes de ejecutar esta pregunta de precios.':'Select a province, canton or district before running this price question.'
 if(error.field==='geography_hierarchy')return es?'Complete la provincia y el cantón del distrito seleccionado.':'Complete the province and canton for the selected district.'
 return es?'Seleccione una opción canónica vigente para este campo.':'Select a current canonical option for this field.'
}
export type BankDraft=Record<string,string|undefined>
export function bankOptions(catalog:Catalog){
 if(catalog.state!=='ready')return {}
 return Object.fromEntries([...new Set(catalog.options.map(o=>o.type))].map(type=>[type,catalog.options.filter(o=>o.type===type).map(o=>({id:o.id,parent_id:o.parentId,official_code:o.code,slug:o.id,term_name:o.en,term_name_en:o.en,term_name_es:o.es}))]))
}
export function bankCommand(engine:PopulationEngineRequest['engine'],draft:BankDraft,catalog:Catalog,language:'en'|'es'):PopulationEngineRequest|{left:PopulationEngineRequest;right:PopulationEngineRequest}{
 if(catalog.state!=='ready')throw Error('Canonical options unavailable.')
 const terms=catalog.options
 function term(type:string,value:string|undefined){const matches=terms.filter(t=>t.type===type&&(t.id===value||t.code===value));if(matches.length!==1)throw new BankQuestionInputError(type);return matches[0]}
 function scope(prefix=''){
  const geography={province:null,canton:null,district:null} as PopulationEngineRequest['scope']['geography']
  const g:any={};for(const level of ['province','canton','district'] as const)if(!(engine==='cohort-comparison'&&prefix==='')&&draft[prefix+level])g[level]=term(level,draft[prefix+level])
  if(g.district&&(!g.canton||g.district.parentId!==g.canton.id)||g.canton&&(!g.province||g.canton.parentId!==g.province.id))throw new BankQuestionInputError('geography_hierarchy')
  return {population:'BANK' as const,transaction:'bank' as const,geography:{...geography,...Object.fromEntries(Object.entries(g).map(([k,v])=>[k,(v as any).id]))},propertyType:term('property_type',engine==='cohort-comparison'&&prefix===''?draft.a_property_type:draft[prefix+'property_type']??draft.property_type).id,propertyBasis:(draft.property_basis==='land_only'?'land_only':'improved_property') as 'land_only'|'improved_property',areaBasis:(draft.normalization_basis==='construction'?'construction':'land') as 'land'|'construction'}
 }
 function filters(prefix=''){return Object.fromEntries(['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status','year_built','distance_to_paved_road_range','property_area','construction_area',...(engine==='comparison'?['price_range']:[])].flatMap(k=>draft[prefix+k]?[[k,draft[prefix+k]]]:[]))}
 if(engine==='comparison')return {left:{engine,scope:scope('a_'),language,filters:filters('a_')},right:{engine,scope:scope('b_'),language,filters:filters('b_')}}
 const request:{-readonly [K in keyof PopulationEngineRequest]:PopulationEngineRequest[K]}={engine,scope:scope(),language}
 if(engine==='market-asking-price-distribution'||engine==='discovery'){
  const geography=(['district','canton','province'] as const).find(level=>draft[level]);if(!geography)throw new BankQuestionInputError('geography')
  const facts:any={},semantics:any={}
  for(const d of SEMANTICS)if(draft[d])semantics[d]=draft[d]!.split(',').map(id=>term(d,id).id)
  for(const d of FACTS)if(draft[d]){
   if(d==='bathrooms'&&draft[d]!.startsWith('bn'))facts[d]=decodeBathroomSelection(draft[d]!)
   else if(d==='year_built'){const y=MARKET_YEAR_BUILT_OPTIONS.find(o=>o.key===draft[d]);if(!y)throw Error('Invalid Year Built input.');facts[d]=[{kind:'interval',interval:{lower:y.lower===null?null:String(y.lower),upper:y.upper===null?null:String(y.upper),lowerInclusive:y.lower!==null,upperInclusive:false}}]}
   else facts[d]=draft[d]!.split(',').map(id=>({kind:'category',termId:term(d,id).id}))
  }
  return {...request,askingQuestion:{version:1,transaction:'sale',geography:{level:geography,officialCode:term(geography,draft[geography]).code!},propertyType:request.scope.propertyType,filters:{semantics,facts,...(draft.property_area?{propertyArea:draft.property_area}:{}),...(draft.construction_area?{constructionArea:draft.construction_area}:{})}}}
 }
 if(['summary','composition','matching','configuration','distribution','geography','size','construction-land','cross-dimensional'].includes(engine))request.filters=filters()
 if(engine==='cross-dimensional')request.questionKey=draft.question_key as PopulationEngineRequest['questionKey']
 if(['position','comparables','weighted-price'].includes(engine)&&draft.subject_kind!=='hypothetical'){request.subject={population:'BANK',listingId:draft.subject_id??''};request.subjectRevision=draft.subject_revision}
 if(['position','comparables'].includes(engine))request.geographyLevel=draft.geography_level as 'province'|'canton'|'district'
 if(engine==='comparables')request.activeDimensions=(draft.active_dimensions?.split(',').filter(Boolean)??[]) as PopulationEngineRequest['activeDimensions']
 if(engine==='cohort-comparison'){
  function cohort(prefix:string):PopulationCohortCommand{
   const level=(['district','canton','province'] as const).find(level=>draft[prefix+level]);if(!level)throw Error('Define each cohort geography.')
   return {scope:scope(prefix),geography:{level,termId:term(level,draft[prefix+level]).id},characteristics:[1,2].map(n=>{const d=draft[`${prefix}characteristic_${n}_type`]!,v=draft[`${prefix}characteristic_${n}`]??'';return v.startsWith('exact:')?{kind:'exact',termType:d,exactValue:v.slice(6)}:{kind:'category',termId:term(d,v).id}}) as PopulationCohortCommand['characteristics'],propertyAreaRange:draft[prefix+'property_area']??null,constructionAreaRange:draft[prefix+'construction_area']??null,constructionLandCohortKey:draft[prefix+'construction_land_cohort']??null}
  }
  request.cohortA=cohort('a_');request.cohortB=cohort('b_');request.referenceCohort=draft.reference_cohort as 'A'|'B'
 }
 if(engine==='asking-area-ratio'||engine==='weighted-price'){
  const level=(['district','canton','province'] as const).find(level=>draft[level]);if(!level)throw Error('Select a reference geography.')
  request.ratioQuestion={transaction:'sale',geography:{level,termId:term(level,draft[level]).id},propertyType:request.scope.propertyType,propertyArea:{min:draft.land_min??'',max:draft.land_max??''},constructionArea:{min:draft.construction_min??'',max:draft.construction_max??''}}
  if(engine==='weighted-price'&&draft.subject_kind==='hypothetical')request.hypotheticalSubject={kind:'hypothetical',propertyArea:draft.subject_land??'',constructionArea:draft.subject_construction??'',province:request.scope.geography.province!,canton:request.scope.geography.canton!,district:request.scope.geography.district,askingPrice:draft.subject_price?{amount:draft.subject_price,currency:draft.subject_currency==='USD'?'USD':'CRC'}:null}
 }
 return request
}
