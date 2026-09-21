-- C2-R7 forward repair ONLY; full closure already committed. No data/refresh operation.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' THEN RAISE EXCEPTION 'postgres required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=to_regclass('public.ontology_graph_cache') AND c.relkind='m' AND pg_get_userbyid(c.relowner)='postgres') THEN RAISE EXCEPTION 'Unexpected graph cache identity/type/owner'; END IF;
 IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.ontology_graph_cache'::regclass AND attnum>0 AND NOT attisdropped AND attacl IS NOT NULL) THEN RAISE EXCEPTION 'Unexpected graph-cache column grants require review'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['anon','authenticated','service_role'])r CROSS JOIN pg_roles p WHERE r<>p.rolname AND pg_has_role(r,p.oid,'MEMBER')) THEN RAISE EXCEPTION 'Unexpected API role inheritance'; END IF;
END $$;
REVOKE ALL ON public.ontology_graph_cache FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.ontology_graph_cache TO service_role;
COMMIT;
