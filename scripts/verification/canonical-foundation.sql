\set ON_ERROR_STOP on
-- LOCAL/DISPOSABLE ONLY. Creates fixture tables/roles. Never use a linked DB.
-- Run as postgres in a fresh database named cg_s1_verification on a Unix socket.
DO $f$ BEGIN
 IF current_database() <> 'cg_s1_verification' OR inet_server_addr() IS NOT NULL
    OR session_user <> 'postgres' THEN
  RAISE EXCEPTION 'requires disposable cg_s1_verification, Unix socket, postgres';
 END IF;
 IF to_regclass('public.listings') IS NOT NULL THEN
  RAISE EXCEPTION 'requires fresh disposable database';
 END IF;
END $f$;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
-- Fixture mirrors the affected production types/defaults, not all production
-- policies/functions. This suite proves S1 structures, not application cutover.
CREATE TABLE public.listings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 transaction_type text NOT NULL DEFAULT 'buy',
 listing_status text DEFAULT 'active' CHECK(listing_status IN ('draft','active','expired','archived','deleted')),
 currency text NOT NULL DEFAULT 'CRC', current_price numeric, price_millions numeric,
 monthly_price bigint, property_area numeric, construction_area numeric,
 title text, images text, published_at timestamptz, updated_at timestamptz DEFAULT now(),
 expired_at timestamptz, deleted_at timestamptz, renewed_at timestamptz, archived_at timestamptz,
 listing_origin text NOT NULL, listing_source_type text NOT NULL,
 source_name text,source_listing_id text,
 UNIQUE(source_name,source_listing_id)
);
CREATE TABLE public.ontology_terms(
 id bigint PRIMARY KEY,term_type text NOT NULL,level integer,parent_id bigint,
 term_name text,official_code text
);
CREATE TABLE public.listings_ontology_terms(
 listing_id uuid REFERENCES public.listings ON DELETE CASCADE,
 ontology_term_id bigint REFERENCES public.ontology_terms ON DELETE CASCADE,
 PRIMARY KEY(listing_id,ontology_term_id)
);
-- Simulate broad platform default privileges; migration must undo them on NEW objects.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
GRANT ALL ON public.listings TO authenticated,service_role;
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001');
INSERT INTO public.listings(id,listing_origin,listing_source_type,monthly_price)
 VALUES ('10000000-0000-0000-0000-000000000001','scraped','realtor',9007199254740993);
INSERT INTO public.ontology_terms VALUES
 (1,'property_type',1,NULL,'House',NULL),(2,'property_type',1,NULL,'Land',NULL),
 (3,'utility',1,NULL,'Water',NULL),(4,'utility',1,NULL,'Power',NULL),
 (5,'bedrooms',1,NULL,'5+',NULL),(6,'root',0,NULL,'Root',NULL),
 (7,'property_area',1,NULL,'small',NULL),(8,'property_area',1,NULL,'large',NULL),
 (9,'accessibility',1,NULL,'Paved Road',NULL),(10,'accessibility',1,NULL,'2WD',NULL),
 (11,'bathrooms',1,NULL,'5+',NULL),(12,'year_built',1,NULL,'2010s',NULL),
 (9007199254740993,'terrain',1,NULL,'Flat',NULL);
CREATE TEMP TABLE original_columns AS
 SELECT attname,atttypid,atttypmod,attnotnull,pg_get_expr(d.adbin,d.adrelid) def
 FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attrelid='public.listings'::regclass AND a.attnum>0 AND NOT a.attisdropped;
CREATE TEMP TABLE original_listing AS SELECT to_jsonb(l) value FROM public.listings l;
CREATE TEMP TABLE original_acl AS SELECT relacl FROM pg_class WHERE oid='public.listings'::regclass;
\ir ../../supabase/migrations/004_dormant_canonical_listing_foundation.sql

