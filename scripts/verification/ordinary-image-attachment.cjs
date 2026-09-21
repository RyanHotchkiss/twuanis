const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
const source=fs.readFileSync(root+'/app/api/update-listing-image/route.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
async function run(mode,owner='owner',state='active') {
 const row={id:'listing',owner_id:owner,images:[],listing_status:state,publication_expires_at:'2030-01-01',canonical_revision:5};
 const files=new Set(),writes=[],deletes=[];let uploadCount=0;
 const admin={from(table){assert.equal(table,'listings');let patch;const q={select(){return q},eq(){return q},neq(){return q},update(value){patch=value;writes.push(value);return q},async maybeSingle(){
  if(!patch)return {data:{...row},error:null};
  if(mode==='reject')return {data:null,error:{code:'23514'}};
  if(mode==='zero')return {data:null,error:null};
  if(mode==='unknown')return {data:null,error:{code:'PGRST116'}};
  if(mode==='transport')return {data:null,error:{message:'fetch failed'}};
  Object.assign(row,patch);
  if(mode==='lost')throw Error('response lost after commit');
  return {data:{...row},error:null};
 }};return q},storage:{from(bucket){assert.equal(bucket,'listings-images');return {async upload(p){uploadCount++;files.add(p);return {error:null}},async remove(paths){deletes.push(...paths);paths.forEach(p=>files.delete(p));return {error:null}}}}}};
 class ImageFile {constructor(){this.type='image/jpeg';this.size=4}async arrayBuffer(){return new Uint8Array([255,216,255,217]).buffer}}
 const m={exports:{}};
 vm.runInNewContext(compiled,{module:m,exports:m.exports,File:ImageFile,Uint8Array,Date,crypto:{randomUUID:()=> 'new-image'},process:{env:{}},console:{error(){}},require(name){
  if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status||200})}};
  if(name==='@supabase/supabase-js')return {createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})}})};
  if(name==='@/lib/supabase-admin')return {supabaseAdmin:admin};
  if(name==='@/lib/package-usage')return {resolveUserPackageUsage:async()=>({storageUsedBytes:0,storageLimitBytes:10000})};
  throw Error('unexpected dependency '+name);
 }});
 const result=await m.exports.POST({headers:{get:()=> 'Bearer verified'},formData:async()=>({get:key=>key==='listingId'?'listing':key==='image'?new ImageFile(): 'CONFIRMED'})});
 assert.equal(row.listing_status,state);assert.equal(row.publication_expires_at,'2030-01-01');assert.equal(row.canonical_revision,5);
 for(const patch of writes)assert.deepEqual(Object.keys(patch).sort(),['images','updated_at']);
 return {result,row,files,deletes,uploadCount};
}
(async()=>{
 let cases=0;
 for(const mode of ['success','reject','zero','unknown','transport','lost']){
  for(const state of ['active','draft','archived']){
   const r=await run(mode,'owner',state);
   if(mode==='success'){assert.equal(r.result.body.success,true);assert.equal(r.files.size,1)}
   else if(['reject','zero'].includes(mode)){assert.equal(r.result.status,500);assert.equal(r.files.size,0);assert.equal(r.deletes.length,1)}
   else {assert.equal(r.result.status,202);assert.equal(r.result.body.status,'ATTACHMENT_UNCONFIRMED');assert.equal(r.result.body.success,false);assert.equal(r.result.body.error,undefined);assert.equal(r.result.body.path,'owner/listing/new-image.jpg');assert.equal(r.files.size,1);assert.equal(r.deletes.length,0)}
   if(mode==='lost')assert.equal(r.row.images[0],'owner/listing/new-image.jpg');
   cases++;
  }
 }
 for(const [owner,state] of [['foreign','active'],['owner','deleted']]){const r=await run('success',owner,state);assert.equal(r.uploadCount,0);assert.equal(r.result.body.success,false);cases++}
 console.log('PASS '+cases+' offline ordinary-image cases; lifecycle/deadline/revision unchanged; only images/updated_at written; no real network/database/storage');
})().catch(error=>{console.error(error);process.exitCode=1});
