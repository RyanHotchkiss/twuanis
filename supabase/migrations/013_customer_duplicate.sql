-- S7: narrow canonical duplicate identity and independent media retry manifest.
BEGIN;
CREATE TABLE twuanis_canonical_private.duplicate_commands (
 owner_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 source_id uuid NOT NULL REFERENCES public.listings(id), listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id),
 creation_receipt uuid NOT NULL REFERENCES public.canonical_operation_receipts(id),
 media jsonb NOT NULL CHECK(jsonb_typeof(media)='array' AND jsonb_array_length(media)<=25),
 completed boolean NOT NULL DEFAULT false,
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE twuanis_canonical_private.duplicate_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.duplicate_commands FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.prepare_customer_duplicate(p_source uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); l public.listings%ROWTYPE; cmd twuanis_canonical_private.duplicate_commands%ROWTYPE;
 input jsonb; geo jsonb; sem jsonb; facts jsonb:='{}'; measurements jsonb:='{}'; f record; v jsonb;
 result jsonb; media jsonb:='[]'; paths jsonb; item text; i integer:=0; creation_request uuid:=gen_random_uuid(); classified jsonb:='{}'; rules uuid[]; dim text; domain_group text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated owner required' USING ERRCODE='42501'; END IF;
 IF p_source IS NULL OR p_request IS NULL THEN RAISE EXCEPTION 'source and request required' USING ERRCODE='22023'; END IF;
 -- Same order as canonical creation: policy/publisher before operation and listing locks.
 PERFORM twuanis_canonical_private.ensure_publisher_account(actor);
 PERFORM pg_advisory_xact_lock(3113,hashtext(jsonb_build_array(actor,p_request)::text));
 SELECT * INTO cmd FROM twuanis_canonical_private.duplicate_commands WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF cmd.source_id<>p_source THEN RAISE EXCEPTION 'duplicate request conflict' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('listing_id',cmd.listing_id::text,'media',cmd.media,'completed',cmd.completed);
 END IF;
 SELECT * INTO l FROM public.listings WHERE id=p_source AND owner_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'owned source required' USING ERRCODE='42501'; END IF;
 IF l.canonical_domain_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'source requires canonical evidence adapter' USING ERRCODE='55000'; END IF;
 SELECT jsonb_object_agg(t.term_type,t.official_code) INTO geo FROM public.listing_membership_origins m JOIN public.ontology_terms t ON t.id=m.ontology_term_id WHERE m.listing_id=l.id AND m.origin_domain='geography' AND t.term_type IN ('province','canton','district');
 SELECT jsonb_object_agg(dimension,ids) INTO sem FROM (SELECT dimension,jsonb_agg(ontology_term_id::text ORDER BY ontology_term_id) ids FROM public.listing_semantic_selections WHERE listing_id=l.id GROUP BY dimension)s;
 FOR f IN SELECT * FROM public.listing_fact_evidence WHERE listing_id=l.id LOOP
  v:=CASE f.kind WHEN 'exact' THEN jsonb_build_object('kind','exact','value',f.exact_value::text)
   WHEN 'category' THEN jsonb_build_object('kind','category','term',f.category_term_id::text)
   ELSE jsonb_build_object('kind','range','lower',f.range_lower::text,'upper',f.range_upper::text,'lower_inclusive',f.lower_inclusive,'upper_inclusive',f.upper_inclusive) END;
  facts:=facts||jsonb_build_object(f.dimension,v);
 END LOOP;
 IF l.property_area IS NOT NULL THEN measurements:=measurements||jsonb_build_object('property_area',jsonb_build_object('value',l.property_area::text)); END IF;
 IF l.construction_area IS NOT NULL THEN measurements:=measurements||jsonb_build_object('construction_area',jsonb_build_object('value',l.construction_area::text)); END IF;
 input:=jsonb_build_object('transaction',l.transaction_type,'geography',geo,'semantics',sem,'facts',facts,'measurements',measurements,
  'content',jsonb_strip_nulls(jsonb_build_object('title',left(coalesce(nullif(l.title,''),'Listing')||' — Copy',512),'description',l.description,'whatsapp',l.whatsapp)));
 IF (CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END) IS NOT NULL THEN
  input:=input||jsonb_build_object('money',jsonb_build_object('amount',(CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END)::text,'currency',l.currency));
 END IF;
 IF l.listing_origin IS DISTINCT FROM 'customer' OR l.listing_source_type IS DISTINCT FROM 'customer' OR l.source_name IS NOT NULL OR l.source_listing_id IS NOT NULL THEN RAISE EXCEPTION 'customer source provenance required' USING ERRCODE='42501'; END IF;
 -- Preserve only customer-owned source objects. Never accept URL/shared paths.
 IF l.images IS NULL OR btrim(l.images::text)='' THEN paths:='[]';
 ELSE BEGIN paths:=l.images::text::jsonb; EXCEPTION WHEN invalid_text_representation THEN paths:=to_jsonb(string_to_array(l.images::text,'|')); END; END IF;
 IF jsonb_typeof(paths)='string' THEN paths:=jsonb_build_array(paths); END IF;
 IF jsonb_typeof(paths)<>'array' OR jsonb_array_length(paths)>25 THEN RAISE EXCEPTION 'invalid source media' USING ERRCODE='22023'; END IF;
 FOR v IN SELECT value FROM jsonb_array_elements(paths) LOOP
  item:=v#>>'{}';
  IF jsonb_typeof(v)<>'string' OR item NOT LIKE (actor::text||'/'||l.id::text||'/%') OR item ~ '(^|/)[.][.]?(/|$)' OR item ~ '[\\]' OR item ~ '[?#]' OR item !~ ('^'||actor::text||'/'||l.id::text||'/[a-zA-Z0-9_-]+[.]jpg$') OR length(item)>1024 THEN RAISE EXCEPTION 'source media ownership invalid' USING ERRCODE='42501'; END IF;
 END LOOP;
 -- Rule policy is read from the source, never supplied by the caller.
 FOR f IN SELECT origin_domain,array_agg(DISTINCT r.rule_set_id) sets
 FROM public.listing_membership_origins m JOIN public.listing_classification_rules r ON r.id=m.classification_rule_id
 WHERE m.listing_id=l.id AND m.classification_rule_id IS NOT NULL GROUP BY origin_domain LOOP
  dim:=f.origin_domain;rules:=f.sets;
  IF cardinality(rules)<>1 THEN RAISE EXCEPTION 'ambiguous recorded classification' USING ERRCODE='55000'; END IF;
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.classification_seals z JOIN public.listing_classification_rule_sets r ON r.id=z.rule_set_id WHERE r.id=rules[1] AND r.domain=dim) THEN RAISE EXCEPTION 'recorded sealed typed rule required' USING ERRCODE='55000'; END IF;
  domain_group:=CASE WHEN dim IN ('property_area','construction_area') THEN 'measurements' ELSE 'facts' END;
  v:=input->domain_group->dim;
  IF v IS NULL OR (domain_group='facts' AND v->>'kind' IS DISTINCT FROM 'exact') THEN RAISE EXCEPTION 'recorded rule without exact evidence' USING ERRCODE='55000'; END IF;
  IF domain_group='facts' THEN v:=v||'{"source":"owner"}'::jsonb; END IF;
  classified:=classified||jsonb_build_object(domain_group,coalesce(classified->domain_group,'{}')||jsonb_build_object(dim,v||jsonb_build_object('rule_set',rules[1]::text)));
 END LOOP;
 -- Private request avoids colliding with ordinary customer creation requests.
 result:=twuanis_canonical_private.s4_create_core(actor,creation_request,input,NULL);
 IF classified<>'{}'::jsonb THEN
  PERFORM twuanis_canonical_private.s3_command((result->>'listing_id')::uuid,1,'owner',actor::text,gen_random_uuid(),classified,NULL);
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements_text(paths) LOOP
  i:=i+1;
  media:=media||jsonb_build_array(jsonb_build_object('source',item,'destination',actor::text||'/'||(result->>'listing_id')||'/duplicate-'||gen_random_uuid()::text||'.jpg'));
 END LOOP;
 INSERT INTO twuanis_canonical_private.duplicate_commands(owner_id,request_id,source_id,listing_id,creation_receipt,media)
 VALUES(actor,p_request,p_source,(result->>'listing_id')::uuid,(result->>'receipt_id')::uuid,media);
 RETURN jsonb_build_object('listing_id',result->>'listing_id','media',media,'completed',false);
