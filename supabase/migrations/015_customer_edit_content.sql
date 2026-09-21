-- Atomic ordinary edit content plus existing canonical domain machinery.
BEGIN;
CREATE TABLE twuanis_canonical_private.customer_content_edits (
 owner_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 listing_id uuid NOT NULL REFERENCES public.listings(id), expected_revision bigint NOT NULL,
 content jsonb NOT NULL, completed boolean NOT NULL DEFAULT false,
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE twuanis_canonical_private.customer_content_edits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.customer_content_edits FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.edit_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_domains jsonb,p_content jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); previous twuanis_canonical_private.customer_content_edits%ROWTYPE; item record; result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 PERFORM twuanis_canonical_private.s3_keys(p_content,ARRAY['title','description','whatsapp']);
 FOR item IN SELECT key,value FROM jsonb_each(p_content) LOOP
  IF jsonb_typeof(item.value)<>'string' OR length(item.value#>>'{}')>(CASE item.key WHEN 'title' THEN 512 WHEN 'description' THEN 16000 ELSE 256 END) THEN RAISE EXCEPTION 'bounded content required' USING ERRCODE='22023'; END IF;
 END LOOP;
 PERFORM twuanis_canonical_private.ensure_publisher_account(actor);
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array('owner',actor::text,'domain_mutation',p_request)::text));
 SELECT * INTO previous FROM twuanis_canonical_private.customer_content_edits WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF previous.listing_id IS DISTINCT FROM p_listing OR previous.expected_revision IS DISTINCT FROM p_expected OR previous.content IS DISTINCT FROM p_content THEN RAISE EXCEPTION 'content idempotency conflict' USING ERRCODE='22023'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE authority_kind='owner' AND authority_identity=actor::text AND operation_type='domain_mutation' AND request_id=p_request) THEN RAISE EXCEPTION 'request already belongs to a different operation' USING ERRCODE='22023'; END IF;
  INSERT INTO twuanis_canonical_private.customer_content_edits(owner_id,request_id,listing_id,expected_revision,content) VALUES(actor,p_request,p_listing,p_expected,p_content);
 END IF;
 result:=public.mutate_customer_canonical_listing(p_listing,p_expected,p_request,p_domains);
 IF coalesce(previous.completed,false) THEN RETURN result; END IF;
 UPDATE public.listings SET
 title=CASE WHEN p_content?'title' THEN p_content->>'title' ELSE title END,
 description=CASE WHEN p_content?'description' THEN p_content->>'description' ELSE description END,
 whatsapp=CASE WHEN p_content?'whatsapp' THEN p_content->>'whatsapp' ELSE whatsapp END
 WHERE id=p_listing AND owner_id=actor AND canonical_domain_version=1;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned canonical listing required' USING ERRCODE='42501'; END IF;
 UPDATE twuanis_canonical_private.customer_content_edits SET completed=true WHERE owner_id=actor AND request_id=p_request;
 RETURN result;
END $$;
ALTER FUNCTION public.edit_customer_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.edit_customer_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.edit_customer_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) TO authenticated;
COMMIT;
