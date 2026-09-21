/* Test-only, bounded adapter for this fixture. No HTTP/Supabase client or environment credentials. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),ts=require(path.join(root,'node_modules/typescript'));
const publicMode=process.argv[2]==='public-evidence';
const timelineMode=process.argv[2]==='timeline';
const pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-commercial-'),data=path.join(dir,'data'),socket=path.join(dir,'socket');
fs.mkdirSync(socket);let started=false,closed=false,statements=0,inserts=0,deletes=0;
function call(bin,args,input){return execFileSync(path.join(pg,bin),args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
function cleanup(){if(closed)return; if(started||fs.existsSync(path.join(data,'postmaster.pid'))){call('pg_ctl',['-D',data,'stop','-m','fast']);started=false}fs.rmSync(dir,{recursive:true});closed=true;console.log('Disposable cluster stopped and removed.')}
for (const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>{try{cleanup()}catch(error){console.error('Disposable cleanup failed:',error)}process.exit(1)});
function lit(x){return "'"+String(x).replaceAll("'","''")+"'"}
function sql(q){if(!started||closed)throw Error('Runner transport unavailable; no fallback');statements++;return call('psql',['-X','-qAt','-h',socket,'-p','55445','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim()}
const tables=new Set(['listings','listing_entitlements','packages','package_limits','user_subscriptions','add_on_products','saved_analyses','saved_searches','activity_events']);
const historyTables=['purchase_requests','purchase_request_events','sinpe_payments','user_subscriptions','listing_entitlements','activity_events','promotion_events'];
if(timelineMode)for(const table of historyTables)tables.add(table);
if(publicMode)tables.add('promotion_intelligence_evidence');
const writable=new Set(publicMode?['listings','listing_entitlements','promotion_intelligence_evidence']:timelineMode?historyTables:['listings','listing_entitlements']);
function field(k){if(!/^[a-z_]+$/.test(k))throw Error('Unsupported test column');return `doc->>${lit(k)}`}
function rows(table){return JSON.parse(sql(`SELECT coalesce(jsonb_agg(doc),'[]') FROM fixture_rows WHERE entity=${lit(table)};`))}
function client(){return {from(table){if(!tables.has(table))throw Error('Unsupported test table '+table);let filters=[],sort=[],limit=null,mode='read',payload,one=false,required=false,selection='',head=false;
 const q={select(s,options={}){selection=s;head=!!options.head;return q},eq(k,v){filters.push(`${field(k)}=${lit(v)}`);return q},in(k,v){filters.push(v.length?`${field(k)} IN (${v.map(lit).join(',')})`:'false');return q},gte(k,v){filters.push(`${field(k)}>=${lit(v)}`);return q},order(k,o={}){sort.push(`${field(k)} ${o.ascending===false?'DESC':'ASC'}`);return q},limit(n){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid limit');limit=n;return q},maybeSingle(){one=true;return q},single(){one=true;required=true;return q},insert(v){if(!writable.has(table))throw Error('Forbidden fixture write');mode='insert';payload=Array.isArray(v)?v:[v];return q},delete(){if(!writable.has(table))throw Error('Forbidden fixture delete');mode='delete';return q},then(resolve,reject){return Promise.resolve().then(()=>{
 const where=`entity=${lit(table)}`+(filters.length?' AND '+filters.join(' AND '):'');let result;
 if(mode==='insert'){result=payload.map(v=>({id:crypto.randomUUID(),created_at:'2026-08-01T00:00:00Z',updated_at:'2026-08-01T00:00:00Z',...v}));for(const v of result){if(table==='listings'&&v.canonical_domain_version!=null)throw Error('Noncanonical fixtures only');sql(`INSERT INTO fixture_rows(entity,doc) VALUES(${lit(table)},${lit(JSON.stringify(v))}::jsonb);`);inserts++}}
 else if(mode==='delete'){if(!filters.length)throw Error('Unbounded fixture deletion');result=JSON.parse(sql(`WITH deleted AS (DELETE FROM fixture_rows WHERE ${where} RETURNING doc) SELECT coalesce(jsonb_agg(doc),'[]') FROM deleted;`));deletes+=result.length}
 else {result=JSON.parse(sql(`SELECT coalesce(jsonb_agg(doc),'[]') FROM (SELECT doc FROM fixture_rows WHERE ${where}${sort.length?' ORDER BY '+sort.join(','):''}${limit!==null?' LIMIT '+limit:''}) q;`))}
 if(selection.includes('product:add_on_products')){const products=rows('add_on_products');result=result.map(v=>({...v,product:products.find(p=>p.id===v.product_id)||null}))}
 if(one&&(result.length>1||(required&&result.length!==1)))return {data:null,error:{message:'single cardinality mismatch'},count:result.length};
 return {data:head?null:one?(result[0]||null):result,error:null,count:result.length};
 }).then(resolve,reject)}};return q},storage:{from(bucket){if(bucket!=='listings-images')throw Error('Unsupported storage');return {async list(){return {data:[],error:null}}}}}}}
const allowed=new Set(['scripts/verification/commercial-resolver.ts','lib/commercial-resolver.ts','lib/package-limits.ts','lib/package-usage.ts','lib/listing-entitlements.ts']);
if(timelineMode){allowed.clear();allowed.add('scripts/verification/commercial-timeline.ts');allowed.add('lib/commercial-timeline.ts')}
if(publicMode){allowed.clear();for(const file of ['scripts/verification/public-promotion-evidence.ts','lib/public-promotion-evidence.ts','lib/aggregate-promotion-intelligence-engine.ts'])allowed.add(file)}
const cache=new Map();const fakeProcess={exitCode:0};const userId=crypto.randomUUID();const transport=client();
function load(file){if(!allowed.has(file))throw Error('Unsupported fixture import '+file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
 const js=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(js,{module:m,exports:m.exports,console,crypto,process:fakeProcess,require(name){if(publicMode&&name==='./public-evidence-disposable-authority')return {disposablePublicEvidenceContext:()=>({client:transport,userId})};if(timelineMode&&name==='./timeline-disposable-authority')return {disposableTimelineContext:()=>({client:transport,userId})};if(!timelineMode&&name==='./commercial-disposable-authority')return {disposableCommercialContext:()=>({client:transport,userId})};let next=name.startsWith('@/')?name.slice(2)+'.ts':path.posix.normalize(path.posix.join(path.posix.dirname(file),name))+'.ts';return load(next)}},{filename:file});return m.exports}
async function main(){try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);
 call('pg_ctl',['-D',data,'-l',path.join(dir,'server.log'),'-o',`-k ${socket} -p 55445 -c listen_addresses=`, 'start']);started=true;
 assert.equal(sql("SELECT inet_server_addr() IS NULL AND current_setting('data_directory')="+lit(data)+";"),'t');
 sql('CREATE TABLE fixture_rows(entity text NOT NULL,doc jsonb NOT NULL);');
 const packageId=crypto.randomUUID(),productId=crypto.randomUUID();
 const seed={packages:[{id:packageId,slug:'test-package',name_en:'Disposable',name_es:'Desechable',price_usd:1,hierarchy_level:1}],package_limits:[{package_id:packageId,listing_limit:10,featured_listing_limit:5,storage_limit_mb:10}],user_subscriptions:[{id:crypto.randomUUID(),user_id:userId,package_id:packageId,status:'active',started_at:'2026-01-01T00:00:00Z',current_period_start:'2026-01-01T00:00:00Z',current_period_end:'2030-01-01T00:00:00Z',created_at:'2026-01-01T00:00:00Z'}],add_on_products:[{id:productId,slug:'featured-listing',is_active:true,product_type:'promotion',target_type:'listing',name_en:'Featured',name_es:'Destacado'}]};
 if(timelineMode){seed.packages[0].is_active=true;seed.user_subscriptions=[];seed.listings=[{id:crypto.randomUUID(),owner_id:userId,canonical_domain_version:null}]}
 for(const [table,values]of Object.entries(seed))for(const v of values)sql(`INSERT INTO fixture_rows VALUES(${lit(table)},${lit(JSON.stringify(v))}::jsonb);`);
 await load(publicMode?'scripts/verification/public-promotion-evidence.ts':timelineMode?'scripts/verification/commercial-timeline.ts':'scripts/verification/commercial-resolver.ts').verification;
 assert.equal(fakeProcess.exitCode,0,'fixture failed');
 if(timelineMode){for(const table of historyTables)assert.equal(rows(table).length,0,table+' cleanup incomplete');assert.equal(rows('listings').length,1,'seed listing changed')}else assert.equal(rows('listings').length,0,'listing cleanup incomplete');if(publicMode)assert.equal(rows('promotion_intelligence_evidence').length,0,'evidence cleanup incomplete');assert.equal(rows('listing_entitlements').length,0,'entitlement cleanup incomplete');assert.ok(inserts>0&&deletes===inserts);
 // Default authority module always rejects, even when normal credentials are present.
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,publicMode?'public-evidence-disposable-authority.ts':timelineMode?'timeline-disposable-authority.ts':'commercial-disposable-authority.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://untrusted.invalid',SUPABASE_SERVICE_ROLE_KEY:'not-authority'}}});assert.throws(()=>m.exports[publicMode?'disposablePublicEvidenceContext':timelineMode?'disposableTimelineContext':'disposableCommercialContext'](),/runner-created/);
 console.log(JSON.stringify({statements,syntheticInserts:inserts,syntheticDeletes:deletes,remoteTransport:false,defaultAuthorityRejected:true}));
 }finally{cleanup()}
 assert.throws(()=>sql('SELECT 1'),/unavailable/);assert.ok(!fs.existsSync(dir));console.log('PASS transport fails closed after destruction; no fallback.')}
main().catch(e=>{console.error(e);process.exitCode=1});
