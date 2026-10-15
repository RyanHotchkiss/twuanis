-- Local Step 2 preparation only. No installation in production authorized.
-- Existing evidence tables and admission contracts retained; no new admission or selection rule.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='60s';
DO $$BEGIN
 IF current_user<>'postgres' OR md5(pg_get_functiondef('twuanis_remates_private.assert_bp_area_fact()'::regprocedure))<>'d359bc6552d08ae6dd4baa907e297038' THEN RAISE EXCEPTION '100 reviewed area predecessor drift';END IF;
END$$;
CREATE OR REPLACE FUNCTION twuanis_remates_private.assert_bp_area_fact()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE raw text; normalized text; amount numeric;
BEGIN
 IF NEW.dimension NOT IN('property_area','construction_area') OR NOT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions c JOIN twuanis_remates_private.sources s ON s.id=c.source_id WHERE c.id=NEW.classification_id AND s.namespace='bp-inventory') THEN RETURN NEW;END IF;
 -- Retention is not admission. Restricted appraisal observations cannot be relabelled as CSV facts.
 IF EXISTS(SELECT 1 FROM twuanis_remates_private.observations ob WHERE ob.id=NEW.evidence_id AND (ob.parser_version='remates-bp-inventory-appraisal-area-v1' OR EXISTS(SELECT 1 FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=ob.id AND f.field_path='pdf.source_use' AND f.raw_value='SOURCE-USE UNRESOLVED'))) THEN RAISE EXCEPTION 'restricted appraisal area evidence is not admitted' USING ERRCODE='23514';END IF;
 IF NEW.kind<>'exact' OR NEW.exact_value IS NULL OR NEW.exact_value<=0 OR NEW.field_path IS DISTINCT FROM 'csv.normalized_'||NEW.dimension THEN RAISE EXCEPTION 'explicit Banco Popular exact area evidence required' USING ERRCODE='23514';END IF;
 SELECT f.raw_value INTO raw FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=NEW.evidence_id AND f.field_path='csv.raw_'||NEW.dimension AND f.ordinal=NEW.ordinal;
 IF raw IS NULL OR btrim(raw)!~* '^([0-9]{1,3}([.][0-9]{3})+|[0-9]+)(,[0-9]{1,18})? *m(²|2)$' THEN RAISE EXCEPTION 'unambiguous original Banco Popular area required' USING ERRCODE='23514';END IF;
 amount:=replace(replace(regexp_replace(btrim(raw),' *m(²|2)$','','i'),'.',''),',','.')::numeric;
 SELECT f.raw_value INTO normalized FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=NEW.evidence_id AND f.field_path=NEW.field_path AND f.ordinal=NEW.ordinal AND f.unit='m2' AND f.validation='VALID';
 IF amount<=0 OR normalized IS NULL OR normalized!~ '^[0-9]+([.][0-9]+)?$' OR normalized::numeric<>amount OR NEW.exact_value<>amount THEN RAISE EXCEPTION 'area normalization/source identity mismatch' USING ERRCODE='23514';END IF;
 RETURN NEW;
END$function$;
COMMIT;