END $$;

-- Server invokes only after confirming each independent destination object exists.
CREATE FUNCTION public.attach_customer_duplicate_media(p_listing uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE cmd twuanis_canonical_private.duplicate_commands%ROWTYPE; l public.listings%ROWTYPE; paths jsonb;
BEGIN
 SELECT * INTO l FROM public.listings WHERE id=p_listing FOR UPDATE;
 SELECT * INTO cmd FROM twuanis_canonical_private.duplicate_commands WHERE listing_id=p_listing FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'duplicate manifest required' USING ERRCODE='55000'; END IF;
 IF cmd.completed THEN RETURN jsonb_build_object('listing_id',p_listing::text,'completed',true); END IF;
 IF l.owner_id IS DISTINCT FROM cmd.owner_id OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'unchanged owned canonical draft required' USING ERRCODE='55000'; END IF;
 SELECT coalesce(jsonb_agg(value->>'destination' ORDER BY ordinal),'[]') INTO paths FROM jsonb_array_elements(cmd.media) WITH ORDINALITY m(value,ordinal);
 IF l.images IS NOT NULL AND btrim(l.images::text) NOT IN ('','[]','null') AND l.images::text IS DISTINCT FROM paths::text THEN RAISE EXCEPTION 'draft media changed; no overwrite' USING ERRCODE='40001'; END IF;
 UPDATE public.listings SET images=paths::text WHERE id=p_listing;
 UPDATE twuanis_canonical_private.duplicate_commands SET completed=true WHERE listing_id=p_listing;
 RETURN jsonb_build_object('listing_id',p_listing::text,'completed',true);
END $$;
ALTER FUNCTION public.prepare_customer_duplicate(uuid,uuid) OWNER TO postgres;
ALTER FUNCTION public.attach_customer_duplicate_media(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.prepare_customer_duplicate(uuid,uuid),public.attach_customer_duplicate_media(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.prepare_customer_duplicate(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_customer_duplicate_media(uuid) TO service_role;
-- Pending duplicate media must not be published while completion is unresolved.
CREATE FUNCTION twuanis_canonical_private.guard_duplicate_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF NEW.listing_status='active' AND OLD.listing_status IS DISTINCT FROM 'active' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.duplicate_commands WHERE listing_id=NEW.id AND NOT completed) THEN
  RAISE EXCEPTION 'complete duplicate media before publication' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_duplicate_publication() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER s7_duplicate_publication_guard BEFORE UPDATE OF listing_status ON public.listings FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_duplicate_publication();
COMMIT;
