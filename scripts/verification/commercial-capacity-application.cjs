// Offline application verification. No clients, environment loading, or network.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const root=process.env.S5_REPO_ROOT||path.resolve(__dirname,'../..');
const ts=require(path.join(root,'node_modules/typescript'));
let purchase;const moduleObject={exports:{}};
const context={module:moduleObject,exports:moduleObject.exports,console,Date,Error,Number,Array,fetch(){throw Error('network forbidden')},require(name){assert.equal(name,'@/lib/purchase-engine');return {resolvePurchase:async()=>purchase}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/activation-engine.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
let checks=0;
async function run(product,existing=false,approved=true,rpcError=false){
 purchase={purchase:{id:'purchase',ownerId:'owner',productType:product,isApproved:approved,status:approved?'approved':'pending'}};const calls=[];
 const client={from(table){calls.push(['from',table]);const q={select(){return q},eq(){return q},limit(){return q},async maybeSingle(){return {data:existing?{id:'existing'}:null,error:null}},async insert(data){assert.equal(table,'activity_events','preflight must never write operational state');calls.push(['activity']);return {error:null}}};return q},async rpc(name,args){calls.push(['rpc',name]);assert.equal(name,'activate_purchase');assert.equal(JSON.stringify(args),JSON.stringify({p_purchase_id:'purchase'}));return {data:rpcError?null:[{purchase_id:'purchase',owner_id:'owner',product_type:product,activation_type:product==='package'?'subscription':'listing_entitlement',activation_id:'activation',activated_at:'2026-09-17T00:00:00Z'}],error:rpcError?{message:'injected failure'}:null}}};
 let result,error;try{result=await moduleObject.exports.activatePurchase({supabase:client,purchaseId:'purchase',ownerId:'owner'})}catch(e){error=e}
 if(!approved){assert.equal(error?.code,'PURCHASE_NOT_APPROVED');assert.equal(calls.length,0)}
 else if(existing){assert.equal(error?.code,'PURCHASE_ALREADY_ACTIVATED');assert.equal(calls.filter(c=>c[0]==='rpc').length,0)}
 else if(rpcError){assert.equal(error?.code,'ACTIVATION_TRANSACTION_FAILED');assert.equal(calls.filter(c=>c[0]==='rpc').length,1);assert.equal(calls.filter(c=>c[0]==='activity').length,0)}
 else {if(error)throw error;assert.equal(result.activationId,'activation');assert.equal(calls.filter(c=>c[0]==='rpc').length,1);assert.deepEqual(calls.filter(c=>c[0]==='from').map(c=>c[1]),[product==='package'?'user_subscriptions':'listing_entitlements','activity_events'])}
 checks++;console.log('PASS',product,existing?'duplicate':!approved?'unapproved':rpcError?'RPC failure':'one atomic transition');
}
(async()=>{for(const p of ['package','add_on']){await run(p);await run(p,true);await run(p,false,false);await run(p,false,true,true)}console.log('S5 APPLICATION PASSED:',checks,'cases')})().catch(e=>{console.error(e);process.exitCode=1});
