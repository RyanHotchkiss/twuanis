\set ON_ERROR_STOP on
-- CG-3B2B2-S3 local verification. NEVER run against a linked or production DB.
-- Prerequisite: fresh Unix-socket PostgreSQL, postgres role. Run the unchanged
-- publisher-coordination.sql in cg_s1_verification (includes 230 S1 + 128 S2).
-- Run unchanged S1 supplemental and S2 concurrency there. Clone that completed
-- disposable baseline into cg_s3_verification, then run this file exactly once.
-- This file extends only the representative fixture, applies unchanged 003 and
-- new 006, establishes explicit canonical fixtures, then rolls domain tests back.
-- Follow with canonical-domain-concurrency.py on that disposable S3 database.
\set ON_ERROR_STOP on
-- Disposable S3 extension of the already-verified S1/S2 fixture, never production.
DO $$ BEGIN IF current_database()<>'cg_s3_verification' OR inet_server_addr() IS NOT NULL OR session_user<>'postgres' THEN RAISE EXCEPTION 'disposable only'; END IF; END $$;
CREATE EXTENSION unaccent WITH SCHEMA public;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
ALTER TABLE public.listings
 ADD COLUMN province text,ADD COLUMN canton text,ADD COLUMN district text,
 ADD COLUMN province_normalized text,ADD COLUMN canton_normalized text,ADD COLUMN district_normalized text,
 ADD COLUMN property_type text,ADD COLUMN utility text[],ADD COLUMN environment text,ADD COLUMN terrain text[],ADD COLUMN accessibility text,ADD COLUMN legal_status text,
 ADD COLUMN bedrooms text,ADD COLUMN bathrooms text,ADD COLUMN parking text,ADD COLUMN year_built_range text,ADD COLUMN distance_to_paved_road_range text,
 ADD COLUMN first_seen timestamptz,ADD COLUMN last_seen timestamptz,ADD COLUMN last_scraped timestamptz,ADD COLUMN times_scraped integer;
CREATE TABLE public.ontology_relationships(source_term_id bigint REFERENCES public.ontology_terms,target_term_id bigint REFERENCES public.ontology_terms,relationship_type text,PRIMARY KEY(source_term_id,target_term_id,relationship_type));
-- S1's small fixture used ID 9 for an accessibility leaf. Relocate that fixture leaf;
-- actual canonical dictionary uses ID 9 as Costa Rica context.
INSERT INTO public.ontology_terms SELECT 109,term_type,level,parent_id,term_name,official_code FROM public.ontology_terms WHERE id=9;
UPDATE public.listing_semantic_selections SET ontology_term_id=109 WHERE ontology_term_id=9;
UPDATE public.ontology_terms SET term_type='country',level=0,term_name='Costa Rica' WHERE id=9;
INSERT INTO public.ontology_terms(id,term_type,level,parent_id,term_name,official_code) VALUES
 (1001,'province',1,9,'Cartago','3'),(1002,'canton',2,1001,'Jiménez','304'),(1003,'district',3,1002,'Pejivalle','30403'),
 (1004,'province',1,9,'San José','1'),(1005,'canton',2,1004,'San José','101'),(1006,'district',3,1005,'Carmen','10101'),
 (1007,'canton',2,1001,'La Unión','303'),(1008,'district',3,1002,'Tucurrique','30402'),
 (1010,'environment',1,6,'Forest',NULL),(1011,'environment',1,6,'Beach',NULL),
 (1012,'terrain',1,6,'Slope',NULL),(1013,'legal_status',1,6,'Titled',NULL),
 (1014,'accessibility',1,6,'4x4 Required',NULL),(1015,'accessibility',1,6,'Walkable',NULL),(1016,'accessibility',1,6,'Boat Access Only',NULL),
 (1017,'construction_area',1,6,'Small construction',NULL),(1018,'bedrooms',1,6,'Bedroom band',NULL),
 (1019,'bathrooms',1,6,'Bathroom band',NULL),(1020,'parking',1,6,'Parking band',NULL),(1021,'year_built',1,6,'Year band',NULL);
UPDATE public.ontology_terms SET parent_id=6 WHERE term_type IN ('property_type','utility','terrain','accessibility') AND level=1;
CREATE UNIQUE INDEX s3_fixture_geo_code ON public.ontology_terms(official_code) WHERE term_type IN ('province','canton','district');

