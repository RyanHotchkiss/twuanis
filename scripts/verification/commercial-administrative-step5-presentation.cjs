'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');const root=path.resolve(__dirname,'../..');let checks=0;
function load(file,mocks={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,process:{env:{}},require:k=>k==='server-only'?{}:mocks[k]??(()=>{throw Error('unexpected dependency '+k)})(),console});return m.exports}
const api=load('lib/addon-placement-server.ts'),id=n=>'05000000-0000-4000-8000-'+String(n).padStart(12,'0');let calls=[],rows=[],terms=[{id:1001}],error=null;
const db={from(table){assert.equal(table,'ontology_terms');const q={select(){return q},eq(){return q},async limit(n){assert.equal(n,2);calls.push('term');return {data:terms,error}}};return q},async rpc(name,args){calls.push(args);assert.equal(name,'read_addon_placement');return{data:rows.filter(r=>args.p_ids.includes(r.listingId)),error}}};
function ok(v,msg){assert.ok(v,msg);checks++}
(async()=>{
 ok(!api.canonicalAddonPlacementEnabled(),'dormant default');
 let result=await api.resolveAddonPlacement(db,[],'buy');ok(!result.orderedIds.length&&!calls.length,'empty zero queries');
 const ids=Array.from({length:1025},(_,i)=>id(i));rows=[{listingId:ids[2],behavior:'province_contextual_priority',activatedAt:'2026-01-02'},{listingId:ids[2],behavior:'priority_over_organic',activatedAt:'2026-01-01'},{listingId:ids[4],behavior:'priority_over_organic',activatedAt:'2026-01-02'},{listingId:ids[3],behavior:'property_type_contextual_priority',activatedAt:'2026-01-03'},{listingId:ids[1],behavior:'featured_collection',activatedAt:'2026-01-04'}];
 result=await api.resolveAddonPlacement(db,ids,'buy','Cartago');ok(calls.filter(x=>x.p_ids).length===3,'ceil(n/512) queries');ok(calls.filter(x=>x.p_ids).every(x=>x.p_ids.length<=512),'bounded IDs');ok(result.orderedIds.slice(0,3).join()=== [ids[3],ids[2],ids[4]].join(),'equal strength max activation then ID');ok(result.orderedIds.slice(3).join()===ids.filter(x=>![ids[3],ids[2],ids[4]].includes(x)).join(),'organic relative order unchanged');ok(result.featuredIds.join()===ids[1],'featured separate');ok(new Set(result.orderedIds).size===ids.length,'no population change');
 calls=[];rows=[];await api.resolveAddonPlacement(db,[ids[0]],'swipe-buy','IGNORED','IGNORED');ok(calls.length===1&&calls[0].p_province===null&&calls[0].p_property_type===null,'swipe no context lookup');
 calls=[];await assert.rejects(()=>api.resolveAddonPlacement(db,[ids[0],ids[0]],'buy'));ok(calls.length===0,'duplicates fail before queries');
 calls=[];await assert.rejects(()=>api.resolveAddonPlacement(db,['bad'],'buy'));ok(calls.length===0,'malformed fail before queries');
 terms=[];await assert.rejects(()=>api.resolveAddonPlacement(db,[ids[0]],'buy','missing'));checks++;
 terms=[{id:1},{id:2}];await assert.rejects(()=>api.resolveAddonPlacement(db,[ids[0]],'buy','ambiguous'));checks++;
 terms=[{id:1}];error={message:'private'};await assert.rejects(()=>api.resolveAddonPlacement(db,[ids[0]],'buy'));checks++;
 console.log(JSON.stringify({status:'PASS',checks,scope:'actual server placement module, fake bounded transport; no analytics/storage/payment calls'}));
})().catch(e=>{console.error(e);process.exitCode=1});
