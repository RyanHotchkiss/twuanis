const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let checks=0;
const ok=(v,l)=>{assert.ok(v,l);checks++;console.log('PASS',l)};
function load(file,deps){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,process:{env:{}},console,require(k){if(k==='server-only')return {};if(k in deps)return deps[k];throw Error('unexpected dependency '+k)},fetch(){throw Error('network forbidden')}});return m.exports}
async function scenario(mode){let copies=[],attached=0,prepared=0,usage=0;let objects=new Set(),done=false;
 const plan={listing_id:'new',completed:false,media:[{source:'owner/old/a.jpg',destination:'owner/new/a.jpg'},{source:'owner/old/b.jpg',destination:'owner/new/b.jpg'}]};
 const customer={rpc:async()=>{prepared++;if(mode==='prepare-error')return {error:{message:'denied'}};return {data:{...plan,completed:done}}}};
 const admin={storage:{from:()=>({info:async(p)=>{if(mode==='uncertain-info')return {error:{statusCode:'500'}};if(p.includes('/old/'))return mode==='source-missing'?{error:{statusCode:'404'}}:{data:{size:10}};return objects.has(p)?{data:{size:10}}:{error:{statusCode:'404'}}},copy:async(s,d)=>{copies.push(d);if(mode==='copy-fail'&&copies.length===2)return {error:{message:'failed'}};objects.add(d);if(mode==='copy-uncertain'&&copies.length===1)throw Error('lost copy response');return {data:{path:d}}}})},rpc:async()=>{attached++;if(mode==='attach-error'&&attached===1)return {error:{message:'rejected'}};done=true;if(mode==='attach-uncertain'&&attached===1)throw Error('lost attachment response');return {data:{completed:true}}}};
 const helper=load('lib/duplicate-listing-media.ts',{'@/lib/package-usage':{resolveUserPackageUsage:async()=>{usage++;if(mode==='usage-error')throw Error('unknown allowance');return {storageUsedBytes:objects.size*10,storageLimitBytes:mode==='limit'?5:100}}}});
 if(mode==='foreign'){plan.media[0].source='other/old/a.jpg'}
 let first;try{first=await helper.completeDuplicateMedia(admin,customer,'owner','old','request')}catch(e){first={error:e.message}}
 const count=copies.length;
 let second;if(['copy-fail','copy-uncertain','attach-error','attach-uncertain'].includes(mode))second=await helper.completeDuplicateMedia(admin,customer,'owner','old','request');
 return {first,second,copies,count,objects,attached,prepared,usage};
}
(async()=>{
 let r=await scenario('success');ok(r.first.mediaStatus==='complete'&&r.first.id==='new','success returns new draft');ok(r.copies.length===2&&r.attached===1,'copies independently then attaches');
 for(const mode of ['copy-fail','copy-uncertain','attach-error','attach-uncertain']){r=await scenario(mode);ok(r.first.id==='new'&&r.first.mediaStatus==='incomplete'&&r.first.warning,mode+' retains identity and warning');ok(r.second.id==='new'&&r.second.mediaStatus==='complete',mode+' retry completes same identity');ok(r.objects.size===2,mode+' keeps independent copied files');ok(r.copies.filter(p=>p.endsWith('a.jpg')).length===1,mode+' never recopies successful or uncertain successful object');}
 for(const mode of ['uncertain-info','source-missing','usage-error','limit','foreign']){r=await scenario(mode);ok(r.first.mediaStatus==='incomplete'&&r.first.id==='new',mode+' explicit incomplete');ok(!r.copies.length&&!r.attached,mode+' fails before copy/attachment')}
 r=await scenario('prepare-error');ok(r.first.error==='denied'&&!r.copies.length,'creation denial no storage access');
 // Actual route authority boundary: client authority fields never reach helper.
 const calls=[];const route=load('app/api/duplicate-listing/route.ts',{'next/server':{NextResponse:{json:(body,o)=>({body,status:o?.status||200})}},'@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'verified-owner'}}})}})},'@/lib/supabase-admin':{supabaseAdmin:{}},'@/lib/duplicate-listing-media':{completeDuplicateMedia:async(...args)=>{calls.push(args);return {id:'new',mediaStatus:'incomplete',warning:'incomplete'}}}});
 let response=await route.POST({headers:{get:()=>null}});ok(response.status===401&&!calls.length,'route rejects anonymous');
 response=await route.POST({headers:{get:()=> 'Bearer t'},json:async()=>({listingId:'bad',requestId:'bad'})});ok(response.status===400&&!calls.length,'route validates IDs');
 response=await route.POST({headers:{get:()=> 'Bearer t'},json:async()=>({listingId:'07000000-0000-0000-0000-000000001301',requestId:'07000000-0000-0000-0000-000000001302',ownerId:'attacker',rule_set:'attacker',images:['https://external/image']})});ok(response.status===200&&response.body.id==='new'&&response.body.mediaStatus==='incomplete','route communicates created but incomplete');ok(calls.length===1&&calls[0].length===5&&calls[0][2]==='verified-owner','no client owner, rules or media authority');
 // Actual browser helper preserves one request across failures and incomplete responses.
 const saved=new Map(),requests=[];let attempt=0;const m={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/app/utils/manageListing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 module:m,exports:m.exports,require:()=>({}),crypto:{randomUUID:()=> 'stable-request'},window:{localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}},fetch:async(url,o)=>{requests.push(JSON.parse(o.body));attempt++;if(attempt===1)throw Error('lost response');return {ok:true,json:async()=>({success:true,id:'same-draft',mediaStatus:attempt===2?'incomplete':'complete'})}}});
 const input={supabase:{auth:{getUser:async()=>({data:{user:{id:'owner'}}}),getSession:async()=>({data:{session:{access_token:'token'}}})}},listingId:'source'};
 await assert.rejects(m.exports.duplicateListing(input));ok(saved.size===1,'browser retains request after lost response');
 const pending=await m.exports.duplicateListing(input);ok(pending.id==='same-draft'&&saved.size===1,'browser incomplete result preserves retry identity');
 const completed=await m.exports.duplicateListing(input);ok(completed.id==='same-draft'&&saved.size===0,'browser removes retry key only after complete');
 ok(requests.length===3&&requests.every(r=>r.requestId==='stable-request'&&r.listingId==='source'),'all browser retries send same operation');
 console.log('DUPLICATE OFFLINE ASSERTIONS',checks);
})().catch(e=>{console.error(e);process.exitCode=1});
