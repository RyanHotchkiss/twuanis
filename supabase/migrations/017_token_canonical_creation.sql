-- S7 token creation: one canonical identity, fixed owned-media plan, canonical publication.
BEGIN;
CREATE TABLE twuanis_canonical_private.token_creation_commands (
 token text PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES auth.users(id),
 listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id),
 media jsonb NOT NULL CHECK(jsonb_typeof(media)='array' AND jsonb_array_length(media)<=25),
 media_completed boolean NOT NULL DEFAULT false,
 publication_request uuid NOT NULL DEFAULT gen_random_uuid(),
 publication_result jsonb
);
ALTER TABLE twuanis_canonical_private.token_creation_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.token_creation_commands FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.prepare_token_canonical_listing(p_token text,p_owner uuid,p_snapshot jsonb,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE t public.listing_publish_tokens%ROWTYPE;c twuanis_canonical_private.token_creation_commands%ROWTYPE;
 result jsonb;media jsonb:='[]';paths jsonb;v jsonb;item text;
BEGIN
 IF p_owner IS NULL OR p_token IS NULL OR p_token !~ '^[0-9a-f-]{36}$' THEN RAISE EXCEPTION 'explicit token/customer required' USING ERRCODE='22023';END IF;
 PERFORM twuanis_canonical_private.ensure_publisher_account(p_owner);
 SELECT * INTO t FROM public.listing_publish_tokens WHERE token=p_token FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'token not found' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM twuanis_canonical_private.token_creation_commands WHERE token=p_token;
 IF FOUND THEN
  IF c.owner_id<>p_owner THEN RAISE EXCEPTION 'token owner conflict' USING ERRCODE='42501';END IF;
  RETURN jsonb_build_object('listing_id',c.listing_id::text,'media',c.media,'completed',c.media_completed,'publication',c.publication_result,'transaction',(SELECT transaction_type FROM public.listings WHERE id=c.listing_id));
 END IF;
 IF t.published_at IS NOT NULL OR t.published_listing_id IS NOT NULL OR t.verified IS TRUE THEN RAISE EXCEPTION 'previously completed token is not new creation' USING ERRCODE='55000';END IF;
 IF p_snapshot IS NULL OR t.listing_data::jsonb IS DISTINCT FROM p_snapshot THEN RAISE EXCEPTION 'token input changed' USING ERRCODE='40001';END IF;
 paths:=coalesce(t.listing_data->'temporary_images','[]');
 IF jsonb_typeof(paths)<>'array' OR jsonb_array_length(paths)>25 OR coalesce(t.listing_data->'images','[]') IS DISTINCT FROM paths THEN RAISE EXCEPTION 'explicit managed temporary media required' USING ERRCODE='22023';END IF;
 FOR v IN SELECT value FROM jsonb_array_elements(paths) LOOP
  item:=v#>>'{}';
  IF jsonb_typeof(v)<>'string' OR item !~ ('^temporary/'||p_token||'/[a-zA-Z0-9_-]+[.]jpg$') THEN RAISE EXCEPTION 'token media provenance invalid' USING ERRCODE='42501';END IF;
 END LOOP;
 IF (SELECT count(*)<>count(DISTINCT value) FROM jsonb_array_elements(paths)) THEN RAISE EXCEPTION 'duplicate media source' USING ERRCODE='22023';END IF;
 result:=twuanis_canonical_private.s4_create_core(p_owner,gen_random_uuid(),p_input,NULL);
 FOR item IN SELECT value FROM jsonb_array_elements_text(paths) LOOP
  media:=media||jsonb_build_array(jsonb_build_object('source',item,'destination',p_owner::text||'/'||(result->>'listing_id')||'/token-'||gen_random_uuid()::text||'.jpg'));
 END LOOP;
 INSERT INTO twuanis_canonical_private.token_creation_commands(token,owner_id,listing_id,media) VALUES(p_token,p_owner,(result->>'listing_id')::uuid,media);
 UPDATE public.listing_publish_tokens SET claimed_at=clock_timestamp() WHERE id=t.id;
 RETURN jsonb_build_object('listing_id',result->>'listing_id','media',media,'completed',false,'publication',NULL,'transaction',p_input->>'transaction');
END $$;

CREATE FUNCTION public.get_token_canonical_operation(p_token text,p_owner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c twuanis_canonical_private.token_creation_commands%ROWTYPE;
BEGIN
 SELECT x.* INTO c FROM twuanis_canonical_private.token_creation_commands x JOIN public.listing_publish_tokens t ON t.token=x.token WHERE t.token=p_token;
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF c.owner_id IS DISTINCT FROM p_owner THEN RAISE EXCEPTION 'token owner conflict' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('listing_id',c.listing_id::text,'media',c.media,'completed',c.media_completed,'publication',c.publication_result,'transaction',(SELECT transaction_type FROM public.listings WHERE id=c.listing_id));
END $$;
REVOKE ALL ON FUNCTION public.get_token_canonical_operation(text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_token_canonical_operation(text,uuid) TO service_role;

CREATE FUNCTION public.attach_token_canonical_media(p_token text,p_owner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c twuanis_canonical_private.token_creation_commands%ROWTYPE;l public.listings%ROWTYPE;paths jsonb;
BEGIN
 PERFORM twuanis_canonical_private.ensure_publisher_account(p_owner);
 PERFORM 1 FROM public.listing_publish_tokens WHERE token=p_token FOR UPDATE;
 SELECT x.* INTO c FROM twuanis_canonical_private.token_creation_commands x JOIN public.listing_publish_tokens t ON t.token=x.token WHERE t.token=p_token AND x.owner_id=p_owner FOR UPDATE OF x;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned operation required' USING ERRCODE='42501';END IF;
 IF c.media_completed THEN RETURN jsonb_build_object('completed',true,'listing_id',c.listing_id::text);END IF;
 SELECT * INTO l FROM public.listings WHERE id=c.listing_id FOR UPDATE;
 IF l.owner_id IS DISTINCT FROM p_owner OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'owned canonical draft required' USING ERRCODE='55000';END IF;
 SELECT coalesce(jsonb_agg(value->>'destination' ORDER BY n),'[]') INTO paths FROM jsonb_array_elements(c.media) WITH ORDINALITY a(value,n);
 IF l.images IS NOT NULL AND btrim(l.images::text) NOT IN ('','[]','null') AND l.images::text IS DISTINCT FROM paths::text THEN RAISE EXCEPTION 'media changed; no overwrite' USING ERRCODE='40001';END IF;
 UPDATE public.listings SET images=paths::text WHERE id=l.id;
 UPDATE twuanis_canonical_private.token_creation_commands SET media_completed=true WHERE token=c.token;
 RETURN jsonb_build_object('completed',true,'listing_id',c.listing_id::text);
END $$;

CREATE FUNCTION public.publish_token_canonical_listing(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid();c twuanis_canonical_private.token_creation_commands%ROWTYPE;rev bigint;result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501';END IF;
 PERFORM twuanis_canonical_private.resolve_publisher(actor);
 PERFORM 1 FROM public.listing_publish_tokens WHERE token=p_token FOR UPDATE;
 SELECT x.* INTO c FROM twuanis_canonical_private.token_creation_commands x JOIN public.listing_publish_tokens t ON t.token=x.token WHERE t.token=p_token AND x.owner_id=actor FOR UPDATE OF x;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned token operation required' USING ERRCODE='42501';END IF;
 IF c.publication_result IS NOT NULL THEN RETURN c.publication_result;END IF;
 IF NOT c.media_completed THEN RAISE EXCEPTION 'complete token media first' USING ERRCODE='55000';END IF;
 SELECT canonical_revision INTO rev FROM public.listings WHERE id=c.listing_id;
 result:=public.publish_customer_canonical_listing(c.listing_id,rev,c.publication_request,'publish');
 UPDATE twuanis_canonical_private.token_creation_commands SET publication_result=result WHERE token=c.token;
 UPDATE public.listing_publish_tokens SET published_listing_id=c.listing_id,published_at=clock_timestamp(),verified=true,claimed_at=NULL WHERE token=c.token;
 RETURN result;
END $$;

CREATE FUNCTION twuanis_canonical_private.guard_token_media_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF NEW.listing_status='active' AND OLD.listing_status IS DISTINCT FROM 'active' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.token_creation_commands WHERE listing_id=NEW.id AND NOT media_completed) THEN RAISE EXCEPTION 'complete token media first' USING ERRCODE='55000';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s7_token_media_guard BEFORE UPDATE OF listing_status ON public.listings FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_token_media_publication();
CREATE FUNCTION twuanis_canonical_private.guard_token_snapshot() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF (NEW.token,NEW.phone,NEW.listing_data) IS DISTINCT FROM (OLD.token,OLD.phone,OLD.listing_data) AND EXISTS(SELECT 1 FROM twuanis_canonical_private.token_creation_commands WHERE token=OLD.token) THEN RAISE EXCEPTION 'canonical token input frozen' USING ERRCODE='55000';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s7_token_snapshot_guard BEFORE UPDATE ON public.listing_publish_tokens FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_token_snapshot();
REVOKE ALL ON FUNCTION public.prepare_token_canonical_listing(text,uuid,jsonb,jsonb),public.attach_token_canonical_media(text,uuid),public.publish_token_canonical_listing(text),twuanis_canonical_private.guard_token_media_publication(),twuanis_canonical_private.guard_token_snapshot() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.prepare_token_canonical_listing(text,uuid,jsonb,jsonb),public.attach_token_canonical_media(text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_token_canonical_listing(text) TO authenticated;
COMMIT;
