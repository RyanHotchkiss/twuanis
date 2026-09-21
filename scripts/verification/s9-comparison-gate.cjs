const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=process.env.S9_REPO_ROOT||'/Users/cassidydaddy/twuanis',ts=require(root+'/node_modules/typescript');let n=0;
const ok=(v,l)=>{assert.ok(v,l);n++};
function load(file,deps){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(k in deps)return deps[k];throw Error('Unexpected dependency '+k)},console});return m.exports}
const permit=load('lib/price-meter-comparison-permit.ts',{});let allow=true,events=[];const request={transactionType:'sale',referenceCohort:'A'};
const action=load('lib/price-meter-comparison-action.tsx',{
'@/lib/price-meter-authorization':{async authorizePriceMeterIntelligenceExecution(){events.push('auth');if(!allow)throw Error('denied')}},
'@/lib/explorer-options-engine':{async getExplorerOptions(){events.push('options');return {server:true}}},
'@/lib/price-meter-comparison-request-parser':{parsePriceMeterComparisonRequest({params,options}){events.push('parse');assert.equal(options.server,true);return request}},
'@/lib/price-meter-comparison-permit':permit,
'@/lib/price-meter-comparison-engine':{async getPriceMeterComparisonAnalysis({request,language,permit:p}){permit.consumePriceMeterComparisonPermit(p,request,language);events.push('engine');return {fake:true}}},
'@/app/price-per-square-meter/PriceMeterComparisonResults':{default:'EN'},
'@/app/es/precio-por-metro-cuadrado/ResultadosComparacionPrecioMetro':{default:'ES'},
'react/jsx-runtime':{jsx:(type,props)=>({type,props})}
});
(async()=>{
allow=false;await assert.rejects(()=>action.executePriceMeterComparison({},'en'));ok(events.join(',')==='auth','denied before options/parse/engine');
allow=true;for(const input of [null,[],{a_province:{id:1}}]){events=[];await assert.rejects(()=>action.executePriceMeterComparison(input,'en'));ok(events.join(',')==='auth','malformed before acquisition')}
for(const language of ['en','es']){events=[];await action.executePriceMeterComparison({a_province:'cartago'},language);ok(events.join(',')==='auth,options,parse,engine','authorized order '+language)}
for(const p of [undefined,{kind:'price-meter-comparison'}]){assert.throws(()=>permit.consumePriceMeterComparisonPermit(p,request,'en'));n++}
let p=permit.issuePriceMeterComparisonPermit(request,'en');permit.consumePriceMeterComparisonPermit(p,request,'en');n++;assert.throws(()=>permit.consumePriceMeterComparisonPermit(p,request,'en'));n++;
p=permit.issuePriceMeterComparisonPermit(request,'en');assert.throws(()=>permit.consumePriceMeterComparisonPermit(p,request,'es'));n++;assert.throws(()=>permit.consumePriceMeterComparisonPermit(p,request,'en'));n++;
p=permit.issuePriceMeterComparisonPermit(request,'en');assert.throws(()=>permit.consumePriceMeterComparisonPermit(p,{...request,referenceCohort:'B'},'en'));n++;
// Execute the real engine's rejection before any downstream helper can run.
const source=fs.readFileSync(root+'/lib/price-meter-comparison-engine.ts','utf8');const deps={};for(const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g))deps[match[1]]=new Proxy({}, {get(){return ()=>{throw Error('DOWNSTREAM REACHED')}}});deps['@/lib/price-meter-comparison-permit']=permit;
const engine=load('lib/price-meter-comparison-engine.ts',deps);await assert.rejects(()=>engine.getPriceMeterComparisonAnalysis({request}),/explicit authorized Compare/);n++;
for(const rel of ['app/price-per-square-meter/page.tsx','app/es/precio-por-metro-cuadrado/page.tsx']){const src=fs.readFileSync(root+'/'+rel,'utf8');ok(!src.includes('getPriceMeterComparisonAnalysis')&&!src.includes('parsePriceMeterComparisonRequest'),'no URL-triggered analytical path '+rel);ok(src.includes('PriceMeterComparisonApply'),'explicit component '+rel)}
console.log('S9 COMPARISON EXECUTION CHECKS',n)
})().catch(e=>{console.error(e);process.exitCode=1});
