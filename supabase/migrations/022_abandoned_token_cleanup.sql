-- Existing 24-hour unverified-token cleanup, claimed before physical cleanup.
BEGIN;
CREATE FUNCTION public.claim_abandoned_listing_token(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE t public.listing_publish_tokens%ROWTYPE;
BEGIN
 SELECT * INTO t FROM public.listing_publish_tokens WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR t.verified IS DISTINCT FROM false OR t.created_at>=clock_timestamp()-interval '24 hours'
 OR t.created_at IS NULL OR EXISTS(SELECT 1 FROM twuanis_canonical_private.token_creation_commands WHERE token=t.token) THEN RETURN NULL;END IF;
 DELETE FROM public.listing_publish_tokens WHERE id=t.id;
 RETURN jsonb_build_object('id',t.id,'token',t.token,'listing_data',t.listing_data);
END $$;
REVOKE ALL ON FUNCTION public.claim_abandoned_listing_token(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.claim_abandoned_listing_token(uuid) TO service_role;
COMMIT;
