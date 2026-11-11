'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/addon-bulk-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55456 -c listen_addresses=`,'start']);started=true;
 sql('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;');
 sql(file('outputs/CG-S11-B/disposable-install-fixture.sql').replaceAll('end;$function$','end;$function$;').replaceAll('\n$function$\n','\n$function$;\n'));
 sql(`CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;`);
 for(let i=2;i<=25;i++){const f=fs.readdirSync(root+'/supabase/migrations').find(f=>f.startsWith(String(i).padStart(3,'0')+'_'));sql(file('supabase/migrations/'+f));}
 sql(`INSERT INTO auth.users(id) VALUES('${owner}'),('${customer}');`);
 // Existing target reject function is absent from the historical fixture: minimal compatible dependency.
 sql(`CREATE FUNCTION public.reject_sinpe_payment(p_payment_id uuid,p_rejection_reason text) RETURNS TABLE(payment_id uuid,subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,rejection_reason text,rejected_at timestamptz) LANGUAGE sql AS $$ SELECT p_payment_id,NULL::uuid,NULL::uuid,NULL::uuid,'rejected','cancelled',p_rejection_reason,now() $$;`);
 sql(file('supabase/migrations/026_administrative_control_foundation.sql'));
 sql(file('supabase/migrations/027_administrative_listing_boundary.sql'));
 sql(file('supabase/migrations/028_administrative_listing_reads.sql'));
 sql('CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text,metadata jsonb);');
 sql(file('supabase/migrations/029_administrative_media.sql'));

 sql(file('supabase/migrations/030_intelligence_package_configurations.sql'));
 sql(file('supabase/migrations/031_addon_catalog.sql'));
 sql(file('supabase/migrations/032_addon_customer_bulk_import.sql'));
 sql(`UPDATE user_subscriptions SET current_period_start=now()-interval '1 day',current_period_end=now()+interval '1 year' WHERE user_id='${customer}';`);

 sql(file('supabase/migrations/033_addon_fulfillment_placement.sql'));sql('UPDATE package_limits SET listing_limit=NULL');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},money:{amount:'1',currency:'USD'}};
 const prepare=qty=>JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify(Array.from({length:qty},()=>input)))})`));
 const job=prepare(12);sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`);
 const ids=sql('SELECT id FROM listings ORDER BY id').split('\n');
 const config=p=>sql(`SELECT current_configuration_id FROM twuanis_canonical_private.addon_products WHERE id=${lit(p)}`);
 const query=(p,id,request=crypto.randomUUID(),payment=crypto.randomUUID(),cid=config(p))=>`SELECT twuanis_canonical_private.fulfill_addon('${request}','${payment}','${customer}',${lit(p)},'${cid}','listing','${id}','{"amount":"5","currency":"USD"}')`;
 const args=['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
 const child=q=>{const p=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.stdin.end(q);return new Promise(resolve=>p.on('close',code=>resolve({code,out,err})))};
 const race=async(a,b)=>Promise.all([child(a+';'),child(b+';')]);let races=0;
 const homepage='addon-homepage-exposure',boost='addon-listing-boost';
 for(const id of ids.slice(0,10))sql(query(homepage,id));
 let rr=await race(query(homepage,ids[0]),query(homepage,ids[10]));races++;
 ok(rr.every(x=>x.code===0),'extension/capacity both typed outcomes');ok(JSON.parse(rr[0].out).ok&&JSON.parse(rr[1].out).code==='homepage_capacity_full','extension wins no extra slot at full capacity');
 rr=await race(query(boost,ids[0]),query(boost,ids[0]));races++;ok(rr.every(x=>x.code===0),'distinct fulfillments serialize');
 const rights=rr.map(x=>JSON.parse(x.out)).sort((a,b)=>Date.parse(a.expiresAt)-Date.parse(b.expiresAt));ok(Date.parse(rights[1].expiresAt)-Date.parse(rights[0].expiresAt)===14*86400000,'two purchases retain two terms');
 const same=query(boost,ids[1]);rr=await race(same,same);races++;ok(rr.every(x=>x.code===0),'same purchase race succeeds');ok(rr[0].out===rr[1].out,'same purchase exact immutable result');
 const newJob=prepare(2),bulk=`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${newJob.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`;
 const before=Number(sql('SELECT count(*) FROM listings'));rr=await race(bulk,bulk);races++;ok(rr.every(x=>x.code===0)&&rr[0].out===rr[1].out,'same bulk job exact replay');ok(Number(sql('SELECT count(*) FROM listings'))===before+2,'same job only two creations');
 const pid='addon-province-exposure',old=config(pid),rev=sql(`SELECT revision FROM twuanis_canonical_private.addon_products WHERE id='${pid}'`);
 const command=body=>`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims','${JSON.stringify({sub:owner,role:'authenticated'})}',true);SELECT public.admin_addon_command('${crypto.randomUUID()}',${lit(JSON.stringify(body))});COMMIT`;
 rr=await race(command({operation:'configuration',product:pid,expected:rev,durationDays:31}),command({operation:'lifecycle',product:pid,expected:rev,state:'archived',reason:'fixture'}));races++;ok(rr.filter(x=>x.code===0).length===1,'archive versus configuration exactly one wins');
 // Already purchased immutable configuration survives a later catalog change/archive.
 const r=JSON.parse(sql(query(pid,ids[2],crypto.randomUUID(),crypto.randomUUID(),old)));ok(Date.parse(r.expiresAt)-Date.parse(r.activatedAt)===28*86400000,'old purchased duration preserved');
 // Receipt failure rolls back entitlement activation too.
 sql(`CREATE FUNCTION public.fail_addon_receipt() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture receipt failure';END$$;CREATE TRIGGER fail_addon_receipt BEFORE INSERT ON twuanis_canonical_private.addon_fulfillments FOR EACH ROW EXECUTE FUNCTION public.fail_addon_receipt()`);
 assert.throws(()=>sql(query(boost,ids[3])));n++;ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${ids[3]}' AND product_id='${boost}'`)==='0','activation receipt failure atomic');
 sql('DROP TRIGGER fail_addon_receipt ON twuanis_canonical_private.addon_fulfillments;DROP FUNCTION public.fail_addon_receipt()');
 for(const role of ['anon','authenticated','service_role']){assert.throws(()=>sql(`SET ROLE ${role};${query(boost,ids[3])}`));n++;assert.throws(()=>sql(`SET ROLE ${role};INSERT INTO twuanis_canonical_private.addon_placement_rights DEFAULT VALUES`));n++;}
 // Freeze only the reader's clock in this disposable function to test exact endpoints.
 const def=sql(`SELECT pg_get_functiondef('public.read_addon_placement(uuid[],text,bigint,bigint)'::regprocedure)`).replaceAll('statement_timestamp()','transaction_timestamp()');sql(def);
 const target=ids[1],read=`SELECT jsonb_array_length(public.read_addon_placement(ARRAY['${target}']::uuid[],'buy'))`;
 for(const [start,end,expected] of [["now()+interval '1 second'","now()+interval '2 days'",0],['now()',"now()+interval '1 day'",1],["now()-interval '1 day'","now()+interval '1 day'",1],["now()-interval '1 day'",'now()',0],["now()-interval '2 days'","now()-interval '1 day'",0]]){
  const v=sql(`BEGIN;UPDATE twuanis_canonical_private.addon_placement_rights SET activated_at=${start},expires_at=${end} WHERE listing_id='${target}' AND product_id='${boost}';${read};ROLLBACK;`);ok(Number(v)===expected,'exact temporal boundary '+start+' '+end);
 }
 console.log(JSON.stringify({status:'PASS',checks:n,concurrencyCases:races,scope:'additional required independent-session races, atomic receipt failure, actual privilege denials, frozen-clock boundary fixtures'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