CREATE TEMP TABLE test_results(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(condition boolean,label text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
 IF condition IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %',label; END IF;
 INSERT INTO test_results VALUES(label);
END $f$;
CREATE FUNCTION pg_temp.reject(sql text,expected text,label text) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE actual text;
BEGIN
 BEGIN EXECUTE sql; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=RETURNED_SQLSTATE; END;
 IF actual IS DISTINCT FROM expected THEN
  RAISE EXCEPTION 'FAIL: %, expected %, got %',label,expected,coalesce(actual,'success');
 END IF;
 INSERT INTO test_results VALUES(label);
END $f$;
SELECT pg_temp.ok(NOT EXISTS(
 SELECT 1 FROM original_columns o JOIN pg_attribute a ON a.attrelid='public.listings'::regclass AND a.attname=o.attname
 LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE (o.atttypid,o.atttypmod,o.attnotnull,o.def) IS DISTINCT FROM
       (a.atttypid,a.atttypmod,a.attnotnull,pg_get_expr(d.adbin,d.adrelid))), 'existing column definitions unchanged');
SELECT pg_temp.ok((SELECT value FROM original_listing) =
 (SELECT to_jsonb(l)-ARRAY['canonical_revision','publisher_account_id','publication_expires_at'] FROM public.listings l), 'existing row evidence unchanged');
SELECT pg_temp.ok((SELECT relacl FROM original_acl) IS NOT DISTINCT FROM
 (SELECT relacl FROM pg_class WHERE oid='public.listings'::regclass),'existing table grants unchanged');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.listings'::regclass AND NOT tgisinternal),'no custom listing behavioral, synchronization, revision or interception triggers');
-- tgisinternal distinguishes PostgreSQL FK enforcement from custom behavior.
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM pg_trigger t JOIN pg_constraint c ON c.oid=t.tgconstraint
 WHERE t.tgrelid='public.listings'::regclass AND t.tgisinternal AND c.contype='f'
 AND c.confrelid='public.publisher_accounts'::regclass),'internal publisher FK listing triggers expected');
SELECT pg_temp.ok((SELECT canonical_revision=0 AND publisher_account_id IS NULL AND publication_expires_at IS NULL AND transaction_type='buy' AND owner_id IS NULL FROM public.listings),'legacy defaults and ownerless compatibility');
UPDATE public.listings SET title='legacy writer still works';
SELECT pg_temp.ok((SELECT canonical_revision=0 FROM public.listings),'legacy update does not increment revision');
SELECT pg_temp.ok((SELECT monthly_price=9007199254740993 AND pg_typeof(monthly_price)::text='bigint' FROM public.listings),'monthly integer precision/type unchanged');
SELECT pg_temp.reject($q$UPDATE public.listings SET canonical_revision=-1$q$,'23514','negative revision rejected');
INSERT INTO public.listings(id,owner_id,listing_origin,listing_source_type)
 VALUES ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','customer','customer');
SELECT pg_temp.ok((SELECT transaction_type='buy' AND listing_status='active' AND currency='CRC' AND canonical_revision=0 FROM public.listings WHERE id='10000000-0000-0000-0000-000000000002'),'legacy insert unchanged');
DO $f$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['publisher_accounts','capacity_policy_guard','listing_semantic_selections','listing_fact_evidence','listing_classification_rule_sets','listing_classification_rules','listing_membership_origins','canonical_operation_receipts','listing_source_observations','source_identity_conflicts','listing_lifecycle_events','listing_monetary_events'] LOOP
 EXECUTE format('SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM public.%I),%L)',t,'empty at migration: '||t);
 END LOOP;
END $f$;
INSERT INTO public.publisher_accounts(id,owner_user_id) VALUES ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
SELECT pg_temp.reject($q$INSERT INTO public.publisher_accounts(owner_user_id) VALUES ('00000000-0000-0000-0000-000000000001')$q$,'23505','publisher owner unique');
UPDATE public.listings SET publisher_account_id='20000000-0000-0000-0000-000000000001' WHERE id='10000000-0000-0000-0000-000000000002';
SELECT pg_temp.reject($q$DELETE FROM public.publisher_accounts$q$,'23503','publisher deletion restricted');
SELECT pg_temp.reject($q$DELETE FROM auth.users$q$,'23503','user identity deletion restricted');
INSERT INTO public.capacity_policy_guard VALUES(1);
SELECT pg_temp.reject('INSERT INTO public.capacity_policy_guard VALUES(2)','23514','guard singleton key');
SELECT pg_temp.reject('INSERT INTO public.capacity_policy_guard VALUES(1)','23505','guard duplicate rejected');
INSERT INTO public.listing_semantic_selections(listing_id,dimension,ontology_term_id) VALUES
 ('10000000-0000-0000-0000-000000000002','property_type',1),
 ('10000000-0000-0000-0000-000000000002','utility',3),
 ('10000000-0000-0000-0000-000000000002','utility',4),
 ('10000000-0000-0000-0000-000000000002','accessibility',9),
 ('10000000-0000-0000-0000-000000000002','accessibility',10),
 ('10000000-0000-0000-0000-000000000002','terrain',9007199254740993);
