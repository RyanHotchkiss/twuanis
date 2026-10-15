import 'server-only'
import {recordAnalyticalEvidence,protectAnalyticalInput,traceEvidenceCall,inEvidenceEngine,inEvidencePopulation} from './orchestrator-evidence-v2'
import {parseWeightedQuestion,type WeightedQuestion} from './weighted-price-contract'
import {establishWeightedSubject as live_establishWeightedSubject,WeightedQuestionError} from './weighted-price-data'
import {orchestratorMemo} from './orchestrator-execution-context'
import {createHash} from 'node:crypto'
import {populationEngine,type PopulationEngineId} from './population-engine-registry'
import {acquireCanonicalPopulation,deliverCanonicalPopulation,type AcquisitionRequest,type AcquisitionResult} from './canonical-population-acquisition'
import {supabaseAdmin} from './supabase-admin'
import {getCurrentAnalyticalDate} from './analysis-date'
import {getHistoricalUsdToCrcRate} from './fx/fx-service'
import {normalizeAmountToCrc} from './currency-conversion'
import {resolvePriceMeterAnalyticalIdentity,type PriceMeterFxIdentity} from './price-meter-identity'
import {buildPriceMeterObservations as live_buildPriceMeterObservations} from './price-meter-observation-builder'
import {buildPriceMeterDistribution as live_buildPriceMeterDistribution} from './price-meter-distribution'
import {buildPriceMeterTransactionCohorts as live_buildPriceMeterTransactionCohorts} from './price-meter-transaction-cohort'
import {buildPriceMeterAnalyticalCohort as live_buildPriceMeterAnalyticalCohort} from './price-meter-analytical-cohort'
import {buildNumericalDistribution as live_buildNumericalDistribution} from './numerical-distribution'
import {calculateMarketSummary as live_calculateMarketSummary} from './market-inventory-engine'
import {projectCanonicalPrevalence as live_projectCanonicalPrevalence,COMPOSITION_DIMENSIONS,canonicalMarketPrevalence as live_canonicalMarketPrevalence} from './canonical-market-prevalence'
import {resolveCanonicalMarketRequest,type CanonicalMarketRequest} from './canonical-market-request'
import {evaluateMarketPreferences as live_evaluateMarketPreferences,rankMarketPreferences as live_rankMarketPreferences} from './canonical-market-preferences'
import {calculateConfigurationFrequency as live_calculateConfigurationFrequency} from './market-scarcity-engine'
import {calculateMarketComparisonSide as live_calculateMarketComparisonSide} from './market-comparison-engine'
import {resolvePriceMeterGeographicScope} from './price-meter-geographic-scope'
import {buildPriceMeterGeographicLevel as live_buildPriceMeterGeographicLevel} from './price-meter-geographic-distribution'
import {buildPriceMeterGeographicStatistics as live_buildPriceMeterGeographicStatistics} from './price-meter-geographic-statistics'
import {buildPriceMeterSizeRelationshipPopulation as live_buildPriceMeterSizeRelationshipPopulation} from './price-meter-size-relationship-population'
import {buildPriceMeterDescriptiveSizeRelationshipResult as live_buildPriceMeterDescriptiveSizeRelationshipResult} from './price-meter-size-relationship-math'
import {buildSelectedConstructionLand as live_buildSelectedConstructionLand} from './price-meter-construction-land-selected'
import {buildPriceMeterComparisonCohortPopulation as live_buildPriceMeterComparisonCohortPopulation} from './price-meter-comparison-cohort-population'
import {buildPriceMeterComparisonAnalysis as live_buildPriceMeterComparisonAnalysis} from './price-meter-comparison-analysis'
import type {PriceMeterComparisonCohortDefinition} from './price-meter-comparison-cohort'
import {resolvePriceMeterCrossDimensionalIdentity} from './price-meter-cross-dimensional-identity'
import {analyzePriceMeterCrossDimensionalRelationship as live_analyzePriceMeterCrossDimensionalRelationship} from './price-meter-cross-dimensional-analyzer'
import type {PriceMeterCrossDimensionalQuestionKey} from './price-meter-cross-dimensional-question'
import {calculateDiscoveryPopulation as live_calculateDiscoveryPopulation} from './phase14-comparative-discovery'
import {resolvePriceMeterPropertyPositionIdentity} from './price-meter-property-position-identity'
import {buildPriceMeterPropertyPositionPopulation} from './price-meter-property-position-population'
import {buildPriceMeterPropertyPositionPercentile} from './price-meter-property-position-percentile'
import {buildPriceMeterPropertyPositionMedian} from './price-meter-property-position-median'
import {buildPriceMeterPropertyPositionInterval} from './price-meter-property-position-interval'
import {buildPriceMeterPropertyPositionTail} from './price-meter-property-position-tail'
import {buildPriceMeterPropertyPositionConstructionLandContext} from './price-meter-property-position-construction-land'
import {buildPriceMeterPropertyPositionEvidence as live_buildPriceMeterPropertyPositionEvidence} from './price-meter-property-position-evidence'
import {runPriceMeterComparableEngine as live_runPriceMeterComparableEngine} from './price-meter-comparable-engine'
import type {PriceMeterComparableDimension} from './price-meter-comparable-dimensions'
import {canonicalDecimal,parseRatioQuestion,type RatioQuestion} from './asking-area-ratio-contract'
import {analyzeAreaRatio as live_analyzeAreaRatio} from './asking-area-ratio-math'
import {analyzeWeightedPrice as live_analyzeWeightedPrice} from './weighted-price-math'
import type {CanonicalEvidence,CanonicalFact,CanonicalSelection} from './canonical-listing-reader'
import type {CanonicalGeographyResolution,CanonicalGeographyTerm} from './geography/canonical-geography'
import {validateOntologyTermId} from './geography/dta-identity'
import {isPriceMeterCharacteristicType,type PriceMeterCharacteristicIdentity} from './price-meter-characteristic-identity'

