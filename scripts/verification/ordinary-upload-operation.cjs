const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
function load(file,deps,extra={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require:n=>{if(n==='server-only')return {};if(!(n in deps))throw Error('unexpected import '+n);return deps[n]},console:{error(){}},process:{env:{}},...extra});return m.exports}
const helper=load('lib/ordinary-upload-operation.ts',{});
const owner='20000000-0000-0000-0000-000000000001',listing='10000000-0000-0000-0000-000000000001',id='30000000-0000-0000-0000-000000000001';
async function scenario(mode,state='active'){
 const row={id:listing,owner_id:owner,listing_status:state,images:[],publication_expires_at:'2030',canonical_revision:5};
 let op,uploads=0,prepares=0,attaches=0,infos=0,auths=0,bytes,fail=mode;
 const admin={from(){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:row,error:null})};return q},async rpc(name,args){
  if(name==='prepare_ordinary_upload'){prepares++;op={id,owner_id:owner,listing_id:listing,storage_path:`${owner}/${listing}/upload-${id}.jpg`,byte_size:4,completed:false};return {data:op,error:null}}
  if(name==='get_ordinary_upload')return args.p_owner!==owner?{error:{code:'42501'}}:{data:op,error:null};
  assert.equal(name,'attach_ordinary_upload');attaches++;
  if(fail==='reject')return {error:{code:'23514'}};
  if(fail==='transport')return {error:{message:'lost'}};
  if(fail==='unknown')return {error:{code:'PGRST116'}};
  if(!op.completed){row.images.push(op.storage_path);op.completed=true}
  if(fail==='lost'){fail='success';throw Error('committed response lost')}
  return {data:{success:true,status:'ATTACHMENT_CONFIRMED',operationId:id,path:op.storage_path,images:row.images},error:null};
 },storage:{from(){return {upload:async(p,b)=>{uploads++;assert.equal(p,op.storage_path);bytes=b;return {error:null}},info:async p=>{infos++;assert.equal(p,op.storage_path);return {data:{size:bytes.length},error:null}},remove(){throw Error('destructive cleanup forbidden')}}}}};
 class ImageFile {constructor(){this.type='image/jpeg';this.size=4}async arrayBuffer(){return new Uint8Array([255,216,255,217]).buffer}}
 const route=load('app/api/update-listing-image/route.ts',{'@/lib/ordinary-upload-operation':helper,'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}},'@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>{auths++;return {data:{user:{id:owner}},error:null}}}})},'@/lib/supabase-admin':{supabaseAdmin:admin},'@/lib/package-usage':{resolveUserPackageUsage:async()=>({storageUsedBytes:0,storageLimitBytes:10000})}},{File:ImageFile,Uint8Array});
 const post=fields=>route.POST({headers:{get:()=> 'Bearer user'},formData:async()=>({get:k=>k in fields?fields[k]:null})});
 const first=await post({listingId:listing,image:new ImageFile()});
 assert.equal(prepares,1);assert.equal(uploads,1);
 if(mode==='success')assert.equal(first.body.success,true);
 else if(mode==='reject')assert.equal(first.body.status,'ATTACHMENT_REJECTED');
 else {assert.equal(first.body.status,'ATTACHMENT_UNCONFIRMED');assert.equal(first.body.success,false)}
 fail='success';
 const retry=await post({operationId:id,listingId:listing,path:'foreign/file',completed:true,image:new ImageFile()});
 assert.equal(retry.body.success,true);assert.equal(uploads,1);assert.equal(prepares,1);assert.equal(row.images.length,1);assert.equal(auths,2);
 const again=await post({operationId:id});assert.equal(again.body.success,true);assert.equal(row.images.length,1);assert.equal(uploads,1);
 const rejected=await post({operationId:id,listingId:'other-listing'});assert.equal(rejected.body.status,'ATTACHMENT_REJECTED');
 const foreign=await helper.retryOrdinaryUpload(admin,'other-owner',id);assert.equal(foreign.status,'ATTACHMENT_REJECTED');
 assert.equal(row.listing_status,state);assert.equal(row.publication_expires_at,'2030');assert.equal(row.canonical_revision,5);
}
(async()=>{let count=0;for(const state of ['active','draft','archived'])for(const mode of ['success','reject','transport','unknown','lost']){await scenario(mode,state);count++}console.log('PASS '+count+' ordinary-upload route/helper scenarios, each with repeated retry, substitution and authorization checks; no real network/storage')})().catch(e=>{console.error(e);process.exitCode=1});