SELECT pg_temp.ok((SELECT count(*)=2 FROM public.listing_semantic_selections WHERE dimension='accessibility'),'accessibility set storage');
SELECT pg_temp.reject($q$INSERT INTO public.listing_semantic_selections VALUES('10000000-0000-0000-0000-000000000002','property_type',2,now())$q$,'23505','property singleton');
SELECT pg_temp.reject($q$INSERT INTO public.listing_semantic_selections VALUES('10000000-0000-0000-0000-000000000002','utility',3,now())$q$,'23505','duplicate semantic selection');
SELECT pg_temp.reject($q$INSERT INTO public.listing_semantic_selections VALUES('10000000-0000-0000-0000-000000000002','terrain',3,now())$q$,'23514','semantic type validation');
SELECT pg_temp.reject($q$INSERT INTO public.listing_semantic_selections VALUES('10000000-0000-0000-0000-000000000002','utility',6,now())$q$,'23514','root not direct selection');
INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,category_term_id,evidence_source)
 VALUES('10000000-0000-0000-0000-000000000002','bedrooms','category',5,'migration');
SELECT pg_temp.ok((SELECT exact_value IS NULL AND category_term_id=5 FROM public.listing_fact_evidence),'5+ retained without exact invention');
SELECT pg_temp.reject($q$UPDATE public.listing_fact_evidence SET exact_value=5$q$,'23514','category cannot also claim exact five');
SELECT pg_temp.reject($q$UPDATE public.listing_fact_evidence SET kind='exact'$q$,'23514','kind-only conversion cannot invent exact value');
INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,range_lower,range_upper,lower_inclusive,upper_inclusive,evidence_source)
 VALUES('10000000-0000-0000-0000-000000000002','year_built','range',2010,2019,true,true,'owner');
INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source)
 VALUES('10000000-0000-0000-0000-000000000002','bathrooms','exact',2.5,'owner');
SELECT pg_temp.ok((SELECT exact_value IS NULL FROM public.listing_fact_evidence WHERE dimension='year_built'),'year range not midpoint');
SELECT pg_temp.reject($q$INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source) VALUES('10000000-0000-0000-0000-000000000002','parking','exact',2.5,'owner')$q$,'23514','fractional parking rejected');
SELECT pg_temp.reject($q$UPDATE public.listing_fact_evidence SET exact_value='NaN' WHERE dimension='bathrooms'$q$,'23514','nonfinite exact rejected');
SELECT pg_temp.reject($q$UPDATE public.listing_fact_evidence SET range_upper=2010,upper_inclusive=false WHERE dimension='year_built'$q$,'23514','empty fact range rejected');
INSERT INTO public.listing_classification_rule_sets(id,domain,version) VALUES
 ('30000000-0000-0000-0000-000000000001','property_area',1),
 ('30000000-0000-0000-0000-000000000002','property_area',2),
 ('30000000-0000-0000-0000-000000000003','property_area',3);
INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES
 ('30000000-0000-0000-0000-000000000001',7,'[0,100)'),
 ('30000000-0000-0000-0000-000000000001',8,'[100,)');
