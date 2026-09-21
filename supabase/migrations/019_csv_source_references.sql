-- Operational completion flag on the existing CSV eligibility record, not evidence mutation.
BEGIN;
ALTER TABLE twuanis_canonical_private.csv_initial_publication ADD COLUMN source_references_evidence uuid REFERENCES twuanis_canonical_private.csv_source_evidence(id);
CREATE FUNCTION public.complete_csv_source_references(p_receipt uuid,p_evidence uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c twuanis_canonical_private.csv_initial_publication%ROWTYPE;e twuanis_canonical_private.csv_source_evidence%ROWTYPE;r public.canonical_operation_receipts%ROWTYPE;l public.listings%ROWTYPE;source_paths text[];url text;item text;
BEGIN
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 SELECT * INTO c FROM twuanis_canonical_private.csv_initial_publication WHERE creation_receipt=p_receipt FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CSV creation receipt required' USING ERRCODE='42501';END IF;
 SELECT * INTO e FROM twuanis_canonical_private.csv_source_evidence WHERE id=p_evidence;
 IF NOT FOUND THEN RAISE EXCEPTION 'retained observation required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.canonical_operation_receipts WHERE id=p_receipt;
 IF r.request_id IS DISTINCT FROM p_evidence OR r.listing_id IS DISTINCT FROM c.listing_id OR r.operation_type IS DISTINCT FROM 'create_trusted' THEN RAISE EXCEPTION 'matching retained CSV creation required' USING ERRCODE='42501';END IF;
 IF c.source_references_evidence IS NOT NULL THEN
  IF c.source_references_evidence<>p_evidence THEN RAISE EXCEPTION 'reference completion conflict' USING ERRCODE='22023';END IF;
  RETURN;
 END IF;
 SELECT * INTO l FROM public.listings WHERE id=c.listing_id FOR UPDATE;
 IF l.canonical_domain_version IS DISTINCT FROM 1 OR l.owner_id IS NOT NULL OR l.listing_status IS DISTINCT FROM 'draft' OR l.canonical_revision IS DISTINCT FROM r.result_revision OR l.source_name IS DISTINCT FROM e.source_name OR l.source_listing_id IS DISTINCT FROM e.source_listing_id THEN RAISE EXCEPTION 'unchanged ownerless canonical CSV draft required' USING ERRCODE='55000';END IF;
 IF e.raw_input ? 'images' AND jsonb_typeof(e.raw_input->'images') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'external source references must be text' USING ERRCODE='22023';END IF;
 source_paths:=array_remove(string_to_array(coalesce(e.raw_input->>'images',''),'|'),'');
 IF cardinality(source_paths)>100 THEN RAISE EXCEPTION 'source reference bound' USING ERRCODE='54000';END IF;
 FOREACH item IN ARRAY source_paths LOOP
  IF length(item)>4096 OR item !~ '^https?://[^[:space:]]+$' THEN RAISE EXCEPTION 'external URL reference required' USING ERRCODE='22023';END IF;
 END LOOP;
 url:=e.raw_input->>'source_url';
 IF url IS NOT NULL AND (length(url)>4096 OR url !~ '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'source URL reference invalid' USING ERRCODE='22023';END IF;
 UPDATE public.listings SET images=array_to_string(source_paths,'|'),source_url=url WHERE id=l.id;
 UPDATE twuanis_canonical_private.csv_initial_publication SET source_references_evidence=p_evidence WHERE creation_receipt=p_receipt;
END $$;
CREATE FUNCTION twuanis_canonical_private.guard_csv_source_reference_completion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF NEW.listing_status='active' AND OLD.listing_status IS DISTINCT FROM 'active' AND EXISTS(
  SELECT 1 FROM twuanis_canonical_private.csv_initial_publication c JOIN public.canonical_operation_receipts r ON r.id=c.creation_receipt
  JOIN twuanis_canonical_private.csv_source_evidence e ON e.id=r.request_id WHERE c.listing_id=NEW.id AND c.source_references_evidence IS NULL
 ) THEN RAISE EXCEPTION 'complete retained CSV references first' USING ERRCODE='55000';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s7_csv_references_guard BEFORE UPDATE OF listing_status ON public.listings FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_csv_source_reference_completion();
REVOKE ALL ON FUNCTION public.complete_csv_source_references(uuid,uuid),twuanis_canonical_private.guard_csv_source_reference_completion() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.complete_csv_source_references(uuid,uuid) TO service_role;
COMMIT;
