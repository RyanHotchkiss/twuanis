import {askingResult,matchingResult,selectAskingRows,bankCards} from './population-result-adapters'
import {validateQuestion,referenceTerms} from './asking-price-question'
import type {Question as AskingQuestion} from './asking-price-contract'
import {validatePriceMeterComparisonRequest} from './price-meter-comparison-request'
import {normalizeCohortCount} from './cohort-numeric-evidence'
import {projectCompletedResult} from './price-meter-cross-dimensional-execution'
import {getPriceMeterCrossDimensionalQuestion} from './price-meter-cross-dimensional-question'
import {evaluatePriceMeterCrossDimensionalOutcomes} from './price-meter-cross-dimensional-outcomes'
import {buildPriceMeterCrossDimensionalSynthesis} from './price-meter-cross-dimensional-synthesis'
import {toPositionDTO} from './price-meter-property-position-dto'
import {toPriceMeterComparableEvidenceDTO} from './price-meter-comparable-dto'
import {buildPriceMeterComparablePresentation,buildPriceMeterComparableConfigurationPresentation} from './price-meter-comparable-presentation'
import {validateComparableInputEvidence} from './comparable-input-evidence'
import {bathroomFactConstraint} from './bathroom-selection'
import {analyticalUniverse,assertUniverseScope,assertSameUniverse,type AnalyticalUniverse} from './analytical-universe'
import 'server-only'
import {buildSelectedPriceMeterPresentation} from './price-meter-selected-engine'
import {validateDistributionIdentity} from './price-meter-selected-contract'
import {getPriceMeterSizeRelationshipDefinition} from './price-meter-size-relationship'
import {recordAnalyticalEvidence,protectAnalyticalInput,traceEvidenceCall,inEvidenceEngine,inEvidencePopulation} from './orchestrator-evidence-v2'
import {WEIGHTED_METHOD,parseWeightedQuestion,type WeightedQuestion} from './weighted-price-contract'
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
import {projectCompositionNumericalDimension,projectCanonicalPrevalence as live_projectCanonicalPrevalence,COMPOSITION_DIMENSIONS,canonicalMarketPrevalence as live_canonicalMarketPrevalence} from './canonical-market-prevalence'
import {resolveCanonicalMarketRequest,type CanonicalMarketRequest} from './canonical-market-request'
import {evaluateMarketPreferences as live_evaluateMarketPreferences,rankMarketPreferences as live_rankMarketPreferences} from './canonical-market-preferences'
import {calculateConfigurationFrequency as live_calculateConfigurationFrequency} from './market-scarcity-engine'
import {applyPriceRange,calculateMarketComparisonSide as live_calculateMarketComparisonSide} from './market-comparison-engine'
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
import {decimalCompare} from './asking-area-ratio-data'
import {canonicalDecimal,parseRatioQuestion,type RatioQuestion} from './asking-area-ratio-contract'
import {RATIO_METHOD,analyzeAreaRatio as live_analyzeAreaRatio} from './asking-area-ratio-math'
import {analyzeWeightedPrice as live_analyzeWeightedPrice} from './weighted-price-math'
import type {CanonicalEvidence,CanonicalFact,CanonicalSelection} from './canonical-listing-reader'
import type {CanonicalGeographyResolution,CanonicalGeographyTerm} from './geography/canonical-geography'
import {validateGeographicRow,validateOntologyTermId} from './geography/dta-identity'
import {isPriceMeterCharacteristicType,type PriceMeterCharacteristicIdentity} from './price-meter-characteristic-identity'

const calculateMarketSummary=traceEvidenceCall('calculateMarketSummary',live_calculateMarketSummary)
const projectCanonicalPrevalence=traceEvidenceCall('projectCanonicalPrevalence',live_projectCanonicalPrevalence)
const canonicalMarketPrevalence=traceEvidenceCall('canonicalMarketPrevalence',live_canonicalMarketPrevalence)
const evaluateMarketPreferences=traceEvidenceCall('evaluateMarketPreferences',live_evaluateMarketPreferences)
const rankMarketPreferences=traceEvidenceCall('rankMarketPreferences',live_rankMarketPreferences)
const calculateConfigurationFrequency=traceEvidenceCall('calculateConfigurationFrequency',live_calculateConfigurationFrequency)
const calculateMarketComparisonSide=traceEvidenceCall('calculateMarketComparisonSide',live_calculateMarketComparisonSide)
const buildPriceMeterObservations=traceEvidenceCall('buildPriceMeterObservations',(rows:Parameters<typeof live_buildPriceMeterObservations>[0],basis?:Parameters<typeof live_buildPriceMeterObservations>[1])=>{
 const facts=new Map(rows.map(row=>[row.id,row.bathroom_evidence]));return live_buildPriceMeterObservations(rows,basis).map(o=>{const c=bathroomFactConstraint(facts.get(o.listingId));return c?.kind==='exact'?{...o,canonicalBathroomExact:c.value}:o})
})
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