SELECT pg_temp.reject($q$INSERT INTO public.listing_classification_rule_sets(domain,version) VALUES('property_area',1)$q$,'23505','rule version unique');
SELECT pg_temp.reject($q$INSERT INTO public.listing_classification_rule_sets(domain,version) VALUES('bedrooms',0)$q$,'23514','rule version positive');
SELECT pg_temp.reject($q$INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000001',7,'[50,150)')$q$,'23514','overlap rejected');
SELECT pg_temp.reject($q$INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000002',7,'empty')$q$,'23514','empty rule rejected');
SELECT pg_temp.reject($q$INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000002',3,'[0,100)')$q$,'23514','classification type validated');
INSERT INTO public.listing_membership_origins(listing_id,ontology_term_id,origin_domain) VALUES
 ('10000000-0000-0000-0000-000000000002',6,'utility'),('10000000-0000-0000-0000-000000000002',6,'terrain');
DELETE FROM public.listing_membership_origins WHERE origin_domain='utility';
SELECT pg_temp.ok((SELECT count(*)=1 FROM public.listing_membership_origins),'independent membership origins');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms),'no membership synchronization');
-- Successful fixture receipts are supplied explicitly; no canonical command exists.
INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id)
 SELECT ('40000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'owner','fixture','fixture_operation',
 ('50000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,repeat('a',64),'succeeded','10000000-0000-0000-0000-000000000002' FROM generate_series(1,20)i;
SELECT pg_temp.reject($q$INSERT INTO public.canonical_operation_receipts(authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome) VALUES('owner','fixture','fixture_operation','50000000-0000-0000-0000-000000000001',repeat('b',64),'succeeded')$q$,'23505','request key cannot accept changed payload');
SELECT pg_temp.reject($q$INSERT INTO public.canonical_operation_receipts(authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome) VALUES('owner','fixture','fixture_operation',gen_random_uuid(),'bad','succeeded')$q$,'23514','fingerprint shape');
INSERT INTO public.listing_lifecycle_events(listing_id,operation_id,listing_revision,event_type,previous_state,resulting_state,actor_kind,actor_identity)
 SELECT '10000000-0000-0000-0000-000000000002',('40000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,n,ev,oldst,newst,'owner','fixture'
 FROM (VALUES(1,'create',NULL,'draft'),(2,'publish','draft','active'),(3,'renew','active','active'),
 (4,'expire','active','expired'),(5,'renew','expired','active'),(6,'expire','active','expired'),
 (7,'delete','expired','deleted'),(8,'restore','deleted','draft'),(9,'delete','draft','deleted'),
 (10,'restore','deleted','draft'),(11,'publish','draft','active'),(12,'unpublish','active','draft'),
 (13,'publish','draft','active'),(14,'archive','active','archived')) v(n,ev,oldst,newst);
SELECT pg_temp.ok((SELECT count(*)=14 FROM public.listing_lifecycle_events),'repeated lifecycle cycles representable');
SELECT pg_temp.reject($q$INSERT INTO public.listing_lifecycle_events(listing_id,operation_id,listing_revision,event_type,resulting_state,actor_kind,actor_identity) VALUES('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000015',1,'renew','active','owner','fixture')$q$,'23514','null previous renew rejected');
INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,old_amount,old_currency,new_amount,new_currency,actor_kind,actor_identity)
 SELECT '10000000-0000-0000-0000-000000000002',('40000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,n,'sale',kind,oa,oc,na,nc,'owner','fixture'
 FROM (VALUES(1,'initial_observation',NULL::numeric,NULL,100.25,'USD'),(2,'change',100.25,'USD',110.50,'USD'),
 (3,'draft_removal',110.50,'USD',NULL::numeric,NULL),(4,'migration_baseline',NULL::numeric,NULL,1000000,'CRC'))v(n,kind,oa,oc,na,nc);
SELECT pg_temp.ok((SELECT count(*)=4 FROM public.listing_monetary_events),'four monetary event shapes');
SELECT pg_temp.reject($q$INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,new_amount,actor_kind,actor_identity) VALUES('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000005',1,'sale','initial_observation',100,'owner','fixture')$q$,'23514','incomplete money pair rejected');
SELECT pg_temp.reject($q$INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,new_amount,new_currency,actor_kind,actor_identity) VALUES('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000005',1,'sale','initial_observation','Infinity','USD','owner','fixture')$q$,'23514','nonfinite money rejected');
SELECT pg_temp.reject($q$INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,old_amount,old_currency,new_amount,new_currency,actor_kind,actor_identity) VALUES('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000005',1,'sale','change',100,'USD',100,'USD','owner','fixture')$q$,'23514','unchanged monetary event rejected');
INSERT INTO public.listing_source_observations(id,source_name,source_listing_id,source_observation_id,listing_id,outcome,payload_fingerprint)
 VALUES('60000000-0000-0000-0000-000000000001','fixture','opaque-001','observation-1','10000000-0000-0000-0000-000000000002','conflict',repeat('c',64));
SELECT pg_temp.reject($q$INSERT INTO public.listing_source_observations(source_name,source_listing_id,source_observation_id,listing_id,outcome,payload_fingerprint) VALUES('fixture','opaque-001','observation-1','10000000-0000-0000-0000-000000000002','accepted',repeat('d',64))$q$,'23505','source observation idempotency key');
INSERT INTO public.source_identity_conflicts(listing_id,observation_id,source_name,source_listing_id,existing_transaction_type,observed_transaction_type,existing_province_code,existing_canton_code,observed_province_code,observed_canton_code,conflict_type)
 VALUES('10000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','fixture','opaque-001','sale','rent','1','101','1','101','transaction');
