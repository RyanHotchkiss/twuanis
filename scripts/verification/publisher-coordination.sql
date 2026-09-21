\set ON_ERROR_STOP on
-- Fresh disposable cg_s1_verification, postgres, Unix socket ONLY.
-- The unchanged S1 harness establishes its representative pre-S1 fixture and
-- applies Migration 004 from scratch, including all 230 S1R assertions.
\ir canonical-foundation.sql
CREATE TEMP TABLE s2_baseline AS SELECT count(*) n FROM test_results;
-- Representative affected columns from cached A2/A3 catalogs. No production reads.
CREATE TABLE public.packages(id uuid PRIMARY KEY,slug text NOT NULL UNIQUE);
CREATE TABLE public.package_limits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),package_id uuid NOT NULL UNIQUE REFERENCES public.packages ON DELETE CASCADE,
 listing_limit integer CONSTRAINT fixture_limit_nonnegative CHECK(listing_limit IS NULL OR listing_limit>=0),
 featured_listing_limit integer,storage_limit_mb integer,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.user_subscriptions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 package_id uuid NOT NULL REFERENCES public.packages ON DELETE RESTRICT,
 status text NOT NULL CHECK(status IN ('active','pending_payment','cancelled','expired')),
 billing_cycle text NOT NULL,started_at timestamptz,current_period_start timestamptz,current_period_end timestamptz,
 cancelled_at timestamptz,expired_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),purchase_request_id uuid UNIQUE,
 CHECK(current_period_end IS NULL OR current_period_start IS NULL OR current_period_end>current_period_start));
CREATE UNIQUE INDEX fixture_one_active_subscription ON public.user_subscriptions(user_id) WHERE status='active';
CREATE UNIQUE INDEX fixture_one_pending_subscription ON public.user_subscriptions(user_id) WHERE status='pending_payment';
\ir ../../supabase/migrations/005_dormant_publisher_coordination.sql
SELECT pg_temp.ok((SELECT count(*)=1 AND min(id)=1 FROM public.capacity_policy_guard),'S2 migration initializes singleton');
SELECT pg_temp.accept_rolled_back('DELETE FROM public.capacity_policy_guard;SELECT twuanis_canonical_private.initialize_capacity_guard();SELECT count(*)::text FROM public.capacity_policy_guard','1','S2 zero-state guard initialization');
SELECT twuanis_canonical_private.initialize_capacity_guard();
SELECT pg_temp.ok((SELECT count(*)=1 FROM public.capacity_policy_guard),'S2 repeated initialization singleton');
SELECT pg_temp.reject('INSERT INTO public.capacity_policy_guard VALUES(2)','23514','S2 alternate guard identity rejected');
INSERT INTO auth.users(id) SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(101,110)n;
CREATE TEMP TABLE s2_publishers AS SELECT id owner,twuanis_canonical_private.ensure_publisher_account(id) publisher
 FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000102');
