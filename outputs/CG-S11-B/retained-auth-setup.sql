-- S11-C owner-only administrative receipt; install once AFTER Migration 004.
-- Preparation artifact. Never run against target without S11-C authorization.
BEGIN;
DO $$ BEGIN IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
 RAISE EXCEPTION 'postgres administrative session required' USING ERRCODE='42501'; END IF; END $$;
CREATE TABLE twuanis_canonical_private.s11_retained_auth_receipt (
 singleton boolean PRIMARY KEY CHECK(singleton),
 operation_id uuid NOT NULL UNIQUE,
 package_id uuid NOT NULL REFERENCES public.packages(id),
 initialized_at timestamptz NOT NULL,
 auth_ids jsonb NOT NULL,
 subscriptions jsonb NOT NULL
);
ALTER TABLE twuanis_canonical_private.s11_retained_auth_receipt OWNER TO postgres;
ALTER TABLE twuanis_canonical_private.s11_retained_auth_receipt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.s11_retained_auth_receipt FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
