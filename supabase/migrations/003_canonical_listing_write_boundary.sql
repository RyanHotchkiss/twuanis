-- CG-3B1: DORMANT ONLY. Do not deploy or run blanket migrations.
-- 002 was deployed directly but is not registered in migration history.
-- Requires the CG-1 constraints, public.unaccent function/dictionary, and postgres.
-- No creation, lifecycle transitions, application grants, or direct-write closure.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Fail on an existing schema rather than trust unknown ownership/contents.
CREATE SCHEMA twuanis_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA twuanis_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION twuanis_private.normalize_geographic_projection(p_name text)
RETURNS text LANGUAGE sql STABLE STRICT SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT btrim(regexp_replace(regexp_replace(
    lower(public.unaccent('public.unaccent'::regdictionary, p_name)),
    '[^a-z0-9 ]', '', 'g'), '[[:space:]]+', ' ', 'g'));
$function$;
ALTER FUNCTION twuanis_private.normalize_geographic_projection(text) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION twuanis_private.normalize_geographic_projection(text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION twuanis_private.write_listing_canonical(
  p_listing_id uuid,
  p_operation text,
  p_province_code text,
  p_canton_code text,
  p_district_code text,
  p_expected_status text,
  p_actor_id uuid,
  p_trusted_server boolean
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_p public.ontology_terms%ROWTYPE;
  v_c public.ontology_terms%ROWTYPE;
  v_d public.ontology_terms%ROWTYPE;
  v_row public.ontology_terms%ROWTYPE;
  v_ids bigint[];
  v_id bigint;
  v_pc bigint;
  v_cc bigint;
  v_dc bigint;
  v_matches boolean;
BEGIN
  IF p_operation IS DISTINCT FROM 'set_geography' THEN
    RAISE EXCEPTION 'CG3 unsupported operation' USING ERRCODE = '22023';
  END IF;
  IF p_province_code IS NULL OR p_province_code !~ '^[0-9]$' THEN
    RAISE EXCEPTION 'CG3 malformed Province code' USING ERRCODE = '22023';
  END IF;
  IF p_canton_code IS NULL OR p_canton_code !~ '^[0-9]{3}$' THEN
    RAISE EXCEPTION 'CG3 malformed Canton code' USING ERRCODE = '22023';
  END IF;
  IF p_district_code IS NOT NULL AND p_district_code !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'CG3 malformed District code' USING ERRCODE = '22023';
  END IF;

  SELECT l.* INTO v_listing FROM public.listings AS l
  WHERE l.id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CG3 listing not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_trusted_server IS NULL OR
     (NOT p_trusted_server AND (p_actor_id IS NULL OR
       v_listing.owner_id IS DISTINCT FROM p_actor_id)) OR
     (p_trusted_server AND p_actor_id IS NOT NULL) THEN
    RAISE EXCEPTION 'CG3 unauthorized operation context' USING ERRCODE = '42501';
  END IF;
  IF p_expected_status IS NULL OR
     v_listing.listing_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'CG3 stale expected status' USING ERRCODE = '40001';
  END IF;
  IF v_listing.listing_status NOT IN ('draft', 'active', 'expired') THEN
    RAISE EXCEPTION 'CG3 lifecycle state does not permit geography edit'
      USING ERRCODE = '22023';
  END IF;

  -- Exact, geographically restricted lookup. CG-1 enforces uniqueness;
  -- STRICT additionally rejects absent/ambiguous identities.
  SELECT t.* INTO STRICT v_p FROM public.ontology_terms AS t
  WHERE t.official_code = p_province_code
    AND t.term_type IN ('province', 'canton', 'district');
  SELECT t.* INTO STRICT v_c FROM public.ontology_terms AS t
  WHERE t.official_code = p_canton_code
    AND t.term_type IN ('province', 'canton', 'district');
  IF p_district_code IS NOT NULL THEN
    SELECT t.* INTO STRICT v_d FROM public.ontology_terms AS t
    WHERE t.official_code = p_district_code
      AND t.term_type IN ('province', 'canton', 'district');
  END IF;
  v_ids := ARRAY[v_p.id, v_c.id];
  IF p_district_code IS NOT NULL THEN
    v_ids := array_append(v_ids, v_d.id);
  END IF;

  -- Materialize sorted scalar IDs before acquiring any dictionary row lock.
  -- Each sequential statement locks just one primary-key row. Re-read after
  -- waiting, then revalidate identity: the initial unlocked snapshot is not trust.
  FOR v_id IN SELECT u.id FROM unnest(v_ids) AS u(id) ORDER BY u.id LOOP
    SELECT t.* INTO STRICT v_row FROM public.ontology_terms AS t
    WHERE t.id = v_id FOR SHARE;
    IF v_id = v_p.id THEN v_p := v_row;
    ELSIF v_id = v_c.id THEN v_c := v_row;
    ELSE v_d := v_row;
    END IF;
  END LOOP;
  IF v_p.official_code IS DISTINCT FROM p_province_code OR
     v_p.term_type IS DISTINCT FROM 'province' OR v_p.level IS DISTINCT FROM 1 OR
     v_c.official_code IS DISTINCT FROM p_canton_code OR
     v_c.term_type IS DISTINCT FROM 'canton' OR v_c.level IS DISTINCT FROM 2 OR
     (p_district_code IS NOT NULL AND (
       v_d.official_code IS DISTINCT FROM p_district_code OR
       v_d.term_type IS DISTINCT FROM 'district' OR v_d.level IS DISTINCT FROM 3)) THEN
    RAISE EXCEPTION 'CG3 dictionary identity/type/level disagreement' USING ERRCODE = '23514';
  END IF;
  IF v_c.parent_id IS DISTINCT FROM v_p.id OR
     left(v_c.official_code, 1) IS DISTINCT FROM v_p.official_code OR
     (p_district_code IS NOT NULL AND (
       v_d.parent_id IS DISTINCT FROM v_c.id OR
       left(v_d.official_code, 3) IS DISTINCT FROM v_c.official_code OR
       left(v_d.official_code, 1) IS DISTINCT FROM v_p.official_code)) THEN
    RAISE EXCEPTION 'CG3 hierarchy conflict' USING ERRCODE = '23514';
  END IF;
  IF v_p.term_name IS NULL OR v_c.term_name IS NULL OR
     (p_district_code IS NOT NULL AND v_d.term_name IS NULL) THEN
    RAISE EXCEPTION 'CG3 missing canonical term name' USING ERRCODE = '23514';
  END IF;

  DELETE FROM public.listings_ontology_terms AS lot
  USING public.ontology_terms AS term
  WHERE lot.listing_id = p_listing_id
    AND term.id = lot.ontology_term_id
    AND term.term_type IN ('province', 'canton', 'district');

  INSERT INTO public.listings_ontology_terms (listing_id, ontology_term_id)
  SELECT p_listing_id, u.id FROM unnest(v_ids) AS u(id);

  UPDATE public.listings AS l SET
    province = v_p.term_name,
    canton = v_c.term_name,
    district = v_d.term_name,
    province_normalized = twuanis_private.normalize_geographic_projection(v_p.term_name),
    canton_normalized = twuanis_private.normalize_geographic_projection(v_c.term_name),
    district_normalized = twuanis_private.normalize_geographic_projection(v_d.term_name)
  WHERE l.id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CG3 projection update failed' USING ERRCODE = '23514';
  END IF;

  SELECT count(*) FILTER (WHERE t.term_type = 'province'),
         count(*) FILTER (WHERE t.term_type = 'canton'),
         count(*) FILTER (WHERE t.term_type = 'district'),
         bool_and(CASE t.term_type
           WHEN 'province' THEN t.id = v_p.id AND t.level = 1
             AND t.official_code = p_province_code
           WHEN 'canton' THEN t.id = v_c.id AND t.level = 2
             AND t.official_code = p_canton_code AND t.parent_id = v_p.id
           WHEN 'district' THEN t.id = v_d.id AND t.level = 3
             AND t.official_code = p_district_code AND t.parent_id = v_c.id
           ELSE false END)
    INTO v_pc, v_cc, v_dc, v_matches
  FROM public.listings_ontology_terms AS lot
  JOIN public.ontology_terms AS t ON t.id = lot.ontology_term_id
  WHERE lot.listing_id = p_listing_id
    AND t.term_type IN ('province', 'canton', 'district');
  IF v_pc <> 1 OR v_cc <> 1 OR
     v_dc <> (CASE WHEN p_district_code IS NULL THEN 0 ELSE 1 END) OR
     v_matches IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'CG3 invalid final canonical memberships' USING ERRCODE = '23514';
  END IF;
  SELECT l.* INTO STRICT v_listing FROM public.listings AS l WHERE l.id = p_listing_id;
  IF v_listing.province IS DISTINCT FROM v_p.term_name OR
     v_listing.canton IS DISTINCT FROM v_c.term_name OR
     v_listing.district IS DISTINCT FROM v_d.term_name OR
     v_listing.province_normalized IS DISTINCT FROM twuanis_private.normalize_geographic_projection(v_p.term_name) OR
     v_listing.canton_normalized IS DISTINCT FROM twuanis_private.normalize_geographic_projection(v_c.term_name) OR
     v_listing.district_normalized IS DISTINCT FROM twuanis_private.normalize_geographic_projection(v_d.term_name) OR
     v_listing.listing_status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION 'CG3 final projection/status disagreement' USING ERRCODE = '23514';
  END IF;
  RETURN jsonb_build_object(
    'listing_id', p_listing_id::text, 'listing_status', v_listing.listing_status,
    'province', jsonb_build_object('official_code', p_province_code, 'ontology_id', v_p.id::text),
    'canton', jsonb_build_object('official_code', p_canton_code, 'ontology_id', v_c.id::text),
    'district', CASE WHEN p_district_code IS NULL THEN NULL ELSE
      jsonb_build_object('official_code', p_district_code, 'ontology_id', v_d.id::text) END);
END;
$function$;
ALTER FUNCTION twuanis_private.write_listing_canonical(uuid,text,text,text,text,text,uuid,boolean) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION twuanis_private.write_listing_canonical(uuid,text,text,text,text,text,uuid,boolean)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.write_my_listing_canonical(
  p_listing_id uuid, p_operation text, p_province_code text,
  p_canton_code text, p_district_code text, p_expected_status text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'CG3 authentication required' USING ERRCODE = '42501';
  END IF;
  RETURN twuanis_private.write_listing_canonical(p_listing_id, p_operation,
    p_province_code, p_canton_code, p_district_code, p_expected_status, v_actor, false);
END;
$function$;
ALTER FUNCTION public.write_my_listing_canonical(uuid,text,text,text,text,text) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.write_my_listing_canonical(uuid,text,text,text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.write_listing_canonical_server(
  p_listing_id uuid, p_operation text, p_province_code text,
  p_canton_code text, p_district_code text, p_expected_status text
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT twuanis_private.write_listing_canonical(p_listing_id, p_operation,
    p_province_code, p_canton_code, p_district_code, p_expected_status, NULL, true);
$function$;
ALTER FUNCTION public.write_listing_canonical_server(uuid,text,text,text,text,text) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.write_listing_canonical_server(uuid,text,text,text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
