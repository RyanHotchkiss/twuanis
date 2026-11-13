BEGIN;
CREATE OR REPLACE FUNCTION public.complete_canonical_source_run_scoped(
  p_source text, p_transaction text, p_run uuid, p_started_at timestamptz,
  p_completion jsonb, p_observed_ids jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE prior twuanis_canonical_private.source_run_completions%ROWTYPE; payload jsonb; result jsonb; ids jsonb; st record; l public.listings%ROWTYPE; counted integer:=0; archived integer:=0;
BEGIN
 IF p_source IS NULL OR length(btrim(p_source)) NOT BETWEEN 1 AND 128 OR p_transaction NOT IN ('sale','rent') OR p_run IS NULL OR p_started_at IS NULL OR NOT isfinite(p_started_at) OR p_started_at>clock_timestamp() THEN RAISE EXCEPTION 'explicit scoped source run identity/time required'; END IF;
 IF jsonb_typeof(p_observed_ids) IS DISTINCT FROM 'array' OR octet_length(p_observed_ids::text)>16777216 OR jsonb_array_length(p_observed_ids)>100000 THEN RAISE EXCEPTION 'bounded observed identity set required'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_observed_ids)x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 256) THEN RAISE EXCEPTION 'explicit source listing IDs required'; END IF;
 SELECT coalesce(jsonb_agg(v ORDER BY v),'[]') INTO ids FROM (SELECT DISTINCT value v FROM jsonb_array_elements_text(p_observed_ids))q;
 payload:=jsonb_build_object('transaction',p_transaction,'started_at',p_started_at,'completion',coalesce(p_completion,'null'::jsonb),'observed_ids',ids);
 PERFORM twuanis_canonical_private.lock_capacity_policy(false); PERFORM pg_advisory_xact_lock(3124,hashtext(p_source||':'||p_transaction));
 SELECT * INTO prior FROM twuanis_canonical_private.source_run_completions WHERE source_name=p_source||':'||p_transaction AND run_id=p_run;
 IF FOUND THEN IF prior.payload<>payload THEN RAISE EXCEPTION 'source run replay conflict'; END IF; RETURN prior.result||'{"replayed":true}'::jsonb; END IF;
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.source_run_completions WHERE source_name=p_source||':'||p_transaction AND (payload->>'started_at')::timestamptz>=p_started_at) THEN RAISE EXCEPTION 'out-of-order source completion'; END IF;
 FOR st IN WITH seen AS MATERIALIZED (SELECT value AS source_id FROM jsonb_array_elements_text(ids))
   SELECT s.*,seen.source_id IS NOT NULL AS was_seen FROM twuanis_canonical_private.source_ingestion_state s
   JOIN public.listings pl ON pl.id=s.listing_id LEFT JOIN seen ON seen.source_id=s.source_listing_id
   WHERE s.source_name=p_source AND pl.transaction_type=p_transaction AND pl.listing_origin='imported' ORDER BY s.listing_id FOR UPDATE OF s LOOP
   IF st.was_seen THEN UPDATE twuanis_canonical_private.source_ingestion_state SET misses=0 WHERE listing_id=st.listing_id;
   ELSIF st.positive_at<p_started_at THEN
     SELECT * INTO l FROM public.listings WHERE id=st.listing_id FOR UPDATE;
     IF l.owner_id IS NOT NULL OR l.source_name IS DISTINCT FROM p_source OR l.transaction_type IS DISTINCT FROM p_transaction OR l.listing_origin IS DISTINCT FROM 'imported' THEN RAISE EXCEPTION 'tracked source ownership changed'; END IF;
     IF l.listing_status NOT IN ('draft','active','expired') THEN CONTINUE; END IF;
     counted:=counted+1;
     UPDATE twuanis_canonical_private.source_ingestion_state SET misses=misses+1 WHERE listing_id=l.id;
     PERFORM twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',gen_random_uuid(),'{"lifecycle":{"event":"archive","reason":"not captured during source reconciliation"}}',NULL);
     UPDATE twuanis_canonical_private.source_ingestion_state SET archive_revision=(SELECT canonical_revision FROM public.listings WHERE id=l.id) WHERE listing_id=l.id;
     archived:=archived+1;
   END IF;
 END LOOP;
 result:=jsonb_build_object('absence_applied',true,'completion',coalesce(p_completion,'null'::jsonb),'counted',counted,'archived',archived,'remaining_published', (SELECT count(*) FROM public.listings WHERE source_name=p_source AND transaction_type=p_transaction AND listing_origin='imported' AND listing_status='active'));
 INSERT INTO twuanis_canonical_private.source_run_completions(source_name,run_id,payload,result) VALUES(p_source||':'||p_transaction,p_run,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.complete_canonical_source_run_scoped(text,text,uuid,timestamptz,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.complete_canonical_source_run_scoped(text,text,uuid,timestamptz,jsonb,jsonb) TO service_role;
COMMIT;