\ir ../../supabase/migrations/003_canonical_listing_write_boundary.sql
\ir ../../supabase/migrations/006_canonical_domain_machinery.sql
\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'cg_s3_verification' OR inet_server_addr() IS NOT NULL OR session_user<>'postgres' THEN RAISE EXCEPTION 'disposable only'; END IF; END $$;
CREATE TEMP TABLE assertions(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label; END IF; INSERT INTO assertions VALUES(label); END $$;
CREATE FUNCTION pg_temp.reject(q text,code text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE e text; BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS e=RETURNED_SQLSTATE; END; PERFORM pg_temp.ok(e IS NOT DISTINCT FROM code,label||' ['||coalesce(e,'success')||']'); END $$;
CREATE FUNCTION pg_temp.run(n integer,d jsonb,rev bigint DEFAULT NULL,req uuid DEFAULT NULL,src jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE l public.listings%ROWTYPE; BEGIN SELECT * INTO STRICT l FROM public.listings WHERE id=('70000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid; RETURN twuanis_canonical_private.s3_command(l.id,coalesce(rev,l.canonical_revision),CASE WHEN src IS NOT NULL OR l.owner_id IS NULL THEN 'trusted' ELSE 'owner' END,CASE WHEN src IS NOT NULL OR l.owner_id IS NULL THEN 'fixture-source' ELSE l.owner_id::text END,coalesce(req,gen_random_uuid()),d,src); END $$;
INSERT INTO auth.users(id) VALUES('00000000-0000-0000-0000-000000000201'),('00000000-0000-0000-0000-000000000202');
SELECT twuanis_canonical_private.ensure_publisher_account(id) FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202');
INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle) SELECT id,'90000000-0000-0000-0000-000000000001','active','monthly' FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202');
INSERT INTO twuanis_canonical_private.accessibility_identity VALUES(109,'paved'),(10,'2wd'),(1014,'4x4'),(1015,'walkable'),(1016,'boat');
INSERT INTO public.listings(id,owner_id,publisher_account_id,transaction_type,listing_status,listing_origin,listing_source_type,canonical_domain_version,province,canton,province_normalized,canton_normalized,property_type,current_price,monthly_price,currency,price_millions,source_name,source_listing_id,times_scraped)
SELECT ('70000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 CASE WHEN n=3 THEN NULL ELSE ('00000000-0000-0000-0000-'||CASE WHEN n=2 THEN '000000000202' ELSE '000000000201' END)::uuid END,
 CASE WHEN n=3 THEN NULL ELSE (SELECT id FROM publisher_accounts WHERE owner_user_id=('00000000-0000-0000-0000-'||CASE WHEN n=2 THEN '000000000202' ELSE '000000000201' END)::uuid) END,
 CASE WHEN n=4 THEN 'rent' ELSE 'sale' END,'draft',CASE WHEN n=3 THEN 'scraped' ELSE 'customer' END,CASE WHEN n=3 THEN 'realtor' ELSE 'customer' END,1,'Cartago','Jiménez','cartago','jimenez','House',CASE WHEN n=4 THEN NULL ELSE 10 END,CASE WHEN n=4 THEN 10 ELSE NULL END,'USD',50,CASE WHEN n=3 THEN ' s/fixture ' END,CASE WHEN n=3 THEN '  ABC-123_X/9  ' END,0 FROM generate_series(1,12)n;
INSERT INTO listing_semantic_selections(listing_id,dimension,ontology_term_id) SELECT id,'property_type',1 FROM listings WHERE id::text LIKE '70000000-%';
SELECT twuanis_canonical_private.s3_origins(id,'geography',ARRAY[1001,1002]::bigint[]) FROM listings WHERE id::text LIKE '70000000-%';
SELECT twuanis_canonical_private.s3_origins(id,'property_type',ARRAY[1]::bigint[]) FROM listings WHERE id::text LIKE '70000000-%';
INSERT INTO listing_classification_rule_sets(id,domain,version) VALUES('80000000-0000-0000-0000-000000000001','property_area',100),('80000000-0000-0000-0000-000000000002','bedrooms',100);
INSERT INTO listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('80000000-0000-0000-0000-000000000001',7,'[0,100)'),('80000000-0000-0000-0000-000000000001',8,'[100,)'),('80000000-0000-0000-0000-000000000002',1018,'[0,)');
SELECT twuanis_canonical_private.s3_seal_classification(id) FROM listing_classification_rule_sets WHERE id::text LIKE '80000000-%';
-- All behavior tests roll back to the committed canonical fixture for concurrency.
BEGIN;
SELECT pg_temp.ok((pg_temp.run(1,'{"geography":{"province":"3","canton":"304","district":"30403"}}')->>'revision')='1','P+C to P+C+D');
SELECT pg_temp.ok((SELECT district='Pejivalle' FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'Pejivalle preserved');
SELECT pg_temp.ok((pg_temp.run(1,'{"geography":{"province":"3","canton":"304","district":null}}')->>'revision')='2','P+C+D to P+C');
SELECT pg_temp.ok((SELECT district IS NULL FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'district projection clears');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"geography":{"province":"3"}}')$q$,'22023','Province-only rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"geography":{"province":"1","canton":"304"}}')$q$,'23514','wrong ancestry');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"geography":{"province":"03","canton":"304"}}')$q$,'22023','bad DTA shape');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"geography":{"province":"8","canton":"801"}}')$q$,'P0002','unknown DTA');
SELECT pg_temp.reject($q$UPDATE ontology_terms SET term_type='province' WHERE id=1007; SELECT pg_temp.run(1,'{"geography":{"province":"3","canton":"303"}}')$q$,'23514','wrong geographic type');
SELECT pg_temp.run(1,'{"semantics":{"utility":["3","4"],"environment":["1010","1011"],"terrain":["9007199254740993","1012"],"legal_status":["1013"]}}');
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_semantic_selections WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='environment'),'environment set');
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_semantic_selections WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='terrain'),'terrain bigint safe');
SELECT pg_temp.run(1,'{"semantics":{"utility":[]}}');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listings_ontology_terms WHERE listing_id='70000000-0000-0000-0000-000000000001' AND ontology_term_id=6),'shared root survives');
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_semantic_selections WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='environment'),'omitted domain preserved');
SELECT pg_temp.run(1,'{"geography":{"province":"3","canton":"304","district":"30403"}}');
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_semantic_selections WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='terrain'),'geography preserves semantics');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listings_ontology_terms WHERE listing_id='70000000-0000-0000-0000-000000000001' AND ontology_term_id=9007199254740993),'geography preserves nongeo membership');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"semantics":{"property_type":[]}}')$q$,'23514','required property type cannot clear');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"semantics":{"property_type":["1","2"]}}')$q$,'23514','property singleton');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"semantics":{"terrain":["3"]}}')$q$,'23514','wrong semantic type');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"semantics":{"terrain":[9007199254740993]}}')$q$,'22023','numeric bigint boundary denied');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"semantics":{"utility":null}}')$q$,'22023','null differs from clear');
SELECT pg_temp.run(1,'{"semantics":{"property_type":["2"],"legal_status":[]}}');
SELECT pg_temp.ok((SELECT property_type='Land' AND legal_status IS NULL FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'single replacement and optional clear');
DO $$ DECLARE s jsonb; BEGIN FOR s IN SELECT value FROM jsonb_array_elements('[["109","10"],["109","1015"],["10","1015"],["1014","1015"],["1016"]]') LOOP PERFORM pg_temp.run(1,jsonb_build_object('semantics',jsonb_build_object('accessibility',s))); PERFORM pg_temp.ok(true,'valid accessibility '||s::text); END LOOP; END $$;
DO $$ DECLARE s jsonb; BEGIN FOR s IN SELECT value FROM jsonb_array_elements('[["10","1014"],["1014","109"],["1016","1015"]]') LOOP PERFORM pg_temp.reject(format('SELECT pg_temp.run(1,%L::jsonb)',jsonb_build_object('semantics',jsonb_build_object('accessibility',s))),'23514','invalid accessibility '||s::text); END LOOP; END $$;
SELECT pg_temp.run(1,'{"semantics":{"utility":["4","3","3"]}}');
SELECT pg_temp.ok((pg_temp.run(1,'{"semantics":{"utility":["3","4"]}}')->>'outcome')='noop','deduplicated reordered set noop');
DO $$ DECLARE d text; v text; BEGIN
 FOREACH d IN ARRAY ARRAY['bathrooms','bedrooms','parking'] LOOP
  FOREACH v IN ARRAY ARRAY['0','0.5','1.5'] LOOP
   IF (d='bathrooms' AND v='0') OR (d IN ('bedrooms','parking') AND v<>'0') THEN
    PERFORM pg_temp.reject(format('SELECT pg_temp.run(1,%L::jsonb)',jsonb_build_object('facts',jsonb_build_object(d,jsonb_build_object('kind','exact','value',v,'source','owner')))),'23514',d||' rejects '||v);
   ELSE PERFORM pg_temp.run(1,jsonb_build_object('facts',jsonb_build_object(d,jsonb_build_object('kind','exact','value',v,'source','owner'))));PERFORM pg_temp.ok(true,d||' accepts '||v);END IF;
  END LOOP;
 END LOOP;
END $$;
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"facts":{"bathrooms":{"kind":"exact","value":"-1","source":"owner"}}}')$q$,'22023','negative bathroom');
SELECT pg_temp.run(1,'{"facts":{"bedrooms":{"kind":"category","term":"5","source":"owner"},"year_built":{"kind":"range","lower":"2010","upper":"2019","lower_inclusive":true,"upper_inclusive":true,"source":"owner"}}}');
SELECT pg_temp.ok((SELECT exact_value IS NULL AND category_term_id=5 FROM listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='bedrooms'),'5+ not exact five');
SELECT pg_temp.ok((SELECT exact_value IS NULL AND range_lower=2010 AND range_upper=2019 FROM listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='year_built'),'year range no midpoint');
SELECT pg_temp.run(1,'{"facts":{"bedrooms":{"kind":"exact","value":"6","source":"owner","rule_set":"80000000-0000-0000-0000-000000000002"},"year_built":{"kind":"exact","value":"2015","source":"owner"}}}');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listing_membership_origins o JOIN listing_classification_rules r ON r.id=o.classification_rule_id WHERE o.listing_id='70000000-0000-0000-0000-000000000001' AND o.origin_domain='bedrooms' AND r.rule_set_id='80000000-0000-0000-0000-000000000002'),'classification version attributed');
SELECT pg_temp.run(1,'{"facts":{"bedrooms":{"kind":"clear"}}}');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000001' AND dimension='bedrooms'),'fact clear');
SELECT pg_temp.run(1,'{"measurements":{"property_area":{"value":"850.123","rule_set":"80000000-0000-0000-0000-000000000001"},"construction_area":{"value":"100.75"}}}');
SELECT pg_temp.ok((SELECT property_area=850.123 AND construction_area=100.75 FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'exact measurements preserved not band endpoint');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"measurements":{"property_area":{"value":"0"}}}')$q$,'23514','zero area rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"measurements":{"construction_area":{"value":"0"}}}')$q$,'23514','zero construction rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"measurements":{"property_area":{"value":"-1"}}}')$q$,'22023','negative area rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"measurements":{"construction_area":{"value":"-1"}}}')$q$,'22023','negative construction rejected');
DO $$ DECLARE n integer;c text;v text; BEGIN FOREACH n IN ARRAY ARRAY[1,4] LOOP FOREACH c IN ARRAY ARRAY['CRC','USD'] LOOP FOREACH v IN ARRAY ARRAY['0.50','1','999999999999999999999999.123456789'] LOOP PERFORM pg_temp.run(n,jsonb_build_object('money',jsonb_build_object('amount',v,'currency',c))); PERFORM pg_temp.ok((SELECT (CASE WHEN transaction_type='sale' THEN current_price ELSE monthly_price END)=v::numeric AND currency=c AND price_millions=50 FROM listings WHERE id=('70000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid),'exact monetary pair '||n||'/'||c||'/'||v); END LOOP;END LOOP;END LOOP;END $$;
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"amount":"0","currency":"USD"}}')$q$,'23514','zero money');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"amount":"-1","currency":"USD"}}')$q$,'22023','negative money');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"amount":"2","currency":"EUR"}}')$q$,'23514','invalid currency');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"currency":"USD"}}')$q$,'22023','currency-only denied');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"amount":"2"}}')$q$,'22023','amount-only denied');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"money":{"amount":"2","currency":"USD","monthly_price":"2"}}')$q$,'22023','arbitrary target denied');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"transaction_type":"rent"}')$q$,'22023','transaction mutation denied');
DO $$ DECLARE r bigint;events bigint;a jsonb;b jsonb;req uuid:=gen_random_uuid();BEGIN
 SELECT canonical_revision INTO r FROM listings WHERE id='70000000-0000-0000-0000-000000000001';SELECT count(*) INTO events FROM listing_monetary_events WHERE listing_id='70000000-0000-0000-0000-000000000001';
 a:=pg_temp.run(1,'{"money":{"amount":"0.50","currency":"CRC"},"semantics":{"terrain":["1012"]}}',r,req);
 b:=pg_temp.run(1,'{"money":{"amount":"0.50","currency":"CRC"},"semantics":{"terrain":["1012"]}}',r,req);
 PERFORM pg_temp.ok((a->>'revision')::bigint=r+1 AND b->>'revision'=a->>'revision' AND b->>'replayed'='true','composed one revision and replay');
 PERFORM pg_temp.ok((SELECT count(*)=events+1 FROM listing_monetary_events WHERE listing_id='70000000-0000-0000-0000-000000000001'),'one monetary event on replay');
 PERFORM pg_temp.reject(format('SELECT pg_temp.run(1,''{"money":{"amount":"7","currency":"CRC"}}'',%s,%L)',r,req),'22023','request ID payload conflict');
 PERFORM pg_temp.reject(format('SELECT pg_temp.run(1,''{}'',%s)',r),'40001','stale revision');
 PERFORM pg_temp.ok((pg_temp.run(1,'{"money":{"amount":"0.50","currency":"CRC"}}')->>'outcome')='noop','same money noop');
 PERFORM pg_temp.ok((SELECT count(*)=events+1 FROM listing_monetary_events WHERE listing_id='70000000-0000-0000-0000-000000000001'),'noop no monetary event');
