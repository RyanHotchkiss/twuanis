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

 sql(file('supabase/migrations/033_addon_fulfillment_placement.sql'));
 sql('UPDATE package_limits SET listing_limit=NULL');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify(Array.from({length:13},()=>input)))})`));
 sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`);
 const ids=sql(`SELECT id FROM listings WHERE owner_id='${customer}' ORDER BY id`).split('\n');
 const config=p=>sql(`SELECT current_configuration_id FROM twuanis_canonical_private.addon_products WHERE id=${lit(p)}`);
 const products=['addon-featured-listing','addon-listing-boost','addon-homepage-exposure','addon-province-exposure','addon-property-type-exposure'];
 const query=(p,id,request=crypto.randomUUID(),payment=crypto.randomUUID(),account=customer,kind='listing',evidence={amount:'5.00',currency:'USD'})=>`SELECT twuanis_canonical_private.fulfill_addon('${request}','${payment}','${account}',${lit(p)},'${config(p)}',${lit(kind)},'${id}',${lit(JSON.stringify(evidence))})`;
 const grant=(...args)=>JSON.parse(sql(query(...args)));
 const read=(surface,province=null,type=null)=>JSON.parse(sql(`SELECT public.read_addon_placement(ARRAY[${ids.map(lit)}]::uuid[],${lit(surface)},${province??'NULL'},${type??'NULL'})`));
 const req=crypto.randomUUID(),pay=crypto.randomUUID(),first=grant(products[0],ids[0],req,pay);
 ok(first.ok,'featured succeeds');ok(JSON.stringify(grant(products[0],ids[0],req,pay))===JSON.stringify(first),'purchase replay unchanged');
 assert.throws(()=>grant(products[0],ids[1],req,pay));n++;
 const second=grant(products[0],ids[0]);ok(Date.parse(second.expiresAt)-Date.parse(first.expiresAt)===60*86400000,'extension retains all purchased time');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE product_id='${products[0]}'`)==='1','one effective right no stacked strength');
 assert.throws(()=>grant(products[1],ids[0],crypto.randomUUID(),crypto.randomUUID(),owner));n++;
 for(const p of products.slice(1))ok(grant(p,ids[0]).ok,'registered '+p);
 ok(read('buy').length===2,'no implicit geography/property scope');
 ok(read('buy',1001,1).length===4,'explicit canonical contexts');
 ok(read('rent',1001,1).length===0,'transaction exclusion');
 ok(read('swipe-buy',1001,1).length===2,'swipe only featured and boost');
 ok(read('homepage',1001,1).length===1,'homepage separate');
 assert.throws(()=>read('buy',999999,1));n++;
 assert.throws(()=>sql(`SELECT public.read_addon_placement(array_fill('${ids[0]}'::uuid,ARRAY[513]),'buy')`));n++;
 ok(sql(`SELECT public.read_addon_placement('{}','buy')`)==='[]','empty bounded evidence');
 // Catalog lifecycle changes affect acquisition, not already purchased rights.
 sql(`UPDATE twuanis_canonical_private.addon_products SET state='inactive' WHERE id='${products[0]}'`);
 ok(read('buy').some(x=>x.behavior==='featured_collection'),'inactive product preserves right');
 // Eligibility restoration uses the same right and expiry; no new duration.
 sql(`UPDATE listings SET listing_status='draft' WHERE id='${ids[0]}'`);
 ok(read('buy',1001,1).length===0&&JSON.parse(sql('SELECT to_json(public.read_addon_homepage_ids())')).length===0,'inactive listing hidden');
 const homeExtension=grant(products[2],ids[0]);ok(homeExtension.ok,'active homepage right extends while listing ineligible');
 assert.throws(()=>grant(products[1],ids[1],crypto.randomUUID(),crypto.randomUUID(),owner));n++;
 sql(`UPDATE listings SET listing_status='active' WHERE id='${ids[0]}'`);
 ok(read('buy',1001,1).length===4,'restoration resumes valid evidence');
 for(const id of ids.slice(1,9))grant(products[2],id);
 // Two independent sessions contend for the one remaining global slot.
 const args=['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
 const child=q=>{const p=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.stdin.end(q);return new Promise(resolve=>p.on('close',code=>resolve({code,out,err})))};
 const race=await Promise.all([child(query(products[2],ids[9])+';'),child(query(products[2],ids[10])+';')]);
 ok(race.every(x=>x.code===0),'capacity race no database error');
 ok(race.filter(x=>JSON.parse(x.out).ok).length===1,'one last-slot winner');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE product_id='${products[2]}'`)==='10','global capacity ten');
 ok(grant(products[2],ids[12]).code==='homepage_capacity_full','eleventh no activation');
 sql(`UPDATE listings SET listing_status='draft' WHERE id='${ids[0]}'`);
 ok(grant(products[2],ids[12]).code==='homepage_capacity_full','ineligible active entitlement retains capacity');
 ok(grant(products[2],ids[0]).ok,'same target extension at full capacity');
 ok(JSON.parse(sql('SELECT to_json(public.read_addon_homepage_ids())')).length===9,'homepage projection only eligible');
 sql(`UPDATE twuanis_canonical_private.addon_placement_rights SET revoked_at=now() WHERE product_id='${products[2]}' AND listing_id='${ids[0]}'`);
 ok(grant(products[2],ids[12]).ok,'revocation releases one slot');
 ok(read('homepage').every(x=>x.listingId!==ids[0]),'revoked hidden');
 sql(`UPDATE twuanis_canonical_private.addon_placement_rights SET activated_at=now()-interval '100 days',expires_at=now()-interval '1 day' WHERE product_id='${products[1]}'`);
 ok(!read('buy').some(x=>x.behavior==='priority_over_organic'),'expired hidden');
 const renewed=grant(products[1],ids[1]);ok(Date.parse(renewed.expiresAt)-Date.parse(renewed.activatedAt)===14*86400000,'new duration fourteen days');
 const founder='addon-2026-founding-membership';ok(grant(founder,customer,crypto.randomUUID(),crypto.randomUUID(),customer,'account').ok,'founder pricing right');
 grant(founder,customer,crypto.randomUUID(),crypto.randomUUID(),customer,'account');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='1','founder unique');
 assert.throws(()=>grant(founder,owner,crypto.randomUUID(),crypto.randomUUID(),customer,'account'));n++;
 assert.throws(()=>grant(founder,customer,crypto.randomUUID(),crypto.randomUUID(),customer,'account',{amount:'500',currency:'CRC'}));n++;
 assert.throws(()=>grant('addon-premium-listing-template',ids[0]));n++;
 assert.throws(()=>sql('UPDATE twuanis_canonical_private.addon_fulfillments SET result=result'));n++;
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.fulfill_addon(uuid,uuid,uuid,text,uuid,text,uuid,jsonb)','EXECUTE')`)==='f',role+' cannot fulfill');
 for(const role of ['anon','authenticated'])ok(sql(`SELECT has_function_privilege('${role}','public.read_addon_placement(uuid[],text,bigint,bigint)','EXECUTE')`)==='f',role+' cannot resolve private placements');
 ok(sql(`SELECT has_function_privilege('service_role','public.read_addon_placement(uuid[],text,bigint,bigint)','EXECUTE')`)==='t','server read only');
 console.log(JSON.stringify({checks:n,concurrencyCases:1,status:'PASS',scope:'disposable real fulfillment, extension, eligibility, global capacity, scopes and privilege checks'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
