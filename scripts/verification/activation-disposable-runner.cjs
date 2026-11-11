'use strict';
// Same runner-owned cluster/VM capability pattern as commercial-disposable-runner.
// Narrow relational transport: actual S2/S5 activation, never HTTP or provider APIs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const providerMode=process.argv[2]==='provider';
const providerName=process.argv[3]||'sinpe';
if(providerMode&&!['sinpe','bank-transfer'].includes(providerName))throw Error('Supported provider: sinpe or bank-transfer');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript'),pg='/opt/homebrew/opt/postgresql@17/bin';
const env={PATH:'/usr/bin:/bin',LC_ALL:'C'},dir=fs.mkdtempSync('/private/tmp/twuanis-activation-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,closed=false,rpcCalls=0;
function call(bin,args,input){return execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
function cleanup(){if(closed)return;if(started||fs.existsSync(data+'/postmaster.pid')){call('pg_ctl',['-D',data,'stop','-m','fast']);started=false}fs.rmSync(dir,{recursive:true});closed=true;console.log('Activation disposable cluster stopped and removed.')}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{try{cleanup()}catch(e){console.error('Cleanup failed',e)}process.exit(1)});
function lit(v){return "'"+String(v).replaceAll("'","''")+"'"}
function ident(v){if(!/^[a-z_][a-z0-9_]*$/.test(v))throw Error('Unsupported identifier');return '"'+v+'"'}
function sql(q){if(!started||closed)throw Error('Disposable transport unavailable');return call('psql',['-X','-qAt','-h',socket,'-p','55446','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1'],q).trim()}
function script(rel){return fs.readFileSync(root+'/'+rel,'utf8')}
const tables=new Set(['listings','packages','package_limits','user_subscriptions','purchase_requests','purchase_request_events','add_on_products','listing_entitlements','promotion_events','sinpe_payments','bank_transfer_payments']);
function client(){return {from(t){if(!tables.has(t))throw Error('Unsupported table '+t);let filters=[],orders=[],limit='',mode='read',values,one=false,required=false,head=false;
 const q={select(_columns,options={}){head=options.head===true;return q},eq(k,v){filters.push(`${ident(k)}=${v===null?'NULL':lit(v)}`);return q},in(k,vs){filters.push(vs.length?`${ident(k)} IN (${vs.map(lit)})`:'false');return q},order(k,o={}){orders.push(ident(k)+(o.ascending===false?' DESC':' ASC'));return q},limit(n){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid limit');limit=' LIMIT '+n;return q},single(){one=true;required=true;return q},maybeSingle(){one=true;return q},insert(v){mode='insert';values=v;return q},update(v){mode='update';values=v;return q},delete(){mode='delete';return q},then(resolve,reject){return Promise.resolve().then(()=>{
 try {let statement;const where=filters.length?' WHERE '+filters.join(' AND '):'';
 if(mode==='insert'){const keys=Object.keys(values);statement=`INSERT INTO public.${ident(t)}(${keys.map(ident)}) SELECT ${keys.map(ident)} FROM jsonb_populate_record(NULL::public.${ident(t)},${lit(JSON.stringify(values))}::jsonb) RETURNING *`}
 else if(mode==='update'){if(!filters.length)throw Error('Unbounded update');statement=`UPDATE public.${ident(t)} SET (${Object.keys(values).map(ident)})=(SELECT ${Object.keys(values).map(ident)} FROM jsonb_populate_record(NULL::public.${ident(t)},${lit(JSON.stringify(values))}::jsonb))${where} RETURNING *`}
 else if(mode==='delete'){if(!filters.length)throw Error('Unbounded delete');statement=`DELETE FROM public.${ident(t)}${where} RETURNING *`}
 else statement=`SELECT * FROM public.${ident(t)}${where}${orders.length?' ORDER BY '+orders.join(','):''}${limit}`;
 const rows=JSON.parse(sql(`WITH r AS (${statement}) SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM r;`));
 if(one&&(rows.length>1||(required&&rows.length!==1)))return {data:null,error:{message:'single cardinality mismatch'}};
 return {data:head?null:one?rows[0]||null:rows,error:null,count:rows.length};
 }catch(e){return {data:null,error:{message:String(e.stderr||e.message)}}}
 }).then(resolve,reject)}};return q},async rpc(name,args){if(name!=='activate_purchase')throw Error('Unsupported RPC');rpcCalls++;try{const result=JSON.parse(sql(`SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM public.activate_purchase(${lit(args.p_purchase_id)}::uuid)x;`));if(result[0]?.product_type==='package'){assert.equal(sql(`SELECT count(*) FROM user_subscriptions WHERE user_id=${lit(userId)} AND package_id=${lit(packageId)} AND status='active';`),'1');assert.equal(sql(`SELECT allowance IS NULL FROM twuanis_canonical_private.publisher_allowance(twuanis_canonical_private.resolve_publisher(${lit(userId)}),${lit(userId)});`),'t')}return {data:result,error:null}}catch(e){return {data:null,error:{message:String(e.stderr||e.message)}}}}}}
