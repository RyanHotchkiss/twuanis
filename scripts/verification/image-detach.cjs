const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
const owner='20000000-0000-0000-0000-000000000021',listing='10000000-0000-0000-0000-000000000021',id='30000000-0000-0000-0000-000000000021';
function load(file,admin){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console:{error(){}},process:{env:{}},require(n){if(n==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status||200})}};if(n==='@supabase/supabase-js')return {createClient:()=>({auth:{getUser:async()=>({data:{user:{id:owner}},error:null})}})};if(n==='@/lib/supabase-admin')return {supabaseAdmin:admin};throw Error(n)}});return m.exports}
(async()=>{
 let count=0;
 for(const mode of ['success','known-failure','uncertain','confirmation-lost','external','detach-lost','substitution']){
  let removes=0,confirms=0,detached=false;
  const op={id,owner_id:owner,listing_id:listing,image_value:`${owner}/${listing}/a.jpg`,managed:true,cleanup_completed:false,images:['newer.jpg'],imageCount:1};
  if(mode==='external'){op.managed=false;op.cleanup_completed=true;op.image_value='https://source.test/x.jpg'}
  const admin={from(){throw Error('direct table write forbidden')},async rpc(name,args){if(name==='confirm_image_cleanup'){confirms++;return {error:mode==='confirmation-lost'?{message:'lost'}:null}};assert.ok(['detach_listing_image','get_image_detach_operation'].includes(name));assert.equal(args.p_owner,owner);if(mode==='detach-lost')return {error:{message:'lost'}};detached=true;return {data:op,error:null}},storage:{from(){return {async remove(paths){assert.ok(detached);assert.deepEqual(Array.from(paths),[op.image_value]);removes++;if(mode==='uncertain')throw Error('deleted but lost response');return {error:mode==='known-failure'?{message:'failed'}:null}}}}}};
  const route=load('app/api/delete-listing-image/route.ts',admin);
  const body=mode==='substitution'?{operationId:id,listingId:'another',imageValue:'foreign'}:{listingId:listing,imageValue:op.image_value,cleanup_completed:true};
  const r=await route.POST({headers:{get:()=> 'Bearer valid'},json:async()=>body});
  if(['known-failure','uncertain','confirmation-lost'].includes(mode)){assert.equal(r.body.success,true);assert.equal(r.body.storageCleanupPending,true);assert.equal(r.body.deletedStorageObject,false);assert.equal(r.body.status,'STORAGE_CLEANUP_UNCONFIRMED')}
  else if(mode==='success'){assert.equal(r.body.deletedStorageObject,true);assert.equal(confirms,1)}
  else if(mode==='external'){assert.equal(removes,0);assert.equal(r.body.storageCleanup,'NOT_APPLICABLE')}
  else {assert.equal(r.body.success,false);assert.equal(removes,0)}
  count++;
 }
 // Execute actual reorder route against a changed image snapshot. The stale update must match nothing.
 for(const stale of [false,true]){
  let checked=false;
  const old=JSON.stringify(['a','b']),current=stale?JSON.stringify(['b','new']):old;
  const admin={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{id:listing,owner_id:owner,listing_status:'active',images:old},error:null}}};return q},async rpc(name,args){assert.equal(name,'reorder_listing_images');assert.equal(args.p_owner,owner);assert.equal(args.p_listing,listing);assert.equal(args.p_prior,old);checked=true;return {data:current===old?{id:listing,images:args.p_images}:null,error:null}}};
  const route=load('app/api/reorder-listing-images/route.ts',admin);
  const r=await route.POST({headers:{get:()=> 'Bearer valid'},json:async()=>({listingId:listing,images:['b','a']})});assert.ok(checked);assert.equal(r.body.success,!stale);count++;
 }
 console.log('PASS '+count+' image-delete/reorder offline cases; no real storage/database');
})().catch(e=>{console.error(e);process.exitCode=1});
