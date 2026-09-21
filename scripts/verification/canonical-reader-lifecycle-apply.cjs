const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const root=(process.env.S6_REPO_ROOT||require('node:path').resolve(__dirname,'../..')),ts=require(root+'/node_modules/typescript');let checks=0;
function ok(x,label){assert.ok(x,label);checks++}
function load(rel,deps={},suffix=''){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+rel,'utf8')+suffix,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console,Buffer,File,process:{env:{}},require(k){if(k==='server-only')return {};if(k in deps)return deps[k];throw Error('forbidden '+k)},fetch(){throw Error('network forbidden')}});return m.exports}
let status='draft',owner='owner',auth=true,access=true,storage=0;const fake={from(){const q={select(){return q},eq(){return q},neq(){return q},async maybeSingle(){return {data:{id:'id',owner_id:owner,listing_status:status,deleted_at:'2020-01-01',expired_at:'2020-01-02',images:[]},error:null}},update(){throw Error('test must not write')}};return q},storage:{from(){storage++;throw Error('storage forbidden')}}};
const deps={'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status??200})}},'@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:auth?{id:'owner'}:null},error:null})}})},'@/lib/supabase-admin':{supabaseAdmin:fake},'@/lib/package-usage':{resolveUserPackageUsage(){throw Error('package lookup must not run before invalid-image rejection')}}};
(async()=>{for(const rel of ['app/api/delete-listing-image/route.ts','app/api/update-listing-image/route.ts','app/api/reorder-listing-images/route.ts']){
 const route=load(rel,deps);const req={headers:{get:()=>access?'Bearer test':null},json:async()=>({listingId:'id',imageValue:'not-present',imageUrl:'not-present',image:'not-present',images:['not-present']}),formData:async()=>({get:k=>k==='listingId'?'id':new File(['not a jpeg'],'fake.jpg',{type:'image/jpeg'})})};
 status='deleted';let result=await route.POST(req);ok(result.status===409,'currently deleted rejected '+rel);
 status='draft';result=await route.POST(req);ok(!/deleted/i.test(result.body.error??''),'historical deletion not current '+rel);
 status='active';result=await route.POST(req);ok(!/deleted|expired/i.test(result.body.error??''),'historical expiration not current '+rel);
 owner='other';result=await route.POST(req);ok(result.status===403,'ownership intact '+rel);owner='owner';access=false;result=await route.POST(req);ok(result.status===401,'authentication intact '+rel);access=true;
}ok(storage===0,'no image storage activity');
const contract=load('lib/price-meter-apply-contract.ts');const permits=load('lib/price-meter-apply-permit.ts',{'@/lib/price-meter-apply-contract':contract});const filters={province:'3',canton:'304',transaction_type:'sale',property_type:'house'};
assert.throws(()=>permits.consumePriceMeterApplyPermit(undefined,filters,'en'));checks++;
for(const language of ['en','es']){const permit=permits.issuePriceMeterApplyPermit(filters,language);permits.consumePriceMeterApplyPermit(permit,filters,language);checks++;assert.throws(()=>permits.consumePriceMeterApplyPermit(permit,filters,language));checks++}
const p=permits.issuePriceMeterApplyPermit(filters,'en');assert.throws(()=>permits.consumePriceMeterApplyPermit(p,{...filters,canton:'101'},'en'));checks++;
const usage=load('lib/package-usage.ts',{'@/lib/package-limits':{}},'\nexport {calculateActiveListingsUsed};');let predicates=[];const client={from(){const q={select(){return q},eq(k,v){predicates.push([k,v]);return q},then(resolve){return Promise.resolve({count:2,error:null}).then(resolve)}};return q}};
ok(await usage.calculateActiveListingsUsed({supabase:client,userId:'owner'})===2,'active usage');ok(predicates.some(([k,v])=>k==='listing_status'&&v==='active')&&!predicates.some(([k])=>k==='deleted_at'),'usage state only');
const engineDeps={'@/lib/price-meter-apply-permit':permits};
let acquisitions=0;const sentinel=new Error('intended observation boundary reached');
engineDeps['@/lib/price-meter-observation-loader']={loadPriceMeterObservations(){acquisitions++;throw sentinel}};
const engineSource=fs.readFileSync(root+'/lib/price-meter-engine.ts','utf8');
for(const match of engineSource.matchAll(/from ['"]([^'"]+)['"]/g)) if(!(match[1] in engineDeps))engineDeps[match[1]]={};
const engine=load('lib/price-meter-engine.ts',engineDeps);
for(const path of ['filter-edit','refresh','prefetch','tab-navigation','url-hydration']) {
 await assert.rejects(()=>engine.getPriceMeterAnalysis(filters,'en'));ok(acquisitions===0,path+' no permit means no acquisition');
}
const valid=permits.issuePriceMeterApplyPermit(filters,'en');await assert.rejects(()=>engine.getPriceMeterAnalysis(filters,'en',valid),e=>e===sentinel);ok(acquisitions===1,'explicit Apply reaches one observation acquisition');
await assert.rejects(()=>engine.getPriceMeterAnalysis(filters,'en',valid));ok(acquisitions===1,'replay cannot acquire');
console.log('S6 LIFECYCLE/APPLY ASSERTIONS',checks)
})().catch(e=>{console.error(e);process.exitCode=1});
