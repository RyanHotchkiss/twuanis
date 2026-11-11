\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'cg_s7_verification' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable S7 only'; END IF; END $$;
CREATE FUNCTION pg_temp.check_it(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL %',label; END IF; RAISE NOTICE 'PASS %',label; END $$;
SELECT pg_temp.check_it(NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.import_operator_grants),'migration grants nobody');
-- Existing fixture users, not production identities.
SELECT id AS operator_id FROM auth.users WHERE id<>'00000000-0000-0000-0000-000000000599' ORDER BY id LIMIT 1 \gset
SELECT set_config('request.jwt.claim.sub',:'operator_id',true);
SELECT pg_temp.check_it(NOT public.is_current_user_import_operator(),'ordinary user denied');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000599',true);
SELECT pg_temp.check_it(NOT public.is_current_user_import_operator(),'payment reviewer not importer');
SELECT twuanis_canonical_private.set_import_operator(:'operator_id',true);
SELECT set_config('request.jwt.claim.sub',:'operator_id',true);
SELECT pg_temp.check_it(public.is_current_user_import_operator(),'grant authorizes identity');
SELECT twuanis_canonical_private.set_import_operator(:'operator_id',true);
SELECT pg_temp.check_it((SELECT count(*)=1 FROM twuanis_canonical_private.import_operator_grants WHERE revoked_at IS NULL),'duplicate grant stable');
SELECT twuanis_canonical_private.set_import_operator(:'operator_id',false);
SELECT pg_temp.check_it(NOT public.is_current_user_import_operator(),'revocation immediately denies subsequent check');
SELECT pg_temp.check_it((SELECT count(*)=1 FROM twuanis_canonical_private.import_operator_grants WHERE revoked_at IS NOT NULL AND granted_at<=revoked_at AND revoked_by IS NOT NULL),'revocation audit retained');
SELECT twuanis_canonical_private.set_import_operator(:'operator_id',true);
SELECT pg_temp.check_it((SELECT count(*)=2 FROM twuanis_canonical_private.import_operator_grants),'regrant preserves prior grant episode');
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_it(public.is_current_user_import_operator(),'authenticated operator can check own authority');
DO $$ BEGIN
 BEGIN PERFORM twuanis_canonical_private.set_import_operator(auth.uid(),true);RAISE EXCEPTION 'unexpected self grant';EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS operator cannot grant';END;
 BEGIN PERFORM twuanis_canonical_private.set_import_operator(auth.uid(),false);RAISE EXCEPTION 'unexpected revoke';EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS operator cannot revoke';END;
 BEGIN DELETE FROM twuanis_canonical_private.import_operator_grants;RAISE EXCEPTION 'unexpected deletion';EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS direct authority deletion denied';END;
 BEGIN PERFORM public.require_payment_reviewer();RAISE EXCEPTION 'unexpected reviewer';EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS import operator not payment reviewer in existing fixture';END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.check_it(NOT public.is_current_user_import_operator(),'missing human identity denied');
DO $$ DECLARE r text;p text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
   PERFORM pg_temp.check_it(NOT has_table_privilege(r,'twuanis_canonical_private.import_operator_grants',p),r||' lacks table '||p);
  END LOOP;
  PERFORM pg_temp.check_it(NOT has_function_privilege(r,'twuanis_canonical_private.set_import_operator(uuid,boolean)','EXECUTE'),r||' lacks grant/revoke execution');
 END LOOP;
END $$;
SELECT pg_temp.check_it(NOT has_function_privilege('anon','public.is_current_user_import_operator()','EXECUTE'),'anon cannot check');
SELECT pg_temp.check_it(NOT has_function_privilege('service_role','public.is_current_user_import_operator()','EXECUTE'),'service capability cannot replace human identity check');
SELECT pg_temp.check_it((SELECT bool_and(proconfig @> ARRAY['search_path=pg_catalog']) FROM pg_proc WHERE oid IN ('public.is_current_user_import_operator()'::regprocedure,'twuanis_canonical_private.set_import_operator(uuid,boolean)'::regprocedure)),'fixed privileged search paths');
ROLLBACK;