SELECT pg_temp.reject($q$UPDATE public.source_identity_conflicts SET observed_transaction_type='sale'$q$,'23514','conflict must describe actual mismatch');
SELECT pg_temp.reject($q$UPDATE public.source_identity_conflicts SET source_listing_id='wrong'$q$,'23503','conflict observation identity tied');
SELECT pg_temp.reject($q$UPDATE public.source_identity_conflicts SET resolution_status='resolved'$q$,'23514','resolution needs evidence');
DO $f$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['listing_lifecycle_events','listing_monetary_events','listing_source_observations','canonical_operation_receipts','listing_classification_rules','listing_classification_rule_sets'] LOOP
 PERFORM pg_temp.reject(format('UPDATE public.%I SET recorded_at=now()',t),'55000',t||' immutable update') WHERE t NOT IN ('listing_source_observations','canonical_operation_receipts');
 IF t='listing_source_observations' THEN PERFORM pg_temp.reject('UPDATE public.listing_source_observations SET processed_at=now()','55000',t||' immutable update'); END IF;
 IF t='canonical_operation_receipts' THEN PERFORM pg_temp.reject('UPDATE public.canonical_operation_receipts SET completed_at=now()','55000',t||' immutable update'); END IF;
 PERFORM pg_temp.reject(format('DELETE FROM public.%I',t),'55000',t||' immutable delete');
 PERFORM pg_temp.reject(format('TRUNCATE public.%I CASCADE',t),'55000',t||' immutable truncate');
 END LOOP;
END $f$;
DO $f$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['publisher_accounts','capacity_policy_guard','listing_semantic_selections','listing_fact_evidence','listing_classification_rule_sets','listing_classification_rules','listing_membership_origins','canonical_operation_receipts','listing_source_observations','source_identity_conflicts','listing_lifecycle_events','listing_monetary_events'] LOOP
 PERFORM pg_temp.ok((SELECT relrowsecurity AND relowner='postgres'::regrole FROM pg_class WHERE oid=('public.'||t)::regclass),'owner/RLS: '||t);
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 PERFORM pg_temp.ok(NOT has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),'no grants: '||t||'/'||r);
 END LOOP;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 PERFORM pg_temp.ok(NOT has_schema_privilege(r,'twuanis_canonical_private','USAGE'),'private schema: '||r);
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace='twuanis_canonical_private'::regnamespace AND has_function_privilege(r,oid,'EXECUTE')),'private functions: '||r);
 END LOOP;
END $f$;
SELECT pg_temp.ok((SELECT count(*)=14 FROM public.listing_lifecycle_events),'failed mutation preserves lifecycle history');
SELECT pg_temp.ok((SELECT count(*)=4 FROM public.listing_monetary_events),'failed mutation preserves money history');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'),'no application policies created');

-- S1R regressions use subtransactions so they cannot change the original fixture.
CREATE FUNCTION pg_temp.accept_rolled_back(sql text, expected text, label text)
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE actual text;
BEGIN
 BEGIN
  EXECUTE sql INTO STRICT actual;
  RAISE EXCEPTION 'rollback accepted regression fixture' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
 PERFORM pg_temp.ok(actual IS NOT DISTINCT FROM expected,label);
