-- Local Step 3 preparation; no production installation authorization.
BEGIN;
CREATE TABLE twuanis_canonical_private.administrative_media_groups(
 listing_id uuid PRIMARY KEY REFERENCES public.listings(id),
 managed text[] NOT NULL DEFAULT '{}',source text[] NOT NULL DEFAULT '{}',
 revision bigint NOT NULL DEFAULT 0,
 CHECK(cardinality(managed)<=25 AND cardinality(source)<=100)
);
CREATE TABLE twuanis_canonical_private.administrative_media_operations(
 actor_id uuid NOT NULL,request_id uuid NOT NULL,listing_id uuid NOT NULL REFERENCES public.listings(id),
 owner_id uuid,path text NOT NULL UNIQUE,bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 614400),
 ordinary_operation uuid,completed boolean NOT NULL DEFAULT false,
 PRIMARY KEY(actor_id,request_id)
);
ALTER TABLE twuanis_canonical_private.administrative_media_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.administrative_media_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.administrative_media_groups,twuanis_canonical_private.administrative_media_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.admin_source_media_refresh(p_listing uuid,p_images text[]) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE g twuanis_canonical_private.administrative_media_groups%ROWTYPE;
BEGIN
 SELECT * INTO g FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=p_listing FOR UPDATE;
 IF FOUND THEN
  UPDATE twuanis_canonical_private.administrative_media_groups SET source=p_images,revision=revision+1 WHERE listing_id=p_listing;
  UPDATE public.listings SET images=to_jsonb(g.managed||p_images)::text WHERE id=p_listing;
 ELSE UPDATE public.listings SET images=array_to_string(p_images,'|') WHERE id=p_listing; END IF;
END $$;
-- Change only the approved source-image replacement expression. Assert exact old body.
DO $$ DECLARE body text;needle text:='UPDATE public.listings SET images=array_to_string(source_images,''|'') WHERE id=l.id;refreshed:=true;';BEGIN
 SELECT pg_get_functiondef('public.ingest_canonical_source_observation(uuid,jsonb)'::regprocedure) INTO body;
 IF (length(body)-length(replace(body,needle,'')))/length(needle)<>1 THEN RAISE EXCEPTION 'unexpected source ingestion definition'; END IF;
 EXECUTE replace(body,needle,'PERFORM twuanis_canonical_private.admin_source_media_refresh(l.id,source_images);refreshed:=true;');
END $$;
CREATE FUNCTION public.admin_prepare_media(p_request uuid,p_listing uuid,p_bytes integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; l public.listings%ROWTYPE;op twuanis_canonical_private.administrative_media_operations%ROWTYPE; ordinary jsonb; paths text[];raw text;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('listings.manage');
 IF p_request IS NULL OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 614400 THEN RAISE EXCEPTION 'bounded media operation required'; END IF;
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF NOT FOUND OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'eligible canonical listing required'; END IF;
 SELECT * INTO op FROM twuanis_canonical_private.administrative_media_operations WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF op.listing_id<>p_listing OR op.bytes<>p_bytes THEN RAISE EXCEPTION 'media replay mismatch'; END IF;RETURN to_jsonb(op);END IF;
 IF (SELECT count(*) FROM twuanis_canonical_private.administrative_media_operations WHERE listing_id=l.id AND NOT completed)>=25 THEN RAISE EXCEPTION 'pending media operation bound';END IF;
 IF l.owner_id IS NOT NULL THEN
  ordinary:=public.prepare_ordinary_upload(l.owner_id,l.id,p_bytes);
  op.path:=ordinary->>'storage_path';op.ordinary_operation:=(ordinary->>'id')::uuid;
 ELSE
  IF l.listing_origin NOT IN ('system','imported') THEN RAISE EXCEPTION 'unestablished provenance';END IF;
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=l.id) THEN
   raw:=btrim(coalesce(l.images,''));
   IF raw IN ('','null') THEN paths:='{}';
   ELSIF left(raw,1)='[' THEN
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(raw::jsonb) e WHERE jsonb_typeof(e)<>'string') THEN RAISE EXCEPTION 'unestablished image provenance'; END IF;
    SELECT coalesce(array_agg(value ORDER BY n),'{}') INTO paths FROM jsonb_array_elements_text(raw::jsonb) WITH ORDINALITY e(value,n);
   ELSE paths:=array_remove(string_to_array(raw,'|'),'');END IF;
   IF cardinality(paths)>0 AND (l.listing_origin<>'imported' OR EXISTS(SELECT 1 FROM unnest(paths) p WHERE p !~ '^https?://[^[:space:]]+$' OR length(p)>4096)) THEN RAISE EXCEPTION 'unestablished image provenance';END IF;
   INSERT INTO twuanis_canonical_private.administrative_media_groups(listing_id,source) VALUES(l.id,paths);
  END IF;
  IF (SELECT cardinality(managed) FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=l.id)>=25 THEN RAISE EXCEPTION 'managed image limit';END IF;
  op.path:='system/listings/'||l.id::text||'/upload-'||gen_random_uuid()::text||'.jpg';
 END IF;
 INSERT INTO twuanis_canonical_private.administrative_media_operations(actor_id,request_id,listing_id,owner_id,path,bytes,ordinary_operation)
 VALUES(actor,p_request,l.id,l.owner_id,op.path,p_bytes,op.ordinary_operation) RETURNING * INTO op;
 PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'listings.manage','listing.media.prepare','listing',l.id,NULL,jsonb_build_object('path',op.path,'provenance',CASE WHEN l.owner_id IS NULL THEN 'twuanis-managed' ELSE 'customer-managed' END),NULL,p_request);
 RETURN to_jsonb(op);
