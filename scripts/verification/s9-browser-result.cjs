const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript'),React=require(root+'/node_modules/react'),{renderToStaticMarkup}=require(root+'/node_modules/react-dom/server');let checks=0;const ok=(v,l)=>{assert.ok(v,l);checks++};
// Reuse the existing completed ordinary-engine fixture; do not reexecute it.
const fixture=JSON.parse(fs.readFileSync('/private/tmp/s9-engine-result.json','utf8')),cache=new Map();
function load(rel){let file=path.resolve(root,rel);if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(k==='react'||k==='react/jsx-runtime')return require(root+'/node_modules/'+k);if(k.startsWith('@/'))return load(k.slice(2));if(k.startsWith('.'))return load(path.resolve(path.dirname(file),k));throw Error('Forbidden dependency '+k)},console});return m.exports}
const project=load('lib/price-meter-browser-result.ts').toPriceMeterBrowserResult;
for(const transaction of ['sale','rent']){
 const result=project(fixture,transaction);const json=JSON.stringify(result);
 for(const forbidden of ['listings','observations','identities','listingId','canonicalEvidence','analyticalIdentity','matchingListingIds','ontologyTermIds']){ok(!new RegExp('"'+forbidden+'"\\s*:').test(json),'no internal '+forbidden)}
 ok(!((transaction==='sale'?'rentIntelligence':'saleIntelligence') in result),'only selected transaction serialized');
 for(const file of ['app/price-per-square-meter/PriceMeterResults.tsx','app/es/precio-por-metro-cuadrado/ResultadosPrecioMetro.tsx']){
 const component=load(file).default,filters={...fixture.filters,transaction_type:transaction};
 const before=renderToStaticMarkup(React.createElement(component,{filters,analysis:fixture}));
 const after=renderToStaticMarkup(React.createElement(component,{filters,analysis:result}));
 ok(before===after,'EN/ES server-rendered markup unchanged for '+transaction+' '+file);
 }
}
console.log('S9 BROWSER RESULT',checks,'checks passed; cached completed fixture, real EN/ES panels/charts; raw bytes',JSON.stringify(fixture).length,'projected Sale bytes',JSON.stringify(project(fixture,'sale')).length);

// Exercise the real Apply action + permit + projector with cached engine output.
(async()=>{
 for(const source of ['standalone','workspace'])for(const language of ['en','es']){
  const events=[],permitModule=load('lib/price-meter-apply-permit.ts');const action={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/price-meter-apply-action.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:action,exports:action.exports,require(k){
   if(k==='@/lib/price-meter-authorization')return {async authorizePriceMeterIntelligenceExecution(){events.push('authority')}};
   if(k==='@/lib/explorer-options-engine')return {async getExplorerOptions(){events.push('options');return {property_type:[{slug:'house',term_name:'House'}]}}};
   if(k==='./price-meter-selected-engine')return {async getSelectedPriceMeterAnalysis(filters,lang,permit){permitModule.consumePriceMeterApplyPermit(permit,filters,lang);events.push('engine');return project(fixture,'sale')}};
   if(k==='./price-meter-selected-contract')return load('lib/price-meter-selected-contract');if(k.startsWith('@/'))return load(k.slice(2));throw Error('Forbidden action dependency '+k);
  }});
  const result=await action.exports.executePriceMeterApply({province:'3',canton:'304',property_type:'house',transaction_type:'sale'},language,source,['distribution']);
  ok(JSON.stringify(result)===JSON.stringify(project(fixture,'sale')),'actual action projects cached internal result');
  ok(events.join(',')==='authority,engine','existing action sequencing preserved');
 }
 console.log('S9 BROWSER RESULT TOTAL',checks,'checks passed including actual Apply/projector boundary.');
})().catch(e=>{console.error(e);process.exitCode=1});