END $f$;
DO $f$
DECLARE v numeric; d text; q text;
BEGIN
 FOREACH v IN ARRAY ARRAY[0,-1]::numeric[] LOOP
  PERFORM pg_temp.reject(format($q$INSERT INTO public.listing_fact_evidence
   (listing_id,dimension,kind,exact_value,evidence_source)
   VALUES('10000000-0000-0000-0000-000000000001','bathrooms','exact',%L,'owner')$q$,v),
   '23514','S1R bathroom rejects '||v);
 END LOOP;
 FOREACH v IN ARRAY ARRAY[0.5,1,1.5,2,2.5]::numeric[] LOOP
  PERFORM pg_temp.accept_rolled_back(format($q$INSERT INTO public.listing_fact_evidence
   (listing_id,dimension,kind,exact_value,evidence_source)
   VALUES('10000000-0000-0000-0000-000000000001','bathrooms','exact',%L,'owner')
   RETURNING exact_value::text$q$,v),v::text,'S1R bathroom accepts '||v);
 END LOOP;
 FOREACH d IN ARRAY ARRAY['bedrooms','parking'] LOOP
  q:=format($q$INSERT INTO public.listing_fact_evidence
   (listing_id,dimension,kind,exact_value,evidence_source)
   VALUES('10000000-0000-0000-0000-000000000001',%L,'exact',0,'owner')
   RETURNING exact_value::text$q$,d);
  PERFORM pg_temp.accept_rolled_back(q,'0','S1R '||d||' zero remains valid');
  PERFORM pg_temp.reject(replace(q,'''exact'',0','''exact'',0.5'),'23514','S1R fractional '||d||' rejected');
 END LOOP;
 PERFORM pg_temp.accept_rolled_back($q$INSERT INTO public.listing_fact_evidence
  (listing_id,dimension,kind,category_term_id,evidence_source)
  VALUES('10000000-0000-0000-0000-000000000001','bathrooms','category',11,'owner')
  RETURNING kind$q$,'category','S1R bathroom category remains valid');
 PERFORM pg_temp.accept_rolled_back($q$INSERT INTO public.listing_fact_evidence
  (listing_id,dimension,kind,range_lower,range_upper,lower_inclusive,upper_inclusive,evidence_source)
  VALUES('10000000-0000-0000-0000-000000000001','bathrooms','range',0,1,true,false,'owner')
  RETURNING kind$q$,'range','S1R bathroom range with zero endpoint unchanged');
END $f$;
DO $f$
DECLARE t text; c text; maxlen integer; value text; q text; patch text; label text; accepted boolean; case_name text;
BEGIN
 FOR t,c,maxlen IN SELECT * FROM (VALUES
  ('canonical_operation_receipts','authority_identity',256),
  ('listing_source_observations','source_name',128),
  ('listing_source_observations','source_listing_id',256),
  ('listing_source_observations','source_observation_id',256),
  ('source_identity_conflicts','resolution_reference',1024),
  ('listing_lifecycle_events','actor_identity',256),
  ('listing_monetary_events','actor_identity',256)) fields(t,c,n)
 LOOP
  label:='S1R '||t||'.'||c;
  -- All values are validated as supplied, including case, punctuation and padding.
  FOR value,accepted,case_name IN SELECT * FROM (VALUES
   ('ABC123',true,'alphanumeric'),('ABC-123_X/9',true,'punctuation'),
   ('ABC-123',true,'case'),('  ABC-123  ',true,'padding preserved'),
   (repeat('X',maxlen),true,'maximum'),(repeat(' ',10000)||'X',false,'overlong padding'),
   (' ',false,'spaces'),(E'\t',false,'tabs'),(E'\n',false,'newlines'),
   (E'\r',false,'carriage returns'),(E' \t\n\r ',false,'mixed whitespace'),
   (repeat('X',maxlen+1),false,'maximum plus one')) cases(value,accepted,case_name)
  LOOP
   IF t='source_identity_conflicts' THEN
    q:=format('UPDATE public.source_identity_conflicts SET resolution_status=''resolved'',resolved_at=now(),resolution_reference=%L RETURNING resolution_reference',value);
   ELSE
    patch:='jsonb_build_object(''id'',gen_random_uuid()';
    IF t='canonical_operation_receipts' THEN
     patch:=patch||',''request_id'',gen_random_uuid()';
    ELSIF t='listing_source_observations' THEN
     patch:=patch||',''source_observation_id'',''s1r-regression''';
    ELSE
     patch:=patch||',''operation_id'',''40000000-0000-0000-0000-000000000020''';
    END IF;
    patch:=patch||format(',%L,%L)',c,value);
    q:=format('INSERT INTO public.%I SELECT (jsonb_populate_record(NULL::public.%I,to_jsonb(src)||%s)).* FROM public.%I src LIMIT 1 RETURNING %I',t,t,patch,t,c);
   END IF;
   IF NOT accepted THEN
    PERFORM pg_temp.reject(q,'23514',label||' rejects '||case_name);
   ELSE
    PERFORM pg_temp.accept_rolled_back(q,value,label||' preserves '||case_name);
   END IF;
  END LOOP;
 END LOOP;
END $f$;

SELECT count(*) AS passed_structural_assertions FROM test_results;
\echo S1 STRUCTURAL VERIFICATION PASSED
