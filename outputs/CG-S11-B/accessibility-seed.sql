-- S11-C reviewed reference seed; query-76 supplies exact existing identities.
-- After Migration 006; postgres only. No inference/name-based identity resolution.
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' THEN RAISE EXCEPTION 'postgres required' USING ERRCODE='42501'; END IF;
 LOCK TABLE public.ontology_terms IN SHARE MODE;
 LOCK TABLE twuanis_canonical_private.accessibility_identity IN EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM (VALUES
  (1172::bigint,'2wd','2WD Accessible'),(1173,'paved','Paved Road'),
  (1174,'4x4','4x4 Required'),(1175,'walkable','Walkable'),(1176,'boat','Boat Access Only')
 ) e(id,code,label) LEFT JOIN public.ontology_terms t ON t.id=e.id
 WHERE t.id IS NULL OR t.term_type IS DISTINCT FROM 'accessibility' OR t.level IS DISTINCT FROM 1 OR t.term_name IS DISTINCT FROM e.label) THEN
  RAISE EXCEPTION 'reviewed accessibility reference identity mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.accessibility_identity a FULL JOIN
  (VALUES(1172::bigint,'2wd'),(1173,'paved'),(1174,'4x4'),(1175,'walkable'),(1176,'boat')) e(id,code)
  ON a.term_id=e.id WHERE a.term_id IS NOT NULL AND (e.id IS NULL OR a.code IS DISTINCT FROM e.code)) THEN
  RAISE EXCEPTION 'conflicting accessibility configuration'; END IF;
 INSERT INTO twuanis_canonical_private.accessibility_identity(term_id,code)
 SELECT * FROM (VALUES(1172::bigint,'2wd'),(1173,'paved'),(1174,'4x4'),(1175,'walkable'),(1176,'boat')) e(id,code)
 WHERE NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.accessibility_identity a WHERE a.term_id=e.id);
 IF (SELECT count(*) FROM twuanis_canonical_private.accessibility_identity)<>5 THEN RAISE EXCEPTION 'accessibility seed cardinality'; END IF;
END $$;
COMMIT;