END $$;
CREATE FUNCTION public.admin_attach_media(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;op twuanis_canonical_private.administrative_media_operations%ROWTYPE;l public.listings%ROWTYPE;g twuanis_canonical_private.administrative_media_groups%ROWTYPE;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('listings.manage');
 SELECT * INTO op FROM twuanis_canonical_private.administrative_media_operations WHERE actor_id=actor AND request_id=p_request FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'media operation required';END IF;
 SELECT * INTO l FROM public.listings WHERE id=op.listing_id FOR UPDATE;
 IF l.owner_id IS DISTINCT FROM op.owner_id OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'listing changed';END IF;
 IF NOT op.completed THEN
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='listings-images' AND name=op.path AND (metadata->>'size')::bigint=op.bytes AND metadata->>'mimetype'='image/jpeg') THEN RAISE EXCEPTION 'storage attachment unconfirmed';END IF;
  IF op.owner_id IS NOT NULL THEN PERFORM public.attach_ordinary_upload(op.owner_id,op.ordinary_operation);
  ELSE
   SELECT * INTO g FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=l.id FOR UPDATE;
   IF NOT FOUND OR cardinality(g.managed)>=25 THEN RAISE EXCEPTION 'managed image limit';END IF;
   UPDATE twuanis_canonical_private.administrative_media_groups SET managed=managed||op.path,revision=revision+1 WHERE listing_id=l.id;
   UPDATE public.listings SET images=to_jsonb(g.managed||ARRAY[op.path]||g.source)::text,updated_at=clock_timestamp() WHERE id=l.id;
  END IF;
  UPDATE twuanis_canonical_private.administrative_media_operations SET completed=true WHERE actor_id=actor AND request_id=p_request;
  PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'listings.manage','listing.media.attach','listing',l.id,NULL,jsonb_build_object('path',op.path,'provenance',CASE WHEN op.owner_id IS NULL THEN 'twuanis-managed' ELSE 'customer-managed' END),NULL,p_request);
 END IF;
 RETURN jsonb_build_object('ok',true,'listingId',l.id,'requestId',p_request);
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.admin_source_media_refresh(uuid,text[]),public.admin_prepare_media(uuid,uuid,integer),public.admin_attach_media(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_prepare_media(uuid,uuid,integer),public.admin_attach_media(uuid) TO authenticated;
ALTER FUNCTION twuanis_canonical_private.admin_source_media_refresh(uuid,text[]) OWNER TO postgres;
ALTER FUNCTION public.admin_prepare_media(uuid,uuid,integer) OWNER TO postgres;
ALTER FUNCTION public.admin_attach_media(uuid) OWNER TO postgres;
CREATE FUNCTION public.admin_control_media(p_request uuid,p_listing uuid,p_prior text,p_operation text,p_values text[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;l public.listings%ROWTYPE;g twuanis_canonical_private.administrative_media_groups%ROWTYPE;
 old twuanis_canonical_private.administrative_listing_receipts%ROWTYPE;input jsonb;result jsonb;path text;event bigint;paths text[];raw text;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('listings.manage');
 IF p_request IS NULL OR p_operation NOT IN ('reorder','remove') OR p_operation IS NULL OR p_values IS NULL OR cardinality(p_values)>25 OR EXISTS(SELECT 1 FROM unnest(p_values) x WHERE x IS NULL OR length(x)>4096) THEN RAISE EXCEPTION 'bounded media command required'; END IF;
 input:=jsonb_build_object('listing',p_listing,'prior',p_prior,'operation',p_operation,'values',p_values);
 SELECT * INTO old FROM twuanis_canonical_private.administrative_listing_receipts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF old.input IS DISTINCT FROM input THEN RAISE EXCEPTION 'media replay mismatch';END IF;RETURN old.result;END IF;
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF NOT FOUND OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' OR l.images IS DISTINCT FROM p_prior THEN RAISE EXCEPTION 'stale or ineligible listing' USING ERRCODE='40001';END IF;
 IF p_operation='remove' AND cardinality(p_values)<>1 THEN RAISE EXCEPTION 'one attached image required';END IF;
 IF l.owner_id IS NOT NULL THEN
  IF p_operation='reorder' THEN result:=public.reorder_listing_images(l.owner_id,l.id,p_prior,p_values);
  ELSE result:=public.detach_listing_image(l.owner_id,l.id,p_values[1]);END IF;
 ELSE
  SELECT * INTO g FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=l.id FOR UPDATE;
  IF NOT FOUND THEN
   raw:=btrim(coalesce(l.images,''));
   IF raw IN ('','null') THEN paths:='{}';
   ELSIF left(raw,1)='[' THEN
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(raw::jsonb) e WHERE jsonb_typeof(e)<>'string') THEN RAISE EXCEPTION 'unestablished image provenance'; END IF;
    SELECT coalesce(array_agg(value ORDER BY n),'{}') INTO paths FROM jsonb_array_elements_text(raw::jsonb) WITH ORDINALITY e(value,n);
   ELSE paths:=array_remove(string_to_array(raw,'|'),'');END IF;
   IF cardinality(paths)>0 AND (l.listing_origin<>'imported' OR EXISTS(SELECT 1 FROM unnest(paths) p WHERE p !~ '^https?://[^[:space:]]+$' OR length(p)>4096)) THEN RAISE EXCEPTION 'unestablished image provenance';END IF;
   INSERT INTO twuanis_canonical_private.administrative_media_groups(listing_id,source) VALUES(l.id,paths);
   SELECT * INTO g FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=l.id FOR UPDATE;
  END IF;
  IF p_operation='reorder' THEN
   IF (SELECT array_agg(v ORDER BY v COLLATE "C") FROM unnest(p_values) v) IS DISTINCT FROM (SELECT array_agg(v ORDER BY v COLLATE "C") FROM unnest(g.managed) v) THEN RAISE EXCEPTION 'exact managed multiset required';END IF;
   g.managed:=p_values;
  ELSE
   path:=p_values[1];
   IF path=ANY(g.managed) THEN g.managed:=array_remove(g.managed,path);
   ELSIF path=ANY(g.source) THEN g.source:=array_remove(g.source,path);
   ELSE RAISE EXCEPTION 'attached image required';END IF;
  END IF;
  UPDATE twuanis_canonical_private.administrative_media_groups SET managed=g.managed,source=g.source,revision=revision+1 WHERE listing_id=l.id;
  UPDATE public.listings SET images=to_jsonb(g.managed||g.source)::text,updated_at=clock_timestamp() WHERE id=l.id;
  -- Removal detaches current evidence. No external image bytes are contacted.
  -- Retain storage objects conservatively; this command does not claim physical cleanup.
  result:=jsonb_build_object('ok',true,'images',g.managed||g.source,'storageRetained',p_operation='remove' AND path LIKE 'system/listings/%');
 END IF;
 event:=twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'listings.manage','listing.media.'||p_operation,'listing',l.id,jsonb_build_object('images',l.images),result,NULL,p_request);
 result:=result||jsonb_build_object('eventId',event::text);
 INSERT INTO twuanis_canonical_private.administrative_listing_receipts VALUES(actor,p_request,input,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_control_media(uuid,uuid,text,text,text[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_control_media(uuid,uuid,text,text,text[]) TO authenticated;
ALTER FUNCTION public.admin_control_media(uuid,uuid,text,text,text[]) OWNER TO postgres;
COMMIT;