export type PopulationCohortCommand={scope?:Omit<AcquisitionRequest,'capability'|'profile'>;geography:{level:'province'|'canton'|'district';termId:string};characteristics:[{kind:'category';termId:string}|{kind:'exact';termType:'bedrooms'|'bathrooms';exactValue:string},{kind:'category';termId:string}|{kind:'exact';termType:'bedrooms'|'bathrooms';exactValue:string}];propertyAreaRange:string|null;constructionAreaRange:string|null;constructionLandCohortKey:string|null}
export type PopulationEngineRequest=Readonly<{
 engine:PopulationEngineId;scope:Omit<AcquisitionRequest,'capability'|'profile'>;language:'en'|'es';
 filters?:Record<string,string|undefined>;askingQuestion?:AskingQuestion;
 questionKey?:PriceMeterCrossDimensionalQuestionKey;
 subject?:{population:AnalyticalUniverse;listingId:string};subjectRevision?:string;
 referencePopulation?:AnalyticalUniverse;
 geographyLevel?:'province'|'canton'|'district';
 activeDimensions?:PriceMeterComparableDimension[];
 cohortA?:PopulationCohortCommand;cohortB?:PopulationCohortCommand;
 referenceCohort?:'A'|'B';ratioQuestion?:RatioQuestion;hypotheticalSubject?:Extract<WeightedQuestion['subject'],{kind:'hypothetical'}>
}>
export type EngineRow={id:string;population:AnalyticalUniverse;row:Record<string,any>;facts:CanonicalFact[];selections:CanonicalSelection[];geography:CanonicalEvidence['geography']}
export type Dictionary=Map<string,any>&{privateMemberships?:Map<string,string[]>}
export type NumericalContext={date:string;fx:PriceMeterFxIdentity|null;comparisonRate:number|null}
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const qualified=(population:string,id:string)=>population+':'+id
export function validatePopulationEngineRequest(input:PopulationEngineRequest,requireComplete=true):PopulationEngineRequest{
 const r=JSON.parse(JSON.stringify(input));populationEngine(r.engine);assertUniverseScope(r.scope?.population,r.scope?.transaction)
 if(!['en','es'].includes(r.language)||Object.keys(r).some(k=>!['engine','scope','language','filters','questionKey','subject','referencePopulation','geographyLevel','activeDimensions','cohortA','cohortB','referenceCohort','ratioQuestion','hypotheticalSubject','askingQuestion','subjectRevision'].includes(k)))throw Error('Invalid engine request.')
 if(r.askingQuestion){if(!['market-asking-price-distribution','discovery'].includes(r.engine)||r.filters&&Object.keys(r.filters).length)throw Error('Asking Distribution requires its committed question only.');r.askingQuestion=validateQuestion(r.askingQuestion)}
 if(requireComplete&&['market-asking-price-distribution','discovery'].includes(r.engine)&&!r.askingQuestion)throw Error('Complete Asking Distribution question required.')
 if(r.subjectRevision!==undefined&&(!r.subject||typeof r.subjectRevision!=='string'||!/^[0-9a-f]{64}$/.test(r.subjectRevision)))throw Error('Invalid subject revision.')
 if(r.filters?.price_range&&(!/^\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?|\+)$/.test(r.filters.price_range)||r.engine!=='comparison'))throw Error('Invalid comparison price range.')
 if(r.referencePopulation&&r.referencePopulation!==r.scope.population)throw Error('Reference population outside authorization.')
 if(r.subject&&(!['BANK','SALE','RENT'].includes(r.subject.population)||! /^[0-9a-f-]{36}$/i.test(r.subject.listingId)||r.subject.population!==r.scope.population))throw Error('Subject population outside authorization.')
 if(r.filters&&Object.entries(r.filters).some(([k,v])=>!['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status','year_built','distance_to_paved_road_range','property_area','construction_area','price_range'].includes(k)||typeof v!=='string'))throw Error('Unsupported engine filter.');
 if(r.referenceCohort&&!['A','B'].includes(r.referenceCohort))throw Error('Invalid comparison reference.')
 if(r.hypotheticalSubject){if(r.engine!=='weighted-price'||!r.ratioQuestion||r.subject)throw Error('Compatible hypothetical weighted subject required.');r.hypotheticalSubject=parseWeightedQuestion({cohort:r.ratioQuestion,subject:r.hypotheticalSubject}).subject as Extract<WeightedQuestion['subject'],{kind:'hypothetical'}>}
 if(r.ratioQuestion){r.ratioQuestion=parseRatioQuestion(r.ratioQuestion);const q=r.ratioQuestion;if(q.transaction!==(r.scope.population==='RENT'?'rent':'sale')||q.propertyType!==r.scope.propertyType||r.scope.geography[q.geography.level]!==q.geography.termId)throw Error('Ratio question outside canonical scope.')}
 if(requireComplete&&['asking-area-ratio','weighted-price'].includes(r.engine)&&!r.ratioQuestion)throw Error('Complete ratio question required.')
 if(requireComplete&&r.engine==='weighted-price'&&!r.subject&&!r.hypotheticalSubject)throw Error('Explicit weighted subject required.')
 if(requireComplete&&['position','comparables'].includes(r.engine)){
  if(!r.subject||!['province','canton','district'].includes(r.geographyLevel)||!r.scope.geography[r.geographyLevel]||r.filters&&Object.keys(r.filters).length)throw Error('Explicit unfiltered subject/reference definition required.')
  const levels=['province','canton','district'];if(levels.slice(levels.indexOf(r.geographyLevel)+1).some(level=>r.scope.geography[level]))throw Error('Reference scope is narrower than its committed definition.')
 }
 if(requireComplete&&r.engine==='comparables'&&(!Array.isArray(r.activeDimensions)||new Set(r.activeDimensions).size!==r.activeDimensions.length))throw Error('Explicit comparable dimensions required.')
 if(requireComplete&&r.engine==='cross-dimensional')getPriceMeterCrossDimensionalQuestion(r.questionKey)
 if(requireComplete&&r.engine==='cohort-comparison'){
  if(!r.cohortA||!r.cohortB||!r.referenceCohort||r.filters&&Object.keys(r.filters).length)throw Error('Two complete cohort definitions without extra global filters required.')
  for(const c of [r.cohortA,r.cohortB]){if(c.scope){assertUniverseScope(c.scope.population,c.scope.transaction);if(c.scope.population!==r.scope.population||c.scope.propertyBasis!==r.scope.propertyBasis||c.scope.areaBasis!==r.scope.areaBasis||c.scope.geography[c.geography.level]!==c.geography.termId)throw Error('Cohort acquisition and common identity differ.')}if(!c.geography||!['province','canton','district'].includes(c.geography.level)||!Array.isArray(c.characteristics)||c.characteristics.length!==2)throw Error('Invalid cohort definition.');validateOntologyTermId(c.geography.termId);for(const x of c.characteristics){if(x.kind==='category')validateOntologyTermId(x.termId);else if(x.kind==='exact')normalizeCohortCount(x.termType,x.exactValue);else throw Error('Invalid cohort characteristic.')}}
 }
 return r
}
async function dictionary(result:AcquisitionResult,r:PopulationEngineRequest):Promise<Dictionary>{
 const ids=new Set<string>([r.scope.propertyType,...Object.values(r.scope.geography).filter((id):id is string=>id!==null)])
 if(r.askingQuestion)for(const id of referenceTerms(r.askingQuestion).keys())ids.add(id)
 for(const b of result.bank){ids.add(b.propertyType);for(const s of b.semantics)ids.add(String(s.termId));for(const f of b.otherFacts)if(f.categoryTermId)ids.add(String(f.categoryTermId))}
 for(const p of result.private){for(const s of p.evidence.selections)ids.add(s.ontology_term_id);for(const f of p.evidence.facts)if(f.category_term_id)ids.add(f.category_term_id)}
 for(const c of [r.cohortA,r.cohortB])if(c){if(!Array.isArray(c.characteristics)||c.characteristics.length!==2)throw Error('Exactly two canonical characteristics required.');ids.add(c.geography.termId);if(c.scope){ids.add(c.scope.propertyType);for(const id of Object.values(c.scope.geography))if(id)ids.add(id)}for(const x of c.characteristics)if(x.kind==='category')ids.add(x.termId)}
 const privateMemberships=new Map(result.private.map(p=>[p.listingId,[] as string[]]));const dimensions=['property_type','bedrooms','bathrooms','parking','year_built','utility','environment','terrain','accessibility','legal_status'];const privateIds=[...privateMemberships.keys()];for(let i=0;i<privateIds.length;i+=25){const batch=privateIds.slice(i,i+25);let offset=0,total:number|null=null;const seen=new Set<string>();do{const {data,error,count}=await supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,ontology_terms!inner(id::text,term_type,level)',{count:'exact'}).in('listing_id',batch).in('ontology_terms.term_type',dimensions).order('listing_id').order('ontology_term_id').range(offset,offset+499);if(error||!data||count===null||!Number.isSafeInteger(count)||count<0||total!==null&&count!==total||data.length>500||offset+data.length>count||!data.length&&offset<count)throw Error('Incomplete Private characteristic evidence.');total=count;for(const row of data){const t=row.ontology_terms as any;if(!t||Array.isArray(t)||!batch.includes(row.listing_id)||t.id!==row.ontology_term_id)throw Error('Invalid Private characteristic evidence.');if(!dimensions.includes(t.term_type)||t.level!==1)continue;validateOntologyTermId(row.ontology_term_id);const key=row.listing_id+':'+row.ontology_term_id;if(seen.has(key))throw Error('Duplicate Private characteristic evidence.');seen.add(key);privateMemberships.get(row.listing_id)!.push(row.ontology_term_id);ids.add(row.ontology_term_id)}offset+=data.length}while(offset<total!)}
 const output:Dictionary=new Map<string,any>();output.privateMemberships=privateMemberships;const list=[...ids];list.forEach(validateOntologyTermId)
 for(let i=0;i<list.length;i+=25){const batch=list.slice(i,i+25);const {data,error,count}=await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,term_type,level,official_code,slug,slug_en,slug_es,term_name,term_name_en,term_name_es',{count:'exact'}).in('id',batch)
  if(error||count!==batch.length||!data||data.length!==batch.length)throw Error('Incomplete canonical dictionary.')
  for(const term of data){if(!batch.includes(term.id)||output.has(term.id))throw Error('Invalid dictionary identity.');output.set(term.id,term)}
 }
 // Canonical cohort ancestors establish containment before any statistics.
 for(const c of [r.cohortA,r.cohortB])if(c){let g=output.get(c.geography.termId);while(g&&['district','canton'].includes(g.term_type)){
  validateGeographicRow(g,g.term_type)
  if(!g.parent_id)throw Error('Missing cohort geography parent.')
  let parent=output.get(g.parent_id)
  if(!parent){const response=await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,term_type,level,official_code,slug,slug_en,slug_es,term_name,term_name_en,term_name_es',{count:'exact'}).in('id',[g.parent_id]);if(response.error||response.count!==1||response.data?.length!==1||response.data[0].id!==g.parent_id)throw Error('Incomplete cohort geography ancestry.');parent=response.data[0];output.set(parent.id,parent)}
  if(parent.term_type!==(g.term_type==='district'?'canton':'province'))throw Error('Invalid cohort geography hierarchy.');g=parent
 }}
 return output
}
function rows(result:AcquisitionResult,terms:Dictionary):EngineRow[]{
 const output:EngineRow[]=result.private.map(p=>({id:qualified(p.population,p.listingId),population:p.population,row:{...p.row,id:qualified(p.population,p.listingId)},facts:p.evidence.facts,selections:[...p.evidence.selections,...(terms.privateMemberships?.get(p.listingId)??[]).filter(id=>!p.evidence.selections.some(s=>s.ontology_term_id===id)).map(id=>{const t=terms.get(id);return {dimension:t.term_type,ontology_term_id:id,term_type:t.term_type,level:t.level,slug:t.slug,term_name:t.term_name}})],geography:p.evidence.geography}))
 for(const b of result.bank){const pt=terms.get(b.propertyType);if(!pt||pt.term_type!=='property_type'||pt.level!==1)throw Error('Missing Bank property type identity.')
  const selections:CanonicalSelection[]=b.semantics.map(s=>{const t=terms.get(String(s.termId));if(!t||t.term_type!==s.dimension||t.level!==1)throw Error('Mismatched Bank semantic identity.');return {dimension:String(s.dimension),ontology_term_id:t.id,term_type:t.term_type,level:t.level,slug:t.slug,term_name:t.term_name}})
  if(!selections.some(s=>s.dimension==='property_type'))selections.push({dimension:'property_type',ontology_term_id:pt.id,term_type:pt.term_type,level:pt.level,slug:pt.slug,term_name:pt.term_name})
  const facts:CanonicalFact[]=b.otherFacts.map(f=>({dimension:String(f.dimension),kind:f.kind as CanonicalFact['kind'],exact_value:f.exactValue as string|null,category_term_id:f.categoryTermId as string|null,range_lower:f.rangeLower as string|null,range_upper:f.rangeUpper as string|null,lower_inclusive:f.lowerInclusive as boolean|null,upper_inclusive:f.upperInclusive as boolean|null}))
  output.push({id:qualified('BANK',b.listingId),population:'BANK',row:{id:qualified('BANK',b.listingId),sourceUniverse:'BANK',bankPropertyId:b.propertyId,bankOfferingId:b.offeringId,sourceEvidenceRevision:digest({revisions:b.revisions,contentHash:b.contentHash}),financialBasis:'BANK_LISTED_SELLING_PRICE',transaction_type:b.price?'sale':null,property_type:pt.slug,currency:b.price?.currency??null,originalPrice:b.price?.amount??null,current_price:b.price?Number(canonicalDecimal(b.price.amount)):null,monthly_price:null,property_area:b.land?canonicalDecimal(b.land.value):null,construction_area:b.construction?canonicalDecimal(b.construction.value):null},facts,selections,geography:b.geography})
 }
 return output
}
function canonicalGeography(geo:EngineRow['geography']):CanonicalGeographyResolution{
 // Runtime IDs stay lossless strings, as in the established canonical reader.
 const term=(level:string)=>geo.find(t=>t.term_type===level) as unknown as CanonicalGeographyTerm|null??null
 return {source:{province:null,canton:null,district:null},province:term('province'),canton:term('canton'),district:term('district'),reasons:{province:'resolved',canton:'resolved',district:term('district')?'resolved':'missing'},complete:!!term('district')}
}
function numericalRows(items:EngineRow[],terms:Dictionary,context:NumericalContext){
 return items.map(item=>{const pt=item.selections.find(s=>s.dimension==='property_type');const row={...item.row,exactPropertyArea:item.row.property_area===null||item.row.property_area===undefined?null:String(item.row.property_area),exactConstructionArea:item.row.construction_area===null||item.row.construction_area===undefined?null:String(item.row.construction_area),property_area:item.row.property_area===null||item.row.property_area===undefined?null:Number(item.row.property_area),construction_area:item.row.construction_area===null||item.row.construction_area===undefined?null:Number(item.row.construction_area),id:item.id,bathroom_evidence:item.facts.find(f=>f.dimension==='bathrooms'),property_type:pt?.slug??terms.get(pt?.ontology_term_id??'')?.slug,canonicalGeography:canonicalGeography(item.geography)};return {...row,analyticalIdentity:resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:context.date,fxIdentity:context.fx})}})
}
function preferences(items:EngineRow[],q:CanonicalMarketRequest,matchingAttributeScoring=false){
 const canonical=new Map(items.map(i=>[i.id,{facts:i.facts,selections:i.selections.filter(s=>!['bedrooms','bathrooms','parking','year_built'].includes(s.dimension))}]))
 const classifications=new Map(items.map(i=>[i.id,new Set([...i.selections.map(s=>s.ontology_term_id),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>f.category_term_id!)])]))
 const protectedPreferences=protectAnalyticalInput({canonical,classifications})
 return items.map(i=>({id:i.id,preferences:evaluateMarketPreferences(q,i.row,protectedPreferences,{matchingNumericalEvidence:true,matchingAttributeScoring})}))
}
async function prevalence(items:EngineRow[],terms:Dictionary){
 if(items.every(i=>i.population!=='BANK'))return canonicalMarketPrevalence(items.map(i=>i.id.slice(i.population.length+1)))
 const dimensions=[...COMPOSITION_DIMENSIONS],counts=new Map<string,{dimension:string;ids:Set<string>}>(),represented=new Map(dimensions.map(d=>[d,new Set<string>()])),labels=new Map<string,{en:string;es:string}>()
 for(const i of items){const evidence=[...i.geography.map(t=>({id:t.id,dimension:t.term_type,term:t})),...i.selections.map(s=>({id:s.ontology_term_id,dimension:s.dimension,term:terms.get(s.ontology_term_id)})),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>({id:f.category_term_id!,dimension:f.dimension,term:terms.get(f.category_term_id!)}))]
  for(const e of evidence){if(!dimensions.includes(e.dimension as any)||!e.term)throw Error('Incomplete composition evidence.');const c=counts.get(e.id)??{dimension:e.dimension,ids:new Set<string>()};if(c.dimension!==e.dimension)throw Error('Conflicting composition identity.');c.ids.add(i.id);counts.set(e.id,c);represented.get(e.dimension as typeof dimensions[number])!.add(i.id);labels.set(e.id,{en:e.term.term_name_en||e.term.term_name||'',es:e.term.term_name_es||e.term.term_name||''})}
 }
 const ids=items.map(i=>i.id),original=projectCanonicalPrevalence(ids,dimensions,counts,represented,labels)
 const facts=new Map(items.map(i=>[i.id,i.facts]))
 return {...original,dimensions:original.dimensions.map(d=>{
  if(!['bedrooms','bathrooms','parking','year_built'].includes(d.dimension))return d
  const memberships=new Map(ids.map(id=>[id,new Set([...counts].filter(([,c])=>c.dimension===d.dimension&&c.ids.has(id)).map(([termId])=>termId))]))
  return projectCompositionNumericalDimension(d.dimension as 'bedrooms'|'bathrooms'|'parking'|'year_built',ids,facts,memberships)
 })}
}
function characteristic(term:any):PriceMeterCharacteristicIdentity{
 if(!term||!isPriceMeterCharacteristicType(term.term_type)||term.level!==1)throw Error('Invalid characteristic identity.')
 const id=Number(term.id);if(!Number.isSafeInteger(id)||String(id)!==term.id)throw Error('Existing characteristic contract cannot represent this identity losslessly.')
 return {ontologyTermId:id,termType:term.term_type,termName:term.term_name,termNameEn:term.term_name_en,termNameEs:term.term_name_es,slug:term.slug,slugEn:term.slug_en,slugEs:term.slug_es}
}
function memberships(items:EngineRow[],terms:Dictionary){return items.map(i=>({listingId:i.id,exactFacts:i.facts,ontologyTermIds:[...i.selections.map(s=>s.ontology_term_id),...i.facts.filter(f=>f.kind==='category'&&f.category_term_id).map(f=>f.category_term_id!)].map(id=>characteristic(terms.get(id)).ontologyTermId)}))}
function definition(input:PopulationCohortCommand|undefined,r:PopulationEngineRequest,terms:Dictionary):PriceMeterComparisonCohortDefinition{
 if(!input)throw Error('Explicit cohort definition required.')
 const cohortScope=input.scope??r.scope
 const geography=terms.get(input.geography.termId)
 if(!geography||geography.term_type!==input.geography.level)throw Error('Invalid cohort geography identity.')
 validateGeographicRow(geography,input.geography.level)
 const levels=['province','canton','district'],selectedIndex=levels.indexOf(input.geography.level)
 if(levels.slice(selectedIndex+1).some(level=>cohortScope.geography[level as keyof typeof cohortScope.geography]))throw Error('Acquired scope is narrower than its cohort definition.')
 let ancestor=geography
 for(let n=selectedIndex;n>=0;n--){const level=levels[n] as keyof typeof cohortScope.geography;if(!ancestor||ancestor.term_type!==level)throw Error('Invalid cohort ancestry.');const bound=cohortScope.geography[level];if(bound&&bound!==ancestor.id)throw Error('Cohort definition is outside the acquired universe scope.');ancestor=terms.get(ancestor.parent_id)}

 return {geography:geography as CanonicalGeographyTerm,propertyType:characteristic(terms.get(cohortScope.propertyType)),characteristics:input.characteristics.map(c=>c.kind==='category'?characteristic(terms.get(c.termId)):{kind:'exact' as const,termType:c.termType,exactValue:normalizeCohortCount(c.termType,c.exactValue)}) as PriceMeterComparisonCohortDefinition['characteristics'],propertyAreaRange:input.propertyAreaRange,constructionAreaRange:input.constructionAreaRange,constructionLandCohortKey:input.constructionLandCohortKey}
}
const subjectRevision=(row:EngineRow)=>digest({id:row.id,row:row.row,facts:row.facts,selections:row.selections,geography:row.geography})
const undefinedResult=(state:string)=>({state,reason:state})
async function calculate(r:PopulationEngineRequest,items:EngineRow[],terms:Dictionary,context:NumericalContext,q:CanonicalMarketRequest,subjects:EngineRow[]){
 recordAnalyticalEvidence('candidate-input',{request:r,items,terms,context,q,subjects})
 if(r.subjectRevision){const selected=subjects.find(i=>i.id===qualified(r.subject?.population??'',r.subject?.listingId??''));if(!selected||subjectRevision(selected)!==r.subjectRevision)throw Error('Subject configuration changed.')}
 if(!['matching','configuration','market-asking-price-distribution','discovery'].includes(r.engine)){const eligible=new Set(preferences(items,q).filter(i=>{const groups=new Map<string,string[]>();for(const p of i.preferences){const states=groups.get(p.dimension)??[];states.push(p.state);groups.set(p.dimension,states)}return [...groups.values()].every(states=>states.includes('MATCH'))}).map(i=>i.id));items=items.filter(i=>eligible.has(i.id))}
 if(r.engine==='discovery')items=selectAskingRows(r.askingQuestion,items,r,terms).selected
 const inventoryOnly=['summary','composition','market-asking-price-distribution','matching','configuration','comparison'].includes(r.engine)
 const numerical=inventoryOnly?[]:numericalRows(items,terms,context),observations=buildPriceMeterObservations(numerical,r.scope.areaBasis).filter(o=>o.propertyBasis===r.scope.propertyBasis),transactionType=r.scope.population==='BANK'?'sale':r.scope.transaction as 'sale'|'rent'
 const cohort=buildPriceMeterAnalyticalCohort({transactionCohort:buildPriceMeterTransactionCohorts(observations)[transactionType],propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis})
 recordAnalyticalEvidence('normalized-cohort',{items,numerical,observations,cohort,transactionType})
 const distribution=()=>buildPriceMeterDistribution({transactionType,observations:cohort.observations})
 const scope=resolvePriceMeterGeographicScope(Object.fromEntries(Object.entries(r.scope.geography).map(([k,v])=>[k,v??undefined])))
 const filters={...r.filters,transaction_type:transactionType},pref=()=>preferences(items,q)
 switch(r.engine){
  case 'summary':return r.scope.population==='BANK'?{engine:'summary',filters:{...filters,population:'BANK',transaction_type:'bank'},n:items.length,bankCount:items.length,saleCount:0,rentCount:0,state:items.length?'ESTABLISHED':'EMPTY_POPULATION'}:calculateMarketSummary(filters,transactionType==='sale'?items.length:0,transactionType==='rent'?items.length:0)
  case 'composition':return {engine:'composition',filters:{...filters,population:r.scope.population},...await prevalence(items,terms)}
  case 'market-asking-price-distribution':return askingResult(r.askingQuestion,items,r,terms,context)
  case 'matching':return r.scope.population==='BANK'?matchingResult(r,items,q,rankMarketPreferences(preferences(items,q,true)),terms):rankMarketPreferences(preferences(items,q,true)).slice(0,12)
  case 'configuration':{const configuration=q.terms.filter(t=>t.dimension!=='property_type'),evaluated=pref();const has=configuration.length>0||!!q.bathroomConstraints||!!q.year||!!q.road||!!q.propertyArea||!!q.constructionArea;return {...calculateConfigurationFrequency(filters,r.language,items.length,has?evaluated.filter(i=>{const groups=new Map<string,string[]>();for(const p of i.preferences){const states=groups.get(p.dimension)??[];states.push(p.state);groups.set(p.dimension,states)}return [...groups.values()].every(states=>states.includes('MATCH'))}).length:items.length,has,[...configuration]),population:r.scope.population,denominator:r.scope.population==='BANK'?'distinct eligible published canonical Bank listings satisfying geography and property type':'distinct active canonical listings satisfying transaction, geography and property type'}}
  case 'comparison':{
   if(!context.comparisonRate)throw Error('Canonical BCCR comparison rate required.')
   const resolveAmount=(row:Record<string,any>,rate:number)=>{const amount=row.transaction_type==='rent'?row.monthly_price:row.current_price;const n=Number(amount);return amount!==null&&amount!==undefined&&Number.isFinite(n)&&n>0&&(row.currency==='CRC'||row.currency==='USD')?normalizeAmountToCrc({amount:n,currency:row.currency,usdToCrcRate:rate}):null}
   const selected=applyPriceRange(items.map(i=>i.row),r.filters?.price_range,context.comparisonRate,resolveAmount),ids=new Set(selected.map(i=>i.id))
   return calculateMarketComparisonSide(selected,filters,context.comparisonRate,r.language,await prevalence(items.filter(i=>ids.has(i.id)),terms),resolveAmount)
  }
  case 'distribution':case 'geography':case 'size':case 'construction-land':{
   const definition=validateDistributionIdentity({propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis})
   const sizeKind=r.scope.areaBasis==='land'?'property_area_to_land_normalized_ratio':'construction_area_to_construction_normalized_ratio'
   const sizeMode=r.scope.areaBasis==='land'?'property-area':'construction-area'
   if(['size','construction-land'].includes(r.engine)&&r.scope.propertyBasis!=='improved_property')throw Error('Improved Property required.')
   if(r.engine==='geography'&&!scope.comparisonLevel)throw Error('Terminal geographic scope.')
   const result=buildSelectedPriceMeterPresentation({filters:{...r.filters,transaction_type:transactionType,...Object.fromEntries(Object.entries(r.scope.geography).map(([k,v])=>[k,v??undefined]))},language:r.language,
    engines:[r.engine==='size'?sizeMode:r.engine] as Parameters<typeof buildSelectedPriceMeterPresentation>[0]['engines'],
    sizeKind,sizeMode:r.engine==='size'?sizeMode:undefined,
    sizeDefinition:r.engine==='size'?{propertyBasis:'improved_property',normalizationBasis:getPriceMeterSizeRelationshipDefinition(sizeKind).normalizationBasis}:undefined,
    clNormalization:r.engine==='construction-land'?r.scope.areaBasis:undefined,
    requested:r.engine==='distribution'?definition:null,
    geography:r.engine==='geography'?{definition,comparisonLevel:scope.comparisonLevel!}:undefined,
    analyticalDate:context.date,observations,listings:numerical as Parameters<typeof buildSelectedPriceMeterPresentation>[0]['listings'],fxIdentity:context.fx})
   return result
  }
  case 'cohort-comparison':{
   if(!r.cohortA||!r.cohortB||!r.referenceCohort)throw Error('Complete independent cohort definitions required.')
   const m=memberships(items,terms),request={transactionType,propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis,cohortA:definition(r.cohortA,r,terms),cohortB:definition(r.cohortB,r,terms),referenceCohort:r.referenceCohort}
   validatePriceMeterComparisonRequest(request)
   const a=buildPriceMeterComparisonCohortPopulation({definition:request.cohortA,observations:cohort.observations,memberships:m}),b=buildPriceMeterComparisonCohortPopulation({definition:request.cohortB,observations:cohort.observations,memberships:m})
   const v=buildPriceMeterComparisonAnalysis({transactionType,cohortA:a,cohortB:b,referenceCohort:r.referenceCohort,language:r.language})
   const geo=(g:CanonicalGeographyTerm)=>[{id:String(g.id),term_name:g.term_name,term_name_en:g.term_name_en,term_name_es:g.term_name_es}]
   return {request,analyticalIdentity:{transactionType,propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis,analyticalCurrency:'CRC',analyticalDate:context.date},fx:context.fx,geography:{A:geo(request.cohortA.geography),B:geo(request.cohortB.geography)},evidence:v.evidence,medianDifference:v.medianDifference}
  }
  case 'cross-dimensional':{
   if(!r.questionKey)throw Error('Explicit question required.')
   const question=getPriceMeterCrossDimensionalQuestion(r.questionKey),identity=resolvePriceMeterCrossDimensionalIdentity({questionKey:r.questionKey,cohort,geographicScope:scope})
   const evidence=analyzePriceMeterCrossDimensionalRelationship({identity,observations:cohort.observations}),outcomes=evaluatePriceMeterCrossDimensionalOutcomes(evidence),synthesis=buildPriceMeterCrossDimensionalSynthesis({question,evidenceSet:evidence,outcomes})
   return {state:'complete',result:projectCompletedResult({question,context:{transactionType:identity.transactionType,propertyBasis:identity.propertyBasis,normalizationBasis:identity.normalizationBasis},evidence,outcomes,synthesis}),analyticalDate:context.date,fx:context.fx}
  }
  case 'discovery':{
   const value=calculateDiscoveryPopulation(cohort.observations.map(o=>o.pricePerM2)),question=r.askingQuestion!
   const ordered=[...cohort.observations].sort((a,b)=>a.pricePerM2-b.pricePerM2||(a.listingId!<b.listingId!?-1:a.listingId!>b.listingId!?1:0))
   const results=ordered.map(o=>{const e=value.evidence.get(o.pricePerM2)!,t=e.strictTail;return {listingId:o.listingId!,pricePerM2:e.pricePerM2,belowCount:e.belowCount,equalCount:e.equalCount,aboveCount:e.aboveCount,percentilePosition:e.percentilePosition,percentileMethod:e.percentileMethod,differenceFromMedian:e.differenceFromMedian,percentDifferenceFromMedian:e.percentDifferenceFromMedian,percentageReference:e.percentageReference,interval:e.interval,strictTail:t?{thresholdPercentile:t.thresholdPercentile,thresholdPricePerM2:t.thresholdPricePerM2,differenceFromThreshold:t.differenceFromThreshold,percentDifferenceFromThreshold:t.percentDifferenceFromThreshold,percentageReference:t.percentageReference}:null}})
   const cards=r.scope.population==='BANK'?await bankCards(results.map(v=>v.listingId),items,r.language):new Map()
   return {analysis:{state:'complete',contractVersion:1,question:{transaction:transactionType,geography:{...question.geography,termId:r.scope.geography[question.geography.level]},propertyType:{termId:r.scope.propertyType},filters:question.filters},transaction:transactionType,normalization:r.scope.areaBasis,unit:transactionType==='sale'?'CRC/m²':'CRC/m²/month',n:results.length,resultCount:results.length,distribution:{state:results.length?'established':'empty',...value.statistics},results,resultOrder:{primary:'price_per_square_meter_ascending',exactTieOrder:'canonical_listing_id_ascending',exactTieOrderMeaning:'transport_only'},snapshotGuaranteed:false},context:{analyticalDate:context.date,propertyBases:[r.scope.propertyBasis],hydratedCount:items.length,excludedCount:items.length-results.length,fx:context.fx},listings:results.flatMap(result=>{const card=cards.get(result.listingId);if(!card)return [];const row=items.find(i=>i.id===result.listingId)!;return [{listingId:result.listingId,title:card.title,thumbnail:card.images[0]??null,price:row.row.current_price,currency:row.row.currency,propertyArea:row.row.property_area===null?null:Number(row.row.property_area),constructionArea:row.row.construction_area===null?null:Number(row.row.construction_area),bedrooms:(()=>{const value=row.facts.find(f=>f.dimension==='bedrooms'&&f.kind==='exact')?.exact_value;return value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null})(),bathrooms:(()=>{const value=row.facts.find(f=>f.dimension==='bathrooms'&&f.kind==='exact')?.exact_value;return value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null})(),parking:(()=>{const value=row.facts.find(f=>f.dimension==='parking'&&f.kind==='exact')?.exact_value;return value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null})(),yearBuilt:(()=>{const value=row.facts.find(f=>f.dimension==='year_built'&&f.kind==='exact')?.exact_value;return value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null})(),url:`${r.language==='es'?'/es/remates':'/en/bank-properties'}/${card.id}`,province:card.province??null,canton:card.canton??null,district:card.district??null}]})}
  }
  case 'position':{const subjectRows=subjects.filter(i=>i.id===qualified(r.subject?.population??'',r.subject?.listingId??''));const observed=buildPriceMeterObservations(numericalRows(subjectRows,terms,context),r.scope.areaBasis).find(o=>o.propertyBasis===r.scope.propertyBasis);if(!observed)return {state:'subject_ineligible',reason:'canonical_observation_not_established'};const subject=resolvePriceMeterPropertyPositionIdentity(observed),population=buildPriceMeterPropertyPositionPopulation({subject,observations:cohort.observations,participation:cohort.observations.some(o=>o.listingId===observed.listingId)?'SUBJECT_INCLUDED':'SUBJECT_EXTERNAL'}),d=distribution(),percentile=buildPriceMeterPropertyPositionPercentile({population}),medianPosition=buildPriceMeterPropertyPositionMedian({population,distribution:d}),interval=buildPriceMeterPropertyPositionInterval({population,distribution:d}),tail=buildPriceMeterPropertyPositionTail({population,distribution:d,percentile,interval}),constructionToLandContext=buildPriceMeterPropertyPositionConstructionLandContext({subject});const evidence=buildPriceMeterPropertyPositionEvidence({population,distribution:d,percentile,medianPosition,interval,tail,constructionToLandContext});
 if(population.participation!=='SUBJECT_INCLUDED')return {state:'subject_participation_invalid',reason:'actual_subject_not_represented_once_consistently'}
 const level=r.geographyLevel;if(!level||!r.scope.geography[level])throw Error('Explicit subject reference geography required.')
 const item=subjectRows[0],g=item.geography.find(g=>g.term_type===level&&g.id===r.scope.geography[level]);if(!g)throw Error('Subject reference geography mismatch.')
 const pt=terms.get(r.scope.propertyType)
 return toPositionDTO({state:'ok',contractVersion:1,subject,subjectAnalyticalIdentity:observed.analyticalIdentity,reference:{subjectListingId:item.id,geographyLevel:level,geography:{id:g.id,label:g.term_name,labelEn:g.term_name_en,labelEs:g.term_name_es},propertyType:{id:pt.id,label:pt.term_name},transactionType,propertyBasis:r.scope.propertyBasis,normalizationBasis:r.scope.areaBasis,participation:'SUBJECT_INCLUDED',canonicalVersion:1,listingStatus:'active',propertyArea:'unconstrained',constructionArea:'unconstrained',analyticalDate:context.date,monetaryPolicy:'canonical_crc_bccr_reference_sale',eligibility:'canonical_exact_normalization'},unit:transactionType==='sale'?'CRC/m²':'CRC/m²/month',analyticalDate:context.date,fx:context.fx,completeness:{established:true,candidateCount:items.length,observationCount:population.comparisonPopulationCount},evidence})}
  case 'comparables':{const id=qualified(r.subject?.population??'',r.subject?.listingId??''),item=subjects.find(i=>i.id===id),subjectObservation=item?buildPriceMeterObservations(numericalRows([item],terms,context),r.scope.areaBasis).find(o=>o.propertyBasis===r.scope.propertyBasis):undefined;if(!subjectObservation||!item)return undefinedResult('subject_unavailable');if(!r.geographyLevel||!r.activeDimensions)return undefinedResult('explicit_comparable_definition_required');const subjectCharacteristics=item.selections.map(s=>characteristic(terms.get(s.ontology_term_id))),subjectYearBuiltRange=item.facts.find(f=>f.dimension==='year_built'&&f.kind==='exact')?.exact_value??null;validateComparableInputEvidence(r.activeDimensions,buildPriceMeterComparableConfigurationPresentation({observations:[subjectObservation],characteristics:subjectCharacteristics,yearBuiltRange:subjectYearBuiltRange}));const value=runPriceMeterComparableEngine({request:{subjectListingId:id,geographyLevel:r.geographyLevel,normalizationBasis:r.scope.areaBasis,activeDimensions:r.activeDimensions},subjectObservation,subjectCharacteristics:item.selections.map(s=>characteristic(terms.get(s.ontology_term_id))),subjectYearBuiltRange,boundedObservations:cohort.observations,memberships:memberships(items.filter(i=>cohort.observations.some(o=>o.listingId===i.id)),terms)});return {evidence:toPriceMeterComparableEvidenceDTO(value),presentation:buildPriceMeterComparablePresentation({subject:value.subject,observation:subjectObservation}),context:{subjectTitle:null,analyticalDate:context.date,fx:context.fx}}}
  case 'asking-area-ratio':case 'weighted-price':{
   if(!r.ratioQuestion)throw Error('Explicit area ranges required.')
   const question=r.ratioQuestion,subjectId=r.subject?qualified(r.subject.population,r.subject.listingId):null
   const rawData=numerical.filter(i=>r.engine!=='weighted-price'||i.id!==subjectId)
   const bounded=rawData.filter(i=>i.analyticalIdentity.propertyBasis==='improved_property'&&i.analyticalIdentity.propertyArea.kind==='exact'&&i.analyticalIdentity.constructionArea.kind==='exact'&&typeof i.exactPropertyArea==='string'&&typeof i.exactConstructionArea==='string'&&decimalCompare(i.exactPropertyArea,question.propertyArea.min)>=0&&decimalCompare(i.exactPropertyArea,question.propertyArea.max)<=0&&decimalCompare(i.exactConstructionArea,question.constructionArea.min)>=0&&decimalCompare(i.exactConstructionArea,question.constructionArea.max)<=0)
   const eligible=bounded.filter(i=>i.analyticalIdentity.price.analyticallyUsable)
   const data=eligible.map(i=>({id:i.id,P:i.analyticalIdentity.price.analyticalAmount!,L:i.analyticalIdentity.propertyArea.exactM2!,C:i.analyticalIdentity.constructionArea.exactM2!}))
   const label=(t:any)=>({en:t.term_name_en||t.term_name,es:t.term_name_es||t.term_name})
   const contextDTO={analyticalDate:context.date,fx:context.fx?{rate:context.fx.rate,effectiveDate:context.fx.effectiveDate,source:context.fx.source,resolutionMode:context.fx.resolutionMode}:null,excluded:bounded.length-data.length,marketLabel:label(terms.get(question.geography.termId)),propertyTypeLabel:label(terms.get(question.propertyType))}
   if(r.engine==='asking-area-ratio')return {question,evidence:analyzeAreaRatio(data),methodology:RATIO_METHOD.version,...contextDTO}
   let subject: {L:number;C:number;money:{amount:number;currency:'CRC'|'USD'}|null},participation:'no_subject_identity'|'subject_excluded'
   if(r.hypotheticalSubject){
    if(decimalCompare(r.hypotheticalSubject.propertyArea,question.propertyArea.min)<0||decimalCompare(r.hypotheticalSubject.propertyArea,question.propertyArea.max)>0||decimalCompare(r.hypotheticalSubject.constructionArea,question.constructionArea.min)<0||decimalCompare(r.hypotheticalSubject.constructionArea,question.constructionArea.max)>0)throw Error('Hypothetical subject outside exact area bounds.');const established=await establishWeightedSubject({cohort:question,subject:r.hypotheticalSubject},'');subject=established;participation='no_subject_identity'
   }else{
    const selected=numericalRows(subjects.filter(i=>i.id===subjectId),terms,context)[0],identity=selected?.analyticalIdentity
    if(!identity||identity.propertyBasis!=='improved_property'||identity.propertyArea.kind!=='exact'||identity.constructionArea.kind!=='exact')return {error:'invalid_question'}
    if(typeof selected.exactPropertyArea!=='string'||typeof selected.exactConstructionArea!=='string'||decimalCompare(selected.exactPropertyArea,question.propertyArea.min)<0||decimalCompare(selected.exactPropertyArea,question.propertyArea.max)>0||decimalCompare(selected.exactConstructionArea,question.constructionArea.min)<0||decimalCompare(selected.exactConstructionArea,question.constructionArea.max)>0)return {error:'invalid_question'}
    const row=subjects.find(i=>i.id===subjectId)!.row
    subject={L:identity.propertyArea.exactM2!,C:identity.constructionArea.exactM2!,money:row.current_price===null&&row.monthly_price===null?null:{amount:Number(row.current_price??row.monthly_price),currency:row.currency}};participation='subject_excluded'
   }
   const P=subject.money?normalizeAmountToCrc({amount:subject.money.amount,currency:subject.money.currency,usdToCrcRate:context.fx?.rate??1}):null
   return {question:{cohort:question,subject:r.hypotheticalSubject??{kind:'listing',listingId:r.subject!.listingId}},evidence:analyzeWeightedPrice(data,{P,L:subject.L,C:subject.C}),methodology:WEIGHTED_METHOD.version,nominalConfidence:WEIGHTED_METHOD.coverage,...contextDTO,participation,subjectAreas:{propertyArea:subject.L,constructionArea:subject.C},subjectMoney:subject.money?{...subject.money,normalizedAmount:P!}:null}
  }

 }
}
export type PopulationEngineResult=Readonly<{engine:PopulationEngineId;capability:string;population:AcquisitionRequest['population'];transaction:'sale'|'rent'|'bank';inventoryCount:number;priceEligibleCount:number;currency:'CRC';areaBasis:'land'|'construction'|null;propertyBasis:AcquisitionRequest['propertyBasis']|null;eligibilityProfile:'inventory'|'asking_price'|'ppm2';analyticalDate:string;fx:PriceMeterFxIdentity|null;private:{n:number;result:unknown}|null;bank:{n:number;result:unknown}|null;crossMarket:unknown;cacheIdentity:string;methodology:'existing-engine-methodologies-population-adapter-v1'}>
const tickets=new WeakMap<PopulationEngineResult,{acquisitions:AcquisitionResult[];request:PopulationEngineRequest;context:NumericalContext;dictionary:Dictionary}>()
export async function executePopulationEngine(input:PopulationEngineRequest):Promise<PopulationEngineResult>{
 return inEvidenceEngine(input.engine,()=>executeCapturedPopulationEngine(input))
}
async function executeCapturedPopulationEngine(input:PopulationEngineRequest):Promise<PopulationEngineResult>{
 const r=validatePopulationEngineRequest(input),engine=populationEngine(r.engine)
 const scopes=r.scope.population==='BANK'&&r.engine==='cohort-comparison'&&r.cohortA?.scope&&r.cohortB?.scope?[r.cohortA.scope,r.cohortB.scope]:[r.scope]
 const acquisitions:AcquisitionResult[]=[]
 for(const scope of scopes)acquisitions.push(await acquireCanonicalPopulation({...scope,capability:engine[3],profile:scope.population==='BANK'?'inventory':engine[5]}))
 let acquisition=acquisitions[0]
 if(acquisitions.length===2){
  if(acquisitions[0].sourceDataRevision!==acquisitions[1].sourceDataRevision)throw Error('Cohort source snapshot changed.')
  const unique=new Map<string,AcquisitionResult['bank'][number]>()
  for(const source of acquisitions)for(const row of source.bank){const prior=unique.get(row.listingId);if(prior&&JSON.stringify(prior)!==JSON.stringify(row))throw Error('Conflicting canonical cohort evidence.');unique.set(row.listingId,row)}
  const bank=[...unique.values()]
  acquisition={...acquisition,bank,inventoryCount:bank.length,priceEligibleCount:bank.filter(r=>r.price!==null).length,excluded:acquisitions.flatMap(a=>a.excluded),cacheIdentity:digest(acquisitions.map(a=>a.cacheIdentity))}
 }
 const terms=await orchestratorMemo('dictionary',JSON.stringify([acquisition.sourceDataRevision,r.scope,r.cohortA,r.cohortB]),()=>dictionary(acquisition,r)),all=rows(acquisition,terms),date=getCurrentAnalyticalDate();let fx:PriceMeterFxIdentity|null=null,comparisonRate:number|null=null
 if(!['summary','composition','matching','configuration'].includes(r.engine)&&all.some(i=>i.row.currency==='USD')||r.engine==='comparison'||r.hypotheticalSubject?.askingPrice?.currency==='USD'){const v=await orchestratorMemo('fx',date,()=>getHistoricalUsdToCrcRate(date));if(v.analyticalDate!==date||v.source!=='BCCR'||v.rateType!=='reference_sale'||v.baseCurrency!=='USD'||v.quoteCurrency!=='CRC'||!Number.isFinite(v.rate)||v.rate<=0)throw Error('Incoherent BCCR identity.');comparisonRate=v.rate;fx={...v,conversionApplied:true}}
 const context={date,fx,comparisonRate},q=await orchestratorMemo('request',JSON.stringify([r.filters,r.scope.transaction,r.scope.propertyType,r.language]),()=>resolveCanonicalMarketRequest({...r.filters,transaction_type:r.scope.population==='BANK'?'sale':r.scope.transaction,property_type:r.scope.propertyType},r.language,{universe:r.scope.population}))
 const protectedInput=recordAnalyticalEvidence('resolved-input',{request:r,acquisition,terms,rows:all,context,resolvedRequest:q})
 const result=await calculateCapturedInputs(protectedInput.request,protectedInput.acquisition,protectedInput.terms,protectedInput.rows,protectedInput.context,protectedInput.resolvedRequest)
 const freeze=(v:any):any=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};freeze(result);tickets.set(result,{acquisitions,request:r,context,dictionary:terms});for(const acquired of acquisitions)await deliverCanonicalPopulation(acquired);return result
}
async function calculateCapturedInputs(r:PopulationEngineRequest,acquisition:AcquisitionResult,terms:Dictionary,all:EngineRow[],context:NumericalContext,q:CanonicalMarketRequest):Promise<PopulationEngineResult>{
 const date=context.date,fx=context.fx,engine=populationEngine(r.engine)
 const p=all.filter(i=>i.population!=='BANK'),b=all.filter(i=>i.population==='BANK')
 if(all.some(i=>i.population!==r.scope.population))throw Error('Acquired rows escaped the selected universe.')
 const privateResult=r.scope.population!=='BANK'?{n:p.length,result:await inEvidencePopulation(r.scope.population,()=>calculate(r,p,terms,context,q,all))}:null,bankResult=r.scope.population==='BANK'?{n:b.length,result:await inEvidencePopulation('BANK',()=>calculate(r,b,terms,context,q,all))}:null
 const crossMarket=null
 const result:PopulationEngineResult={engine:r.engine,capability:engine[3],population:r.scope.population,transaction:r.scope.transaction,inventoryCount:acquisition.inventoryCount,priceEligibleCount:acquisition.priceEligibleCount,currency:'CRC',areaBasis:engine[5]==='ppm2'?r.scope.areaBasis:null,propertyBasis:engine[5]==='ppm2'?r.scope.propertyBasis:null,eligibilityProfile:engine[5],analyticalDate:date,fx,private:privateResult,bank:bankResult,crossMarket,methodology:'existing-engine-methodologies-population-adapter-v1',cacheIdentity:digest({engine:r.engine,capability:engine[3],request:r,methodology:'existing-engine-methodologies-population-adapter-v1',context,acquisition:acquisition.cacheIdentity,dictionary:[...terms],memberships:[...(terms.privateMemberships??[])]})}
 recordAnalyticalEvidence('engine-output',result)
 return result
}
/** Server-only offline replay consumes the captured, already authorized input closure. */
export async function replayPopulationEvidence(input:{request:PopulationEngineRequest;acquisition:AcquisitionResult;terms:Dictionary;rows:EngineRow[];context:NumericalContext;resolvedRequest:CanonicalMarketRequest}){return calculateCapturedInputs(input.request,input.acquisition,input.terms,input.rows,input.context,input.resolvedRequest)}
export async function deliverPopulationEngine(result:PopulationEngineResult):Promise<PopulationEngineResult>{
 const ticket=tickets.get(result);if(!ticket)throw Error('Unowned analytical result.')
 for(const acquired of ticket.acquisitions)await deliverCanonicalPopulation(acquired)
 if(ticket.context.fx){const fresh=await getHistoricalUsdToCrcRate(ticket.context.date);if(JSON.stringify({...fresh,conversionApplied:true})!==JSON.stringify(ticket.context.fx))throw Error('BCCR identity changed before delivery.')}
 // Revalidate the owned source/authority snapshot without recalculating all statistics.
 return result
}