END $$;
SELECT pg_temp.run(1,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"renew","duration_seconds":"3600"}}');
SELECT pg_temp.ok((SELECT publication_expires_at>clock_timestamp()+interval '7100 seconds' FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'early renewal extends prior deadline');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"unpublish"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"archive"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"expire"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"renew","duration_seconds":"3600"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"archive"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"delete"}}');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.ok((SELECT listing_status='draft' AND deleted_at IS NOT NULL AND expired_at IS NOT NULL FROM listings WHERE id='70000000-0000-0000-0000-000000000001'),'restore retains history timestamps without current-state confusion');
SELECT pg_temp.reject($q$SELECT pg_temp.run(1,'{"lifecycle":{"event":"restore"}}')$q$,'22023','same-state restore denied');
SELECT pg_temp.run(1,'{"lifecycle":{"event":"delete"}}');SELECT pg_temp.run(1,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_lifecycle_events WHERE listing_id='70000000-0000-0000-0000-000000000001' AND event_type='delete'),'repeated delete history');
-- Source refinements and immutable conflicts.
DO $$ DECLARE src jsonb; a jsonb;before jsonb;r bigint;BEGIN
 src:='{"source_name":" s/fixture ","source_listing_id":"  ABC-123_X/9  ","observation_id":"obs-1","observed_at":"2026-09-16T00:00:00Z","transaction":"sale","geography":{"province":"3","canton":"304","district":"30403"}}';
 a:=pg_temp.run(3,'{"money":{"amount":"20.5","currency":"CRC"},"semantics":{"terrain":["1012"]}}',NULL,NULL,src);
 PERFORM pg_temp.ok(a->>'outcome'='succeeded','source composed accepted');
 PERFORM pg_temp.ok((pg_temp.run(3,'{"money":{"amount":"20.5","currency":"CRC"},"semantics":{"terrain":["1012"]}}',NULL,NULL,src)->>'replayed')='true','source different-request replay');
 PERFORM pg_temp.ok((SELECT times_scraped=1 AND current_price=20.5 AND district='Pejivalle' AND source_listing_id='  ABC-123_X/9  ' AND first_seen=last_seen AND last_scraped IS NOT NULL FROM listings WHERE id='70000000-0000-0000-0000-000000000003'),'source metadata opaque identity');
 PERFORM pg_temp.reject(format('SELECT pg_temp.run(3,''{}'',NULL,NULL,%L)',src),'22023','same observation different payload');
 SELECT to_jsonb(l) INTO before FROM listings l WHERE id='70000000-0000-0000-0000-000000000003';
 src:=jsonb_set(jsonb_set(src,'{observation_id}','"obs-conflict"'),'{transaction}','"rent"');
 a:=pg_temp.run(3,'{}',NULL,NULL,src);
 PERFORM pg_temp.ok(a->>'outcome'='conflict' AND (SELECT to_jsonb(l)=before FROM listings l WHERE id='70000000-0000-0000-0000-000000000003'),'transaction conflict preserves listing');
 src:=jsonb_set(jsonb_set(jsonb_set(src,'{observation_id}','"obs-province"'),'{transaction}','"sale"'),'{geography}','{"province":"1","canton":"101"}');
 PERFORM pg_temp.ok((pg_temp.run(3,'{}',NULL,NULL,src)->>'outcome')='conflict','Province conflict');
 src:=jsonb_set(jsonb_set(src,'{observation_id}','"obs-canton"'),'{geography}','{"province":"3","canton":"303"}');
 PERFORM pg_temp.ok((pg_temp.run(3,'{}',NULL,NULL,src)->>'outcome')='conflict','Canton conflict');
 src:=jsonb_set(jsonb_set(src,'{observation_id}','"obs-refine"'),'{geography}','{"province":"3","canton":"304"}');
 PERFORM pg_temp.ok((pg_temp.run(3,'{}',NULL,NULL,src)->>'outcome')='succeeded','District removal not identity conflict');
 PERFORM pg_temp.ok((SELECT times_scraped=2 AND district IS NULL FROM listings WHERE id='70000000-0000-0000-0000-000000000003'),'distinct accepted source count');
