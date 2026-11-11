'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');let checks=0;
const fixtures=[
 ['cap-market-summary','lib/market-inventory-engine','getMarketSummary',[{}]],
 ['cap-market-composition','lib/market-inventory-engine','getMarketComposition',[{}]],
 ['cap-market-asking-price-distribution','lib/asking-price-engine','executeAskingPrice',[{}]],
 ['cap-property-matching','lib/market-matching-engine','getMarketMatches',[{},'en']],
 ['cap-market-comparison','lib/market-comparison-engine','getMarketComparison',[{},{},'en']],
 ['cap-property-configuration-frequency','lib/market-scarcity-engine','getMarketScarcity',[{},'en']],
 ...[['distribution','cap-price-m2-distribution'],['geography','cap-geographic-price-m2-comparison'],['property-area','cap-size-price-m2'],['construction-land','cap-construction-land-price-m2']].map(([e,c])=>[c,'lib/price-meter-apply-action','executePriceMeterApply',[{},'en','workspace',[e],e==='distribution'?{propertyBasis:'land_only',normalizationBasis:'land'}:undefined]]),
 ['cap-user-defined-cohort-price-m2-comparison','lib/price-meter-cohort-action','executePriceMeterCohortComparison',[{},'en']],
 ['cap-cross-dimensional-analysis','lib/price-meter-cross-dimensional-execution','executeCrossDimensionalRequest',[{json:async()=>({questionKey:'fixture',filters:{transaction_type:'sale'}})}]],
 ['cap-property-price-m2-position','lib/position-hub-action','executePositionHub',[{}]],
 ['cap-comparative-price-m2-discovery','lib/phase14-question-commit','commitPhase14Question',[{}]],
 ['cap-user-defined-comparable-cohort','lib/price-meter-comparable-server','executePriceMeterComparableAnalysis',[{}]],
 ['cap-asking-area-coefficient-ratio','lib/asking-area-ratio-action','executeAskingAreaRatio',[{}]],
 ['cap-weighted-price-m2','lib/weighted-price-action','executeWeightedPrice',[{}]],
];
const membership=JSON.parse(fs.readFileSync(root+'/outputs/commercial-administrative/step1-model.json')).capabilities;
function harness(entry,{mode='canonical',signedIn=true,rights=[],rpcError=false}={}){
 let work=0,lookups=[],identities=0,legacy=0,armed=false;const cache=new Map();
 const stop=()=>{if(armed)work++;throw Error('STOP_AT_ANALYTICAL_BOUNDARY')};
 const db={auth:{getUser:async()=>{identities++;return {data:{user:signedIn?{id:'fixture-account'}:null},error:null}}},rpc:async(name,args)=>{if(name!=='current_account_has_capability'){legacy++;return {data:true,error:null}}lookups.push(args.p_capability);return {data:rights.includes(args.p_capability),error:rpcError?{}:null}}};
 const pure={validatePriceMeterComparableRequest:x=>x,preparePhase14Question:x=>({question:{geography:{level:'province',officialCode:'1'}}}),parsePositionRequest:x=>x,parseRatioQuestion:x=>x,parseWeightedQuestion:x=>x,validatePriceMeterApply:x=>x,validateGeographicApply:x=>x,validateDistributionIdentity:x=>x,validateGeographicCommand:()=>undefined,validateConstructionLandNormalization:()=>undefined};
 const stub=new Proxy({}, {get:(_,name)=>name==='then'?undefined:typeof name==='string'&&name.endsWith('Error')?Error:pure[name]??stop});
 function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);
  const text=fs.readFileSync(root+'/'+file+'.ts','utf8');
  vm.runInNewContext(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console,process:{env:{TWUANIS_PACKAGE_ENFORCEMENT:mode}},require:k=>{
   if(k==='server-only')return{};if(k==='node:crypto')return require(k);
   const f=k.startsWith('@/')?k.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),k));
   if(f==='lib/supabase-server')return{createServerSupabaseClient:async()=>db};
   if(['lib/package-capability-authorization','lib/price-meter-authorization','lib/price-meter-selected-contract'].includes(f))return load(f);
   return stub;
  }});return m.exports;
 }
 const mod=load(entry);armed=true;
 return{mod,get stats(){return{work,lookups,identities,legacy}},load};
}
(async()=>{
 assert.equal(new Set(fixtures.map(f=>f[0])).size,17);checks++;
 for(const [cap,file,fn,args]of fixtures){
  const own=membership.find(c=>c.id===cap).packageId;
  for(const pkg of [...new Set(membership.map(c=>c.packageId))]){
   const h=harness(file,{rights:membership.filter(c=>c.packageId===pkg).map(c=>c.id)});
   try{await h.mod[fn](...args)}catch{}
   assert.deepEqual(h.stats.lookups,[cap],cap+' exact capability');checks++;
   assert.equal(h.stats.legacy,0,'no legacy/Owner fallback');checks++;
   if(pkg===own){assert.ok(h.stats.work>0,cap+' allowed reaches downstream boundary');checks++;}
   if(pkg!==own){assert.equal(h.stats.work,0,cap+' wrong package zero work');checks++;}
  }
  for(const options of [{rights:[]},{signedIn:false},{rights:[cap],rpcError:true}]){
   const h=harness(file,options);try{await h.mod[fn](...args)}catch{}
   assert.equal(h.stats.work,0,cap+' denied zero acquisition/calculation');checks++;
  }
  if(cap!=='cap-property-price-m2-position'){const onlyPosition=harness(file,{rights:['cap-property-price-m2-position']});try{await onlyPosition.mod[fn](...args)}catch{}assert.equal(onlyPosition.stats.work,0,'contained context grants no independent '+cap);assert.deepEqual(onlyPosition.stats.lookups,[cap]);checks+=2;}
  const h=harness('lib/package-capability-authorization',{rights:[cap]});assert.equal(await h.mod.authorizeCanonicalCapability(cap),'fixture-account');checks++;
 }
 const h=harness('lib/package-capability-authorization',{rights:membership.map(c=>c.id)});
 await assert.rejects(()=>h.mod.authorizeCanonicalCapability('cap-invented'));assert.equal(h.stats.lookups.length,0);checks+=2;
 const legacy=harness('lib/price-meter-authorization',{mode:undefined}); // explicit legacy below (default fixture is canonical)
 const old=harness('lib/price-meter-authorization',{mode:'legacy'});await old.mod.authorizePriceMeterIntelligenceExecution('cap-price-m2-distribution');assert.equal(old.stats.legacy,2);assert.equal(old.stats.lookups.length,0);checks+=2;
 const pub=harness('lib/package-capability-authorization',{mode:'legacy'});await pub.mod.authorizePreviouslyPublicCapability('cap-market-summary');assert.equal(pub.stats.identities,0);checks++;
 const bad=harness('lib/package-capability-authorization',{mode:'typo'});assert.throws(()=>bad.mod.canonicalPackageEnforcement());checks++;
 console.log(JSON.stringify({status:'PASS',checks,engines:17,liveIO:false,scope:'real entry modules + real authorization; analytical dependencies stopped, PostgreSQL rights matrix separately verified'}));
})().catch(e=>{console.error(e);process.exitCode=1});
