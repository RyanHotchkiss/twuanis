-- CG-3B2B2-S1: DORMANT ONLY. Do not deploy through blanket migration execution.
-- Dependencies: public.listings(id uuid), public.ontology_terms(id bigint,
-- term_type text, level integer), auth.users(id uuid), postgres and API roles.
-- No seeds, reconciliation, application grants, commands, or custom existing-table triggers.
-- PostgreSQL internal FK constraint triggers on existing tables are expected.
-- monthly_price bigint is deliberately unchanged; monetary cutover owns that change.
-- One-shot migration, matching 002/003: existing object/name collisions fail closed.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE SCHEMA twuanis_canonical_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA twuanis_canonical_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION twuanis_canonical_private.finite_numeric(v numeric)
RETURNS boolean LANGUAGE sql IMMUTABLE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp AS $f$
  SELECT v IS NULL OR v NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)
$f$;

CREATE FUNCTION twuanis_canonical_private.reject_immutable_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, pg_temp AS $f$
BEGIN
  RAISE EXCEPTION 'canonical immutable object % rejects %', TG_TABLE_NAME, TG_OP
    USING ERRCODE = '55000';
END
$f$;

CREATE TABLE public.publisher_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.capacity_policy_guard (
  id smallint PRIMARY KEY CHECK (id = 1)
);
-- Intentionally empty. S2 must establish exactly one guard before activating locks.
ALTER TABLE public.listings
  ADD COLUMN canonical_revision bigint NOT NULL DEFAULT 0 CHECK (canonical_revision >= 0),
  ADD COLUMN publisher_account_id uuid REFERENCES public.publisher_accounts(id) ON DELETE RESTRICT,
  ADD COLUMN publication_expires_at timestamptz;
CREATE INDEX listings_publisher_account_idx ON public.listings(publisher_account_id)
  WHERE publisher_account_id IS NOT NULL;

CREATE TABLE public.listing_semantic_selections (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  dimension text NOT NULL CHECK (dimension IN
    ('property_type','utility','environment','terrain','accessibility','legal_status')),
  ontology_term_id bigint NOT NULL REFERENCES public.ontology_terms(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, dimension, ontology_term_id)
);
CREATE UNIQUE INDEX listing_semantic_singleton_idx
  ON public.listing_semantic_selections(listing_id, dimension)
  WHERE dimension IN ('property_type','legal_status');
CREATE INDEX listing_semantic_term_idx ON public.listing_semantic_selections(ontology_term_id);

CREATE TABLE public.listing_fact_evidence (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  dimension text NOT NULL CHECK (dimension IN
    ('bedrooms','bathrooms','parking','year_built','distance_to_paved_road')),
  kind text NOT NULL CHECK (kind IN ('exact','category','range')),
  exact_value numeric,
  category_term_id bigint REFERENCES public.ontology_terms(id) ON DELETE RESTRICT,
  range_lower numeric,
  range_upper numeric,
  lower_inclusive boolean,
  upper_inclusive boolean,
  evidence_source text NOT NULL CHECK (evidence_source IN ('owner','source','manual','migration')),
  evidence_reference text CHECK (evidence_reference IS NULL OR length(evidence_reference) BETWEEN 1 AND 1024),
  observed_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, dimension),
  CHECK (
    (kind = 'exact' AND exact_value IS NOT NULL AND category_term_id IS NULL
      AND range_lower IS NULL AND range_upper IS NULL
      AND lower_inclusive IS NULL AND upper_inclusive IS NULL)
    OR (kind = 'category' AND exact_value IS NULL AND category_term_id IS NOT NULL
      AND range_lower IS NULL AND range_upper IS NULL
      AND lower_inclusive IS NULL AND upper_inclusive IS NULL
      AND dimension <> 'distance_to_paved_road')
    OR (kind = 'range' AND exact_value IS NULL AND category_term_id IS NULL
      AND (range_lower IS NOT NULL OR range_upper IS NOT NULL)
      AND lower_inclusive IS NOT NULL AND upper_inclusive IS NOT NULL
      AND (range_lower IS NOT NULL OR NOT lower_inclusive)
      AND (range_upper IS NOT NULL OR NOT upper_inclusive)
      AND NOT isempty(numrange(range_lower, range_upper,
        (CASE WHEN lower_inclusive THEN '[' ELSE '(' END) ||
        (CASE WHEN upper_inclusive THEN ']' ELSE ')' END))))
  ),
  CHECK (twuanis_canonical_private.finite_numeric(exact_value)
    AND twuanis_canonical_private.finite_numeric(range_lower)
    AND twuanis_canonical_private.finite_numeric(range_upper)),
  CHECK ((exact_value IS NULL OR exact_value >= 0)
    AND (range_lower IS NULL OR range_lower >= 0)
    AND (range_upper IS NULL OR range_upper >= 0)),
  CHECK (dimension <> 'bathrooms' OR kind <> 'exact' OR exact_value > 0),
  CHECK (dimension NOT IN ('bedrooms','parking','year_built') OR
    ((exact_value IS NULL OR exact_value = trunc(exact_value))
    AND (range_lower IS NULL OR range_lower = trunc(range_lower))
    AND (range_upper IS NULL OR range_upper = trunc(range_upper)))),
  CHECK (dimension <> 'year_built' OR
    ((exact_value IS NULL OR exact_value BETWEEN 1 AND 9999)
    AND (range_lower IS NULL OR range_lower BETWEEN 1 AND 9999)
    AND (range_upper IS NULL OR range_upper BETWEEN 1 AND 9999)))
);
CREATE INDEX listing_fact_category_idx ON public.listing_fact_evidence(category_term_id)
  WHERE category_term_id IS NOT NULL;

