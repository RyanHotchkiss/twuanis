-- Local Step 3 preparation only. No target application authorized.
BEGIN;
CREATE FUNCTION public.admin_listing_read(p_query jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
<<filters>>
DECLARE a uuid; mode text; page integer; search text; status text; origin text; tx text;
 province bigint;canton bigint;district bigint;ptype bigint;v jsonb; lid uuid;
BEGIN
 a:=twuanis_canonical_private.assert_administrative_permission('listings.read');
 IF p_query IS NULL OR jsonb_typeof(p_query)<>'object' OR octet_length(p_query::text)>4096 THEN RAISE EXCEPTION 'bounded query required'; END IF;
 PERFORM twuanis_canonical_private.s3_keys(p_query,ARRAY['mode','page','after','search','status','origin','transaction','province','canton','district','property_type','listing','dimension','parent'],ARRAY['mode']);
 mode:=p_query->>'mode';
 IF mode='overview' THEN
  SELECT jsonb_build_object('total',count(*)::text,'active',count(*) FILTER(WHERE listing_status='active')::text,'archived',count(*) FILTER(WHERE listing_status='archived')::text,'sale',count(*) FILTER(WHERE transaction_type='sale')::text,'rent',count(*) FILTER(WHERE transaction_type='rent')::text) INTO v FROM public.listings;
  RETURN v;
 ELSIF mode='options' THEN
  IF p_query->>'dimension' NOT IN ('province','canton','district','property_type') THEN RAISE EXCEPTION 'invalid dimension'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v FROM (
   SELECT id::text,term_name,term_name_en,term_name_es,official_code,parent_id::text FROM public.ontology_terms
   WHERE term_type=p_query->>'dimension' AND level=CASE p_query->>'dimension' WHEN 'canton' THEN 2 WHEN 'district' THEN 3 ELSE 1 END
    AND ((p_query->>'dimension' IN ('province','property_type')) OR parent_id=(p_query->>'parent')::bigint)
   ORDER BY id LIMIT 501
  )q;
  IF jsonb_array_length(v)>500 THEN RAISE EXCEPTION 'option bound exceeded'; END IF;RETURN v;
 ELSIF mode='detail' THEN
  lid:=(p_query->>'listing')::uuid;
  SELECT jsonb_build_object('id',id,'title',title,'description',description,'whatsapp',whatsapp,'transaction_type',transaction_type,'listing_status',listing_status,'owner_id',owner_id,'listing_origin',listing_origin,'listing_source_type',listing_source_type,'source_name',source_name,'source_listing_id',source_listing_id,'source_url',source_url,'last_seen',last_seen,'province',l.province,'canton',l.canton,'district',l.district,'property_type',property_type,'property_area',property_area::text,'construction_area',construction_area::text,'current_price',current_price::text,'monthly_price',monthly_price::text,'currency',currency,'bedrooms',bedrooms,'bathrooms',bathrooms,'parking',parking,'year_built_range',year_built_range,'distance_to_paved_road_range',distance_to_paved_road_range,'utility',utility,'environment',environment,'terrain',terrain,'accessibility',accessibility,'legal_status',legal_status,'images',images,'updated_at',updated_at,'canonical_revision',canonical_revision::text,'canonical_domain_version',canonical_domain_version) INTO v FROM public.listings l WHERE id=lid;
  RETURN v||jsonb_build_object('pending_media',(SELECT coalesce(jsonb_agg(request_id ORDER BY request_id),'[]') FROM twuanis_canonical_private.administrative_media_operations WHERE listing_id=lid AND actor_id=a AND NOT completed),'media_groups',(SELECT jsonb_build_object('managed',managed,'source',source) FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=lid));
 ELSIF mode IS DISTINCT FROM 'list' THEN RAISE EXCEPTION 'invalid read mode'; END IF;
 page:=coalesce((p_query->>'page')::integer,0);search:=coalesce(p_query->>'search','');status:=nullif(p_query->>'status','');origin:=nullif(p_query->>'origin','');tx:=nullif(p_query->>'transaction','');
 IF page<0 OR page>0 OR length(search)>128 OR (status IS NOT NULL AND status NOT IN ('draft','active','expired','archived','deleted')) OR (origin IS NOT NULL AND origin NOT IN ('customer','system','imported')) OR (tx IS NOT NULL AND tx NOT IN ('sale','rent')) THEN RAISE EXCEPTION 'invalid bounded filter'; END IF;
 province:=nullif(p_query->>'province','')::bigint;canton:=nullif(p_query->>'canton','')::bigint;district:=nullif(p_query->>'district','')::bigint;ptype:=nullif(p_query->>'property_type','')::bigint;
 IF province IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=province AND t.term_type='province' AND t.level=1) THEN RAISE EXCEPTION 'invalid province'; END IF;
 IF canton IS NOT NULL AND (province IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=canton AND t.term_type='canton' AND t.level=2 AND t.parent_id=province)) THEN RAISE EXCEPTION 'invalid canton'; END IF;
 IF district IS NOT NULL AND (canton IS NULL OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=district AND t.term_type='district' AND t.level=3 AND t.parent_id=canton)) THEN RAISE EXCEPTION 'invalid district'; END IF;
 IF ptype IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id=ptype AND t.term_type='property_type' AND t.level=1) THEN RAISE EXCEPTION 'invalid property type'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO v FROM (
  SELECT l.id,l.title,l.transaction_type,l.listing_status,l.listing_origin,l.listing_source_type,l.owner_id,l.source_name,l.source_listing_id,l.province,l.canton,l.district,l.property_type,l.updated_at
  FROM public.listings l WHERE (status IS NULL OR l.listing_status=status) AND (tx IS NULL OR l.transaction_type=tx) AND (origin IS NULL OR l.listing_origin=origin)
   AND (search='' OR l.id::text=search OR l.source_listing_id=search OR starts_with(lower(l.title),lower(search)))
   AND NOT EXISTS(SELECT 1 FROM unnest(ARRAY[filters.province,filters.canton,filters.district,ptype]) t(id) WHERE t.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms m WHERE m.listing_id=l.id AND m.ontology_term_id=t.id))
  AND (NOT (p_query ? 'after') OR
    ((p_query->'after'->>'updated_at') IS NULL AND l.updated_at IS NULL AND l.id>(p_query->'after'->>'id')::uuid) OR
    ((p_query->'after'->>'updated_at') IS NOT NULL AND (l.updated_at IS NULL OR l.updated_at<(p_query->'after'->>'updated_at')::timestamptz OR (l.updated_at=(p_query->'after'->>'updated_at')::timestamptz AND l.id>(p_query->'after'->>'id')::uuid))))
  ORDER BY l.updated_at DESC NULLS LAST,l.id LIMIT 26
 )q;RETURN v;
END $$;
ALTER FUNCTION public.admin_listing_read(jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_listing_read(jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_listing_read(jsonb) TO authenticated;
COMMIT;
