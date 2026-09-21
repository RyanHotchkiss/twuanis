-- S7: bounded, immutable input retention. This table conveys no listing authority.
BEGIN;
CREATE TABLE twuanis_canonical_private.csv_source_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_name text NOT NULL CHECK(length(source_name) BETWEEN 1 AND 128 AND btrim(source_name)<>''),
 source_listing_id text NOT NULL CHECK(length(source_listing_id) BETWEEN 1 AND 256 AND btrim(source_listing_id)<>''),
 source_observation_id text NOT NULL CHECK(length(source_observation_id) BETWEEN 1 AND 256 AND btrim(source_observation_id)<>''),
 source_observed_at timestamptz NOT NULL CHECK(isfinite(source_observed_at)),
 raw_input jsonb NOT NULL CHECK(jsonb_typeof(raw_input)='object' AND octet_length(raw_input::text)<=262144),
 unresolved_review jsonb NOT NULL CHECK(jsonb_typeof(unresolved_review)='object' AND octet_length(unresolved_review::text)<=65536 AND unresolved_review->>'status'='unresolved' AND unresolved_review->'canonical_authority'='false'::jsonb),
 UNIQUE(source_name,source_listing_id,source_observation_id)
);
ALTER TABLE twuanis_canonical_private.csv_source_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.csv_source_evidence FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.reject_csv_evidence_change() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'CSV source evidence is immutable' USING ERRCODE='55000';END $$;
CREATE TRIGGER immutable_csv_evidence BEFORE UPDATE OR DELETE ON twuanis_canonical_private.csv_source_evidence FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.reject_csv_evidence_change();
CREATE TRIGGER immutable_csv_evidence_truncate BEFORE TRUNCATE ON twuanis_canonical_private.csv_source_evidence FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.reject_csv_evidence_change();
CREATE FUNCTION public.retain_csv_source_evidence(p_raw jsonb,p_review jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE old twuanis_canonical_private.csv_source_evidence%ROWTYPE;observed timestamptz;result uuid;
BEGIN
 IF p_raw IS NULL OR jsonb_typeof(p_raw)<>'object' OR octet_length(p_raw::text)>262144 OR p_review IS NULL OR jsonb_typeof(p_review)<>'object' OR octet_length(p_review::text)>65536 THEN RAISE EXCEPTION 'bounded observation objects required' USING ERRCODE='22023';END IF;
 IF jsonb_typeof(p_raw->'source_name') IS DISTINCT FROM 'string' OR jsonb_typeof(p_raw->'source_listing_id') IS DISTINCT FROM 'string' OR jsonb_typeof(p_raw->'observation_id') IS DISTINCT FROM 'string' OR jsonb_typeof(p_raw->'observed_at') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'genuine source observation metadata required' USING ERRCODE='22023';END IF;
 IF p_raw->>'observed_at' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.]\d+)?(Z|[+-]\d{2}:\d{2})$' THEN RAISE EXCEPTION 'explicit source timestamp with timezone required' USING ERRCODE='22023';END IF;
 observed:=(p_raw->>'observed_at')::timestamptz;
 IF p_review->>'status' IS DISTINCT FROM 'unresolved' OR p_review->'canonical_authority' IS DISTINCT FROM 'false'::jsonb OR jsonb_typeof(p_review->'values') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'noncanonical review required' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(3118,hashtext(jsonb_build_array(p_raw->>'source_name',p_raw->>'source_listing_id',p_raw->>'observation_id')::text));
 SELECT * INTO old FROM twuanis_canonical_private.csv_source_evidence WHERE source_name=p_raw->>'source_name' AND source_listing_id=p_raw->>'source_listing_id' AND source_observation_id=p_raw->>'observation_id';
 IF FOUND THEN
  IF old.source_observed_at IS DISTINCT FROM observed OR old.raw_input IS DISTINCT FROM p_raw OR old.unresolved_review IS DISTINCT FROM p_review THEN RAISE EXCEPTION 'immutable source observation evidence conflict' USING ERRCODE='22023';END IF;
  RETURN old.id;
 END IF;
 INSERT INTO twuanis_canonical_private.csv_source_evidence(source_name,source_listing_id,source_observation_id,source_observed_at,raw_input,unresolved_review)
 VALUES(p_raw->>'source_name',p_raw->>'source_listing_id',p_raw->>'observation_id',observed,p_raw,p_review) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.retain_csv_source_evidence(jsonb,jsonb),twuanis_canonical_private.reject_csv_evidence_change() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.retain_csv_source_evidence(jsonb,jsonb) TO service_role;
COMMIT;
