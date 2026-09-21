\set ON_ERROR_STOP on
BEGIN;
DO $$BEGIN IF inet_server_addr() IS NOT NULL OR current_database()<>'s7_upload' THEN RAISE EXCEPTION 'disposable only';END IF;END$$;
CREATE TEMP TABLE checks(label text);
CREATE FUNCTION pg_temp.ok(v boolean,t text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',t;END IF;INSERT INTO checks VALUES(t);END$$;
CREATE FUNCTION pg_temp.reject(q text,t text) RETURNS void LANGUAGE plpgsql AS $$DECLARE bad boolean:=false;BEGIN BEGIN EXECUTE q;EXCEPTION WHEN OTHERS THEN bad:=true;END;PERFORM pg_temp.ok(bad,t);END$$;
INSERT INTO listings(id,owner_id,listing_status,canonical_domain_version,images) VALUES('10000000-0000-0000-0000-000000000021','20000000-0000-0000-0000-000000000021','active',1,'["20000000-0000-0000-0000-000000000021/10000000-0000-0000-0000-000000000021/a.jpg","https://example.test/x.jpg"]');
SELECT public.detach_listing_image('20000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000021','20000000-0000-0000-0000-000000000021/10000000-0000-0000-0000-000000000021/a.jpg')->>'id' AS op \gset
SELECT pg_temp.ok((SELECT images='["https://example.test/x.jpg"]' FROM listings WHERE id='10000000-0000-0000-0000-000000000021'),'managed path detached');
SELECT pg_temp.ok((SELECT NOT cleanup_completed AND managed FROM twuanis_canonical_private.image_detach_operations WHERE id=:'op'),'cleanup independent and pending');
UPDATE listings SET images='["https://example.test/x.jpg","new.jpg"]' WHERE id='10000000-0000-0000-0000-000000000021';
SELECT public.get_image_detach_operation('20000000-0000-0000-0000-000000000021',:'op');
SELECT public.confirm_image_cleanup('20000000-0000-0000-0000-000000000021',:'op');
SELECT pg_temp.ok((SELECT images='["https://example.test/x.jpg","new.jpg"]' FROM listings WHERE id='10000000-0000-0000-0000-000000000021'),'retry preserves newer image state');
SELECT pg_temp.ok((SELECT cleanup_completed FROM twuanis_canonical_private.image_detach_operations WHERE id=:'op'),'cleanup acknowledged separately');
SELECT pg_temp.ok((SELECT listing_status='active' AND canonical_revision=5 AND publication_expires_at='2030-01-01'::timestamptz FROM listings WHERE id='10000000-0000-0000-0000-000000000021'),'lifecycle deadline revision unchanged');
SELECT pg_temp.reject(format('SELECT get_image_detach_operation(gen_random_uuid(),%L)',:'op'),'foreign owner denied');
SELECT pg_temp.reject('SELECT detach_listing_image(''20000000-0000-0000-0000-000000000021'',''10000000-0000-0000-0000-000000000021'',''other/listing/a.jpg'')','foreign path denied before mutation');
SELECT pg_temp.ok((public.detach_listing_image('20000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000021','https://example.test/x.jpg')->>'managed')::boolean=false,'external reference not managed media');
SELECT pg_temp.ok(NOT has_table_privilege('service_role','twuanis_canonical_private.image_detach_operations','UPDATE'),'no direct completion forging');
SELECT pg_temp.ok(NOT has_function_privilege('authenticated','public.confirm_image_cleanup(uuid,uuid)','EXECUTE'),'browser cannot confirm cleanup');
SELECT pg_temp.ok((SELECT bool_and(prosecdef AND proconfig @> ARRAY['search_path=pg_catalog, pg_temp']) FROM pg_proc WHERE proname IN ('detach_listing_image','get_image_detach_operation','confirm_image_cleanup')),'fixed search paths');
UPDATE listings SET images='["20000000-0000-0000-0000-000000000021/10000000-0000-0000-0000-000000000021/a.jpg"]' WHERE id='10000000-0000-0000-0000-000000000021';
SELECT pg_temp.reject(format('SELECT get_image_detach_operation(''20000000-0000-0000-0000-000000000021'',%L)',:'op'),'reattached path fails closed before cleanup');
UPDATE listings SET images='[]',listing_status='deleted' WHERE id='10000000-0000-0000-0000-000000000021';
SELECT pg_temp.reject(format('SELECT get_image_detach_operation(''20000000-0000-0000-0000-000000000021'',%L)',:'op'),'deleted listing retry denied');
SELECT 'IMAGE DETACH SQL ASSERTIONS '||count(*) FROM checks;
ROLLBACK;
