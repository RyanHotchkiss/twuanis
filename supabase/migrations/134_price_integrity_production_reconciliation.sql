-- Reconcile the exported installed price-integrity architecture.
-- Schema only: no initialization, backfill, publication, or changes to retained evidence.
-- Existing functions, constraints, indexes, and triggers are never replaced: drift aborts.
BEGIN;
SET LOCAL search_path = public, pg_catalog;
DO $$ BEGIN IF to_regprocedure('twuanis_canonical_private.finite_numeric(numeric)') IS NULL THEN EXECUTE $finite_create$CREATE FUNCTION twuanis_canonical_private.finite_numeric(v numeric) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'pg_catalog', 'pg_temp' AS $finite_body$ SELECT v IS NULL OR v NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric) $finite_body$
$finite_create$; REVOKE ALL ON FUNCTION twuanis_canonical_private.finite_numeric(numeric) FROM PUBLIC, anon, authenticated, service_role; END IF; IF NOT twuanis_canonical_private.finite_numeric(NULL) OR NOT twuanis_canonical_private.finite_numeric(1) OR twuanis_canonical_private.finite_numeric('NaN'::numeric) OR twuanis_canonical_private.finite_numeric('Infinity'::numeric) OR twuanis_canonical_private.finite_numeric('-Infinity'::numeric) THEN RAISE EXCEPTION 'finite_numeric behavior differs from production'; END IF; END $$;
CREATE TABLE IF NOT EXISTS twuanis_canonical_private.listing_price_integrity_evidence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  listing_id uuid NOT NULL,
  canonical_revision bigint NOT NULL,
  canonical_domain_version smallint NOT NULL,
  evaluator_version integer NOT NULL,
  transaction_type text NOT NULL,
  asking_amount numeric,
  currency text NOT NULL,
  assertion_kind text,
  source_name text,
  source_listing_id text,
  observation_id uuid,
  source_observation_id text,
  source_observed_at timestamp with time zone,
  observation_result_revision bigint,
  observation_payload_fingerprint text,
  retained_evidence_id uuid,
  retained_evidence_fingerprint text,
  evidence_format text NOT NULL,
  integrity_status text NOT NULL,
  publication_allowed boolean NOT NULL,
  analytical_eligible boolean NOT NULL,
  mandatory_review_required boolean NOT NULL,
  supplementary_review_required boolean NOT NULL,
  decision jsonb NOT NULL,
  evaluated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = 'gen_random_uuid()') THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='canonical_revision' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='bigint' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.canonical_revision'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='canonical_domain_version' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='smallint' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.canonical_domain_version'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='evaluator_version' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='integer' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.evaluator_version'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='transaction_type' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.transaction_type'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='asking_amount' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='numeric' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.asking_amount'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='currency' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.currency'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='assertion_kind' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.assertion_kind'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='source_name' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.source_name'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='source_listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.source_listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='observation_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.observation_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='source_observation_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.source_observation_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='source_observed_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.source_observed_at'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='observation_result_revision' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='bigint' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.observation_result_revision'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='observation_payload_fingerprint' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.observation_payload_fingerprint'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='retained_evidence_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.retained_evidence_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='retained_evidence_fingerprint' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.retained_evidence_fingerprint'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='evidence_format' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.evidence_format'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='integrity_status' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.integrity_status'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='publication_allowed' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='boolean' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.publication_allowed'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='analytical_eligible' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='boolean' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.analytical_eligible'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='mandatory_review_required' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='boolean' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.mandatory_review_required'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='supplementary_review_required' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='boolean' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.supplementary_review_required'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='decision' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='jsonb' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.decision'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND a.attname='evaluated_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = 'clock_timestamp()') THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_evidence.evaluated_at'; END IF; END $$;