CREATE TABLE public.listing_classification_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL CHECK (domain IN
    ('property_area','construction_area','year_built','bedrooms','bathrooms','parking')),
  version integer NOT NULL CHECK (version > 0),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, version)
);
CREATE TABLE public.listing_classification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id uuid NOT NULL REFERENCES public.listing_classification_rule_sets(id) ON DELETE RESTRICT,
  ontology_term_id bigint NOT NULL REFERENCES public.ontology_terms(id) ON DELETE RESTRICT,
  bounds numrange NOT NULL CHECK (NOT isempty(bounds)),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_set_id, ontology_term_id),
  CHECK (twuanis_canonical_private.finite_numeric(lower(bounds))
    AND twuanis_canonical_private.finite_numeric(upper(bounds))),
  CHECK ((lower(bounds) IS NULL OR lower(bounds) >= 0)
    AND (upper(bounds) IS NULL OR upper(bounds) >= 0))
);
CREATE INDEX listing_classification_term_idx ON public.listing_classification_rules(ontology_term_id);

CREATE TABLE public.listing_membership_origins (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  ontology_term_id bigint NOT NULL REFERENCES public.ontology_terms(id) ON DELETE RESTRICT,
  origin_domain text NOT NULL CHECK (origin_domain IN ('geography','property_type',
    'utility','environment','terrain','accessibility','legal_status','bedrooms',
    'bathrooms','parking','year_built','property_area','construction_area')),
  classification_rule_id uuid REFERENCES public.listing_classification_rules(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, ontology_term_id, origin_domain)
);
CREATE INDEX listing_membership_origin_term_idx ON public.listing_membership_origins(ontology_term_id);
CREATE INDEX listing_membership_origin_rule_idx ON public.listing_membership_origins(classification_rule_id)
  WHERE classification_rule_id IS NOT NULL;
-- Deliberately no FK to, or trigger on, listings_ontology_terms: projection writes
-- and final cross-table assertions belong to the later canonical transaction.

CREATE TABLE public.canonical_operation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_kind text NOT NULL CHECK (authority_kind IN ('owner','trusted','system','migration')),
  authority_identity text NOT NULL CHECK (length(authority_identity) BETWEEN 1 AND 256 AND authority_identity COLLATE "C" ~ '[^[:space:]]'),
  operation_type text NOT NULL CHECK (operation_type ~ '^[a-z][a-z0-9_]{0,63}$'),
  request_id uuid NOT NULL,
  payload_fingerprint text NOT NULL CHECK (payload_fingerprint ~ '^[0-9a-f]{64}$'),
  outcome text NOT NULL CHECK (outcome IN ('succeeded','noop','stale','conflict','rejected')),
  listing_id uuid REFERENCES public.listings(id) ON DELETE RESTRICT,
  result_code text CHECK (result_code IS NULL OR length(result_code) BETWEEN 1 AND 128),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (authority_kind, authority_identity, operation_type, request_id)
);
CREATE INDEX canonical_receipt_listing_idx ON public.canonical_operation_receipts(listing_id)
  WHERE listing_id IS NOT NULL;
