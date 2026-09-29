const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let n=0,queries=[],base=10,matching=3,year=null,terms=[];
const request={base:{transaction:'sale',membershipGroups:[['geo'],['type']]},get terms(){return terms},get year(){return year},road:null,propertyArea:undefined,constructionArea:undefined};
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/market-scarcity-engine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require:k=>{if(k==='server-only')return {};if(k==='./canonical-market-request')return {resolveCanonicalMarketRequest:async()=>request};if(k==='./canonical-market-population')return {countCanonicalMarket:async b=>(queries.push(['base',b]),base)};if(k==='./canonical-market-acquisition')return {countMarketNumericalSurvivors:async(r,b)=>(queries.push(['numerator',b]),matching)};throw Error('Unexpected dependency '+k)}});
const eq=(a,b)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));n++};
(async()=>{let r=await m.exports.getMarketScarcity({});eq(r.marketSize,10);eq(r.matchingCount,10);eq(r.percentage,100);eq(queries.length,1);eq(r.combinations,[]);
queries=[];terms=[{id:'type',dimension:'property_type',label:'House'},{id:'A',dimension:'utility',label:'Water'},{id:'B',dimension:'utility',label:'Fiber'}];r=await m.exports.getMarketScarcity({utility:'water,fiber'},'es');eq(r.matchingCount,3);eq(r.percentage,30);eq(queries.length,2);eq(queries[0][1].membershipGroups,[['geo'],['type']]);eq(queries[1][1].membershipGroups,[['geo'],['type'],['A'],['B']]);eq(r.selectedCombination.attributes.map(a=>a.termId),['A','B']);eq(r.combinations,[]);eq(Object.hasOwn(r,'scarcityScore'),false);
queries=[];base=0;r=await m.exports.getMarketScarcity({utility:'water,fiber'});eq(r.percentage,null);eq(r.matchingCount,0);eq(queries.length,1);eq(r.state,'EMPTY_BASE_MARKET');
base=10;matching=11;await assert.rejects(()=>m.exports.getMarketScarcity({}));n++;
terms=[];year={kind:'interval'};matching=4;queries=[];r=await m.exports.getMarketScarcity({year_built:'1980s'});eq(r.matchingCount,4);eq(queries.length,2);eq(r.selectedCombination.attributes[0].category,'year_built');
base=100;matching=20;year=null;
for(const k of [1,2,3,5,10,12,25]){terms=Array.from({length:k},(_,i)=>({id:String(i+1),dimension:'utility',label:'label'}));queries=[];const r=await m.exports.getMarketScarcity({});eq(queries.length,2);eq(queries[1][1].membershipGroups.length,k+2);eq(r.combinations,[]);eq(r.percentage,20)}

// Zero positive evidence deliberately does not distinguish unknown/nonmembership.
base=100;matching=0;queries=[];let zero=await m.exports.getMarketScarcity({utility:'water'});eq(zero.matchingCount,0);eq(zero.percentage,0);eq(zero.state,'ESTABLISHED');eq(Object.hasOwn(zero,'unknownCount'),false);eq(Object.hasOwn(zero,'evaluableCount'),false);
const firstGroups=queries[1][1].membershipGroups.slice(2).map(g=>g[0]).sort();terms=terms.slice().reverse();queries=[];zero=await m.exports.getMarketScarcity({});eq(queries[1][1].membershipGroups.slice(2).map(g=>g[0]).sort(),firstGroups);eq(zero.percentage,0);
base=1;matching=1;eq((await m.exports.getMarketScarcity({})).percentage,100);
console.log('CONFIGURATION FREQUENCY PASS:',n,'offline assertions; rare discovery execution absent.');})().catch(e=>{console.error(e);process.exitCode=1});
