const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='/Users/cassidydaddy/twuanis',ts=require(root+'/node_modules/typescript');
const source=ts.transpileModule(fs.readFileSync(root+'/app/api/reorder-listing-images/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{let count=0;
for(const mode of ['ok','noauth','wrongowner','deleted','missing','added','multiplicity','limit','stale','rpcerror','empty']){
 let called=0;const prior=mode==='empty'?null:'["a","a","b"]';
 const admin={from(t){assert.equal(t,'listings');const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{id:'listing',owner_id:mode==='wrongowner'?'other':'owner',listing_status:mode==='deleted'?'deleted':'draft',images:prior},error:null}}};return q},async rpc(name,args){called++;assert.equal(name,'reorder_listing_images');assert.equal(args.p_owner,'owner');assert.equal(args.p_listing,'listing');assert.equal(args.p_prior,prior);return {data:mode==='stale'?null:{id:'listing',images:JSON.stringify(args.p_images)},error:mode==='rpcerror'?{message:'fixture failure'}:null}}};
 const m={exports:{}};vm.runInNewContext(source,{module:m,exports:m.exports,process:{env:{}},console:{error(){}},require(n){if(n==='next/server')return {NextResponse:{json:(body,o)=>({body,status:o?.status||200})}};if(n==='@supabase/supabase-js')return {createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})}})};if(n==='@/lib/supabase-admin')return {supabaseAdmin:admin};throw Error(n)}});
 const images=mode==='missing'?['a','b']:mode==='added'?['a','a','b','c']:mode==='multiplicity'?['a','b','b']:mode==='limit'?Array(26).fill('a'):mode==='empty'?[]:['b','a','a'];
 const r=await m.exports.POST({headers:{get:()=>mode==='noauth'?null:'Bearer valid'},json:async()=>({listingId:'listing',images,owner:'forged'})});
 const expected=mode==='noauth'?401:mode==='wrongowner'?403:['deleted','missing','added','multiplicity','limit'].includes(mode)?409:['stale','rpcerror'].includes(mode)?500:200;
 assert.equal(r.status,expected,mode);assert.equal(called,expected===200||expected===500?1:0,mode);if(expected===200){assert.deepEqual(Array.from(r.body.images),images);assert.equal(r.body.imageCount,images.length)}count++;
}
console.log('PASS '+count+' offline real-route cases; direct mutation unavailable in mock; no network');})().catch(e=>{console.error(e);process.exitCode=1});