CREATE TABLE IF NOT EXISTS twuanis_canonical_private.price_historical_evidence_registry (
  listing_id uuid NOT NULL,
  retained_evidence_id text NOT NULL,
  source_name text NOT NULL,
  source_listing_id text NOT NULL,
  evidence_format text NOT NULL,
  registered_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
  registration_reason text NOT NULL
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='retained_evidence_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.retained_evidence_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='source_name' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.source_name'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='source_listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.source_listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='evidence_format' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.evidence_format'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='registered_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = 'clock_timestamp()') THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.registered_at'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND a.attname='registration_reason' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_historical_evidence_registry.registration_reason'; END IF; END $$;
CREATE TABLE IF NOT EXISTS twuanis_canonical_private.listing_price_integrity_current (
  listing_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  canonical_revision bigint NOT NULL,
  evaluator_version integer NOT NULL,
  integrity_status text NOT NULL,
  analytical_eligible boolean NOT NULL,
  freshness_status text NOT NULL,
  verified_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='evidence_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.evidence_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='canonical_revision' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='bigint' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.canonical_revision'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='evaluator_version' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='integer' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.evaluator_version'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='integrity_status' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.integrity_status'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='analytical_eligible' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='boolean' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.analytical_eligible'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='freshness_status' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.freshness_status'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND a.attname='verified_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = 'clock_timestamp()') THEN RAISE EXCEPTION 'Price integrity column differs: listing_price_integrity_current.verified_at'; END IF; END $$;
CREATE TABLE IF NOT EXISTS twuanis_canonical_private.price_integrity_pending (
  listing_id uuid NOT NULL,
  requested_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_attempt_at timestamp with time zone,
  last_error text
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND a.attname='listing_id' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid' AND a.attnotnull=true AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_integrity_pending.listing_id'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND a.attname='requested_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = 'clock_timestamp()') THEN RAISE EXCEPTION 'Price integrity column differs: price_integrity_pending.requested_at'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND a.attname='attempts' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='integer' AND a.attnotnull=true AND pg_get_expr(ad.adbin, ad.adrelid) = '0') THEN RAISE EXCEPTION 'Price integrity column differs: price_integrity_pending.attempts'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND a.attname='last_attempt_at' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='timestamp with time zone' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_integrity_pending.last_attempt_at'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute a LEFT JOIN pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND a.attname='last_error' AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='text' AND a.attnotnull=false AND ad.adbin IS NULL) THEN RAISE EXCEPTION 'Price integrity column differs: price_integrity_pending.last_error'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_check CHECK (NOT analytical_eligible OR publication_allowed); ELSIF actual <> 'CHECK (NOT analytical_eligible OR publication_allowed)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_check1'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_check1 CHECK (integrity_status <> 'REJECTED'::text OR NOT publication_allowed AND NOT analytical_eligible); ELSIF actual <> 'CHECK (integrity_status <> ''REJECTED''::text OR NOT publication_allowed AND NOT analytical_eligible)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_check1'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_check2'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_check2 CHECK (NOT mandatory_review_required OR NOT publication_allowed AND NOT analytical_eligible); ELSIF actual <> 'CHECK (NOT mandatory_review_required OR NOT publication_allowed AND NOT analytical_eligible)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_check2'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_decision_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_decision_check CHECK (jsonb_typeof(decision) = 'object'::text); ELSIF actual <> 'CHECK (jsonb_typeof(decision) = ''object''::text)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_decision_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_evaluator_version_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_evaluator_version_check CHECK (evaluator_version > 0); ELSIF actual <> 'CHECK (evaluator_version > 0)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_evaluator_version_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_integrity_status_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_integrity_status_check CHECK (integrity_status = ANY (ARRAY['APPROVED'::text, 'REVIEW_REQUIRED'::text, 'REJECTED'::text])); ELSIF actual <> 'CHECK (integrity_status = ANY (ARRAY[''APPROVED''::text, ''REVIEW_REQUIRED''::text, ''REJECTED''::text]))' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_integrity_status_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_pkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_pkey PRIMARY KEY (id); ELSIF actual <> 'PRIMARY KEY (id)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_pkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND conname='listing_price_integrity_evidence_transaction_type_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ADD CONSTRAINT listing_price_integrity_evidence_transaction_type_check CHECK (transaction_type = ANY (ARRAY['sale'::text, 'rent'::text])); ELSIF actual <> 'CHECK (transaction_type = ANY (ARRAY[''sale''::text, ''rent''::text]))' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_evidence_transaction_type_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND conname='price_historical_evidence_registry_evidence_format_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.price_historical_evidence_registry ADD CONSTRAINT price_historical_evidence_registry_evidence_format_check CHECK (evidence_format = ANY (ARRAY['LEGACY_STRUCTURED_PAIR'::text, 'LEGACY_NO_PRICE_OBJECT'::text])); ELSIF actual <> 'CHECK (evidence_format = ANY (ARRAY[''LEGACY_STRUCTURED_PAIR''::text, ''LEGACY_NO_PRICE_OBJECT''::text]))' THEN RAISE EXCEPTION 'Price integrity constraint differs: price_historical_evidence_registry_evidence_format_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.price_historical_evidence_registry'::regclass AND conname='price_historical_evidence_registry_pkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.price_historical_evidence_registry ADD CONSTRAINT price_historical_evidence_registry_pkey PRIMARY KEY (listing_id, retained_evidence_id); ELSIF actual <> 'PRIMARY KEY (listing_id, retained_evidence_id)' THEN RAISE EXCEPTION 'Price integrity constraint differs: price_historical_evidence_registry_pkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_check CHECK (NOT analytical_eligible OR freshness_status = 'CURRENT'::text AND (integrity_status = ANY (ARRAY['APPROVED'::text, 'REVIEW_REQUIRED'::text]))); ELSIF actual <> 'CHECK (NOT analytical_eligible OR freshness_status = ''CURRENT''::text AND (integrity_status = ANY (ARRAY[''APPROVED''::text, ''REVIEW_REQUIRED''::text])))' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_evaluator_version_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_evaluator_version_check CHECK (evaluator_version > 0); ELSIF actual <> 'CHECK (evaluator_version > 0)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_evaluator_version_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_evidence_id_fkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES twuanis_canonical_private.listing_price_integrity_evidence(id); ELSIF actual <> 'FOREIGN KEY (evidence_id) REFERENCES twuanis_canonical_private.listing_price_integrity_evidence(id)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_evidence_id_fkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_freshness_status_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_freshness_status_check CHECK (freshness_status = ANY (ARRAY['CURRENT'::text, 'STALE_OR_INVALID'::text])); ELSIF actual <> 'CHECK (freshness_status = ANY (ARRAY[''CURRENT''::text, ''STALE_OR_INVALID''::text]))' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_freshness_status_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_integrity_status_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_integrity_status_check CHECK (integrity_status = ANY (ARRAY['APPROVED'::text, 'REVIEW_REQUIRED'::text, 'REJECTED'::text])); ELSIF actual <> 'CHECK (integrity_status = ANY (ARRAY[''APPROVED''::text, ''REVIEW_REQUIRED''::text, ''REJECTED''::text]))' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_integrity_status_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_listing_id_fkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE; ELSIF actual <> 'FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_listing_id_fkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.listing_price_integrity_current'::regclass AND conname='listing_price_integrity_current_pkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ADD CONSTRAINT listing_price_integrity_current_pkey PRIMARY KEY (listing_id); ELSIF actual <> 'PRIMARY KEY (listing_id)' THEN RAISE EXCEPTION 'Price integrity constraint differs: listing_price_integrity_current_pkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND conname='price_integrity_pending_attempts_check'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.price_integrity_pending ADD CONSTRAINT price_integrity_pending_attempts_check CHECK (attempts >= 0); ELSIF actual <> 'CHECK (attempts >= 0)' THEN RAISE EXCEPTION 'Price integrity constraint differs: price_integrity_pending_attempts_check'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND conname='price_integrity_pending_listing_id_fkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.price_integrity_pending ADD CONSTRAINT price_integrity_pending_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE; ELSIF actual <> 'FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE' THEN RAISE EXCEPTION 'Price integrity constraint differs: price_integrity_pending_listing_id_fkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_constraintdef(oid, true) INTO actual FROM pg_constraint WHERE conrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND conname='price_integrity_pending_pkey'; IF actual IS NULL THEN ALTER TABLE twuanis_canonical_private.price_integrity_pending ADD CONSTRAINT price_integrity_pending_pkey PRIMARY KEY (listing_id); ELSIF actual <> 'PRIMARY KEY (listing_id)' THEN RAISE EXCEPTION 'Price integrity constraint differs: price_integrity_pending_pkey'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_indexdef(to_regclass('twuanis_canonical_private.listing_price_integrity_current_eligible_idx')) INTO actual; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE INDEX listing_price_integrity_current_eligible_idx ON twuanis_canonical_private.listing_price_integrity_current USING btree (listing_id, canonical_revision, evaluator_version) WHERE (analytical_eligible AND (freshness_status = 'CURRENT'::text))$twuanis_0$; ELSIF actual <> 'CREATE INDEX listing_price_integrity_current_eligible_idx ON twuanis_canonical_private.listing_price_integrity_current USING btree (listing_id, canonical_revision, evaluator_version) WHERE (analytical_eligible AND (freshness_status = ''CURRENT''::text))' THEN RAISE EXCEPTION 'Price integrity index differs: listing_price_integrity_current_eligible_idx'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_indexdef(to_regclass('twuanis_canonical_private.listing_price_integrity_evidence_observation_idx')) INTO actual; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE INDEX listing_price_integrity_evidence_observation_idx ON twuanis_canonical_private.listing_price_integrity_evidence USING btree (observation_id) WHERE (observation_id IS NOT NULL)$twuanis_0$; ELSIF actual <> 'CREATE INDEX listing_price_integrity_evidence_observation_idx ON twuanis_canonical_private.listing_price_integrity_evidence USING btree (observation_id) WHERE (observation_id IS NOT NULL)' THEN RAISE EXCEPTION 'Price integrity index differs: listing_price_integrity_evidence_observation_idx'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_indexdef(to_regclass('twuanis_canonical_private.listing_price_integrity_evidence_revision_idx')) INTO actual; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE INDEX listing_price_integrity_evidence_revision_idx ON twuanis_canonical_private.listing_price_integrity_evidence USING btree (listing_id, canonical_revision, evaluator_version, evaluated_at DESC)$twuanis_0$; ELSIF actual <> 'CREATE INDEX listing_price_integrity_evidence_revision_idx ON twuanis_canonical_private.listing_price_integrity_evidence USING btree (listing_id, canonical_revision, evaluator_version, evaluated_at DESC)' THEN RAISE EXCEPTION 'Price integrity index differs: listing_price_integrity_evidence_revision_idx'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_indexdef(to_regclass('twuanis_canonical_private.price_integrity_pending_requested_idx')) INTO actual; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE INDEX price_integrity_pending_requested_idx ON twuanis_canonical_private.price_integrity_pending USING btree (requested_at, listing_id)$twuanis_0$; ELSIF actual <> 'CREATE INDEX price_integrity_pending_requested_idx ON twuanis_canonical_private.price_integrity_pending USING btree (requested_at, listing_id)' THEN RAISE EXCEPTION 'Price integrity index differs: price_integrity_pending_requested_idx'; END IF; END $$;
ALTER TABLE twuanis_canonical_private.listing_price_integrity_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.listing_price_integrity_evidence FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE twuanis_canonical_private.listing_price_integrity_evidence TO service_role;
ALTER TABLE twuanis_canonical_private.price_historical_evidence_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.price_historical_evidence_registry FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE twuanis_canonical_private.price_historical_evidence_registry TO service_role;
ALTER TABLE twuanis_canonical_private.listing_price_integrity_current ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.listing_price_integrity_current FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE twuanis_canonical_private.listing_price_integrity_current TO service_role;
ALTER TABLE twuanis_canonical_private.price_integrity_pending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE twuanis_canonical_private.price_integrity_pending FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE twuanis_canonical_private.price_integrity_pending TO service_role;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_viewdef(to_regclass('public.analytically_eligible_marketplace_listings'), true) INTO actual; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE VIEW public.analytically_eligible_marketplace_listings WITH (security_invoker=true) AS SELECT l.id
   FROM listings l
     JOIN twuanis_canonical_private.listing_price_integrity_current c ON c.listing_id = l.id AND c.canonical_revision = l.canonical_revision AND c.evaluator_version = 4
  WHERE l.canonical_domain_version = 1 AND l.listing_status = 'active'::text AND c.freshness_status = 'CURRENT'::text AND c.analytical_eligible IS TRUE AND NOT (EXISTS ( SELECT 1
           FROM twuanis_canonical_private.price_integrity_pending p
          WHERE p.listing_id = l.id))$twuanis_0$; ELSIF regexp_replace(trim(trailing ';' FROM trim(actual)), '\s+', ' ', 'g') <> regexp_replace(trim(trailing ';' FROM trim($twuanis_0$SELECT l.id
   FROM listings l
     JOIN twuanis_canonical_private.listing_price_integrity_current c ON c.listing_id = l.id AND c.canonical_revision = l.canonical_revision AND c.evaluator_version = 4
  WHERE l.canonical_domain_version = 1 AND l.listing_status = 'active'::text AND c.freshness_status = 'CURRENT'::text AND c.analytical_eligible IS TRUE AND NOT (EXISTS ( SELECT 1
           FROM twuanis_canonical_private.price_integrity_pending p
          WHERE p.listing_id = l.id))$twuanis_0$)), '\s+', ' ', 'g') THEN RAISE EXCEPTION 'Price integrity analytical view differs'; END IF; END $$;
ALTER VIEW public.analytically_eligible_marketplace_listings SET (security_invoker=true);
REVOKE ALL ON TABLE public.analytically_eligible_marketplace_listings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.analytically_eligible_marketplace_listings TO service_role;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.compare_price_evidence(numeric,text,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.compare_price_evidence(canonical_amount numeric, canonical_currency text, evidence_amount numeric, evidence_currency text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    cc text;
    ec text;
BEGIN
    cc := upper(btrim(canonical_currency));
    ec := upper(btrim(evidence_currency));

    IF canonical_amount IS NULL
       OR evidence_amount IS NULL
       OR coalesce(cc, '') = ''
       OR coalesce(ec, '') = ''
    THEN
        RETURN 'INSUFFICIENT_EVIDENCE';
    END IF;

    IF canonical_amount <= 0
       OR evidence_amount <= 0
       OR canonical_amount::text IN (
           'NaN', 'Infinity', '-Infinity'
       )
       OR evidence_amount::text IN (
           'NaN', 'Infinity', '-Infinity'
       )
       OR cc NOT IN ('USD', 'CRC')
       OR ec NOT IN ('USD', 'CRC')
    THEN
        RETURN 'INVALID_EVIDENCE';
    END IF;

    IF canonical_amount <> evidence_amount
       AND cc <> ec
    THEN
        RETURN 'AMOUNT_AND_CURRENCY_CONFLICT';
    END IF;

    IF cc <> ec THEN
        RETURN 'CURRENCY_CONFLICT';
    END IF;

    IF canonical_amount <> evidence_amount THEN
        RETURN 'AMOUNT_CONFLICT';
    END IF;

    RETURN 'CONSISTENT';
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.compare_price_evidence(numeric,text,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.compare_price_evidence(numeric,text,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '6cc1ed7456ae8e157609b5e08a02509c' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.compare_price_evidence(numeric,text,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.guard_price_integrity_evidence_immutability()'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
    RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE =
                'PRICE_INTEGRITY_EVIDENCE_IS_IMMUTABLE';
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability() FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'de59bfdabe8028755c4ad7ec3ce59129' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.guard_price_integrity_evidence_immutability()'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.invalidate_current_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.invalidate_current_price_integrity(p_listing_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
    PERFORM 1
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    UPDATE twuanis_canonical_private
        .listing_price_integrity_current
    SET
        analytical_eligible = false,
        freshness_status = 'STALE_OR_INVALID',
        verified_at = clock_timestamp()
    WHERE listing_id = p_listing_id
      AND (
          analytical_eligible
          OR freshness_status <> 'STALE_OR_INVALID'
      );

    INSERT INTO twuanis_canonical_private
        .price_integrity_pending (
            listing_id,
            requested_at
        )
    VALUES (
        p_listing_id,
        clock_timestamp()
    )
    ON CONFLICT (listing_id)
    DO UPDATE SET
        requested_at = EXCLUDED.requested_at,
        attempts = 0,
        last_attempt_at = NULL,
        last_error = NULL;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.invalidate_current_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.invalidate_current_price_integrity(uuid) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'b9fb81c10110836042697429a8d7d2a5' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.invalidate_current_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('public.marketplace_price_eligibility(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION public.marketplace_price_eligibility(p_listing listings)
 RETURNS SETOF analytically_eligible_marketplace_listings
 LANGUAGE sql
 STABLE ROWS 1
 SET search_path TO 'pg_catalog'
AS $function$
    SELECT e.*
    FROM public.analytically_eligible_marketplace_listings e
    WHERE e.id = p_listing.id;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION public.marketplace_price_eligibility(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION public.marketplace_price_eligibility(listings) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'b960849332504df16da9487ff7f7ad80' THEN RAISE EXCEPTION 'Price integrity function differs: public.marketplace_price_eligibility(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.prepare_advertised_price_text(text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.prepare_advertised_price_text(description text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    s text;
BEGIN
    s := lower(
        twuanis_canonical_private
        .normalize_price_description(description)
    );

    -- Explicit alternative sale-price label.
    s := regexp_replace(
        s,
        'oportunidad de venta[[:blank:]]*:',
        'precio de venta:',
        'g'
    );

    -- Currency following a numerical expression.
    s := regexp_replace(
        s,
        '([0-9])[[:blank:]]+de[[:blank:]]+(colones|dólares|dolares)',
        '\1 \2',
        'g'
    );

    s := regexp_replace(
        s,
        '(millones|millón|millon|mil)[[:blank:]]+de[[:blank:]]+(colones|dólares|dolares)',
        '\1 \2',
        'g'
    );

    -- Negotiability does not invalidate an asking price.
    s := regexp_replace(
        s,
        '([0-9]|colones|dólares|dolares|crc|usd)[[:blank:]]+negociables?',
        '\1',
        'g'
    );

    -- Explicit monthly rental statements.
    s := regexp_replace(
        s,
        '(^|\n)([[:blank:]]*(alquiler|renta|precio de alquiler|precio de renta)[[:blank:]]*:[^\n]+)[[:blank:]]+mensuales?([.]?)(\n|$)',
        '\1\2\4\5',
        'g'
    );

    -- Explicitly labelled embedded investment amount.
    s := regexp_replace(
        s,
        'oportunidad de inversión en[[:blank:]]+([0-9]+([.,][0-9]+)*[[:blank:]]+(millones|millón|millon|mil)[[:blank:]]+(colones|dólares|dolares))[.]?',
        E'\nprecio: \\1\n',
        'g'
    );

    -- Current advertised offer, not historical appraisal.
    s := regexp_replace(
        s,
        'actualmente se ofrece en[[:blank:]]+([0-9]+([.,][0-9]+)*)([[:blank:]]*,[[:blank:]]+|[[:blank:]]|$)',
        E'\nprecio: \\1\n',
        'g'
    );

    RETURN s;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.prepare_advertised_price_text(text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.prepare_advertised_price_text(text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '5805947372861fbd2efb8a74accb8401' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.prepare_advertised_price_text(text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.price_evidence_format(jsonb)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.price_evidence_format(raw jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    pe jsonb;
BEGIN
    IF raw IS NULL
       OR jsonb_typeof(raw) <> 'object'
    THEN
        RETURN 'INVALID_SOURCE_EVIDENCE';
    END IF;

    pe := raw->'raw_price_evidence';

    IF jsonb_typeof(pe) = 'string' THEN
        BEGIN
            pe := (raw->>'raw_price_evidence')::jsonb;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RETURN 'MALFORMED_PRICE_EVIDENCE';
        END;
    END IF;

    IF pe IS NULL OR pe = 'null'::jsonb THEN
        RETURN 'LEGACY_NO_PRICE_OBJECT';
    END IF;

    IF jsonb_typeof(pe) <> 'object' THEN
        RETURN 'MALFORMED_PRICE_EVIDENCE';
    END IF;

    IF pe ? 'source_url'
       OR pe ? 'observed_at'
       OR (pe->'flight_price') ? 'source_label'
       OR (pe->'flight_price') ? 'source_value'
    THEN
        RETURN 'CURRENT_SOURCE_PAIR';
    END IF;

    IF jsonb_typeof(pe->'selected') = 'object'
       AND jsonb_typeof(pe->'offer') = 'object'
       AND jsonb_typeof(pe->'flight_price') = 'object'
    THEN
        RETURN 'LEGACY_STRUCTURED_PAIR';
    END IF;

    RETURN 'UNRECOGNIZED_PRICE_EVIDENCE';
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.price_evidence_format(jsonb) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.price_evidence_format(jsonb) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '99d06ea0762b564e2b8355f6b9475c1d' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.price_evidence_format(jsonb)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.price_integrity_currency(jsonb)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.price_integrity_currency(value jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE token text; c text; answer text;
BEGIN
 IF jsonb_typeof(value)='string' THEN token:=upper(btrim(value#>>'{}'));RETURN CASE WHEN token IN('USD','$','US$')THEN 'USD'WHEN token IN('CRC','₡','¢')THEN 'CRC'END;END IF;
 IF jsonb_typeof(value)IS DISTINCT FROM 'object' THEN RETURN NULL;END IF;
 -- A source locale/countryISO is deliberately never interpreted as currency.
 FOREACH token IN ARRAY ARRAY[value->>'code',value->>'currencyCode',value->>'symbol']LOOP
  IF token IS NULL OR token='' THEN CONTINUE;END IF;
  c:=twuanis_canonical_private.price_integrity_currency(to_jsonb(token));
  IF c IS NULL OR (answer IS NOT NULL AND answer<>c)THEN RETURN NULL;END IF;answer:=c;
 END LOOP;RETURN answer;
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.price_integrity_currency(jsonb) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'd48df946ccde4935dd68a32f8e01472f' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.price_integrity_currency(jsonb)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.price_integrity_number(text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.price_integrity_number(value text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s text:=btrim(value); n numeric;
BEGIN
 IF s IS NULL OR length(s)>256 THEN RETURN NULL;END IF;
 s:=regexp_replace(s,'^(USD|CRC|US[$]|[$₡¢])[[:space:]]*','','i');
 IF s ~ '^[0-9]{1,3}(,[0-9]{3})+([.][0-9]{1,2})?$' THEN s:=replace(s,',','');END IF;
 IF s !~ '^[0-9]+([.][0-9]+)?$' THEN RETURN NULL;END IF;
 n:=s::numeric;IF n<=0 OR NOT twuanis_canonical_private.finite_numeric(n) THEN RETURN NULL;END IF;RETURN n;
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.price_integrity_number(text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '2899e48204a3ebe8b2091c693aca6388' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.price_integrity_number(text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.read_current_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.read_current_price_integrity(p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    l public.listings;
    m public.listing_monetary_events;
    o public.listing_source_observations;
    r twuanis_canonical_private.csv_source_evidence;
    e twuanis_canonical_private.listing_price_integrity_evidence;

    amount numeric;
    owner_assertion boolean;
    assertion_kind text;
    retained_count bigint;

    reasons text[] := ARRAY[]::text[];
BEGIN
    SELECT *
    INTO l
    FROM public.listings
    WHERE id = p_listing_id;

    IF l.id IS NULL THEN
        RETURN jsonb_build_object(
            'freshness_status', 'LISTING_NOT_FOUND',
            'analytical_eligible', false
        );
    END IF;

    amount := CASE l.transaction_type
        WHEN 'sale' THEN l.current_price
        WHEN 'rent' THEN l.monthly_price
    END;

    SELECT *
    INTO e
    FROM twuanis_canonical_private
        .listing_price_integrity_evidence x
    WHERE x.listing_id = l.id
      AND x.canonical_revision = l.canonical_revision
      AND x.evaluator_version = 4
    ORDER BY x.evaluated_at DESC, x.id DESC
    LIMIT 1;

    IF e.id IS NULL THEN
        RETURN jsonb_build_object(
            'listing_id', l.id,
            'freshness_status', 'MISSING_CURRENT_EVIDENCE',
            'analytical_eligible', false
        );
    END IF;

    IF (
        e.canonical_domain_version,
        e.transaction_type,
        e.asking_amount,
        e.currency,
        e.source_name,
        e.source_listing_id
    ) IS DISTINCT FROM (
        l.canonical_domain_version,
        l.transaction_type,
        amount,
        l.currency,
        l.source_name,
        l.source_listing_id
    ) THEN
        reasons := array_append(
            reasons,
            'CANONICAL_PRICE_IDENTITY_CHANGED'
        );
    END IF;

    IF l.listing_status IS DISTINCT FROM 'active'
       OR l.canonical_domain_version IS DISTINCT FROM 1
    THEN
        reasons := array_append(
            reasons,
            'LISTING_NOT_CURRENTLY_ELIGIBLE'
        );
    END IF;

    SELECT *
    INTO m
    FROM public.listing_monetary_events x
    WHERE x.listing_id = l.id
    ORDER BY
        x.listing_revision DESC,
        x.recorded_at DESC,
        x.id DESC
    LIMIT 1;

    IF m.id IS NULL
       OR m.id::text IS DISTINCT FROM
          e.decision->>'monetary_event'
       OR (
           m.new_amount,
           m.new_currency,
           m.transaction_type
       ) IS DISTINCT FROM (
           amount,
           l.currency,
           l.transaction_type
       )
    THEN
        reasons := array_append(
            reasons,
            'MONETARY_EVENT_CHANGED_OR_INVALID'
        );
    END IF;

    owner_assertion := coalesce(
        m.actor_kind = 'owner'
        AND l.owner_id IS NOT NULL
        AND m.actor_identity = l.owner_id::text,
        false
    );

    assertion_kind := CASE
        WHEN owner_assertion
            THEN 'authenticated_owner_asking_price'
        ELSE 'retained_source_asking_price'
    END;

    IF assertion_kind IS DISTINCT FROM e.assertion_kind THEN
        reasons := array_append(
            reasons,
            'ASSERTION_AUTHORITY_CHANGED'
        );
    END IF;

    IF NOT owner_assertion THEN

        SELECT *
        INTO o
        FROM public.listing_source_observations x
        WHERE x.listing_id = l.id
          AND x.outcome = 'accepted'
        ORDER BY
            x.result_revision DESC,
            x.processed_at DESC,
            x.id DESC
        LIMIT 1;

        IF o.id IS NULL
           OR o.id IS DISTINCT FROM e.observation_id
           OR o.source_name IS DISTINCT FROM l.source_name
           OR o.source_listing_id IS DISTINCT FROM
              l.source_listing_id
           OR o.source_observation_id IS DISTINCT FROM
              e.source_observation_id
           OR o.result_revision IS DISTINCT FROM
              e.observation_result_revision
           OR o.payload_fingerprint IS DISTINCT FROM
              e.observation_payload_fingerprint
           OR o.source_observed_at IS DISTINCT FROM
              e.source_observed_at
        THEN
            reasons := array_append(
                reasons,
                'SOURCE_OBSERVATION_CHANGED_OR_INVALID'
            );
        END IF;

        SELECT count(*)
        INTO retained_count
        FROM twuanis_canonical_private
            .csv_source_evidence x
        WHERE x.source_name = l.source_name
          AND x.source_listing_id = l.source_listing_id
          AND x.source_observation_id =
              o.source_observation_id;

        IF retained_count IS DISTINCT FROM 1 THEN
            reasons := array_append(
                reasons,
                'RETAINED_EVIDENCE_MISSING_OR_AMBIGUOUS'
            );
        ELSE

            SELECT *
            INTO r
            FROM twuanis_canonical_private
                .csv_source_evidence x
            WHERE x.source_name = l.source_name
              AND x.source_listing_id = l.source_listing_id
              AND x.source_observation_id =
                  o.source_observation_id;

            IF r.id IS DISTINCT FROM e.retained_evidence_id
               OR encode(
                   sha256(
                       convert_to(
                           r.raw_input::text,
                           'UTF8'
                       )
                   ),
                   'hex'
               ) IS DISTINCT FROM
                   e.retained_evidence_fingerprint
            THEN
                reasons := array_append(
                    reasons,
                    'RETAINED_EVIDENCE_CHANGED'
                );
            END IF;

        END IF;

    END IF;

    RETURN jsonb_build_object(
        'listing_id', l.id,
        'evidence_id', e.id,
        'canonical_revision', l.canonical_revision,
        'evaluator_version', e.evaluator_version,

        'freshness_status', CASE
            WHEN cardinality(reasons) = 0
                THEN 'CURRENT'
            ELSE 'STALE_OR_INVALID'
        END,

        'freshness_reasons', to_jsonb(reasons),

        'integrity_status', e.integrity_status,

        'recorded_analytical_eligible',
            e.analytical_eligible,

        'analytical_eligible',
            cardinality(reasons) = 0
            AND e.analytical_eligible,

        'evaluated_at', e.evaluated_at
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.read_current_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.read_current_price_integrity(uuid) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'cca6d7c0e7bfc1fb1bab625ab3f3ead5' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.read_current_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.read_price_jsonld_product(jsonb)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.read_price_jsonld_product(raw jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    document jsonb;
    product jsonb;
    product_count integer;
BEGIN
    document := raw->'raw_jsonld';

    IF jsonb_typeof(document) = 'string' THEN
        BEGIN
            document := (raw->>'raw_jsonld')::jsonb;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RETURN NULL;
        END;
    END IF;

    IF jsonb_typeof(document) = 'object' THEN
        document := jsonb_build_array(document);
    END IF;

    IF jsonb_typeof(document)
       IS DISTINCT FROM 'array'
    THEN
        RETURN NULL;
    END IF;

    SELECT count(*)
    INTO product_count
    FROM jsonb_array_elements(document) AS t(value)
    WHERE value->>'@type' = 'Product';

    IF product_count <> 1 THEN
        RETURN NULL;
    END IF;

    SELECT value
    INTO product
    FROM jsonb_array_elements(document) AS t(value)
    WHERE value->>'@type' = 'Product';

    RETURN product;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.read_price_jsonld_product(jsonb) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.read_price_jsonld_product(jsonb) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '9239a83bcd7871e7985c2c447d73ff7a' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.read_price_jsonld_product(jsonb)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.evaluate_advertised_price_evidence(text,text,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.evaluate_advertised_price_evidence(description text, canonical_transaction text, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    statements jsonb;
    statement jsonb;
    evaluated jsonb := '[]'::jsonb;
    reasons text[] := ARRAY[]::text[];
    statement_reasons text[];
    advertised_amount numeric;
    advertised_currency text;
    advertised_transaction text;
    comparison text;
    consistent_count integer := 0;
    conflict_count integer := 0;
    unresolved_count integer := 0;
    overall_status text;
BEGIN
    statements :=
        twuanis_canonical_private
        .extract_advertised_price_statements(description);

    IF jsonb_array_length(statements) = 0 THEN
        RETURN jsonb_build_object(
            'status', 'NO_TEXTUAL_EVIDENCE',
            'statement_count', 0,
            'statements', statements
        );
    END IF;

    FOR statement IN
        SELECT value
        FROM jsonb_array_elements(statements)
    LOOP
        statement_reasons := ARRAY[]::text[];

        advertised_transaction :=
            statement->>'transaction_type';

        advertised_currency :=
            statement->>'currency';

        advertised_amount :=
            (statement->>'amount')::numeric;

        IF advertised_transaction IS NOT NULL
           AND advertised_transaction
               IS DISTINCT FROM canonical_transaction
        THEN
            statement_reasons := array_append(
                statement_reasons,
                'ADVERTISED_TRANSACTION_CONFLICT'
            );
        END IF;

        IF statement->>'status' <> 'PARSED' THEN

            statement_reasons := array_append(
                statement_reasons,
                'ADVERTISED_PRICE_UNRESOLVED'
            );

        ELSIF advertised_currency IS NULL THEN

            statement_reasons := array_append(
                statement_reasons,
                'ADVERTISED_CURRENCY_UNRESOLVED'
            );

            IF advertised_amount
               IS DISTINCT FROM canonical_amount
            THEN
                statement_reasons := array_append(
                    statement_reasons,
                    'ADVERTISED_NUMERIC_DISCREPANCY'
                );
            END IF;

        ELSE

            comparison :=
                twuanis_canonical_private
                .compare_price_evidence(
                    canonical_amount,
                    canonical_currency,
                    advertised_amount,
                    advertised_currency
                );

            CASE comparison
                WHEN 'CURRENCY_CONFLICT' THEN
                    statement_reasons := array_append(
                        statement_reasons,
                        'ADVERTISED_CURRENCY_CONFLICT'
                    );

                WHEN 'AMOUNT_CONFLICT' THEN
                    statement_reasons := array_append(
                        statement_reasons,
                        'ADVERTISED_AMOUNT_CONFLICT'
                    );

                WHEN 'AMOUNT_AND_CURRENCY_CONFLICT' THEN
                    statement_reasons := array_append(
                        statement_reasons,
                        'ADVERTISED_CURRENCY_CONFLICT'
                    );

                    statement_reasons := array_append(
                        statement_reasons,
                        'ADVERTISED_NUMERIC_DISCREPANCY'
                    );

                WHEN 'CONSISTENT' THEN
                    NULL;

                ELSE
                    statement_reasons := array_append(
                        statement_reasons,
                        'ADVERTISED_PRICE_UNRESOLVED'
                    );
            END CASE;

        END IF;

        IF statement_reasons && ARRAY[
            'ADVERTISED_TRANSACTION_CONFLICT',
            'ADVERTISED_CURRENCY_CONFLICT',
            'ADVERTISED_AMOUNT_CONFLICT'
        ]::text[]
        THEN
            conflict_count := conflict_count + 1;

        ELSIF cardinality(statement_reasons) > 0 THEN
            unresolved_count := unresolved_count + 1;

        ELSE
            consistent_count := consistent_count + 1;
        END IF;

        reasons := reasons || statement_reasons;

        evaluated := evaluated ||
            jsonb_build_array(
                statement || jsonb_build_object(
                    'reasons',
                    to_jsonb(statement_reasons)
                )
            );

    END LOOP;

    SELECT coalesce(
        array_agg(DISTINCT reason ORDER BY reason),
        ARRAY[]::text[]
    )
    INTO reasons
    FROM unnest(reasons) AS t(reason);

    overall_status := CASE
        WHEN conflict_count > 0
            THEN 'CONFLICTING_EVIDENCE'
        WHEN unresolved_count > 0
            THEN 'UNRESOLVED_EVIDENCE'
        ELSE 'CONSISTENT'
    END;

    RETURN jsonb_build_object(
        'status', overall_status,
        'statement_count', jsonb_array_length(statements),
        'consistent_count', consistent_count,
        'conflict_count', conflict_count,
        'unresolved_count', unresolved_count,
        'reasons', to_jsonb(reasons),
        'statements', evaluated
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.evaluate_advertised_price_evidence(text,text,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.evaluate_advertised_price_evidence(text,text,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '05eee9de30408e0dcd94d3cfbf10bd43' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.evaluate_advertised_price_evidence(text,text,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.invalidate_price_integrity_on_change()'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
    IF TG_TABLE_NAME = 'listings' THEN

        IF TG_OP = 'INSERT' THEN
            PERFORM twuanis_canonical_private
                .invalidate_current_price_integrity(NEW.id);

        ELSIF (
            OLD.canonical_revision,
            OLD.canonical_domain_version,
            OLD.listing_status,
            OLD.transaction_type,
            OLD.current_price,
            OLD.monthly_price,
            OLD.currency,
            OLD.owner_id,
            OLD.publisher_account_id,
            OLD.listing_origin,
            OLD.source_name,
            OLD.source_listing_id,
            OLD.title,
            OLD.description
        ) IS DISTINCT FROM (
            NEW.canonical_revision,
            NEW.canonical_domain_version,
            NEW.listing_status,
            NEW.transaction_type,
            NEW.current_price,
            NEW.monthly_price,
            NEW.currency,
            NEW.owner_id,
            NEW.publisher_account_id,
            NEW.listing_origin,
            NEW.source_name,
            NEW.source_listing_id,
            NEW.title,
            NEW.description
        ) THEN
            PERFORM twuanis_canonical_private
                .invalidate_current_price_integrity(NEW.id);
        END IF;

    ELSIF TG_TABLE_NAME = 'listing_monetary_events' THEN

        PERFORM twuanis_canonical_private
            .invalidate_current_price_integrity(
                NEW.listing_id
            );

    ELSIF TG_TABLE_NAME = 'listing_source_observations' THEN

        IF NEW.outcome = 'accepted' THEN
            PERFORM twuanis_canonical_private
                .invalidate_current_price_integrity(
                    NEW.listing_id
                );
        END IF;

    END IF;

    RETURN NEW;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change() FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'ff15cb1b590f645abd25594f4b525f83' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.invalidate_price_integrity_on_change()'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence()'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    candidate record;
BEGIN
    FOR candidate IN
        SELECT DISTINCT l.id
        FROM public.listings l
        JOIN public.listing_source_observations o
          ON o.listing_id = l.id
        WHERE l.source_name = NEW.source_name
          AND l.source_listing_id = NEW.source_listing_id
          AND o.source_name = NEW.source_name
          AND o.source_listing_id = NEW.source_listing_id
          AND o.source_observation_id =
              NEW.source_observation_id
          AND o.outcome = 'accepted'
          AND l.canonical_domain_version = 1
    LOOP
        PERFORM twuanis_canonical_private
            .invalidate_current_price_integrity(
                candidate.id
            );
    END LOOP;

    RETURN NEW;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence() FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '7b714b5b69a64640291a08ec789b73c2' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence()'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.price_integrity_texts(text[],text,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.price_integrity_texts(texts text[], tx text, amount numeric, currency text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE body text; line text; token text[]; raw text; number_text text; suffix text; n numeric; c text; asking boolean; other_money boolean; rental boolean; reasons text[]:='{}';
BEGIN
 FOREACH body IN ARRAY texts LOOP
  IF body IS NULL THEN CONTINUE;END IF;
  IF length(body)>131072 THEN reasons:=array_append(reasons,'PRICE_TEXT_BOUND_EXCEEDED');CONTINUE;END IF;
  body:=lower(translate(regexp_replace(body,'<br[[:space:]]*/?>|\\n|\\r',E'\n','gi'),'áéíóúü','aeiouu'));
  FOREACH line IN ARRAY regexp_split_to_array(body,E'[\n\r]+') LOOP
   rental:=line ~ '\m(alquiler|alquilar|renta|rent|rental|lease)\M';
   asking:=line ~ '\m(precio|venta|price|selling|asking|inversion)\M';
   other_money:=line ~ '\m(cuota|mantenimiento|hoa|avaluo|descuento|prima|hipoteca|alquiler|renta|rent|deposito|antes|comparables)\M';
   IF asking AND line ~ '(precio|price)[[:space:]:]*(a convenir|consultar|negociable|por definir|on request|tbd|n/a|gratis|gratuito|placeholder|dummy)' THEN reasons:=array_append(reasons,'PRICE_PLACEHOLDER');END IF;
   FOR token IN SELECT regexp_matches(line,'(?:us[$]|usd[[:space:]]*[$]?|crc[[:space:]]*|[$₡¢])[[:space:]]*[0-9][0-9.,]*([[:alpha:]][[:alnum:]]*)','g')LOOP
    IF token[1] NOT IN('usd','mil','millon','millones','k')THEN reasons:=array_append(reasons,'PRICE_TEXT_MALFORMED_OR_AMBIGUOUS');END IF;
   END LOOP;
   IF tx='rent'AND rental THEN other_money:=line ~ '\m(cuota|mantenimiento|hoa|avaluo|descuento|prima|hipoteca|deposito|antes|comparables)\M';END IF;
   FOR token IN SELECT regexp_matches(line,'((?:us[$]|usd[[:space:]]*[$]?|crc[[:space:]]*|[$₡¢])[[:space:]]*[0-9][0-9.,]*(?:[ \t]+[0-9]+)*(?:[ \t]*(?:millones|millon|mil|k))?)','g')LOOP
    raw:=token[1];c:=CASE WHEN raw ~ '^(crc|₡|¢)'THEN 'CRC'ELSE 'USD'END;
    number_text:=regexp_replace(raw,'^(usd[[:space:]]*[$]?|crc|us[$]|[$₡¢])[[:space:]]*','','i');suffix:=substring(number_text FROM '(millones|millon|mil|k)$');
    IF suffix IS NOT NULL THEN number_text:=btrim(regexp_replace(number_text,'(millones|millon|mil|k)$',''));END IF;
    IF number_text ~ '^[0-9]{1,3}([.][0-9]{3}){2,}$'THEN number_text:=replace(number_text,'.','');END IF;
    IF number_text ~ '^[0-9]{1,3}( [0-9]{3})+$'THEN number_text:=replace(number_text,' ','');END IF;
    n:=CASE WHEN number_text ~ '^[0-9]+[.][0-9]{3}$'THEN NULL ELSE twuanis_canonical_private.price_integrity_number(number_text)END;
    IF suffix IN('millones','millon')THEN n:=n*1000000;ELSIF suffix IN('mil','k')THEN n:=n*1000;END IF;
    IF tx='sale' AND rental THEN reasons:=array_append(reasons,'SALE_RENTAL_PRICE_EVIDENCE');END IF;
    IF tx='rent'AND line ~ '\m(venta|sale|selling)\M'THEN reasons:=array_append(reasons,'RENT_SALE_PRICE_EVIDENCE');END IF;
    IF line ~ '-[[:space:]]*(us[$]|usd|crc|[$₡¢])'THEN reasons:=array_append(reasons,'PRICE_NEGATIVE_TEXT');END IF;
    IF n IS NULL AND (asking OR NOT other_money)THEN reasons:=array_append(reasons,'PRICE_TEXT_MALFORMED_OR_AMBIGUOUS');
    ELSIF n IS NOT NULL AND asking AND NOT other_money AND (n<>amount OR c<>currency) THEN reasons:=array_append(reasons,'PRICE_TEXT_CONTRADICTION');
    END IF;
   END LOOP;
  END LOOP;
 END LOOP;
 RETURN ARRAY(SELECT DISTINCT x FROM unnest(reasons)x ORDER BY x);
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.price_integrity_texts(text[],text,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'e03257e86b683cc4ef7718ba4e3bbf8a' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.price_integrity_texts(text[],text,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.refresh_current_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.refresh_current_price_integrity(p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    l public.listings;
    e twuanis_canonical_private.listing_price_integrity_evidence;
    result jsonb;
    is_current boolean;
BEGIN
    SELECT *
    INTO l
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF l.id IS NULL
       OR l.listing_status IS DISTINCT FROM 'active'
       OR l.canonical_domain_version IS DISTINCT FROM 1
    THEN
        DELETE FROM twuanis_canonical_private
            .listing_price_integrity_current
        WHERE listing_id = p_listing_id;

        RETURN jsonb_build_object(
            'listing_id', p_listing_id,
            'status', 'NOT_APPLICABLE',
            'analytical_eligible', false
        );
    END IF;

    result := twuanis_canonical_private
        .read_current_price_integrity(p_listing_id);

    IF result->>'evidence_id' IS NULL THEN

        DELETE FROM twuanis_canonical_private
            .listing_price_integrity_current
        WHERE listing_id = p_listing_id;

        RETURN result;
    END IF;

    SELECT *
    INTO STRICT e
    FROM twuanis_canonical_private
        .listing_price_integrity_evidence
    WHERE id = (result->>'evidence_id')::uuid
      AND listing_id = l.id
      AND canonical_revision = l.canonical_revision
      AND evaluator_version = 4;

    is_current := coalesce(
        result->>'freshness_status' = 'CURRENT',
        false
    );

    INSERT INTO twuanis_canonical_private
        .listing_price_integrity_current (
            listing_id,
            evidence_id,
            canonical_revision,
            evaluator_version,
            integrity_status,
            analytical_eligible,
            freshness_status,
            verified_at
        )
    VALUES (
        l.id,
        e.id,
        e.canonical_revision,
        e.evaluator_version,
        e.integrity_status,
        is_current AND e.analytical_eligible,
        CASE
            WHEN is_current THEN 'CURRENT'
            ELSE 'STALE_OR_INVALID'
        END,
        clock_timestamp()
    )
    ON CONFLICT (listing_id)
    DO UPDATE SET
        evidence_id = EXCLUDED.evidence_id,
        canonical_revision = EXCLUDED.canonical_revision,
        evaluator_version = EXCLUDED.evaluator_version,
        integrity_status = EXCLUDED.integrity_status,
        analytical_eligible = EXCLUDED.analytical_eligible,
        freshness_status = EXCLUDED.freshness_status,
        verified_at = EXCLUDED.verified_at;

    RETURN result;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.refresh_current_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'aad6396cb78701437a7b2b84e0660383' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.refresh_current_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.validate_current_price_evidence(jsonb,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.validate_current_price_evidence(raw jsonb, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    pe jsonb;
    flight jsonb;
    amount_text text;
    currency_text text;
    parsed_amount numeric;
    comparison text;
    reasons text[] := ARRAY[]::text[];
BEGIN
    IF twuanis_canonical_private.price_evidence_format(raw)
       <> 'CURRENT_SOURCE_PAIR'
    THEN
        RETURN jsonb_build_object(
            'status', 'UNSUPPORTED_EVIDENCE_FORMAT'
        );
    END IF;

    pe := raw->'raw_price_evidence';

    IF jsonb_typeof(pe) = 'string' THEN
        pe := (raw->>'raw_price_evidence')::jsonb;
    END IF;

    flight := pe->'flight_price';

    IF nullif(btrim(pe->>'source_url'), '') IS NULL
       OR nullif(btrim(raw->>'source_url'), '') IS NULL
    THEN
        reasons := array_append(
            reasons, 'SOURCE_URL_MISSING'
        );

    ELSIF pe->>'source_url'
          IS DISTINCT FROM raw->>'source_url'
    THEN
        reasons := array_append(
            reasons, 'SOURCE_URL_MISMATCH'
        );
    END IF;

    IF nullif(btrim(pe->>'observed_at'), '') IS NULL
       OR nullif(btrim(raw->>'observed_at'), '') IS NULL
    THEN
        reasons := array_append(
            reasons, 'OBSERVATION_TIMESTAMP_MISSING'
        );

    ELSIF pe->>'observed_at'
          IS DISTINCT FROM raw->>'observed_at'
    THEN
        reasons := array_append(
            reasons, 'OBSERVATION_TIMESTAMP_MISMATCH'
        );
    END IF;

    IF jsonb_typeof(flight) IS DISTINCT FROM 'object'
    THEN
        reasons := array_append(
            reasons, 'FLIGHT_PRICE_OBJECT_MISSING'
        );
    END IF;

    IF nullif(
        btrim(flight->>'source_label'), ''
    ) IS NULL THEN
        reasons := array_append(
            reasons, 'SOURCE_LABEL_MISSING'
        );
    END IF;

    IF nullif(
        btrim(flight->>'source_value'), ''
    ) IS NULL THEN
        reasons := array_append(
            reasons, 'SOURCE_VALUE_MISSING'
        );
    END IF;

    IF cardinality(reasons) > 0 THEN
        RETURN jsonb_build_object(
            'status', 'EVIDENCE_INTEGRITY_FAILURE',
            'reasons', to_jsonb(reasons)
        );
    END IF;

    amount_text := flight #>> '{amount,value}';

    currency_text := CASE
        WHEN jsonb_typeof(flight->'currency') = 'object'
        THEN flight #>> '{currency,symbol}'
        ELSE flight->>'currency'
    END;

    IF nullif(btrim(amount_text), '') IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'INSUFFICIENT_EVIDENCE',
            'reasons', jsonb_build_array(
                'FLIGHT_AMOUNT_MISSING'
            )
        );
    END IF;

    IF btrim(amount_text)
       !~ '^[0-9]+([.][0-9]+)?$'
    THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_EVIDENCE',
            'reasons', jsonb_build_array(
                'FLIGHT_AMOUNT_INVALID'
            )
        );
    END IF;

    BEGIN
        parsed_amount := amount_text::numeric;
    EXCEPTION
        WHEN numeric_value_out_of_range
          OR invalid_text_representation THEN
            RETURN jsonb_build_object(
                'status', 'INVALID_EVIDENCE',
                'reasons', jsonb_build_array(
                    'FLIGHT_AMOUNT_INVALID'
                )
            );
    END;

    comparison :=
        twuanis_canonical_private.compare_price_evidence(
            canonical_amount,
            canonical_currency,
            parsed_amount,
            currency_text
        );

    RETURN jsonb_build_object(
        'status', CASE
            WHEN comparison IN (
                'AMOUNT_CONFLICT',
                'CURRENCY_CONFLICT',
                'AMOUNT_AND_CURRENCY_CONFLICT'
            )
            THEN 'CONFLICTING_EVIDENCE'
            ELSE comparison
        END,
        'comparison', comparison,
        'amount', parsed_amount,
        'currency', currency_text,
        'source_label', flight->>'source_label',
        'source_value', flight->>'source_value'
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.validate_current_price_evidence(jsonb,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.validate_current_price_evidence(jsonb,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '41b8e91cd63c9ce959109c9af5b288dc' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.validate_current_price_evidence(jsonb,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.validate_json_ld_price_evidence(jsonb,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.validate_json_ld_price_evidence(offer jsonb, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    amount_text text;
    currency_text text;
    parsed_amount numeric;
    comparison text;
BEGIN
    IF offer IS NULL
       OR offer = 'null'::jsonb
    THEN
        RETURN jsonb_build_object(
            'status', 'INSUFFICIENT_EVIDENCE',
            'reason', 'JSON_LD_OFFER_MISSING'
        );
    END IF;

    IF jsonb_typeof(offer) = 'array' THEN
        RETURN jsonb_build_object(
            'status', 'AMBIGUOUS_EVIDENCE',
            'reason', 'JSON_LD_OFFER_ARRAY'
        );
    END IF;

    IF jsonb_typeof(offer) <> 'object' THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_EVIDENCE',
            'reason', 'JSON_LD_OFFER_INVALID'
        );
    END IF;

    amount_text := offer->>'price';
    currency_text := offer->>'priceCurrency';

    IF nullif(btrim(amount_text), '') IS NULL
       OR nullif(btrim(currency_text), '') IS NULL
    THEN
        RETURN jsonb_build_object(
            'status', 'INSUFFICIENT_EVIDENCE',
            'reason', 'JSON_LD_PRICE_OR_CURRENCY_MISSING'
        );
    END IF;

    IF btrim(amount_text)
       !~ '^[0-9]+([.][0-9]+)?$'
    THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_EVIDENCE',
            'reason', 'JSON_LD_AMOUNT_INVALID'
        );
    END IF;

    BEGIN
        parsed_amount := amount_text::numeric;
    EXCEPTION
        WHEN numeric_value_out_of_range
          OR invalid_text_representation THEN
            RETURN jsonb_build_object(
                'status', 'INVALID_EVIDENCE',
                'reason', 'JSON_LD_AMOUNT_INVALID'
            );
    END;

    comparison :=
        twuanis_canonical_private.compare_price_evidence(
            canonical_amount,
            canonical_currency,
            parsed_amount,
            currency_text
        );

    RETURN jsonb_build_object(
        'status', CASE
            WHEN comparison IN (
                'AMOUNT_CONFLICT',
                'CURRENCY_CONFLICT',
                'AMOUNT_AND_CURRENCY_CONFLICT'
            )
            THEN 'CONFLICTING_EVIDENCE'
            ELSE comparison
        END,
        'comparison', comparison,
        'amount', parsed_amount,
        'currency', currency_text,
        'evidence_source', 'JSON_LD_OFFER'
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.validate_json_ld_price_evidence(jsonb,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.validate_json_ld_price_evidence(jsonb,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '0fa69326e30a1ec5160f12a55036fd4d' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.validate_json_ld_price_evidence(jsonb,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.validate_legacy_price_evidence(jsonb,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.validate_legacy_price_evidence(raw jsonb, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    pe jsonb;
    evidence_item record;
    parsed_amount numeric;
    comparison text;
    comparisons jsonb := '{}'::jsonb;
    consistent_count integer := 0;
    conflict_count integer := 0;
    insufficient_count integer := 0;
    invalid_count integer := 0;
    overall_status text;
BEGIN
    IF twuanis_canonical_private.price_evidence_format(raw)
       <> 'LEGACY_STRUCTURED_PAIR'
    THEN
        RETURN jsonb_build_object(
            'status', 'UNSUPPORTED_EVIDENCE_FORMAT'
        );
    END IF;

    pe := raw->'raw_price_evidence';

    IF jsonb_typeof(pe) = 'string' THEN
        pe := (raw->>'raw_price_evidence')::jsonb;
    END IF;

    FOR evidence_item IN
        SELECT *
        FROM (
            VALUES
            (
                'selected',
                pe #>> '{selected,amount}',
                pe #>> '{selected,currency}'
            ),
            (
                'json_ld_offer',
                pe #>> '{offer,price}',
                pe #>> '{offer,priceCurrency}'
            ),
            (
                'flight_price',
                pe #>> '{flight_price,amount,value}',
                CASE
                    WHEN jsonb_typeof(
                        pe #> '{flight_price,currency}'
                    ) = 'object'
                    THEN pe #>>
                        '{flight_price,currency,symbol}'
                    ELSE pe #>>
                        '{flight_price,currency}'
                END
            )
        ) AS evidence(
            evidence_name,
            amount_text,
            currency_text
        )
    LOOP
        parsed_amount := NULL;

        IF nullif(
            btrim(evidence_item.amount_text), ''
        ) IS NOT NULL THEN

            IF btrim(evidence_item.amount_text)
               ~ '^[0-9]+([.][0-9]+)?$'
            THEN
                BEGIN
                    parsed_amount :=
                        evidence_item.amount_text::numeric;
                EXCEPTION
                    WHEN numeric_value_out_of_range
                      OR invalid_text_representation THEN
                        parsed_amount := NULL;
                END;
            END IF;

            IF parsed_amount IS NULL THEN
                comparison := 'INVALID_EVIDENCE';
            ELSE
                comparison :=
                    twuanis_canonical_private
                    .compare_price_evidence(
                        canonical_amount,
                        canonical_currency,
                        parsed_amount,
                        evidence_item.currency_text
                    );
            END IF;

        ELSE
            comparison := 'INSUFFICIENT_EVIDENCE';
        END IF;

        comparisons := comparisons ||
            jsonb_build_object(
                evidence_item.evidence_name,
                jsonb_build_object(
                    'amount', parsed_amount,
                    'currency',
                        evidence_item.currency_text,
                    'result', comparison
                )
            );

        CASE comparison
            WHEN 'CONSISTENT' THEN
                consistent_count := consistent_count + 1;

            WHEN 'INSUFFICIENT_EVIDENCE' THEN
                insufficient_count :=
                    insufficient_count + 1;

            WHEN 'INVALID_EVIDENCE' THEN
                invalid_count := invalid_count + 1;

            ELSE
                conflict_count := conflict_count + 1;
        END CASE;
    END LOOP;

    overall_status := CASE
        WHEN conflict_count > 0
            THEN 'CONFLICTING_EVIDENCE'
        WHEN invalid_count > 0
            THEN 'INVALID_EVIDENCE'
        WHEN consistent_count = 3
            THEN 'CONSISTENT'
        ELSE 'INSUFFICIENT_EVIDENCE'
    END;

    RETURN jsonb_build_object(
        'status', overall_status,
        'consistent_count', consistent_count,
        'conflict_count', conflict_count,
        'insufficient_count', insufficient_count,
        'invalid_count', invalid_count,
        'comparisons', comparisons
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.validate_legacy_price_evidence(jsonb,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.validate_legacy_price_evidence(jsonb,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '9f2ade03903aa5417296e72aa262ef7e' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.validate_legacy_price_evidence(jsonb,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.decide_listing_price(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.decide_listing_price(l listings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
 amount numeric:=CASE l.transaction_type WHEN 'sale'THEN l.current_price ELSE l.monthly_price END;
 reasons text[]:='{}';m public.listing_monetary_events; observation public.listing_source_observations; retained twuanis_canonical_private.csv_source_evidence;
 raw jsonb; eligibility jsonb; products jsonb; product jsonb; offer jsonb; pair_count integer:=0; price jsonb; n numeric; c text; texts text[]:=ARRAY[l.title,l.description]; owner_assertion boolean:=false;
 structured_offer_valid boolean:=true; structured_authority boolean:=false; scraper_price_valid boolean:=false; price_evidence jsonb; text_reasons text[];
BEGIN
 IF amount IS NULL OR amount<=0 OR NOT twuanis_canonical_private.finite_numeric(amount)THEN reasons:=array_append(reasons,'PRICE_MISSING_OR_INVALID');END IF;
 IF l.currency IS NULL OR l.currency NOT IN('USD','CRC')THEN reasons:=array_append(reasons,'PRICE_CURRENCY_UNSUPPORTED');END IF;
 IF l.transaction_type NOT IN('sale','rent')OR l.transaction_type IS NULL THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_UNSUPPORTED');END IF;
 IF (l.transaction_type='sale'AND l.monthly_price IS NOT NULL)OR(l.transaction_type='rent'AND l.current_price IS NOT NULL)THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
 SELECT * INTO m FROM public.listing_monetary_events e WHERE e.listing_id=l.id ORDER BY e.listing_revision DESC,e.recorded_at DESC,e.id DESC LIMIT 1;
 IF m.id IS NULL OR (m.new_amount,m.new_currency,m.transaction_type)IS DISTINCT FROM(amount,l.currency,l.transaction_type)THEN reasons:=array_append(reasons,'PRICE_CANONICAL_ASSERTION_MISSING');END IF;
 owner_assertion:=m.actor_kind='owner'AND l.owner_id IS NOT NULL AND m.actor_identity=l.owner_id::text;
 IF NOT coalesce(owner_assertion,false)THEN
  SELECT * INTO observation FROM public.listing_source_observations s WHERE s.listing_id=l.id AND s.outcome='accepted' ORDER BY s.result_revision DESC,s.processed_at DESC,s.id DESC LIMIT 1;
  SELECT * INTO retained FROM twuanis_canonical_private.csv_source_evidence e WHERE e.source_name=l.source_name AND e.source_listing_id=l.source_listing_id AND e.source_observation_id=observation.source_observation_id;
  IF retained.id IS NULL THEN reasons:=array_append(reasons,'PRICE_RETAINED_SOURCE_EVIDENCE_REQUIRED');
  ELSE
   raw:=retained.raw_input;
   IF (raw->>'source_name',raw->>'source_listing_id',raw->>'observation_id')IS DISTINCT FROM(l.source_name,l.source_listing_id,observation.source_observation_id)THEN reasons:=array_append(reasons,'PRICE_SOURCE_IDENTITY_MISMATCH');END IF;
   IF raw->>'transaction_type'IS DISTINCT FROM l.transaction_type THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   n:=twuanis_canonical_private.price_integrity_number(CASE l.transaction_type WHEN 'sale'THEN raw->>'current_price'ELSE raw->>'monthly_price'END);
   IF n IS DISTINCT FROM amount OR raw->>'currency'IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_RETAINED_PAIR_MISMATCH');END IF;
   IF l.transaction_type='sale'AND coalesce(raw->>'monthly_price','')<>''THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   BEGIN eligibility:=(raw->>'collection_eligibility')::jsonb;EXCEPTION WHEN invalid_text_representation THEN eligibility:=NULL;END;
   IF eligibility->>'status'IS DISTINCT FROM 'ELIGIBLE'OR jsonb_typeof(eligibility->'reasons')IS DISTINCT FROM 'array'OR jsonb_array_length(eligibility->'reasons')<>0 THEN reasons:=array_append(reasons,'PRICE_REJECTED_OR_QUARANTINED_SOURCE');END IF;
   IF l.transaction_type='rent'AND coalesce(raw->>'current_price','')<>''THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   texts:=texts||ARRAY[raw->>'title',raw->>'description'];
   BEGIN products:=(raw->>'raw_jsonld')::jsonb;EXCEPTION WHEN invalid_text_representation THEN products:=NULL;reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');END;
   IF jsonb_typeof(products)IS DISTINCT FROM 'array'THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');
   ELSE
    FOR product IN SELECT value FROM jsonb_array_elements(products)LOOP
     IF product->>'@type'<>'Product'THEN CONTINUE;END IF;texts:=array_append(texts,product->>'description');
     FOR offer IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(product->'offers')='array'THEN product->'offers'ELSE jsonb_build_array(product->'offers')END)LOOP
      pair_count:=pair_count+1;n:=twuanis_canonical_private.price_integrity_number(offer->>'price');c:=twuanis_canonical_private.price_integrity_currency(offer->'priceCurrency');
      IF n IS NULL OR c IS NULL OR n IS DISTINCT FROM amount OR c IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_PAIR_CONTRADICTION');structured_offer_valid:=false;END IF;
     END LOOP;
    END LOOP;
   END IF;
   IF pair_count=0 THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');structured_offer_valid:=false;END IF;
   structured_authority:=pair_count>0 AND structured_offer_valid;
   BEGIN price:=((raw->>'raw_price_evidence')::jsonb)->'flight_price';EXCEPTION WHEN invalid_text_representation THEN price:=NULL;reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_INVALID');END;
   IF price IS NOT NULL AND price<>'null'::jsonb THEN
    n:=twuanis_canonical_private.price_integrity_number(price#>>'{amount,value}');c:=twuanis_canonical_private.price_integrity_currency(price->'currency');
    IF n IS NULL OR c IS NULL OR n IS DISTINCT FROM amount OR c IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_CONTRADICTION');END IF;
   END IF;
  END IF;
 END IF;
 
IF NOT coalesce(owner_assertion,false) THEN
IF NOT coalesce(owner_assertion,false) THEN
-- A trusted scraper observation remains subject to the retained identity,
-- eligibility, transaction, amount, currency, and textual-consistency gates.
-- It can establish structured price authority when the original source URL and
-- observation timestamp are bound to the retained exact price pair.
BEGIN
 price_evidence:=(raw->>'raw_price_evidence')::jsonb;
EXCEPTION WHEN invalid_text_representation THEN
 price_evidence:=NULL;
END;
IF jsonb_typeof(price_evidence)='object'
   AND price_evidence->>'source_url'=raw->>'source_url'
   AND price_evidence->>'observed_at'=raw->>'observed_at'
   AND jsonb_typeof(price_evidence->'flight_price')='object'
   AND coalesce(price_evidence->'flight_price'->>'source_label','')<>''
   AND coalesce(price_evidence->'flight_price'->>'source_value','')<>'' THEN
 n:=twuanis_canonical_private.price_integrity_number(price_evidence#>>'{flight_price,amount,value}');
 c:=twuanis_canonical_private.price_integrity_currency(price_evidence->'flight_price'->'currency');
 IF n IS NOT NULL AND c IS NOT NULL AND n=amount AND c=l.currency THEN
  scraper_price_valid:=true;
  reasons:=array_remove(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');
  structured_authority:=true;
 ELSE
  reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_CONTRADICTION');
 END IF;
ELSE
 reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_INVALID');
END IF;
END IF;
END IF;
IF l.source_name = 'encuentra24'
   AND l.listing_origin = 'imported'
   AND l.owner_id IS NULL
   AND l.publisher_account_id IS NULL
   AND NOT coalesce(owner_assertion, false)
   AND scraper_price_valid
   AND retained.id IS NOT NULL
   AND cardinality(reasons) = 0
THEN
  text_reasons := ARRAY[]::text[];
ELSE
  text_reasons :=
    twuanis_canonical_private.price_integrity_texts(
      texts,
      l.transaction_type,
      amount,
      l.currency
    );
END IF;

 IF structured_authority THEN text_reasons:=array_remove(text_reasons,'PRICE_TEXT_MALFORMED_OR_AMBIGUOUS');END IF;
 reasons:=reasons||text_reasons;
 reasons:=ARRAY(SELECT DISTINCT x FROM unnest(reasons)x ORDER BY x);
 RETURN jsonb_build_object('status',CASE WHEN cardinality(reasons)=0 THEN 'APPROVED'ELSE 'REJECTED'END,'reasons',to_jsonb(reasons),'monetary_event',m.id,'source_observation',observation.id,'retained_evidence',retained.id,'source_disposition',eligibility->>'status','source_reasons',eligibility->'reasons','assertion_kind',CASE WHEN owner_assertion THEN 'authenticated_owner_asking_price'ELSE 'retained_source_asking_price'END,'transaction',l.transaction_type,'amount',amount,'currency',l.currency);
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.decide_listing_price(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '26c0f8f2824efa8d99c3150c1fda6d98' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.decide_listing_price(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.decide_listing_price_before_evidence_v2(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.decide_listing_price_before_evidence_v2(l listings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
 amount numeric:=CASE l.transaction_type WHEN 'sale'THEN l.current_price ELSE l.monthly_price END;
 reasons text[]:='{}';m public.listing_monetary_events; observation public.listing_source_observations; retained twuanis_canonical_private.csv_source_evidence;
 raw jsonb; eligibility jsonb; products jsonb; product jsonb; offer jsonb; pair_count integer:=0; price jsonb; n numeric; c text; texts text[]:=ARRAY[l.title,l.description]; owner_assertion boolean:=false;
 structured_offer_valid boolean:=true; structured_authority boolean:=false; scraper_price_valid boolean:=false; price_evidence jsonb; text_reasons text[];
BEGIN
 IF amount IS NULL OR amount<=0 OR NOT twuanis_canonical_private.finite_numeric(amount)THEN reasons:=array_append(reasons,'PRICE_MISSING_OR_INVALID');END IF;
 IF l.currency IS NULL OR l.currency NOT IN('USD','CRC')THEN reasons:=array_append(reasons,'PRICE_CURRENCY_UNSUPPORTED');END IF;
 IF l.transaction_type NOT IN('sale','rent')OR l.transaction_type IS NULL THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_UNSUPPORTED');END IF;
 IF (l.transaction_type='sale'AND l.monthly_price IS NOT NULL)OR(l.transaction_type='rent'AND l.current_price IS NOT NULL)THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
 SELECT * INTO m FROM public.listing_monetary_events e WHERE e.listing_id=l.id ORDER BY e.listing_revision DESC,e.recorded_at DESC,e.id DESC LIMIT 1;
 IF m.id IS NULL OR (m.new_amount,m.new_currency,m.transaction_type)IS DISTINCT FROM(amount,l.currency,l.transaction_type)THEN reasons:=array_append(reasons,'PRICE_CANONICAL_ASSERTION_MISSING');END IF;
 owner_assertion:=m.actor_kind='owner'AND l.owner_id IS NOT NULL AND m.actor_identity=l.owner_id::text;
 IF NOT coalesce(owner_assertion,false)THEN
  SELECT * INTO observation FROM public.listing_source_observations s WHERE s.listing_id=l.id AND s.outcome='accepted' ORDER BY s.result_revision DESC,s.processed_at DESC,s.id DESC LIMIT 1;
  SELECT * INTO retained FROM twuanis_canonical_private.csv_source_evidence e WHERE e.source_name=l.source_name AND e.source_listing_id=l.source_listing_id AND e.source_observation_id=observation.source_observation_id;
  IF retained.id IS NULL THEN reasons:=array_append(reasons,'PRICE_RETAINED_SOURCE_EVIDENCE_REQUIRED');
  ELSE
   raw:=retained.raw_input;
   IF (raw->>'source_name',raw->>'source_listing_id',raw->>'observation_id')IS DISTINCT FROM(l.source_name,l.source_listing_id,observation.source_observation_id)THEN reasons:=array_append(reasons,'PRICE_SOURCE_IDENTITY_MISMATCH');END IF;
   IF raw->>'transaction_type'IS DISTINCT FROM l.transaction_type THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   n:=twuanis_canonical_private.price_integrity_number(CASE l.transaction_type WHEN 'sale'THEN raw->>'current_price'ELSE raw->>'monthly_price'END);
   IF n IS DISTINCT FROM amount OR raw->>'currency'IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_RETAINED_PAIR_MISMATCH');END IF;
   IF l.transaction_type='sale'AND coalesce(raw->>'monthly_price','')<>''THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   BEGIN eligibility:=(raw->>'collection_eligibility')::jsonb;EXCEPTION WHEN invalid_text_representation THEN eligibility:=NULL;END;
   IF eligibility->>'status'IS DISTINCT FROM 'ELIGIBLE'OR jsonb_typeof(eligibility->'reasons')IS DISTINCT FROM 'array'OR jsonb_array_length(eligibility->'reasons')<>0 THEN reasons:=array_append(reasons,'PRICE_REJECTED_OR_QUARANTINED_SOURCE');END IF;
   IF l.transaction_type='rent'AND coalesce(raw->>'current_price','')<>''THEN reasons:=array_append(reasons,'PRICE_TRANSACTION_MIXING');END IF;
   texts:=texts||ARRAY[raw->>'title',raw->>'description'];
   BEGIN products:=(raw->>'raw_jsonld')::jsonb;EXCEPTION WHEN invalid_text_representation THEN products:=NULL;reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');END;
   IF jsonb_typeof(products)IS DISTINCT FROM 'array'THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');
   ELSE
    FOR product IN SELECT value FROM jsonb_array_elements(products)LOOP
     IF product->>'@type'<>'Product'THEN CONTINUE;END IF;texts:=array_append(texts,product->>'description');
     FOR offer IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(product->'offers')='array'THEN product->'offers'ELSE jsonb_build_array(product->'offers')END)LOOP
      pair_count:=pair_count+1;n:=twuanis_canonical_private.price_integrity_number(offer->>'price');c:=twuanis_canonical_private.price_integrity_currency(offer->'priceCurrency');
      IF n IS NULL OR c IS NULL OR n IS DISTINCT FROM amount OR c IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_PAIR_CONTRADICTION');structured_offer_valid:=false;END IF;
     END LOOP;
    END LOOP;
   END IF;
   IF pair_count=0 THEN reasons:=array_append(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');structured_offer_valid:=false;END IF;
   structured_authority:=pair_count>0 AND structured_offer_valid;
   BEGIN price:=((raw->>'raw_price_evidence')::jsonb)->'flight_price';EXCEPTION WHEN invalid_text_representation THEN price:=NULL;reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_INVALID');END;
   IF price IS NOT NULL AND price<>'null'::jsonb THEN
    n:=twuanis_canonical_private.price_integrity_number(price#>>'{amount,value}');c:=twuanis_canonical_private.price_integrity_currency(price->'currency');
    IF n IS NULL OR c IS NULL OR n IS DISTINCT FROM amount OR c IS DISTINCT FROM l.currency THEN reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_CONTRADICTION');END IF;
   END IF;
  END IF;
 END IF;
 
IF NOT coalesce(owner_assertion,false) THEN
IF NOT coalesce(owner_assertion,false) THEN
-- A trusted scraper observation remains subject to the retained identity,
-- eligibility, transaction, amount, currency, and textual-consistency gates.
-- It can establish structured price authority when the original source URL and
-- observation timestamp are bound to the retained exact price pair.
BEGIN
 price_evidence:=(raw->>'raw_price_evidence')::jsonb;
EXCEPTION WHEN invalid_text_representation THEN
 price_evidence:=NULL;
END;
IF jsonb_typeof(price_evidence)='object'
   AND price_evidence->>'source_url'=raw->>'source_url'
   AND price_evidence->>'observed_at'=raw->>'observed_at'
   AND jsonb_typeof(price_evidence->'flight_price')='object'
   AND coalesce(price_evidence->'flight_price'->>'source_label','')<>''
   AND coalesce(price_evidence->'flight_price'->>'source_value','')<>'' THEN
 n:=twuanis_canonical_private.price_integrity_number(price_evidence#>>'{flight_price,amount,value}');
 c:=twuanis_canonical_private.price_integrity_currency(price_evidence->'flight_price'->'currency');
 IF n IS NOT NULL AND c IS NOT NULL AND n=amount AND c=l.currency THEN
  scraper_price_valid:=true;
  reasons:=array_remove(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');
  structured_authority:=true;
 ELSE
  reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_CONTRADICTION');
 END IF;
ELSE
 reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_INVALID');
END IF;
END IF;
END IF;
IF l.source_name = 'encuentra24'
   AND l.listing_origin = 'imported'
   AND l.owner_id IS NULL
   AND l.publisher_account_id IS NULL
   AND NOT coalesce(owner_assertion, false)
   AND scraper_price_valid
   AND retained.id IS NOT NULL
   AND cardinality(reasons) = 0
THEN
  text_reasons := ARRAY[]::text[];
ELSE
  text_reasons :=
    twuanis_canonical_private.price_integrity_texts(
      texts,
      l.transaction_type,
      amount,
      l.currency
    );
END IF;

 IF structured_authority THEN text_reasons:=array_remove(text_reasons,'PRICE_TEXT_MALFORMED_OR_AMBIGUOUS');END IF;
 reasons:=reasons||text_reasons;
 reasons:=ARRAY(SELECT DISTINCT x FROM unnest(reasons)x ORDER BY x);
 RETURN jsonb_build_object('status',CASE WHEN cardinality(reasons)=0 THEN 'APPROVED'ELSE 'REJECTED'END,'reasons',to_jsonb(reasons),'monetary_event',m.id,'source_observation',observation.id,'retained_evidence',retained.id,'source_disposition',eligibility->>'status','source_reasons',eligibility->'reasons','assertion_kind',CASE WHEN owner_assertion THEN 'authenticated_owner_asking_price'ELSE 'retained_source_asking_price'END,'transaction',l.transaction_type,'amount',amount,'currency',l.currency);
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.decide_listing_price_before_evidence_v2(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.decide_listing_price_before_evidence_v2(listings) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '68820b358eea7852478641d8ffc96bb2' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.decide_listing_price_before_evidence_v2(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.evaluate_transaction_price_evidence(text,text,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.evaluate_transaction_price_evidence(description text, canonical_transaction text, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    prepared text;
    statements jsonb;
    relevant_text text;
    alternative_statements jsonb;
    matching_count integer;
    result jsonb;
BEGIN
    prepared :=
        twuanis_canonical_private
        .prepare_advertised_price_text(description);

    statements :=
        twuanis_canonical_private
        .extract_advertised_price_statements(prepared);

    SELECT count(*)
    INTO matching_count
    FROM jsonb_array_elements(statements) AS t(value)
    WHERE value->>'transaction_type' =
          canonical_transaction;

    IF matching_count = 0 THEN
        RETURN twuanis_canonical_private
            .evaluate_advertised_price_evidence(
                prepared,
                canonical_transaction,
                canonical_amount,
                canonical_currency
            );
    END IF;

    SELECT coalesce(
        jsonb_agg(value ORDER BY ordinal),
        '[]'::jsonb
    )
    INTO alternative_statements
    FROM jsonb_array_elements(statements)
        WITH ORDINALITY AS t(value, ordinal)
    WHERE value->>'transaction_type' IS NOT NULL
      AND value->>'transaction_type'
          <> canonical_transaction;

    SELECT string_agg(
        value->>'statement',
        chr(10)
        ORDER BY ordinal
    )
    INTO relevant_text
    FROM jsonb_array_elements(statements)
        WITH ORDINALITY AS t(value, ordinal)
    WHERE value->>'transaction_type' IS NULL
       OR value->>'transaction_type' =
          canonical_transaction;

    result :=
        twuanis_canonical_private
        .evaluate_advertised_price_evidence(
            relevant_text,
            canonical_transaction,
            canonical_amount,
            canonical_currency
        );

    RETURN result || jsonb_build_object(
        'alternative_transaction_statements',
        alternative_statements,
        'alternative_transaction_count',
        jsonb_array_length(alternative_statements)
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.evaluate_transaction_price_evidence(text,text,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.evaluate_transaction_price_evidence(text,text,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '8538bd1c1eec007729fa24646365f6aa' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.evaluate_transaction_price_evidence(text,text,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.initialize_price_integrity_current(integer)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.initialize_price_integrity_current(p_batch_size integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    candidate record;
    result jsonb;

    processed integer := 0;
    eligible integer := 0;
    ineligible integer := 0;
    failed integer := 0;

    failures jsonb := '[]'::jsonb;
BEGIN
    IF p_batch_size IS NULL
       OR p_batch_size NOT BETWEEN 1 AND 500
    THEN
        RAISE EXCEPTION 'INVALID_BATCH_SIZE';
    END IF;

    FOR candidate IN
        SELECT l.id
        FROM public.listings l
        WHERE l.listing_status = 'active'
          AND l.canonical_domain_version = 1
          AND NOT EXISTS (
              SELECT 1
              FROM twuanis_canonical_private
                  .listing_price_integrity_current c
              WHERE c.listing_id = l.id
                AND c.canonical_revision =
                    l.canonical_revision
                AND c.evaluator_version = 4
          )
        ORDER BY l.id
        LIMIT p_batch_size
        FOR UPDATE OF l SKIP LOCKED
    LOOP
        BEGIN
            result := twuanis_canonical_private
                .refresh_current_price_integrity(
                    candidate.id
                );

            IF result->>'freshness_status'
               IS DISTINCT FROM 'CURRENT'
            THEN
                RAISE EXCEPTION
                    'CURRENT_EVIDENCE_REQUIRED: %',
                    result;
            END IF;

            processed := processed + 1;

            IF coalesce(
                (result->>'analytical_eligible')::boolean,
                false
            ) THEN
                eligible := eligible + 1;
            ELSE
                ineligible := ineligible + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            failed := failed + 1;

            failures := failures || jsonb_build_array(
                jsonb_build_object(
                    'listing_id', candidate.id,
                    'sqlstate', SQLSTATE,
                    'error', SQLERRM
                )
            );
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'requested_batch_size', p_batch_size,
        'processed', processed,
        'eligible', eligible,
        'ineligible', ineligible,
        'failed', failed,
        'failures', failures
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.initialize_price_integrity_current(integer) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.initialize_price_integrity_current(integer) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '93a83b11bdf63f2a2735cf7630de6524' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.initialize_price_integrity_current(integer)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.evaluate_complete_price_text(text,text,numeric,text)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.evaluate_complete_price_text(description text, canonical_transaction text, canonical_amount numeric, canonical_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    result jsonb;
    statement jsonb;
    statement_reasons text[];
    reasons text[] := ARRAY[]::text[];
    evaluated jsonb := '[]'::jsonb;
    advertised_currency text;
    consistent_count integer := 0;
    conflict_count integer := 0;
    unresolved_count integer := 0;
BEGIN
    result :=
        twuanis_canonical_private
        .evaluate_transaction_price_evidence(
            description,
            canonical_transaction,
            canonical_amount,
            canonical_currency
        );

    IF result->>'status' = 'NO_TEXTUAL_EVIDENCE'
    THEN
        RETURN result;
    END IF;

    FOR statement IN
        SELECT value
        FROM jsonb_array_elements(
            coalesce(
                result->'statements',
                '[]'::jsonb
            )
        )
    LOOP
        SELECT coalesce(
            array_agg(value),
            ARRAY[]::text[]
        )
        INTO statement_reasons
        FROM jsonb_array_elements_text(
            coalesce(
                statement->'reasons',
                '[]'::jsonb
            )
        );

        advertised_currency :=
            statement->>'currency';

        IF advertised_currency IN ('CRC', 'USD')
           AND upper(btrim(canonical_currency))
               IN ('CRC', 'USD')
           AND advertised_currency <>
               upper(btrim(canonical_currency))
        THEN
            statement_reasons := array_append(
                statement_reasons,
                'ADVERTISED_CURRENCY_CONFLICT'
            );
        END IF;

        SELECT coalesce(
            array_agg(DISTINCT reason ORDER BY reason),
            ARRAY[]::text[]
        )
        INTO statement_reasons
        FROM unnest(statement_reasons) AS t(reason);

        IF statement_reasons && ARRAY[
            'ADVERTISED_TRANSACTION_CONFLICT',
            'ADVERTISED_CURRENCY_CONFLICT',
            'ADVERTISED_AMOUNT_CONFLICT'
        ]::text[]
        THEN
            conflict_count := conflict_count + 1;

        ELSIF cardinality(statement_reasons) > 0 THEN
            unresolved_count := unresolved_count + 1;

        ELSE
            consistent_count := consistent_count + 1;
        END IF;

        reasons := reasons || statement_reasons;

        evaluated := evaluated ||
            jsonb_build_array(
                statement || jsonb_build_object(
                    'reasons',
                    to_jsonb(statement_reasons)
                )
            );
    END LOOP;

    SELECT coalesce(
        array_agg(DISTINCT reason ORDER BY reason),
        ARRAY[]::text[]
    )
    INTO reasons
    FROM unnest(reasons) AS t(reason);

    RETURN result || jsonb_build_object(
        'status', CASE
            WHEN conflict_count > 0
                THEN 'CONFLICTING_EVIDENCE'
            WHEN unresolved_count > 0
                THEN 'UNRESOLVED_EVIDENCE'
            ELSE 'CONSISTENT'
        END,
        'reasons', to_jsonb(reasons),
        'statements', evaluated,
        'consistent_count', consistent_count,
        'conflict_count', conflict_count,
        'unresolved_count', unresolved_count
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.evaluate_complete_price_text(text,text,numeric,text) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.evaluate_complete_price_text(text,text,numeric,text) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '8b66fa07d5beec361960e0c74eac279e' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.evaluate_complete_price_text(text,text,numeric,text)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.decide_listing_price_v2(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.decide_listing_price_v2(l listings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    original_decision jsonb;
    blocking_reasons text[] := ARRAY[]::text[];
    review_reasons text[] := ARRAY[]::text[];
    supplementary_reasons text[] := ARRAY[]::text[];

    reason text;
    amount numeric;
    owner_assertion boolean;

    retained twuanis_canonical_private.csv_source_evidence;
    raw jsonb;
    product jsonb;

    evidence_format text;
    structured_result jsonb;
    jsonld_result jsonb;
    advertised_result jsonb;

    integrity_status text;
BEGIN
    amount := CASE l.transaction_type
        WHEN 'sale' THEN l.current_price
        WHEN 'rent' THEN l.monthly_price
    END;

    original_decision :=
        twuanis_canonical_private
        .decide_listing_price_before_evidence_v2(l);

    owner_assertion :=
        original_decision->>'assertion_kind'
        = 'authenticated_owner_asking_price';

    -- Preserve mandatory canonical requirements.
    -- Separate existing textual findings from rejection authority.

    FOR reason IN
        SELECT value
        FROM jsonb_array_elements_text(
            coalesce(
                original_decision->'reasons',
                '[]'::jsonb
            )
        )
    LOOP
        IF left(reason, 11) = 'PRICE_TEXT_' THEN

            supplementary_reasons := array_append(
                supplementary_reasons,
                reason
            );

        ELSE

            blocking_reasons := array_append(
                blocking_reasons,
                reason
            );

        END IF;
    END LOOP;

    -- Authenticated owner assertions are not subject
    -- to external source evidence requirements.

    IF coalesce(owner_assertion, false) THEN

        evidence_format := 'AUTHENTICATED_OWNER';

        structured_result := jsonb_build_object(
            'status', 'NOT_APPLICABLE'
        );

        jsonld_result := jsonb_build_object(
            'status', 'NOT_APPLICABLE'
        );

        advertised_result := jsonb_build_object(
            'status', 'NOT_APPLICABLE'
        );

    ELSE

        SELECT *
        INTO retained
        FROM twuanis_canonical_private.csv_source_evidence e
        WHERE e.id::text =
            original_decision->>'retained_evidence';

        IF retained.id IS NOT NULL THEN

            raw := retained.raw_input;

            evidence_format :=
                twuanis_canonical_private
                .price_evidence_format(raw);

            product :=
                twuanis_canonical_private
                .read_price_jsonld_product(raw);

            jsonld_result :=
                twuanis_canonical_private
                .validate_json_ld_price_evidence(
                    product->'offers',
                    amount,
                    l.currency
                );

            CASE evidence_format

                WHEN 'CURRENT_SOURCE_PAIR' THEN

                    structured_result :=
                        twuanis_canonical_private
                        .validate_current_price_evidence(
                            raw,
                            amount,
                            l.currency
                        );

                    IF structured_result->>'status'
                        IS DISTINCT FROM 'CONSISTENT'
                    THEN
                        blocking_reasons := array_append(
                            blocking_reasons,
                            'PRICE_CURRENT_EVIDENCE_NOT_VALIDATED'
                        );
                    END IF;

                WHEN 'LEGACY_STRUCTURED_PAIR' THEN

                    structured_result :=
                        twuanis_canonical_private
                        .validate_legacy_price_evidence(
                            raw,
                            amount,
                            l.currency
                        );

                    review_reasons := array_append(
                        review_reasons,
                        'PRICE_HISTORICAL_FORMAT_REQUIRES_AUTHORIZATION'
                    );

                WHEN 'LEGACY_NO_PRICE_OBJECT' THEN

                    structured_result :=
                        jsonb_build_object(
                            'status',
                            'HISTORICAL_JSONLD_FALLBACK'
                        );

                    review_reasons := array_append(
                        review_reasons,
                        'PRICE_HISTORICAL_FORMAT_REQUIRES_AUTHORIZATION'
                    );

                ELSE

                    structured_result :=
                        jsonb_build_object(
                            'status',
                            'UNRECOGNIZED_EVIDENCE'
                        );

                    review_reasons := array_append(
                        review_reasons,
                        'PRICE_EVIDENCE_FORMAT_UNRESOLVED'
                    );

            END CASE;

            advertised_result :=
                twuanis_canonical_private
                .evaluate_complete_price_text(
                    coalesce(
                        nullif(product->>'description', ''),
                        raw->>'description'
                    ),
                    l.transaction_type,
                    amount,
                    l.currency
                );

            IF advertised_result->>'status'
                = 'CONFLICTING_EVIDENCE'
            THEN
                review_reasons := array_append(
                    review_reasons,
                    'PRICE_ADVERTISER_DISCREPANCY'
                );

            ELSIF advertised_result->>'status'
                = 'UNRESOLVED_EVIDENCE'
            THEN
                supplementary_reasons := array_append(
                    supplementary_reasons,
                    'PRICE_ADVERTISER_EVIDENCE_UNRESOLVED'
                );
            END IF;

        ELSE

            evidence_format := 'MISSING_RETAINED_EVIDENCE';

            structured_result := jsonb_build_object(
                'status', 'INSUFFICIENT_EVIDENCE'
            );

            jsonld_result := jsonb_build_object(
                'status', 'INSUFFICIENT_EVIDENCE'
            );

            advertised_result := jsonb_build_object(
                'status', 'NOT_AVAILABLE'
            );

        END IF;

    END IF;

    SELECT ARRAY(
        SELECT DISTINCT x
        FROM unnest(blocking_reasons) AS t(x)
        ORDER BY x
    )
    INTO blocking_reasons;

    SELECT ARRAY(
        SELECT DISTINCT x
        FROM unnest(review_reasons) AS t(x)
        ORDER BY x
    )
    INTO review_reasons;

    SELECT ARRAY(
        SELECT DISTINCT x
        FROM unnest(supplementary_reasons) AS t(x)
        ORDER BY x
    )
    INTO supplementary_reasons;

    integrity_status := CASE
        WHEN cardinality(blocking_reasons) > 0
            THEN 'REJECTED'
        WHEN cardinality(review_reasons) > 0
            THEN 'REVIEW_REQUIRED'
        ELSE 'APPROVED'
    END;

    RETURN original_decision || jsonb_build_object(
        'evaluator_version', 2,
        'listing_id', l.id,
        'status', integrity_status,
        'reasons', to_jsonb(blocking_reasons),
        'blocking_reasons', to_jsonb(blocking_reasons),
        'review_reasons', to_jsonb(review_reasons),
        'supplementary_reasons',
            to_jsonb(supplementary_reasons),
        'publication_allowed',
            cardinality(blocking_reasons) = 0,
        'analytical_eligible',
            integrity_status = 'APPROVED',
        'evidence_format', evidence_format,
        'structured_evidence', structured_result,
        'jsonld_evidence', jsonld_result,
        'advertised_evidence', advertised_result,
        'original_decision', original_decision
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.decide_listing_price_v2(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.decide_listing_price_v2(listings) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '08d346af1a3546561670f85e36df8ff3' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.decide_listing_price_v2(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.decide_listing_price_v3(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.decide_listing_price_v3(l listings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    decision jsonb;

    blocking_reasons text[];
    review_reasons text[];
    supplementary_reasons text[];

    historical_registered boolean := false;
    historical_qualified boolean := false;

    evidence_format text;
    structured_status text;
    jsonld_status text;
    integrity_status text;
BEGIN
    decision :=
        twuanis_canonical_private
        .decide_listing_price_v2(l);

    evidence_format :=
        decision->>'evidence_format';

    structured_status :=
        decision->'structured_evidence'->>'status';

    jsonld_status :=
        decision->'jsonld_evidence'->>'status';

    blocking_reasons := ARRAY(
        SELECT value
        FROM jsonb_array_elements_text(
            decision->'blocking_reasons'
        )
    );

    review_reasons := ARRAY(
        SELECT value
        FROM jsonb_array_elements_text(
            decision->'review_reasons'
        )
    );

    supplementary_reasons := ARRAY(
        SELECT value
        FROM jsonb_array_elements_text(
            decision->'supplementary_reasons'
        )
    );

    IF l.listing_origin = 'imported'
       AND l.source_name = 'encuentra24'
       AND decision->>'assertion_kind' =
           'retained_source_asking_price'
    THEN

        SELECT EXISTS (
            SELECT 1
            FROM twuanis_canonical_private
                .price_historical_evidence_registry r
            WHERE r.listing_id = l.id
              AND r.source_name = l.source_name
              AND r.source_listing_id =
                  l.source_listing_id
              AND r.retained_evidence_id =
                  decision->'original_decision'
                      ->>'retained_evidence'
              AND r.evidence_format = (decision->>'evidence_format')
        )
        INTO historical_registered;

        IF historical_registered THEN

            historical_qualified := coalesce(
                CASE evidence_format

                    WHEN 'LEGACY_STRUCTURED_PAIR' THEN
                        structured_status = 'CONSISTENT'
                        AND jsonld_status = 'CONSISTENT'

                    WHEN 'LEGACY_NO_PRICE_OBJECT' THEN
                        jsonld_status = 'CONSISTENT'

                    ELSE false

                END,
                false
            );

            IF historical_qualified THEN

                blocking_reasons := array_remove(
                    blocking_reasons,
                    'PRICE_SOURCE_PAIR_INVALID'
                );

                review_reasons := array_remove(
                    review_reasons,
                    'PRICE_HISTORICAL_FORMAT_REQUIRES_AUTHORIZATION'
                );

            END IF;

        END IF;

    END IF;

    integrity_status := CASE
        WHEN cardinality(blocking_reasons) > 0
            THEN 'REJECTED'

        WHEN cardinality(review_reasons) > 0
            THEN 'REVIEW_REQUIRED'

        ELSE 'APPROVED'
    END;

    RETURN decision || jsonb_build_object(
        'evaluator_version', 3,

        'status', integrity_status,

        'reasons',
            to_jsonb(blocking_reasons),

        'blocking_reasons',
            to_jsonb(blocking_reasons),

        'review_reasons',
            to_jsonb(review_reasons),

        'supplementary_reasons',
            to_jsonb(supplementary_reasons),

        'historical_registered',
            historical_registered,

        'historical_qualified',
            historical_qualified,

        'publication_allowed',
            cardinality(blocking_reasons) = 0,

        'analytical_eligible',
            integrity_status = 'APPROVED'
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.decide_listing_price_v3(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.decide_listing_price_v3(listings) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '014325bce648a5109f053481d40c6554' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.decide_listing_price_v3(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.decide_listing_price_v4(listings)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.decide_listing_price_v4(l listings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    decision jsonb;

    blocking_reasons text[];
    review_reasons text[];
    mandatory_review_reasons text[];
    supplementary_review_reasons text[];

    integrity_status text;
    publication_allowed boolean;
    analytical_eligible boolean;
BEGIN
    decision :=
        twuanis_canonical_private
        .decide_listing_price_v3(l);

    blocking_reasons := ARRAY(
        SELECT value
        FROM jsonb_array_elements_text(
            decision->'blocking_reasons'
        )
    );

    review_reasons := ARRAY(
        SELECT value
        FROM jsonb_array_elements_text(
            decision->'review_reasons'
        )
    );

    supplementary_review_reasons := ARRAY(
        SELECT reason
        FROM unnest(review_reasons) AS t(reason)
        WHERE reason = 'PRICE_ADVERTISER_DISCREPANCY'
    );

    mandatory_review_reasons := ARRAY(
        SELECT reason
        FROM unnest(review_reasons) AS t(reason)
        WHERE reason <> 'PRICE_ADVERTISER_DISCREPANCY'
    );

    integrity_status := CASE
        WHEN cardinality(blocking_reasons) > 0
            THEN 'REJECTED'

        WHEN cardinality(review_reasons) > 0
            THEN 'REVIEW_REQUIRED'

        ELSE 'APPROVED'
    END;

    publication_allowed :=
        cardinality(blocking_reasons) = 0
        AND cardinality(mandatory_review_reasons) = 0;

    analytical_eligible :=
        publication_allowed;

    RETURN decision || jsonb_build_object(
        'evaluator_version', 4,

        'status', integrity_status,

        'mandatory_review_reasons',
            to_jsonb(mandatory_review_reasons),

        'supplementary_review_reasons',
            to_jsonb(supplementary_review_reasons),

        'publication_allowed',
            publication_allowed,

        'analytical_eligible',
            analytical_eligible,

        'supplementary_review_required',
            cardinality(supplementary_review_reasons) > 0,

        'mandatory_review_required',
            cardinality(mandatory_review_reasons) > 0
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.decide_listing_price_v4(listings) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.decide_listing_price_v4(listings) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'a82752de10b94dc9c2cfc67a7ed836a7' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.decide_listing_price_v4(listings)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.guard_listing_price_integrity()'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.guard_listing_price_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE decision jsonb; final_row public.listings;
BEGIN
 -- Validate final transaction state: the existing atomic edit writes money then text.
 SELECT * INTO final_row FROM public.listings WHERE id=NEW.id;
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF final_row.canonical_domain_version IS DISTINCT FROM 1 THEN
  IF final_row.listing_status='active'AND(TG_OP='INSERT'OR OLD.listing_status IS DISTINCT FROM 'active'OR(final_row.current_price,final_row.monthly_price,final_row.currency,final_row.title,final_row.description)IS DISTINCT FROM(OLD.current_price,OLD.monthly_price,OLD.currency,OLD.title,OLD.description))THEN RAISE EXCEPTION 'PRICE_INTEGRITY_REJECTED: PRICE_CANONICAL_IDENTITY_REQUIRED' USING ERRCODE='23514';END IF;
  RETURN NULL;
 END IF;
 IF TG_OP='UPDATE'AND OLD.canonical_domain_version=1 AND
 (final_row.transaction_type,final_row.current_price,final_row.monthly_price,final_row.currency,final_row.title,final_row.description,final_row.last_scraped)IS NOT DISTINCT FROM(OLD.transaction_type,OLD.current_price,OLD.monthly_price,OLD.currency,OLD.title,OLD.description,OLD.last_scraped)
 AND NOT(final_row.listing_status='active'AND(OLD.listing_status IS DISTINCT FROM 'active'OR final_row.publication_expires_at IS DISTINCT FROM OLD.publication_expires_at))THEN RETURN NULL;END IF;
 decision:=twuanis_canonical_private.decide_listing_price_v4(final_row);
 IF NOT coalesce((decision->>'publication_allowed')::boolean,false) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='PRICE_INTEGRITY_REJECTED: '||(decision->'reasons')::text,DETAIL=decision::text;END IF;
 RETURN NULL;
END $function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_listing_price_integrity() FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'a71e1fb95d82a897acbee9742c951347' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.guard_listing_price_integrity()'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.record_listing_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.record_listing_price_integrity(p_listing_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    l public.listings;
    o public.listing_source_observations;
    e twuanis_canonical_private.csv_source_evidence;

    d jsonb;
    evidence_id uuid;
    amount numeric;
    retained_fingerprint text;
BEGIN
    SELECT *
    INTO STRICT l
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF l.canonical_domain_version IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION
            'UNSUPPORTED_CANONICAL_DOMAIN_VERSION';
    END IF;

    amount := CASE l.transaction_type
        WHEN 'sale' THEN l.current_price
        WHEN 'rent' THEN l.monthly_price
    END;

    d := twuanis_canonical_private
        .decide_listing_price_v4(l);

    IF d->>'assertion_kind' =
        'retained_source_asking_price'
    THEN

        IF d->>'source_observation' IS NOT NULL THEN

            SELECT *
            INTO STRICT o
            FROM public.listing_source_observations
            WHERE id =
                (d->>'source_observation')::uuid;

            IF o.listing_id IS DISTINCT FROM l.id
               OR o.source_name IS DISTINCT FROM
                  l.source_name
               OR o.source_listing_id IS DISTINCT FROM
                  l.source_listing_id
               OR o.outcome IS DISTINCT FROM 'accepted'
               OR o.result_revision IS NULL
               OR o.result_revision > l.canonical_revision
            THEN
                RAISE EXCEPTION
                    'PRICE_OBSERVATION_IDENTITY_INVALID';
            END IF;

        END IF;

        IF d->>'retained_evidence' IS NOT NULL THEN

            SELECT *
            INTO STRICT e
            FROM twuanis_canonical_private
                .csv_source_evidence
            WHERE id =
                (d->>'retained_evidence')::uuid;

            IF o.id IS NULL
               OR e.source_name IS DISTINCT FROM
                  l.source_name
               OR e.source_listing_id IS DISTINCT FROM
                  l.source_listing_id
               OR e.source_observation_id IS DISTINCT FROM
                  o.source_observation_id
            THEN
                RAISE EXCEPTION
                    'PRICE_RETAINED_EVIDENCE_IDENTITY_INVALID';
            END IF;

            retained_fingerprint := encode(
                sha256(
                    convert_to(
                        e.raw_input::text,
                        'UTF8'
                    )
                ),
                'hex'
            );

        END IF;

        IF coalesce(
            (d->>'analytical_eligible')::boolean,
            false
        )
        AND (
            o.id IS NULL
            OR e.id IS NULL
        )
        THEN
            RAISE EXCEPTION
                'ELIGIBLE_PRICE_WITHOUT_SOURCE_EVIDENCE';
        END IF;

    END IF;

    INSERT INTO twuanis_canonical_private
        .listing_price_integrity_evidence (
            listing_id,
            canonical_revision,
            canonical_domain_version,
            evaluator_version,
            transaction_type,
            asking_amount,
            currency,
            assertion_kind,
            source_name,
            source_listing_id,
            observation_id,
            source_observation_id,
            source_observed_at,
            observation_result_revision,
            observation_payload_fingerprint,
            retained_evidence_id,
            retained_evidence_fingerprint,
            evidence_format,
            integrity_status,
            publication_allowed,
            analytical_eligible,
            mandatory_review_required,
            supplementary_review_required,
            decision
        )
    VALUES (
        l.id,
        l.canonical_revision,
        l.canonical_domain_version,
        (d->>'evaluator_version')::integer,
        l.transaction_type,
        amount,
        l.currency,
        d->>'assertion_kind',
        l.source_name,
        l.source_listing_id,
        o.id,
        o.source_observation_id,
        o.source_observed_at,
        o.result_revision,
        o.payload_fingerprint,
        e.id,
        retained_fingerprint,
        d->>'evidence_format',
        d->>'status',
        (d->>'publication_allowed')::boolean,
        (d->>'analytical_eligible')::boolean,
        (d->>'mandatory_review_required')::boolean,
        (d->>'supplementary_review_required')::boolean,
        d
    )
    RETURNING id INTO evidence_id;

    RETURN evidence_id;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.record_listing_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.record_listing_price_integrity(uuid) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '791f5c2df1bed38aaac211bd6b49e47d' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.record_listing_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.backfill_listing_price_integrity(integer)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.backfill_listing_price_integrity(p_batch_size integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    candidate record;

    processed integer := 0;
    approved integer := 0;
    review_required integer := 0;
    rejected integer := 0;
    failed integer := 0;

    recorded_id uuid;
    recorded_status text;

    failures jsonb := '[]'::jsonb;
BEGIN
    IF p_batch_size IS NULL
       OR p_batch_size NOT BETWEEN 1 AND 500
    THEN
        RAISE EXCEPTION 'INVALID_BATCH_SIZE';
    END IF;

    FOR candidate IN

        SELECT l.id
        FROM public.listings l

        WHERE l.listing_status = 'active'
          AND l.canonical_domain_version = 1

          AND NOT EXISTS (
              SELECT 1
              FROM twuanis_canonical_private
                  .listing_price_integrity_evidence e

              WHERE e.listing_id = l.id
                AND e.canonical_revision =
                    l.canonical_revision
                AND e.evaluator_version = 4
          )

        ORDER BY l.id
        LIMIT p_batch_size
        FOR UPDATE OF l SKIP LOCKED

    LOOP
        BEGIN
            recorded_id :=
                twuanis_canonical_private
                .record_listing_price_integrity(
                    candidate.id
                );

            SELECT e.integrity_status
            INTO STRICT recorded_status

            FROM twuanis_canonical_private
                .listing_price_integrity_evidence e

            WHERE e.id = recorded_id;

            processed := processed + 1;

            CASE recorded_status
                WHEN 'APPROVED' THEN
                    approved := approved + 1;

                WHEN 'REVIEW_REQUIRED' THEN
                    review_required :=
                        review_required + 1;

                WHEN 'REJECTED' THEN
                    rejected := rejected + 1;
            END CASE;

        EXCEPTION WHEN OTHERS THEN

            failed := failed + 1;

            failures := failures ||
                jsonb_build_array(
                    jsonb_build_object(
                        'listing_id', candidate.id,
                        'sqlstate', SQLSTATE,
                        'error', SQLERRM
                    )
                );
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'requested_batch_size', p_batch_size,
        'processed', processed,
        'approved', approved,
        'review_required', review_required,
        'rejected', rejected,
        'failed', failed,
        'failures', failures
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.backfill_listing_price_integrity(integer) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.backfill_listing_price_integrity(integer) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '525aec24541c988448d6909301b66739' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.backfill_listing_price_integrity(integer)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.reevaluate_current_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.reevaluate_current_price_integrity(p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    l public.listings;
    result jsonb;
    new_evidence_id uuid;
    evaluation_performed boolean := false;
BEGIN
    SELECT *
    INTO l
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF l.id IS NULL
       OR l.listing_status IS DISTINCT FROM 'active'
       OR l.canonical_domain_version IS DISTINCT FROM 1
    THEN
        DELETE FROM twuanis_canonical_private
            .listing_price_integrity_current
        WHERE listing_id = p_listing_id;

        RETURN jsonb_build_object(
            'listing_id', p_listing_id,
            'status', 'NOT_APPLICABLE',
            'analytical_eligible', false,
            'evaluation_performed', false
        );
    END IF;

    result := twuanis_canonical_private
        .read_current_price_integrity(p_listing_id);

    IF result->>'freshness_status'
       IS DISTINCT FROM 'CURRENT'
       OR EXISTS (
           SELECT 1
           FROM twuanis_canonical_private
               .listing_price_integrity_current c
           WHERE c.listing_id = p_listing_id
             AND c.freshness_status = 'STALE_OR_INVALID'
       )
       OR EXISTS (
           SELECT 1
           FROM twuanis_canonical_private
               .price_integrity_pending p
           WHERE p.listing_id = p_listing_id
       )
    THEN
        new_evidence_id := twuanis_canonical_private
            .record_listing_price_integrity(p_listing_id);

        evaluation_performed := true;
    END IF;

    result := twuanis_canonical_private
        .refresh_current_price_integrity(p_listing_id);

    RETURN result || jsonb_build_object(
        'evaluation_performed', evaluation_performed,
        'new_evidence_id', new_evidence_id
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.reevaluate_current_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'ba8bfbbb06c60a3d2f23bbd585efe20f' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.reevaluate_current_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.process_pending_price_integrity(uuid)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.process_pending_price_integrity(p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    result jsonb;
    error_message text;
    error_state text;
BEGIN
    PERFORM 1
    FROM public.listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'LISTING_NOT_FOUND'
        );
    END IF;

    PERFORM 1
    FROM twuanis_canonical_private
        .price_integrity_pending
    WHERE listing_id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'listing_id', p_listing_id,
            'status', 'NO_PENDING_REQUEST'
        );
    END IF;

    BEGIN
        result := twuanis_canonical_private
            .reevaluate_current_price_integrity(
                p_listing_id
            );

        IF result->>'freshness_status' = 'CURRENT'
           OR result->>'status' = 'NOT_APPLICABLE'
        THEN
            DELETE FROM twuanis_canonical_private
                .price_integrity_pending
            WHERE listing_id = p_listing_id;

            RETURN result || jsonb_build_object(
                'processing_status', 'COMPLETED'
            );
        END IF;

        RAISE EXCEPTION
            'PRICE_INTEGRITY_FRESHNESS_UNRESOLVED: %',
            result;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
            error_message = MESSAGE_TEXT,
            error_state = RETURNED_SQLSTATE;

        UPDATE twuanis_canonical_private
            .listing_price_integrity_current
        SET
            analytical_eligible = false,
            freshness_status = 'STALE_OR_INVALID',
            verified_at = clock_timestamp()
        WHERE listing_id = p_listing_id;

        UPDATE twuanis_canonical_private
            .price_integrity_pending
        SET
            attempts = attempts + 1,
            last_attempt_at = clock_timestamp(),
            last_error = left(
                error_state || ': ' || error_message,
                4000
            )
        WHERE listing_id = p_listing_id;

        RETURN jsonb_build_object(
            'listing_id', p_listing_id,
            'processing_status', 'FAILED',
            'analytical_eligible', false,
            'sqlstate', error_state,
            'error', error_message
        );
    END;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.process_pending_price_integrity(uuid) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.process_pending_price_integrity(uuid) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '6f882b24614763baff03341990b5dc8b' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.process_pending_price_integrity(uuid)'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.execute_pending_price_integrity()'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.execute_pending_price_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
    PERFORM twuanis_canonical_private
        .process_pending_price_integrity(
            NEW.listing_id
        );

    RETURN NULL;
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.execute_pending_price_integrity() FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> '9eea145fa18ea2a77d0700be8c6fbb7e' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.execute_pending_price_integrity()'; END IF; END IF; END $$;
DO $$ DECLARE f regprocedure:=to_regprocedure('twuanis_canonical_private.retry_pending_price_integrity(integer)'); BEGIN IF f IS NULL THEN EXECUTE $twuanis_0$CREATE OR REPLACE FUNCTION twuanis_canonical_private.retry_pending_price_integrity(p_batch_size integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
    candidate record;
    result jsonb;

    processed integer := 0;
    completed integer := 0;
    failed integer := 0;
    skipped integer := 0;

    failures jsonb := '[]'::jsonb;
BEGIN
    IF p_batch_size IS NULL
       OR p_batch_size NOT BETWEEN 1 AND 500
    THEN
        RAISE EXCEPTION 'INVALID_BATCH_SIZE';
    END IF;

    FOR candidate IN
        SELECT l.id
        FROM public.listings l
        JOIN twuanis_canonical_private
            .price_integrity_pending p
          ON p.listing_id = l.id
        ORDER BY
            p.last_attempt_at NULLS FIRST,
            p.requested_at,
            l.id
        LIMIT p_batch_size
        FOR UPDATE OF l SKIP LOCKED
    LOOP
        result := twuanis_canonical_private
            .process_pending_price_integrity(
                candidate.id
            );

        processed := processed + 1;

        CASE result->>'processing_status'
            WHEN 'COMPLETED' THEN
                completed := completed + 1;

            WHEN 'FAILED' THEN
                failed := failed + 1;
                failures := failures ||
                    jsonb_build_array(result);

            ELSE
                skipped := skipped + 1;
        END CASE;
    END LOOP;

    RETURN jsonb_build_object(
        'requested_batch_size', p_batch_size,
        'processed', processed,
        'completed', completed,
        'failed', failed,
        'skipped', skipped,
        'failures', failures
    );
END;
$function$
$twuanis_0$; EXECUTE $twuanis_0$REVOKE ALL ON FUNCTION twuanis_canonical_private.retry_pending_price_integrity(integer) FROM PUBLIC, anon, authenticated, service_role$twuanis_0$; EXECUTE $twuanis_0$GRANT EXECUTE ON FUNCTION twuanis_canonical_private.retry_pending_price_integrity(integer) TO service_role$twuanis_0$; ELSE IF md5(pg_get_functiondef(f)) <> 'f1c8141ecb176a93a1467e4badc50474' THEN RAISE EXCEPTION 'Price integrity function differs: twuanis_canonical_private.retry_pending_price_integrity(integer)'; END IF; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='public.listing_monetary_events'::regclass AND tgname='price_integrity_invalidate_monetary_event' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_invalidate_monetary_event AFTER INSERT ON listing_monetary_events FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_invalidate_monetary_event AFTER INSERT ON listing_monetary_events FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_invalidate_monetary_event'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='public.listing_source_observations'::regclass AND tgname='price_integrity_invalidate_observation' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_invalidate_observation AFTER INSERT ON listing_source_observations FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_invalidate_observation AFTER INSERT ON listing_source_observations FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_invalidate_observation'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='public.listings'::regclass AND tgname='canonical_publication_price_integrity' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE CONSTRAINT TRIGGER canonical_publication_price_integrity AFTER INSERT OR UPDATE ON listings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_listing_price_integrity()$twuanis_0$; ELSIF actual <> 'CREATE CONSTRAINT TRIGGER canonical_publication_price_integrity AFTER INSERT OR UPDATE ON listings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_listing_price_integrity()' THEN RAISE EXCEPTION 'Price integrity trigger differs: canonical_publication_price_integrity'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='public.listings'::regclass AND tgname='price_integrity_invalidate_listing' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_invalidate_listing AFTER INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_invalidate_listing AFTER INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_change()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_invalidate_listing'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='twuanis_canonical_private.csv_source_evidence'::regclass AND tgname='price_integrity_invalidate_retained_evidence' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_invalidate_retained_evidence AFTER INSERT ON twuanis_canonical_private.csv_source_evidence FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_invalidate_retained_evidence AFTER INSERT ON twuanis_canonical_private.csv_source_evidence FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.invalidate_price_integrity_on_retained_evidence()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_invalidate_retained_evidence'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND tgname='price_integrity_evidence_immutable' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_evidence_immutable BEFORE DELETE OR UPDATE ON twuanis_canonical_private.listing_price_integrity_evidence FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_evidence_immutable BEFORE DELETE OR UPDATE ON twuanis_canonical_private.listing_price_integrity_evidence FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_evidence_immutable'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='twuanis_canonical_private.listing_price_integrity_evidence'::regclass AND tgname='price_integrity_evidence_no_truncate' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE TRIGGER price_integrity_evidence_no_truncate BEFORE TRUNCATE ON twuanis_canonical_private.listing_price_integrity_evidence FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability()$twuanis_0$; ELSIF actual <> 'CREATE TRIGGER price_integrity_evidence_no_truncate BEFORE TRUNCATE ON twuanis_canonical_private.listing_price_integrity_evidence FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.guard_price_integrity_evidence_immutability()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_evidence_no_truncate'; END IF; END $$;
DO $$ DECLARE actual text; BEGIN SELECT pg_get_triggerdef(oid, true) INTO actual FROM pg_trigger WHERE tgrelid='twuanis_canonical_private.price_integrity_pending'::regclass AND tgname='price_integrity_process_pending_deferred' AND NOT tgisinternal; IF actual IS NULL THEN EXECUTE $twuanis_0$CREATE CONSTRAINT TRIGGER price_integrity_process_pending_deferred AFTER INSERT OR UPDATE OF requested_at ON twuanis_canonical_private.price_integrity_pending DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.execute_pending_price_integrity()$twuanis_0$; ELSIF actual <> 'CREATE CONSTRAINT TRIGGER price_integrity_process_pending_deferred AFTER INSERT OR UPDATE OF requested_at ON twuanis_canonical_private.price_integrity_pending DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.execute_pending_price_integrity()' THEN RAISE EXCEPTION 'Price integrity trigger differs: price_integrity_process_pending_deferred'; END IF; END $$;
COMMIT;
