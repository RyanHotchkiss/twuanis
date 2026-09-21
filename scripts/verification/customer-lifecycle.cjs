const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),{webcrypto}=require('node:crypto');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let count=0;function ok(x,msg){assert.ok(x,msg);count++;console.log('PASS',msg)}
const stored=new Map(),m={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/app/utils/canonicalCustomerLifecycle.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,crypto:webcrypto,window:{localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)}}});
let row,authError,writeError,lost=false;const calls=[],filters=[];let updates=0;
const db={auth:{getUser:async()=>({data:{user:{id:'owner'}},error:authError})},from(){let write=false;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},is(k,v){filters.push([k,v]);return q},update(){write=true;updates++;return q},single:async()=>({data:row,error:write?writeError:null})};return q},rpc:async(n,a)=>{calls.push({n,a});if(lost)throw Error('lost response');return {data:{listing_id:row.id},error:writeError}}};
const run=e=>m.exports.changeCustomerListingLifecycle(db,'listing',e),reset=()=>{row={id:'listing',owner_id:'owner',canonical_domain_version:1,canonical_revision:'9007199254740993'};authError=null;writeError=null;stored.clear();calls.length=0;filters.length=0;updates=0};
(async()=>{
 for(const event of ['unpublish','archive','restore','delete']){reset();await run(event);ok(calls[0].n==='mutate_customer_canonical_listing'&&calls[0].a.p_domains.lifecycle.event===event,'canonical event '+event);ok(!updates&&calls[0].a.p_expected==='9007199254740993','no direct DML and lossless revision '+event)}
 reset();lost=true;await assert.rejects(run('archive'));lost=false;row.canonical_revision='9007199254740994';await run('archive');ok(calls[0].a.p_request===calls[1].a.p_request&&calls[0].a.p_expected===calls[1].a.p_expected,'lost-response retry retains original identity/revision');ok(stored.size===0,'success clears pending attempt');
 for(const version of [undefined,'1',0,2]){reset();row.canonical_domain_version=version;await assert.rejects(run('archive'));ok(!updates&&!calls.length,'unknown canonical discriminator blocked '+version)}
 reset();row.owner_id='other';await assert.rejects(run('delete'));ok(!updates&&!calls.length,'wrong owner denied');
 reset();authError=Error('auth');await assert.rejects(run('delete'));ok(!updates&&!calls.length,'authentication failure denied');
 reset();row.canonical_domain_version=null;await assert.rejects(run('archive'));ok(!updates&&!calls.length,'legacy lifecycle retired before mutation');
 reset();writeError={message:'stale'};await assert.rejects(run('archive'));ok(stored.size===1,'uncertain/error outcome retains retry identity');
 reset();await assert.rejects(run('publish'));ok(!calls.length&&!updates,'publication cannot bypass duration boundary');
 const s=fs.readFileSync(root+'/app/utils/manageListing.ts','utf8');ok(['unpublish','archive','restore','delete'].every(e=>s.includes("changeCustomerListingLifecycle(supabase, listingId, '"+e+"')"))&&!s.includes('.update('),'all four active caller paths integrated');
 console.log('LIFECYCLE OFFLINE ASSERTIONS',count)
})().catch(e=>{console.error(e);process.exitCode=1});