const calculateMarketSummary=traceEvidenceCall('calculateMarketSummary',live_calculateMarketSummary)
const projectCanonicalPrevalence=traceEvidenceCall('projectCanonicalPrevalence',live_projectCanonicalPrevalence)
const canonicalMarketPrevalence=traceEvidenceCall('canonicalMarketPrevalence',live_canonicalMarketPrevalence)
const evaluateMarketPreferences=traceEvidenceCall('evaluateMarketPreferences',live_evaluateMarketPreferences)
const rankMarketPreferences=traceEvidenceCall('rankMarketPreferences',live_rankMarketPreferences)
const calculateConfigurationFrequency=traceEvidenceCall('calculateConfigurationFrequency',live_calculateConfigurationFrequency)
const calculateMarketComparisonSide=traceEvidenceCall('calculateMarketComparisonSide',live_calculateMarketComparisonSide)
const buildPriceMeterObservations=traceEvidenceCall('buildPriceMeterObservations',live_buildPriceMeterObservations)
const buildPriceMeterAnalyticalCohort=traceEvidenceCall('buildPriceMeterAnalyticalCohort',live_buildPriceMeterAnalyticalCohort)
const buildPriceMeterTransactionCohorts=traceEvidenceCall('buildPriceMeterTransactionCohorts',live_buildPriceMeterTransactionCohorts)
const buildPriceMeterDistribution=traceEvidenceCall('buildPriceMeterDistribution',live_buildPriceMeterDistribution)
const buildNumericalDistribution=traceEvidenceCall('buildNumericalDistribution',live_buildNumericalDistribution)
const buildPriceMeterGeographicLevel=traceEvidenceCall('buildPriceMeterGeographicLevel',live_buildPriceMeterGeographicLevel)
const buildPriceMeterGeographicStatistics=traceEvidenceCall('buildPriceMeterGeographicStatistics',live_buildPriceMeterGeographicStatistics)
const buildPriceMeterSizeRelationshipPopulation=traceEvidenceCall('buildPriceMeterSizeRelationshipPopulation',live_buildPriceMeterSizeRelationshipPopulation)
const buildPriceMeterDescriptiveSizeRelationshipResult=traceEvidenceCall('buildPriceMeterDescriptiveSizeRelationshipResult',live_buildPriceMeterDescriptiveSizeRelationshipResult)
const buildSelectedConstructionLand=traceEvidenceCall('buildSelectedConstructionLand',live_buildSelectedConstructionLand)
const buildPriceMeterComparisonCohortPopulation=traceEvidenceCall('buildPriceMeterComparisonCohortPopulation',live_buildPriceMeterComparisonCohortPopulation)
const buildPriceMeterComparisonAnalysis=traceEvidenceCall('buildPriceMeterComparisonAnalysis',live_buildPriceMeterComparisonAnalysis)
const analyzePriceMeterCrossDimensionalRelationship=traceEvidenceCall('analyzePriceMeterCrossDimensionalRelationship',live_analyzePriceMeterCrossDimensionalRelationship)
const calculateDiscoveryPopulation=traceEvidenceCall('calculateDiscoveryPopulation',live_calculateDiscoveryPopulation)
const buildPriceMeterPropertyPositionEvidence=traceEvidenceCall('buildPriceMeterPropertyPositionEvidence',live_buildPriceMeterPropertyPositionEvidence)
const runPriceMeterComparableEngine=traceEvidenceCall('runPriceMeterComparableEngine',live_runPriceMeterComparableEngine)
const analyzeAreaRatio=traceEvidenceCall('analyzeAreaRatio',live_analyzeAreaRatio)
const analyzeWeightedPrice=traceEvidenceCall('analyzeWeightedPrice',live_analyzeWeightedPrice)
const establishWeightedSubject=traceEvidenceCall('establishWeightedSubject',live_establishWeightedSubject)

