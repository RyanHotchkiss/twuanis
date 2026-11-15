-- Admin Listings: unambiguous claim filter plus independent agency/source filters.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.admin_listing_read(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'admin_listing_read(jsonb) predecessor is required';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_listing_read(p_query jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_actor uuid; v_mode text; v_page integer; v_search text;
  v_status text; v_origin text; v_tx text; v_listing_id text; v_source_id text;
  v_source_url text; v_source_name text; v_agency_name text; v_agency text;
  v_agent_name text; v_whatsapp text; v_owner_id text; v_owner_email text;
  v_claim_status text; v_province bigint; v_canton bigint; v_district bigint;
  v_ptype bigint; v_result jsonb; v_listing uuid;
BEGIN
  v_actor:=twuanis_canonical_private.assert_administrative_permission('listings.read');
  IF p_query IS NULL OR jsonb_typeof(p_query)<>'object' OR octet_length(p_query::text)>8192 THEN RAISE EXCEPTION 'bounded query required'; END IF;
  PERFORM twuanis_canonical_private.s3_keys(p_query,
    ARRAY['mode','page','after','search','status','origin','transaction','province','canton','district','property_type','listing','dimension','parent','listing_id','source_id','source_url','source_name','agency_name','agency','listing_agent_name','whatsapp','owner_id','owner_email','claim_status'], ARRAY['mode']);
  v_mode:=p_query->>'mode';

  IF v_mode='overview' THEN
    SELECT jsonb_build_object('total',count(*)::text,'active',count(*) FILTER(WHERE listing_status='active')::text,'archived',count(*) FILTER(WHERE listing_status='archived')::text,'sale',count(*) FILTER(WHERE transaction_type='sale')::text,'rent',count(*) FILTER(WHERE transaction_type='rent')::text) INTO v_result FROM public.listings;
    RETURN v_result;
  ELSIF v_mode='options' THEN
    IF p_query->>'dimension'='agency' THEN
      SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v_result FROM (
        SELECT 'agency:'||lower(btrim(l.agency_name)) AS id, min(btrim(l.agency_name)) AS label
        FROM public.listings l WHERE nullif(btrim(l.agency_name),'') IS NOT NULL
        GROUP BY lower(btrim(l.agency_name)) ORDER BY min(btrim(l.agency_name)) LIMIT 501
      ) q;
    ELSIF p_query->>'dimension'='source_name' THEN
      SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v_result FROM (
        SELECT btrim(l.source_name) AS id, btrim(l.source_name) AS label
        FROM public.listings l WHERE nullif(btrim(l.source_name),'') IS NOT NULL
        GROUP BY btrim(l.source_name) ORDER BY btrim(l.source_name) LIMIT 501
      ) q;
    ELSIF p_query->>'dimension' IN ('province','canton','district','property_type') THEN
      SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v_result FROM (
        SELECT id::text,term_name,term_name_en,term_name_es,official_code,parent_id::text
        FROM public.ontology_terms
        WHERE term_type=p_query->>'dimension'
          AND level=CASE p_query->>'dimension' WHEN 'canton' THEN 2 WHEN 'district' THEN 3 ELSE 1 END
          AND ((p_query->>'dimension' IN ('province','property_type')) OR parent_id=(p_query->>'parent')::bigint)
        ORDER BY id LIMIT 501
      ) q;
    ELSE RAISE EXCEPTION 'invalid dimension'; END IF;
    IF jsonb_array_length(v_result)>500 THEN RAISE EXCEPTION 'option bound exceeded'; END IF;
    RETURN v_result;
  ELSIF v_mode='detail' THEN
    v_listing:=(p_query->>'listing')::uuid;
    SELECT jsonb_build_object(
      'id',l.id,'title',l.title,'description',l.description,'whatsapp',l.whatsapp,
      'transaction_type',l.transaction_type,'listing_status',l.listing_status,'owner_id',l.owner_id,
      'owner_email',(SELECT au.email FROM auth.users au WHERE au.id=l.owner_id),
      'claim_status',CASE WHEN l.owner_id IS NOT NULL AND EXISTS(SELECT 1 FROM twuanis_canonical_private.listing_claim_events e WHERE e.listing_id=l.id AND e.subject=l.owner_id AND e.operation='claimed') THEN 'claimed' ELSE 'unclaimed' END,
      'listing_origin',l.listing_origin,'listing_source_type',l.listing_source_type,
      'source_name',l.source_name,'source_listing_id',l.source_listing_id,'source_url',l.source_url,
      'agency_name',l.agency_name,'agency_logo_url',l.agency_logo_url,'listing_agent_name',l.listing_agent_name,'listing_agent_photo_url',l.listing_agent_photo_url,
      'last_seen',l.last_seen,'province',l.province,'canton',l.canton,'district',l.district,'property_type',l.property_type,
      'property_area',l.property_area::text,'construction_area',l.construction_area::text,'current_price',l.current_price::text,'monthly_price',l.monthly_price::text,'currency',l.currency,
      'bedrooms',l.bedrooms,'bathrooms',l.bathrooms,'parking',l.parking,'year_built_range',l.year_built_range,'distance_to_paved_road_range',l.distance_to_paved_road_range,
      'utility',l.utility,'environment',l.environment,'terrain',l.terrain,'accessibility',l.accessibility,'legal_status',l.legal_status,'images',l.images,
      'updated_at',l.updated_at,'canonical_revision',l.canonical_revision::text,'canonical_domain_version',l.canonical_domain_version)
    INTO v_result FROM public.listings l WHERE l.id=v_listing;
    RETURN v_result||jsonb_build_object(
      'pending_media',(SELECT coalesce(jsonb_agg(request_id ORDER BY request_id),'[]') FROM twuanis_canonical_private.administrative_media_operations WHERE listing_id=v_listing AND actor_id=v_actor AND NOT completed),
      'media_groups',(SELECT jsonb_build_object('managed',managed,'source',source) FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=v_listing));
  ELSIF v_mode IS DISTINCT FROM 'list' THEN RAISE EXCEPTION 'invalid read mode'; END IF;

  v_page:=coalesce((p_query->>'page')::integer,0); v_search:=coalesce(p_query->>'search','');
  v_status:=nullif(p_query->>'status',''); v_origin:=nullif(p_query->>'origin',''); v_tx:=nullif(p_query->>'transaction','');
  v_listing_id:=nullif(p_query->>'listing_id',''); v_source_id:=nullif(p_query->>'source_id',''); v_source_url:=nullif(p_query->>'source_url',''); v_source_name:=nullif(p_query->>'source_name',''); v_agency_name:=nullif(p_query->>'agency_name',''); v_agency:=nullif(p_query->>'agency',''); v_agent_name:=nullif(p_query->>'listing_agent_name',''); v_whatsapp:=nullif(p_query->>'whatsapp',''); v_owner_id:=nullif(p_query->>'owner_id',''); v_owner_email:=nullif(p_query->>'owner_email',''); v_claim_status:=nullif(p_query->>'claim_status','');
  IF v_page<0 OR v_page>0 OR length(v_search)>128 OR length(coalesce(v_listing_id,''))>64 OR length(coalesce(v_source_id,''))>320 OR length(coalesce(v_source_url,''))>2048 OR length(coalesce(v_source_name,''))>320 OR length(coalesce(v_agency_name,''))>320 OR length(coalesce(v_agency,''))>320 OR length(coalesce(v_agent_name,''))>320 OR length(coalesce(v_whatsapp,''))>64 OR length(coalesce(v_owner_id,''))>64 OR length(coalesce(v_owner_email,''))>320 OR (v_status IS NOT NULL AND v_status NOT IN ('draft','active','expired','archived','deleted')) OR (v_origin IS NOT NULL AND v_origin NOT IN ('customer','system','imported')) OR (v_tx IS NOT NULL AND v_tx NOT IN ('sale','rent')) OR (v_claim_status IS NOT NULL AND v_claim_status NOT IN ('claimed','unclaimed')) OR (v_agency IS NOT NULL AND v_agency !~ '^(agency|source):.+') THEN RAISE EXCEPTION 'invalid bounded filter'; END IF;
  IF v_whatsapp IS NOT NULL AND regexp_replace(v_whatsapp,'[^0-9]','','g') !~ '^[0-9]{8,15}$' THEN RAISE EXCEPTION 'invalid WhatsApp filter'; END IF;
  v_province:=nullif(p_query->>'province','')::bigint; v_canton:=nullif(p_query->>'canton','')::bigint; v_district:=nullif(p_query->>'district','')::bigint; v_ptype:=nullif(p_query->>'property_type','')::bigint;
  IF v_province IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=v_province AND t.term_type='province' AND t.level=1) THEN RAISE EXCEPTION 'invalid province'; END IF;
  IF v_canton IS NOT NULL AND (v_province IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=v_canton AND t.term_type='canton' AND t.level=2 AND t.parent_id=v_province)) THEN RAISE EXCEPTION 'invalid canton'; END IF;
  IF v_district IS NOT NULL AND (v_canton IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=v_district AND t.term_type='district' AND t.level=3 AND t.parent_id=v_canton)) THEN RAISE EXCEPTION 'invalid district'; END IF;
  IF v_ptype IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=v_ptype AND t.term_type='property_type' AND t.level=1) THEN RAISE EXCEPTION 'invalid property type'; END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v_result FROM (
    SELECT l.id,l.title,l.transaction_type,l.listing_status,l.listing_origin,l.listing_source_type,l.owner_id,au.email AS owner_email,l.source_name,l.source_listing_id,l.source_url,l.agency_name,l.agency_logo_url,l.listing_agent_name,l.listing_agent_photo_url,
      CASE WHEN l.owner_id IS NOT NULL AND EXISTS(SELECT 1 FROM twuanis_canonical_private.listing_claim_events e WHERE e.listing_id=l.id AND e.subject=l.owner_id AND e.operation='claimed') THEN 'claimed' ELSE 'unclaimed' END AS claim_status,
      l.province,l.canton,l.district,l.property_type,l.updated_at
    FROM public.listings l LEFT JOIN auth.users au ON au.id=l.owner_id
    WHERE (v_status IS NULL OR l.listing_status=v_status) AND (v_tx IS NULL OR l.transaction_type=v_tx) AND (v_origin IS NULL OR l.listing_origin=v_origin)
      AND (v_listing_id IS NULL OR l.id::text=v_listing_id) AND (v_source_id IS NULL OR l.source_listing_id=v_source_id) AND (v_source_url IS NULL OR l.source_url=v_source_url)
      AND (v_source_name IS NULL OR lower(coalesce(l.source_name,'')) LIKE '%'||lower(v_source_name)||'%')
      AND (v_agency_name IS NULL OR lower(coalesce(l.agency_name,'')) LIKE '%'||lower(v_agency_name)||'%')
      AND (v_agency IS NULL OR (v_agency LIKE 'agency:%' AND lower(coalesce(l.agency_name,''))=substring(v_agency FROM 8)) OR (v_agency LIKE 'source:%' AND lower(coalesce(l.source_name,''))=lower(substring(v_agency FROM 8)) AND nullif(btrim(l.agency_name),'') IS NOT NULL))
      AND (v_agent_name IS NULL OR lower(coalesce(l.listing_agent_name,'')) LIKE '%'||lower(v_agent_name)||'%')
      AND (v_whatsapp IS NULL OR regexp_replace(coalesce(l.whatsapp,''),'[^0-9]','','g')=regexp_replace(v_whatsapp,'[^0-9]','','g'))
      AND (v_owner_id IS NULL OR l.owner_id::text=v_owner_id) AND (v_owner_email IS NULL OR lower(coalesce(au.email,''))=lower(v_owner_email))
      AND (v_claim_status IS NULL OR v_claim_status=CASE WHEN l.owner_id IS NOT NULL AND EXISTS(SELECT 1 FROM twuanis_canonical_private.listing_claim_events e WHERE e.listing_id=l.id AND e.subject=l.owner_id AND e.operation='claimed') THEN 'claimed' ELSE 'unclaimed' END)
      AND (v_search='' OR l.id::text=v_search OR l.source_listing_id=v_search OR starts_with(lower(l.title),lower(v_search)))
      AND NOT EXISTS(SELECT 1 FROM unnest(ARRAY[v_province,v_canton,v_district,v_ptype]) t(id) WHERE t.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms m WHERE m.listing_id=l.id AND m.ontology_term_id=t.id))
      AND (NOT (p_query ? 'after') OR ((p_query->'after'->>'updated_at') IS NULL AND l.updated_at IS NULL AND l.id>(p_query->'after'->>'id')::uuid) OR ((p_query->'after'->>'updated_at') IS NOT NULL AND (l.updated_at IS NULL OR l.updated_at<(p_query->'after'->>'updated_at')::timestamptz OR (l.updated_at=(p_query->'after'->>'updated_at')::timestamptz AND l.id>(p_query->'after'->>'id')::uuid))))
    ORDER BY l.updated_at DESC NULLS LAST,l.id LIMIT 26
  ) q;
  RETURN v_result;
END
$function$;

REVOKE ALL ON FUNCTION public.admin_listing_read(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listing_read(jsonb) TO authenticated;
COMMIT;
