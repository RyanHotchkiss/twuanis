-- S7: independent import-operator authority. No actual operator grants.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE twuanis_canonical_private.import_operator_grants (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id),
 granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 granted_by name NOT NULL DEFAULT session_user,
 revoked_at timestamptz,
 revoked_by name,
 CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
 CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE UNIQUE INDEX import_operator_one_active ON twuanis_canonical_private.import_operator_grants(user_id) WHERE revoked_at IS NULL;
ALTER TABLE twuanis_canonical_private.import_operator_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.import_operator_grants FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE twuanis_canonical_private.import_operator_grants_id_seq FROM PUBLIC,anon,authenticated,service_role;
-- Administrative/database authority only. Application roles cannot execute.
CREATE FUNCTION twuanis_canonical_private.set_import_operator(p_user uuid,p_active boolean)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF p_user IS NULL OR p_active IS NULL THEN RAISE EXCEPTION 'explicit identity and action required' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(3107,hashtext(p_user::text));
 IF p_active THEN
  INSERT INTO twuanis_canonical_private.import_operator_grants(user_id) VALUES(p_user)
  ON CONFLICT(user_id) WHERE revoked_at IS NULL DO NOTHING;
 ELSE
  UPDATE twuanis_canonical_private.import_operator_grants SET revoked_at=clock_timestamp(),revoked_by=session_user
  WHERE user_id=p_user AND revoked_at IS NULL;
 END IF;
END $$;
ALTER FUNCTION twuanis_canonical_private.set_import_operator(uuid,boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION twuanis_canonical_private.set_import_operator(uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
-- No caller-selected identity. Invoke using the verified user's JWT, not admin credentials.
CREATE FUNCTION public.is_current_user_import_operator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM twuanis_canonical_private.import_operator_grants g
  WHERE g.user_id=auth.uid() AND g.revoked_at IS NULL
 );
$$;
ALTER FUNCTION public.is_current_user_import_operator() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_current_user_import_operator() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_current_user_import_operator() TO authenticated;
COMMIT;
