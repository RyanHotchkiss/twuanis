-- CG-3B1 isolated verification ONLY. Never use a linked/production database.
-- psql harness for an EMPTY disposable PostgreSQL database owned/run by postgres.
-- Explicit opt-in: PGOPTIONS='-c twuanis.cg3_disposable=yes'
-- Database name MUST start cg3b1_disposable_. No application schema may exist.
-- Required cluster roles: anon, authenticated, service_role (not created here).
-- Requires locally available unaccent extension. No download/network is performed.
-- Bootstrap and migration remain in the disposable database; test data rolls back.
-- Drop the entire disposable database after review using your local tooling.
-- This is a minimal schema double, not a claim of full Supabase integration.
\set ON_ERROR_STOP on
DO $guard$
BEGIN
  IF current_database() !~ '^cg3b1_disposable_' OR current_user <> 'postgres' OR
     current_setting('twuanis.cg3_disposable', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION 'Refusing: requires explicitly opted-in disposable database as postgres';
  END IF;
  IF to_regclass('public.listings') IS NOT NULL OR
     to_regclass('public.ontology_terms') IS NOT NULL OR
     to_regclass('public.listings_ontology_terms') IS NOT NULL OR
     to_regnamespace('auth') IS NOT NULL OR
     to_regnamespace('twuanis_private') IS NOT NULL THEN
    RAISE EXCEPTION 'Refusing: disposable fixture database must be empty';
  END IF;
END;
$guard$;

BEGIN;
CREATE EXTENSION unaccent WITH SCHEMA public;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.listings (
  id uuid PRIMARY KEY, owner_id uuid,
  listing_status text DEFAULT 'active' CHECK (listing_status IN ('draft','active','expired','archived','deleted')),
  listing_origin text NOT NULL, listing_source_type text NOT NULL,
  province text, canton text, district text,
  province_normalized text, canton_normalized text, district_normalized text
);
CREATE TABLE public.ontology_terms (
  id bigint PRIMARY KEY, official_code text, term_type text, level integer,
  term_name text, parent_id bigint REFERENCES public.ontology_terms(id)
);
CREATE UNIQUE INDEX fixture_geographic_code ON public.ontology_terms(official_code)
  WHERE term_type IN ('province','canton','district');
CREATE TABLE public.listings_ontology_terms (
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  ontology_term_id bigint REFERENCES public.ontology_terms(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, ontology_term_id)
);
COMMIT;
\ir ../../supabase/migrations/003_canonical_listing_write_boundary.sql

BEGIN;
CREATE FUNCTION pg_temp.check_ok(p_ok boolean, p_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', p_message; END IF;
END;
$$;
-- Intentionally lacks CG-1 level/code checks so corrupted-dictionary guards can
-- be tested. Production CG-1 remains a deployment prerequisite, not altered here.
INSERT INTO public.ontology_terms VALUES
 (9, NULL, 'country', 0, 'Costa Rica', NULL),
 (9007199254740993, '3', 'province', 1, 'Cártago', 9),
 (9007199254740994, '304', 'canton', 2, 'Jiménez', 9007199254740993),
 (9007199254740995, '30403', 'district', 3, 'Pejivalle', 9007199254740994),
 (9007199254740996, '1', 'province', 1, 'San José', 9),
 (9007199254740997, '101', 'canton', 2, 'San José', 9007199254740996),
 (9007199254740998, '10101', 'district', 3, 'Carmen', 9007199254740997),
 (20, NULL, 'property_type', NULL, 'House', NULL);
INSERT INTO public.listings (id, owner_id, listing_status, listing_origin, listing_source_type)
VALUES ('00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002', 'draft', 'customer', 'customer');
INSERT INTO public.listings_ontology_terms VALUES
 ('00000000-0000-0000-0000-000000000001', 9),
 ('00000000-0000-0000-0000-000000000001', 20);

DO $tests$
DECLARE
  lid uuid := '00000000-0000-0000-0000-000000000001';
  actor uuid := '00000000-0000-0000-0000-000000000002';
  r jsonb;
  bad record;
  old_listing jsonb;
  old_memberships jsonb;
  caught boolean;
  role_name text;
  f record;
BEGIN
  FOR role_name IN SELECT unnest(ARRAY['anon','authenticated','service_role']) LOOP
    PERFORM pg_temp.check_ok(NOT has_schema_privilege(role_name, 'twuanis_private', 'USAGE'), 'private USAGE absent');
    PERFORM pg_temp.check_ok(NOT has_schema_privilege(role_name, 'twuanis_private', 'CREATE'), 'private CREATE absent');
    FOR f IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'twuanis_private' OR (n.nspname = 'public' AND
        p.proname IN ('write_my_listing_canonical','write_listing_canonical_server')) LOOP
      PERFORM pg_temp.check_ok(NOT has_function_privilege(role_name, f.oid, 'EXECUTE'), 'application EXECUTE absent');
    END LOOP;
  END LOOP;
  PERFORM pg_temp.check_ok(NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
    WHERE (n.nspname='twuanis_private' OR (n.nspname='public' AND
      p.proname IN ('write_my_listing_canonical','write_listing_canonical_server')))
      AND a.grantee=0 AND a.privilege_type='EXECUTE'), 'PUBLIC EXECUTE absent');
  PERFORM pg_temp.check_ok(NOT EXISTS (
    SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL
      aclexplode(coalesce(n.nspacl, acldefault('n',n.nspowner))) a
    WHERE n.nspname='twuanis_private' AND a.grantee=0), 'PUBLIC schema access absent');

  r := public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'draft');
  PERFORM pg_temp.check_ok(r->'district' = 'null'::jsonb, 'P+C return');
  PERFORM pg_temp.check_ok((SELECT count(*)=4 FROM public.listings_ontology_terms WHERE listing_id=lid), 'P+C exact cardinality plus country/property');
  PERFORM set_config('request.jwt.claim.sub', actor::text, true);
  r := public.write_my_listing_canonical(lid,'set_geography','3','304','30403','draft');
  PERFORM pg_temp.check_ok(jsonb_typeof(r#>'{province,ontology_id}')='string', 'bigint JSON text');
  PERFORM pg_temp.check_ok(r#>>'{province,ontology_id}'='9007199254740993', 'bigint exact');
  PERFORM pg_temp.check_ok((SELECT district='Pejivalle' AND province='Cártago' AND canton='Jiménez'
    AND province_normalized='cartago' AND canton_normalized='jimenez'
    AND district_normalized='pejivalle' AND listing_status='draft'
    FROM public.listings WHERE id=lid), 'canonical projections and unchanged status');
  PERFORM pg_temp.check_ok((SELECT count(*)=5 FROM public.listings_ontology_terms WHERE listing_id=lid), 'P+C+D cardinality');
  PERFORM pg_temp.check_ok(twuanis_private.normalize_geographic_projection(NULL) IS NULL, 'NULL normalization');
  PERFORM pg_temp.check_ok(twuanis_private.normalize_geographic_projection('  Sán  José!  ')='san jose', 'normalization');

  FOR bad IN SELECT * FROM (VALUES
    ('set_geography',' 3','304','30403','draft','22023'),
    ('set_geography','3','30','30403','draft','22023'),
    ('set_geography','3','304','3040','draft','22023'),
    ('set_geography',NULL,'304',NULL,'draft','22023'),
    ('set_geography','3',NULL,NULL,'draft','22023'),
    ('set_geography','9','904',NULL,'draft','P0002'),
    ('set_geography','3','399',NULL,'draft','P0002'),
    ('set_geography','3','304','30499','draft','P0002'),
    ('set_geography','3','101',NULL,'draft','23514'),
    ('set_geography','3','304','10101','draft','23514'),
    ('set_geography','3','304',NULL,'active','40001'),
    ('publish','3','304',NULL,'draft','22023')
  ) AS x(op,p,c,d,s,code) LOOP
    caught := false;
    BEGIN
      PERFORM public.write_listing_canonical_server(lid,bad.op,bad.p,bad.c,bad.d,bad.s);
    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE <> bad.code THEN RAISE; END IF;
      caught := true;
    END;
    PERFORM pg_temp.check_ok(caught, 'reject malformed/unknown/hierarchy/status/operation');
  END LOOP;
  caught := false;
  BEGIN
    PERFORM twuanis_private.write_listing_canonical(lid,'set_geography','3','304',NULL,'draft',lid,false);
  EXCEPTION WHEN insufficient_privilege THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'wrong owner rejected');
  PERFORM set_config('request.jwt.claim.sub', '', true);
  caught := false;
  BEGIN
    PERFORM public.write_my_listing_canonical(lid,'set_geography','3','304',NULL,'draft');
  EXCEPTION WHEN insufficient_privilege THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'null auth rejected');

  -- Parent and type/level corruption are test-local and rolled back below.
  UPDATE public.ontology_terms SET parent_id=9007199254740996 WHERE official_code='304';
  caught := false;
  BEGIN
    PERFORM public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'draft');
  EXCEPTION WHEN check_violation THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'parent ID mismatch despite matching code ancestry');
  UPDATE public.ontology_terms SET parent_id=9007199254740993,level=3 WHERE official_code='304';
  caught := false;
  BEGIN
    PERFORM public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'draft');
  EXCEPTION WHEN check_violation THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'wrong level');
  UPDATE public.ontology_terms SET level=2 WHERE official_code='304';
  UPDATE public.ontology_terms SET term_type='district' WHERE official_code='304';
  caught := false;
  BEGIN
    PERFORM public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'draft');
  EXCEPTION WHEN check_violation THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'wrong term type');
  UPDATE public.ontology_terms SET term_type='canton' WHERE official_code='304';
  UPDATE public.listings SET listing_status='archived' WHERE id=lid;
  caught := false;
  BEGIN
    PERFORM public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'archived');
  EXCEPTION WHEN invalid_parameter_value THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'archived geography edit rejected');
  UPDATE public.listings SET listing_status='draft' WHERE id=lid;

  r := public.write_listing_canonical_server(lid,'set_geography','3','304',NULL,'draft');
  PERFORM pg_temp.check_ok((SELECT district IS NULL AND district_normalized IS NULL FROM public.listings WHERE id=lid), 'district projections cleared');
  PERFORM pg_temp.check_ok((SELECT array_agg(ontology_term_id ORDER BY ontology_term_id)=
    ARRAY[9,20,9007199254740993,9007199254740994]::bigint[]
    FROM public.listings_ontology_terms WHERE listing_id=lid), 'district removed; country/property preserved');

  -- Force a projection UPDATE failure AFTER the membership DELETE/INSERT.
  SELECT to_jsonb(l) INTO old_listing FROM public.listings l WHERE id=lid;
  SELECT jsonb_agg(ontology_term_id ORDER BY ontology_term_id) INTO old_memberships
    FROM public.listings_ontology_terms WHERE listing_id=lid;
  ALTER TABLE public.listings ADD CONSTRAINT fixture_forced_failure CHECK (district IS NULL);
  caught := false;
  BEGIN
    PERFORM public.write_listing_canonical_server(lid,'set_geography','3','304','30403','draft');
  EXCEPTION WHEN check_violation THEN caught := true;
  END;
  PERFORM pg_temp.check_ok(caught, 'induced post-membership failure');
  PERFORM pg_temp.check_ok((SELECT to_jsonb(l)=old_listing FROM public.listings l WHERE id=lid), 'listing rollback');
  PERFORM pg_temp.check_ok((SELECT jsonb_agg(ontology_term_id ORDER BY ontology_term_id)=old_memberships
    FROM public.listings_ontology_terms WHERE listing_id=lid), 'membership rollback');
  RAISE NOTICE 'CG-3B1 isolated functional and dormant ACL checks passed';
END;
$tests$;
ROLLBACK;
-- Still required in later isolated integration: real Supabase auth/RLS/trigger
-- schema, concurrent sessions/lock timeout, dictionary mutation protection,
-- eventual B2 role grants, writer adapters, and lifecycle/creation contracts.
