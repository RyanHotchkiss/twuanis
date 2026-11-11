// Real owning mathematics; acquisition is replaced with in-memory canonical fixtures.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..'),cache=new Map();let fixture,calls={},n=0;
const plain=x=>JSON.parse(JSON.stringify(x));const eq=(a,b,label)=>{assert.deepEqual(plain(a),plain(b),label);n++};
const spies=new Set(['buildPriceMeterObservations','buildPriceMeterAnalyticalCohort','buildPriceMeterDistribution','buildPriceMeterGeographicDistributions','buildPriceMeterSizeRelationshipPopulation','buildPriceMeterConstructionLandAnalysis']);
function load(file){file=path.normalize(file);if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,console,require(name){if(name==='server-only')return{};if(name==='react'||name==='react/jsx-runtime')return require(name);const base=name.startsWith('@/')?name.slice(2):name.startsWith('.')?path.join(path.dirname(file),name):null;if(base==='lib/canonical-market-observation-rows')return {loadCanonicalMarketObservationRows:async()=>{calls.load=(calls.load||0)+1;return fixture.listings}};
if(base==='lib/canonical-population')return{loadLegacyGeographyDictionary:async()=>[]};
if(base==='lib/analysis-date')return{getCurrentAnalyticalDate:()=> '2026-09-26'};
if(base==='lib/fx/fx-service')return{getHistoricalUsdToCrcRate:async()=>{calls.fx=(calls.fx||0)+1;return{analyticalDate:'2026-09-26',rate:500,effectiveDate:'2026-09-25',resolutionMode:'historical'}}};
if(base==='lib/price-meter-authorization')return{authorizePriceMeterIntelligenceExecution:async()=>{calls.auth=(calls.auth||0)+1}};
if(base==='lib/price-meter-ontology-membership')return{loadPriceMeterOntologyMemberships:async()=>{calls.membership=(calls.membership||0)+1;return[]}};if(base==='lib/statistics-engine')throw Error('Statistics engine forbidden');if(base)for(const ext of ['.ts','.tsx'])if(fs.existsSync(path.join(root,base+ext)))return load(base+ext);throw Error('Unmocked dependency '+name)},fetch(){throw Error('Network forbidden')}},{filename:file});for(const key of Object.keys(m.exports))if(spies.has(key)){const f=m.exports[key];m.exports[key]=(...args)=>{calls[key]=(calls[key]||0)+1;return f(...args)}}cache.set(file,m.exports);return m.exports}
const identity=load('lib/price-meter-identity.ts'),builder=load('lib/price-meter-observation-builder.ts'),permit=load('lib/price-meter-apply-permit.ts');
const selected=load('lib/price-meter-selected-engine.ts'),old=load('lib/price-meter-engine.ts'),project=load('lib/price-meter-browser-result.ts');
const engines=['distribution','geography','property-area','construction-area','construction-land'];
function fixtures(transaction){const listings=Array.from({length:70},(_,i)=>{const l={canonical_domain_version:1,id:String(i+1),transaction_type:transaction,property_type:i%7===0?'land':'house',property_area:100+i*23,construction_area:i%7===0?null:45+i*9,currency:'CRC',current_price:10000000+i*140000,monthly_price:100000+i*1400,canonicalGeography:{province:{official_code:'1'},canton:{official_code:'101'},district:{official_code:i%2?'10101':'10102'}}};return{...l,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(l,{analyticalDate:'2026-09-26',fxIdentity:null})}});return{analyticalDate:'2026-09-26',listings,observations:builder.buildPriceMeterObservations(listings),fxIdentity:{conversionApplied:true,rate:500,effectiveDate:'2026-09-26'}}}

