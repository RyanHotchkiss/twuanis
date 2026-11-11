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



 const standards=()=>sql(`SELECT jsonb_build_array((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.package_id,p.currency) FROM twuanis_canonical_private.intelligence_package_prices p),(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.configuration_id,p.currency) FROM twuanis_canonical_private.addon_standard_prices p),(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.configuration_id,p.lower_quantity) FROM twuanis_canonical_private.addon_quantity_tiers p))`);
 const beforeStandards=standards();
 sql(file('supabase/migrations/036_offer_reads_and_launch_drafts.sql'));
 const list=()=>JSON.parse(run(owner,'SELECT public.admin_offer_read()')).offers;
 ok(list().length===10&&list().every(o=>o.state==='draft'),'10 nonapplicable launch drafts');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_scalar_prices')==='17','17 explicit currency prices');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_quantity_tiers')==='3','3 whole-job offer tiers');
 assert.throws(()=>run(customer,'SELECT public.admin_offer_read()'));n++;
 for(const o of list()){
  const c={operation:'configure',id:o.id,expected:o.revision,name_en:o.name_en,name_es:o.name_es,startsAt:'2020-01-01T00:00:00Z',endsAt:o.endsAt,...(o.priceShape==='whole_job'?{tiers:o.tiers}:{prices:o.prices})};
  run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify(c))})`);
  run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'schedule',id:o.id,expected:'2'}))})`);
 }
 const prices=JSON.parse(sql("SET ROLE anon;SELECT public.read_offer_prices('addon',ARRAY['addon-featured-listing','addon-2026-founding-membership'],'USD')"));
 ok(prices[0].checkoutAvailable===false&&prices.every(p=>p.source==='OFFER'),'public safe Offer projection');
 ok(!JSON.stringify(prices).includes('configurationId')&&!JSON.stringify(prices).includes('revision'),'private evidence absent');
 for(const [q,rate] of [[1,'0.25'],[25,'0.25'],[26,'0.12'],[100,'0.12'],[101,'0.05'],[500,'0.05']]){
  const r=JSON.parse(sql(`SELECT twuanis_canonical_private.resolve_offer_price('addon','addon-bulk-listing-import','USD',${q},'2026-12-31T23:59:59-06:00')`));ok(r.effectiveRate===rate,'bulk tier '+q);
 }
 ok(JSON.parse(sql("SELECT twuanis_canonical_private.resolve_offer_price('addon','addon-bulk-listing-import','USD',501,now())")).available===false,'501 unpriced');
 ok(JSON.parse(sql("SELECT twuanis_canonical_private.resolve_offer_price('addon','addon-bulk-listing-import','CRC',25,now())")).available===false,'bulkCRCunpriced');
 ok(JSON.parse(sql("SELECT twuanis_canonical_private.resolve_offer_price('addon','addon-2026-founding-membership','USD',1,'2027-04-10T23:59:59-06:00')")).total==='200','Founding final instant');
 ok(JSON.parse(sql("SELECT twuanis_canonical_private.resolve_offer_price('addon','addon-2026-founding-membership','USD',1,'2027-04-10T23:59:59.000001-06:00')")).total==='500','Founding expiry fallback');

 const tiers=JSON.parse(sql("SET ROLE anon;SELECT public.read_offer_prices('addon',ARRAY['addon-bulk-listing-import'],'USD')"))[0];
 ok(tiers.tiers.length===3&&tiers.tiers[1].effectiveRate==='0.12'&&!('total' in tiers),'public tier evidence has no fabricated accepted quantity/total');
 ok(JSON.parse(sql("SET ROLE anon;SELECT public.read_offer_prices('addon',ARRAY['addon-bulk-listing-import'],'CRC')"))[0].available===false,'public unsupported bulk currency unavailable');
 ok(standards()===beforeStandards,'Package/Add-on standard monetary authority unchanged');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.intelligence_packages')==='3','three canonical Packages preserved');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_products')==='8','eight canonical Add-ons preserved');
 ok(sql('SELECT capacity FROM twuanis_canonical_private.addon_homepage_capacity')==='10','Homepage capacity preserved');
 for(const role of ['anon','authenticated','service_role']){
  ok(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname='twuanis_canonical_private' AND p.proname IN ('resolve_offer_price','create_offer_order_snapshot','acknowledge_offer_order_paid') AND has_function_privilege('${role}',p.oid,'EXECUTE')`)==='0',role+' no private executable authority');
  ok(sql(`SELECT count(*) FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='twuanis_canonical_private' AND c.relkind='r' AND c.relname LIKE 'offer%' AND (has_table_privilege('${role}',c.oid,'INSERT') OR has_table_privilege('${role}',c.oid,'UPDATE') OR has_table_privilege('${role}',c.oid,'DELETE') OR has_table_privilege('${role}',c.oid,'TRUNCATE'))`)==='0',role+' no Offer table mutation');
 }
 ok(sql(`SELECT count(*) FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='twuanis_canonical_private' AND c.relkind='r' AND c.relname LIKE 'offer%' AND (NOT c.relrowsecurity OR pg_get_userbyid(c.relowner)<>'postgres')`)==='0','Offer tables RLS and reviewed owner');
 ok(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE p.proname IN ('admin_offer_command','admin_offer_read','admin_offer_targets','read_offer_prices','resolve_offer_price','create_offer_order_snapshot','acknowledge_offer_order_paid') AND (pg_get_userbyid(p.proowner)<>'postgres' OR NOT coalesce(p.proconfig@>ARRAY['search_path=pg_catalog'],false))`)==='0','fixed safe search path and function owner');
 for(const table of ['addon_fulfillments','addon_placement_rights','addon_founder_rights','addon_import_results','intelligence_package_rights'])ok(sql(`SELECT count(*) FROM twuanis_canonical_private.${table}`)==='0','no commercial effect '+table);
 console.log('PASS Offer seeds/reads/authority checks:',n);

 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