-- Receipts represent completed outcomes only. Future commands insert the receipt
-- in the same transaction; S1 does not implement payload comparison/replay logic.

CREATE TABLE public.listing_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL CHECK (length(source_name) BETWEEN 1 AND 128 AND source_name COLLATE "C" ~ '[^[:space:]]'),
  source_listing_id text NOT NULL CHECK (length(source_listing_id) BETWEEN 1 AND 256 AND source_listing_id COLLATE "C" ~ '[^[:space:]]'),
  source_observation_id text NOT NULL CHECK (length(source_observation_id) BETWEEN 1 AND 256 AND source_observation_id COLLATE "C" ~ '[^[:space:]]'),
  listing_id uuid REFERENCES public.listings(id) ON DELETE RESTRICT,
  source_observed_at timestamptz,
  processed_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL CHECK (outcome IN ('accepted','stale','conflict','rejected')),
  payload_fingerprint text NOT NULL CHECK (payload_fingerprint ~ '^[0-9a-f]{64}$'),
  evidence_reference text CHECK (evidence_reference IS NULL OR length(evidence_reference) BETWEEN 1 AND 1024),
  UNIQUE (source_name, source_listing_id, source_observation_id),
  UNIQUE (id, source_name, source_listing_id, listing_id),
  CHECK (outcome NOT IN ('accepted','stale','conflict') OR listing_id IS NOT NULL)
);
CREATE INDEX listing_source_observation_listing_idx ON public.listing_source_observations(listing_id, processed_at);

CREATE TABLE public.source_identity_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  observation_id uuid NOT NULL,
  source_name text NOT NULL,
  source_listing_id text NOT NULL,
  existing_transaction_type text NOT NULL CHECK (existing_transaction_type IN ('sale','rent')),
  observed_transaction_type text NOT NULL CHECK (observed_transaction_type IN ('sale','rent')),
  existing_province_code text NOT NULL CHECK (existing_province_code ~ '^[0-9]$'),
  existing_canton_code text NOT NULL CHECK (existing_canton_code ~ '^[0-9]{3}$'),
  observed_province_code text NOT NULL CHECK (observed_province_code ~ '^[0-9]$'),
  observed_canton_code text NOT NULL CHECK (observed_canton_code ~ '^[0-9]{3}$'),
  conflict_type text NOT NULL CHECK (conflict_type IN ('transaction','geography','transaction_and_geography')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  resolution_status text NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open','resolved','dismissed')),
  resolution_reference text CHECK (resolution_reference IS NULL OR (length(resolution_reference) BETWEEN 1 AND 1024 AND resolution_reference COLLATE "C" ~ '[^[:space:]]')),
  resolved_at timestamptz,
  UNIQUE (observation_id, listing_id),
  FOREIGN KEY (observation_id, source_name, source_listing_id, listing_id)
    REFERENCES public.listing_source_observations(id, source_name, source_listing_id, listing_id) ON DELETE RESTRICT,
  CHECK (left(existing_canton_code,1) = existing_province_code
    AND left(observed_canton_code,1) = observed_province_code),
  CHECK ((conflict_type IN ('transaction','transaction_and_geography')) =
    (existing_transaction_type <> observed_transaction_type)),
  CHECK ((conflict_type IN ('geography','transaction_and_geography')) =
    (existing_province_code <> observed_province_code OR existing_canton_code <> observed_canton_code)),
  CHECK ((resolution_status = 'open' AND resolution_reference IS NULL AND resolved_at IS NULL)
    OR (resolution_status IN ('resolved','dismissed') AND resolution_reference IS NOT NULL AND resolved_at IS NOT NULL))
);
CREATE INDEX source_identity_conflict_listing_idx ON public.source_identity_conflicts(listing_id, recorded_at);
-- Identity snapshots are historical evidence, not FK references to mutable labels.
-- No resolution function or application grant exists in S1.

