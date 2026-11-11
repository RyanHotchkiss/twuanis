'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),crypto=require('crypto');
const root=require('path').resolve(__dirname,'../..');let n=0,owner=null,denied=false,quota=[],uploaded=[],calls=[],exists=false,uncertain=false;
const actor=crypto.randomUUID(),listing=crypto.randomUUID(),request=crypto.randomUUID(),operation=crypto.randomUUID();
const path=()=>owner?`${owner}/${listing}/upload-${operation}.jpg`:`system/listings/${listing}/upload-${operation}.jpg`;
const db={rpc:async(name,args)=>{calls.push([name,args]);if(name==='admin_prepare_media')return {data:{actor_id:actor,listing_id:listing,path:path(),owner_id:owner,completed:false}};return {data:{ok:true}}}};
const bucket={info:async()=>uncertain?{error:{statusCode:503}}:exists?{data:{size:4,contentType:'image/jpeg'}}:{error:{statusCode:'400',code:'not_found'}},upload:async(...args)=>{uploaded.push(args);return {data:{}}}};
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/app/admin/media-actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,File,FormData,Uint8Array,require(k){if(k==='@/lib/administrative-control')return {assertAdministrativePermission:async p=>{assert.equal(p,'listings.manage');if(denied)throw Error('denied');return {actorId:actor}}};if(k==='@/lib/supabase-server')return {createServerSupabaseClient:async()=>db};if(k==='@/lib/supabase-admin')return {supabaseAdmin:{storage:{from:b=>{assert.equal(b,'listings-images');return bucket}}}};if(k==='@/lib/package-usage')return {resolveUserPackageUsage:async args=>{quota.push(args.userId);return {storageLimitBytes:10,storageUsedBytes:0}}};throw Error(k)}});
const form=(bytes=[255,216,255,1],type='image/jpeg')=>{const f=new FormData();f.set('request',request);f.set('listing',listing);f.set('file',new File([new Uint8Array(bytes)],'fixture.jpg',{type}));return f};
function ok(v,label){assert.ok(v,label);n++}
(async()=>{
 for(const managedOwner of [crypto.randomUUID(),null]){owner=managedOwner;quota=[];uploaded=[];calls=[];exists=false;uncertain=false;
  ok((await m.exports.adminUpload(form())).ok,'upload succeeds');ok(uploaded.length===1,'one upload');ok(uploaded[0][0]===path(),'exact namespace');ok(uploaded[0][2].upsert===false,'no overwrite');ok(calls.filter(c=>c[0]==='admin_attach_media').length===1,'one attach');
  ok(owner?quota.length===1&&quota[0]===owner:quota.length===0,'selected customer only quota / no system quota');
  exists=true;uploaded=[];quota=[];ok((await m.exports.adminUpload(form())).ok,'existing file retry');ok(uploaded.length===0,'retry no new upload');ok(quota.length===0,'retry no duplicate quota acquisition');
 }
 calls=[];uploaded=[];denied=true;ok(!(await m.exports.adminUpload(form())).ok,'unauthorized denied');ok(calls.length===0&&uploaded.length===0,'unauthorized zero work');denied=false;
 ok(!(await m.exports.adminUpload(form([1,2,3,4]))).ok,'nonJPEG bytes denied');ok(!(await m.exports.adminUpload(form([255,216,255,1],'image/png'))).ok,'unoptimized type denied');
 uncertain=true;calls=[];uploaded=[];ok(!(await m.exports.adminUpload(form())).ok,'uncertain storage fails closed');ok(uploaded.length===0&&!calls.some(c=>c[0]==='admin_attach_media'),'uncertain state no destructive or attachment action');
 console.log('PASS Step 3 actual media adapter offline:',n,'assertions; no network/storage activity.');
})().catch(e=>{console.error(e);process.exitCode=1});
