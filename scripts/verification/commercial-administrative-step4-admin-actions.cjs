'use strict';
// Actual server actions; mocked auth/transport only. No database or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.STEP4_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
let checks=0,permissions,events,response,transportFailure;
const equal=(a,b,label)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),label);checks++};
function reset(ps){permissions=ps;events=[];response={data:{packages:[],capabilities:Array(17).fill({})},error:null};transportFailure=false}
const m={exports:{}};
const code=ts.transpileModule(fs.readFileSync(root+'/app/admin/package-actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext('(function(require,module,exports){'+code+'})',{ })(name=>{
 if(name==='@/lib/administrative-control')return {assertAdministrativePermission:async p=>{events.push(['permission',p]);if(!permissions.includes(p))throw Error('denied')}};
 if(name==='@/lib/supabase-server')return {createServerSupabaseClient:async()=>{events.push(['client']);return {rpc:async(n,p)=>{events.push(['rpc',n,p]);if(transportFailure)throw Error('private connection detail');return response}}}};
 throw Error('Unexpected dependency '+name);
},m,m.exports);
const api=m.exports,id='04000000-0000-4000-8000-000000000001';
(async()=>{
 for(const ps of [[],['packages.manage'],['listings.read']]){reset(ps);equal(await api.readAdminPackages(),{ok:false},'read denied');equal(events,[['permission','packages.read']],'no client/RPC before read authority')}
 for(const ps of [[],['packages.read'],['listings.manage']]){reset(ps);equal(await api.changeAdminPackage(id,{operation:'create'}),{ok:false,code:'unavailable'},'mutation denied');equal(events,[['permission','packages.manage']],'no mutation RPC before scope authority')}
 reset(['packages.read']);equal((await api.readAdminPackages('pkg-next')).ok,true,'read permitted');equal(events,[['permission','packages.read'],['client'],['rpc','admin_package_read',{p_after:'pkg-next'}]],'bounded exact read RPC');
 for(const cursor of ['x'.repeat(151),{},42]){reset(['packages.read']);equal(await api.readAdminPackages(cursor),{ok:false},'malformed cursor rejected');equal(events.length,1,'invalid cursor no transport')}
 for(const data of [null,{packages:Array(27).fill({}),capabilities:Array(17).fill({})},{packages:[],capabilities:[]}]){reset(['packages.read']);response={data,error:null};equal(await api.readAdminPackages(),{ok:false},'invalid read shape fails closed')}
 reset(['packages.read']);response.error={message:'private SQL'};equal(await api.readAdminPackages(),{ok:false},'read error private');
 for(const [rid,command] of [['bad',{}],[id,null],[id,[]],[id,{x:'x'.repeat(16001)}]]){reset(['packages.manage']);equal(await api.changeAdminPackage(rid,command),{ok:false,code:'invalid'},'bounded command validation');equal(events.length,1,'invalid command no transport')}
 reset(['packages.manage']);const command={operation:'create',name_en:'Fixture',question_en:'Fixture?'};response={data:{ok:true,packageId:'pkg-server-generated'},error:null};equal(await api.changeAdminPackage(id,command),{ok:true,packageId:'pkg-server-generated'},'server generated result returned');equal(events,[['permission','packages.manage'],['client'],['rpc','admin_package_command',{p_request:id,p_command:command}]],'server maps fixed command RPC');
 for(const [error,expected] of [[{code:'40001',message:'private'},'stale'],[{code:'42501',message:'private'},'rejected']]){reset(['packages.manage']);response={data:null,error};equal(await api.changeAdminPackage(id,{}),{ok:false,code:expected},'safe mutation failure')}
 reset(['packages.manage']);transportFailure=true;equal(await api.changeAdminPackage(id,{}),{ok:false,code:'unavailable'},'uncertain transport result explicit');
 console.log(JSON.stringify({status:'PASS',checks,scope:'real Admin package actions; fake authority/transport; no live I/O'}));
})().catch(e=>{console.error(e);process.exitCode=1});
