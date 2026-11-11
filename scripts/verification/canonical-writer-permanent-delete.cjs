const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..');
const ts=require(root+'/node_modules/typescript');let checks=0;
function ok(v,label){assert.ok(v,label);checks++;console.log('PASS',label)}
const source=fs.readFileSync(root+'/app/api/permanently-delete-listing/route.ts','utf8');
async function run(options={}){
 const row={id:'listing',owner_id:'owner',listing_status:'deleted',canonical_domain_version:null,images:['owner/listing/a.jpg','https://external/image.jpg'],...options.row};
 if(options.missing)delete row.canonical_domain_version;
 let present=true;const files=new Set(['owner/listing/a.jpg','owner/listing/orphan.jpg']);const history={events:['event'],facts:['fact'],memberships:['membership']};const original=JSON.stringify({row,history,files:[...files]});
 const calls=[],logs=[],predicates=[];let deletes=0;
 const admin={from(table){assert.equal(table,'listings');let destructive=false;const q={select(cols){if(!destructive)assert.ok(cols.includes('canonical_domain_version'));return q},eq(k,v){if(destructive)predicates.push([k,v]);return q},is(k,v){predicates.push([k,v]);return q},delete(){destructive=true;deletes++;return q},async maybeSingle(){if(!destructive){calls.push('read');return {data:options.notFound?null:{...row},error:options.readError?Error('read'):null}}
 calls.push('db-delete');if(options.raceVersion!==undefined)row.canonical_domain_version=options.raceVersion;if(options.raceRestore)row.listing_status='draft';
 if(options.dbThrow)throw Error('transport unknown');if(options.dbError)return {data:null,error:Error('db')};
 if(row.canonical_domain_version!==null||row.listing_status!=='deleted'||options.zeroRows)return {data:null,error:null};
 assert.ok(predicates.some(([k,v])=>k==='canonical_domain_version'&&v===null));assert.ok(predicates.some(([k,v])=>k==='owner_id'&&v==='owner'));assert.ok(predicates.some(([k,v])=>k==='listing_status'&&v==='deleted'));
 present=false;return {data:{id:row.id},error:null}}};return q},storage:{from(){return {async list(){calls.push('storage-list');if(options.listError)return {error:Error('list')};return {data:[{name:'a.jpg'},{name:'orphan.jpg'}],error:null}},async remove(paths){calls.push('storage-remove');assert.equal(present,false,'database deletion precedes storage');assert.ok(paths.every(p=>p.startsWith('owner/listing/')));if(options.storageThrow)throw Error('storage');if(options.storageError)return {error:Error('storage')};paths.forEach(p=>files.delete(p));return {error:null}}}}}};
 const deps={'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status??200})}},'@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:options.badAuth?null:{id:'owner'}},error:null})}})},'@/lib/supabase-admin':{supabaseAdmin:admin},'@/lib/activity/listings':{async recordListingPermanentlyDeleted(){calls.push('activity');if(options.activityError)throw Error('activity')}}};
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console:{error:(...x)=>logs.push(x)},process:{env:{}},require(k){if(k in deps)return deps[k];throw Error('unexpected dependency '+k)},fetch(){throw Error('network forbidden')}});
 const response=await m.exports.POST({headers:{get:()=>options.noToken?null:'Bearer test'},json:async()=>({listingId:'listing',canonical_domain_version:null,isLegacy:true,...options.input})});
 return {response,calls,logs,present,files,history,row,deletes,unchanged:original===JSON.stringify({row,history,files:[...files]})};
}
(async()=>{
 let r=await run({row:{canonical_domain_version:1}});ok(r.response.status===409,'canonical direct endpoint rejected despite forged client legacy input');ok(r.deletes===0&&!r.calls.some(c=>c.startsWith('storage')),'canonical rejection before any database/storage mutation or storage lookup');ok(r.present&&r.unchanged,'canonical listing, image references/files, evidence/history unchanged in fixture');
 for(const v of [undefined,0,2,'1','null',false,{},[]]){r=await run({row:{canonical_domain_version:v}});ok(r.response.status===409&&r.deletes===0&&r.unchanged,'malformed/unknown classification fails closed '+JSON.stringify(v))}
 r=await run({missing:true});ok(r.response.status===409&&r.deletes===0,'missing field fails closed');
 for(const [o,status] of [[{noToken:true},401],[{badAuth:true},401],[{row:{owner_id:'other'}},403],[{row:{owner_id:null}},403],[{row:{listing_status:'draft'}},409],[{row:{listing_status:'active'}},409],[{notFound:true},404],[{readError:true},500]]){r=await run(o);ok(r.response.status===status&&r.deletes===0&&!r.calls.includes('storage-remove'),'authorization/state/read gate '+JSON.stringify(o))}
 r=await run();ok(r.response.status===200&&r.response.body.success&&!r.present&&r.files.size===0,'eligible legacy deletion and owned-file cleanup');ok(r.calls.indexOf('db-delete')<r.calls.indexOf('storage-remove'),'database-first ordering');ok(r.response.body.deletedStorageObjectCount===2&&!r.response.body.storageCleanupPending,'accurate complete cleanup response');
 for(const o of [{dbError:true},{dbThrow:true},{zeroRows:true},{listError:true}]){r=await run(o);ok(r.response.status===500&&r.present&&r.files.size===2&&!r.calls.includes('storage-remove'),'failure preserves surviving listing files '+JSON.stringify(o))}
 for(const o of [{raceVersion:1},{raceRestore:true}]){r=await run(o);ok(r.response.status===500&&r.present&&r.files.size===2&&!r.calls.includes('storage-remove'),'conditional delete rejects interleaving '+JSON.stringify(o))}
 for(const o of [{storageError:true},{storageThrow:true}]){r=await run(o);ok(!r.present&&r.files.size===2&&r.response.body.success&&r.response.body.storageCleanupPending&&r.response.body.warning,'cleanup failure accurately reports removed database row and residual files '+JSON.stringify(o));ok(r.logs.some(x=>x[1]?.attemptedPaths?.length===2),'cleanup diagnostic retains listing, owner and attempted paths');ok(r.response.body.deletedStorageObjectCount===undefined,'no fabricated deleted-file count on partial/uncertain cleanup')}
 r=await run({activityError:true});ok(r.response.body.success&&!r.present&&r.files.size===0,'activity failure does not misreport successful deletion');
 const ui=fs.readFileSync(root+'/app/components/ListingOperationsCenter.tsx','utf8');ok(/const canPermanentDelete =\s*listing\?\.canonicalDomainVersion === null &&/.test(ui),'shared EN/ES actionable control requires explicit legacy discriminator');
 const mapper=fs.readFileSync(root+'/app/utils/marketHubListing.ts','utf8');ok(mapper.includes('canonicalDomainVersion: listing.canonical_domain_version'),'UI projection preserves null versus missing; no default legacy');
 ok(!source.includes('.rpc('),'temporary legacy deletion does not create canonical events or invoke canonical mutation');
 console.log('S7 PERMANENT DELETE ASSERTIONS',checks);
})().catch(e=>{console.error(e);process.exitCode=1});
