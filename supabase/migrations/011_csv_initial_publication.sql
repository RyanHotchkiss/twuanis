-- S7: one CSV-specific initial-publication fact, not general publication authority.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE twuanis_canonical_private.csv_initial_publication (
 creation_receipt uuid PRIMARY KEY REFERENCES public.canonical_operation_receipts(id),
 listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id),
 publication_request uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 publication_expected bigint CHECK (publication_expected >= 1),
 established_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE twuanis_canonical_private.csv_initial_publication ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.csv_initial_publication FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.create_csv_canonical_listing(p_request uuid,p_input jsonb,p_source jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE existing_id uuid; result jsonb; actual_receipt uuid;
BEGIN
 IF p_source IS NULL THEN RAISE EXCEPTION 'genuine CSV source observation required' USING ERRCODE='22023'; END IF;
 -- Same capacity/source order as the closed creation boundary. Its locks reenter.
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 PERFORM pg_advisory_xact_lock(3103,hashtext(jsonb_build_array(p_source->>'source_name',p_source->>'source_listing_id')::text));
 SELECT id INTO existing_id FROM public.listings WHERE source_name=p_source->>'source_name' AND source_listing_id=p_source->>'source_listing_id';
 IF existing_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM twuanis_canonical_private.csv_initial_publication WHERE listing_id=existing_id
 ) THEN RAISE EXCEPTION 'existing non-CSV creation cannot acquire CSV eligibility' USING ERRCODE='42501'; END IF;
 result:=public.create_trusted_canonical_listing(p_request,p_input,p_source);
 SELECT r.id INTO STRICT actual_receipt FROM public.canonical_operation_receipts r
 JOIN public.listing_lifecycle_events e ON e.operation_id=r.id AND e.listing_id=r.listing_id
 WHERE r.listing_id=(result->>'listing_id')::uuid AND r.operation_type='create_trusted'
 AND r.authority_kind='trusted' AND r.authority_identity='service_role' AND e.event_type='create';
 -- A replay of unrelated generic creation cannot enroll it through request ID.
 IF existing_id IS NULL AND (result->>'replayed')::boolean THEN
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.csv_initial_publication WHERE creation_receipt=actual_receipt)
  THEN RAISE EXCEPTION 'CSV creation eligibility absent on replay' USING ERRCODE='42501'; END IF;
 END IF;
 INSERT INTO twuanis_canonical_private.csv_initial_publication(creation_receipt,listing_id)
 VALUES(actual_receipt,(result->>'listing_id')::uuid) ON CONFLICT(creation_receipt) DO NOTHING;
 RETURN result||jsonb_build_object('csv_creation_receipt',actual_receipt::text);
END $$;

CREATE FUNCTION public.initially_publish_csv_listing(p_creation_receipt uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE eligibility twuanis_canonical_private.csv_initial_publication%ROWTYPE; l public.listings%ROWTYPE; r public.canonical_operation_receipts%ROWTYPE; result jsonb; completed boolean;
BEGIN
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 SELECT * INTO eligibility FROM twuanis_canonical_private.csv_initial_publication WHERE creation_receipt=p_creation_receipt FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CSV creation eligibility required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.canonical_operation_receipts WHERE id=eligibility.creation_receipt;
 IF NOT FOUND OR r.listing_id IS DISTINCT FROM eligibility.listing_id OR r.operation_type<>'create_trusted'
 OR r.authority_kind<>'trusted' OR r.authority_identity<>'service_role' OR r.result_revision<>1
 OR NOT EXISTS(SELECT 1 FROM public.listing_lifecycle_events WHERE operation_id=r.id AND listing_id=r.listing_id AND event_type='create' AND resulting_state='draft')
 THEN RAISE EXCEPTION 'invalid CSV creation receipt' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT l FROM public.listings WHERE id=eligibility.listing_id;
 IF l.owner_id IS NOT NULL OR l.publisher_account_id IS NOT NULL OR l.canonical_domain_version IS DISTINCT FROM 1
 OR l.listing_origin IS DISTINCT FROM 'imported' OR l.source_name IS NULL OR l.source_listing_id IS NULL
 THEN RAISE EXCEPTION 'ownerless canonical CSV import required' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE authority_kind='trusted' AND authority_identity='service_role'
 AND operation_type='domain_mutation' AND request_id=eligibility.publication_request AND listing_id=l.id AND outcome='succeeded') INTO completed;
 IF NOT completed AND (l.listing_status IS DISTINCT FROM 'draft' OR EXISTS(
  SELECT 1 FROM public.listing_lifecycle_events WHERE listing_id=l.id AND event_type='publish'))
 THEN RAISE EXCEPTION 'unpublished canonical draft required' USING ERRCODE='55000'; END IF;
 IF NOT completed THEN
  UPDATE twuanis_canonical_private.csv_initial_publication SET publication_expected=l.canonical_revision
  WHERE creation_receipt=p_creation_receipt;
  eligibility.publication_expected:=l.canonical_revision;
 END IF;
 -- Persisted expected revision and fixed operation identity survive successful replay.
 -- A failed command rolls the expectation back with its transaction.
 result:=twuanis_canonical_private.s3_command(l.id,eligibility.publication_expected,'trusted','service_role',eligibility.publication_request,
 '{"lifecycle":{"event":"publish","duration_seconds":"7776000"}}'::jsonb,NULL);
 RETURN result||jsonb_build_object('listing_id',l.id::text);
END $$;
ALTER FUNCTION public.create_csv_canonical_listing(uuid,jsonb,jsonb) OWNER TO postgres;
ALTER FUNCTION public.initially_publish_csv_listing(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_csv_canonical_listing(uuid,jsonb,jsonb),public.initially_publish_csv_listing(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_csv_canonical_listing(uuid,jsonb,jsonb),public.initially_publish_csv_listing(uuid) TO service_role;
COMMIT;