/** Authorized subject configuration only: no peer statistics, engine execution or credit claim. */
export async function readBankAnalyticalSubjectConfiguration(input:{engine:'position'|'comparables'|'weighted-price';scope:PopulationEngineRequest['scope'];language:'en'|'es';subject:{population:'BANK';listingId:string}}){
 if(!input||Object.keys(input).sort().join(',')!=='engine,language,scope,subject'||!['position','comparables','weighted-price'].includes(input.engine)||input.scope.population!=='BANK'||input.subject.population!=='BANK'||!['en','es'].includes(input.language)||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.subject.listingId))throw Error('Invalid Bank subject configuration command.')
 assertUniverseScope(input.scope.population,input.scope.transaction)
 const engine=populationEngine(input.engine),acquired=await acquireCanonicalPopulation({...input.scope,capability:engine[3],profile:'inventory'}),request:PopulationEngineRequest={...input},terms=await dictionary(acquired,request),all=rows(acquired,terms),subject=all.find(row=>row.id===qualified('BANK',input.subject.listingId))
 if(!subject){await deliverCanonicalPopulation(acquired);return {state:'subject_unavailable' as const}}
 const date=getCurrentAnalyticalDate(),rate=subject.row.currency==='USD'?await getHistoricalUsdToCrcRate(date):null,fx=rate?{...rate,conversionApplied:true as const}:null
 const observed=buildPriceMeterObservations(numericalRows([subject],terms,{date,fx,comparisonRate:rate?.rate??null})),normalizations=[...new Set(observed.map(o=>o.normalizationBasis))]
 if(!normalizations.length){await deliverCanonicalPopulation(acquired);return {state:'subject_ineligible' as const}}
 const geographies=Object.fromEntries(subject.geography.map(g=>[g.term_type,{id:g.id,label:g.term_name,labelEn:g.term_name_en,labelEs:g.term_name_es}]))
 const pt=terms.get(input.scope.propertyType),position={state:geographies.district?'ok' as const:'reference_definition_invalid' as const,listingId:subject.id,geographies,normalizations,defaultGeography:geographies.district?'district' as const:null,defaultNormalization:normalizations.includes('construction')?'construction' as const:'land' as const,propertyType:{id:pt.id,label:pt.term_name},reason:geographies.district?'ready' as const:'district_not_established' as const}
 const comparable=input.engine==='comparables'?buildPriceMeterComparableConfigurationPresentation({observations:observed,characteristics:subject.selections.map(s=>characteristic(terms.get(s.ontology_term_id))),yearBuiltRange:subject.facts.find(f=>f.dimension==='year_built'&&f.kind==='exact')?.exact_value??null}):null
 await deliverCanonicalPopulation(acquired)
 return {state:'ok' as const,population:'BANK' as const,subjectRevision:subjectRevision(subject),sourceRevision:acquired.sourceDataRevision,position,comparable}
}
