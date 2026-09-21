-- S7 customer edits preserve recorded sealed classification policy.
BEGIN;
CREATE TABLE twuanis_canonical_private.customer_domain_edits (
 owner_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 listing_id uuid NOT NULL REFERENCES public.listings(id), expected_revision bigint NOT NULL,
 input jsonb NOT NULL, derived jsonb NOT NULL,
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE twuanis_canonical_private.customer_domain_edits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.customer_domain_edits FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.mutate_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_domains jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); d jsonb; original jsonb; snapshot twuanis_canonical_private.customer_domain_edits%ROWTYPE;
 item record; sets uuid[]; group_name text; dim text; l public.listings%ROWTYPE;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_expected IS NULL OR p_expected<1 THEN RAISE EXCEPTION 'explicit request/revision required' USING ERRCODE='22023'; END IF;
 d:=twuanis_canonical_private.s4_domains(p_domains,'owner'); original:=d;
 IF d ? 'lifecycle' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'lifecycle',ARRAY['event','reason'],ARRAY['event']);
  IF d->'lifecycle'->>'event' IN ('publish','renew') THEN RAISE EXCEPTION 'owner publication requires trusted duration policy' USING ERRCODE='0A000'; END IF;
 END IF;
 PERFORM twuanis_canonical_private.ensure_publisher_account(actor);
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array('owner',actor::text,'domain_mutation',p_request)::text));
 SELECT * INTO snapshot FROM twuanis_canonical_private.customer_domain_edits WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF snapshot.listing_id IS DISTINCT FROM p_listing OR snapshot.expected_revision IS DISTINCT FROM p_expected OR snapshot.input IS DISTINCT FROM original THEN RAISE EXCEPTION 'edit idempotency conflict' USING ERRCODE='22023'; END IF;
  d:=snapshot.derived;
 ELSE
  SELECT * INTO l FROM public.listings WHERE id=p_listing AND owner_id=actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
  IF l.canonical_domain_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'canonical listing required' USING ERRCODE='55000'; END IF;
  -- Receipts from before this migration retain their original payload semantics.
  IF NOT EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE authority_kind='owner' AND authority_identity=actor::text AND operation_type='domain_mutation' AND request_id=p_request) THEN
  IF d->'facts'->'distance_to_paved_road'->>'kind'='range' AND EXISTS(SELECT 1 FROM public.listing_fact_evidence WHERE listing_id=p_listing AND dimension='distance_to_paved_road' AND kind='exact') THEN
   RAISE EXCEPTION 'Existing exact road-distance evidence cannot be replaced by a range' USING ERRCODE='22023';
  END IF;
   FOREACH group_name IN ARRAY ARRAY['facts','measurements'] LOOP
    FOR item IN SELECT key,value FROM jsonb_each(coalesce(d->group_name,'{}')) LOOP
     dim:=item.key;
     IF group_name='facts' AND item.value->>'kind' IS DISTINCT FROM 'exact' THEN CONTINUE; END IF;
     SELECT array_agg(DISTINCT r.rule_set_id) INTO sets FROM public.listing_membership_origins m JOIN public.listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=p_listing AND m.origin_domain=dim AND m.classification_rule_id IS NOT NULL;
     IF sets IS NOT NULL THEN
      IF cardinality(sets)<>1 OR NOT EXISTS(SELECT 1 FROM public.listing_classification_rule_sets r JOIN twuanis_canonical_private.classification_seals s ON s.rule_set_id=r.id WHERE r.id=sets[1] AND r.domain=dim) THEN RAISE EXCEPTION 'one recorded sealed typed rule required' USING ERRCODE='55000'; END IF;
      d:=jsonb_set(d,ARRAY[group_name,dim,'rule_set'],to_jsonb(sets[1]::text));
     END IF;
    END LOOP;
   END LOOP;
  END IF;
  INSERT INTO twuanis_canonical_private.customer_domain_edits VALUES(actor,p_request,p_listing,p_expected,original,d);
 END IF;
 RETURN twuanis_canonical_private.s3_command(p_listing,p_expected,'owner',actor::text,p_request,d,NULL)||jsonb_build_object('listing_id',p_listing::text);
END $$;
ALTER FUNCTION public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb) TO authenticated;
COMMIT;
