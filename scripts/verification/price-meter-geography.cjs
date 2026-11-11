// Real owning mathematics; acquisition is replaced with in-memory canonical fixtures.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..'),cache=new Map();let fixture,calls={},n=0;
const plain=x=>JSON.parse(JSON.stringify(x));const eq=(a,b,label)=>{assert.deepEqual(plain(a),plain(b),label);n++};
const spies=new Set(['buildPriceMeterObservations','buildPriceMeterAnalyticalCohort','buildPriceMeterDistribution','buildPriceMeterGeographicDistributions','buildPriceMeterGeographicLevel','buildPriceMeterSizeRelationshipPopulation','buildPriceMeterConstructionLandAnalysis']);
function load(file){file=path.normalize(file);if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,console,require(name){if(name==='server-only')return{};if(name==='react'||name==='react/jsx-runtime')return require(name);const base=name.startsWith('@/')?name.slice(2):name.startsWith('.')?path.join(path.dirname(file),name):null;if(base==='lib/canonical-market-observation-rows')return {loadCanonicalMarketObservationRows:async()=>{calls.load=(calls.load||0)+1;return fixture.listings}};
if(base==='lib/canonical-population')return{loadLegacyGeographyDictionary:async()=>[]};
if(base==='lib/analysis-date')return{getCurrentAnalyticalDate:()=> '2026-09-26'};
if(base==='lib/fx/fx-service')return{getHistoricalUsdToCrcRate:async()=>{calls.fx=(calls.fx||0)+1;return{analyticalDate:'2026-09-26',rate:500,effectiveDate:'2026-09-25',resolutionMode:'historical'}}};
if(base==='lib/price-meter-authorization')return{authorizePriceMeterIntelligenceExecution:async()=>{calls.auth=(calls.auth||0)+1}};
if(base==='lib/price-meter-ontology-membership')return{loadPriceMeterOntologyMemberships:async()=>{calls.membership=(calls.membership||0)+1;return[]}};if(base==='lib/statistics-engine')throw Error('Statistics engine forbidden');if(base)for(const ext of ['.ts','.tsx'])if(fs.existsSync(path.join(root,base+ext)))return load(base+ext);throw Error('Unmocked dependency '+name)},fetch(){throw Error('Network forbidden')}},{filename:file});for(const key of Object.keys(m.exports))if(spies.has(key)){const f=m.exports[key];m.exports[key]=(...args)=>{calls[key]=(calls[key]||0)+1;if(key==='buildPriceMeterGeographicLevel')calls['level:'+args[0].level]=(calls['level:'+args[0].level]||0)+1;return f(...args)}}cache.set(file,m.exports);return m.exports}
const identity=load('lib/price-meter-identity.ts'),builder=load('lib/price-meter-observation-builder.ts'),permit=load('lib/price-meter-apply-permit.ts');
const selected=load('lib/price-meter-selected-engine.ts'),old=load('lib/price-meter-engine.ts'),project=load('lib/price-meter-browser-result.ts');
const engines=['distribution','geography','property-area','construction-area','construction-land'];
function fixtures(transaction){const listings=Array.from({length:70},(_,i)=>{const l={canonical_domain_version:1,id:String(i+1),transaction_type:transaction,property_type:i%7===0?'land':'house',property_area:100+i*23,construction_area:i%7===0?null:45+i*9,currency:'CRC',current_price:10000000+i*140000,monthly_price:100000+i*1400,canonicalGeography:{province:{official_code:'1'},canton:{official_code:'101'},district:{official_code:i%2?'10101':'10102'}}};return{...l,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(l,{analyticalDate:'2026-09-26',fxIdentity:null})}});return{analyticalDate:'2026-09-26',listings,observations:builder.buildPriceMeterObservations(listings),fxIdentity:{conversionApplied:true,rate:500,effectiveDate:'2026-09-26'}}}

const action=load('lib/price-meter-apply-action.ts');

