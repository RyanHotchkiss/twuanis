'use strict';
// Offline commercial-boundary probe: real route/coordinator/parser/auth; synthetic
// analytical adapters. Existing analytical regression verifies the unchanged math.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),cap='cap-property-price-m2-position';let checks=0;
const eq=(a,b,msg)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),msg);checks++};
function fixture(rights=[cap],mode='canonical'){
 const events=[],cache=new Map();let options=0,positions=0;const contexts=[];
 const base=(key,index=0,phase=7)=>({questionKey:key,index,phase,state:'established',populations:[],metrics:[],groups:[]});
 const adapters={
 'lib/supabase-server':{createServerSupabaseClient:async()=>({auth:{getUser:async()=>{events.push('identity');return{data:{user:{id:'fixture-user'}},error:null}}},rpc:async(name,args)=>{events.push(name==='current_account_has_capability'?args.p_capability:name);return{data:name==='current_account_has_capability'?rights.includes(args.p_capability):true,error:null}}})},
 'lib/price-meter-property-position-execution':{executePropertyPositionWithWorkingEvidence:async()=>{events.push('position');positions++;return{result:{state:'ok'},working:{}}}},
 'lib/price-meter-property-difference-context-adapter':{contextBase:(_,key,i,p)=>base(key,i,p)},
 'lib/price-meter-property-difference-context-acquisition':{
  contextOptions:async()=>{events.push('options');options++;return{}},
  resolveComparisons:async(_,selections)=>({resolved:selections.flatMap((s,i)=>s.questionKey==='characteristic_comparison'?[{index:i,request:s.params}]:[]),invalid:[]}),
  acquireComparisons:async()=>({observations:[],memberships:[],fx:null})},
 'lib/price-meter-property-difference-context-geographic':{geographicContext:(_,i)=>{contexts.push('geographic_children');return base('geographic_children',i)}},
 'lib/price-meter-property-difference-context-size':{sizeContext:(_,key,i)=>{contexts.push(key);return base(key,i,8)}},
 'lib/price-meter-property-difference-context-construction-land':{constructionLandContext:(_,key,i)=>{contexts.push(key);return base(key,i,9)}},
 'lib/price-meter-property-difference-context-characteristic':{characteristicContext:async(_,i)=>{contexts.push('characteristic_comparison');return base('characteristic_comparison',i,10)}},
 'lib/price-meter-property-difference-context-dto':{toDifferenceDTO:x=>x}
 };
 function load(file){if(adapters[file])return adapters[file];if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);
  const allowed=['lib/price-meter-property-difference-context-server','lib/price-meter-property-difference-context-request','lib/price-meter-property-position-request','lib/price-meter-authorization','lib/package-capability-authorization','app/api/price-meter/property-difference-context/route'];assert.ok(allowed.includes(file),'unexpected dependency '+file);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,Response,process:{env:{TWUANIS_PACKAGE_ENFORCEMENT:mode}},require:k=>k==='server-only'?{}:load(k.startsWith('@/')?k.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),k)))});return m.exports;
 }
 return {server:load('lib/price-meter-property-difference-context-server'),route:load('app/api/price-meter/property-difference-context/route'),keys:load('lib/price-meter-property-difference-context-request').CONTEXT_KEYS,events,contexts,get positions(){return positions},get options(){return options}};
}
const positionRequest={listingId:'10000000-0000-4000-8000-000000000001',requestedGeographyLevel:'district',requestedNormalizationBasis:'land'};
const selection=questionKey=>questionKey==='characteristic_comparison'?{questionKey,params:{reference_cohort:'A'}}:{questionKey};
(async()=>{
 const keys=Array.from(fixture().keys);
 for(const selected of [[],...keys.map(k=>[selection(k)]),[selection(keys[0]),selection(keys[1]),selection(keys[3]),selection(keys[5])]]){
  const f=fixture();const result=await f.server.executeDifferenceContext({positionRequest,contexts:selected});
  eq(f.events,['identity',cap,'position'],'one commercial gate precedes position');eq(f.positions,1,'one foundation');eq(f.contexts,selected.map(s=>s.questionKey),'only selected contexts');eq(result.items.length,selected.length,'independent item count');
 }
 for(const related of ['cap-geographic-price-m2-comparison','cap-size-price-m2','cap-construction-land-price-m2','cap-cross-dimensional-analysis','cap-user-defined-cohort-price-m2-comparison'])for(const key of keys){
  const f=fixture([related]);await assert.rejects(()=>f.server.executeDifferenceContext({positionRequest,contexts:[selection(key)]}));checks++;
  eq(f.positions,0,'related right does not grant position');eq(f.contexts,[],'no context computation');eq(f.events,['identity',cap],'legacy grant/Owner cannot bypass missing capability');
 }
 for(const input of [
  {positionRequest,contexts:[{questionKey:'run_arbitrary_engine'}]},
  {positionRequest,contexts:[],capability:'cap-market-summary'},
  {positionRequest,contexts:[{questionKey:'geographic_children',capability:cap}]},
  {positionRequest,contexts:[selection('geographic_children'),selection('geographic_children')]},
  {positionRequest:{...positionRequest,capability:cap},contexts:[]}
 ]){const f=fixture();const r=await f.route.POST({json:async()=>input});eq(r.status,400,'invalid intent rejects');eq(f.positions,0,'invalid no computation');eq(f.contexts,[],'invalid no contexts')}
 for(const allowed of [true,false]){
  const f=fixture(allowed?[cap]:[]);eq((await f.route.GET()).status,allowed?200:403,'options gate');eq(f.options,allowed?1:0,'options acquisition only after authorization');eq(f.events.slice(0,2),['identity',cap],'options exact operation');
  const g=fixture(allowed?[cap]:[]);eq((await g.route.POST({json:async()=>({positionRequest,contexts:[]})})).status,allowed?200:403,'execution route gate');eq(g.positions,allowed?1:0,'route protected computation');
 }
 const legacy=fixture([],'legacy');await legacy.server.executeDifferenceContext({positionRequest,contexts:[]});eq(legacy.events,['identity','current_user_has_entitlement','is_current_user_administrator','position'],'unactivated production compatibility preserved');
 console.log(JSON.stringify({status:'PASS',checks,contexts:keys.length,liveIO:false,analyticalAdapters:'synthetic; actual coordinator/parser/route/auth'}));
})().catch(e=>{console.error(e);process.exitCode=1});
