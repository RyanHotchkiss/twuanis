'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step9-payments-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55459','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55459 -c listen_addresses=`,'start']);started=true;
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
 const pkg='pkg-geographic-distribution-price-range',acc=crypto.randomUUID();
 sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts(id,currency,instructions_en,instructions_es,enabled) VALUES('${acc}','USD','Disposable bank fixture','Banco de prueba',true)`);
 const order=()=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','package','${pkg}','USD')`));
 const evidence={reference:'CUSTOMER CLAIM',senderName:'Fixture'};
 const submit=(o,r=crypto.randomUUID(),e=evidence,who=customer)=>run(who,`SELECT public.submit_order_sinpe('${o}','${r}','${acc}',${lit(JSON.stringify(e))})`);
 const review=(p,c,r=crypto.randomUUID(),who=owner)=>JSON.parse(run(who,`SELECT public.review_order_sinpe('${p}','${r}',${lit(JSON.stringify(c))})`));
 const approved=(ref='BANK-1',at=new Date().toISOString())=>({disposition:'APPROVED',reason:'verified',receivingAccount:acc,bankReference:ref,amount:'10',currency:'USD',receivedAt:at,bankEvidence:'Verified exact timestamp and amount on receiving-bank statement fixture'});
 const rejects=(f,label)=>{assert.throws(f,undefined,label);n++};
 ok(sql(`SELECT (to_jsonb(p)-'canonical_order_id'-'submission_request_id'-'receiving_account_id'-'submission_evidence')=${lit(legacyBefore)}::jsonb FROM public.sinpe_payments p WHERE id='${legacyId}'`)==='t','historical legacy evidence unchanged');
 ok(sql(`INSERT INTO public.sinpe_payments(user_id,subscription_id,payment_date) VALUES('${customer}','${legacySubscription}',now()) RETURNING subscription_id` )===legacySubscription,'valid legacy subscription remains valid');
 rejects(()=>sql(`INSERT INTO public.sinpe_payments(user_id,subscription_id,payment_date) VALUES('${owner}','${legacySubscription}',now())`),'wrong legacy subscription owner rejected');
 rejects(()=>sql(`INSERT INTO public.sinpe_payments(user_id,subscription_id) VALUES('${customer}','${legacySubscription}')`),'legacy date still required');
 rejects(()=>sql(`INSERT INTO public.sinpe_payments(user_id,payment_date) VALUES('${customer}',now())`),'no commercial relationship rejected');
 rejects(()=>submit(crypto.randomUUID()),'nonexistent canonical Order rejected');
 const compatOrder=order(),compatAttempt=submit(compatOrder.id,crypto.randomUUID(),{...evidence,claimedPaymentDate:'2026-01-01'});
 ok(sql(`SELECT canonical_order_id='${compatOrder.id}' AND subscription_id IS NULL AND purchase_request_id IS NULL AND payment_date IS NULL AND status='submitted' FROM public.sinpe_payments WHERE id='${compatAttempt}'`)==='t','canonical submission no fabricated legacy identity or bank time');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${compatOrder.id}'`)==='0','submission not paid');
 rejects(()=>sql(`UPDATE public.sinpe_payments SET subscription_id='${legacySubscription}' WHERE id='${compatAttempt}'`),'legacy update cannot mutate canonical evidence');
 rejects(()=>sql(`INSERT INTO public.sinpe_payments(user_id,canonical_order_id,subscription_id,submission_request_id,receiving_account_id,submission_evidence) VALUES('${customer}','${compatOrder.id}','${legacySubscription}','${crypto.randomUUID()}','${acc}','{}')`),'mixed legacy canonical relationship rejected');
 rejects(()=>sql(`INSERT INTO public.sinpe_payments(user_id,canonical_order_id,payment_date,submission_request_id,receiving_account_id,submission_evidence) VALUES('${customer}','${compatOrder.id}',now(),'${crypto.randomUUID()}','${acc}','{}')`),'canonical payment_date cannot masquerade as reviewed bank time');
 const o=order(),r=crypto.randomUUID(),p=submit(o.id,r);ok(submit(o.id,r)===p,'same submission id');rejects(()=>submit(o.id,r,{...evidence,reference:'changed'}),'changed submission');rejects(()=>submit(o.id,crypto.randomUUID(),evidence,owner),'wrong owner');
 const rr=crypto.randomUUID(),cmd=approved(),decision=review(p,cmd,rr);ok(decision.disposition==='APPROVED','approved');ok(review(p,cmd,rr).id===decision.id,'review retry');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${o.id}'`)==='1','one acknowledgement');
 rejects(()=>review(p,{...cmd,amount:'11'},rr),'changed approval replay');
 const o2=order(),p2=submit(o2.id);rejects(()=>review(p2,approved()),'bank event reused');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${o2.id}'`)==='0','duplicate rollback acknowledgement');
 rejects(()=>review(p2,approved('BANK-2'),crypto.randomUUID(),customer),'customer approval denied');
 rejects(()=>review(p2,{...approved('BANK-2'),amount:'9'}),'amount mismatch');
 const unmatched=review(p2,{...approved('BANK-2'),disposition:'RECEIVED_UNMATCHED',reason:'amount_mismatch',amount:'9'});ok(unmatched.acknowledgementId===null,'unmatched not paid');
 const o3=order(),p3=submit(o3.id);rejects(()=>review(p3,approved('BANK-2')),'unmatched protects bank event');
 review(p3,{disposition:'REJECTED',reason:'insufficient_evidence'});const p4=submit(o3.id);ok(p4!==p3,'new attempt after rejection');
 rejects(()=>sql(`UPDATE public.sinpe_payments SET sinpe_reference='rewrite' WHERE id='${p4}'`),'submission immutable');rejects(()=>sql(`DELETE FROM twuanis_canonical_private.sinpe_review_decisions`),'decisions immutable');
 // Historical fixture: timely actual server submission; no clocks or immutable rows changed.
 const old=crypto.randomUUID(),oldp=crypto.randomUUID();sql(`WITH t AS(SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${old}',account_id,'${crypto.randomUUID()}',target_type,product_id,listing_id,job_id,currency,resolved_terms,t.t,t.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN t WHERE id='${o.id}';INSERT INTO public.sinpe_payments(id,user_id,canonical_order_id,submission_request_id,receiving_account_id,submission_evidence,amount,currency,sinpe_reference,sender_name,status,created_at)SELECT '${oldp}',account_id,id,'${crypto.randomUUID()}','${acc}','{"reference":"timely","senderName":"fixture"}',10,'USD','timely','fixture','submitted',payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${old}'`);
 const deadline=sql(`SELECT payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${old}'`);review(oldp,approved('DELAYED',new Date(deadline).toISOString()));ok(sql(`SELECT acknowledged_at>o.payment_deadline FROM twuanis_canonical_private.offer_paid_acknowledgements a JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=a.order_id WHERE o.id='${old}'`)==='t','inclusive timely delayed review actual timestamp');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input]))})`)).jobId;
 const bulk=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-bulk-listing-import','USD',NULL,'${job}')`));
 const historic=crypto.randomUUID(),hp=crypto.randomUUID();sql(`WITH t AS(SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${historic}',account_id,'${crypto.randomUUID()}',target_type,product_id,NULL,job_id,currency,resolved_terms,t.t,t.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN t WHERE id='${bulk.id}';INSERT INTO public.sinpe_payments(id,user_id,canonical_order_id,submission_request_id,receiving_account_id,submission_evidence,created_at)SELECT '${hp}',account_id,id,'${crypto.randomUUID()}','${acc}','{"reference":"hold","senderName":"fixture"}',payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${historic}'`);
 ok(sql(`SELECT twuanis_canonical_private.sinpe_pending_review('${historic}')`)==='t','timely review hold after deadline');review(hp,{disposition:'REJECTED',reason:'insufficient_evidence'});ok(sql(`SELECT twuanis_canonical_private.sinpe_pending_review('${historic}')`)==='f','terminal rejection releases review hold');
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.sinpe_review_decisions','INSERT,UPDATE,DELETE,TRUNCATE')`)==='f','no direct decisions '+role);
 ok(JSON.parse(run(owner,'SELECT public.admin_sinpe_read()')).length>0,'Admin queue');rejects(()=>run(customer,'SELECT public.admin_sinpe_read()'),'no ordinary Admin reads');
 // Independent sessions exercise actual transaction locks and unique event authority.
 function parallel(q){return new Promise(resolve=>{const child=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55459','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});let out='',err='';child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);child.on('close',code=>resolve({code,out,err}));child.stdin.end(q)})}
 const as=(actor,q)=>`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:actor,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`;
 const sq=(id,request)=>as(customer,`SELECT public.submit_order_sinpe('${id}','${request}','${acc}',${lit(JSON.stringify(evidence))})`);
 const rq=(id,c,request=crypto.randomUUID())=>as(owner,`SELECT public.review_order_sinpe('${id}','${request}',${lit(JSON.stringify(c))})`);
 const co=order(),sr=crypto.randomUUID();let race=await Promise.all([parallel(sq(co.id,sr)),parallel(sq(co.id,sr))]);ok(race.every(x=>x.code===0)&&sql(`SELECT count(*) FROM public.sinpe_payments WHERE submission_request_id='${sr}'`)==='1','simultaneous submissions one attempt');
 const cp=submit(co.id,sr),cr=crypto.randomUUID(),cc=approved('CONCURRENT');race=await Promise.all([parallel(rq(cp,cc,cr)),parallel(rq(cp,cc,cr))]);ok(race.every(x=>x.code===0)&&sql(`SELECT count(*) FROM twuanis_canonical_private.sinpe_review_decisions WHERE attempt_id='${cp}'`)==='1','simultaneous identical approvals one decision');
 const ar=submit(order().id);race=await Promise.all([parallel(rq(ar,approved('RACE'))),parallel(rq(ar,{disposition:'REJECTED',reason:'insufficient_evidence'}))]);ok(race.filter(x=>x.code===0).length===1,'approve reject only one winner');
 const ca=submit(order().id),cb=submit(order().id);race=await Promise.all([parallel(rq(ca,approved('SHARED'))),parallel(rq(cb,approved('SHARED')))]);ok(race.filter(x=>x.code===0).length===1,'one scoped external event across Orders');
 const acc2=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts VALUES('${acc2}','USD','Other fixture','Otra prueba',true,clock_timestamp())`);const so=order(),sp=run(customer,`SELECT public.submit_order_sinpe('${so.id}','${crypto.randomUUID()}','${acc2}',${lit(JSON.stringify(evidence))})`);ok(review(sp,{...approved('SHARED'),receivingAccount:acc2}).disposition==='APPROVED','same reference separate receiving accounts');
 const audito=order(),auditp=submit(audito.id);sql(`CREATE FUNCTION public.step9_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.operation='sinpe.review' THEN RAISE EXCEPTION 'injected audit failure';END IF;RETURN NEW;END$$;CREATE TRIGGER step9_audit_failure BEFORE INSERT ON twuanis_canonical_private.administrative_events FOR EACH ROW EXECUTE FUNCTION public.step9_fail_audit()`);rejects(()=>review(auditp,approved('AUDIT')),'audit failure rolls back');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${audito.id}'`)==='0','audit failure no paid truth');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.sinpe_review_decisions WHERE attempt_id='${auditp}'`)==='0','audit failure no decision');sql('DROP TRIGGER step9_audit_failure ON twuanis_canonical_private.administrative_events');
 const missing=submit(order().id);rejects(()=>review(missing,{...approved(''),disposition:'RECEIVED_UNMATCHED',reason:'amount_mismatch'}),'missing verified identity fails');
 rejects(()=>review(missing,{...approved('WRONG'),currency:'CRC'}),'wrong currency cannot approve');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights`)==='0','no placement from payment');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.intelligence_package_rights`)==='0','no Package right from payment');
 for(const role of ['anon','service_role'])ok(sql(`SELECT has_function_privilege('${role}','public.review_order_sinpe(uuid,uuid,jsonb)','EXECUTE')`)==='f','review inaccessible '+role);
 const fulfill=(id,request=crypto.randomUUID())=>JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${id}','${request}')`));
 const packageRetry=crypto.randomUUID();ok(fulfill(o.id,packageRetry).state==='PENDING','Package paid fulfillment pending');ok(fulfill(o.id,packageRetry).state==='PENDING','Package retry remains pending');ok(sql('SELECT count(*) FROM twuanis_canonical_private.intelligence_package_rights')==='0','Package no invented rights');
 ok(JSON.parse(run(owner,`SELECT public.admin_sinpe_read('${p}')`)).fulfillmentState==='PENDING','Admin pending explicit');
 const founder=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-2026-founding-membership','USD')`));const fp=submit(founder.id);review(fp,{...approved('FOUNDER'),amount:'500'});
 sql(`CREATE FUNCTION public.step9_fail_fulfillment() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'injected fulfillment failure';END$$;CREATE TRIGGER step9_failure BEFORE INSERT ON twuanis_canonical_private.addon_founder_rights FOR EACH ROW EXECUTE FUNCTION public.step9_fail_fulfillment()`);
 ok(fulfill(founder.id).state==='FAILED','fulfillment failure separate');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${founder.id}'`)==='1','failed fulfillment keeps paid');ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='0','failed fulfillment atomic');sql('DROP TRIGGER step9_failure ON twuanis_canonical_private.addon_founder_rights');
 ok(fulfill(founder.id).state==='COMPLETE','controlled retry succeeds');ok(fulfill(founder.id).state==='COMPLETE','subsequent fulfillment idempotent');ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='1','one Founder right');
 rejects(()=>fulfill(order().id),'unpaid cannot fulfill');
 const fq=()=>as(owner,`SELECT public.retry_sinpe_fulfillment('${founder.id}','${crypto.randomUUID()}')`);race=await Promise.all([parallel(fq()),parallel(fq())]);ok(race.every(x=>x.code===0)&&sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='1','concurrent fulfillment no duplicate');
 rejects(()=>sql(`UPDATE twuanis_canonical_private.sinpe_receiving_accounts SET instructions_en='changed destination' WHERE id='${acc}'`),'receiving identity destination immutable');
 const late=submit(order().id);rejects(()=>review(late,{...approved('NOZONE'),receivedAt:'2026-10-01T12:00:00'}),'no ambiguous receipt timezone');
 // Late intake is evidence only, never an acquisition hold or normal approval.
 const lateJob=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input]))})`)).jobId;
 const lateOrder=crypto.randomUUID();sql(`WITH t AS(SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${lateOrder}',account_id,'${crypto.randomUUID()}',target_type,product_id,NULL,'${lateJob}',currency,resolved_terms,t.t,t.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN t WHERE id='${bulk.id}'`);
 const lateRequest=crypto.randomUUID(),lateAttempt=submit(lateOrder,lateRequest);
 ok(submit(lateOrder,lateRequest)===lateAttempt,'late identical retry same attempt');
 ok(sql(`SELECT sinpe_pending_review('${lateOrder}') FROM (SELECT 1)t` .replace('SELECT sinpe_pending_review','SELECT twuanis_canonical_private.sinpe_pending_review'))==='f','late evidence no review hold');
 const lateView=JSON.parse(run(customer,`SELECT public.read_order_sinpe('${lateOrder}')`));ok(lateView.expired&&lateView.attempts[0].lateEvidence,'late server projection');ok(lateView.attempts[0].review===null,'customer no reviewer bank evidence');
 const beforeDeadline=sql(`SELECT payment_deadline-interval '1 minute' FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${lateOrder}'`);
 rejects(()=>review(lateAttempt,{...approved('LATE-EVENT',new Date(beforeDeadline).toISOString()),amount:bulk.terms.total}),'late submission cannot approve even timely receipt');
 const replacement=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-bulk-listing-import','USD',NULL,'${lateJob}')`));ok(replacement.id!==lateOrder,'late evidence permits independently valid replacement');
 const lateDecision=review(lateAttempt,{...approved('LATE-EVENT',new Date(beforeDeadline).toISOString()),amount:bulk.terms.total,disposition:'RECEIVED_UNMATCHED',reason:'late_submission'});ok(lateDecision.acknowledgementId===null,'late received funds unmatched only');
 const replacementAttempt=submit(replacement.id);rejects(()=>review(replacementAttempt,{...approved('LATE-EVENT'),amount:replacement.terms.total}),'unmatched late event cannot satisfy replacement');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id IN('${lateOrder}','${replacement.id}')`)==='0','late intake no acknowledgement');
 ok(JSON.parse(run(owner,`SELECT public.admin_sinpe_read('${lateAttempt}')`)).lateEvidence,'Admin late distinction');
 rejects(()=>submit(o.id),'already paid Order new intake remains denied');
 rejects(()=>run(owner,`SELECT public.read_order_sinpe('${lateOrder}')`),'different account cannot read customer evidence');
 // Actual post-expiry acquisition races with delayed approval: old timely attempt holds job.
 const heldJob=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input]))})`)).jobId;
 const heldOrder=crypto.randomUUID(),heldAttempt=crypto.randomUUID();sql(`WITH t AS(SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${heldOrder}',account_id,'${crypto.randomUUID()}',target_type,product_id,NULL,'${heldJob}',currency,resolved_terms,t.t,t.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN t WHERE id='${bulk.id}';INSERT INTO public.sinpe_payments(id,user_id,canonical_order_id,submission_request_id,receiving_account_id,submission_evidence,created_at) SELECT '${heldAttempt}',account_id,id,'${crypto.randomUUID()}','${acc}','{"reference":"hold","senderName":"fixture"}',payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${heldOrder}'`);
 const heldDeadline=new Date(sql(`SELECT payment_deadline FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${heldOrder}'`)).toISOString();
 race=await Promise.all([parallel(rq(heldAttempt,{...approved('EXPIRED-REVIEW',heldDeadline),amount:bulk.terms.total})),parallel(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-bulk-listing-import','USD',NULL,'${heldJob}')`)]);
 ok(race[0].code===0&&race[1].code!==0,'post-expiry approval vs replacement serializes pending-to-paid hold');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots WHERE job_id='${heldJob}'`)==='1','no competing payable Order in expiration review race');
 // Existing fulfillment contracts: a paid accepted job and listing placement reuse the same purchase.
 const bulkDone=fulfill(heldOrder);ok(bulkDone.state==='COMPLETE','approved Bulk handoff succeeds');ok(fulfill(heldOrder).state==='COMPLETE','Bulk retry idempotent');
 const listing=sql(`SELECT id FROM public.listings WHERE owner_id='${customer}' ORDER BY id LIMIT 1`);
 const listingOrder=JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-featured-listing','USD','${listing}',NULL)`));
 const listingAttempt=submit(listingOrder.id);review(listingAttempt,{...approved('FEATURED'),amount:listingOrder.terms.total});ok(fulfill(listingOrder.id).state==='COMPLETE','listing Add-on handoff');const originalExpiry=sql(`SELECT expires_at FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${listing}'`);fulfill(listingOrder.id);ok(sql(`SELECT expires_at FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${listing}'`)===originalExpiry,'payment retry does not extend twice');
 // Restrictive canonical RLS remains effective even alongside permissive legacy policy.
 sql('GRANT SELECT,INSERT,UPDATE,DELETE ON public.sinpe_payments TO authenticated;CREATE POLICY step9_permissive_fixture ON public.sinpe_payments FOR ALL TO authenticated USING(true) WITH CHECK(true)');
 ok(run(customer,`SELECT count(*) FROM public.sinpe_payments WHERE canonical_order_id IS NOT NULL`)==='0','canonical evidence not exposed by permissive legacy policy');
 rejects(()=>run(customer,`INSERT INTO public.sinpe_payments(user_id,canonical_order_id,submission_request_id,receiving_account_id,submission_evidence) VALUES('${customer}','${o.id}','${crypto.randomUUID()}','${acc}','{}')`),'direct canonical insertion denied');
 for(const signature of ['submit_order_sinpe(uuid,uuid,uuid,jsonb)','review_order_sinpe(uuid,uuid,jsonb)','read_order_sinpe(uuid)','admin_sinpe_read(uuid,uuid,text,uuid)','retry_sinpe_fulfillment(uuid,uuid)']){
  ok(sql(`SELECT proowner='postgres'::regrole AND prosecdef AND proconfig=ARRAY['search_path=pg_catalog'] FROM pg_proc WHERE oid='public.${signature}'::regprocedure`)==='t','public RPC fixed security '+signature);
  ok(sql(`SELECT NOT EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(p.proacl) a WHERE p.oid='public.${signature}'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE')`)==='t','no PUBLIC execution '+signature);
 }
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT NOT has_function_privilege('${role}','twuanis_canonical_private.sinpe_projection(uuid,boolean)','EXECUTE') AND NOT has_function_privilege('${role}','twuanis_canonical_private.sinpe_lock_order(uuid)','EXECUTE')`)==='t','private primitives denied '+role);
 const lateFunds=submit(order().id);rejects(()=>review(lateFunds,{...approved('FUTURE'),receivedAt:'2999-01-01T00:00:00Z'}),'future bank event cannot approve');
 console.log(JSON.stringify({status:'PASS',checks:n,concurrencyCases:6,scope:'socket-only Step9 fixture; no production'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
