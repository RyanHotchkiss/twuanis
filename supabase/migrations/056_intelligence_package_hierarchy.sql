-- LOCAL ONLY. Approved hierarchical current configurations; immutable history retained.
BEGIN;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.validate_package_catalog() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=p.current_configuration_id WHERE p.state='active' AND (cardinality(v.capabilities)=0 OR (SELECT count(*) FROM twuanis_canonical_private.intelligence_package_prices s WHERE s.package_id=p.id)<>2)) THEN RAISE EXCEPTION 'active package incomplete'; END IF;
 RETURN NULL;
END $$;
DO $$
DECLARE p twuanis_canonical_private.intelligence_packages%ROWTYPE;c twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;caps text[];newid uuid;
BEGIN
 LOCK TABLE twuanis_canonical_private.intelligence_packages IN SHARE ROW EXCLUSIVE MODE;
 FOR p IN SELECT * FROM twuanis_canonical_private.intelligence_packages WHERE id IN('pkg-matching-market-comparison','pkg-pricing-position-relationships') ORDER BY id LOOP
 SELECT * INTO STRICT c FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=p.current_configuration_id;
 IF p.id='pkg-matching-market-comparison' THEN
 SELECT array_agg(DISTINCT x ORDER BY x) INTO caps FROM twuanis_canonical_private.intelligence_package_configurations v CROSS JOIN LATERAL unnest(v.capabilities)x WHERE v.id IN('04000000-0000-4000-8000-000000000001','04000000-0000-4000-8000-000000000002');
 newid:='05600000-0000-4000-8000-000000000002';
 ELSE SELECT array_agg(id ORDER BY id) INTO caps FROM twuanis_canonical_private.intelligence_capabilities;newid:='05600000-0000-4000-8000-000000000003';END IF;
 IF c.capabilities=caps AND c.id=newid THEN CONTINUE;END IF;
 IF c.id<>(CASE WHEN p.id='pkg-matching-market-comparison' THEN '04000000-0000-4000-8000-000000000002'::uuid ELSE '04000000-0000-4000-8000-000000000003'::uuid END) OR c.version<>1 OR c.term_quantity<>1 OR c.term_unit<>'month' OR cardinality(caps)<>(CASE WHEN p.id='pkg-matching-market-comparison' THEN 7 ELSE 17 END) THEN RAISE EXCEPTION 'unexpected Package hierarchy baseline';END IF;
 INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) VALUES(newid,p.id,c.version+1,c.term_quantity,c.term_unit,caps);
 UPDATE twuanis_canonical_private.intelligence_packages SET current_configuration_id=newid,revision=revision+1,updated_at=clock_timestamp() WHERE id=p.id;
 END LOOP;
END$$;
CREATE OR REPLACE FUNCTION public.read_customer_package_catalog(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(x.value || jsonb_build_object('additionalCapabilityLabels',(SELECT jsonb_agg(jsonb_build_object('id',c.id,'en',c.name_en,'es',c.name_es) ORDER BY c.id) FROM twuanis_canonical_private.intelligence_capabilities c WHERE c.id IN(SELECT jsonb_array_elements_text(x.value->'capabilities')) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=p.current_configuration_id WHERE p.id=CASE x.value->>'id' WHEN 'pkg-matching-market-comparison' THEN 'pkg-geographic-distribution-price-range' WHEN 'pkg-pricing-position-relationships' THEN 'pkg-matching-market-comparison' ELSE NULL END AND c.id=ANY(v.capabilities))),'capabilityLabels',(
 SELECT jsonb_agg(jsonb_build_object('id',c.id,'en',c.name_en,'es',c.name_es) ORDER BY c.id)
 FROM twuanis_canonical_private.intelligence_capabilities c WHERE c.id IN(SELECT jsonb_array_elements_text(x.value->'capabilities')))) ORDER BY x.value->>'id'),'[]')
 FROM jsonb_array_elements(public.read_intelligence_package_catalog(p_after)) x
$$;
REVOKE ALL ON FUNCTION public.read_customer_package_catalog(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_customer_package_catalog(text) TO anon,authenticated,service_role;

COMMIT;
