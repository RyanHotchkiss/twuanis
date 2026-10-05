-- Administrative and owner authority.
-- Independent of customer packages, subscriptions, payments, and entitlements.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';


/*
 * ---------------------------------------------------------
 * OWNER AUTHORITY
 * ---------------------------------------------------------
 *
 * Owner authority is distinct from administrator authority.
 * Administrators cannot create, revoke, or mutate owners.
 */

CREATE TABLE twuanis_canonical_private.owner_access_grants (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  granted_by name NOT NULL DEFAULT session_user,
  revoked_at timestamptz,
  revoked_by name,

  CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE UNIQUE INDEX owner_access_one_active
ON twuanis_canonical_private.owner_access_grants(user_id)
WHERE revoked_at IS NULL;

ALTER TABLE twuanis_canonical_private.owner_access_grants
ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON TABLE twuanis_canonical_private.owner_access_grants
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL
ON SEQUENCE twuanis_canonical_private.owner_access_grants_id_seq
FROM PUBLIC, anon, authenticated, service_role;


/*
 * Database authority only.
 *
 * This function is intentionally NOT executable by application
 * roles. Initial owner establishment and any later owner mutation
 * require direct database administrative authority.
 */

CREATE FUNCTION twuanis_canonical_private.set_owner_access(
  p_user uuid,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_user IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION
      'explicit identity and action required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    3108,
    hashtext(p_user::text)
  );

  IF p_active THEN
    INSERT INTO twuanis_canonical_private.owner_access_grants(
      user_id
    )
    VALUES (
      p_user
    )
    ON CONFLICT(user_id)
      WHERE revoked_at IS NULL
      DO NOTHING;
  ELSE
    UPDATE twuanis_canonical_private.owner_access_grants
    SET
      revoked_at = clock_timestamp(),
      revoked_by = session_user
    WHERE user_id = p_user
      AND revoked_at IS NULL;
  END IF;
END
$$;

ALTER FUNCTION
twuanis_canonical_private.set_owner_access(uuid, boolean)
OWNER TO postgres;

REVOKE ALL
ON FUNCTION twuanis_canonical_private.set_owner_access(uuid, boolean)
FROM PUBLIC, anon, authenticated, service_role;


/*
 * Runtime owner check.
 *
 * No caller-selected identity.
 * Identity is resolved exclusively from auth.uid().
 */

CREATE FUNCTION public.is_current_user_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM twuanis_canonical_private.owner_access_grants g
      WHERE g.user_id = auth.uid()
        AND g.revoked_at IS NULL
    );
$$;

ALTER FUNCTION public.is_current_user_owner()
OWNER TO postgres;

REVOKE ALL
ON FUNCTION public.is_current_user_owner()
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.is_current_user_owner()
TO authenticated;


/*
 * ---------------------------------------------------------
 * ADMINISTRATIVE AUTHORITY
 * ---------------------------------------------------------
 */

CREATE TABLE twuanis_canonical_private.administrative_access_grants (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  granted_by name NOT NULL DEFAULT session_user,
  revoked_at timestamptz,
  revoked_by name,

  CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE UNIQUE INDEX administrative_access_one_active
ON twuanis_canonical_private.administrative_access_grants(user_id)
WHERE revoked_at IS NULL;

ALTER TABLE twuanis_canonical_private.administrative_access_grants
ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON TABLE twuanis_canonical_private.administrative_access_grants
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL
ON SEQUENCE twuanis_canonical_private.administrative_access_grants_id_seq
FROM PUBLIC, anon, authenticated, service_role;


/*
 * Database administrative mutation boundary.
 *
 * Future Admin Hub mutation should receive a separate owner-
 * authorized application boundary rather than granting direct
 * application access to this private function.
 */

CREATE FUNCTION twuanis_canonical_private.set_administrative_access(
  p_user uuid,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_user IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION
      'explicit identity and action required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    3109,
    hashtext(p_user::text)
  );

  IF p_active THEN
    INSERT INTO twuanis_canonical_private.administrative_access_grants(
      user_id
    )
    VALUES (
      p_user
    )
    ON CONFLICT(user_id)
      WHERE revoked_at IS NULL
      DO NOTHING;
  ELSE
    UPDATE twuanis_canonical_private.administrative_access_grants
    SET
      revoked_at = clock_timestamp(),
      revoked_by = session_user
    WHERE user_id = p_user
      AND revoked_at IS NULL;
  END IF;
END
$$;

ALTER FUNCTION
twuanis_canonical_private.set_administrative_access(uuid, boolean)
OWNER TO postgres;

REVOKE ALL
ON FUNCTION twuanis_canonical_private.set_administrative_access(uuid, boolean)
FROM PUBLIC, anon, authenticated, service_role;


/*
 * Owner-only bulk revocation primitive.
 *
 * This function itself remains database-authority-only for now.
 * The future Admin Hub should expose it only through a boundary
 * that has independently established owner authority.
 */

CREATE FUNCTION twuanis_canonical_private.revoke_all_administrative_access()
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  revoked_count bigint;
BEGIN
  UPDATE twuanis_canonical_private.administrative_access_grants
  SET
    revoked_at = clock_timestamp(),
    revoked_by = session_user
  WHERE revoked_at IS NULL;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  RETURN revoked_count;
END
$$;

ALTER FUNCTION
twuanis_canonical_private.revoke_all_administrative_access()
OWNER TO postgres;

REVOKE ALL
ON FUNCTION twuanis_canonical_private.revoke_all_administrative_access()
FROM PUBLIC, anon, authenticated, service_role;


/*
 * Runtime administrator check.
 *
 * Owner authority includes administrative runtime authority.
 */

CREATE FUNCTION public.is_current_user_administrator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM twuanis_canonical_private.owner_access_grants o
        WHERE o.user_id = auth.uid()
          AND o.revoked_at IS NULL
      )
      OR
      EXISTS (
        SELECT 1
        FROM twuanis_canonical_private.administrative_access_grants a
        WHERE a.user_id = auth.uid()
          AND a.revoked_at IS NULL
      )
    );
$$;

ALTER FUNCTION public.is_current_user_administrator()
OWNER TO postgres;

REVOKE ALL
ON FUNCTION public.is_current_user_administrator()
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.is_current_user_administrator()
TO authenticated;


COMMIT;