-- Narrow ordinary-image detach/cleanup receipt. No lifecycle authority.
BEGIN;
CREATE TABLE twuanis_canonical_private.image_detach_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL,
 listing_id uuid NOT NULL REFERENCES public.listings(id), image_value text NOT NULL,
 managed boolean NOT NULL, cleanup_completed boolean NOT NULL DEFAULT false,
 UNIQUE(owner_id,listing_id,image_value)
);
ALTER TABLE twuanis_canonical_private.image_detach_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.image_detach_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.detach_listing_image(p_owner uuid,p_listing uuid,p_image text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE l public.listings%ROWTYPE;op twuanis_canonical_private.image_detach_operations%ROWTYPE;paths jsonb;raw text;is_managed boolean;
BEGIN
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF NOT FOUND OR p_owner IS NULL OR l.owner_id IS DISTINCT FROM p_owner OR l.listing_status IS NULL OR l.listing_status='deleted' OR (l.canonical_domain_version IS NOT NULL AND l.canonical_domain_version<>1) THEN RAISE EXCEPTION 'owned eligible listing required' USING ERRCODE='42501';END IF;
 IF p_image IS NULL OR length(p_image)>4096 THEN RAISE EXCEPTION 'invalid image' USING ERRCODE='22023';END IF;
 is_managed:=p_image ~ ('^'||p_owner::text||'/'||p_listing::text||'/[a-zA-Z0-9_-]+[.]jpg$');
 IF NOT is_managed AND p_image !~ '^https?://[^[:space:]]+$' THEN RAISE EXCEPTION 'foreign or invalid media path' USING ERRCODE='42501';END IF;
 raw:=btrim(coalesce(l.images::text,''));
 IF raw IN ('','null') THEN paths:='[]';ELSIF left(raw,1)='[' THEN paths:=raw::jsonb;ELSE paths:=to_jsonb(string_to_array(raw,'|'));END IF;
 IF jsonb_typeof(paths)<>'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(paths) v WHERE jsonb_typeof(v)<>'string') THEN RAISE EXCEPTION 'invalid image array' USING ERRCODE='22023';END IF;
 SELECT * INTO op FROM twuanis_canonical_private.image_detach_operations WHERE owner_id=p_owner AND listing_id=p_listing AND image_value=p_image;
 IF FOUND THEN
  IF paths @> jsonb_build_array(p_image) THEN RAISE EXCEPTION 'previously detached image is attached; do not clean up' USING ERRCODE='55000';END IF;
 ELSE
  IF NOT paths @> jsonb_build_array(p_image) THEN RAISE EXCEPTION 'attached image required' USING ERRCODE='22023';END IF;
  -- Detach all references to this one object; deleting bytes while another reference remains is unsafe.
  SELECT coalesce(jsonb_agg(value ORDER BY n),'[]') INTO paths FROM jsonb_array_elements(paths) WITH ORDINALITY a(value,n) WHERE value<>to_jsonb(p_image);
  UPDATE public.listings SET images=paths::text,updated_at=clock_timestamp() WHERE id=l.id;
  INSERT INTO twuanis_canonical_private.image_detach_operations(owner_id,listing_id,image_value,managed,cleanup_completed)
   VALUES(p_owner,p_listing,p_image,is_managed,NOT is_managed) RETURNING * INTO op;
 END IF;
 RETURN to_jsonb(op)||jsonb_build_object('images',paths,'imageCount',jsonb_array_length(paths));
END $$;
CREATE FUNCTION public.get_image_detach_operation(p_owner uuid,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op twuanis_canonical_private.image_detach_operations%ROWTYPE;
BEGIN
 SELECT * INTO op FROM twuanis_canonical_private.image_detach_operations WHERE id=p_operation AND owner_id=p_owner;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned detach operation required' USING ERRCODE='42501';END IF;
 RETURN public.detach_listing_image(p_owner,op.listing_id,op.image_value);
END $$;
CREATE FUNCTION public.confirm_image_cleanup(p_owner uuid,p_operation uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 PERFORM public.get_image_detach_operation(p_owner,p_operation);
 UPDATE twuanis_canonical_private.image_detach_operations SET cleanup_completed=true WHERE id=p_operation AND owner_id=p_owner;
END $$;
REVOKE ALL ON FUNCTION public.detach_listing_image(uuid,uuid,text),public.get_image_detach_operation(uuid,uuid),public.confirm_image_cleanup(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.detach_listing_image(uuid,uuid,text),public.get_image_detach_operation(uuid,uuid),public.confirm_image_cleanup(uuid,uuid) TO service_role;
COMMIT;
