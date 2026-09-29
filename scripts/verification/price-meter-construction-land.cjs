// Real owning mathematics; acquisition is replaced with in-memory canonical fixtures.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..'),cache=new Map();let fixture,calls={},n=0;
const plain=x=>JSON.parse(JSON.stringify(x));const eq=(a,b,label)=>{assert.deepEqual(plain(a),plain(b),label);n++};
const spies=new Set(['buildPriceMeterObservations','buildPriceMeterAnalyticalCohort','buildPriceMeterDistribution','buildPriceMeterGeographicDistributions','buildPriceMeterGeographicLevel','buildPriceMeterSizeRelationshipPopulation','buildPriceMeterConstructionLandAnalysis','buildPriceMeterConstructionLandLandRelationship','buildPriceMeterConstructionLandConstructionRelationship','buildPriceMeterConstructionLandPopulation','buildPriceMeterConstructionLandStatistics']);
function load(file){file=path.normalize(file);if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(ts.transpileModule(instrument(fs.readFileSync(path.join(root,file),'utf8'),file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,console,trace(name){calls[name]=(calls[name]||0)+1},require(name){if(name==='server-only')return{};if(name==='react'||name==='react/jsx-runtime')return require(name);const base=name.startsWith('@/')?name.slice(2):name.startsWith('.')?path.join(path.dirname(file),name):null;if(base==='lib/canonical-market-observation-rows')return {loadCanonicalMarketObservationRows:async()=>{calls.load=(calls.load||0)+1;return fixture.listings}};
if(base==='lib/canonical-population')return{loadLegacyGeographyDictionary:async()=>[]};
if(base==='lib/analysis-date')return{getCurrentAnalyticalDate:()=> '2026-09-26'};
if(base==='lib/fx/fx-service')return{getHistoricalUsdToCrcRate:async()=>{calls.fx=(calls.fx||0)+1;return{analyticalDate:'2026-09-26',rate:500,effectiveDate:'2026-09-25',resolutionMode:'historical'}}};
if(base==='lib/price-meter-authorization')return{authorizePriceMeterIntelligenceExecution:async()=>{calls.auth=(calls.auth||0)+1}};
if(base==='lib/price-meter-ontology-membership')return{loadPriceMeterOntologyMemberships:async()=>{calls.membership=(calls.membership||0)+1;return[]}};if(base==='lib/statistics-engine')throw Error('Statistics engine forbidden');if(base)for(const ext of ['.ts','.tsx'])if(fs.existsSync(path.join(root,base+ext)))return load(base+ext);throw Error('Unmocked dependency '+name)},fetch(){throw Error('Network forbidden')}},{filename:file});for(const key of Object.keys(m.exports))if(spies.has(key)){const f=m.exports[key];m.exports[key]=(...args)=>{calls[key]=(calls[key]||0)+1;if(key==='buildPriceMeterGeographicLevel')calls['level:'+args[0].level]=(calls['level:'+args[0].level]||0)+1;const result=f(...args);if(key==='buildPriceMeterObservations'){calls.observationScope=args[1]??null;calls.constructed=result.map(o=>[o.propertyBasis,o.normalizationBasis]);}return result}}cache.set(file,m.exports);return m.exports}
const identity=load('lib/price-meter-identity.ts'),builder=load('lib/price-meter-observation-builder.ts'),permit=load('lib/price-meter-apply-permit.ts');
const selected=load('lib/price-meter-selected-engine.ts'),old=load('lib/price-meter-engine.ts'),project=load('lib/price-meter-browser-result.ts');
const engines=['distribution','geography','property-area','construction-area','construction-land'];
function fixtures(transaction){const listings=Array.from({length:70},(_,i)=>{const l={canonical_domain_version:1,id:String(i+1),transaction_type:transaction,property_type:i%7===0?'land':'house',property_area:100+i*23,construction_area:i%7===0?null:45+i*9,currency:'CRC',current_price:10000000+i*140000,monthly_price:100000+i*1400,canonicalGeography:{province:{official_code:'1'},canton:{official_code:'101'},district:{official_code:i%2?'10101':'10102'}}};return{...l,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(l,{analyticalDate:'2026-09-26',fxIdentity:null})}});return{analyticalDate:'2026-09-26',listings,observations:builder.buildPriceMeterObservations(listings),fxIdentity:{conversionApplied:true,rate:500,effectiveDate:'2026-09-26'}}}

function instrument(source,file){if(!file.endsWith('price-meter-size-relationship-math.ts'))return source;const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);const names=['calculateSpearmanCorrelation','calculateLogLogRegression','calculateLogLogRSquared','calculateModeledAreaChange'];const inserts=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&names.includes(s.name?.text)).map(s=>[s.body.getStart(ast)+1,`trace('${s.name.text}');`]).sort((a,b)=>b[0]-a[0]);for(const [at,text]of inserts)source=source.slice(0,at)+text+source.slice(at);return source}

