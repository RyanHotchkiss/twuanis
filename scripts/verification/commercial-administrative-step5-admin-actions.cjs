'use strict';
// Actual server actions; mocked auth/transport only. No database or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.STEP5_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
let checks=0,permissions,events,response,transportFailure;
const equal=(a,b,label)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),label);checks++};
function reset(ps){permissions=ps;events=[];response={data:{products:[],createBehaviors:[]},error:null};transportFailure=false}
const m={exports:{}};
const code=ts.transpileModule(fs.readFileSync(root+'/app/admin/addon-actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext('(function(require,module,exports){'+code+'})',{ })(name=>{
 if(name==='@/lib/administrative-control')return {assertAdministrativePermission:async p=>{events.push(['permission',p]);if(!permissions.includes(p))throw Error('denied')}};
 if(name==='@/lib/supabase-server')return {createServerSupabaseClient:async()=>{events.push(['client']);return {rpc:async(n,p)=>{events.push(['rpc',n,p]);if(transportFailure)throw Error('private connection detail');return response}}}};
 throw Error('Unexpected dependency '+name);
},m,m.exports);
const api=m.exports,id='04000000-0000-4000-8000-000000000001';
(async()=>{
 for(const ps of [[],['addons.manage'],['listings.read']]){reset(ps);equal(await api.readAdminAddons(),{ok:false},'read denied');equal(events,[['permission','addons.read']],'no client/RPC before read authority')}
 for(const ps of [[],['addons.read'],['listings.manage']]){reset(ps);equal(await api.changeAdminAddon(id,{operation:'create'}),{ok:false,code:'unavailable'},'mutation denied');equal(events,[['permission','addons.manage']],'no mutation RPC before scope authority')}
 reset(['addons.read']);equal((await api.readAdminAddons('pkg-next')).ok,true,'read permitted');equal(events,[['permission','addons.read'],['client'],['rpc','admin_addon_read',{p_after:'pkg-next'}]],'bounded exact read RPC');
 for(const cursor of ['x'.repeat(151),{},42]){reset(['addons.read']);equal(await api.readAdminAddons(cursor),{ok:false},'malformed cursor rejected');equal(events.length,1,'invalid cursor no transport')}
 for(const data of [null,{products:Array(27).fill({}),createBehaviors:[]},{products:[],createBehaviors:Array(9).fill("x")}]){reset(['addons.read']);response={data,error:null};equal(await api.readAdminAddons(),{ok:false},'invalid read shape fails closed')}
 reset(['addons.read']);response.error={message:'private SQL'};equal(await api.readAdminAddons(),{ok:false},'read error private');
 for(const [rid,command] of [['bad',{}],[id,null],[id,[]],[id,{x:'x'.repeat(16001)}]]){reset(['addons.manage']);equal(await api.changeAdminAddon(rid,command),{ok:false,code:'invalid'},'bounded command validation');equal(events.length,1,'invalid command no transport')}
 reset(['addons.manage']);const command={operation:'create',name_en:'Fixture',question_en:'Fixture?'};response={data:{ok:true,productId:'pkg-server-generated'},error:null};equal(await api.changeAdminAddon(id,command),{ok:true,productId:'pkg-server-generated'},'server generated result returned');equal(events,[['permission','addons.manage'],['client'],['rpc','admin_addon_command',{p_request:id,p_command:command}]],'server maps fixed command RPC');
 for(const [error,expected] of [[{code:'40001',message:'private'},'stale'],[{code:'42501',message:'private'},'rejected']]){reset(['addons.manage']);response={data:null,error};equal(await api.changeAdminAddon(id,{}),{ok:false,code:expected},'safe mutation failure')}
 reset(['addons.manage']);transportFailure=true;equal(await api.changeAdminAddon(id,{}),{ok:false,code:'unavailable'},'uncertain transport result explicit');
 console.log(JSON.stringify({status:'PASS',checks,scope:'real Admin package actions; fake authority/transport; no live I/O'}));
})().catch(e=>{console.error(e);process.exitCode=1});