const userId=crypto.randomUUID(),listingId=crypto.randomUUID(),packageId=crypto.randomUUID(),oldPackage=crypto.randomUUID(),addOnId=crypto.randomUUID();
const authority={client:client(),userId,listingId,packageId,addOnId};
const allowed=new Set(['scripts/verification/activation-engine.ts','lib/purchase-engine.ts','lib/approval-engine.ts']);if(providerMode)for(const file of ['scripts/verification/commercial-provider.ts','lib/commercial-submission.ts','lib/commercial-provider.ts','lib/commercial-provider-registry.ts','lib/commercial-provider-resolver.ts','lib/providers/sinpe-provider.ts','lib/providers/bank-transfer-provider.ts'])allowed.add(file);
const cache=new Map(),fakeProcess={exitCode:0};
function load(file){if(!allowed.has(file))throw Error('Unsupported import '+file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInNewContext(ts.transpileModule(script(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console,crypto,process:fakeProcess,require(name){if(name==='./provider-disposable-authority')return {disposableProviderContext:()=>({...authority,provider:providerName})};if(name==='./activation-disposable-authority')return {disposableActivationContext:()=>authority};return load(name.startsWith('@/')?name.slice(2)+'.ts':path.posix.normalize(path.posix.join(path.posix.dirname(file),name))+'.ts')}},{filename:file});return m.exports}
async function main(){try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/server.log','-o',`-k ${socket} -p 55446 -c listen_addresses=`,'start']);started=true;call('createdb',['-h',socket,'-p','55446','-U','postgres','cg_s1_verification']);
 assert.equal(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)};`),'t');
 // Reuse DDL prefixes ONLY. No closed assertions or existing fixture scenarios run.
 sql(script('scripts/verification/canonical-foundation.sql').split('-- Simulate broad')[0].replace('\\set ON_ERROR_STOP on',''));
 sql("CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;");
 sql(script('supabase/migrations/004_dormant_canonical_listing_foundation.sql'));
 const s2=script('scripts/verification/publisher-coordination.sql');sql(s2.slice(s2.indexOf('CREATE TABLE public.packages'),s2.indexOf('\\ir ../../supabase/migrations/005')));
 sql(script('supabase/migrations/005_dormant_publisher_coordination.sql'));
 const s5=script('scripts/verification/commercial-capacity-coordination.sql');sql(s5.slice(s5.indexOf('ALTER TABLE public.packages'),s5.indexOf('-- Cached existing control writer')));
 sql(script('scripts/verification/activation-disposable-schema.sql'));
 sql(script('supabase/migrations/008_commercial_capacity_coordination.sql'));
 sql(`INSERT INTO auth.users VALUES(${lit(userId)});INSERT INTO packages(id,slug,price_crc,display_order) VALUES(${lit(oldPackage)},'old',1000,1),(${lit(packageId)},'test',2000,2);INSERT INTO package_limits(package_id,listing_limit)VALUES(${lit(oldPackage)},0),(${lit(packageId)},NULL);INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle,started_at,current_period_start,current_period_end)VALUES(${lit(userId)},${lit(oldPackage)},'active','monthly',now(),now(),now()+interval '1 month');INSERT INTO listings(id,owner_id,listing_origin,listing_source_type)VALUES(${lit(listingId)},${lit(userId)},'customer','customer');INSERT INTO add_on_products(id,slug,product_type,target_type,is_active,is_stackable,maximum_quantity,requires_manual_approval,duration_type,duration_days,price_crc) VALUES(${lit(addOnId)},'featured-listing','promotion','listing',true,true,10,false,'days',7,500);`);
 if(providerMode){
 sql(script('scripts/verification/provider-disposable-schema.sql'));
 const before=sql('SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM user_subscriptions s;');
 await load('scripts/verification/commercial-provider.ts').verification;
 assert.equal(fakeProcess.exitCode,0,'provider fixture failed');assert.equal(rpcCalls,0,'submission must not activate');
 const table=providerName==='sinpe'?'sinpe_payments':'bank_transfer_payments';
 assert.equal(sql(`SELECT count(*) FROM ${table} WHERE user_id=${lit(userId)} AND status='submitted';`),'1');
 assert.equal(sql("SELECT count(*) FROM purchase_requests WHERE status='pending';"),'1');
 assert.equal(sql('SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM user_subscriptions s;'),before);
 assert.equal(sql('SELECT count(*) FROM listing_entitlements;'),'0');
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(script('scripts/verification/provider-disposable-authority.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});assert.throws(()=>m.exports.disposableProviderContext(),/Runner-created/);
 console.log('PASS actual local '+providerName+' submission; no activation/subscription change; no external transport; default authority rejected');
 }else{
 await load('scripts/verification/activation-engine.ts').verification;assert.equal(fakeProcess.exitCode,0,'activation fixture failed');assert.ok(rpcCalls>=4);
 assert.equal(sql(`SELECT count(*) FROM publisher_accounts WHERE owner_user_id=${lit(userId)};`),'1');assert.equal(sql('SELECT count(*) FROM purchase_requests;'),'0');assert.equal(sql('SELECT count(*) FROM listing_entitlements;'),'0');
 assert.equal(sql(`SELECT allowance=0 FROM twuanis_canonical_private.publisher_allowance(twuanis_canonical_private.resolve_publisher(${lit(userId)}),${lit(userId)});`),'t');assert.equal(sql('SELECT is_over_capacity AND over_capacity=1 AND NOT unlimited FROM twuanis_canonical_private.capacity_state(0,1);'),'t');
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(script('scripts/verification/activation-disposable-authority.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});assert.throws(()=>m.exports.disposableActivationContext(),/Runner-created/);
 console.log('PASS actual local activation RPC, durable publisher, synthetic cleanup, default authority rejection; RPC calls '+rpcCalls);
 }
 }finally{cleanup()}
 assert.throws(()=>sql('SELECT 1'),/unavailable/);assert.ok(!fs.existsSync(dir));console.log('PASS destroyed transport fails closed.')}
main().catch(e=>{console.error(e);process.exitCode=1});
