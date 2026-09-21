\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_setting('port')<>'55442' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable signature fixture only';END IF;END $$;
CREATE TEMP TABLE checks(label text);
CREATE FUNCTION pg_temp.ok(v boolean,t text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',t;END IF;INSERT INTO checks VALUES(t);END $$;
CREATE FUNCTION pg_temp.reject(q text,t text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE bad boolean:=false;BEGIN BEGIN EXECUTE q;EXCEPTION WHEN OTHERS THEN bad:=true;END;PERFORM pg_temp.ok(bad,t);END $$;
SELECT public.retain_csv_source_evidence('{"source_name":"encuentra24","source_listing_id":"reference-test","observation_id":"genuine-ref","observed_at":"2026-09-18T01:02:03Z","images":"https://photos.encuentra24.com/a.jpg|https://photos.encuentra24.com/b.jpg","source_url":"https://encuentra24.com/example"}','{"status":"unresolved","canonical_authority":false,"values":{}}') AS evidence \gset
INSERT INTO listings VALUES('07000000-0000-0000-0000-000000001901',1,NULL,'draft',1,'encuentra24','reference-test',NULL,NULL);
INSERT INTO canonical_operation_receipts VALUES('07000000-0000-0000-0000-000000001902',:'evidence','07000000-0000-0000-0000-000000001901','create_trusted',1);
INSERT INTO twuanis_canonical_private.csv_initial_publication(creation_receipt,listing_id) VALUES('07000000-0000-0000-0000-000000001902','07000000-0000-0000-0000-000000001901');
SELECT pg_temp.reject('UPDATE listings SET listing_status=''active'' WHERE id=''07000000-0000-0000-0000-000000001901''','publication blocked before reference completion');
SELECT pg_temp.reject(format('SELECT public.complete_csv_source_references(gen_random_uuid(),%L)',:'evidence'),'unrelated receipt denied');
SELECT pg_temp.reject('SELECT public.complete_csv_source_references(''07000000-0000-0000-0000-000000001902'',gen_random_uuid())','missing evidence denied');
CREATE FUNCTION pg_temp.inject_ref_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected finalization failure';END $$;
CREATE TRIGGER injected_ref_failure BEFORE UPDATE ON twuanis_canonical_private.csv_initial_publication FOR EACH ROW EXECUTE FUNCTION pg_temp.inject_ref_failure();
SELECT pg_temp.reject(format('SELECT public.complete_csv_source_references(''07000000-0000-0000-0000-000000001902'',%L)',:'evidence'),'completion failure injected');
SELECT pg_temp.ok((SELECT images IS NULL FROM listings WHERE id='07000000-0000-0000-0000-000000001901'),'attachment rolled back with failed marker');
SELECT pg_temp.ok((SELECT raw_input->>'source_listing_id'='reference-test' FROM twuanis_canonical_private.csv_source_evidence WHERE id=:'evidence'),'immutable evidence survives creation completion failure');
DROP TRIGGER injected_ref_failure ON twuanis_canonical_private.csv_initial_publication;
SELECT public.complete_csv_source_references('07000000-0000-0000-0000-000000001902',:'evidence');
SELECT pg_temp.ok((SELECT images='https://photos.encuentra24.com/a.jpg|https://photos.encuentra24.com/b.jpg' AND source_url='https://encuentra24.com/example' AND canonical_revision=1 AND listing_status='draft' FROM listings WHERE id='07000000-0000-0000-0000-000000001901'),'external URLs retained, no lifecycle/revision mutation');
SELECT pg_temp.ok((SELECT source_references_evidence=:'evidence'::uuid FROM twuanis_canonical_private.csv_initial_publication WHERE creation_receipt='07000000-0000-0000-0000-000000001902'),'completion bound to immutable observation');
UPDATE listings SET images='https://photos.encuentra24.com/later.jpg',canonical_revision=2,listing_status='active' WHERE id='07000000-0000-0000-0000-000000001901';
SELECT public.complete_csv_source_references('07000000-0000-0000-0000-000000001902',:'evidence');
SELECT pg_temp.ok((SELECT images='https://photos.encuentra24.com/later.jpg' AND canonical_revision=2 FROM listings WHERE id='07000000-0000-0000-0000-000000001901'),'old completion retry cannot overwrite later references');
SELECT pg_temp.ok(NOT has_function_privilege('authenticated','public.complete_csv_source_references(uuid,uuid)','EXECUTE'),'browser cannot complete source references');
SELECT pg_temp.ok(has_function_privilege('service_role','public.complete_csv_source_references(uuid,uuid)','EXECUTE'),'trusted server completion available');
SELECT 'CSV REFERENCE SQL ASSERTIONS '||count(*) FROM checks;
ROLLBACK;
