-- Admin Listings discovery filters.  Claim state deliberately requires both the
-- durable claim event and the matching current listing owner; owner_id alone is
-- not evidence that a listing was claimed.
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
  a uuid;
  mode text;
  page integer;
  search text;
  status text;
  origin text;
  tx text;
  province bigint;
  canton bigint;
  district bigint;
  ptype bigint;
  listing_id text;
  source_id text;
  source_url text;
  source_name text;
  agency_name text;
  listing_agent_name text;
  whatsapp text;
  owner_id text;
  owner_email text;
  claim_status text;
  v jsonb;
  lid uuid;
BEGIN
  a:=twuanis_canonical_private.assert_administrative_permission('listings.read');
  IF p_query IS NULL OR jsonb_typeof(p_query)<>'object' OR octet_length(p_query::text)>8192 THEN
    RAISE EXCEPTION 'bounded query required';
  END IF;
  PERFORM twuanis_canonical_private.s3_keys(p_query,
    ARRAY['mode','page','after','search','status','origin','transaction','province','canton','district','property_type','listing','dimension','parent','listing_id','source_id','source_url','source_name','agency_name','listing_agent_name','whatsapp','owner_id','owner_email','claim_status'],
    ARRAY['mode']);
  mode:=p_query->>'mode';

  IF mode='overview' THEN
    SELECT jsonb_build_object('total',count(*)::text,'active',count(*) FILTER(WHERE listing_status='active')::text,'archived',count(*) FILTER(WHERE listing_status='archived')::text,'sale',count(*) FILTER(WHERE transaction_type='sale')::text,'rent',count(*) FILTER(WHERE transaction_type='rent')::text) INTO v FROM public.listings;
    RETURN v;
  ELSIF mode='options' THEN
    IF p_query->>'dimension' NOT IN ('province','canton','district','property_type') THEN RAISE EXCEPTION 'invalid dimension'; END IF;
    SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v FROM (
      SELECT id::text,term_name,term_name_en,term_name_es,official_code,parent_id::text
      FROM public.ontology_terms
      WHERE term_type=p_query->>'dimension'
        AND level=CASE p_query->>'dimension' WHEN 'canton' THEN 2 WHEN 'district' THEN 3 ELSE 1 END
        AND ((p_query->>'dimension' IN ('province','property_type')) OR parent_id=(p_query->>'parent')::bigint)
      ORDER BY id LIMIT 501
    ) q;
    IF jsonb_array_length(v)>500 THEN RAISE EXCEPTION 'option bound exceeded'; END IF;
    RETURN v;
  ELSIF mode='detail' THEN
    lid:=(p_query->>'listing')::uuid;
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
    INTO v FROM public.listings l WHERE l.id=lid;
    RETURN v||jsonb_build_object(
      'pending_media',(SELECT coalesce(jsonb_agg(request_id ORDER BY request_id),'[]') FROM twuanis_canonical_private.administrative_media_operations WHERE listing_id=lid AND actor_id=a AND NOT completed),
      'media_groups',(SELECT jsonb_build_object('managed',managed,'source',source) FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=lid));
  ELSIF mode IS DISTINCT FROM 'list' THEN
    RAISE EXCEPTION 'invalid read mode';
  END IF;

  page:=coalesce((p_query->>'page')::integer,0);
  search:=coalesce(p_query->>'search','');
  status:=nullif(p_query->>'status',''); origin:=nullif(p_query->>'origin',''); tx:=nullif(p_query->>'transaction','');
  listing_id:=nullif(p_query->>'listing_id',''); source_id:=nullif(p_query->>'source_id',''); source_url:=nullif(p_query->>'source_url',''); source_name:=nullif(p_query->>'source_name',''); agency_name:=nullif(p_query->>'agency_name',''); listing_agent_name:=nullif(p_query->>'listing_agent_name',''); whatsapp:=nullif(p_query->>'whatsapp',''); owner_id:=nullif(p_query->>'owner_id',''); owner_email:=nullif(p_query->>'owner_email',''); claim_status:=nullif(p_query->>'claim_status','');
  IF page<0 OR page>0 OR length(search)>128 OR length(coalesce(listing_id,''))>64 OR length(coalesce(source_id,''))>320 OR length(coalesce(source_url,''))>2048 OR length(coalesce(source_name,''))>320 OR length(coalesce(agency_name,''))>320 OR length(coalesce(listing_agent_name,''))>320 OR length(coalesce(whatsapp,''))>64 OR length(coalesce(owner_id,''))>64 OR length(coalesce(owner_email,''))>320 OR (status IS NOT NULL AND status NOT IN ('draft','active','expired','archived','deleted')) OR (origin IS NOT NULL AND origin NOT IN ('customer','system','imported')) OR (tx IS NOT NULL AND tx NOT IN ('sale','rent')) OR (claim_status IS NOT NULL AND claim_status NOT IN ('claimed','unclaimed')) THEN RAISE EXCEPTION 'invalid bounded filter'; END IF;
  IF whatsapp IS NOT NULL AND regexp_replace(whatsapp,'[^0-9]','','g') !~ '^[0-9]{8,15}$' THEN RAISE EXCEPTION 'invalid WhatsApp filter'; END IF;
  province:=nullif(p_query->>'province','')::bigint; canton:=nullif(p_query->>'canton','')::bigint; district:=nullif(p_query->>'district','')::bigint; ptype:=nullif(p_query->>'property_type','')::bigint;
  IF province IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=province AND t.term_type='province' AND t.level=1) THEN RAISE EXCEPTION 'invalid province'; END IF;
  IF canton IS NOT NULL AND (province IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=canton AND t.term_type='canton' AND t.level=2 AND t.parent_id=province)) THEN RAISE EXCEPTION 'invalid canton'; END IF;
  IF district IS NOT NULL AND (canton IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=district AND t.term_type='district' AND t.level=3 AND t.parent_id=canton)) THEN RAISE EXCEPTION 'invalid district'; END IF;
  IF ptype IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=ptype AND t.term_type='property_type' AND t.level=1) THEN RAISE EXCEPTION 'invalid property type'; END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v FROM (
    SELECT l.id,l.title,l.transaction_type,l.listing_status,l.listing_origin,l.listing_source_type,l.owner_id,
      au.email AS owner_email,l.source_name,l.source_listing_id,l.source_url,l.agency_name,l.agency_logo_url,l.listing_agent_name,l.listing_agent_photo_url,
      CASE WHEN l.owner_id IS NOT NULL AND EXISTS(SELECT 1 FROM twuanis_canonical_private.listing_claim_events e WHERE e.listing_id=l.id AND e.subject=l.owner_id AND e.operation='claimed') THEN 'claimed' ELSE 'unclaimed' END AS claim_status,
      l.province,l.canton,l.district,l.property_type,l.updated_at
    FROM public.listings l
    LEFT JOIN auth.users au ON au.id=l.owner_id
    WHERE (status IS NULL OR l.listing_status=status)
      AND (tx IS NULL OR l.transaction_type=tx)
      AND (origin IS NULL OR l.listing_origin=origin)
      AND (listing_id IS NULL OR l.id::text=listing_id)
      AND (source_id IS NULL OR l.source_listing_id=source_id)
      AND (source_url IS NULL OR l.source_url=source_url)
      AND (source_name IS NULL OR lower(coalesce(l.source_name,'')) LIKE '%'||lower(source_name)||'%')
      AND (agency_name IS NULL OR lower(coalesce(l.agency_name,'')) LIKE '%'||lower(agency_name)||'%')
      AND (listing_agent_name IS NULL OR lower(coalesce(l.listing_agent_name,'')) LIKE '%'||lower(listing_agent_name)||'%')
      AND (whatsapp IS NULL OR regexp_replace(coalesce(l.whatsapp,''),'[^0-9]','','g')=regexp_replace(whatsapp,'[^0-9]','','g'))
      AND (owner_id IS NULL OR l.owner_id::text=owner_id)
      AND (owner_email IS NULL OR lower(coalesce(au.email,''))=lower(owner_email))
      AND (claim_status IS NULL OR claim_status=CASE WHEN l.owner_id IS NOT NULL AND EXISTS(SELECT 1 FROM twuanis_canonical_private.listing_claim_events e WHERE e.listing_id=l.id AND e.subject=l.owner_id AND e.operation='claimed') THEN 'claimed' ELSE 'unclaimed' END)
      AND (search='' OR l.id::text=search OR l.source_listing_id=search OR starts_with(lower(l.title),lower(search)))
      AND NOT EXISTS(SELECT 1 FROM unnest(ARRAY[province,canton,district,ptype]) t(id) WHERE t.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms m WHERE m.listing_id=l.id AND m.ontology_term_id=t.id))
      AND (NOT (p_query ? 'after') OR ((p_query->'after'->>'updated_at') IS NULL AND l.updated_at IS NULL AND l.id>(p_query->'after'->>'id')::uuid) OR ((p_query->'after'->>'updated_at') IS NOT NULL AND (l.updated_at IS NULL OR l.updated_at<(p_query->'after'->>'updated_at')::timestamptz OR (l.updated_at=(p_query->'after'->>'updated_at')::timestamptz AND l.id>(p_query->'after'->>'id')::uuid))))
    ORDER BY l.updated_at DESC NULLS LAST,l.id LIMIT 26
  ) q;
  RETURN v;
END
$function$;

REVOKE ALL ON FUNCTION public.admin_listing_read(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listing_read(jsonb) TO authenticated;
COMMIT;
