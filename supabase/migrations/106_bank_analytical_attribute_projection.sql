-- Phase 5.3G: categorical facts remain in otherFacts; only canonical semantic
-- relationships belong in semantics. Correct both existing evidence projections.
-- No evidence, ontology, authority, permissions, or mathematical changes.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $bank_attribute_projection$
DECLARE
  target record;
  definition text;
  original_predicate constant text := $old$pt.dimension NOT IN('geography')$old$;
  corrected_predicate constant text := $new$pt.dimension IN('property_type','utility','environment','terrain','accessibility','legal_status')$new$;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('public.read_canonical_bank_analytical_evidence(uuid,text,text,uuid)'::regprocedure,'5da4d232408f015247fc44b8fa3e1163c5166abd771aed93c7b24dab995654db'::text),
    ('public.read_orchestrator_bank_evidence(jsonb,text,text,text,uuid)'::regprocedure,'dd0bfab1c076ba2e010feaf936b5d76ba60d72245323f2c98d1fdc1064724191'::text)
  ) AS reviewed(signature,body_sha256) LOOP
    IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=target.signature)
        IS DISTINCT FROM target.body_sha256 THEN
      RAISE EXCEPTION '106 Bank analytical reader predecessor mismatch: %',target.signature;
    END IF;
    definition := pg_get_functiondef(target.signature);
    IF (length(definition)-length(replace(definition,original_predicate,'')))/length(original_predicate) <> 1 THEN
      RAISE EXCEPTION '106 expected exactly one semantic projection predicate: %',target.signature;
    END IF;
    -- CREATE OR REPLACE retains object identity, owner and execution ACL.
    -- pg_get_functiondef retains the complete function configuration and body.
    EXECUTE replace(definition,original_predicate,corrected_predicate);
  END LOOP;
END
$bank_attribute_projection$;
COMMIT;