CREATE TABLE public.listing_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  operation_id uuid NOT NULL REFERENCES public.canonical_operation_receipts(id) ON DELETE RESTRICT,
  listing_revision bigint NOT NULL CHECK (listing_revision >= 0),
  event_type text NOT NULL CHECK (event_type IN ('create','publish','renew','unpublish','expire','archive','restore','delete')),
  previous_state text CHECK (previous_state IN ('draft','active','expired','archived','deleted')),
  resulting_state text NOT NULL CHECK (resulting_state IN ('draft','active','expired','archived','deleted')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  actor_kind text NOT NULL CHECK (actor_kind IN ('owner','trusted','system','migration')),
  actor_identity text NOT NULL CHECK (length(actor_identity) BETWEEN 1 AND 256 AND actor_identity COLLATE "C" ~ '[^[:space:]]'),
  reason text CHECK (reason IS NULL OR length(reason) BETWEEN 1 AND 1024),
  publication_expires_at timestamptz,
  UNIQUE (operation_id, event_type),
  CHECK ((event_type = 'create' AND previous_state IS NULL AND resulting_state = 'draft')
    OR (previous_state IS NOT NULL AND (
      (event_type = 'publish' AND previous_state = 'draft' AND resulting_state = 'active')
      OR (event_type = 'renew' AND previous_state IN ('active','expired') AND resulting_state = 'active')
      OR (event_type = 'unpublish' AND previous_state = 'active' AND resulting_state = 'draft')
      OR (event_type = 'expire' AND previous_state = 'active' AND resulting_state = 'expired')
      OR (event_type = 'archive' AND previous_state IN ('draft','active','expired') AND resulting_state = 'archived')
      OR (event_type = 'restore' AND previous_state IN ('archived','deleted') AND resulting_state = 'draft')
      OR (event_type = 'delete' AND previous_state IN ('draft','active','expired','archived') AND resulting_state = 'deleted'))))
);
CREATE INDEX listing_lifecycle_chronology_idx ON public.listing_lifecycle_events(listing_id, listing_revision, recorded_at);

CREATE TABLE public.listing_monetary_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  operation_id uuid NOT NULL UNIQUE REFERENCES public.canonical_operation_receipts(id) ON DELETE RESTRICT,
  listing_revision bigint NOT NULL CHECK (listing_revision >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale','rent')),
  event_kind text NOT NULL CHECK (event_kind IN ('initial_observation','change','draft_removal','migration_baseline')),
  old_amount numeric,
  old_currency text,
  new_amount numeric,
  new_currency text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source_observed_at timestamptz,
  source_observation_id uuid REFERENCES public.listing_source_observations(id) ON DELETE RESTRICT,
  actor_kind text NOT NULL CHECK (actor_kind IN ('owner','trusted','system','migration')),
  actor_identity text NOT NULL CHECK (length(actor_identity) BETWEEN 1 AND 256 AND actor_identity COLLATE "C" ~ '[^[:space:]]'),
  reason text CHECK (reason IS NULL OR length(reason) BETWEEN 1 AND 1024),
  CHECK ((old_amount IS NULL AND old_currency IS NULL)
    OR (old_amount IS NOT NULL AND old_currency IS NOT NULL AND old_amount > 0 AND old_currency IN ('CRC','USD'))),
  CHECK ((new_amount IS NULL AND new_currency IS NULL)
    OR (new_amount IS NOT NULL AND new_currency IS NOT NULL AND new_amount > 0 AND new_currency IN ('CRC','USD'))),
  CHECK (twuanis_canonical_private.finite_numeric(old_amount) AND twuanis_canonical_private.finite_numeric(new_amount)),
  CHECK ((event_kind IN ('initial_observation','migration_baseline') AND old_amount IS NULL AND new_amount IS NOT NULL)
    OR (event_kind = 'change' AND old_amount IS NOT NULL AND new_amount IS NOT NULL
      AND (old_amount IS DISTINCT FROM new_amount OR old_currency IS DISTINCT FROM new_currency))
    OR (event_kind = 'draft_removal' AND old_amount IS NOT NULL AND new_amount IS NULL))
);
CREATE INDEX listing_monetary_chronology_idx ON public.listing_monetary_events(listing_id, listing_revision, recorded_at);
CREATE INDEX listing_monetary_source_idx ON public.listing_monetary_events(source_observation_id)
  WHERE source_observation_id IS NOT NULL;

