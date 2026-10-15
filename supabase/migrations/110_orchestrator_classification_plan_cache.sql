BEGIN;
-- ORCH-FINAL-01: cache the unchanged classification query plan. No predicate or privilege changes.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('twuanis_remates_private.classification_minimum_valid(uuid)'::regprocedure),'UTF8')),'hex')<>'7b19ca996fbdb2088d930468c1292ea04962fb614545d5ebf4967099654f0f44' THEN RAISE EXCEPTION 'Unreviewed classification predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION twuanis_remates_private.classification_minimum_valid(cid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$BEGIN RETURN (SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions v
JOIN twuanis_remates_private.properties prop ON prop.id=v.property_id
JOIN twuanis_remates_private.source_bindings b ON b.id=v.binding_id
JOIN twuanis_remates_private.sources s ON s.id=v.source_id
JOIN twuanis_remates_private.offerings o ON o.id=b.offering_id
WHERE (s.namespace<>'bp-inventory' OR EXISTS(SELECT 1 FROM twuanis_remates_private.property_facts area WHERE area.classification_id=v.id AND area.dimension IN('property_area','construction_area') AND area.kind='exact' AND area.exact_value>0)) AND v.id=cid AND v.minimum_ready AND prop.identity_status='CONFIRMED' AND prop.revision=v.property_revision AND s.institution_id=v.institution_id AND b.source_id=v.source_id AND o.institution_id=v.institution_id
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions n WHERE n.institution_id=v.institution_id AND n.property_id=v.property_id AND n.revision>v.revision)
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.source_bindings n WHERE n.source_id=b.source_id AND n.record_key=b.record_key AND n.revision>b.revision)
AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pp JOIN public.ontology_terms p ON p.id=pp.term_id
JOIN twuanis_remates_private.property_terms cc ON cc.classification_id=pp.classification_id AND cc.dimension='geography' AND cc.selected JOIN public.ontology_terms c ON c.id=cc.term_id
WHERE pp.classification_id=v.id AND pp.dimension='geography' AND pp.selected AND p.term_type='province' AND p.level=1 AND p.parent_id=9 AND p.official_code ~ '^[0-9]$' AND p.term_name IS NOT NULL
AND c.term_type='canton' AND c.level=2 AND c.parent_id=p.id AND c.official_code ~ '^[0-9]{3}$' AND left(c.official_code,1)=p.official_code AND c.term_name IS NOT NULL
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms dd JOIN public.ontology_terms d ON d.id=dd.term_id WHERE dd.classification_id=v.id AND dd.dimension='geography' AND dd.selected AND d.id NOT IN(p.id,c.id) AND(d.term_type IS DISTINCT FROM 'district' OR d.level IS DISTINCT FROM 3 OR d.parent_id IS DISTINCT FROM c.id OR d.official_code IS NULL OR d.official_code !~ '^[0-9]{5}$' OR left(d.official_code,3) IS DISTINCT FROM c.official_code OR d.term_name IS NULL)))
AND EXISTS(SELECT 1 FROM public.ontology_terms WHERE id=9 AND term_type='country' AND level=0 AND parent_id=1 AND EXISTS(SELECT 1 FROM public.ontology_terms root WHERE root.id=1 AND root.term_type='root' AND root.level=0 AND root.parent_id IS NULL))
AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=v.id AND pt.dimension='property_type' AND pt.selected AND t.term_type='property_type' AND t.level=1 AND t.term_name IS NOT NULL))); END$function$
;
COMMIT;
