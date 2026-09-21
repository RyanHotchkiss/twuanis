-- S7: explicit customer publication entitlement. No billing-derived runtime policy.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
ALTER TABLE public.package_limits ADD COLUMN publication_duration_seconds bigint
 CHECK (publication_duration_seconds IS NULL OR publication_duration_seconds BETWEEN 1 AND 315576000);
COMMENT ON COLUMN public.package_limits.publication_duration_seconds IS 'Explicit listing publication entitlement in seconds. NULL denies publication/renewal; independent of billing and capacity.';
UPDATE public.package_limits l SET publication_duration_seconds=2592000
 FROM public.packages p WHERE p.id=l.package_id AND p.slug='market-explorer';
-- Protect this new authority even where legacy table-wide DML grants remain.
CREATE FUNCTION twuanis_canonical_private.guard_publication_entitlement()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.publication_duration_seconds IS NOT NULL AND current_user<>'postgres' THEN
   RAISE EXCEPTION 'database administration required for publication entitlement' USING ERRCODE='42501'; END IF;
 ELSE
  IF (NEW.package_id,NEW.publication_duration_seconds) IS DISTINCT FROM (OLD.package_id,OLD.publication_duration_seconds)
   AND current_user<>'postgres' THEN RAISE EXCEPTION 'database administration required for publication entitlement' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_publication_entitlement() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_publication_entitlement BEFORE INSERT OR UPDATE ON public.package_limits
 FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_publication_entitlement();
-- Keep the authorized duration stable on retries even after the package changes.
CREATE TABLE twuanis_canonical_private.customer_publication_commands (
 owner_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,
 listing_id uuid NOT NULL REFERENCES public.listings(id),expected_revision bigint NOT NULL,
 event text NOT NULL CHECK(event IN ('publish','renew')),
 duration_seconds bigint NOT NULL CHECK(duration_seconds BETWEEN 1 AND 315576000),
 package_id uuid NOT NULL REFERENCES public.packages(id),
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE twuanis_canonical_private.customer_publication_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.customer_publication_commands FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.publish_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_event text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();publisher uuid;governing record;c twuanis_canonical_private.customer_publication_commands%ROWTYPE;seconds bigint;result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_listing IS NULL OR p_expected IS NULL OR p_expected<0 OR p_event IS NULL OR p_event NOT IN ('publish','renew')
 THEN RAISE EXCEPTION 'explicit bounded publication command required' USING ERRCODE='22023'; END IF;
 publisher:=twuanis_canonical_private.resolve_publisher(actor);
 IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_listing AND owner_id=actor AND publisher_account_id=publisher AND canonical_domain_version=1)
 THEN RAISE EXCEPTION 'owned canonical listing required' USING ERRCODE='42501'; END IF;
 -- Same operation lock as S3, after the established policy/publisher lock order.
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array('owner',actor::text,'domain_mutation',p_request)::text));
 SELECT * INTO c FROM twuanis_canonical_private.customer_publication_commands WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF (c.listing_id,c.expected_revision,c.event) IS DISTINCT FROM (p_listing,p_expected,p_event)
  THEN RAISE EXCEPTION 'publication retry payload conflict' USING ERRCODE='22023'; END IF;
  seconds:=c.duration_seconds;
 ELSE
  SELECT * INTO STRICT governing FROM twuanis_canonical_private.publisher_allowance(publisher,actor);
  SELECT publication_duration_seconds INTO seconds FROM public.package_limits WHERE package_id=governing.package_id;
  IF seconds IS NULL OR seconds<=0 OR seconds>315576000 THEN RAISE EXCEPTION 'valid package publication entitlement required' USING ERRCODE='55000'; END IF;
  INSERT INTO twuanis_canonical_private.customer_publication_commands(owner_id,request_id,listing_id,expected_revision,event,duration_seconds,package_id)
  VALUES(actor,p_request,p_listing,p_expected,p_event,seconds,governing.package_id);
 END IF;
 result:=twuanis_canonical_private.s3_command(p_listing,p_expected,'owner',actor::text,p_request,
 jsonb_build_object('lifecycle',jsonb_build_object('event',p_event,'duration_seconds',seconds::text)),NULL);
 RETURN result||jsonb_build_object('listing_id',p_listing::text);
END $$;
ALTER FUNCTION public.publish_customer_canonical_listing(uuid,bigint,uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.publish_customer_canonical_listing(uuid,bigint,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.publish_customer_canonical_listing(uuid,bigint,uuid,text) TO authenticated;
COMMIT;
