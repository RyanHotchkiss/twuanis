const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root='/Users/cassidydaddy/twuanis',ts=require(root+'/node_modules/typescript');
let acquisitions=0,memberships=0,fx=0;const cache=new Map();
const geo={province:{id:'1',term_name:'Cartago',official_code:'3'},canton:{id:'2',term_name:'Jimenez',official_code:'304'},district:{id:'3',term_name:'Pejivalle',official_code:'30403'},complete:true,reasons:{province:'resolved',canton:'resolved',district:'resolved'}};
const listings=Array.from({length:12},(_,i)=>({id:'listing-'+i,canonical_domain_version:1,transaction_type:'sale',currency:'CRC',current_price:100000+i*10000,price_millions:999,property_type:'house',property_area:200+i*100,construction_area:100+i*30,canonicalGeography:geo,images:[]}));
const mocks={
'@/lib/statistics-engine':{getMatchingListings:async()=>{acquisitions++;return listings}},
'@/lib/price-meter-ontology-membership':{loadPriceMeterOntologyMemberships:async ids=>{memberships++;assert.equal(new Set(ids).size,12);return []}},
'@/lib/canonical-population':{loadLegacyGeographyDictionary:async ids=>{assert.equal(ids.length,0);return []}},
'@/lib/geography/canonical-geography':{resolveCanonicalGeography(){throw Error('Unexpected geography re-resolution')}},
'@/lib/fx/fx-service':{getHistoricalUsdToCrcRate(){fx++;throw Error('Unexpected FX')}},
'@/app/utils/resolveListingImages':{resolveListingImages:x=>x},
'@/lib/analysis-date':{getCurrentAnalyticalDate:()=> '2026-09-19'}
};
function load(rel){rel=path.resolve(root,rel);if(cache.has(rel))return cache.get(rel).exports;const m={exports:{}};cache.set(rel,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(rel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(mocks[k])return mocks[k];if(k.startsWith('@/lib/price-meter-')||k==='@/lib/numerical-distribution'||k==='@/lib/market-intelligence-area-ranges')return load(k.replace('@/','')+'.ts');if(k.startsWith('.'))return load(path.resolve(path.dirname(rel),k)+'.ts');throw Error('Forbidden dependency '+k)},console,Date,URLSearchParams},{filename:rel});return m.exports}
(async()=>{const filters={province:'3',canton:'304',property_type:'house',transaction_type:'sale'};const permit=load('lib/price-meter-apply-permit.ts').issuePriceMeterApplyPermit(filters,'en');const result=await load('lib/price-meter-engine.ts').getPriceMeterAnalysis(filters,'en',permit);assert.equal(acquisitions,1);assert.equal(memberships,1);assert.equal(fx,0);console.log(JSON.stringify({acquisitions,memberships,fx,modules:cache.size,observations:result.observations.length,resultKeys:Object.keys(result),bytes:JSON.stringify(result).length}));fs.writeFileSync('/private/tmp/s9-engine-result.json',JSON.stringify(result,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