function geographicFixture(tx,size=70,g=3){fixture=fixtures(tx);fixture.listings=Array.from({length:size},(_,i)=>({...fixture.listings[i%70],id:String(i+1),canonicalGeography:{province:term(1+i%g,'province'),canton:term(100+i%g,'canton'),district:i%11===0?null:term(1000+i%g,'district')}}));}
function term(id,type){return{id,official_code:String(id),term_type:type,term_name:'Area '+id,term_name_en:'Area '+id,term_name_es:'Área '+id}}
(async()=>{
 const definitions=[{propertyBasis:'land_only',normalizationBasis:'land'},{propertyBasis:'improved_property',normalizationBasis:'land'},{propertyBasis:'improved_property',normalizationBasis:'construction'}];
 for(const [index,level]of ['province','canton','district'].entries())for(const tx of ['sale','rent']){
 geographicFixture(tx);const filters={transaction_type:tx,property_type:'house',...(index>0?{province:'1'}:{}),...(index>1?{canton:'101'}:{})},command={definition:definitions[index],comparisonLevel:level};
 const observations=(await load('lib/price-meter-observation-loader.ts').loadPriceMeterObservations(filters,command.definition)).observations;
 const reference=load('lib/price-meter-distribution.ts').buildPriceMeterDistribution({transactionType:tx,observations});
 const groups=load('lib/price-meter-geographic-distribution.ts').buildPriceMeterGeographicDistributions({transactionType:tx,observations});
 const expected=load('lib/price-meter-geographic-statistics.ts').buildPriceMeterGeographicStatistics({selectedMarketDistribution:reference,geographicDistributions:groups[level],comparisonLevel:level});
 calls={};const result=await action.executePriceMeterApply(filters,index===1?'es':'en',index===2?'standalone':'workspace',['geography'],undefined,command),v=result.geographicResult;
 eq(v.rows.map(r=>[r.geography.id,r.rank,r.n,r.median,r.difference,r.percentDifference]),expected.map(s=>[String(s.geography[level].id),s.rank,s.distribution.sampleSize,s.distribution.median,s.medianDifferenceFromSelectedMarket,s.medianPercentAboveOrBelowSelectedMarket]),'owning mathematics unchanged');
 eq(v.definition,command.definition,'one committed identity');eq(v.comparisonLevel,level,'one committed level');eq(v.reference,{median:reference.median,n:reference.sampleSize},'exact reference');
 eq(calls.load,1,'one acquisition');eq(calls.buildPriceMeterObservations,1,'one observation construction');eq(calls.buildPriceMeterAnalyticalCohort,1,'one cohort');eq(calls.buildPriceMeterGeographicLevel,1,'one level');eq(calls.buildPriceMeterGeographicDistributions||0,0,'no all-level builder');
 for(const l of ['province','canton','district'])eq(calls['level:'+l]||0,l===level?1:0,'only selected level '+l);
 eq(calls.buildPriceMeterDistribution,expected.length+1,'G child distributions plus one reference');
 eq(calls.membership||0,0,'no characteristic fanout');eq(calls.buildPriceMeterConstructionLandAnalysis||0,0,'no construction land analysis');
 eq(/"(?:listingId|observations|canonicalEvidence|identities)"\s*:/.test(JSON.stringify(result)),false,'no raw evidence');
 }
 for(const [filters,command]of [
 [{transaction_type:'sale',property_type:'house'},{definition:definitions[0],comparisonLevel:'canton'}],
 [{transaction_type:'sale',property_type:'house',province:'1'},{definition:definitions[0],comparisonLevel:'district'}],
 [{transaction_type:'sale',property_type:'house',province:'1'},{definition:definitions[0],comparisonLevel:'province'}],
 [{transaction_type:'sale',property_type:'house',province:'1',canton:'101',district:'10101'},{definition:definitions[0],comparisonLevel:'district'}],
 [{transaction_type:'sale',property_type:'house'},{definition:{propertyBasis:'land_only',normalizationBasis:'construction'},comparisonLevel:'province'}],
 [{transaction_type:'sale',property_type:'house',province:'1,2'},{definition:definitions[0],comparisonLevel:'canton'}],
 ]){calls={};await assert.rejects(()=>action.executePriceMeterApply(filters,'en','workspace',['geography'],undefined,command));eq(calls.load||0,0,'invalid zero acquisition');eq(calls.buildPriceMeterObservations||0,0,'invalid zero calculation')}
 const f={transaction_type:'sale',property_type:'house'},c={definition:definitions[1],comparisonLevel:'province'};
 for(const size of [0,1,10,1000])for(const g of [1,5,25]){geographicFixture('sale',size,g);calls={};const v=(await action.executePriceMeterApply(f,'en','workspace',['geography'],undefined,c)).geographicResult;if(size===1000)console.log(JSON.stringify({fixtureN:size,requestedG:g,representedG:v.rows.length,acquisitions:calls.load,observationBuilders:calls.buildPriceMeterObservations,geographicLevels:calls.buildPriceMeterGeographicLevel,distributions:calls.buildPriceMeterDistribution,projectedBytes:Buffer.byteLength(JSON.stringify(v))}));eq(calls.load,1,'G independent acquisition');eq(calls.buildPriceMeterGeographicLevel,1,'N independent one level');eq(calls.buildPriceMeterDistribution,v.rows.length+1,'G+1 distributions');eq(v.rows.reduce((s,r)=>s+r.n,0),v.reference.n,'full province coverage');}
 // Canonical permit cannot authorize another command or the ordinary legacy engine.
 calls={};const p=permit.issuePriceMeterApplyPermit(f,'en',c);assert.throws(()=>permit.consumePriceMeterApplyPermit(p,f,'en'));eq(calls.load||0,0,'mode-bound permit');
 const p2=permit.issuePriceMeterApplyPermit(f,'en',c);assert.throws(()=>permit.consumePriceMeterApplyPermit(p2,f,'en',{...c,definition:definitions[0]}));
 const p3=permit.issuePriceMeterApplyPermit(f,'en',c);permit.consumePriceMeterApplyPermit(p3,f,'en',c);assert.throws(()=>permit.consumePriceMeterApplyPermit(p3,f,'en',c));
 // Sequential ordinal ranks and equal medians remain the existing semantics.
 const distribution={transactionType:'sale',sampleSize:1,median:100};const tied=load('lib/price-meter-geographic-statistics.ts').buildPriceMeterGeographicStatistics({selectedMarketDistribution:distribution,comparisonLevel:'province',geographicDistributions:[1,2].map(i=>({level:'province',geography:{province:term(i,'province'),canton:null,district:null},distribution}))});eq(tied.map(r=>[r.rank,r.medianDifferenceFromSelectedMarket,r.medianPercentAboveOrBelowSelectedMarket]),[[1,0,0],[2,0,0]],'ties preserved without fabricated differences');
 geographicFixture('sale',10,2);const valid=fixture.listings[1];fixture.listings=[{...valid,currency:'USD',current_price:100,construction_area:50},{...valid,id:'missing',construction_area:null},{...valid,id:'range',construction_area:'100-200'}];const usdCommand={definition:definitions[2],comparisonLevel:'province'};calls={};const usd=(await action.executePriceMeterApply(f,'en','workspace',['geography'],undefined,usdCommand)).geographicResult;eq(usd.reference,{median:1000,n:1},'USD conversion with exact construction only');eq(usd.fx.rate,500,'FX evidence preserved');eq(usd.rows[0].median,1000,'one geographic observation');
 const spanish=(await action.executePriceMeterApply(f,'es','standalone',['geography'],undefined,usdCommand)).geographicResult;eq(spanish.rows.map(r=>[r.geography.id,r.median,r.n,r.rank,r.difference,r.percentDifference]),usd.rows.map(r=>[r.geography.id,r.median,r.n,r.rank,r.difference,r.percentDifference]),'EN/ES exact evidence parity');
 fixture.listings=[{...valid,construction_area:null}];const absent=(await action.executePriceMeterApply(f,'en','workspace',['geography'],undefined,usdCommand)).geographicResult;eq(absent.rows,[],'no fabricated zero cohort');eq(absent.reference,{median:null,n:0},'noncomputable reference not zero');
 console.log('ENGINE 8 GEOGRAPHIC EXECUTION PASS',n)
})().catch(e=>{console.error(e);process.exitCode=1});