const action=load('lib/price-meter-apply-action.ts');
(async()=>{
for(const source of ['workspace','standalone'])for(const lang of ['en','es'])for(const tx of ['sale','rent']){
 fixture=fixtures(tx);
 const filters={transaction_type:tx,province:'1',canton:'101',property_type:'house'};
 for(const [propertyBasis,normalizationBasis,key] of [['land_only','land','vacantLandLandNormalized'],['improved_property','land','improvedLandNormalized'],['improved_property','construction','improvedConstructionNormalized']]){
 const expected=load('lib/price-meter-distribution.ts').buildPriceMeterDistribution(load('lib/price-meter-analytical-cohort.ts').buildPriceMeterAnalyticalCohort({transactionCohort:load('lib/price-meter-transaction-cohort.ts').buildPriceMeterTransactionCohorts(fixture.observations)[tx],propertyBasis,normalizationBasis}));
 calls={};const result=await action.executePriceMeterApply(filters,lang,source,['distribution'],{propertyBasis,normalizationBasis});
 const resultKey=tx==='sale'?'saleIntelligence':'rentIntelligence';
 eq(Object.keys(result[resultKey].distributions),[key],'one selected result');eq(result[resultKey].distributions[key],expected,'unchanged math');
 eq(calls.buildPriceMeterAnalyticalCohort,1,'one cohort');eq(calls.buildPriceMeterDistribution,1,'one distribution');eq(calls.buildPriceMeterObservations,1,'one observation builder');eq(calls.load,1,'one population');
 eq(result.distributionContext.propertyBasis,propertyBasis,'committed basis');eq(result.distributionContext.normalizationBasis,normalizationBasis,'committed normalization');
 eq(/"(?:listingId|observations|canonicalEvidence|identities)"\s*:/.test(JSON.stringify(result)),false,'no raw population projection');
 }
 for(const invalid of [undefined,{}, {propertyBasis:'unknown',normalizationBasis:'land'},{propertyBasis:'land_only',normalizationBasis:'construction'}]){
 calls={};await assert.rejects(()=>action.executePriceMeterApply(filters,lang,source,['distribution'],invalid));eq(calls.load||0,0,'invalid zero acquisition');eq(calls.buildPriceMeterObservations||0,0,'invalid zero observation work');eq(calls.buildPriceMeterDistribution||0,0,'invalid zero distribution');
 }
}
for(const size of [0,1,10,1000]){
 fixture=fixtures('sale');fixture.listings=Array.from({length:size},(_,i)=>({...fixture.listings[1],id:String(i),current_price:1000000+i*1000}));
 calls={};const f={transaction_type:'sale',province:'1',canton:'101',property_type:'house'};
 const r=await action.executePriceMeterApply(f,'en','workspace',['distribution'],{propertyBasis:'improved_property',normalizationBasis:'construction'});
 eq(r.saleIntelligence.distributions.improvedConstructionNormalized.sampleSize,size,'population size');eq(calls.load,1,'one bounded acquisition');eq(calls.buildPriceMeterDistribution,1,'one sort/distribution');eq(r.distributionContext.marketListingCount,size,'market n');
}
// Actual loader must not produce an unselected observation, including the other basis.
fixture=fixtures('sale');const loader=load('lib/price-meter-observation-loader.ts');
for(const scope of [{propertyBasis:'land_only',normalizationBasis:'land'},{propertyBasis:'improved_property',normalizationBasis:'land'},{propertyBasis:'improved_property',normalizationBasis:'construction'}]){
 const r=await loader.loadPriceMeterObservations({},scope);eq(r.observations.every(o=>o.propertyBasis===scope.propertyBasis&&o.normalizationBasis===scope.normalizationBasis),true,'no unrequested observation calculations');
}
fixture=fixtures('sale');fixture.listings=[{...fixture.listings[1],currency:'USD',current_price:100,construction_area:50},{...fixture.listings[1],id:'missing',construction_area:null},{...fixture.listings[1],id:'range',construction_area:'100-200'}];
const r=await loader.loadPriceMeterObservations({}, {propertyBasis:'improved_property',normalizationBasis:'construction'});eq(r.observations.length,1,'missing/range no exact denominator');eq(r.observations[0].pricePerM2,1000,'BCCR USD conversion and exact denominator');eq(r.fxIdentity.rate,500,'FX provenance');
console.log('ENGINE 7 SELECTED DISTRIBUTION PASS',n)
})().catch(e=>{console.error(e);process.exitCode=1});
