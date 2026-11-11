// Real owning mathematics; acquisition is replaced with in-memory canonical fixtures.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..'),cache=new Map();let fixture,calls={},n=0;
const plain=x=>JSON.parse(JSON.stringify(x));const eq=(a,b,label)=>{assert.deepEqual(plain(a),plain(b),label);n++};
const spies=new Set(['buildPriceMeterObservations','buildPriceMeterAnalyticalCohort','buildPriceMeterDistribution','buildPriceMeterGeographicDistributions','buildPriceMeterGeographicLevel','buildPriceMeterSizeRelationshipPopulation','buildPriceMeterConstructionLandAnalysis']);
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

const action=load('lib/price-meter-apply-action.ts'),math=load('lib/price-meter-size-relationship-math.ts'),ranges=load('lib/market-intelligence-area-ranges.ts');
const areas={ 'property-area':[60,140,713,1700,6500,13000,51000], 'construction-area':[30,73,143,270,513,915] };
const filters=tx=>({transaction_type:tx,property_type:'house',province:'1',canton:'101'});
function setup(mode,tx,count=140,bands=areas[mode].length){fixture=fixtures(tx);const template=fixture.listings[1];fixture.listings=Array.from({length:count},(_,i)=>{const area=areas[mode][i%bands];return {...template,id:String(i+1),property_type:'house',property_area:mode==='property-area'?area:800,construction_area:mode==='construction-area'?area:150,current_price:Math.sqrt(area)*100000,monthly_price:Math.sqrt(area)*1000}});}
function evidence(result,tx,mode){return result[tx==='sale'?'saleIntelligence':'rentIntelligence'].sizeRelationships[mode==='property-area'?'propertyArea':'constructionArea'];}
(async()=>{
 for(const mode of Object.keys(areas))for(const tx of ['sale','rent'])for(const lang of ['en','es'])for(const surface of ['workspace','standalone']){
 setup(mode,tx);calls={};const result=await action.executePriceMeterApply(filters(tx),lang,surface,[mode]),e=evidence(result,tx,mode),counts={...calls};
 eq(counts.load,1,'one acquisition');eq(counts.buildPriceMeterObservations,1,'one observation builder');
 eq(counts.observationScope,mode==='property-area'?'land':'construction','selected construction scope');
 eq(counts.constructed.length,140,'one observation per eligible listing');
 eq(counts.constructed.every(x=>x[0]==='improved_property'&&x[1]===counts.observationScope),true,'unselected observations ZERO');
 eq(counts.buildPriceMeterSizeRelationshipPopulation,1,'one size population');
 for(const name of ['calculateSpearmanCorrelation','calculateLogLogRegression','calculateLogLogRSquared'])eq(counts[name],1,name+' once');
 eq(counts.calculateModeledAreaChange||0,0,'hypothetical derivation ZERO');
 eq(counts.buildPriceMeterDistribution,areas[mode].length,'one distribution per fixed band');
 eq(counts.buildPriceMeterGeographicLevel||0,0,'geography ZERO');eq(counts.buildPriceMeterConstructionLandAnalysis||0,0,'CL ZERO');
 eq(e.result.evidence.representedObservationCount,140,'represented n');
 eq(e.population.coordinates.map(c=>c.area),areas[mode],'median exact area not midpoint');
 eq(Math.abs(e.result.spearmanRho+1)<1e-10,true,'known reverse rank association');
 eq(Math.abs(e.result.regression.beta+.5)<1e-10,true,'known log-log slope');
 eq(Math.abs(e.result.regression.rSquared-1)<1e-10,true,'known fit');
 eq(/modeledTenPercent|listingId|observations"|canonicalEvidence|identities"/.test(JSON.stringify(result)),false,'no hypothetical/raw evidence in response');
 eq(result.sizeContext.mode,mode,'committed size identity');eq(result.sizeContext.transactionType,tx,'transaction identity');
 for(const b of e.population.bands){eq(b.medianNormalizedRatio,Math.sqrt(b.medianExactArea)*(tx==='sale'?100000:1000)/b.medianExactArea,'exact cohort median');eq(b.observationCount,fixture.listings.filter(l=>(mode==='property-area'?l.property_area:l.construction_area)===b.medianExactArea).length,'band n');}
 }
 for(const mode of Object.keys(areas))for(const B of [0,1,2,3,areas[mode].length])for(const N of [1,100,1000]){
 setup(mode,'sale',B?N:0,B||1);calls={};const start=performance.now(),result=await action.executePriceMeterApply(filters('sale'),'en','workspace',[mode]),elapsed=performance.now()-start,e=evidence(result,'sale',mode),actualB=Math.min(B,N);
 eq(e.result.evidence.populatedBandCount,actualB,'populated B');
 eq(calls.calculateSpearmanCorrelation||0,actualB>=3?1:0,'band gate');
 eq(calls.calculateModeledAreaChange||0,0,'no modeled change at any scale');
 eq(calls.load,1,'B independent acquisition');eq(e.result.evidence.representedObservationCount,B?N:0,'complete population');
 if(N===1000)console.log(JSON.stringify({mode,N:B?N:0,B:actualB,acquisition:calls.load,observations:calls.constructed.length,bandDistributions:calls.buildPriceMeterDistribution,projectedBytes:Buffer.byteLength(JSON.stringify(result)),fixtureMilliseconds:elapsed}));
 }
 for(const mode of Object.keys(areas)){
 setup(mode,'sale',4);fixture.listings=fixture.listings.map(l=>({...l,property_area:null,construction_area:null}));calls={};const r=await action.executePriceMeterApply(filters('sale'),'en','workspace',[mode]);eq(r.sizeContext.marketListingCount,4,'nonempty acquired market');eq(evidence(r,'sale',mode).result.evidence.representedObservationCount,0,'no exact area no observation');
 setup(mode,'sale',3);fixture.listings[0].property_type='land';calls={};await action.executePriceMeterApply(filters('sale'),'en','workspace',[mode]);eq(calls.constructed.length,2,'land-only excluded before observation construction');
 }
 for(const [input,engines,identityArg]of [[filters('sale'),['property-area','construction-area']], [filters('sale'),['property-area'],{propertyBasis:'improved_property',normalizationBasis:'construction'}],[{...filters('sale'),normalization_basis:'construction'},['property-area']],[{...filters('sale'),transaction_type:'bad'},['property-area']]]){
 calls={};await assert.rejects(()=>action.executePriceMeterApply(input,'en','workspace',engines,identityArg));eq(calls.load||0,0,'invalid zero acquisition');}
 const x=[100,200,300],y=[10,10,30];eq(Math.abs(math.calculateSpearmanCorrelation(x,y)-Math.sqrt(.75))<1e-12,true,'average tied ranks');
 for(const coords of [[{area:100,ratio:10},{area:100,ratio:20},{area:100,ratio:30}],[{area:100,ratio:10},{area:200,ratio:10},{area:300,ratio:10}]]){
 calls={};const r=math.buildPriceMeterDescriptiveSizeRelationshipResult({coordinates:coords,representedObservationCount:3});eq(r.spearmanRho,null,'degenerate ranks null');eq(calls.calculateModeledAreaChange||0,0,'degenerate no hypothetical');if(coords[0].area===coords[1].area)eq(r.regression,null,'zero x variance null');else eq(r.regression.rSquared,null,'zero y variance R2 null');}
 const legacy=math.buildPriceMeterSizeRelationshipResult({coordinates:[{area:100,ratio:1000},{area:200,ratio:500},{area:400,ratio:250}],representedObservationCount:3});eq(Math.abs(legacy.regression.modeledTenPercentAreaChange-((1/1.1-1)*100))<1e-10,true,'other contextual contract preserved');
 for(const [options,match]of [[ranges.PROPERTY_AREA_RANGE_OPTIONS,ranges.matchesPropertyAreaConstraint],[ranges.CONSTRUCTION_AREA_RANGE_OPTIONS,ranges.matchesConstructionAreaConstraint]])for(const value of [1,49.9,50,99.9,100,200,400,500,800,1000,5000,10000,50000,1e8])eq(options.filter(o=>match(value,o.value)).length,1,'exact band boundaries partition');
 // Unknown/zero/range area and nonpositive price remain ineligible, with no imputation.
 setup('property-area','sale',5);fixture.listings=fixture.listings.map((l,i)=>({...l,property_area:[0,-1,null,'500-1000',713][i],current_price:i===4?0:l.current_price}));calls={};const invalid=await action.executePriceMeterApply(filters('sale'),'en','workspace',['property-area']);eq(evidence(invalid,'sale','property-area').result.evidence.representedObservationCount,0,'invalid evidence excluded');
 for(const mode of Object.keys(areas)){
 setup(mode,'sale',3);fixture.listings=fixture.listings.map(l=>({...l,currency:'USD',current_price:100}));calls={};
 const en=await action.executePriceMeterApply(filters('sale'),'en','workspace',[mode]),counts={...calls};
 const es=await action.executePriceMeterApply(filters('sale'),'es','standalone',[mode]);
 eq(evidence(en,'sale',mode),evidence(es,'sale',mode),'EN/ES actual numerical parity');
 eq(counts.fx,1,'one mocked FX resolution');eq(en.sizeContext.fx.rate,500,'FX rate provenance');
 eq(en.sizeContext.fx.source,'BCCR','FX source provenance');eq(counts.calculateModeledAreaChange||0,0,'USD no hypothetical');
 eq(evidence(en,'sale',mode).population.populatedBands.map(b=>b.medianNormalizedRatio),areas[mode].slice(0,3).map(a=>50000/a),'USD same approved normalization');
 }
 console.log('ENGINE 9 SIZE EXECUTION PASS',n);
})().catch(e=>{console.error(e);process.exitCode=1});
