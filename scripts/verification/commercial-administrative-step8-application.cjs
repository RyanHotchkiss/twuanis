'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),root=path.resolve(__dirname,'../..');let checks=0;
const ok=(v,m)=>{assert(v,m);checks++};
function load(file,mocks){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require:n=>{if(!(n in mocks))throw Error('unexpected import '+n);return mocks[n]}});return mod.exports}
(async()=>{let allowed=false,calls=[],failure=false;
const actions=load('app/admin/order-actions.ts',{'@/lib/administrative-control':{assertAdministrativePermission:async p=>{ok(p==='orders.read','existing permission only');if(!allowed)throw Error('denied')}},'@/lib/supabase-server':{createServerSupabaseClient:async()=>({rpc:async(name,args)=>{calls.push({name,args});return failure?{error:{}}:{data:[],error:null}}})}});
ok(!(await actions.readOrders()).ok&&calls.length===0,'unauthorized zero database reads');allowed=true;
ok((await actions.readOrders()).ok&&calls.length===1,'one bounded RPC');ok(calls[0].name==='admin_order_read','exact read authority');
ok(!(await actions.readOrders({account:'bad'})).ok&&calls.length===1,'malformed account zero RPC');ok(!(await actions.readOrders({price:'1'})).ok&&calls.length===1,'unexpected input rejected');
const id='07000000-0000-0000-0000-000000000001';await actions.readOrders({id});ok(calls.at(-1).args.p_id===id&&calls.at(-1).args.p_account===null,'detail explicit identity');failure=true;ok(!(await actions.readOrders()).ok,'query failure explicit unavailable');
const legacy=load('lib/purchase-engine.ts',{});await assert.rejects(()=>legacy.createPurchaseRequest({}));checks++;
const source=fs.readFileSync(root+'/app/admin/AdminOrders.tsx','utf8');ok(!/setInterval|supabase-admin|purchase-engine|changeOrder/.test(source),'read-only client no polling/private writer');ok(source.includes('sequence.current'),'stale response guard');
const sql=fs.readFileSync(root+'/supabase/migrations/039_order_commercial_terms.sql','utf8');ok(!/GRANT.*create_offer_order_snapshot/i.test(sql),'creation remains dormant');ok(!/CREATE TABLE/i.test(sql),'no second Order table');ok(sql.includes('LIMIT 26'),'bounded database pagination');
const hub=fs.readFileSync(root+'/app/admin/AdminHub.tsx','utf8');ok(hub.includes("authority.permissions.includes('orders.read')?<AdminOrders"),'workspace permission gate');
console.log(JSON.stringify({status:'PASS',checks,scope:'actual server action offline; no production'}));})().catch(e=>{console.error(e);process.exitCode=1});
