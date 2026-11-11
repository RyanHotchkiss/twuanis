\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'postgres' OR inet_server_addr() IS NOT NULL OR current_setting('port')<>'55442' THEN RAISE EXCEPTION 'disposable fixture only';END IF;END $$;
CREATE TEMP TABLE checks(label text);
CREATE FUNCTION pg_temp.ok(v boolean,t text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',t;END IF;INSERT INTO checks VALUES(t);END $$;
CREATE FUNCTION pg_temp.reject(q text,t text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE bad boolean:=false;BEGIN BEGIN EXECUTE q;EXCEPTION WHEN OTHERS THEN bad:=true;END;PERFORM pg_temp.ok(bad,t);END $$;
SELECT '{"source_name":"encuentra24","source_listing_id":"csv-test","observation_id":"genuine-1","observed_at":"2026-09-18T01:02:03Z","raw_bathrooms":"2.5"}' AS raw \gset
SELECT '{"status":"unresolved","canonical_authority":false,"values":{"bathrooms":"3 Bathrooms"}}' AS review \gset
SELECT public.retain_csv_source_evidence(:'raw',:'review') AS evidence \gset
SELECT pg_temp.ok((SELECT raw_input->>'raw_bathrooms'='2.5' AND unresolved_review->'values'->>'bathrooms'='3 Bathrooms' FROM twuanis_canonical_private.csv_source_evidence WHERE id=:'evidence'),'raw and rounded review separate');
SELECT pg_temp.ok(public.retain_csv_source_evidence(:'raw',:'review')=:'evidence'::uuid,'same observation same immutable identity');
SELECT pg_temp.ok((SELECT count(*)=1 FROM twuanis_canonical_private.csv_source_evidence WHERE source_listing_id='csv-test'),'no duplicate on retry');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb||'{"raw_bathrooms":"3"}')::text,:'review'),'changed raw conflict');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb||'{"observed_at":"2026-09-18T01:02:04Z"}')::text,:'review'),'changed genuine timestamp conflict');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',:'raw',(:'review'::jsonb||'{"values":{}}')::text),'changed review conflict');
SELECT pg_temp.reject(format('UPDATE twuanis_canonical_private.csv_source_evidence SET raw_input=''{}'' WHERE id=%L',:'evidence'),'immutable update');
SELECT pg_temp.reject(format('DELETE FROM twuanis_canonical_private.csv_source_evidence WHERE id=%L',:'evidence'),'immutable delete');
SELECT pg_temp.reject('TRUNCATE twuanis_canonical_private.csv_source_evidence','immutable truncate');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb-'observation_id')::text,:'review'),'missing observation identity rejected');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb-'observed_at')::text,:'review'),'missing observation timestamp rejected');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb||'{"observed_at":"now"}')::text,:'review'),'server-relative timestamp rejected');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb||'{"observed_at":"2026-09-18T01:02:03"}')::text,:'review'),'timezone omission rejected');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',:'raw',(:'review'::jsonb||'{"canonical_authority":true}')::text),'review cannot claim authority');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',:'raw','{}'),'malformed review rejected');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',(:'raw'::jsonb||jsonb_build_object('oversized',repeat('x',262144)))::text,:'review'),'raw bound');
SELECT pg_temp.reject(format('SELECT public.retain_csv_source_evidence(%L,%L)',:'raw',(:'review'::jsonb||jsonb_build_object('oversized',repeat('x',65536)))::text),'review bound');
SELECT pg_temp.ok(public.retain_csv_source_evidence(:'raw'::jsonb||'{"observation_id":"genuine-2","observed_at":"2026-09-19T01:02:03Z"}',:'review')<>:'evidence'::uuid,'later genuine observation separate');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='twuanis_canonical_private' AND table_name='csv_source_evidence' AND column_name='listing_id'),'evidence retention requires no listing');
SELECT pg_temp.ok(NOT has_function_privilege('anon','public.retain_csv_source_evidence(jsonb,jsonb)','EXECUTE'),'anonymous denied');
SELECT pg_temp.ok(NOT has_function_privilege('authenticated','public.retain_csv_source_evidence(jsonb,jsonb)','EXECUTE'),'browser role denied');
SELECT pg_temp.ok(has_function_privilege('service_role','public.retain_csv_source_evidence(jsonb,jsonb)','EXECUTE'),'trusted server RPC permitted');
SELECT pg_temp.ok(NOT has_table_privilege('service_role','twuanis_canonical_private.csv_source_evidence','INSERT,UPDATE,DELETE,TRUNCATE'),'no direct service DML');
SELECT pg_temp.ok((SELECT prosecdef AND proconfig @> ARRAY['search_path=pg_catalog, pg_temp'] FROM pg_proc WHERE oid='public.retain_csv_source_evidence(jsonb,jsonb)'::regprocedure),'fixed function security');
SELECT 'CSV EVIDENCE SQL ASSERTIONS '||count(*) FROM checks;
ROLLBACK;
