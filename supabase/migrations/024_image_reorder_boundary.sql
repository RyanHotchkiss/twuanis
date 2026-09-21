-- S11-B narrow media order boundary. Install only during authorized S11-C.
BEGIN;
-- Match the existing route's JavaScript String/trim normalization for stored JSON.
CREATE FUNCTION twuanis_canonical_private.s11_image_trim(v text) RETURNS text
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
 SELECT btrim(v,chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||
 chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||
 chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279))
$$;
CREATE FUNCTION twuanis_canonical_private.s11_image_string(v jsonb,nested boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE f double precision; t text;
BEGIN
 CASE jsonb_typeof(v)
 WHEN 'string' THEN RETURN v#>>'{}';
 WHEN 'null' THEN RETURN CASE WHEN nested THEN '' ELSE 'null' END;
 WHEN 'boolean' THEN RETURN v::text;
 WHEN 'object' THEN RETURN '[object Object]';
 WHEN 'array' THEN RETURN coalesce((SELECT string_agg(twuanis_canonical_private.s11_image_string(value,true),',' ORDER BY n)
   FROM jsonb_array_elements(v) WITH ORDINALITY e(value,n)),'');
 WHEN 'number' THEN
  BEGIN f:=(v::text)::double precision; EXCEPTION WHEN numeric_value_out_of_range THEN
   IF abs((v::text)::numeric)<1 THEN RETURN '0'; END IF;
   RETURN CASE WHEN left(v::text,1)='-' THEN '-Infinity' ELSE 'Infinity' END; END;
  IF f=0 THEN RETURN '0'; END IF;
  t:=f::text;
  IF abs(f)>=0.000001 AND abs(f)<1e21 THEN RETURN trim_scale(t::numeric)::text; END IF;
  RETURN regexp_replace(t,'e([+-])0+','e\1');
 ELSE RAISE EXCEPTION 'unsupported stored JSON';
 END CASE;
END $$;
ALTER FUNCTION twuanis_canonical_private.s11_image_trim(text) OWNER TO postgres;
ALTER FUNCTION twuanis_canonical_private.s11_image_string(jsonb,boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION twuanis_canonical_private.s11_image_trim(text),twuanis_canonical_private.s11_image_string(jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.reorder_listing_images(p_owner uuid,p_listing uuid,p_prior text,p_images text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE l public.listings%ROWTYPE; raw text; parsed jsonb; current_images text[]; proposed text[];
BEGIN
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF NOT FOUND OR p_owner IS NULL OR l.owner_id IS DISTINCT FROM p_owner
 OR l.listing_status IS NULL OR l.listing_status='deleted' THEN
  RAISE EXCEPTION 'owned eligible listing required' USING ERRCODE='42501'; END IF;
 IF l.images IS DISTINCT FROM p_prior THEN RAISE EXCEPTION 'stale prior images' USING ERRCODE='40001'; END IF;
 IF p_images IS NULL OR cardinality(p_images)>25 OR array_ndims(p_images)>1
 OR EXISTS(SELECT 1 FROM unnest(p_images) v WHERE v IS NULL OR v='' OR twuanis_canonical_private.s11_image_trim(v)<>v) THEN
  RAISE EXCEPTION 'normalized image list required' USING ERRCODE='22023'; END IF;
 -- Same stored text formats supported by the route: JSON array, JSON string, pipe list.
 raw:=twuanis_canonical_private.s11_image_trim(coalesce(l.images,''));
 BEGIN parsed:=raw::jsonb; EXCEPTION WHEN invalid_text_representation THEN parsed:=NULL; END;
 IF jsonb_typeof(parsed)='array' THEN
  SELECT coalesce(array_agg(twuanis_canonical_private.s11_image_trim(twuanis_canonical_private.s11_image_string(value)) ORDER BY n)
   FILTER(WHERE twuanis_canonical_private.s11_image_trim(twuanis_canonical_private.s11_image_string(value))<>''),'{}') INTO current_images
   FROM jsonb_array_elements(parsed) WITH ORDINALITY e(value,n);
 ELSIF jsonb_typeof(parsed)='string' AND twuanis_canonical_private.s11_image_trim(parsed#>>'{}')<>'' THEN
  current_images:=ARRAY[twuanis_canonical_private.s11_image_trim(parsed#>>'{}')];
 ELSE
  SELECT coalesce(array_agg(twuanis_canonical_private.s11_image_trim(value) ORDER BY n) FILTER(WHERE twuanis_canonical_private.s11_image_trim(value)<>''),'{}') INTO current_images
  FROM unnest(string_to_array(raw,'|')) WITH ORDINALITY e(value,n);
 END IF;
 SELECT coalesce(array_agg(v ORDER BY v COLLATE "C"),'{}') INTO proposed FROM unnest(p_images) v;
 IF proposed IS DISTINCT FROM (SELECT coalesce(array_agg(v ORDER BY v COLLATE "C"),'{}') FROM unnest(current_images) v) THEN
  RAISE EXCEPTION 'exact image multiset required' USING ERRCODE='22023'; END IF;
 UPDATE public.listings SET images=to_jsonb(p_images)::text,updated_at=clock_timestamp()
 WHERE id=p_listing RETURNING * INTO l;
 RETURN jsonb_build_object('id',l.id,'images',l.images);
END $$;
ALTER FUNCTION public.reorder_listing_images(uuid,uuid,text,text[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reorder_listing_images(uuid,uuid,text,text[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.reorder_listing_images(uuid,uuid,text,text[]) TO service_role;
COMMIT;