const action=load('lib/price-meter-apply-action.ts');
const filters=tx=>({transaction_type:tx,property_type:'house',province:'1',canton:'101'});
const ratios=[.13,.37,.73,1.43,2.71];
function setup(tx,count=100,bands=5){fixture=fixtures(tx);const template=fixture.listings[1];fixture.listings=Array.from({length:count},(_,i)=>({...template,id:String(i+1),property_type:'house',property_area:1000,construction_area:1000*ratios[i%bands],current_price:1000000*(i%bands+1),monthly_price:10000*(i%bands+1)}));}
const run=(mode,tx='sale',lang='en',surface='workspace')=>action.executePriceMeterApply(filters(tx),lang,surface,['construction-land'],undefined,undefined,mode);
(async()=>{
 for(const mode of ['land','construction'])for(const tx of ['sale','rent'])for(const lang of ['en','es'])for(const surface of ['workspace','standalone']){
  setup(tx);calls={};const result=await run(mode,tx,lang,surface),e=result.constructionLandResult,c={...calls};
  eq(c.load,1,'one bounded acquisition');eq(c.buildPriceMeterObservations,1,'one selected observation build');eq(c.observationScope,mode,'selected normalization');eq(c.constructed.length,100,'one selected observation per listing');eq(c.constructed.every(x=>x[0]==='improved_property'&&x[1]===mode),true,'unselected observation zero');
  eq(c.buildPriceMeterConstructionLandPopulation,1,'one CL population');eq(c.buildPriceMeterConstructionLandStatistics,1,'one scoped cohort-statistics execution');
  eq(c.buildPriceMeterConstructionLandLandRelationship||0,mode==='land'?1:0,'land relationship count');eq(c.buildPriceMeterConstructionLandConstructionRelationship||0,mode==='construction'?1:0,'construction relationship count');eq(c.calculateSpearmanCorrelation,1,'one Spearman');
  for(const k of ['calculateLogLogRegression','calculateLogLogRSquared','calculateModeledAreaChange','buildPriceMeterSizeRelationshipPopulation','buildPriceMeterGeographicLevel','buildPriceMeterDistribution','buildPriceMeterConstructionLandAnalysis'])eq(c[k]||0,0,k+' zero');
  eq(e.cohorts.map(x=>x.medianExactRatio),ratios,'observed medians not band midpoints');eq(e.cohorts.map(x=>x.n),[20,20,20,20,20],'cohort n');eq(e.relationship.evidence.representedObservationCount,100,'complete represented n');
  eq(e.cohorts.map((x,i)=>Math.abs(x.medianPricePerM2-(tx==='sale'?1000000:10000)*(i+1)/(mode==='land'?1000:1000*ratios[i]))<1e-8),[true,true,true,true,true],'selected medians');
  eq(Math.abs(e.relationship.spearmanRho-(mode==='land'?1:-1))<1e-10,true,'known rank association');eq(e.context.normalizationBasis,mode,'committed identity');
  eq(/listingId|observations\"|canonicalEvidence|identities\"|landNormalized|constructionNormalized/.test(JSON.stringify(e)),false,'aggregate selected projection only');
 }
 for(const mode of ['land','construction'])for(const N of [0,1,11,12,100,1000])for(const B of [1,2,3,5]){
  setup('sale',N,B);calls={};const start=performance.now(),r=await run(mode),e=r.constructionLandResult,b=Math.min(N,B);
  eq(e.relationship.evidence.populatedCohortCount,b,'populated count');eq(calls.calculateSpearmanCorrelation||0,b>=3&&N>=12?1:0,'both gate prerequisites');eq(calls.load,1,'band-independent acquisition');eq(e.relationship.evidence.representedObservationCount,N,'represented n');
  if(N===1000)console.log(JSON.stringify({mode,N,B,boundedAcquisitions:calls.load,selectedObservations:calls.constructed.length,relationships:1,spearman:calls.calculateSpearmanCorrelation||0,bytes:Buffer.byteLength(JSON.stringify(r)),fixtureMilliseconds:performance.now()-start}));
 }
 for(const value of [undefined,null,'both','auto','LAND',{},[]]){calls={};await assert.rejects(()=>run(value));eq(calls.load||0,0,'invalid identity before acquisition');}
 for(const mode of ['land','construction']){
  setup('sale',6);fixture.listings=fixture.listings.map((l,i)=>({...l,property_area:[0,-1,null,'500-1000',1000,1000][i],construction_area:i===4?0:i===5?'100-200':100}));calls={};const e=(await run(mode)).constructionLandResult;eq(e.relationship.evidence.representedObservationCount,0,'exact/exact invalid exclusion');eq(e.context.marketListingCount,6,'nonzero ineligible market');
  setup('sale',15,3);fixture.listings=fixture.listings.map(l=>({...l,currency:'USD',current_price:100}));calls={};const en=await run(mode),counts={...calls},es=await run(mode,'sale','es','standalone');eq(en.constructionLandResult,es.constructionLandResult,'EN/ES parity');eq(counts.fx,1,'one mocked FX');eq(en.constructionLandResult.context.fx.rate,500,'FX provenance');
 }
 // The explicit broad contract must exactly preserve the previous shared output.
 const statPath='lib/price-meter-construction-land-statistics.ts',baselineSource=require('child_process').execFileSync('git',['show','HEAD:'+statPath],{cwd:root,encoding:'utf8'});
 const baseline={exports:{}};vm.runInNewContext(ts.transpileModule(baselineSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:baseline,exports:baseline.exports,require(name){return load(name.replace('@/','')+'.ts')}});
 setup('sale');const ids=fixture.listings.map(l=>identity.resolvePriceMeterAnalyticalIdentity(l,{analyticalDate:'2026-09-26',fxIdentity:null})).map(load('lib/price-meter-construction-land.ts').resolvePriceMeterConstructionLandIdentity);
 const population=load('lib/price-meter-construction-land-population.ts').buildPriceMeterConstructionLandPopulation({transactionType:'sale',observations:ids});const stats=load(statPath);
 const broad=stats.buildPriceMeterConstructionLandStatistics(population,'both');eq(broad,baseline.exports.buildPriceMeterConstructionLandStatistics(population),'broad mathematics/output identical to baseline');
 for(const mode of ['land','construction']){const narrow=stats.buildPriceMeterConstructionLandStatistics(population,mode),key=mode==='land'?'landNormalized':'constructionNormalized',other=mode==='land'?'constructionNormalized':'landNormalized';eq(narrow.cohorts.map(x=>x[key]),broad.cohorts.map(x=>x[key]),'selected distribution matches broad');eq(narrow.cohorts.every(x=>!(other in x)),true,'unselected distribution absent');eq(narrow.adjacentComparisons.map(x=>x[key]),broad.adjacentComparisons.map(x=>x[key]),'selected adjacent evidence matches broad');}
 assert.throws(()=>stats.buildPriceMeterConstructionLandStatistics(population));n++;
 for(const mode of ['land','construction']){
  const forbidden=mode==='land'?'constructionAreaM2':'propertyAreaM2';
  const guarded={...population,cohorts:population.cohorts.map(c=>({...c,observations:c.observations.map(o=>{const clone={...o};Object.defineProperty(clone,forbidden,{get(){throw Error('Unselected denominator read')}});return clone})}))};
  eq(stats.buildPriceMeterConstructionLandStatistics(guarded,mode).representedObservationCount,100,'unselected denominator never read');
 }
 const resolveBand=load('lib/price-meter-construction-land-cohorts.ts').resolvePriceMeterConstructionLandCohort;
 for(const [value,key]of [[.249999,'gt_0_lt_0_25'],[.25,'gte_0_25_lt_0_50'],[.5,'gte_0_50_lt_1_00'],[1,'gte_1_00_lt_2_00'],[2,'gte_2_00']])eq(resolveBand(value)?.key,key,'exact inclusive boundary');
 const math=load('lib/price-meter-size-relationship-math.ts');eq(Math.abs(math.calculateSpearmanCorrelation([1,2,3],[1,1,3])-Math.sqrt(.75))<1e-12,true,'average tied ranks');eq(math.calculateSpearmanCorrelation([1,2,3],[2,2,2]),null,'degenerate ranks not zero');
 for(const mode of ['land','construction']){setup('sale',12,3);fixture.listings=fixture.listings.map(l=>({...l,current_price:(mode==='land'?l.property_area:l.construction_area)*1000}));const e=(await run(mode)).constructionLandResult;eq(e.relationship.evidence.hasSufficientEvidence,true,'degenerate meets count gate');eq(e.relationship.spearmanRho,null,'constant selected medians withhold rho');}
 calls={};await assert.rejects(()=>action.executePriceMeterApply(filters('sale'),'en','workspace',['construction-land','distribution'],{propertyBasis:'improved_property',normalizationBasis:'land'},undefined,'land'));eq(calls.load||0,0,'mixed direct questions fail before acquisition');
 const languageRoute=load('lib/language-route.ts');
 for(const [pathname,targetLanguage,expected]of [['/price-per-square-meter','es','/es/precio-por-metro-cuadrado'],['/es/precio-por-metro-cuadrado','en','/price-per-square-meter']]){
  const searchParams=new URLSearchParams({analysis_question:'construction-land',cl_normalization:'construction'});
  eq(languageRoute.getAlternateLanguageUrl({pathname,targetLanguage,searchParams}),expected+'?'+searchParams,'standalone language preserves selected identity');
 }
 console.log('ENGINE 10 EXECUTION PASS',n);
})().catch(e=>{console.error(e);process.exitCode=1});
