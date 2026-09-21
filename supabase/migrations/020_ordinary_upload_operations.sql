-- S7 ordinary owned-media retry. No lifecycle/domain authority or storage cleanup.
BEGIN;
CREATE TABLE twuanis_canonical_private.ordinary_upload_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 listing_id uuid NOT NULL REFERENCES public.listings(id),
 storage_path text NOT NULL UNIQUE,
 byte_size integer NOT NULL CHECK(byte_size BETWEEN 1 AND 614400),
 completed boolean NOT NULL DEFAULT false
);
ALTER TABLE twuanis_canonical_private.ordinary_upload_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.ordinary_upload_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.prepare_ordinary_upload(p_owner uuid,p_listing uuid,p_bytes integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE l public.listings%ROWTYPE; op twuanis_canonical_private.ordinary_upload_operations%ROWTYPE; oid uuid:=gen_random_uuid();
BEGIN
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF NOT FOUND OR p_owner IS NULL OR l.owner_id IS DISTINCT FROM p_owner OR l.listing_status IS NULL OR l.listing_status='deleted' OR (l.canonical_domain_version IS NOT NULL AND l.canonical_domain_version<>1) THEN RAISE EXCEPTION 'owned eligible listing required' USING ERRCODE='42501';END IF;
 INSERT INTO twuanis_canonical_private.ordinary_upload_operations(id,owner_id,listing_id,storage_path,byte_size)
 VALUES(oid,p_owner,p_listing,p_owner::text||'/'||p_listing::text||'/upload-'||oid::text||'.jpg',p_bytes) RETURNING * INTO op;
 RETURN to_jsonb(op);
END $$;
CREATE FUNCTION public.get_ordinary_upload(p_owner uuid,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op twuanis_canonical_private.ordinary_upload_operations%ROWTYPE;
BEGIN
 SELECT o.* INTO op FROM twuanis_canonical_private.ordinary_upload_operations o JOIN public.listings l ON l.id=o.listing_id
 WHERE o.id=p_operation AND o.owner_id=p_owner AND l.owner_id=p_owner AND l.listing_status IS NOT NULL AND l.listing_status<>'deleted' AND (l.canonical_domain_version IS NULL OR l.canonical_domain_version=1);
 IF NOT FOUND THEN RAISE EXCEPTION 'owned eligible upload required' USING ERRCODE='42501';END IF;
 RETURN to_jsonb(op);
END $$;
CREATE FUNCTION public.attach_ordinary_upload(p_owner uuid,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op twuanis_canonical_private.ordinary_upload_operations%ROWTYPE;l public.listings%ROWTYPE; paths jsonb; raw text;
BEGIN
 SELECT * INTO op FROM twuanis_canonical_private.ordinary_upload_operations WHERE id=p_operation AND owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned upload required' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.listings WHERE id=op.listing_id FOR UPDATE;
 IF NOT FOUND OR l.owner_id IS DISTINCT FROM p_owner OR l.listing_status IS NULL OR l.listing_status='deleted' OR (l.canonical_domain_version IS NOT NULL AND l.canonical_domain_version<>1) THEN RAISE EXCEPTION 'owned eligible listing required' USING ERRCODE='42501';END IF;
 raw:=btrim(coalesce(l.images::text,''));
 IF raw IN ('','null') THEN paths:='[]';
 ELSIF left(raw,1)='[' THEN paths:=raw::jsonb;
 ELSE paths:=to_jsonb(string_to_array(raw,'|'));END IF;
 IF jsonb_typeof(paths)<>'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(paths) v WHERE jsonb_typeof(v)<>'string') THEN RAISE EXCEPTION 'invalid current image array' USING ERRCODE='22023';END IF;
 -- Completed replay acknowledges the old operation, never resurrects subsequently removed media.
 IF NOT op.completed THEN
  IF NOT paths @> jsonb_build_array(op.storage_path) THEN
   IF jsonb_array_length(paths)>=25 THEN RAISE EXCEPTION 'image limit reached' USING ERRCODE='23514';END IF;
   paths:=paths||jsonb_build_array(op.storage_path);
   UPDATE public.listings SET images=paths::text,updated_at=clock_timestamp() WHERE id=l.id;
  END IF;
  UPDATE twuanis_canonical_private.ordinary_upload_operations SET completed=true WHERE id=op.id;
 END IF;
 RETURN jsonb_build_object('success',true,'status','ATTACHMENT_CONFIRMED','operationId',op.id,'listingId',l.id,'path',op.storage_path,'images',paths,'imageCount',jsonb_array_length(paths));
END $$;
REVOKE ALL ON FUNCTION public.prepare_ordinary_upload(uuid,uuid,integer),public.get_ordinary_upload(uuid,uuid),public.attach_ordinary_upload(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.prepare_ordinary_upload(uuid,uuid,integer),public.get_ordinary_upload(uuid,uuid),public.attach_ordinary_upload(uuid,uuid) TO service_role;
COMMIT;
