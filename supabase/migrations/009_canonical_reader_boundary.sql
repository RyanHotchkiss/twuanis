-- S6: bounded server reader; no direct table grants, provenance or history.
BEGIN;
CREATE FUNCTION public.read_canonical_listing_evidence(
 p_listing_ids uuid[], p_fact_dimensions text[], p_semantic_dimensions text[]
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $f$
DECLARE result jsonb;
BEGIN
 IF p_listing_ids IS NULL OR cardinality(p_listing_ids) NOT BETWEEN 1 AND 25
  OR array_ndims(p_listing_ids) <> 1 OR array_position(p_listing_ids,NULL) IS NOT NULL THEN
  RAISE EXCEPTION 'explicit batch of 1..25 listing identities required' USING ERRCODE='22023';
 END IF;
 IF p_fact_dimensions IS NULL OR cardinality(p_fact_dimensions)>5
  OR array_position(p_fact_dimensions,NULL) IS NOT NULL
  OR NOT p_fact_dimensions <@ ARRAY['bedrooms','bathrooms','parking','year_built','distance_to_paved_road']::text[]
  OR p_semantic_dimensions IS NULL OR cardinality(p_semantic_dimensions)>6
  OR array_position(p_semantic_dimensions,NULL) IS NOT NULL
  OR NOT p_semantic_dimensions <@ ARRAY['property_type','utility','environment','terrain','accessibility','legal_status']::text[] THEN
  RAISE EXCEPTION 'invalid evidence dimensions' USING ERRCODE='22023';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'listing_id',l.id::text,'canonical_domain_version',l.canonical_domain_version,
  'geography',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',t.id::text,'parent_id',t.parent_id::text,'official_code',t.official_code,
   'term_type',t.term_type,'level',t.level,'term_name',t.term_name,
   'term_name_en',(to_jsonb(t)->>'term_name_en'),'term_name_es',(to_jsonb(t)->>'term_name_es'),
   'slug',(to_jsonb(t)->>'slug'),'slug_en',(to_jsonb(t)->>'slug_en'),'slug_es',(to_jsonb(t)->>'slug_es')) ORDER BY t.level,t.id)
   FROM public.listings_ontology_terms m JOIN public.ontology_terms t ON t.id=m.ontology_term_id
   WHERE m.listing_id=l.id AND t.term_type IN ('province','canton','district')),'[]'::jsonb),
  'facts',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'dimension',f.dimension,'kind',f.kind,'exact_value',f.exact_value::text,
   'category_term_id',f.category_term_id::text,'range_lower',f.range_lower::text,
   'range_upper',f.range_upper::text,'lower_inclusive',f.lower_inclusive,
   'upper_inclusive',f.upper_inclusive) ORDER BY f.dimension)
   FROM public.listing_fact_evidence f WHERE f.listing_id=l.id AND f.dimension=ANY(p_fact_dimensions)),'[]'::jsonb),
  'selections',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'dimension',s.dimension,'ontology_term_id',s.ontology_term_id::text,
   'term_type',t.term_type,'level',t.level,'slug',(to_jsonb(t)->>'slug'),'term_name',t.term_name)
   ORDER BY s.dimension,s.ontology_term_id)
   FROM public.listing_semantic_selections s JOIN public.ontology_terms t ON t.id=s.ontology_term_id WHERE s.listing_id=l.id AND s.dimension=ANY(p_semantic_dimensions)),'[]'::jsonb)
 ) ORDER BY l.id),'[]'::jsonb) INTO result
 FROM public.listings l WHERE l.id=ANY(p_listing_ids) AND l.canonical_domain_version=1;
 RETURN result;
