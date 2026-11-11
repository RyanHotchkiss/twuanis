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
 const offer=(body,rid=crypto.randomUUID())=>JSON.parse(run(owner,`SELECT public.admin_offer_command(${lit(rid)},${lit(JSON.stringify(body))})`));
 const product='addon-featured-listing';
 const created=offer({operation:'create',targetType:'addon',targetId:product,name_en:'Test',name_es:'Prueba',startsAt:'2020-01-01T00:00:00Z',endsAt:'2027-04-10T23:59:59-06:00',prices:{USD:'3'}});
 offer({operation:'schedule',id:created.offerId,expected:'1'});
 const resolve=(at,cur='USD')=>JSON.parse(sql(`SELECT twuanis_canonical_private.resolve_offer_price('addon',${lit(product)},${lit(cur)},1,${lit(at)})`));
 ok(resolve('2027-04-10T23:59:59-06:00').total==='3','inclusive exact end');
 ok(resolve('2027-04-10T23:59:59.000001-06:00').total==='12','first microsecond after end');
 ok(resolve('2019-12-31T23:59:59Z').source==='STANDARD','before start');
 ok(resolve('2020-01-01T00:00:00Z').source==='OFFER','at start');
 ok(resolve('2026-10-04T00:00:00Z','CRC').total==='6000','unsupported offer currency falls back');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input]))})`));
 sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`);
 const listing=sql(`SELECT id FROM listings WHERE owner_id='${customer}' LIMIT 1`);
 const snap=(p=product,r=crypto.randomUUID(),a=customer)=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot(${lit(a)},${lit(r)},'addon',${lit(p)},'USD',${lit(listing)})`));
 const rid=crypto.randomUUID(),first=snap(product,rid);
 ok(first.terms.source==='OFFER'&&first.terms.total==='3','snapshot resolved offer');
 ok(Date.parse(first.paymentDeadline)-Date.parse(first.createdAt)===86400000,'24 elapsed hours');
 ok(snap(product,rid).id===first.id,'retry same immutable order');
 assert.throws(()=>snap('addon-listing-boost'));n++;
 assert.throws(()=>snap(product));n++;
 assert.throws(()=>snap('addon-listing-boost',rid));n++;
 assert.throws(()=>snap(product,crypto.randomUUID(),owner));n++;
 offer({operation:'end',id:created.offerId,expected:'2'});
 ok(snap(product,rid).terms.total==='3','early end does not rewrite order');
 ok(resolve('2026-10-04T00:00:00Z').total==='12','new resolution standard after end');
 for(const role of ['anon','authenticated','service_role']){
  ok(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.create_offer_order_snapshot(uuid,uuid,text,text,text,uuid,uuid)','EXECUTE')`)==='f','snapshot no runtime execution '+role);
 }
 console.log('PASS Step6 resolution/snapshot checks:',n);
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
