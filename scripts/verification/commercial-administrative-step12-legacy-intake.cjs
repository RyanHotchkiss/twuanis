'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step12-legacy-probe-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55469','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55469 -c listen_addresses=`,'start']);started=true;
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

 const live=JSON.parse(file('outputs/commercial-administrative/step12/legacy-intake-production-lossless.json'));
 sql(live.definition);sql('GRANT EXECUTE ON FUNCTION public.create_subscription_upgrade_request(uuid,text,text,text,text,timestamptz) TO authenticated');
 const pkg=crypto.randomUUID();sql(`INSERT INTO public.packages(id,slug,billing_interval,is_active,price_usd,price_crc) VALUES('${pkg}','step12-fixture','monthly',true,20,10000)`);
 ok(sql('SELECT enabled FROM twuanis_canonical_private.customer_commerce_control')==='f','intake disabled');
 const result=run(customer,`SELECT row_to_json(x) FROM public.create_subscription_upgrade_request('${pkg}','USD','LOCAL-NOT-BANK','Disposable fixture',NULL,clock_timestamp()) x`);
 ok(sql(`SELECT count(*) FROM public.user_subscriptions WHERE user_id='${customer}' AND package_id='${pkg}' AND status='pending_payment'`)==='1','legacy subscription created despite disabled intake');
 ok(sql(`SELECT count(*) FROM public.sinpe_payments WHERE user_id='${customer}' AND sinpe_reference='LOCAL-NOT-BANK' AND canonical_order_id IS NULL`)==='1','legacy submission created despite disabled intake');
 fs.writeFileSync(root+'/outputs/commercial-administrative/step12/legacy-intake-reproduction.json',JSON.stringify({status:'DEFECT_REPRODUCED',checks:n,scope:'Exact read-only production function reproduced only in disposable PostgreSQL; no production financial invocation',result},null,2));console.log('DEFECT_REPRODUCED: disabled intake bypass, disposable database only');
 sql('ALTER TABLE public.sinpe_payments ENABLE ROW LEVEL SECURITY;GRANT INSERT,SELECT ON public.sinpe_payments TO authenticated');
 sql(`CREATE POLICY step12_legacy_own_insert ON public.sinpe_payments FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id AND status='submitted');CREATE POLICY step12_legacy_own_select ON public.sinpe_payments FOR SELECT TO authenticated USING(auth.uid()=user_id)`);
 const sub=JSON.parse(result).subscription_id;
 const direct=()=>run(customer,`INSERT INTO public.sinpe_payments(user_id,subscription_id,amount,currency,sinpe_reference,sender_name,payment_date,status)VALUES('${customer}','${sub}',20,'USD','LOCAL-DIRECT','Fixture',clock_timestamp(),'submitted') RETURNING id`);
 ok(!!direct(),'direct legacy INSERT also bypasses disabled intake before repair');
 const records=()=>sql(`SELECT jsonb_build_array((SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM public.user_subscriptions x),(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM public.sinpe_payments x),(SELECT jsonb_agg(to_jsonb(x) ORDER BY id) FROM twuanis_canonical_private.offer_paid_acknowledgements x))`);
 const history=records();const migration=file('supabase/migrations/049_legacy_customer_intake_gate.sql');
 const security=()=>sql(`SELECT jsonb_build_array(proowner,prosecdef,proconfig,proacl) FROM pg_proc WHERE oid='public.create_subscription_upgrade_request(uuid,text,text,text,text,timestamptz)'::regprocedure`);const sec=security();
 sql(migration);ok(records()===history,'repair preserves historical financial and subscription rows');ok(security()===sec,'existing function ownership/security/searchpath/execute unchanged');
 const denied=fn=>{try{fn();throw Error('unexpected success')}catch(e){ok(String(e.stderr||e).includes('customer commerce unavailable'),'intake RPC fails on authoritative disabled control')}};
 denied(()=>run(customer,`SELECT * FROM public.create_subscription_upgrade_request('${pkg}','USD','LOCAL-BLOCKED','Fixture',NULL,clock_timestamp())`));
 rejects(()=>direct(),'direct authenticated legacy INSERT denied with disabled intake');ok(records()===history,'denied writes change no financial history');
 ok(run(customer,'SELECT count(*) FROM public.sinpe_payments')!=='0','historical own evidence remains readable');
 const newDef=sql(`SELECT pg_get_functiondef('public.create_subscription_upgrade_request(uuid,text,text,text,text,timestamptz)'::regprocedure)`);sql(migration);ok(sql(`SELECT pg_get_functiondef('public.create_subscription_upgrade_request(uuid,text,text,text,text,timestamptz)'::regprocedure)`)===newDef,'repair replay stable');
 // Gate enabled only in disposable fixture: no change to preexisting function semantics.
 sql('UPDATE twuanis_canonical_private.customer_commerce_control SET enabled=true');
 const other=crypto.randomUUID();sql(`INSERT INTO auth.users(id) VALUES('${other}')`);
 ok(!!run(other,`SELECT * FROM public.create_subscription_upgrade_request('${pkg}','USD','LOCAL-ENABLED','Fixture',NULL,clock_timestamp())`),'original legacy behavior retained only under enabled intake');
 ok(!!direct(),'existing direct policy behavior retained only under enabled intake');
 sql('UPDATE twuanis_canonical_private.customer_commerce_control SET enabled=false');denied(()=>run(other,`SELECT * FROM public.create_subscription_upgrade_request('${pkg}','USD','LOCAL-REDISABLED','Fixture',NULL,clock_timestamp())`));
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements')==='0','no canonical paid acknowledgement manufactured by repair');
 const verification={status:'PASS',checks:n,scope:'Disabled legacy RPC and direct-table intake reproduction/repair; disposable only; legacy evidence and enabled behavior preserved'};fs.writeFileSync(root+'/outputs/commercial-administrative/step12/legacy-intake-verification.json',JSON.stringify(verification,null,2));console.log(JSON.stringify(verification));

 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