CREATE FUNCTION twuanis_canonical_private.validate_new_term_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, pg_temp AS $f$
DECLARE v_id bigint; v_domain text; v_type text; v_level integer;
BEGIN
  IF TG_TABLE_NAME = 'listing_semantic_selections' THEN
    v_id := NEW.ontology_term_id; v_domain := NEW.dimension;
  ELSIF TG_TABLE_NAME = 'listing_fact_evidence' THEN
    IF NEW.kind <> 'category' THEN RETURN NEW; END IF;
    v_id := NEW.category_term_id; v_domain := NEW.dimension;
  ELSE
    RAISE EXCEPTION 'unexpected validator attachment' USING ERRCODE = '55000';
  END IF;
  SELECT t.term_type, t.level INTO STRICT v_type, v_level
    FROM public.ontology_terms t WHERE t.id = v_id FOR SHARE;
  IF v_type IS DISTINCT FROM v_domain OR v_level IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'term type/level mismatch for %', v_domain USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$f$;
CREATE TRIGGER validate_semantic_selection BEFORE INSERT OR UPDATE ON public.listing_semantic_selections
  FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_new_term_reference();
CREATE TRIGGER validate_fact_category BEFORE INSERT OR UPDATE ON public.listing_fact_evidence
  FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_new_term_reference();

CREATE FUNCTION twuanis_canonical_private.validate_classification_rule()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, pg_temp AS $f$
DECLARE v_domain text; v_type text; v_level integer;
BEGIN
  -- A fresh post-lock statement snapshot is required by this bounded validator.
  -- Reject other isolation levels rather than permit a stale overlap check.
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'classification insertion requires READ COMMITTED' USING ERRCODE = '0A000';
  END IF;
  -- Serialize inserts within a version without requiring a new extension.
  -- Classification publication/selection and lock integration belong to S3.
  SELECT s.domain INTO STRICT v_domain FROM public.listing_classification_rule_sets s
    WHERE s.id = NEW.rule_set_id FOR UPDATE;
  SELECT t.term_type, t.level INTO STRICT v_type, v_level FROM public.ontology_terms t
    WHERE t.id = NEW.ontology_term_id FOR SHARE;
  IF v_type IS DISTINCT FROM v_domain OR v_level IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'classification term type/level mismatch' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM public.listing_classification_rules r
    WHERE r.rule_set_id = NEW.rule_set_id AND r.bounds && NEW.bounds) THEN
    RAISE EXCEPTION 'classification bounds overlap within version' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$f$;
CREATE TRIGGER validate_classification_bounds BEFORE INSERT ON public.listing_classification_rules
  FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_classification_rule();

DO $block$
DECLARE v_table text; v_signature regprocedure;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['publisher_accounts','capacity_policy_guard',
    'listing_semantic_selections','listing_fact_evidence','listing_classification_rule_sets',
    'listing_classification_rules','listing_membership_origins','canonical_operation_receipts',
    'listing_source_observations','source_identity_conflicts','listing_lifecycle_events','listing_monetary_events']
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', v_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', v_table);
  END LOOP;
  FOREACH v_table IN ARRAY ARRAY['listing_lifecycle_events','listing_monetary_events',
    'listing_source_observations','canonical_operation_receipts',
    'listing_classification_rule_sets','listing_classification_rules']
  LOOP
    EXECUTE format('CREATE TRIGGER reject_immutable_rows BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.reject_immutable_mutation()', v_table);
    EXECUTE format('CREATE TRIGGER reject_immutable_truncate BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.reject_immutable_mutation()', v_table);
  END LOOP;
  FOR v_signature IN SELECT p.oid::regprocedure FROM pg_proc p
    WHERE p.pronamespace = 'twuanis_canonical_private'::regnamespace
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres', v_signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', v_signature);
  END LOOP;
END
$block$;
COMMIT;