END
$f$;
ALTER FUNCTION public.read_canonical_listing_evidence(uuid[],text[],text[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.read_canonical_listing_evidence(uuid[],text[],text[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_canonical_listing_evidence(uuid[],text[],text[]) TO service_role;
-- Explicit legacy compatibility only. These helpers never establish canonical evidence.
CREATE FUNCTION twuanis_canonical_private.s6_legacy_normalize(v text, slug boolean DEFAULT false)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $f$
 SELECT CASE WHEN slug THEN
  regexp_replace(regexp_replace(replace(regexp_replace(normalize(lower(coalesce(v,'')),NFD),U&'[\0300-\036f]','','g'),'+','plus'),'[^a-z0-9]+','-','g'),'(^-|-$)','','g')
 ELSE btrim(regexp_replace(regexp_replace(regexp_replace(normalize(lower(coalesce(v,'')),NFD),U&'[\0300-\036f]','','g'),'[^a-z0-9\s]',' ','g'),'\s+',' ','g')) END
$f$;
ALTER FUNCTION twuanis_canonical_private.s6_legacy_normalize(text,boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION twuanis_canonical_private.s6_legacy_normalize(text,boolean) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.read_legacy_geographic_candidates(
 p_provinces text[],p_cantons text[],p_districts text[],p_district_names text[],p_transaction text
) RETURNS TABLE(listing_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
BEGIN
 IF p_provinces IS NULL OR p_cantons IS NULL OR p_districts IS NULL OR p_district_names IS NULL
 OR cardinality(p_provinces)+cardinality(p_cantons)+cardinality(p_districts)=0
 OR cardinality(p_provinces)>25 OR cardinality(p_cantons)>25 OR cardinality(p_districts)>25 OR cardinality(p_district_names)>25
 OR EXISTS(SELECT 1 FROM unnest(p_provinces||p_cantons||p_districts) x WHERE x IS NULL OR x !~ '^[a-z0-9-]{1,128}$')
 OR EXISTS(SELECT 1 FROM unnest(p_district_names) x WHERE x IS NULL OR length(x)>256)
 OR (p_transaction IS NOT NULL AND p_transaction NOT IN ('sale','rent')) THEN
 RAISE EXCEPTION 'bounded legacy geographic request required' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT l.id FROM public.listings l
 WHERE l.canonical_domain_version IS NULL AND l.listing_status='active'
 AND (p_transaction IS NULL OR (p_transaction='sale' AND (l.transaction_type ILIKE '%sale%' OR l.transaction_type ILIKE '%buy%')) OR (p_transaction='rent' AND (l.transaction_type ILIKE '%rent%' OR l.transaction_type ILIKE '%lease%')))
 AND (cardinality(p_provinces)=0 OR EXISTS(SELECT 1 FROM unnest(p_provinces) x WHERE strpos(twuanis_canonical_private.s6_legacy_normalize(l.province,true),x)>0))
 AND (cardinality(p_cantons)=0 OR EXISTS(SELECT 1 FROM unnest(p_cantons) x WHERE strpos(twuanis_canonical_private.s6_legacy_normalize(l.canton,true),x)>0))
 AND (cardinality(p_districts)=0 OR
  (twuanis_canonical_private.s6_legacy_normalize(l.district,true)<>'' AND EXISTS(SELECT 1 FROM unnest(p_districts) x WHERE starts_with(x,twuanis_canonical_private.s6_legacy_normalize(l.district,true))))
  OR EXISTS(SELECT 1 FROM unnest(p_district_names) x WHERE btrim(regexp_replace(normalize(lower(coalesce(l.district,'')),NFD),U&'[\0300-\036f]','','g'))=btrim(regexp_replace(normalize(lower(x),NFD),U&'[\0300-\036f]','','g'))))
 ORDER BY l.id;
END $f$;
ALTER FUNCTION public.read_legacy_geographic_candidates(text[],text[],text[],text[],text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.read_legacy_geographic_candidates(text[],text[],text[],text[],text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_legacy_geographic_candidates(text[],text[],text[],text[],text) TO service_role;

CREATE FUNCTION public.read_legacy_geography_dictionary(p_listing_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE result jsonb;
BEGIN
 IF p_listing_ids IS NULL OR cardinality(p_listing_ids) NOT BETWEEN 1 AND 25 OR array_ndims(p_listing_ids)<>1 OR array_position(p_listing_ids,NULL) IS NOT NULL THEN
 RAISE EXCEPTION 'explicit batch of 1..25 legacy listing identities required' USING ERRCODE='22023'; END IF;
 WITH source AS (
 SELECT v.dimension,twuanis_canonical_private.s6_legacy_normalize(v.value) value
 FROM public.listings l CROSS JOIN LATERAL (VALUES('province',l.province),('canton',l.canton),('district',l.district)) v(dimension,value)
 WHERE l.id=ANY(p_listing_ids) AND l.canonical_domain_version IS NULL
 ), aliases AS (
 SELECT dimension,value FROM source UNION
 SELECT dimension,btrim(regexp_replace(regexp_replace(value,CASE dimension WHEN 'province' THEN '\mprovincia\M' WHEN 'canton' THEN '\mcanton\M' ELSE '\mcentro\M' END,'','g'),'\s+',' ','g')) FROM source UNION
 SELECT dimension,btrim(regexp_replace(regexp_replace(value,'\mcapital\M','','g'),'\s+',' ','g')) FROM source WHERE dimension='canton'
 ), terms AS (
 SELECT t.* FROM public.ontology_terms t WHERE t.term_type IN ('province','canton','district') AND EXISTS(
 SELECT 1 FROM aliases a CROSS JOIN LATERAL unnest(ARRAY[t.term_name,to_jsonb(t)->>'term_name_en',to_jsonb(t)->>'term_name_es',to_jsonb(t)->>'slug',to_jsonb(t)->>'slug_en',to_jsonb(t)->>'slug_es']) label
 WHERE a.dimension=t.term_type AND a.value<>'' AND a.value=twuanis_canonical_private.s6_legacy_normalize(label))
 )
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',t.id::text,'parent_id',t.parent_id::text,'term_type',t.term_type,'term_name',t.term_name,'term_name_en',to_jsonb(t)->>'term_name_en','term_name_es',to_jsonb(t)->>'term_name_es','slug',to_jsonb(t)->>'slug','slug_en',to_jsonb(t)->>'slug_en','slug_es',to_jsonb(t)->>'slug_es','official_code',t.official_code) ORDER BY t.id),'[]') INTO result FROM terms t;
 IF jsonb_array_length(result)>1000 THEN RAISE EXCEPTION 'ambiguous legacy dictionary exceeds bound' USING ERRCODE='54000'; END IF;
 RETURN result;
END $f$;
ALTER FUNCTION public.read_legacy_geography_dictionary(uuid[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.read_legacy_geography_dictionary(uuid[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_legacy_geography_dictionary(uuid[]) TO service_role;
COMMIT;