export type PopulationEngineRequest=Readonly<{
 engine:PopulationEngineId;scope:Omit<AcquisitionRequest,'capability'|'profile'>;language:'en'|'es';
 filters?:Record<string,string|undefined>;
 questionKey?:PriceMeterCrossDimensionalQuestionKey;
 subject?:{population:'PRIVATE'|'BANK';listingId:string};
 referencePopulation?:'PRIVATE'|'BANK';
 geographyLevel?:'province'|'canton'|'district';
 activeDimensions?:PriceMeterComparableDimension[];
 cohortA?:{characteristicIds:[string,string];propertyAreaRange:string|null;constructionAreaRange:string|null;constructionLandCohortKey:string|null};
 cohortB?:{characteristicIds:[string,string];propertyAreaRange:string|null;constructionAreaRange:string|null;constructionLandCohortKey:string|null};
 referenceCohort?:'A'|'B';ratioQuestion?:RatioQuestion;hypotheticalSubject?:Extract<WeightedQuestion['subject'],{kind:'hypothetical'}>
}>
type EngineRow={id:string;population:'PRIVATE'|'BANK';row:Record<string,any>;facts:CanonicalFact[];selections:CanonicalSelection[];geography:CanonicalEvidence['geography']}
type Dictionary=Map<string,any>&{privateMemberships?:Map<string,string[]>}
type NumericalContext={date:string;fx:PriceMeterFxIdentity|null;comparisonRate:number|null}
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const qualified=(population:string,id:string)=>population+':'+id
export function validatePopulationEngineRequest(input:PopulationEngineRequest):PopulationEngineRequest{
 const r=JSON.parse(JSON.stringify(input));populationEngine(r.engine)
 if(!['en','es'].includes(r.language)||Object.keys(r).some(k=>!['engine','scope','language','filters','questionKey','subject','referencePopulation','geographyLevel','activeDimensions','cohortA','cohortB','referenceCohort','ratioQuestion','hypotheticalSubject'].includes(k)))throw Error('Invalid engine request.')
 if(r.referencePopulation&&r.scope.population!=='COMBINED'&&r.referencePopulation!==r.scope.population)throw Error('Reference population outside authorization.')
 if(r.subject&&(!['BANK','PRIVATE'].includes(r.subject.population)||! /^[0-9a-f-]{36}$/i.test(r.subject.listingId)||r.scope.population!=='COMBINED'&&r.subject.population!==r.scope.population))throw Error('Subject population outside authorization.')
 if(r.filters&&Object.entries(r.filters).some(([k,v])=>!['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status','year_built','distance_to_paved_road_range','property_area','construction_area'].includes(k)||typeof v!=='string'))throw Error('Unsupported engine filter.');
 if(r.referenceCohort&&!['A','B'].includes(r.referenceCohort))throw Error('Invalid comparison reference.')
 if(r.hypotheticalSubject){if(r.engine!=='weighted-price'||!r.ratioQuestion||r.subject)throw Error('Compatible hypothetical weighted subject required.');r.hypotheticalSubject=parseWeightedQuestion({cohort:r.ratioQuestion,subject:r.hypotheticalSubject}).subject as Extract<WeightedQuestion['subject'],{kind:'hypothetical'}>}
 if(r.ratioQuestion){r.ratioQuestion=parseRatioQuestion(r.ratioQuestion);const q=r.ratioQuestion;if(q.transaction!==r.scope.transaction||q.propertyType!==r.scope.propertyType||r.scope.geography[q.geography.level]!==q.geography.termId)throw Error('Ratio question outside canonical scope.')}
 return r
}
async function dictionary(result:AcquisitionResult,r:PopulationEngineRequest):Promise<Dictionary>{
 const ids=new Set<string>([r.scope.propertyType,...Object.values(r.scope.geography).filter((id):id is string=>id!==null)])
 for(const b of result.bank){for(const s of b.semantics)ids.add(String(s.termId));for(const f of b.otherFacts)if(f.categoryTermId)ids.add(String(f.categoryTermId))}
 for(const p of result.private){for(const s of p.evidence.selections)ids.add(s.ontology_term_id);for(const f of p.evidence.facts)if(f.category_term_id)ids.add(f.category_term_id)}
 for(const c of [r.cohortA,r.cohortB])if(c){if(!Array.isArray(c.characteristicIds)||c.characteristicIds.length!==2)throw Error('Exactly two canonical characteristics required.');c.characteristicIds.forEach(id=>ids.add(id))}
 const privateMemberships=new Map(result.private.map(p=>[p.listingId,[] as string[]]));const dimensions=['property_type','bedrooms','bathrooms','parking','year_built','utility','environment','terrain','accessibility','legal_status'];const privateIds=[...privateMemberships.keys()];for(let i=0;i<privateIds.length;i+=25){const batch=privateIds.slice(i,i+25);let offset=0,total:number|null=null;const seen=new Set<string>();do{const {data,error,count}=await supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,ontology_terms!inner(id::text,term_type,level)',{count:'exact'}).in('listing_id',batch).in('ontology_terms.term_type',dimensions).order('listing_id').order('ontology_term_id').range(offset,offset+499);if(error||!data||count===null||!Number.isSafeInteger(count)||count<0||total!==null&&count!==total||data.length>500||offset+data.length>count||!data.length&&offset<count)throw Error('Incomplete Private characteristic evidence.');total=count;for(const row of data){const t=row.ontology_terms as any;if(!t||Array.isArray(t)||!batch.includes(row.listing_id)||t.id!==row.ontology_term_id)throw Error('Invalid Private characteristic evidence.');if(!dimensions.includes(t.term_type)||t.level!==1)continue;validateOntologyTermId(row.ontology_term_id);const key=row.listing_id+':'+row.ontology_term_id;if(seen.has(key))throw Error('Duplicate Private characteristic evidence.');seen.add(key);privateMemberships.get(row.listing_id)!.push(row.ontology_term_id);ids.add(row.ontology_term_id)}offset+=data.length}while(offset<total!)}
 const output:Dictionary=new Map<string,any>();output.privateMemberships=privateMemberships;const list=[...ids];list.forEach(validateOntologyTermId)
 for(let i=0;i<list.length;i+=25){const batch=list.slice(i,i+25);const {data,error,count}=await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,term_type,level,official_code,slug,slug_en,slug_es,term_name,term_name_en,term_name_es',{count:'exact'}).in('id',batch)
  if(error||count!==batch.length||!data||data.length!==batch.length)throw Error('Incomplete canonical dictionary.')
  for(const term of data){if(!batch.includes(term.id)||output.has(term.id))throw Error('Invalid dictionary identity.');output.set(term.id,term)}
 }
 return output
}
function rows(result:AcquisitionResult,terms:Dictionary):EngineRow[]{
 const output:EngineRow[]=result.private.map(p=>({id:qualified('PRIVATE',p.listingId),population:'PRIVATE',row:{...p.row,id:qualified('PRIVATE',p.listingId)},facts:p.evidence.facts,selections:[...p.evidence.selections,...(terms.privateMemberships?.get(p.listingId)??[]).filter(id=>!p.evidence.selections.some(s=>s.ontology_term_id===id)).map(id=>{const t=terms.get(id);return {dimension:t.term_type,ontology_term_id:id,term_type:t.term_type,level:t.level,slug:t.slug,term_name:t.term_name}})],geography:p.evidence.geography}))
 for(const b of result.bank){const pt=terms.get(b.propertyType);if(!pt||pt.term_type!=='property_type'||pt.level!==1)throw Error('Missing Bank property type identity.')
  const selections:CanonicalSelection[]=b.semantics.map(s=>{const t=terms.get(String(s.termId));if(!t||t.term_type!==s.dimension||t.level!==1)throw Error('Mismatched Bank semantic identity.');return {dimension:String(s.dimension),ontology_term_id:t.id,term_type:t.term_type,level:t.level,slug:t.slug,term_name:t.term_name}})
  const facts:CanonicalFact[]=b.otherFacts.map(f=>({dimension:String(f.dimension),kind:f.kind as CanonicalFact['kind'],exact_value:f.exactValue as string|null,category_term_id:f.categoryTermId as string|null,range_lower:f.rangeLower as string|null,range_upper:f.rangeUpper as string|null,lower_inclusive:f.lowerInclusive as boolean|null,upper_inclusive:f.upperInclusive as boolean|null}))
  output.push({id:qualified('BANK',b.listingId),population:'BANK',row:{id:qualified('BANK',b.listingId),transaction_type:b.transaction,property_type:pt.slug,currency:b.price?.currency??null,current_price:b.price?Number(canonicalDecimal(b.price.amount)):null,monthly_price:null,property_area:b.land?Number(canonicalDecimal(b.land.value)):null,construction_area:b.construction?Number(canonicalDecimal(b.construction.value)):null},facts,selections,geography:b.geography})
 }
 return output
}
function canonicalGeography(geo:EngineRow['geography']):CanonicalGeographyResolution{
 // Runtime IDs stay lossless strings, as in the established canonical reader.
 const term=(level:string)=>geo.find(t=>t.term_type===level) as unknown as CanonicalGeographyTerm|null??null
 return {source:{province:null,canton:null,district:null},province:term('province'),canton:term('canton'),district:term('district'),reasons:{province:'resolved',canton:'resolved',district:term('district')?'resolved':'missing'},complete:!!term('district')}
}
function numericalRows(items:EngineRow[],terms:Dictionary,context:NumericalContext){
 return items.map(item=>{const pt=item.selections.find(s=>s.dimension==='property_type');const row={...item.row,id:item.id,property_type:pt?.slug??terms.get(pt?.ontology_term_id??'')?.slug,canonicalGeography:canonicalGeography(item.geography)};return {...row,analyticalIdentity:resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:context.date,fxIdentity:context.fx})}})
}
function preferences(items:EngineRow[],q:CanonicalMarketRequest){
 const canonical=new Map(items.map(i=>[i.id,{facts:i.facts,selections:i.selections.filter(s=>!['bedrooms','bathrooms','parking','year_built'].includes(s.dimension))}]))
 const classifications=new Map(items.map(i=>[i.id,new Set([...i.selections.map(s=>s.ontology_term_id),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>f.category_term_id!)])]))
 const protectedPreferences=protectAnalyticalInput({canonical,classifications})
 return items.map(i=>({id:i.id,preferences:evaluateMarketPreferences(q,i.row,protectedPreferences)}))
}
async function prevalence(items:EngineRow[],terms:Dictionary){
 if(items.every(i=>i.population==='PRIVATE'))return canonicalMarketPrevalence(items.map(i=>i.id.slice('PRIVATE:'.length)))
 const dimensions=[...COMPOSITION_DIMENSIONS],counts=new Map<string,{dimension:string;ids:Set<string>}>(),represented=new Map(dimensions.map(d=>[d,new Set<string>()])),labels=new Map<string,{en:string;es:string}>()
 for(const i of items){const evidence=[...i.geography.map(t=>({id:t.id,dimension:t.term_type,term:t})),...i.selections.map(s=>({id:s.ontology_term_id,dimension:s.dimension,term:terms.get(s.ontology_term_id)})),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>({id:f.category_term_id!,dimension:f.dimension,term:terms.get(f.category_term_id!)}))]
  for(const e of evidence){if(!dimensions.includes(e.dimension as any)||!e.term)throw Error('Incomplete composition evidence.');const c=counts.get(e.id)??{dimension:e.dimension,ids:new Set<string>()};if(c.dimension!==e.dimension)throw Error('Conflicting composition identity.');c.ids.add(i.id);counts.set(e.id,c);represented.get(e.dimension as typeof dimensions[number])!.add(i.id);labels.set(e.id,{en:e.term.term_name_en||e.term.term_name||'',es:e.term.term_name_es||e.term.term_name||''})}
 }
 return projectCanonicalPrevalence(items.map(i=>i.id),dimensions,counts,represented,labels)
}
function characteristic(term:any):PriceMeterCharacteristicIdentity{
 if(!term||!isPriceMeterCharacteristicType(term.term_type)||term.level!==1)throw Error('Invalid characteristic identity.')
 const id=Number(term.id);if(!Number.isSafeInteger(id)||String(id)!==term.id)throw Error('Existing characteristic contract cannot represent this identity losslessly.')
 return {ontologyTermId:id,termType:term.term_type,termName:term.term_name,termNameEn:term.term_name_en,termNameEs:term.term_name_es,slug:term.slug,slugEn:term.slug_en,slugEs:term.slug_es}
}
function memberships(items:EngineRow[],terms:Dictionary){return items.map(i=>({listingId:i.id,ontologyTermIds:[...i.selections.map(s=>s.ontology_term_id),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>f.category_term_id!)].map(id=>characteristic(terms.get(id)).ontologyTermId)}))}
function definition(input:PopulationEngineRequest['cohortA'],r:PopulationEngineRequest,terms:Dictionary):PriceMeterComparisonCohortDefinition{
 if(!input||!r.geographyLevel||!r.scope.geography[r.geographyLevel])throw Error('Explicit cohort definition required.')
 return {geography:terms.get(r.scope.geography[r.geographyLevel]!) as CanonicalGeographyTerm,propertyType:characteristic(terms.get(r.scope.propertyType)),characteristics:input.characteristicIds.map(id=>characteristic(terms.get(id))) as [PriceMeterCharacteristicIdentity,PriceMeterCharacteristicIdentity],propertyAreaRange:input.propertyAreaRange,constructionAreaRange:input.constructionAreaRange,constructionLandCohortKey:input.constructionLandCohortKey}
}
const undefinedResult=(state:string)=>({state})
async function calculate(r:PopulationEngineRequest,items:EngineRow[],terms:Dictionary,context:NumericalContext,q:CanonicalMarketRequest,subjects:EngineRow[]){
 recordAnalyticalEvidence('candidate-input',{request:r,items,terms,context,q,subjects})
 if(!['matching','configuration'].includes(r.engine)){const eligible=new Set(preferences(items,q).filter(i=>{const groups=new Map<string,string[]>();for(const p of i.preferences){const states=groups.get(p.dimension)??[];states.push(p.state);groups.set(p.dimension,states)}return [...groups.values()].every(states=>states.includes('MATCH'))}).map(i=>i.id));items=items.filter(i=>eligible.has(i.id))}
 const numerical=numericalRows(items,terms,context),observations=buildPriceMeterObservations(numerical,r.scope.areaBasis).filter(o=>o.propertyBasis===r.scope.propertyBasis),transactionType=r.scope.transaction
 const cohort=buildPriceMeterAnalyticalCohort({transactionCohort:buildPriceMeterTransactionCohorts(observations)[transactionType],propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis})
 recordAnalyticalEvidence('normalized-cohort',{items,numerical,observations,cohort,transactionType})
 const distribution=()=>buildPriceMeterDistribution({transactionType,observations:cohort.observations})
 const scope=resolvePriceMeterGeographicScope(Object.fromEntries(Object.entries(r.scope.geography).map(([k,v])=>[k,v??undefined])))
 const filters={...r.filters,transaction_type:transactionType},pref=()=>preferences(items,q)
 switch(r.engine){
  case 'summary':return calculateMarketSummary(filters,transactionType==='sale'?items.length:0,transactionType==='rent'?items.length:0)
  case 'composition':return prevalence(items,terms)
  case 'market-asking-price-distribution':{const prices=items.flatMap(i=>{const raw=transactionType==='sale'?i.row.current_price:i.row.monthly_price;const n=Number(raw);return raw!==null&&raw!==undefined&&Number.isFinite(n)&&n>0&&['CRC','USD'].includes(i.row.currency)?[normalizeAmountToCrc({amount:n,currency:i.row.currency,usdToCrcRate:context.fx?.rate??1})]:[]});return {currency:'CRC',unit:transactionType==='sale'?'total_asking_price':'monthly_asking_price',marketPopulation:items.length,askingPricePopulation:prices.length,statistics:buildNumericalDistribution(prices),outcome:!items.length?'empty_market':!prices.length?'no_eligible_prices':'complete'}}
  case 'matching':return rankMarketPreferences(pref()).slice(0,12)
  case 'configuration':{const configuration=q.terms.filter(t=>t.dimension!=='property_type'),evaluated=pref();const has=configuration.length>0||!!q.year||!!q.road||!!q.propertyArea||!!q.constructionArea;return calculateConfigurationFrequency(filters,r.language,items.length,has?evaluated.filter(i=>i.preferences.every(p=>p.state==='MATCH')).length:items.length,has,[...configuration])}
  case 'comparison':if(!context.comparisonRate)throw Error('Canonical BCCR comparison rate required.');return calculateMarketComparisonSide(items.map(i=>i.row),filters,context.comparisonRate,r.language,await prevalence(items,terms),(row,rate)=>{const amount=row.transaction_type==='sale'?row.current_price:row.monthly_price;return typeof amount==='number'&&Number.isFinite(amount)&&amount>0&&(row.currency==='CRC'||row.currency==='USD')?normalizeAmountToCrc({amount,currency:row.currency,usdToCrcRate:rate}):null})
  case 'distribution':return distribution()
  case 'geography':{if(!scope.comparisonLevel)return undefinedResult('terminal_geographic_scope');return buildPriceMeterGeographicStatistics({selectedMarketDistribution:distribution(),geographicDistributions:buildPriceMeterGeographicLevel({observations:cohort.observations,transactionType,level:scope.comparisonLevel}),comparisonLevel:scope.comparisonLevel})}
  case 'size':if(r.scope.propertyBasis!=='improved_property')return undefinedResult('improved_property_required');{const p=buildPriceMeterSizeRelationshipPopulation({cohort,relationshipKind:r.scope.areaBasis==='land'?'property_area_to_land_normalized_ratio':'construction_area_to_construction_normalized_ratio'});return {population:p,result:buildPriceMeterDescriptiveSizeRelationshipResult(p,'withheld_mathematical_coupling')}}
  case 'construction-land':return buildSelectedConstructionLand(numerical.map(i=>i.analyticalIdentity),transactionType,r.scope.areaBasis)
  case 'cohort-comparison':{if(!r.cohortA||!r.cohortB||!r.referenceCohort)return undefinedResult('explicit_cohort_definitions_required');const m=memberships(items,terms);const a=buildPriceMeterComparisonCohortPopulation({definition:definition(r.cohortA,r,terms),observations:cohort.observations,memberships:m}),b=buildPriceMeterComparisonCohortPopulation({definition:definition(r.cohortB,r,terms),observations:cohort.observations,memberships:m});const v=buildPriceMeterComparisonAnalysis({transactionType,cohortA:a,cohortB:b,referenceCohort:r.referenceCohort,language:r.language});return {cohortA:v.cohortA.distribution,cohortB:v.cohortB.distribution,evidence:v.evidence,medianDifference:v.medianDifference}}
  case 'cross-dimensional':if(!r.questionKey)return undefinedResult('explicit_question_required');return analyzePriceMeterCrossDimensionalRelationship({identity:resolvePriceMeterCrossDimensionalIdentity({questionKey:r.questionKey,cohort,geographicScope:scope}),observations:cohort.observations})
  case 'discovery':{const value=calculateDiscoveryPopulation(cohort.observations.map(o=>o.pricePerM2));return {statistics:value.statistics,n:cohort.observations.length,comparisons:cohort.observations.map(o=>({listingId:o.listingId,evidence:value.evidence.get(o.pricePerM2)}))}}
  case 'position':{if(!cohort.observations.length)return undefinedResult('reference_population_empty');const subjectRows=subjects.filter(i=>i.id===qualified(r.subject?.population??'',r.subject?.listingId??''));const observed=buildPriceMeterObservations(numericalRows(subjectRows,terms,context),r.scope.areaBasis).find(o=>o.propertyBasis===r.scope.propertyBasis);if(!observed)return undefinedResult('subject_unavailable');const subject=resolvePriceMeterPropertyPositionIdentity(observed),population=buildPriceMeterPropertyPositionPopulation({subject,observations:cohort.observations,participation:cohort.observations.some(o=>o.listingId===observed.listingId)?'SUBJECT_INCLUDED':'SUBJECT_EXTERNAL'}),d=distribution(),percentile=buildPriceMeterPropertyPositionPercentile({population}),medianPosition=buildPriceMeterPropertyPositionMedian({population,distribution:d}),interval=buildPriceMeterPropertyPositionInterval({population,distribution:d}),tail=buildPriceMeterPropertyPositionTail({population,distribution:d,percentile,interval}),constructionToLandContext=buildPriceMeterPropertyPositionConstructionLandContext({subject});return buildPriceMeterPropertyPositionEvidence({population,distribution:d,percentile,medianPosition,interval,tail,constructionToLandContext})}
  case 'comparables':{const id=qualified(r.subject?.population??'',r.subject?.listingId??''),item=subjects.find(i=>i.id===id),subjectObservation=item?buildPriceMeterObservations(numericalRows([item],terms,context),r.scope.areaBasis).find(o=>o.propertyBasis===r.scope.propertyBasis):undefined;if(!subjectObservation||!item)return undefinedResult('subject_unavailable');if(!r.geographyLevel||!r.activeDimensions)return undefinedResult('explicit_comparable_definition_required');const value=runPriceMeterComparableEngine({request:{subjectListingId:id,geographyLevel:r.geographyLevel,normalizationBasis:r.scope.areaBasis,activeDimensions:r.activeDimensions},subjectObservation,subjectCharacteristics:item.selections.map(s=>characteristic(terms.get(s.ontology_term_id))),subjectYearBuiltRange:item.facts.find(f=>f.dimension==='year_built')??null,boundedObservations:cohort.observations,memberships:memberships(items.filter(i=>cohort.observations.some(o=>o.listingId===i.id)),terms)});return {sampleSize:value.population.sampleSize,populationTrail:value.population.populationTrail,evidence:value.evidence}}
  case 'asking-area-ratio':case 'weighted-price':{if(!r.ratioQuestion)return undefinedResult('explicit_area_ranges_required');const q=r.ratioQuestion;const data=numerical.filter(i=>i.analyticalIdentity.propertyBasis==='improved_property'&&i.analyticalIdentity.price.analyticallyUsable&&i.analyticalIdentity.propertyArea.kind==='exact'&&i.analyticalIdentity.constructionArea.kind==='exact'&&i.analyticalIdentity.propertyArea.exactM2!>=Number(q.propertyArea.min)&&i.analyticalIdentity.propertyArea.exactM2!<=Number(q.propertyArea.max)&&i.analyticalIdentity.constructionArea.exactM2!>=Number(q.constructionArea.min)&&i.analyticalIdentity.constructionArea.exactM2!<=Number(q.constructionArea.max)).map(i=>({id:i.id,P:i.analyticalIdentity.price.analyticalAmount!,L:i.analyticalIdentity.propertyArea.exactM2!,C:i.analyticalIdentity.constructionArea.exactM2!}));if(r.engine==='asking-area-ratio')return analyzeAreaRatio(data);if(r.hypotheticalSubject){
 // Reuse the existing verified hypothetical contract and its geography/type/area
 // eligibility. A manual subject is never inserted into canonical observations.
 let subject:Awaited<ReturnType<typeof establishWeightedSubject>>;try{subject=await establishWeightedSubject({cohort:q,subject:r.hypotheticalSubject},'')}catch(error){if(error instanceof WeightedQuestionError)return undefinedResult('hypothetical_subject_incompatible_with_question');throw error}
 const P=subject.money?normalizeAmountToCrc({amount:subject.money.amount,currency:subject.money.currency,usdToCrcRate:context.fx?.rate??1}):null;
 return {...analyzeWeightedPrice(data,{P,L:subject.L,C:subject.C}),subjectProvenance:'CUSTOMER_PROVIDED',participation:'no_subject_identity',originalSubjectMoney:subject.money};
 }const selected=numericalRows(subjects.filter(i=>i.id===qualified(r.subject?.population??'',r.subject?.listingId??'')),terms,context)[0];const identity=selected?.analyticalIdentity;const subject=identity?.price.analyticallyUsable&&identity.propertyBasis==='improved_property'&&identity.propertyArea.kind==='exact'&&identity.constructionArea.kind==='exact'?{id:selected.id,P:identity.price.analyticalAmount!,L:identity.propertyArea.exactM2!,C:identity.constructionArea.exactM2!}:null;if(!subject)return undefinedResult('subject_unavailable');return analyzeWeightedPrice(data.filter(i=>i.id!==subject.id),subject)}
 }
}
export type PopulationEngineResult=Readonly<{engine:PopulationEngineId;capability:string;population:AcquisitionRequest['population'];transaction:'sale'|'rent';currency:'CRC';areaBasis:'land'|'construction'|null;propertyBasis:AcquisitionRequest['propertyBasis']|null;eligibilityProfile:'inventory'|'asking_price'|'ppm2';analyticalDate:string;fx:PriceMeterFxIdentity|null;private:{n:number;result:unknown}|null;bank:{n:number;result:unknown}|null;crossMarket:unknown;cacheIdentity:string;methodology:'existing-engine-methodologies-population-adapter-v1'}>
const tickets=new WeakMap<PopulationEngineResult,{acquisition:AcquisitionResult;request:PopulationEngineRequest;context:NumericalContext;dictionary:Dictionary}>()
export async function executePopulationEngine(input:PopulationEngineRequest):Promise<PopulationEngineResult>{
 return inEvidenceEngine(input.engine,()=>executeCapturedPopulationEngine(input))
}
async function executeCapturedPopulationEngine(input:PopulationEngineRequest):Promise<PopulationEngineResult>{
 const r=validatePopulationEngineRequest(input),engine=populationEngine(r.engine),acquisition=await acquireCanonicalPopulation({...r.scope,capability:engine[3],profile:engine[5]}),terms=await orchestratorMemo('dictionary',JSON.stringify([acquisition.sourceDataRevision,r.scope,r.cohortA,r.cohortB]),()=>dictionary(acquisition,r)),all=rows(acquisition,terms),date=getCurrentAnalyticalDate();let fx:PriceMeterFxIdentity|null=null,comparisonRate:number|null=null
 if(all.some(i=>i.row.currency==='USD')||r.engine==='comparison'||r.hypotheticalSubject?.askingPrice?.currency==='USD'){const v=await orchestratorMemo('fx',date,()=>getHistoricalUsdToCrcRate(date));if(v.analyticalDate!==date||v.source!=='BCCR'||v.rateType!=='reference_sale'||v.baseCurrency!=='USD'||v.quoteCurrency!=='CRC'||!Number.isFinite(v.rate)||v.rate<=0)throw Error('Incoherent BCCR identity.');comparisonRate=v.rate;fx={...v,conversionApplied:true}}
 const context={date,fx,comparisonRate},q=await orchestratorMemo('request',JSON.stringify([r.filters,r.scope.transaction,r.scope.propertyType,r.language]),()=>resolveCanonicalMarketRequest({...r.filters,transaction_type:r.scope.transaction,property_type:r.scope.propertyType},r.language))
 const protectedInput=recordAnalyticalEvidence('resolved-input',{request:r,acquisition,terms,rows:all,context,resolvedRequest:q})
 const result=await calculateCapturedInputs(protectedInput.request,protectedInput.acquisition,protectedInput.terms,protectedInput.rows,protectedInput.context,protectedInput.resolvedRequest)
 const freeze=(v:any):any=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};freeze(result);tickets.set(result,{acquisition,request:r,context,dictionary:terms});await deliverCanonicalPopulation(acquisition);return result
}
async function calculateCapturedInputs(r:PopulationEngineRequest,acquisition:AcquisitionResult,terms:Dictionary,all:EngineRow[],context:NumericalContext,q:CanonicalMarketRequest):Promise<PopulationEngineResult>{
 const date=context.date,fx=context.fx,engine=populationEngine(r.engine)
 const p=all.filter(i=>i.population==='PRIVATE'),b=all.filter(i=>i.population==='BANK')
 const privateResult=r.scope.population!=='BANK'?{n:p.length,result:await inEvidencePopulation('PRIVATE',()=>calculate(r,p,terms,context,q,all))}:null,bankResult=r.scope.population!=='PRIVATE'?{n:b.length,result:await inEvidencePopulation('BANK',()=>calculate(r,b,terms,context,q,all))}:null
 let crossMarket:unknown=r.scope.population==='COMBINED'&&r.engine==='comparison'?{language:r.language,leftPopulation:'PRIVATE',rightPopulation:'BANK',left:privateResult?.result,right:bankResult?.result}:null
 if(r.scope.population==='COMBINED'&&r.engine==='cohort-comparison'&&r.cohortA&&r.cohortB&&r.referenceCohort){const cohort=(items:EngineRow[],definitionInput:NonNullable<PopulationEngineRequest['cohortA']>)=>buildPriceMeterComparisonCohortPopulation({definition:definition(definitionInput,r,terms),observations:buildPriceMeterObservations(numericalRows(items,terms,context),r.scope.areaBasis).filter(o=>o.propertyBasis===r.scope.propertyBasis),memberships:memberships(items,terms)});const v=buildPriceMeterComparisonAnalysis({transactionType:r.scope.transaction,cohortA:cohort(p,r.cohortA),cohortB:cohort(b,r.cohortB),referenceCohort:r.referenceCohort,language:r.language});crossMarket={cohortA:{population:'PRIVATE',distribution:v.cohortA.distribution},cohortB:{population:'BANK',distribution:v.cohortB.distribution},evidence:v.evidence,medianDifference:v.medianDifference}}
 if(r.scope.population==='COMBINED'&&r.subject&&['position','comparables','weighted-price'].includes(r.engine)){
  const referencePopulation=r.referencePopulation??(r.subject.population==='PRIVATE'?'BANK':'PRIVATE')
  if(referencePopulation!==r.subject.population)crossMarket={subjectPopulation:r.subject.population,referencePopulation,result:(referencePopulation==='PRIVATE'?privateResult:bankResult)?.result}
 }
 const result:PopulationEngineResult={engine:r.engine,capability:engine[3],population:r.scope.population,transaction:r.scope.transaction,currency:'CRC',areaBasis:engine[5]==='ppm2'?r.scope.areaBasis:null,propertyBasis:engine[5]==='ppm2'?r.scope.propertyBasis:null,eligibilityProfile:engine[5],analyticalDate:date,fx,private:privateResult,bank:bankResult,crossMarket,methodology:'existing-engine-methodologies-population-adapter-v1',cacheIdentity:digest({engine:r.engine,capability:engine[3],request:r,methodology:'existing-engine-methodologies-population-adapter-v1',context,acquisition:acquisition.cacheIdentity,dictionary:[...terms],memberships:[...(terms.privateMemberships??[])]})}
 recordAnalyticalEvidence('engine-output',result)
 return result
}
/** Server-only offline replay consumes the captured, already authorized input closure. */
export async function replayPopulationEvidence(input:{request:PopulationEngineRequest;acquisition:AcquisitionResult;terms:Dictionary;rows:EngineRow[];context:NumericalContext;resolvedRequest:CanonicalMarketRequest}){return calculateCapturedInputs(input.request,input.acquisition,input.terms,input.rows,input.context,input.resolvedRequest)}
export async function deliverPopulationEngine(result:PopulationEngineResult):Promise<PopulationEngineResult>{
 const ticket=tickets.get(result);if(!ticket)throw Error('Unowned analytical result.')
 await deliverCanonicalPopulation(ticket.acquisition)
 const fresh=await executePopulationEngine(ticket.request);if(fresh.cacheIdentity!==result.cacheIdentity)throw Error('Stale analytical result.');return fresh
}
