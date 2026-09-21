\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'cg_s7_publication' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable only'; END IF; END $$;
CREATE TEMP TABLE checks(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label; END IF;INSERT INTO checks VALUES(label); END $$;
CREATE FUNCTION pg_temp.reject(q text,expected text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE code text;BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS code=RETURNED_SQLSTATE;END;PERFORM pg_temp.ok(code IS NOT DISTINCT FROM expected,label||' '||coalesce(code,'success'));END $$;
CREATE FUNCTION pg_temp.input() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"money":{"amount":"0.5","currency":"USD"}}'::jsonb $$;
CREATE FUNCTION pg_temp.src(k text) RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_object('source_name','s7-csv','source_listing_id',k,'observation_id','genuine-A','observed_at','2026-09-10T12:00:00Z','source_type','realtor') $$;
CREATE TEMP TABLE results(k text PRIMARY KEY,v jsonb);
INSERT INTO results VALUES('csv',public.create_csv_canonical_listing('07000000-0000-0000-0000-000000000001',pg_temp.input(),pg_temp.src('csv')));
SELECT (v->>'listing_id') AS listing_id,(v->>'csv_creation_receipt') AS receipt FROM results WHERE k='csv' \gset
SELECT pg_temp.ok((SELECT listing_status='draft' AND canonical_domain_version=1 AND owner_id IS NULL AND current_price=.5 FROM listings WHERE id=:'listing_id'),'coherent ownerless creation');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM twuanis_canonical_private.csv_initial_publication e JOIN canonical_operation_receipts r ON r.id=e.creation_receipt JOIN listing_lifecycle_events l ON l.operation_id=r.id WHERE e.listing_id=:'listing_id' AND l.event_type='create' AND r.id=:'receipt'),'actual creation receipt anchored');
CREATE TEMP TABLE observations AS SELECT * FROM listing_source_observations WHERE listing_id=:'listing_id';
CREATE TEMP TABLE chronology AS SELECT first_seen,last_seen,last_scraped,times_scraped FROM listings WHERE id=:'listing_id';
INSERT INTO results VALUES('published',public.initially_publish_csv_listing(:'receipt'));
SELECT pg_temp.ok((SELECT listing_status='active' AND publication_expires_at-published_at=interval '7776000 seconds' AND canonical_revision=2 FROM listings WHERE id=:'listing_id'),'canonical active 90 days revision2');
SELECT pg_temp.ok(NOT EXISTS((SELECT * FROM listing_source_observations WHERE listing_id=:'listing_id' EXCEPT SELECT * FROM observations) UNION ALL (SELECT * FROM observations EXCEPT SELECT * FROM listing_source_observations WHERE listing_id=:'listing_id')),'source observation byte values unchanged');
SELECT pg_temp.ok(NOT EXISTS(SELECT first_seen,last_seen,last_scraped,times_scraped FROM listings WHERE id=:'listing_id' EXCEPT SELECT * FROM chronology),'chronology unchanged');
CREATE TEMP TABLE deadline AS SELECT publication_expires_at FROM listings WHERE id=:'listing_id';
SELECT pg_temp.ok((public.initially_publish_csv_listing(:'receipt')->>'replayed')::boolean,'same publication replays');
SELECT pg_temp.ok((SELECT count(*)=1 FROM listing_lifecycle_events WHERE listing_id=:'listing_id' AND event_type='publish'),'one publish event');
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at FROM deadline) FROM listings WHERE id=:'listing_id'),'replay deadline unchanged');
SELECT pg_temp.ok((public.create_csv_canonical_listing('07000000-0000-0000-0000-000000000001',pg_temp.input(),pg_temp.src('csv'))->>'csv_creation_receipt')=:'receipt','creation retry keeps eligibility');
INSERT INTO results VALUES('generic',public.create_trusted_canonical_listing(gen_random_uuid(),pg_temp.input(),pg_temp.src('generic')));
SELECT pg_temp.reject(format('SELECT public.initially_publish_csv_listing(%L)',v->>'receipt_id'),'42501','generic imported ownerless canonical provenance insufficient') FROM results WHERE k='generic';
SELECT pg_temp.reject($q$SELECT public.create_csv_canonical_listing(gen_random_uuid(),pg_temp.input(),pg_temp.src('generic'))$q$,'42501','cannot adopt generic source through CSV replay');
SELECT pg_temp.reject($q$SELECT public.initially_publish_csv_listing(gen_random_uuid())$q$,'42501','missing eligibility');
SELECT pg_temp.reject($q$SELECT public.create_csv_canonical_listing(gen_random_uuid(),pg_temp.input(),NULL)$q$,'22023','no source rejected');
SELECT pg_temp.reject($q$SELECT public.create_csv_canonical_listing(gen_random_uuid(),pg_temp.input(),pg_temp.src('missing')-'observed_at')$q$,'22023','missing genuine time rejected');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM listings WHERE source_name='s7-csv' AND source_listing_id='missing'),'failed creation leaves no listing');
INSERT INTO results VALUES('no-money',public.create_csv_canonical_listing(gen_random_uuid(),pg_temp.input()-'money',pg_temp.src('no-money')));
SELECT pg_temp.reject(format('SELECT public.initially_publish_csv_listing(%L)',v->>'csv_creation_receipt'),'23514','publication failure') FROM results WHERE k='no-money';
SELECT pg_temp.ok((SELECT l.listing_status='draft' AND l.canonical_revision=1 FROM listings l JOIN results r ON l.id=(r.v->>'listing_id')::uuid WHERE r.k='no-money'),'failed publication preserves draft');
DO $$ DECLARE role_name text;perm text;BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  FOREACH perm IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE'] LOOP
   PERFORM pg_temp.ok(NOT has_table_privilege(role_name,'twuanis_canonical_private.csv_initial_publication',perm),role_name||' no eligibility '||perm);
  END LOOP;
 END LOOP;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  PERFORM pg_temp.ok(NOT has_function_privilege(role_name,'public.create_csv_canonical_listing(uuid,jsonb,jsonb)','EXECUTE'),role_name||' cannot create CSV');
  PERFORM pg_temp.ok(NOT has_function_privilege(role_name,'public.initially_publish_csv_listing(uuid)','EXECUTE'),role_name||' cannot publish CSV');
 END LOOP;
END $$;
-- Correct a failed draft through genuine source evidence; publication remains lifecycle-only.
SELECT public.mutate_trusted_canonical_listing((v->>'listing_id')::uuid,1,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"}}',
 (pg_temp.src('no-money')-'source_type')||'{"observation_id":"genuine-B","observed_at":"2026-09-12T12:00:00Z","transaction":"sale","geography":{"province":"3","canton":"304"}}') FROM results WHERE k='no-money';
SELECT pg_temp.ok((public.initially_publish_csv_listing((v->>'csv_creation_receipt')::uuid)->>'revision')::bigint=3,'corrected coherent draft can publish with current revision') FROM results WHERE k='no-money';
SELECT pg_temp.ok((SELECT count(*)=2 FROM listing_source_observations WHERE listing_id=(SELECT (v->>'listing_id')::uuid FROM results WHERE k='no-money')),'publication after correction creates no observation');
SELECT count(*) AS assertions FROM checks;
ROLLBACK;
