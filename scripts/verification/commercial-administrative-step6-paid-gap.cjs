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



 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input]))})`));
 sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`);
 const listing=sql(`SELECT id FROM listings WHERE owner_id='${customer}' LIMIT 1`);
 const make=product=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon',${lit(product)},'USD','${listing}')`));
 const featured=make('addon-featured-listing');
 assert.throws(()=>make('addon-listing-boost'));n++;
 sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${featured.id}','${crypto.randomUUID()}','disposable_test','${crypto.randomUUID()}',12,'USD','disposable_fixture')`);
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${listing}'`)==='0','paid is not fulfilled');

 assert.throws(()=>make('addon-listing-boost'));n++;
 assert.throws(()=>make('addon-featured-listing'));n++;
 const query=product=>`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon',${lit(product)},'USD','${listing}')`;
 function parallel(q){return new Promise(resolve=>{const p=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});let err='';p.stderr.on('data',x=>err+=x);p.stdout.resume();p.on('close',code=>resolve({code,err}));p.stdin.end(q)})}
 const race=await Promise.all([parallel(query('addon-featured-listing')),parallel(query('addon-listing-boost'))]);
 ok(race.every(r=>r.code!==0&&r.err.includes('pending listing acquisition')),'parallel attempts both denied during paid/unfulfilled');
 const cfg=featured.terms.configurationId;
 const fulfillment=JSON.parse(sql(`SELECT twuanis_canonical_private.fulfill_addon('${featured.id}','${crypto.randomUUID()}','${customer}','addon-featured-listing','${cfg}','listing','${listing}','{"currency":"USD","amount":"12"}')`));
 ok(fulfillment.ok===true,'trusted fulfillment succeeds');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${listing}' AND product_id='addon-featured-listing'`)==='1','active fulfilled right');
 assert.throws(()=>make('addon-listing-boost'));n++;
 const renewal=make('addon-featured-listing');
 ok(renewal.terms.total==='12','same-product renewal allowed at current price');
 assert.throws(()=>make('addon-featured-listing'));n++;
 console.log('PASS acquisition transition checks:',n,'; independent-session blocked acquisition case:1');
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
