'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step12-copy-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55468','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55468 -c listen_addresses=`,'start']);started=true;
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

 sql(file('supabase/migrations/039_order_commercial_terms.sql'));
 // Reproduce the actual production legacy boundary before applying040.
 sql(`ALTER TABLE public.sinpe_payments ALTER COLUMN payment_date SET NOT NULL;
 ALTER TABLE public.sinpe_payments ADD CONSTRAINT sinpe_payments_commercial_relationship CHECK(purchase_request_id IS NOT NULL OR subscription_id IS NOT NULL);
 CREATE FUNCTION public.validate_sinpe_payment_subscription() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.user_subscriptions us WHERE us.id=NEW.subscription_id AND us.user_id=NEW.user_id) THEN RAISE EXCEPTION 'The subscription does not belong to the specified user.';END IF;RETURN NEW;END$$;
 CREATE TRIGGER validate_sinpe_payment_subscription BEFORE INSERT OR UPDATE OF user_id,subscription_id ON public.sinpe_payments FOR EACH ROW EXECUTE FUNCTION public.validate_sinpe_payment_subscription();`);
 const legacySubscription=sql(`SELECT id FROM public.user_subscriptions WHERE user_id='${customer}' LIMIT 1`);
 const legacyId=crypto.randomUUID();sql(`INSERT INTO public.sinpe_payments(id,user_id,subscription_id,payment_date) VALUES('${legacyId}','${customer}','${legacySubscription}','2026-01-01T00:00:00Z')`);
 const legacyBefore=sql(`SELECT row_to_json(p) FROM public.sinpe_payments p WHERE id='${legacyId}'`);
 sql(file('supabase/migrations/040_sinpe_order_payment.sql'));

 for(const f of ['041_entitlement_source_terms.sql','042_entitlement_fulfillment.sql','043_entitlement_administration.sql'])sql(file('supabase/migrations/'+f));

 const rejects=(f,label)=>{assert.throws(f,undefined,label);n++};
 sql(`ALTER TABLE public.entitlements ADD COLUMN is_active boolean DEFAULT true;ALTER TABLE public.package_entitlements ADD COLUMN boolean_value boolean DEFAULT false;`);
 for(const f of ['044_legacy_package_access_transition.sql','045_prepublication_addon_orders.sql','046_customer_commercial_boundary.sql'])sql(file('supabase/migrations/'+f));


 sql(file('supabase/migrations/036_offer_reads_and_launch_drafts.sql'));
 sql(file('supabase/migrations/047_spanish_package_commercial_copy.sql'));
 const copy=JSON.parse(file('outputs/commercial-administrative/STEP-12-spanish-addon-copy.json'));
 const migration=file('supabase/migrations/048_spanish_addon_names.sql');
 const rows=()=>JSON.parse(sql('SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM twuanis_canonical_private.addon_products p'));
 const protectedState=()=>{
  const tables=sql("SELECT tablename FROM pg_tables WHERE schemaname='twuanis_canonical_private' ORDER BY tablename").split('\n');
  return tables.map(t=>[t,sql(`SELECT coalesce(jsonb_agg(v ORDER BY v::text),'[]') FROM (SELECT ${t==='addon_products'?"to_jsonb(t)-'name_es'-'revision'-'updated_at'":"to_jsonb(t)"} v FROM twuanis_canonical_private.${t} t) q`)]);
 };
 const authority=()=>sql(`SELECT jsonb_agg(jsonb_build_array(p.oid::regprocedure::text,p.proowner,p.prosecdef,p.proconfig,p.proacl,pg_get_functiondef(p.oid)) ORDER BY p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN('public','twuanis_canonical_private') AND p.prokind='f'`);
 const before=protectedState(),authBefore=authority(),old=rows();
 sql(migration);ok(JSON.stringify(protectedState())===JSON.stringify(before),'all private commercial tables unchanged outside names/revisions/timestamps');ok(authority()===authBefore,'all function definitions/security/ACLs unchanged');
 for(const c of copy){const p=rows().find(x=>x.id===c.id),prior=old.find(x=>x.id===c.id);ok(p.name_es===c.name_es,'canonical Spanish '+c.id);ok(p.name_en===c.name_en,'English anchor '+c.id);ok(p.revision===prior.revision+1,'revision advances once '+c.id);ok(Date.parse(p.updated_at)>=Date.parse(prior.updated_at),'timestamp '+c.id);
 const projection=JSON.parse(sql(`SELECT twuanis_canonical_private.customer_product_copy('addon','${c.id}')`));ok(projection.nameES===c.name_es,'Order/benefit canonical projection '+c.id);}
 const after=rows();sql(migration);ok(JSON.stringify(rows())===JSON.stringify(after),'idempotent full replay');
 // Every failure must rollback earlier successful row changes in the same migration.
 sql("UPDATE twuanis_canonical_private.addon_products SET name_es=NULL");
 sql("UPDATE twuanis_canonical_private.addon_products SET name_es='Unreviewed' WHERE id='addon-province-exposure'");
 const unexpected=rows();rejects(()=>sql(migration),'unexpected Spanish fails closed');ok(JSON.stringify(rows())===JSON.stringify(unexpected),'Spanish mismatch rolls back entire group');
 sql("UPDATE twuanis_canonical_private.addon_products SET name_es=NULL,name_en='Changed English' WHERE id='addon-province-exposure'");const changed=rows();rejects(()=>sql(migration),'English anchor mismatch rejected');ok(JSON.stringify(rows())===JSON.stringify(changed),'English mismatch rollback');
 sql("UPDATE twuanis_canonical_private.addon_products SET name_en='Province Exposure' WHERE id='addon-province-exposure'");
 sql(migration);
 for(const role of ['anon','authenticated','service_role']){rejects(()=>sql(`SET ROLE ${role};`+migration),'runtime cannot install '+role);ok(sql(`SELECT NOT has_table_privilege('${role}','twuanis_canonical_private.addon_products','UPDATE')`)==='t','direct update denied '+role);}
 const publicCatalog=JSON.parse(sql('SELECT public.read_addon_catalog()'));
 for(const p of publicCatalog)ok(p.name_es===copy.find(c=>c.id===p.id).name_es,'public projection '+p.id);
 const admin=JSON.parse(run(owner,'SELECT public.admin_addon_read(NULL)'));
 fs.writeFileSync(root+'/outputs/commercial-administrative/step12/addon-copy-fixture.json',JSON.stringify({products:rows(),publicCatalog,admin},null,2));
 const result={status:'PASS',checks:n,scope:'Migration048 on socket-only disposable PostgreSQL; copy only, rollback guards, replay, ACL/function preservation; all private-table contents preserved'};
 fs.writeFileSync(root+'/outputs/commercial-administrative/step12/addon-copy-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
