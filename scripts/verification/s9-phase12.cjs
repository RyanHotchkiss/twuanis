const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript'),cache=new Map();let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
function load(rel){const file=path.resolve(root,rel);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(k.startsWith('@/lib/price-meter-')||k==='@/lib/numerical-distribution')return load(k.slice(2)+'.ts');if(k.startsWith('.'))return load(path.resolve(path.dirname(file),k)+'.ts');throw Error('Forbidden I/O dependency '+k)},console});return m.exports}
const identity=load('lib/price-meter-identity.ts'),builder=load('lib/price-meter-observation-builder.ts');const resolve=load('lib/price-meter-property-position-identity.ts').resolvePriceMeterPropertyPositionIdentity,populate=load('lib/price-meter-property-position-population.ts').buildPriceMeterPropertyPositionPopulation;
const build=(i,price,extra={})=>{const row={id:'p'+i,canonical_domain_version:1,transaction_type:'sale',currency:'CRC',current_price:price*200,property_type:'house',property_area:200,construction_area:100,canonicalGeography:{province:{id:'1'},canton:{id:'2'},district:null,complete:true},...extra};return builder.buildPriceMeterObservations([{...row,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:'2026-09-19',fxIdentity:null})}])};
const observations=[100,200,200,400,500].flatMap((price,i)=>build(i,price));
for(const basis of ['land','construction']){
 const selected=observations.filter(o=>o.normalizationBasis===basis),subject=resolve(selected[1]);
 const rent=build(9,999,{transaction_type:'rent',monthly_price:4000});
 const population=populate({participation:'SUBJECT_INCLUDED',subject,observations:[...observations,...rent]});
 ok(population.comparisonPopulationCount===5,'one universe, subject included');
 const distribution=load('lib/price-meter-distribution.ts').buildPriceMeterDistribution({transactionType:'sale',observations:population.observations});
 const percentile=load('lib/price-meter-property-position-percentile.ts').buildPriceMeterPropertyPositionPercentile({population});
 ok(percentile.belowCount===1&&percentile.equalCount===2&&percentile.aboveCount===2&&percentile.percentilePosition===40,'midrank preserves ties');
 const medianPosition=load('lib/price-meter-property-position-median.ts').buildPriceMeterPropertyPositionMedian({population,distribution});
 ok(medianPosition.differenceFromMedian===0&&medianPosition.percentDifferenceFromMedian===0&&medianPosition.percentageReference==='selected_population_median','median reference identity');
 const interval=load('lib/price-meter-property-position-interval.ts').buildPriceMeterPropertyPositionInterval({population,distribution});ok(interval.interval==='at_median','exact median interval');
 const tail=load('lib/price-meter-property-position-tail.ts').buildPriceMeterPropertyPositionTail({population,distribution,percentile,interval});ok(tail===null,'middle population no invented tail');
 const constructionToLandContext=load('lib/price-meter-property-position-construction-land.ts').buildPriceMeterPropertyPositionConstructionLandContext({subject});
 const evidence=load('lib/price-meter-property-position-evidence.ts').buildPriceMeterPropertyPositionEvidence({population,distribution,percentile,medianPosition,interval,tail,constructionToLandContext});ok(evidence.propertyPricePerM2===subject.propertyPricePerM2,'composed evidence retains subject');
 assert.throws(()=>populate({participation:'SUBJECT_INCLUDED',subject,observations:selected.filter(o=>o.listingId!==subject.listingId)}),/not represented/);checks++;
 assert.throws(()=>populate({participation:'SUBJECT_INCLUDED',subject,observations:[...selected,selected[1]]}));checks++;
 assert.throws(()=>load('lib/price-meter-property-position-median.ts').buildPriceMeterPropertyPositionMedian({population,distribution:{...distribution,transactionType:'rent'}}),/transaction/);checks++;
}
console.log('S9 PHASE12:',checks,'pure composition checks passed; actual existing modules, no database/network. Standalone application integration is verified separately by pre14-phase12-production-integration.cjs; reusable identity/context also used by Phase12A.');
