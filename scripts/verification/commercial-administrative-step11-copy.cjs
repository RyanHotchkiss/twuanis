'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step11-commerce-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55462','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55462 -c listen_addresses=`,'start']);started=true;
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

 const protectedState=()=>sql(`SELECT jsonb_build_object('packages',(SELECT jsonb_agg(to_jsonb(p)-'name_es'-'question_es'-'revision'-'updated_at' ORDER BY id) FROM twuanis_canonical_private.intelligence_packages p),'configurations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM twuanis_canonical_private.intelligence_package_configurations c),'prices',(SELECT jsonb_agg(to_jsonb(p) ORDER BY package_id,currency) FROM twuanis_canonical_private.intelligence_package_prices p),'offers',(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM twuanis_canonical_private.offers o),'rights',(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM twuanis_canonical_private.intelligence_package_rights r))`);
 const before=protectedState();sql(file('supabase/migrations/047_spanish_package_commercial_copy.sql'));
 ok(protectedState()===before,'all nontranslation commercial authority unchanged');
 const copy=JSON.parse(file('outputs/commercial-administrative/STEP-11-spanish-copy.json'));
 const catalog=JSON.parse(sql('SELECT public.read_customer_package_catalog()'));
 for(const row of copy){const p=catalog.find(x=>x.id===row.id);for(const key of ['name_en','name_es','question_en','question_es'])ok(p[key]===row[key],'canonical '+row.id+' '+key);ok(p.capabilityLabels.length===p.capabilities.length,'same bilingual capability identity '+row.id)}
 const copied=sql('SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM twuanis_canonical_private.intelligence_packages p');sql(file('supabase/migrations/047_spanish_package_commercial_copy.sql'));ok(sql('SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM twuanis_canonical_private.intelligence_packages p')===copied,'exact installer replay no revision/configuration churn');
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SET ROLE ${role};SELECT public.read_customer_package_catalog()` )!== '[]','reviewed public catalog role '+role);
 for(const row of copy){const projected=JSON.parse(sql(`SELECT twuanis_canonical_private.customer_product_copy('package','${row.id}')`));ok(projected.nameES===row.name_es,'Order and benefit labels consume canonical Spanish '+row.id)}
 // Emit non-secret local fixture evidence for the real Next route integration harness.
 const pricesUSD=JSON.parse(sql(`SELECT jsonb_agg(twuanis_canonical_private.resolve_offer_price('package',id,'USD',1,clock_timestamp())||jsonb_build_object('productId',id,'standardPrice',(SELECT amount::text FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p.id AND currency='USD'),'effectivePrice',(SELECT amount::text FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p.id AND currency='USD'))) FROM twuanis_canonical_private.intelligence_packages p`));
 const pricesCRC=JSON.parse(sql(`SELECT jsonb_agg(twuanis_canonical_private.resolve_offer_price('package',id,'CRC',1,clock_timestamp())||jsonb_build_object('productId',id,'standardPrice',(SELECT amount::text FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p.id AND currency='CRC'),'effectivePrice',(SELECT amount::text FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p.id AND currency='CRC'))) FROM twuanis_canonical_private.intelligence_packages p`));
 fs.writeFileSync('/private/tmp/step11-canonical-browser-data.json',JSON.stringify({catalog,pricesUSD,pricesCRC}));
 const result={status:'PASS',checks:n,scope:'Canonical Spanish copy installed only in owned disposable PostgreSQL; no changed product configuration, price, term, capability, Offer or right'};fs.writeFileSync(root+'/outputs/commercial-administrative/STEP-11-copy-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