END $$;
-- Failure after preceding geo/semantic/fact/money changes: entire SQL call rolls back.
DO $$ DECLARE b jsonb; r bigint; BEGIN
 SELECT to_jsonb(l) INTO b FROM listings l WHERE id='70000000-0000-0000-0000-000000000002';
 PERFORM pg_temp.reject($q$SELECT pg_temp.run(2,'{"geography":{"province":"3","canton":"304","district":"30403"},"semantics":{"terrain":["1012"]},"facts":{"bathrooms":{"kind":"exact","value":"1.5","source":"owner"}},"money":{"amount":"8","currency":"CRC"},"lifecycle":{"event":"restore"}}')$q$,'22023','mid-command failure');
 PERFORM pg_temp.ok((SELECT to_jsonb(l)=b FROM listings l WHERE id='70000000-0000-0000-0000-000000000002'),'failed command row unchanged');
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000002'),'failed fact rollback');
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM canonical_operation_receipts WHERE listing_id='70000000-0000-0000-0000-000000000002'),'failed receipt rollback');
END $$;
CREATE FUNCTION pg_temp.capacity_case(a integer,n integer,st text,ev text,expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; res jsonb; label text:=coalesce(a::text,'unlimited')||'/'||n||'/'||st||'/'||ev;
BEGIN
 BEGIN
  UPDATE package_limits SET listing_limit=a WHERE package_id='90000000-0000-0000-0000-000000000001';
  UPDATE listings SET listing_status='draft' WHERE id::text LIKE '70000000-%' AND owner_id='00000000-0000-0000-0000-000000000201';
  UPDATE listings SET listing_status='active' WHERE id IN (SELECT id FROM listings WHERE id::text LIKE '70000000-%' AND owner_id='00000000-0000-0000-0000-000000000201' AND id<>'70000000-0000-0000-0000-000000000001' ORDER BY id LIMIT greatest(n-CASE WHEN st='active' THEN 1 ELSE 0 END,0));
  UPDATE listings SET listing_status=st,publication_expires_at=clock_timestamp()+interval '1 hour' WHERE id='70000000-0000-0000-0000-000000000001';
  res:=pg_temp.run(1,jsonb_build_object('lifecycle',jsonb_build_object('event',ev,'duration_seconds','3600')));
  actual:='success';RAISE EXCEPTION 'test rollback' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL; WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=RETURNED_SQLSTATE; END;
 PERFORM pg_temp.ok(actual=expected,'capacity '||label||' -> '||actual);
END $$;
SELECT pg_temp.capacity_case(0,0,'draft','publish','23514');
SELECT pg_temp.capacity_case(1,0,'draft','publish','success');
SELECT pg_temp.capacity_case(1,1,'draft','publish','23514');
SELECT pg_temp.capacity_case(5,5,'active','renew','success');
SELECT pg_temp.capacity_case(5,6,'active','renew','23514');
SELECT pg_temp.capacity_case(5,6,'expired','renew','23514');
SELECT pg_temp.capacity_case(5,3,'expired','renew','success');
SELECT pg_temp.capacity_case(NULL,6,'draft','publish','success');
SELECT pg_temp.run(3,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');
SELECT pg_temp.ok((SELECT publisher_account_id IS NULL AND listing_status='active' FROM listings WHERE id='70000000-0000-0000-0000-000000000003'),'trusted ownerless publication');
SELECT pg_temp.reject($q$UPDATE listings SET publisher_account_id=NULL WHERE id='70000000-0000-0000-0000-000000000002'; SELECT pg_temp.run(2,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}')$q$,'55000','customer publisher missing fail closed');
SELECT pg_temp.reject($q$UPDATE listings SET canonical_domain_version=NULL WHERE id='70000000-0000-0000-0000-000000000002'; SELECT pg_temp.run(2,'{}')$q$,'55000','legacy row cannot become canonical');
-- Required remaining lifecycle edges and elapsed renewal deadline.
SELECT pg_temp.run(2,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');
SELECT pg_temp.run(2,'{"lifecycle":{"event":"delete"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.run(2,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"expire"}}');
UPDATE listings SET publication_expires_at=clock_timestamp()-interval '1 day' WHERE id='70000000-0000-0000-0000-000000000002';
SELECT pg_temp.run(2,'{"lifecycle":{"event":"renew","duration_seconds":"3600"}}');
SELECT pg_temp.ok((SELECT publication_expires_at BETWEEN clock_timestamp()+interval '3500 seconds' AND clock_timestamp()+interval '3600 seconds' FROM listings WHERE id='70000000-0000-0000-0000-000000000002'),'elapsed renewal begins now');
SELECT pg_temp.run(2,'{"lifecycle":{"event":"expire"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"archive"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.run(2,'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"expire"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"delete"}}');SELECT pg_temp.run(2,'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.ok((SELECT count(*)=3 FROM listing_lifecycle_events WHERE listing_id='70000000-0000-0000-0000-000000000002' AND event_type='expire'),'repeated expire history retained');
SELECT pg_temp.run(2,'{"facts":{"year_built":{"kind":"range","lower":"2000","upper":"2009","lower_inclusive":true,"upper_inclusive":true,"source":"owner"}}}');
SELECT pg_temp.run(2,'{"facts":{"year_built":{"kind":"range","lower":"2010","upper":"2019","lower_inclusive":true,"upper_inclusive":true,"source":"owner"}}}');
SELECT pg_temp.ok((SELECT range_lower=2010 AND exact_value IS NULL FROM listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000002' AND dimension='year_built'),'range to range preserves precision');
-- Explicit classification applied to an unchanged exact measurement still changes projection.
SELECT pg_temp.run(2,'{"measurements":{"property_area":{"value":"800.5"}}}');
SELECT pg_temp.run(2,'{"measurements":{"property_area":{"value":"800.5","rule_set":"80000000-0000-0000-0000-000000000001"}}}');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listing_membership_origins WHERE listing_id='70000000-0000-0000-0000-000000000002' AND origin_domain='property_area' AND classification_rule_id IS NOT NULL),'classification on unchanged measurement');
SELECT pg_temp.reject($q$INSERT INTO listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('80000000-0000-0000-0000-000000000001',1017,'[500,600)')$q$,'55000','sealed version cannot append');
-- Fail after receipt/events and final row update has begun; original statement is atomic.
CREATE FUNCTION pg_temp.fail_final() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected final write failure' USING ERRCODE='ZX002'; END $$;
DO $$ DECLARE before jsonb; n bigint;m bigint;src jsonb; BEGIN
 SELECT to_jsonb(l) INTO before FROM listings l WHERE id='70000000-0000-0000-0000-000000000003';
 SELECT count(*) INTO n FROM canonical_operation_receipts;SELECT count(*) INTO m FROM listing_monetary_events;
 CREATE TRIGGER s3_test_final_failure BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_final();
 src:='{"source_name":" s/fixture ","source_listing_id":"  ABC-123_X/9  ","observation_id":"obs-fault","observed_at":"2026-09-17T00:00:00Z","transaction":"sale","geography":{"province":"3","canton":"304","district":"30402"}}';
 PERFORM pg_temp.reject(format('SELECT pg_temp.run(3,%L::jsonb,NULL,NULL,%L::jsonb)','{"money":{"amount":"40","currency":"USD"},"lifecycle":{"event":"renew","duration_seconds":"3600"}}',src),'ZX002','fault after source/money/lifecycle/receipt before commit');
 DROP TRIGGER s3_test_final_failure ON public.listings;
 PERFORM pg_temp.ok((SELECT to_jsonb(l)=before FROM listings l WHERE id='70000000-0000-0000-0000-000000000003'),'final failure restores row revision source metadata');
 PERFORM pg_temp.ok((SELECT count(*)=n FROM canonical_operation_receipts),'final failure restores receipts');
 PERFORM pg_temp.ok((SELECT count(*)=m FROM listing_monetary_events),'final failure restores monetary history');
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_source_observations WHERE source_observation_id='obs-fault'),'final failure restores observation');
END $$;
CREATE ROLE s3_public_probe;
DO $$ DECLARE role_name text;f record;q text;BEGIN
 FOREACH role_name IN ARRAY ARRAY['s3_public_probe','anon','authenticated','service_role'] LOOP
  PERFORM pg_temp.ok(NOT has_schema_privilege(role_name,'twuanis_canonical_private','USAGE'),'schema denial '||role_name);
  FOR f IN SELECT p.oid,p.oid::regprocedure sig,p.proname,p.proargtypes,p.prosecdef,p.proowner,p.proconfig FROM pg_proc p WHERE p.pronamespace='twuanis_canonical_private'::regnamespace AND p.proname LIKE 's3_%' LOOP
   PERFORM pg_temp.ok(NOT has_function_privilege(role_name,f.oid,'EXECUTE'),'catalog execute denial '||role_name||'/'||f.proname);
   SELECT format('SELECT twuanis_canonical_private.%I(%s)',f.proname,coalesce(string_agg('NULL::'||a::regtype,','),'')) INTO q FROM unnest(f.proargtypes::oid[])a;
   PERFORM pg_temp.reject(format('SET LOCAL ROLE %I;',role_name)||q,'42501','actual denial '||role_name||'/'||f.proname);
   PERFORM pg_temp.ok(NOT f.prosecdef AND f.proowner='postgres'::regrole AND f.proconfig=ARRAY['search_path=pg_catalog, pg_temp'],'function security '||role_name||'/'||f.proname);
  END LOOP;
 END LOOP;
END $$;
SELECT pg_temp.ok((SELECT rolbypassrls FROM pg_roles WHERE rolname='service_role'),'BYPASSRLS does not bypass function ACL');
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['listing_monetary_events','listing_lifecycle_events','listing_source_observations','canonical_operation_receipts'] LOOP
  PERFORM pg_temp.reject(format('DELETE FROM public.%I',t),'55000','history immutable after S3 '||t);
  PERFORM pg_temp.reject(format('SET LOCAL ROLE authenticated; DELETE FROM public.%I',t),'42501','app history denial '||t);
 END LOOP;
END $$;
SELECT pg_temp.reject($q$SET LOCAL ROLE service_role; UPDATE source_identity_conflicts SET source_name='forged'$q$,'42501','source conflict app immutability');
SELECT pg_temp.reject($q$INSERT INTO listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source) VALUES('70000000-0000-0000-0000-000000000005','bathrooms','exact',0,'owner')$q$,'23514','S1 zero bathroom regression');
SELECT pg_temp.reject($q$INSERT INTO canonical_operation_receipts(authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome) VALUES('system',repeat(' ',10000)||'x','test',gen_random_uuid(),repeat('a',64),'noop')$q$,'23514','S1 raw identity bounds');
SELECT pg_temp.ok((SELECT count(*)=1 FROM capacity_policy_guard),'S2 guard regression');
SELECT pg_temp.ok((SELECT remaining=-2 AND over_capacity=2 AND is_over_capacity FROM twuanis_canonical_private.capacity_state(3,5)),'S2 overcapacity regression');
SELECT pg_temp.ok((SELECT unlimited AND NOT adding_one_exceeds FROM twuanis_canonical_private.capacity_state(NULL,9223372036854775807)),'S2 unlimited regression');
DO $$ DECLARE r bigint;req uuid:=gen_random_uuid();a jsonb;b jsonb; BEGIN
 SELECT canonical_revision INTO r FROM listings WHERE id='70000000-0000-0000-0000-000000000001';
 a:=pg_temp.run(1,'{"money":{"amount":"0.500","currency":"USD"}}',r,req);
 b:=pg_temp.run(1,'{"money":{"amount":"0.5","currency":"USD"}}',r,req);
 PERFORM pg_temp.ok(b->>'replayed'='true' AND a->>'revision'=b->>'revision','decimal-scale semantic replay');
