'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step11-access-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55461','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55461 -c listen_addresses=`,'start']);started=true;
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
 // Historical installation fixture omits these exported legacy authority columns.
 sql(`ALTER TABLE public.entitlements ADD COLUMN is_active boolean DEFAULT true;
 ALTER TABLE public.package_entitlements ADD COLUMN boolean_value boolean DEFAULT false;`);
 const legacyPackage=crypto.randomUUID(),ent=crypto.randomUUID();
 sql(`INSERT INTO public.packages(id,slug)VALUES('${legacyPackage}','market-pricing-intelligence');
 INSERT INTO public.entitlements(id,slug,is_active)VALUES('${ent}','price-m2-intelligence',true);
 INSERT INTO public.package_entitlements(package_id,entitlement_id,boolean_value)VALUES('${legacyPackage}','${ent}',true);`);
 const people=Array.from({length:8},()=>crypto.randomUUID());
 for(const id of people)sql(`INSERT INTO auth.users(id)VALUES('${id}');UPDATE public.user_subscriptions SET status='cancelled' WHERE user_id='${id}';`);
 function subscription(who,values={}){const id=crypto.randomUUID();sql(`INSERT INTO public.user_subscriptions(id,user_id,package_id,status,billing_cycle,current_period_start,current_period_end) VALUES('${id}','${who}','${legacyPackage}','${values.status||'active'}','monthly',clock_timestamp()-interval '1 day',${values.end||"clock_timestamp()+interval '10 days'"})`);return id}
 const good=subscription(people[0]),expired=subscription(people[1],{end:"clock_timestamp()-interval '1 hour'"}),cancelled=subscription(people[2],{status:'cancelled'}),unbounded=subscription(people[3],{end:'NULL'});
 subscription(people[4],{end:"clock_timestamp()+interval '1 second'"});
 sql(file('supabase/migrations/044_legacy_package_access_transition.sql'));
 const has=(who,c)=>run(who,`SELECT public.current_account_has_capability('${c}')`)==='t';
 ok(!has(people[0],'cap-weighted-price-m2'),'installation does not activate bridge');
 const before=sql(`SELECT jsonb_build_array((SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots),(SELECT count(*) FROM twuanis_canonical_private.entitlement_terms),(SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements))`);
 const legacyValuation=who=>run(who,'SELECT public.current_account_has_legacy_valuation_access()')==='t';
 const transition=sql('SELECT twuanis_canonical_private.capture_legacy_package_transition()');
 ok(sql('SELECT twuanis_canonical_private.capture_legacy_package_transition()')===transition,'transition retry preserves original timestamp and cohort');
 const caps=JSON.parse(sql(`SELECT to_json(capabilities) FROM twuanis_canonical_private.legacy_package_access WHERE subscription_id='${good}'`));
 ok(legacyValuation(people[0]),'captured legacy valuation operation retained');ok(!legacyValuation(owner),'Owner alone cannot use legacy valuation');ok(!legacyValuation(customer),'uncaptured legacy valuation denied');
 ok(caps.length===11,'exact eleven former protected capabilities captured');
 for(const cap of caps)ok(has(people[0],cap),'retains '+cap);
 for(const cap of ['cap-market-summary','cap-market-composition','cap-market-asking-price-distribution','cap-property-matching','cap-market-comparison','cap-property-configuration-frequency'])ok(!has(people[0],cap),'no formerly public capability windfall '+cap);
 for(const id of people.slice(1,4))ok(!has(id,'cap-weighted-price-m2'),'invalid/expired/open-ended denied');
 ok(!has(customer,'cap-weighted-price-m2'),'wrong product denied');ok(!has(people[5],'cap-weighted-price-m2'),'other account denied');ok(!has(owner,'cap-weighted-price-m2'),'Owner has no fallback');
 sql(`INSERT INTO twuanis_canonical_private.administrators(user_id)VALUES('${people[5]}');`);ok(!has(people[5],'cap-weighted-price-m2'),'Admin has no fallback');
 rejects(()=>subscription(people[6]),'new legacy subscription denied');
 rejects(()=>sql(`UPDATE public.user_subscriptions SET current_period_end=current_period_end+interval '1 day' WHERE id='${good}'`),'extension denied');
 rejects(()=>sql(`UPDATE public.user_subscriptions SET status='active' WHERE id='${cancelled}'`),'reactivation denied');
 rejects(()=>sql(`UPDATE public.user_subscriptions SET current_period_start=clock_timestamp() WHERE id='${good}'`),'term reset denied');
 ok(sql(`SELECT jsonb_build_array((SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots),(SELECT count(*) FROM twuanis_canonical_private.entitlement_terms),(SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements))`)===before,'no fabricated canonical financial/right provenance');
 sql('SELECT pg_sleep(1.1)');ok(!has(people[4],'cap-weighted-price-m2'),'natural sunset without job or mutation');
 for(const role of ['anon','authenticated','service_role']){
 ok(sql(`SELECT NOT has_function_privilege('${role}','twuanis_canonical_private.capture_legacy_package_transition()','EXECUTE')`)==='t','runtime cannot capture '+role);
 ok(sql(`SELECT NOT has_table_privilege('${role}','twuanis_canonical_private.legacy_package_access','INSERT,UPDATE,DELETE,TRUNCATE')`)==='t','runtime cannot fabricate '+role);
 }
 rejects(()=>sql('UPDATE twuanis_canonical_private.package_access_transition SET transitioned_at=now()'),'timestamp immutable');
 rejects(()=>sql('TRUNCATE twuanis_canonical_private.legacy_package_access'),'cohort immutable');
 // Actual canonical grant and paid fulfillment still authorize independently.
 const pkg='pkg-geographic-distribution-price-range',cfg=sql(`SELECT current_configuration_id FROM twuanis_canonical_private.intelligence_packages WHERE id='${pkg}'`);
 const granted=JSON.parse(run(owner,`SELECT public.admin_entitlement_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'grant',confirmed:true,accountId:people[0],productClass:'PACKAGE',productId:pkg,configurationId:cfg,startMode:'immediate',durationDays:'3',reason:'CUSTOMER_SERVICE'}))})`));
 ok(has(people[0],'cap-market-summary'),'canonical Admin grant works without legacy fallback');
 ok(has(people[0],'cap-weighted-price-m2'),'legacy and canonical rights coexist without replacement');
 sql(`UPDATE public.user_subscriptions SET status='cancelled',cancelled_at=clock_timestamp() WHERE id='${good}'`);ok(!has(people[0],'cap-weighted-price-m2'),'cancellation removes grandfathered authority');ok(!legacyValuation(people[0]),'cancelled legacy valuation denied');
 ok(has(people[0],'cap-market-summary'),'legacy cancellation preserves canonical grant');
 const bank=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts(id,currency,instructions_en,instructions_es,enabled)VALUES('${bank}','USD','Disposable test only','Solo prueba desechable',true)`);
 const order=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${people[0]}','${crypto.randomUUID()}','package','${pkg}','USD')`));
 const attempt=run(people[0],`SELECT public.submit_order_sinpe('${order.id}','${crypto.randomUUID()}','${bank}','{"reference":"fixture","senderName":"fixture"}')`);
 run(owner,`SELECT public.review_order_sinpe('${attempt}','${crypto.randomUUID()}',${lit(JSON.stringify({disposition:'APPROVED',reason:'verified',receivingAccount:bank,bankReference:crypto.randomUUID(),amount:order.terms.total,currency:'USD',receivedAt:new Date().toISOString(),bankEvidence:'Owned isolated fixture'}))})`);
 const fulfilled=JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${order.id}','${crypto.randomUUID()}')`));ok(fulfilled.state==='COMPLETE','canonical paid Package fulfillment preserved');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.intelligence_package_rights WHERE account_id='${people[0]}'`)==='2','independent canonical rights coexist');
 run(owner,`SELECT public.admin_entitlement_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'revoke',confirmed:true,id:granted.id,reason:'OTHER',note:'disposable fixture'}))})`);ok(has(people[0],'cap-market-summary'),'purchased survives grant revocation');
 const result={status:'PASS',checks:n,scope:'Step11 grandfathered access; owned socket-only PostgreSQL; no production'};
 fs.writeFileSync(root+'/outputs/commercial-administrative/STEP-11-access-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
