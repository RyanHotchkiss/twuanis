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


 sql(`ALTER TABLE public.entitlements ADD COLUMN is_active boolean DEFAULT true;ALTER TABLE public.package_entitlements ADD COLUMN boolean_value boolean DEFAULT false;`);
 for(const f of ['044_legacy_package_access_transition.sql','045_prepublication_addon_orders.sql','046_customer_commercial_boundary.sql','054_continuous_purchased_package_terms.sql'])sql(file('supabase/migrations/'+f));
 sql('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz');sql(file('supabase/migrations/055_package_daily_access_options.sql'));
 const pkg='pkg-pricing-position-relationships',cfg=sql(`SELECT current_configuration_id FROM twuanis_canonical_private.intelligence_packages WHERE id='${pkg}'`);
 const fresh=()=>{const id=crypto.randomUUID();sql(`INSERT INTO auth.users(id)VALUES('${id}')`);return id};
 const interval=(who,unit,at)=>JSON.parse(sql(`SELECT row_to_json(x) FROM twuanis_canonical_private.purchased_package_interval('${who}','${pkg}','${unit}',1,'${at}')x`));
 function term(who,start,end,source='PURCHASED'){
 const request=crypto.randomUUID();let order='NULL',ack='NULL';
 if(source==='PURCHASED'){
  const o=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${who}','${request}','package','${pkg}','USD')`));order=lit(o.id);
  ack=lit(JSON.parse(sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${o.id}','${crypto.randomUUID()}','LOCAL_TEST','${crypto.randomUUID()}',${o.terms.total},'USD','Owned disposable fixture')`)).id);
 }
 return sql(`SELECT twuanis_canonical_private.commit_entitlement_term('${who}','PACKAGE','${pkg}','${cfg}',NULL,'${source}',${order},${ack},'${owner}','${request}','${start}','${end}',${source==='ADMIN_GRANT'?"'CUSTOMER_SERVICE'":'NULL'},NULL)`);
 }
 const at='2028-01-31T18:00:00Z',who=fresh();
 const day=interval(who,'day',at),month=interval(who,'month',at);
 ok(Date.parse(day.ends_at)-Date.parse(day.starts_at)===86400000,'daily exactly24elapsedhours');
 ok(Date.parse(month.ends_at)===Date.parse('2028-02-29T18:00:00Z'),'leapmonthendCostaRica');
 ok(Date.parse(interval(who,'month','2027-01-31T18:00:00Z').ends_at)===Date.parse('2027-02-28T18:00:00Z'),'nonleapmonthend');
 for(const [first,next] of [['day','day'],['day','month'],['month','day']]){
 const u=fresh(),a=interval(u,first,at);term(u,a.starts_at,a.ends_at);const b=interval(u,next,at);
 ok(Date.parse(b.starts_at)===Date.parse(a.ends_at),first+'/'+next+'appends');
 ok(next==='day'?Date.parse(b.ends_at)-Date.parse(b.starts_at)===86400000:Date.parse(b.ends_at)>Date.parse(b.starts_at),first+'/'+next+'fullterm');
 }
 const g=fresh(),grant=term(g,'2028-01-31T19:00:00Z','2028-02-02T19:00:00Z','ADMIN_GRANT');
 const before=sql(`SELECT row_to_json(t) FROM twuanis_canonical_private.entitlement_terms t WHERE id='${grant}'`);
 const overlap=interval(g,'day',at);ok(Date.parse(overlap.starts_at)===Date.parse(at),'futuregrantdoesnotpostpone');
 const purchased=term(g,overlap.starts_at,overlap.ends_at);ok(sql(`SELECT row_to_json(t) FROM twuanis_canonical_private.entitlement_terms t WHERE id='${grant}'`)===before,'grantdatesunchanged');
 sql(`INSERT INTO twuanis_canonical_private.entitlement_revocations(term_id,actor_id,request_id,reason,revoked_at)VALUES('${grant}','${owner}','${crypto.randomUUID()}','local fixture','2028-01-31T18:00:00Z')`);
 ok(Date.parse(interval(g,'day',at).starts_at)===Date.parse(overlap.ends_at),'grantrevocationpreservespurchasedtail');
 const gap=fresh();term(gap,'2028-02-10T18:00:00Z','2028-02-11T18:00:00Z');ok(Date.parse(interval(gap,'day',at).starts_at)===Date.parse(at),'disjointfuturepurchasedtermdoesnotpostpone');
 const chain=fresh();term(chain,at,'2028-02-01T18:00:00Z');term(chain,'2028-02-01T18:00:00Z','2028-02-02T18:00:00Z');ok(Date.parse(interval(chain,'day',at).starts_at)===Date.parse('2028-02-02T18:00:00Z'),'contiguousfutureextensionsincluded');
 const expired=fresh();term(expired,'2027-01-01T18:00:00Z','2027-01-02T18:00:00Z');ok(Date.parse(interval(expired,'day',at).starts_at)===Date.parse(at),'expiredcoverageignored');
 const revoked=fresh(),tid=term(revoked,at,'2028-02-02T18:00:00Z');sql(`INSERT INTO twuanis_canonical_private.entitlement_revocations(term_id,actor_id,request_id,reason,revoked_at)VALUES('${tid}','${owner}','${crypto.randomUUID()}','local fixture','2028-01-31T18:00:00Z')`);ok(Date.parse(interval(revoked,'day',at).starts_at)===Date.parse(at),'revokedcoverageignored');
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT NOT has_function_privilege('${role}','twuanis_canonical_private.purchased_package_interval(uuid,text,text,integer,timestamptz)','EXECUTE')`)==='t','privatehelperdenied'+role);
 assert.throws(()=>interval(who,'year',at));n++;

 const bank=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts(id,currency,instructions_en,instructions_es,enabled)VALUES('${bank}','USD','Local only','Solo local',true)`);
 function paid(who,duration){
 const o=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${who}','${crypto.randomUUID()}','${pkg}','USD','${duration}')`));
 const attempt=run(who,`SELECT public.submit_order_sinpe('${o.id}','${crypto.randomUUID()}','${bank}','{"reference":"fixture","senderName":"fixture"}')`);
 run(owner,`SELECT public.review_order_sinpe('${attempt}','${crypto.randomUUID()}',${lit(JSON.stringify({disposition:'APPROVED',reason:'verified',receivingAccount:bank,bankReference:crypto.randomUUID(),amount:o.terms.total,currency:'USD',receivedAt:new Date().toISOString(),bankEvidence:'Owned isolated fixture'}))})`);return o;
 }
 const real=fresh(),o1=paid(real,'day'),req=crypto.randomUUID();
 const f1=JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${o1.id}','${req}')`));ok(f1.state==='COMPLETE','realpaid daily fulfillment');
 const getTerm=id=>JSON.parse(sql(`SELECT row_to_json(t) FROM twuanis_canonical_private.entitlement_terms t WHERE order_id='${id}'`));
 const t1=getTerm(o1.id);ok(Date.parse(t1.ends_at)-Date.parse(t1.starts_at)===86400000,'committed daily exactduration');
 ok(JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${o1.id}','${req}')`)).evidence.termId===f1.evidence.termId,'same request replay');
 ok(JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${o1.id}','${crypto.randomUUID()}')`)).evidence.termId===f1.evidence.termId,'new retry no second term');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${o1.id}'`)==='1','oneOrderonecontribution');
 const o2=paid(real,'month');ok(JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${o2.id}','${crypto.randomUUID()}')`)).state==='COMPLETE','realmonthlyfulfilled');ok(getTerm(o2.id).starts_at===t1.ends_at,'real daily monthly stacks');
 const concurrent=fresh(),ca=paid(concurrent,'day'),cb=paid(concurrent,'day');
 function parallel(order){return new Promise((resolve,reject)=>{const child=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55461','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('close',code=>code?reject(Error(err)):resolve(out));child.stdin.end(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:owner,role:'authenticated'}))},true);SELECT public.retry_sinpe_fulfillment('${order.id}','${crypto.randomUUID()}');SELECT pg_sleep(.15);COMMIT;`);});}
 await Promise.all([parallel(ca),parallel(cb)]);
 const both=[getTerm(ca.id),getTerm(cb.id)].sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));ok(both[0].ends_at===both[1].starts_at,'independent-session concurrent purchases serialize');ok(both.every(t=>Date.parse(t.ends_at)-Date.parse(t.starts_at)===86400000),'concurrent purchases retain full duration');
 const access=who=>run(who,"SELECT public.current_account_has_capability('cap-weighted-price-m2')")==='t';ok(access(real),'committed daily/monthly configuredcapability');ok(!access(expired),'expiredterms deny analytical execution');
 const older=fresh();term(older,'2020-01-01T00:00:00Z','2020-01-02T00:00:00Z');ok(!access(older),'expiredonlyrightsdeny');
 const price=JSON.parse(sql(`SELECT public.read_package_daily_prices(ARRAY['${pkg}','pkg-geographic-distribution-price-range'],'CRC')`));ok(price.length===1&&price[0].amount==='2000','dailyapprovedpricesandPackage1notdaily');
 const request=crypto.randomUUID(),replay=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${real}','${request}','${pkg}','USD','day')`));ok(JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${real}','${request}','${pkg}','USD','day')`)).id===replay.id,'dailyOrder idempotency');assert.throws(()=>sql(`SELECT twuanis_canonical_private.create_package_access_order('${real}','${request}','${pkg}','USD','month')`));n++;
 assert.throws(()=>run(real,`SELECT public.create_customer_package_order('${crypto.randomUUID()}','${pkg}','USD','day')`));n++;

 // Canonical duration does not change capability membership: exercise all17 RPC checks.
 const allCaps=JSON.parse(sql('SELECT json_agg(id ORDER BY id) FROM twuanis_canonical_private.intelligence_capabilities'));
 for(const product of ['pkg-geographic-distribution-price-range','pkg-matching-market-comparison',pkg]){
 const recipients=[fresh(),fresh()],configuration=sql(`SELECT current_configuration_id FROM twuanis_canonical_private.intelligence_packages WHERE id='${product}'`),allowed=JSON.parse(sql(`SELECT to_json(capabilities) FROM twuanis_canonical_private.intelligence_package_configurations WHERE id='${configuration}'`));
 for(let i=0;i<recipients.length;i++){
 const duration=product==='pkg-geographic-distribution-price-range'?'month':i?'month':'day';const o=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${recipients[i]}','${crypto.randomUUID()}','${product}','USD','${duration}')`));
 const a=JSON.parse(sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${o.id}','${crypto.randomUUID()}','LOCAL_TEST','${crypto.randomUUID()}',${o.terms.total},'USD','Local capability fixture')`));
 const times=interval(recipients[i],duration,new Date().toISOString());
 sql(`SELECT twuanis_canonical_private.commit_entitlement_term('${recipients[i]}','PACKAGE','${product}','${configuration}',NULL,'PURCHASED','${o.id}','${a.id}','${owner}','${crypto.randomUUID()}','${times.starts_at}','${times.ends_at}',NULL,NULL)`);
 for(const capability of allCaps)ok((run(recipients[i],`SELECT public.current_account_has_capability('${capability}')`)==='t')===allowed.includes(capability),product+'/'+duration+'/'+capability);
 }
 }
 const leg=fresh(),legacyProduct=crypto.randomUUID(),subscription=crypto.randomUUID();
 sql(`UPDATE public.user_subscriptions SET status='cancelled' WHERE user_id='${leg}';INSERT INTO public.packages(id,slug)VALUES('${legacyProduct}','local-legacy-fixture');INSERT INTO public.user_subscriptions(id,user_id,package_id,status,billing_cycle,current_period_start,current_period_end)VALUES('${subscription}','${leg}','${legacyProduct}','active','monthly',clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 year');INSERT INTO twuanis_canonical_private.legacy_package_access(subscription_id,account_id,package_id,period_start,expires_at,captured_at,capabilities) SELECT id,user_id,package_id,current_period_start,current_period_end,clock_timestamp(),ARRAY['cap-weighted-price-m2'] FROM public.user_subscriptions WHERE id='${subscription}'`);
 const bridgeBefore=sql(`SELECT row_to_json(g) FROM twuanis_canonical_private.legacy_package_access g WHERE subscription_id='${subscription}'`),now=new Date().toISOString();ok(Date.parse(interval(leg,'day',now).starts_at)===Date.parse(now),'legacydoesnotpostponecanonicalpurchase');ok(access(leg),'legacyauthorizationretained');ok(sql(`SELECT row_to_json(g) FROM twuanis_canonical_private.legacy_package_access g WHERE subscription_id='${subscription}'`)===bridgeBefore,'legacyprovenanceunchanged');

 const committedMonthly=JSON.stringify(getTerm(o2.id));
 run(owner,`SELECT public.admin_entitlement_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'revoke',confirmed:true,id:t1.id,reason:'OTHER',note:'Owned fixture revocation'}))})`);
 ok(!access(real),'revokedcurrentpurchase denies until committedfutureterm');ok(JSON.stringify(getTerm(o2.id))===committedMonthly,'revocationdoesnotslidefuturepurchaseddates');
 const capFixture=JSON.parse(sql('SELECT jsonb_agg(jsonb_build_object(\'package\',package_id,\'configuration\',id,\'capabilities\',capabilities)) FROM twuanis_canonical_private.intelligence_package_configurations'));fs.writeFileSync(root+'/outputs/commercial/onvo-local/package-configurations.json',JSON.stringify(capFixture,null,2)+'\n');
 const result={status:'PASS',checks:n,scope:'Real socket-only PostgreSQL continuous purchased interval and committed-source tests; daily and monthly canonical Order/manual trusted fulfillment exercised; actual ONVO acceptance remains pending'};
 fs.mkdirSync(root+'/outputs/commercial/onvo-local',{recursive:true});fs.writeFileSync(root+'/outputs/commercial/onvo-local/continuous-entitlements.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
