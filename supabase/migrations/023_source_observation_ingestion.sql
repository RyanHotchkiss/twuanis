-- S10 ingestion authority only. No acquisition/completeness producer or deployment.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE twuanis_canonical_private.source_ingestion_state (
 source_name text NOT NULL, source_listing_id text NOT NULL,
 listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id),
 presentation_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 positive_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 misses integer NOT NULL DEFAULT 0 CHECK(misses BETWEEN 0 AND 2),
 archive_revision bigint,
 PRIMARY KEY(source_name,source_listing_id)
);
CREATE TABLE twuanis_canonical_private.source_ingestion_results (
 evidence_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.csv_source_evidence(id),
 result jsonb NOT NULL
);
CREATE TABLE twuanis_canonical_private.source_run_completions (
 source_name text NOT NULL, run_id uuid NOT NULL,
 payload jsonb NOT NULL, result jsonb NOT NULL,
 completed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(source_name,run_id)
);
ALTER TABLE twuanis_canonical_private.source_ingestion_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.source_ingestion_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.source_run_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.source_ingestion_state,twuanis_canonical_private.source_ingestion_results,twuanis_canonical_private.source_run_completions FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.ingest_canonical_source_observation(p_evidence uuid,p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE e twuanis_canonical_private.csv_source_evidence%ROWTYPE; l public.listings%ROWTYPE;
 st twuanis_canonical_private.source_ingestion_state%ROWTYPE; cached jsonb; src jsonb; result jsonb; d jsonb;
 created jsonb; item record; sets uuid[]; refreshed boolean:=false; source_images text[]; url text; geo jsonb;
BEGIN
 SELECT * INTO e FROM twuanis_canonical_private.csv_source_evidence WHERE id=p_evidence;
 IF NOT FOUND THEN RAISE EXCEPTION 'retained source evidence required'; END IF;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 PERFORM pg_advisory_xact_lock(3123,hashtext(e.source_name));
 SELECT r.result INTO cached FROM twuanis_canonical_private.source_ingestion_results r WHERE evidence_id=p_evidence;
 IF FOUND THEN RETURN cached||'{"replayed":true}'::jsonb; END IF;
 -- Indexed exact identity. No population acquisition or similarity comparison.
 SELECT * INTO l FROM public.listings WHERE source_name=e.source_name AND source_listing_id=e.source_listing_id FOR UPDATE;
 src:=jsonb_build_object('source_name',e.source_name,'source_listing_id',e.source_listing_id,'observation_id',e.source_observation_id,'observed_at',e.source_observed_at,'source_type','realtor');
 IF NOT FOUND THEN
  created:=public.create_csv_canonical_listing(p_evidence,p_input,src);
  PERFORM public.complete_csv_source_references((created->>'csv_creation_receipt')::uuid,p_evidence);
  PERFORM public.initially_publish_csv_listing((created->>'csv_creation_receipt')::uuid);
  INSERT INTO twuanis_canonical_private.source_ingestion_state(source_name,source_listing_id,listing_id)
  VALUES(e.source_name,e.source_listing_id,(created->>'listing_id')::uuid);
  result:=jsonb_build_object('listing_id',created->>'listing_id','outcome','accepted','created',true);
 ELSE
  IF l.canonical_domain_version IS DISTINCT FROM 1 OR l.owner_id IS NOT NULL OR l.publisher_account_id IS NOT NULL OR l.listing_origin IS DISTINCT FROM 'imported' THEN RAISE EXCEPTION 'ownerless canonical source appearance required'; END IF;
  SELECT * INTO st FROM twuanis_canonical_private.source_ingestion_state WHERE listing_id=l.id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'source ingestion state absent; no legacy adoption'; END IF;
  src:=(src-'source_type')||jsonb_build_object('transaction',p_input->'transaction','geography',p_input->'geography');
  d:=jsonb_build_object('geography',p_input->'geography');
  IF p_input ? 'money' THEN d:=d||jsonb_build_object('money',p_input->'money'); END IF;
  IF p_input ? 'measurements' THEN d:=d||jsonb_build_object('measurements',p_input->'measurements'); END IF;
  d:=twuanis_canonical_private.s4_domains(d,'source');
  -- Preserve recorded sealed derivation authority; never select a default rule.
  FOR item IN SELECT key FROM jsonb_each(coalesce(d->'measurements','{}')) LOOP
   SELECT array_agg(DISTINCT r.rule_set_id) INTO sets FROM public.listing_membership_origins o
   JOIN public.listing_classification_rules r ON r.id=o.classification_rule_id WHERE o.listing_id=l.id AND o.origin_domain=item.key;
   IF cardinality(sets)>1 THEN RAISE EXCEPTION 'ambiguous recorded measurement rule'; END IF;
   IF cardinality(sets)=1 THEN d:=jsonb_set(d,ARRAY['measurements',item.key,'rule_set'],to_jsonb(sets[1]::text)); END IF;
  END LOOP;
  SELECT jsonb_object_agg(t.term_type,t.official_code) INTO geo FROM public.listing_membership_origins o JOIN public.ontology_terms t ON t.id=o.ontology_term_id WHERE o.listing_id=l.id AND o.origin_domain='geography';
  -- Conflict/stale machinery must run before restoration. It returns before state edits.
  IF l.transaction_type IS DISTINCT FROM src->>'transaction' OR geo->>'province' IS DISTINCT FROM src->'geography'->>'province' OR geo->>'canton' IS DISTINCT FROM src->'geography'->>'canton' OR e.source_observed_at<l.last_seen THEN
   result:=twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',p_evidence,d,src)||jsonb_build_object('listing_id',l.id::text);
  ELSE
   IF st.archive_revision IS NOT NULL THEN
    IF l.listing_status<>'archived' OR l.canonical_revision<>st.archive_revision THEN RAISE EXCEPTION 'source archive state changed'; END IF;
    PERFORM twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',gen_random_uuid(),'{"lifecycle":{"event":"restore","reason":"observed again at source"}}',NULL);
    SELECT * INTO l FROM public.listings WHERE id=l.id;
   END IF;
   result:=twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',p_evidence,d,src)||jsonb_build_object('listing_id',l.id::text);
   IF result->>'outcome'='accepted' OR result->>'outcome'='succeeded' THEN
    url:=e.raw_input->>'source_url';
    IF length(url) BETWEEN 1 AND 4096 AND url ~ '^https?://[^[:space:]]+$' THEN UPDATE public.listings SET source_url=url WHERE id=l.id; END IF;
    IF clock_timestamp()>=st.presentation_at+interval '6 months' THEN
     FOR item IN SELECT key,value FROM jsonb_each_text(e.raw_input) WHERE key IN ('title','description') LOOP
      IF btrim(item.value)<>'' THEN
       IF item.key='title' THEN UPDATE public.listings SET title=item.value WHERE id=l.id;
       ELSE UPDATE public.listings SET description=item.value WHERE id=l.id; END IF;
       refreshed:=true;
      END IF;
     END LOOP;
     source_images:=array_remove(string_to_array(coalesce(e.raw_input->>'images',''),'|'),'');
     IF cardinality(source_images) BETWEEN 1 AND 100 AND NOT EXISTS(SELECT 1 FROM unnest(source_images)x WHERE length(x)>4096 OR x !~ '^https?://[^[:space:]]+$') THEN
      UPDATE public.listings SET images=array_to_string(source_images,'|') WHERE id=l.id;refreshed:=true;
     END IF;
    END IF;
    IF st.archive_revision IS NOT NULL THEN
     SELECT * INTO l FROM public.listings WHERE id=l.id;
     PERFORM twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',gen_random_uuid(),'{"lifecycle":{"event":"publish","duration_seconds":"7776000","reason":"observed again at source"}}',NULL);
    END IF;
    UPDATE twuanis_canonical_private.source_ingestion_state SET misses=0,archive_revision=NULL,positive_at=clock_timestamp(),presentation_at=CASE WHEN refreshed THEN clock_timestamp() ELSE presentation_at END WHERE listing_id=l.id;
   END IF;
  END IF;
 END IF;
 INSERT INTO twuanis_canonical_private.source_ingestion_results VALUES(p_evidence,result);
 RETURN result;
END $$;

-- Only service_role can supply this assertion. No browser endpoint accepts it.
-- p_started_at protects positives received after the asserted run began.
CREATE FUNCTION public.complete_canonical_source_run(p_source text,p_run uuid,p_started_at timestamptz,p_completion jsonb,p_observed_ids jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE prior twuanis_canonical_private.source_run_completions%ROWTYPE; payload jsonb; result jsonb; ids jsonb;
 st record; l public.listings%ROWTYPE; counted integer:=0; archived integer:=0;
BEGIN
 IF p_completion IS DISTINCT FROM 'true'::jsonb THEN RETURN '{"absence_applied":false,"reason":"completion unverified"}'::jsonb; END IF;
 IF p_source IS NULL OR length(btrim(p_source)) NOT BETWEEN 1 AND 128 OR p_run IS NULL OR p_started_at IS NULL OR NOT isfinite(p_started_at) OR p_started_at>clock_timestamp() THEN RAISE EXCEPTION 'explicit source run identity/time required'; END IF;
 IF jsonb_typeof(p_observed_ids) IS DISTINCT FROM 'array' OR octet_length(p_observed_ids::text)>16777216 OR jsonb_array_length(p_observed_ids)>100000 THEN RAISE EXCEPTION 'bounded observed identity set required'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_observed_ids)x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 256) THEN RAISE EXCEPTION 'explicit source listing IDs required'; END IF;
 SELECT coalesce(jsonb_agg(v ORDER BY v),'[]') INTO ids FROM (SELECT DISTINCT value v FROM jsonb_array_elements_text(p_observed_ids))q;
 payload:=jsonb_build_object('started_at',p_started_at,'observed_ids',ids);
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 PERFORM pg_advisory_xact_lock(3123,hashtext(p_source));
 SELECT * INTO prior FROM twuanis_canonical_private.source_run_completions WHERE source_name=p_source AND run_id=p_run;
 IF FOUND THEN
  IF prior.payload<>payload THEN RAISE EXCEPTION 'source run replay conflict'; END IF;
  RETURN prior.result||'{"replayed":true}'::jsonb;
 END IF;
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.source_run_completions WHERE source_name=p_source AND (source_run_completions.payload->>'started_at')::timestamptz>=p_started_at) THEN RAISE EXCEPTION 'out-of-order source completion'; END IF;
 -- Only registered source appearances; no unrelated customer population retrieved.
 FOR st IN WITH seen AS MATERIALIZED (SELECT value AS source_id FROM jsonb_array_elements_text(ids))
  SELECT s.*,(seen.source_id IS NOT NULL) AS was_seen FROM twuanis_canonical_private.source_ingestion_state s
  LEFT JOIN seen ON seen.source_id=s.source_listing_id WHERE s.source_name=p_source ORDER BY s.listing_id FOR UPDATE OF s LOOP
  IF st.was_seen THEN
   UPDATE twuanis_canonical_private.source_ingestion_state SET misses=0 WHERE listing_id=st.listing_id;
  ELSIF st.positive_at<p_started_at AND st.misses<2 THEN
   SELECT * INTO l FROM public.listings WHERE id=st.listing_id FOR UPDATE;
   IF l.owner_id IS NOT NULL OR l.source_name IS DISTINCT FROM p_source THEN RAISE EXCEPTION 'tracked source ownership changed'; END IF;
   IF l.listing_status NOT IN ('draft','active','expired') THEN CONTINUE; END IF;
   counted:=counted+1;
   UPDATE twuanis_canonical_private.source_ingestion_state SET misses=misses+1 WHERE listing_id=l.id;
   IF st.misses=1 THEN
    PERFORM twuanis_canonical_private.s3_command(l.id,l.canonical_revision,'trusted','service_role',gen_random_uuid(),'{"lifecycle":{"event":"archive","reason":"no longer observed at source"}}',NULL);
    UPDATE twuanis_canonical_private.source_ingestion_state SET archive_revision=(SELECT canonical_revision FROM public.listings WHERE id=l.id) WHERE listing_id=l.id;
    archived:=archived+1;
   END IF;
  END IF;
 END LOOP;
 result:=jsonb_build_object('absence_applied',true,'counted',counted,'archived',archived);
 INSERT INTO twuanis_canonical_private.source_run_completions(source_name,run_id,payload,result) VALUES(p_source,p_run,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.ingest_canonical_source_observation(uuid,jsonb),public.complete_canonical_source_run(text,uuid,timestamptz,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.ingest_canonical_source_observation(uuid,jsonb),public.complete_canonical_source_run(text,uuid,timestamptz,jsonb,jsonb) TO service_role;
COMMIT;
