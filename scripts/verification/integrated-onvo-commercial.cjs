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
 sql('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz');sql(file('supabase/migrations/055_package_daily_access_options.sql'));let historicalOrder;const historicalAccount=crypto.randomUUID();sql(`INSERT INTO auth.users(id)VALUES('${historicalAccount}')`);historicalOrder=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${historicalAccount}','${crypto.randomUUID()}','pkg-matching-market-comparison','USD','month')`));const historicalBytes=JSON.stringify(historicalOrder.terms);for(const f of ['056_intelligence_package_hierarchy.sql','057_onvo_automated_payment_authority.sql','058_sinpe_purchase_notifications.sql'])sql(file('supabase/migrations/'+f));
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
 const capFixture=JSON.parse(sql('SELECT jsonb_agg(jsonb_build_object(\'package\',package_id,\'configuration\',id,\'capabilities\',capabilities)) FROM twuanis_canonical_private.intelligence_package_configurations'));fs.writeFileSync(root+'/outputs/commercial/onvo-local/hierarchical-package-configurations.json',JSON.stringify(capFixture,null,2)+'\n');

 const lengths=JSON.parse(sql(`SELECT jsonb_object_agg(p.id,cardinality(c.capabilities)) FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=p.current_configuration_id`));ok(lengths['pkg-geographic-distribution-price-range']===3,'Package1exact3');ok(lengths['pkg-matching-market-comparison']===7,'Package2exact7');ok(lengths[pkg]===17,'Package3exact17');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.intelligence_package_configurations WHERE id IN('04000000-0000-4000-8000-000000000001','04000000-0000-4000-8000-000000000002','04000000-0000-4000-8000-000000000003')`)==='3','historicalconfigsretained');
 const service=(op,data)=>JSON.parse(sql(`SELECT public.onvo_service_command('${op}',${lit(JSON.stringify(data))})`));
 const crcBank=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts(id,currency,instructions_en,instructions_es,enabled)VALUES('${crcBank}','CRC','Owned fixture only','Solo local',true);UPDATE twuanis_canonical_private.customer_commerce_control SET enabled=true;`);
 function automated(duration='day'){
 const account=fresh();sql(`UPDATE auth.users SET email_confirmed_at=clock_timestamp()WHERE id='${account}'`);const o=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${account}','${crypto.randomUUID()}','${pkg}','CRC','${duration}')`));
 const reservation={orderId:o.id,accountId:account,providerAccount:'fixture-merchant',mode:'test',receivingAccount:crcBank};ok(service('reserve',reservation).create,'intentcreationclaimedonce');ok(!service('reserve',reservation).create,'unknownPOSTnotrepeated');const intent='intent_'+crypto.randomUUID();service('bind',{orderId:o.id,intentId:intent});ok(service('confirmation',{orderId:o.id}).confirm,'confirmationclaimedonce');ok(!service('confirmation',{orderId:o.id}).confirm,'confirmationretrydoesnotrepeatPOST');return{account,o,intent};
 }
 function receipt(a,changes={}){return {orderId:a.o.id,intentId:a.intent,providerAccount:'fixture-merchant',mode:'test',transactionId:'transfer_'+crypto.randomUUID(),reference:'ref_'+crypto.randomUUID(),receivedAt:new Date().toISOString(),amount:a.o.terms.total,currency:'CRC',...changes}}
 const auto=automated(),evidence=receipt(auto),approved=service('receipt',evidence);ok(approved.disposition==='APPROVED','automaticpaidack');ok(service('receipt',evidence).id===approved.id,'providertransactionretryidempotent');
 const done=service('fulfill',{orderId:auto.o.id});ok(done.state==='COMPLETE','automaticcanonicalfulfillment');ok(service('fulfill',{orderId:auto.o.id}).replayed,'durablefulfillmentretry');
 const autoTerm=getTerm(auto.o.id);ok(autoTerm.actor_id===null&&autoTerm.execution_authority==='ONVO','no fabricatedhumanreviewer');ok(Date.parse(autoTerm.ends_at)-Date.parse(autoTerm.starts_at)===86400000,'automateddaily24hours');ok(access(auto.account),'automatedhierarchicalcapabilityauthorized');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id='${auto.o.id}'`)==='1','oneownerobligationperpaidOrder');
 const unmatched=automated();ok(service('receipt',receipt(unmatched,{amount:'1.00'})).disposition==='RECEIVED_UNMATCHED','verifiedmoneyunderpaymentpreserved');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${unmatched.o.id}'`)==='0','unmatchednoack');
 const missing=automated();ok(service('receipt',receipt(missing,{receivedAt:null})).disposition==='NEEDS_RESOLUTION','missingreceipttimenoarrivalfallback');
 const wrong=automated();assert.throws(()=>service('receipt',receipt(wrong,{transactionId:evidence.transactionId,reference:evidence.reference})));n++;
 const inbox=service('inbox',{digest:'a'.repeat(64),event:{type:'payment-intent.succeeded',intentId:auto.intent}});ok(service('inbox',{digest:'a'.repeat(64),event:{type:'payment-intent.succeeded',intentId:auto.intent}}).id===inbox.id,'durablewebhookdedup');
 const claim=JSON.parse(sql("SELECT public.sinpe_notification_service('claim','{}')"));ok(claim.recipient==='ryanjonhotchkiss@gmail.com','fixedownerrecipient');const payloadBefore=JSON.stringify(claim.payload);
 sql(`SELECT public.sinpe_notification_service('finish',${lit(JSON.stringify({orderId:claim.orderId,token:claim.token,outcome:'RETRY'}))})`);ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${claim.orderId}'`)==='1','emailfailuredoesnotunpay');
 sql(`UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET next_attempt=clock_timestamp()-interval '1 hour' WHERE order_id='${claim.orderId}'`);const retryNotice=JSON.parse(sql("SELECT public.sinpe_notification_service('claim','{}')"));ok(retryNotice.orderId===claim.orderId&&JSON.stringify(retryNotice.payload)===payloadBefore,'notificationretryfrozenpayload');
 sql(`SELECT public.sinpe_notification_service('finish',${lit(JSON.stringify({orderId:retryNotice.orderId,token:retryNotice.token,outcome:'ACCEPTED',messageId:'LOCAL_MOCK_ONLY'}))})`);ok(sql(`SELECT state FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id='${claim.orderId}'`)==='ACCEPTED','mockprovideracceptanceonlynotactualdelivery');
 for(const role of ['anon','authenticated'])for(const signature of ['public.onvo_service_command(text,jsonb)','public.sinpe_notification_service(text,jsonb)','public.onvo_reconciliation_service(text,jsonb)'])ok(sql(`SELECT NOT has_function_privilege('${role}','${signature}','EXECUTE')`)==='t','runtimefinancialdenial'+role+signature);
 for(const table of ['onvo_intents','onvo_receipts','onvo_inbox','onvo_fulfillment_jobs','sinpe_purchase_notifications','sinpe_external_claims'])for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT NOT has_table_privilege('${role}','twuanis_canonical_private.${table}','INSERT,UPDATE,DELETE,TRUNCATE')`)==='t','no directfinancialmutation'+role+table);

 const historyAttempt=run(historicalAccount,`SELECT public.submit_order_sinpe('${historicalOrder.id}','${crypto.randomUUID()}','${bank}','{"reference":"fixture","senderName":"fixture"}')`);
 run(owner,`SELECT public.review_order_sinpe('${historyAttempt}','${crypto.randomUUID()}',${lit(JSON.stringify({disposition:'APPROVED',reason:'verified',receivingAccount:bank,bankReference:crypto.randomUUID(),amount:historicalOrder.terms.total,currency:'USD',receivedAt:new Date().toISOString(),bankEvidence:'Historical local fixture'}))})`);
 ok(JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${historicalOrder.id}','${crypto.randomUUID()}')`)).state==='COMPLETE','oldconfigurationOrderfulfillsafterhierarchy');
 ok(JSON.stringify(JSON.parse(sql(`SELECT resolved_terms FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${historicalOrder.id}'`)))===historicalBytes,'oldOrdersnapshotunchanged');ok(run(historicalAccount,"SELECT public.current_account_has_capability('cap-market-summary')")==='f','oldrightdoesnotgainnewcapabilityretroactively');
 assert.throws(()=>sql(`INSERT INTO twuanis_canonical_private.intelligence_package_configurations(package_id,version,term_quantity,term_unit,capabilities)VALUES('${pkg}',10,1,'month',ARRAY['cap-weighted-price-m2','cap-weighted-price-m2'])`));n++;
 assert.throws(()=>sql(`INSERT INTO twuanis_canonical_private.intelligence_package_configurations(package_id,version,term_quantity,term_unit,capabilities)VALUES('${pkg}',10,1,'month',ARRAY['cap-unknown'])`));n++;
 const delayedAccount=fresh(),expiredOrder=crypto.randomUUID(),expiredRequest=crypto.randomUUID(),expiredIntent='intent_'+crypto.randomUUID();const old=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${delayedAccount}','${crypto.randomUUID()}','${pkg}','CRC','day')`));
 sql(`INSERT INTO twuanis_canonical_private.offer_order_snapshots(id,account_id,request_id,target_type,product_id,currency,resolved_terms,created_at,payment_deadline)VALUES('${expiredOrder}','${delayedAccount}','${expiredRequest}','package','${pkg}','CRC',${lit(JSON.stringify(old.terms))},statement_timestamp()-interval '25 hours',statement_timestamp()-interval '1 hour')`);
 sql(`INSERT INTO twuanis_canonical_private.onvo_intents(order_id,provider_account,mode,receiving_account,intent_id,state)VALUES('${expiredOrder}','fixture-merchant','test','${crcBank}','${expiredIntent}','BOUND')`);
 const deadline=sql(`SELECT payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${expiredOrder}'`),early=new Date(Date.parse(deadline)-60000).toISOString();const delayed=service('receipt',{orderId:expiredOrder,intentId:expiredIntent,providerAccount:'fixture-merchant',mode:'test',transactionId:'late_delivery_'+crypto.randomUUID(),reference:crypto.randomUUID(),receivedAt:early,amount:old.terms.total,currency:'CRC'});
 ok(delayed.disposition==='APPROVED','timelyproviderreceiptapprovedafterdeadline');
 ok(service('receipt',{orderId:expiredOrder,intentId:expiredIntent,providerAccount:'fixture-merchant',mode:'test',transactionId:'late_money_'+crypto.randomUUID(),reference:crypto.randomUUID(),receivedAt:new Date(Date.parse(deadline)+1).toISOString(),amount:old.terms.total,currency:'CRC'}).disposition==='RECEIVED_UNMATCHED','latefundsfailclosed');
 const unknown=service('unassociated',{digest:'b'.repeat(64),receivingAccount:crcBank,providerAccount:'fixture-merchant',mode:'test',transactionId:'unknown_transfer',reference:'unassociated_reference',amount:'500',currency:'CRC',receivedAt:new Date().toISOString()});ok(unknown.state==='NEEDS_RESOLUTION','unassociatedreceivedmoneydurable');
 const attemptForClaim=automated(),lateAttempt=run(attemptForClaim.account,`SELECT public.submit_order_sinpe('${attemptForClaim.o.id}','${crypto.randomUUID()}','${crcBank}','{"reference":"unassociated_reference","senderName":"fixture"}')`);
 assert.throws(()=>run(owner,`SELECT public.review_order_sinpe('${lateAttempt}','${crypto.randomUUID()}',${lit(JSON.stringify({disposition:'APPROVED',reason:'verified',receivingAccount:crcBank,bankReference:'unassociated_reference',amount:attemptForClaim.o.terms.total,currency:'CRC',receivedAt:new Date().toISOString(),bankEvidence:'Owned fixture'}))})`));n++;
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${attemptForClaim.o.id}'`)==='0','sharedbankeventcannotreusedbymanualreview');
 const futureTime=new Date(Date.now()+60000).toISOString();assert.throws(()=>service('receipt',receipt(automated(),{receivedAt:futureTime})));n++;
 const controlBefore=sql(`SELECT to_jsonb(c) FROM twuanis_canonical_private.customer_commerce_control c`);ok(JSON.parse(controlBefore).enabled,'onlyownedlocalfixtureenabled');

 const ts=require(root+'/node_modules/typescript'),vm=require('vm'),modules={},fakeEnv={ONVO_RECEIVING_ACCOUNT_ID:crcBank,ONVO_RECONCILIATION_START:new Date(Date.now()-86400000).toISOString(),RESEND_API_KEY:'LOCAL_FAKE_ONLY',EMAIL_FROM:'fixture@example.test'};let mailFail=true,mailCount=0;
 const fakeAdmin={rpc:async(name,payload)=>{try{return{data:JSON.parse(sql(`SELECT public.${name}('${payload.p_operation}',${lit(JSON.stringify(payload.p_command))})`)),error:null}}catch{return{data:null,error:{message:'LOCAL_FAILURE'}}}}};
 function load(relative){if(modules[relative])return modules[relative];const mod={exports:{}};vm.runInNewContext(ts.transpileModule(file(relative),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:mod.exports,module:mod,process:{env:fakeEnv},fetch,Response,Request,URLSearchParams,AbortSignal,TextDecoder,Date,BigInt,require:id=>id==='server-only'?{}:id==='@/lib/supabase-admin'?{supabaseAdmin:fakeAdmin}:id==='@/lib/email'?{sendSinpePurchaseNotification:async()=>{mailCount++;if(mailFail)throw Error('LOCAL_MOCK_FAILURE');return'LOCAL_MOCK_PROVIDER_ACCEPTANCE'}}:id==='./onvo-sinpe'?load('lib/providers/onvo-sinpe.ts'):require(id)});return modules[relative]=mod.exports;}
 const provider=load('lib/providers/onvo-sinpe.ts'),automation=load('lib/providers/onvo-automation.ts'),serverAccount=fresh();sql(`UPDATE auth.users SET email_confirmed_at=clock_timestamp() WHERE id='${serverAccount}'`);
 const serverOrder=JSON.parse(sql(`SELECT twuanis_canonical_private.create_package_access_order('${serverAccount}','${crypto.randomUUID()}','${pkg}','CRC','day')`)),ctx={mode:'test',accountId:'fixture-merchant',secretKey:'onvo_test_secret_key_LOCAL',webhookSecret:'webhook_secret_LOCAL'},requests=[];let intentValue,transferValue;
 const httpRequest=async(url,options)=>{requests.push({url,method:options.method});ok(options.headers.Authorization==='Bearer '+ctx.secretKey,'adapterserverauth');ok(options.redirect==='error'&&options.cache==='no-store','no unsafe redirectorcache');let result;
 if(url.endsWith('/payment-intents')){const body=JSON.parse(options.body);intentValue={id:'server_intent_'+crypto.randomUUID(),accountId:ctx.accountId,mode:'test',currency:'CRC',amount:body.amount,receivedAmount:body.amount,status:'succeeded',metadata:body.metadata};result=intentValue}
 else if(url.endsWith('/payment-methods'))result={id:'LOCAL_METHOD'};
 else if(url.endsWith('/confirm')){transferValue={id:'server_transfer_'+crypto.randomUUID(),mode:'test',paymentIntentId:intentValue.id,status:'received',amount:intentValue.amount,currency:'CRC',SINPERefNumber:'server_reference_'+crypto.randomUUID(),createdAt:new Date().toISOString()};result=intentValue}
 else if(url.includes('/mobile-transfers/list'))result={data:[transferValue],meta:{hasMore:false,total:1}};
 else result=intentValue;return Response.json(result);
 };
 const execute=async(op,data)=>service(op,data),cursor=async(op,data)=>JSON.parse(sql(`SELECT public.onvo_reconciliation_service('${op}',${lit(JSON.stringify(data))})`));const engine=new automation.OnvoAutomation(ctx,new provider.OnvoSinpeAdapter(ctx,httpRequest),execute,cursor),payer={number:'+50688880000',identification:'01-1393-1919',identificationType:0};
 ok((await engine.initiate(serverOrder.id,serverAccount,payer,crcBank)).state==='PENDING','actualcoordinatorcreatesboundintent');await engine.initiate(serverOrder.id,serverAccount,payer,crcBank);ok(requests.filter(r=>r.method==='POST').length===3,'intentmethodconfirmnotrepeatedonretry');
 const raw=JSON.stringify({type:'payment-intent.succeeded',data:{id:intentValue.id}}),eventId=(await engine.ingest(raw,ctx.webhookSecret)).id;ok((await engine.ingest(raw,ctx.webhookSecret)).id===eventId,'actualauthenticatedinboxingdedup');await assert.rejects(()=>engine.ingest(raw,'invalid'));n++;
 await engine.processEvent({intentId:intentValue.id});ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${serverOrder.id}'`)==='1','actualreadbacktoSQLpaidack');ok(getTerm(serverOrder.id).actor_id===null,'actualadaptertoautomaticentitlementnofakereviewer');await engine.processTransfer(transferValue);ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${serverOrder.id}'`)==='1','differentnotificationssamepaymentnoextrafulfillment');
 await engine.run();ok(sql(`SELECT count(*) FROM twuanis_canonical_private.onvo_reconciliation WHERE provider_account='fixture-merchant'`)==='1','actualboundedreconciliationcursorpersisted');
 const noticesBefore=sql('SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements');ok((await automation.deliverSinpeNotification()).state==='RETRY','actualdeliveryfailurepersisted');ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements')===noticesBefore,'emailfailureindependentoffinancialtruth');mailFail=false;
 sql("UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET next_attempt=clock_timestamp()-interval '1 hour' WHERE state='RETRY'");ok((await automation.deliverSinpeNotification()).state==='ACCEPTED','actualworkerretrywithmockemail');ok(mailCount===2,'deliveryattemptsexercisednotrealemail');

 const raceA=automated(),raceB=automated(),raceTransaction='concurrent_'+crypto.randomUUID(),raceReference=crypto.randomUUID();
 function parallelCommand(data){return new Promise((resolve,reject)=>{const child=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55461','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('close',code=>code?reject(Error('expected conflicting external event')):resolve(out));child.stdin.end(`BEGIN;SELECT public.onvo_service_command('receipt',${lit(JSON.stringify(data))});SELECT pg_sleep(.1);COMMIT;`);});}
 const race=await Promise.allSettled([parallelCommand(receipt(raceA,{transactionId:raceTransaction,reference:raceReference})),parallelCommand(receipt(raceB,{transactionId:raceTransaction,reference:raceReference}))]);ok(race.filter(x=>x.status==='fulfilled').length===1,'concurrentexternalpaymentsinglewinner');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id IN('${raceA.o.id}','${raceB.o.id}')`)==='1','raceonecanonicalpaidack');
 const monthAuto=automated('month');service('receipt',receipt(monthAuto));ok(service('fulfill',{orderId:monthAuto.o.id}).state==='COMPLETE','automaticmonthlyfulfillment');const monthlyTerm=getTerm(monthAuto.o.id);ok(sql(`SELECT ends_at=((starts_at AT TIME ZONE 'America/Costa_Rica')+interval '1 month') AT TIME ZONE 'America/Costa_Rica' FROM twuanis_canonical_private.entitlement_terms WHERE id='${monthlyTerm.id}'`)==='t','automaticmonthlycalendararithmetic');
 const escaped=fresh();ok(run(escaped,`SELECT public.read_my_onvo_payment('${auto.o.id}') IS NULL`)==='t','foreignaccountpaymentprojectiondenied');assert.throws(()=>run(escaped,'SELECT public.admin_onvo_operations()'));n++;
 const notificationRow=sql(`SELECT order_id FROM twuanis_canonical_private.sinpe_purchase_notifications LIMIT 1`);assert.throws(()=>sql(`UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET recipient='not-owner@example.test' WHERE order_id='${notificationRow}'`));n++;
 // Simulate an unacknowledged historical email attempt outside provider key retention.
 sql(`UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET first_attempt=clock_timestamp()-interval '25 hours',next_attempt=clock_timestamp()-interval '2 hours' WHERE order_id='${monthAuto.o.id}'`);
 sql("SELECT public.sinpe_notification_service('claim','{}')");ok(sql(`SELECT state FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id='${monthAuto.o.id}'`)==='NEEDS_RESOLUTION','no duplicateemailsafterprovideridempotencywindow');
 const retryAuto=automated();service('receipt',receipt(retryAuto));sql("CREATE FUNCTION public.fixture_entitlement_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture transient failure'; END $$;CREATE TRIGGER fixture_entitlement_failure BEFORE INSERT ON twuanis_canonical_private.entitlement_terms FOR EACH ROW EXECUTE FUNCTION public.fixture_entitlement_failure()");ok(service('fulfill',{orderId:retryAuto.o.id}).state==='PENDING','fulfillmentfailurepersistsretry');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${retryAuto.o.id}'`)==='1','fulfillmentfailurepreservespaidtruth');sql('DROP TRIGGER fixture_entitlement_failure ON twuanis_canonical_private.entitlement_terms;DROP FUNCTION public.fixture_entitlement_failure()');ok(service('fulfill',{orderId:retryAuto.o.id}).state==='COMPLETE','ordinaryretryaftertransientfailure');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${retryAuto.o.id}'`)==='1','retrysingleterm');
 const missingControl=fresh();sql(`UPDATE auth.users SET email_confirmed_at=clock_timestamp()WHERE id='${missingControl}';UPDATE twuanis_canonical_private.customer_commerce_control SET enabled=false`);assert.throws(()=>run(missingControl,`SELECT public.create_customer_package_order('${crypto.randomUUID()}','${pkg}','CRC','day')`));n++;
 const projection=JSON.parse(sql('SELECT public.read_customer_package_catalog()'));ok(projection.find(p=>p.id==='pkg-geographic-distribution-price-range').additionalCapabilityLabels.length===3,'Package1projection3');ok(projection.find(p=>p.id==='pkg-matching-market-comparison').additionalCapabilityLabels.length===4,'Package2presentationfourdelta');ok(projection.find(p=>p.id===pkg).additionalCapabilityLabels.length===10,'Package3presentationtendelta');
 const result={status:'PASS',checks:n,scope:'Real isolated PostgreSQL hierarchy, canonical Orders/acknowledgement/automated fulfillment and notification authority; no actual provider delivery'};
 fs.mkdirSync(root+'/outputs/commercial/onvo-local',{recursive:true});fs.writeFileSync(root+'/outputs/commercial/onvo-local/integrated-commercial.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
