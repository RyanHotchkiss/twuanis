// Offline production-module verification. No application, database, or FX imports.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
const filename=path.join(root,'lib/market-year-built-constraint.ts'),moduleObject={exports:{}};
const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function geo(name){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/geography/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require:k=>geo(k.slice(2))});return m.exports}
vm.runInNewContext(js,{module:moduleObject,exports:moduleObject.exports,require:n=>{if(n==='server-only')return {};if(n==='./geography/dta-identity')return geo('dta-identity');if(n==='./market-year-built-options'){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/market-year-built-options.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});return m.exports}throw Error('Unexpected runtime import '+n)}},{filename});
const api=moduleObject.exports;let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),m);checks++};
const reject=(f,m)=>{assert.throws(f,undefined,m);checks++};
const empty={dimension:'year_built',exact_value:null,category_term_id:null,range_lower:null,range_upper:null,lower_inclusive:null,upper_inclusive:null};
const exact=n=>({...empty,kind:'exact',exact_value:String(n)});
const range=(lo,hi,li=true,ui=false)=>({...empty,kind:'range',range_lower:lo===null?null:String(lo),range_upper:hi===null?null:String(hi),lower_inclusive:li,upper_inclusive:ui});
const cat=id=>({...empty,kind:'category',category_term_id:id});
const q=api.resolveMarketYearBuiltConstraint('1980s');
for(const [code,n,state]of [['1980s',1980,'MATCH'],['1980s',1989,'MATCH'],['1980s',1979,'NONMATCH'],['1980s',1990,'NONMATCH'],['2020+',2020,'MATCH'],['Pre-1980',1979,'MATCH'],['Pre-1980',1980,'NONMATCH']])eq(api.evaluateMarketYearBuilt(api.resolveMarketYearBuiltConstraint(code),exact(n)),{state,evidenceKind:'exact'},code+' '+n);
eq(api.evaluateMarketYearBuilt(q,undefined),{state:'UNKNOWN',evidenceKind:'missing'},'missing');
for(const [f,state]of [[range(1980,1990),'MATCH'],[range(1980,1989,true,true),'MATCH'],[range(1975,1985),'UNKNOWN'],[range(1990,2000),'NONMATCH'],[range(null,1980,false,false),'NONMATCH'],[range(1989,1990,false,true),'NONMATCH']])eq(api.evaluateMarketYearBuilt(q,f),{state,evidenceKind:'range'},'range containment/disjoint/overlap');
eq(api.evaluateMarketYearBuilt(q,cat('42')),{state:'UNKNOWN',evidenceKind:'category'},'unmapped category not discarded or guessed');
eq(api.evaluateMarketYearBuilt(q,cat('42'),new Map([['42',q.interval]])),{state:'MATCH',evidenceKind:'category'},'explicit canonical category interval');
eq(api.evaluateMarketYearBuilt(q,cat('42'),new Map([['42',{lower:1970,upper:1980,lowerInclusive:true,upperInclusive:false}]])),{state:'NONMATCH',evidenceKind:'category'},'disjoint category');
for(const option of api.MARKET_YEAR_BUILT_OPTIONS){const c=api.resolveMarketYearBuiltConstraint(option.key);for(const label of [option.en,option.es,'Renamed display label']){const presentation={code:option.key,label};eq(api.resolveMarketYearBuiltConstraint(presentation.code),c,'EN/ES/renamed label does not affect identity')}}
for(const n of [1,1979,1980,1989,1990,1999,2000,2009,2010,2019,2020,9999])eq(api.MARKET_YEAR_BUILT_OPTIONS.filter(o=>api.evaluateMarketYearBuilt(api.resolveMarketYearBuiltConstraint(o.key),exact(n)).state==='MATCH').length,1,'mutually exclusive/exhaustive '+n);
for(const value of ['Década de 1980','1985','pre-1980',null,{},'unknown'])reject(()=>api.resolveMarketYearBuiltConstraint(value),'unsupported code never parsed');
for(const f of [exact(0),exact(10000),exact('1980.5'),exact('NaN'),range(1980,1980,true,false),{...exact(1987),dimension:'bedrooms'},{...exact(1987),category_term_id:'42'},cat('bad')])reject(()=>api.evaluateMarketYearBuilt(q,f),'malformed evidence fails closed');
const data=fs.readFileSync(path.join(root,'data/property-data.ts'),'utf8').split('export const year_built_options = [')[1].split(']')[0];
const keys=[...data.matchAll(/en: '([^']+)'/g)].map(m=>m[1]);eq(api.MARKET_YEAR_BUILT_OPTIONS.map(o=>o.key),keys,'complete source-supported option set');
console.log('MARKET YEAR BUILT CONSTRAINT PASS:',checks,'assertions; no DB/network/application execution.');
