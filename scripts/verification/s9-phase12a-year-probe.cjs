const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');const root='/Users/cassidydaddy/twuanis',ts=require(root+'/node_modules/typescript');let checks=0;const ok=(v,l)=>{assert.ok(v,l);checks++};const cache=new Map();let mode='allow',loads=0,analyses=0,events=[];
class AuthError extends Error{};class EntitlementError extends Error{};
const mocks={'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status??200})}},'@/lib/price-meter-authorization':{PriceMeterComparableAuthenticationError:AuthError,PriceMeterComparableAuthorizationError:EntitlementError,async authorizePriceMeterIntelligenceExecution(){events.push('authorize');if(mode==='auth')throw new AuthError();if(mode==='entitlement')throw new EntitlementError();if(mode==='authority-error')throw Error('authority failed')}},'@/lib/price-meter-observation-loader':{async loadPriceMeterObservations(filters){loads++;events.push('load');assert.equal(filters.province,'3');assert.equal(filters.canton,'304');if(mode==='load-error')throw Error('load failed');return {observations}}}};
function load(rel){rel=path.resolve(root,rel);if(cache.has(rel))return cache.get(rel).exports;const m={exports:{}};cache.set(rel,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(rel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(mocks[k])return mocks[k];if(k.startsWith('@/lib/price-meter-')||['@/lib/numerical-distribution','@/lib/market-intelligence-area-ranges'].includes(k))return load(k.slice(2)+'.ts');if(k.startsWith('.'))return load(path.resolve(path.dirname(rel),k)+'.ts');throw Error('Unexpected dependency '+k)},console:{error(){}}},{filename:rel});return m.exports}
const identity=load('lib/price-meter-identity.ts'),builder=load('lib/price-meter-observation-builder.ts');
const observations=builder.buildPriceMeterObservations(Array.from({length:16},(_,i)=>{const listing={id:'x'+i,transaction_type:'sale',currency:'CRC',current_price:100000+i*10000,property_type:'house',property_area:200+i*250,construction_area:70+i*30,canonicalGeography:{province:{id:'1'},canton:{id:'2'},district:{id:String(3+i%2),term_name:'District '+i%2},complete:true}};return {...listing,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(listing,{analyticalDate:'2026-09-19',fxIdentity:null})}}));

const subject=load('lib/price-meter-comparable-subject-identity.ts');
const input={observation:observations[0],characteristics:[{ontologyTermId:1,termType:'property_type',slug:'house',termName:'House',termNameEn:'House',termNameEs:'Casa',slugEn:'house',slugEs:'casa'}]};

const population=load('lib/price-meter-comparable-population.ts');
const presentation=load('lib/price-meter-comparable-presentation.ts');
const characteristic=(id,type,en,es)=>({ontologyTermId:id,termType:type,slug:en,termName:en,termNameEn:en,termNameEs:es,slugEn:en,slugEs:es});
const bedroom=characteristic(9,'bedrooms','Three','Tres');
const explicit=characteristic(20,'year_built','Existing category','Categoría existente');
const sealedResult=characteristic(21,'year_built','Sealed result','Resultado sellado');
const observation=observations[0];
const peer=(id)=>({...observation,listingId:id});
const peerIds=['exact','range','explicit','sealed','other'];
const baseCohort={observations:[observation,...peerIds.map(peer)]};
const memberships=peerIds.map(id=>({listingId:id,ontologyTermIds:[1,9,...(id==='explicit'?[20]:id==='sealed'?[21]:[])]}));
function resolve(raw,extra=[]){return subject.resolvePriceMeterComparableSubjectIdentity({...input,characteristics:[...input.characteristics,bedroom,...extra],yearBuiltRange:raw})}
function run(identity,activeDimensions){return population.buildPriceMeterComparablePopulation({subject:identity,baseCohort,memberships,activeDimensions})}
function show(identity){return presentation.buildPriceMeterComparablePresentation({subject:identity,observation}).optionalDimensions}
for(const raw of [null,'1995','[1985,1995]','1990s']){
 const identity=resolve(raw); const before=JSON.stringify(identity);
 ok(!identity.characteristics.some(c=>c.termType==='year_built'),'No category inferred from '+raw);
 ok(!show(identity).some(d=>d.dimension==='year_built'),'No selectable category without authority '+raw);
 ok(run(identity,[]).sampleSize===5,'Unclassified peers retained without Year Built constraint');
 ok(run(identity,['bedrooms']).sampleSize===5,'Other dimensions remain usable');
 assert.throws(()=>run(identity,['year_built']),/no canonical value/);checks++;
 ok(JSON.stringify(identity)===before,'Consumer does not mutate evidence');
}
for(const [category,expected] of [[explicit,'explicit'],[sealedResult,'sealed']]){
 const identity=resolve('[1985,1995]',[category]);
 const displayed=show(identity).find(d=>d.dimension==='year_built');
 ok(displayed.value.en===category.termNameEn&&displayed.value.es===category.termNameEs,'Existing authorized EN/ES category presented');
 const result=run(identity,['year_built']);
 ok(result.sampleSize===1&&result.matchingListingIds[0]===expected,'Only matching positive category membership qualifies');
 ok(!result.matchingListingIds.includes('exact')&&!result.matchingListingIds.includes('range'),'Exact/range alone cannot satisfy category');
 ok(run(identity,[]).sampleSize===5,'Category not selected leaves all peers eligible');
 ok(run(identity,['bedrooms','year_built']).sampleSize===1,'Category intersection preserves other constraints');
}
console.log('S9 PHASE12A YEAR BUILT: '+checks+' offline checks passed. Actual identity, presentation and population modules; authorized explicit/derived membership fixtures; no rule execution or database claims.');
