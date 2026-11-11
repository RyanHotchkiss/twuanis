'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/offer-resolution-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
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

 sql(file('supabase/migrations/034_offer_authority.sql'));sql(file('supabase/migrations/035_offer_resolution.sql'));

 const snapshot=(kind,product,job=null,request=crypto.randomUUID())=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}',${lit(request)},${lit(kind)},${lit(product)},'USD',NULL,${job?lit(job):'NULL'})`));
 const packageId='pkg-pricing-position-relationships';
 const rid=crypto.randomUUID(),p=snapshot('package',packageId,null,rid);
 ok(p.terms.source==='STANDARD'&&p.terms.total==='100','standard package snapshot');
 ok(Date.parse(p.paymentDeadline)-Date.parse(p.createdAt)===86400000,'package24hours');
 sql(`UPDATE twuanis_canonical_private.intelligence_package_prices SET amount=120 WHERE package_id=${lit(packageId)} AND currency='USD'`);
 ok(snapshot('package',packageId,null,rid).terms.total==='100','existing standard snapshot survives price edit');
 ok(snapshot('package',packageId).terms.total==='120','new standard snapshot sees new price');
 const f=snapshot('addon','addon-2026-founding-membership');
 ok(f.terms.total==='500'&&f.terms.source==='STANDARD','standard Founding snapshot');
 ok(Date.parse(f.paymentDeadline)-Date.parse(f.createdAt)===86400000,'Founding24hours');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input,input]))})`));
 const b=snapshot('addon','addon-bulk-listing-import',job.jobId);
 ok(b.terms.quantity===2&&b.terms.total==='1.00'&&b.terms.effectiveRate==='0.50','server job quantity and whole-job rate');
 ok(Date.parse(b.paymentDeadline)-Date.parse(b.createdAt)===86400000,'Bulk24hours');
 ok(sql("SELECT count(*) FROM twuanis_canonical_private.addon_import_results")==='0','Order did not execute job');
 ok(sql("SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights")==='0','Order issued no Founder right');
 ok(sql("SELECT count(*) FROM twuanis_canonical_private.intelligence_package_rights")==='0','Order issued no Package right');

 const configChange={operation:'configuration',product:'addon-bulk-listing-import',expected:'1'};
 run(owner,`SELECT public.admin_addon_command('${crypto.randomUUID()}',${lit(JSON.stringify(configChange))})`);
 assert.throws(()=>snapshot('addon','addon-bulk-listing-import',job.jobId),/job configuration is no longer current/);n++;
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots WHERE job_id='${job.jobId}'`)==='1','stale job creates no unfulfillable Order');
 console.log('PASS universal Order window checks:',n);

 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