SELECT pg_temp.ok((SELECT bool_and(publisher=twuanis_canonical_private.ensure_publisher_account(owner)) FROM s2_publishers),'S2 repeated provisioning stable identity');
SELECT pg_temp.ok((SELECT bool_and(publisher=twuanis_canonical_private.resolve_publisher(owner)) FROM s2_publishers),'S2 owner resolution stable');
SELECT pg_temp.ok((SELECT bool_and(owner=twuanis_canonical_private.lock_publisher(publisher)) FROM s2_publishers),'S2 publisher lock resolves owner');
SELECT pg_temp.reject('SELECT twuanis_canonical_private.lock_publisher(gen_random_uuid())','P0002','S2 absent publisher rejected');
SELECT pg_temp.reject('SELECT twuanis_canonical_private.ensure_publisher_account(NULL)','22023','S2 null customer rejected');
SELECT pg_temp.reject('SELECT twuanis_canonical_private.ensure_publisher_account(gen_random_uuid())','23503','S2 nonexistent customer rejected');
SELECT pg_temp.reject('SELECT twuanis_canonical_private.resolve_publisher(gen_random_uuid())','P0002','S2 unprovisioned customer rejected');
SELECT pg_temp.reject('SELECT twuanis_canonical_private.lock_capacity_policy(NULL)','22023','S2 null guard mode rejected');
SELECT pg_temp.reject('DELETE FROM public.capacity_policy_guard;SELECT twuanis_canonical_private.lock_capacity_policy()','55000','S2 missing guard fails closed');
INSERT INTO public.packages VALUES('90000000-0000-0000-0000-000000000001','fixture-five'),('90000000-0000-0000-0000-000000000002','fixture-three'),('90000000-0000-0000-0000-000000000003','fixture-no-limit-row');
INSERT INTO public.package_limits(package_id,listing_limit) VALUES('90000000-0000-0000-0000-000000000001',5),('90000000-0000-0000-0000-000000000002',3);
INSERT INTO public.user_subscriptions(id,user_id,package_id,status,billing_cycle,current_period_start,current_period_end)
 SELECT ('91000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 '90000000-0000-0000-0000-000000000001','active','monthly',now()-interval '1 day',now()+interval '30 days' FROM generate_series(101,102)n;
SELECT pg_temp.ok((SELECT allowance=5 AND NOT unlimited FROM twuanis_canonical_private.publisher_allowance(
 (SELECT publisher FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101'),'00000000-0000-0000-0000-000000000101')),'S2 current allowance five');
-- Exact canonical count: five active listings for P1; non-active/ownerless/legacy/P2 exclusions.
INSERT INTO public.listings(id,owner_id,publisher_account_id,listing_status,listing_origin,listing_source_type,deleted_at,expired_at)
 SELECT gen_random_uuid(),owner,publisher,'active','customer','customer',now()-interval '2 days',now()-interval '1 day'
 FROM s2_publishers CROSS JOIN generate_series(1,5) WHERE owner='00000000-0000-0000-0000-000000000101';
INSERT INTO public.listings(owner_id,publisher_account_id,listing_status,listing_origin,listing_source_type)
 SELECT owner,publisher,st,'customer','customer' FROM s2_publishers CROSS JOIN (VALUES('draft'),('expired'),('archived'),('deleted')) states(st)
 WHERE owner='00000000-0000-0000-0000-000000000101';
INSERT INTO public.listings(owner_id,publisher_account_id,listing_status,listing_origin,listing_source_type)
 SELECT owner,publisher,'active','customer','customer' FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000102';
INSERT INTO public.listings(owner_id,listing_status,listing_origin,listing_source_type) VALUES(NULL,'active','scraped','realtor'),('00000000-0000-0000-0000-000000000101','active','customer','customer');
SELECT pg_temp.ok((SELECT twuanis_canonical_private.publisher_consumption(publisher,owner)=5 FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101'),'S2 exact active count ignores historical timestamps and excludes other states/identities');
SELECT pg_temp.ok((SELECT twuanis_canonical_private.publisher_consumption(publisher,owner)=1 FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000102'),'S2 separate publisher count');
DO $f$ DECLARE p uuid; o uuid:='00000000-0000-0000-0000-000000000101'; q text; st text;
BEGIN
 SELECT publisher INTO p FROM s2_publishers WHERE owner=o;
 q:=format('SELECT allowance FROM twuanis_canonical_private.publisher_allowance(%L,%L)',p,o);
 PERFORM pg_temp.reject(format('SELECT twuanis_canonical_private.publisher_consumption(%L,gen_random_uuid())',p),'22023','S2 consumption owner mismatch');
 PERFORM pg_temp.reject(format('SELECT * FROM twuanis_canonical_private.publisher_allowance(%L,gen_random_uuid())',p),'22023','S2 allowance owner mismatch');
 PERFORM pg_temp.reject(format('UPDATE public.listings SET owner_id=NULL WHERE publisher_account_id=%L;SELECT twuanis_canonical_private.publisher_consumption(%L,%L)',p,p,o),'55000','S2 malformed linked ownership fails closed');
 PERFORM pg_temp.reject(format('DELETE FROM public.user_subscriptions WHERE user_id=%L;',o)||q,'55000','S2 missing subscription fails closed');
 FOREACH st IN ARRAY ARRAY['expired','cancelled','pending_payment'] LOOP
  PERFORM pg_temp.reject(format('UPDATE public.user_subscriptions SET status=%L WHERE user_id=%L;',st,o)||q,'55000','S2 noncurrent subscription '||st);
 END LOOP;
 PERFORM pg_temp.reject(format('UPDATE public.user_subscriptions SET current_period_end=now()-interval ''1 hour'' WHERE user_id=%L;',o)||q,'55000','S2 elapsed active subscription fails closed');
 PERFORM pg_temp.reject(format('UPDATE public.user_subscriptions SET current_period_start=now()+interval ''1 hour'' WHERE user_id=%L;',o)||q,'55000','S2 future active subscription fails closed');
 PERFORM pg_temp.accept_rolled_back(format('UPDATE public.user_subscriptions SET current_period_start=NULL,current_period_end=NULL WHERE user_id=%L;',o)||q,'5','S2 nullable dates follow existing entitlement contract');
 PERFORM pg_temp.reject('DELETE FROM public.package_limits WHERE package_id=''90000000-0000-0000-0000-000000000001'';'||q,'55000','S2 missing limit row fails closed');
 PERFORM pg_temp.accept_rolled_back('UPDATE public.package_limits SET listing_limit=0 WHERE package_id=''90000000-0000-0000-0000-000000000001'';'||q,'0','S2 zero allowance is not missing');
 PERFORM pg_temp.accept_rolled_back('UPDATE public.package_limits SET listing_limit=NULL WHERE package_id=''90000000-0000-0000-0000-000000000001'';'||replace(q,'SELECT allowance','SELECT unlimited'),'true','S2 explicit NULL limit unlimited');
 -- Fault injection is contained in rejected subtransactions; production constraints stay intact.
 PERFORM pg_temp.reject('ALTER TABLE public.package_limits DROP CONSTRAINT fixture_limit_nonnegative;UPDATE public.package_limits SET listing_limit=-1 WHERE package_id=''90000000-0000-0000-0000-000000000001'';'||q,'22023','S2 defensive negative allowance rejection');
 PERFORM pg_temp.reject('UPDATE public.package_limits SET listing_limit=''malformed''','22P02','S2 integer limit rejects malformed storage');
 PERFORM pg_temp.reject(format('DROP INDEX public.fixture_one_active_subscription;INSERT INTO public.user_subscriptions(user_id,package_id,status,billing_cycle) VALUES(%L,''90000000-0000-0000-0000-000000000002'',''active'',''free'');',o)||q,'55000','S2 conflicting active subscriptions fail closed');
END $f$;
DO $f$ DECLARE a bigint; c bigint; r bigint; over bigint; addone boolean; currentover boolean; x record;
BEGIN
 FOR a,c,r,over,addone,currentover IN SELECT * FROM (VALUES
 (0,0,0,0,true,false),(1,0,1,0,false,false),(1,1,0,0,true,false),(1,2,-1,1,true,true),
 (5,3,2,0,false,false),(5,5,0,0,true,false),(5,8,-3,3,true,true)) v(a,c,r,o,n,b)
 LOOP
  SELECT * INTO x FROM twuanis_canonical_private.capacity_state(a,c);
  PERFORM pg_temp.ok((x.remaining,x.over_capacity,x.adding_one_exceeds,x.is_over_capacity) IS NOT DISTINCT FROM (r,over,addone,currentover),'S2 capacity matrix '||a||'/'||c);
 END LOOP;
END $f$;
SELECT pg_temp.ok((SELECT unlimited AND remaining IS NULL AND over_capacity=0 AND NOT adding_one_exceeds AND NOT is_over_capacity FROM twuanis_canonical_private.capacity_state(NULL,9223372036854775807)),'S2 unlimited and bigint-safe count');
SELECT pg_temp.reject('SELECT * FROM twuanis_canonical_private.capacity_state(-1,0)','22023','S2 negative allowance input');
SELECT pg_temp.reject('SELECT * FROM twuanis_canonical_private.capacity_state(1,-1)','22023','S2 negative count input');
SELECT pg_temp.reject('SELECT * FROM twuanis_canonical_private.capacity_state(1,NULL)','22023','S2 null count input');
-- Future-style replacement model only: no production adapter is invoked.
BEGIN;
SELECT twuanis_canonical_private.lock_publisher(publisher) FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101';
UPDATE public.user_subscriptions SET status='expired' WHERE user_id='00000000-0000-0000-0000-000000000101';
INSERT INTO public.user_subscriptions(id,user_id,package_id,status,billing_cycle) VALUES('92000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000101','90000000-0000-0000-0000-000000000002','active','monthly');
SELECT pg_temp.ok((SELECT publisher=twuanis_canonical_private.resolve_publisher(owner) FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101'),'S2 replacement preserves publisher identity');
SELECT pg_temp.ok((SELECT subscription_id='92000000-0000-0000-0000-000000000101' AND allowance=3 FROM twuanis_canonical_private.publisher_allowance((SELECT publisher FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101'),'00000000-0000-0000-0000-000000000101')),'S2 replacement changes subscription identity and allowance');
SELECT pg_temp.ok((SELECT remaining=-2 AND over_capacity=2 AND is_over_capacity FROM twuanis_canonical_private.capacity_state(3,(SELECT twuanis_canonical_private.publisher_consumption(publisher,owner) FROM s2_publishers WHERE owner='00000000-0000-0000-0000-000000000101'))),'S2 five active downgrade to three preserves five active');
COMMIT;
DO $f$ DECLARE r text; fn record;
BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  PERFORM pg_temp.ok(NOT has_schema_privilege(r,'twuanis_canonical_private','USAGE'),'S2 private schema denied '||r);
  FOR fn IN SELECT oid,oid::regprocedure sig,prosecdef,proowner,proconfig FROM pg_proc WHERE pronamespace='twuanis_canonical_private'::regnamespace LOOP
   PERFORM pg_temp.ok(NOT has_function_privilege(r,fn.oid,'EXECUTE'),'S2 effective execute denied '||r||'/'||fn.sig);
  END LOOP;
 END LOOP;
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace='twuanis_canonical_private'::regnamespace AND (prosecdef OR proowner<>'postgres'::regrole OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, pg_temp'])),'S2 invoker ownership safe search paths');
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(p.proacl) a WHERE p.pronamespace='twuanis_canonical_private'::regnamespace AND a.grantee=0),'S2 PUBLIC has no function grant');
END $f$;
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.listings'::regclass AND NOT tgisinternal),'S2 no listing behavior activated');
SELECT pg_temp.reject($q$INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source) VALUES('10000000-0000-0000-0000-000000000001','bathrooms','exact',0,'owner')$q$,'23514','S2 preserves bathroom zero rejection');
SELECT pg_temp.accept_rolled_back($q$INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source) VALUES('10000000-0000-0000-0000-000000000001','bathrooms','exact',0.5,'owner') RETURNING exact_value::text$q$,'0.5','S2 preserves fractional bathroom');
SELECT pg_temp.reject($q$INSERT INTO public.canonical_operation_receipts(authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome) VALUES('system',repeat(' ',10000)||'x','test',gen_random_uuid(),repeat('a',64),'noop')$q$,'23514','S2 preserves raw identity bound');
SELECT pg_temp.accept_rolled_back($q$INSERT INTO public.listing_source_observations(source_name,source_listing_id,source_observation_id,outcome,payload_fingerprint) VALUES('s2','  ABC-123_X/9  ','s2','rejected',repeat('a',64)) RETURNING source_listing_id$q$,'  ABC-123_X/9  ','S2 preserves opaque identity');
DO $f$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['publisher_accounts','capacity_policy_guard','listing_semantic_selections','listing_fact_evidence','listing_classification_rule_sets','listing_classification_rules','listing_membership_origins','canonical_operation_receipts','listing_source_observations','source_identity_conflicts','listing_lifecycle_events','listing_monetary_events'] LOOP
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 PERFORM pg_temp.ok(NOT has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),'S2 preserves table denial '||t||'/'||r);
 END LOOP; END LOOP;
END $f$;
SELECT count(*)-(SELECT n FROM s2_baseline) AS passed_s2_assertions FROM test_results;
\echo S2 STRUCTURAL VERIFICATION PASSED