END $$;
SELECT pg_temp.reject($q$UPDATE ontology_terms SET level=NULL WHERE id=1007;SELECT pg_temp.run(2,'{"geography":{"province":"3","canton":"303"}}')$q$,'23514','NULL dictionary level fails closed');
SELECT pg_temp.reject($q$UPDATE listings SET canton='stale' WHERE id='70000000-0000-0000-0000-000000000002';SELECT pg_temp.run(2,'{}')$q$,'55000','canonical projection contradiction rejected');
SELECT pg_temp.reject($q$INSERT INTO ontology_terms(id,term_type,level,term_name) SELECT 2000+n,'root',0,'root' FROM generate_series(1,65)n;INSERT INTO ontology_relationships SELECT 4,2000+n,'is_part_of' FROM generate_series(1,65)n;SELECT pg_temp.run(2,'{"semantics":{"utility":["4"]}}')$q$,'54000','bounded relationship expansion rejects truncation');
SELECT pg_temp.reject($q$SELECT pg_temp.run(2,'{"facts":{"bedrooms":{"kind":"category","term":"5","value":"5","source":"owner"}}}')$q$,'22023','category cannot smuggle exact precision');
SELECT pg_temp.reject($q$SELECT pg_temp.run(2,'{"measurements":{"property_area":{"term":"8"}}}')$q$,'22023','area band cannot supply exact area');

DO $$ BEGIN
 BEGIN
  UPDATE listings SET listing_status='expired',publication_expires_at=clock_timestamp()+interval '1 day' WHERE id='70000000-0000-0000-0000-000000000002';
  PERFORM pg_temp.run(2,'{"lifecycle":{"event":"renew","duration_seconds":"3600"}}');
  IF NOT (SELECT publication_expires_at BETWEEN clock_timestamp()+interval '3500 seconds' AND clock_timestamp()+interval '3600 seconds' FROM listings WHERE id='70000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'expired renewal reused old deadline';END IF;
  RAISE EXCEPTION 'rollback accepted fixture' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;END;
 PERFORM pg_temp.ok(true,'expired-state renewal starts now even with historical future deadline');
END $$;

SELECT count(*) AS s3_assertions FROM assertions;
ROLLBACK;
\echo S3 DOMAIN TESTS PASSED
