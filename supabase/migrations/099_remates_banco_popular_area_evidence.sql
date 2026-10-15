-- Banco Popular verified area evidence. Existing fact storage and Owner commands retained.
-- Forward-only, local validation only. No automatic reimport/publication/discovery.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='60s';
DO $$BEGIN
 IF current_user<>'postgres' OR to_regclass('twuanis_remates_private.independent_source_decisions') IS NULL OR
 md5(pg_get_functiondef('twuanis_remates_private.classification_minimum_valid(uuid)'::regprocedure))<>'6969e69be74e09362da00c0a3addcdbd' OR
 md5(pg_get_viewdef('twuanis_remates_private.public_projection'::regclass,true))<>'46e7c52c15350ee4d065c7b4a47b0fb0'
 THEN RAISE EXCEPTION '099 reviewed Remates area predecessor drift';END IF;
END$$;
CREATE FUNCTION twuanis_remates_private.assert_bp_area_fact() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE raw text; normalized text; amount numeric;
BEGIN
 IF NEW.dimension NOT IN('property_area','construction_area') OR NOT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions c JOIN twuanis_remates_private.sources s ON s.id=c.source_id WHERE c.id=NEW.classification_id AND s.namespace='bp-inventory') THEN RETURN NEW;END IF;
 IF NEW.kind<>'exact' OR NEW.exact_value IS NULL OR NEW.exact_value<=0 OR NEW.field_path IS DISTINCT FROM 'csv.normalized_'||NEW.dimension THEN RAISE EXCEPTION 'explicit Banco Popular exact area evidence required' USING ERRCODE='23514';END IF;
 SELECT f.raw_value INTO raw FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=NEW.evidence_id AND f.field_path='csv.raw_'||NEW.dimension AND f.ordinal=NEW.ordinal;
 IF raw IS NULL OR btrim(raw)!~* '^([0-9]{1,3}([.][0-9]{3})+|[0-9]+)(,[0-9]{1,18})? *m(²|2)$' THEN RAISE EXCEPTION 'unambiguous original Banco Popular area required' USING ERRCODE='23514';END IF;
 amount:=replace(replace(regexp_replace(btrim(raw),' *m(²|2)$','','i'),'.',''),',','.')::numeric;
 SELECT f.raw_value INTO normalized FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=NEW.evidence_id AND f.field_path=NEW.field_path AND f.ordinal=NEW.ordinal AND f.unit='m2' AND f.validation='VALID';
 IF amount<=0 OR normalized IS NULL OR normalized!~ '^[0-9]+([.][0-9]+)?$' OR normalized::numeric<>amount OR NEW.exact_value<>amount THEN RAISE EXCEPTION 'area normalization/source identity mismatch' USING ERRCODE='23514';END IF;
 RETURN NEW;
END$$;
ALTER FUNCTION twuanis_remates_private.assert_bp_area_fact() OWNER TO postgres;
REVOKE ALL ON FUNCTION twuanis_remates_private.assert_bp_area_fact() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER assert_bp_area_fact BEFORE INSERT ON twuanis_remates_private.property_facts FOR EACH ROW EXECUTE FUNCTION twuanis_remates_private.assert_bp_area_fact();
CREATE OR REPLACE FUNCTION twuanis_remates_private.classification_minimum_valid(cid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions v
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
AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=v.id AND pt.dimension='property_type' AND pt.selected AND t.term_type='property_type' AND t.level=1 AND t.term_name IS NOT NULL));
$function$;

CREATE OR REPLACE VIEW twuanis_remates_private.public_projection WITH(security_barrier=true) AS
 SELECT l.id,
    l.revision::text AS revision,
    l.offering_id,
    i.id AS institution_id,
    i.legal_name AS institution,
    COALESCE(fe.mechanism, 'UNKNOWN'::text) AS mechanism,
    l.state,
    twuanis_remates_private.publication_visibility(l.id) ->> 'label'::text AS visibility_label,
        CASE
            WHEN COALESCE(( SELECT d.publication_model
               FROM twuanis_remates_private.independent_source_decisions d
              WHERE d.source_id = s.id
              ORDER BY d.revision DESC
             LIMIT 1), 'REVIEWED_SOURCE_CONTENT'::text) = 'FACTUAL_ONLY'::text THEN ''::text
            ELSE COALESCE(( SELECT "left"(f.raw_value, 256) AS "left"
               FROM twuanis_remates_private.observation_fields f
              WHERE f.observation_id = ob.id AND f.field_path = 'title'::text AND f.validation = 'VALID'::text
              ORDER BY f.ordinal
             LIMIT 1), ''::text)
        END AS title,
    s.namespace AS source_name,
        CASE
            WHEN ob.source_url ~~ 'https://%'::text AND twuanis_remates_private.valid_evidence_locator(s.id, ob.source_url) THEN ob.source_url
            ELSE NULL::text
        END AS source_url,
    fv.amount::text AS amount,
    fv.currency,
    fv.kind AS financial_kind,
    fv.original_label AS financial_label,
    fv.round_key AS auction_round,
    pub.recorded_at AS published_at,
    ( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'terms', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id::text, 'type', t.term_type, 'parent', t.parent_id::text, 'en', COALESCE(to_jsonb(t.*) ->> 'term_name_en'::text, t.term_name), 'es', COALESCE(to_jsonb(t.*) ->> 'term_name_es'::text, t.term_name)) ORDER BY t.id), '[]'::jsonb) AS "coalesce"
                   FROM twuanis_remates_private.property_terms pt
                     JOIN ontology_terms t ON t.id = pt.term_id
                  WHERE pt.classification_id = c.id AND pt.selected AND (t.term_type = ANY (ARRAY['province'::text, 'canton'::text, 'district'::text, 'property_type'::text]))), 'area', ( SELECT property_facts.exact_value::text AS exact_value
                   FROM twuanis_remates_private.property_facts
                  WHERE property_facts.classification_id = c.id AND property_facts.dimension = 'property_area'::text AND property_facts.kind = 'exact'::text), 'construction_area', (SELECT pf.exact_value::text FROM twuanis_remates_private.property_facts pf WHERE pf.classification_id=c.id AND pf.dimension='construction_area' AND pf.kind='exact' AND pf.exact_value>0), 'images',
                CASE
                    WHEN s.namespace = 'bp-inventory'::text AND s.origin_host = 'srv.bancopopular.fi.cr'::text AND twuanis_remates_private.independent_source_allowed(s.id) AND COALESCE(( SELECT d.public_image_display
                       FROM twuanis_remates_private.independent_source_decisions d
                      WHERE d.source_id = s.id
                      ORDER BY d.revision DESC
                     LIMIT 1), false) AND (( SELECT count(*) AS count
                       FROM twuanis_remates_private.offering_properties single_property
                      WHERE single_property.offering_id = o.id)) = 1 THEN COALESCE(( SELECT jsonb_agg(ref.source_url ORDER BY ref.ordinal, ref.id) AS jsonb_agg
                       FROM ( SELECT a.id,
                                a.ordinal,
                                a.source_url
                               FROM twuanis_remates_private.media_assets a
                                 JOIN LATERAL ( SELECT ml.state
                                       FROM twuanis_remates_private.media_links ml
                                      WHERE ml.asset_id = a.id
                                      ORDER BY ml.revision DESC
                                     LIMIT 1) link ON true
                                 JOIN twuanis_remates_private.observation_fields field ON field.observation_id = a.observation_id AND field.field_path = a.field_path AND field.ordinal = a.ordinal
                              WHERE a.offering_id = o.id AND a.source_id = s.id AND a.observation_id = ob.id AND a.kind = 'SOURCE_REFERENCE'::text AND link.state = 'STAGED'::text AND a.field_path = 'csv.image_url'::text AND field.validation = 'VALID'::text AND field.raw_value = a.source_url AND a.source_url ~* '^https://srv[.]bancopopular[.]fi[.]cr/(?!.*([?#[:space:]]|[.][.]))[^?#[:space:]]+[.](jpg|jpeg|png|webp)$'::text
                              ORDER BY a.ordinal, a.id
                             LIMIT 32) ref), '[]'::jsonb)
                    ELSE '[]'::jsonb
                END)) AS jsonb_agg
           FROM twuanis_remates_private.offering_properties op
             JOIN twuanis_remates_private.properties p ON p.id = op.property_id
             JOIN LATERAL ( SELECT cc.id,
                    cc.institution_id,
                    cc.property_id,
                    cc.property_revision,
                    cc.source_id,
                    cc.observation_id,
                    cc.binding_id,
                    cc.revision,
                    cc.prior_id,
                    cc.actor_id,
                    cc.receipt_id,
                    cc.reason,
                    cc.snapshot,
                    cc.minimum_ready,
                    cc.recorded_at
                   FROM twuanis_remates_private.classification_versions cc
                  WHERE cc.property_id = p.id
                  ORDER BY cc.revision DESC
                 LIMIT 1) c ON true
          WHERE op.offering_id = o.id) AS properties
   FROM twuanis_remates_private.listings l
     JOIN twuanis_remates_private.offerings o ON o.id = l.offering_id
     JOIN twuanis_remates_private.institutions i ON i.id = o.institution_id
     JOIN twuanis_remates_private.sources s ON s.id = o.source_id
     JOIN LATERAL ( SELECT e.id,
            e.institution_id,
            e.source_id,
            e.listing_id,
            e.offering_id,
            e.revision,
            e.prior_id,
            e.state,
            e.operation,
            e.policy_id,
            e.ingestion_id,
            e.financial_event_id,
            e.verification_id,
            e.actor_id,
            e.receipt_id,
            e.reason,
            e.evidence,
            e.transaction_id,
            e.recorded_at
           FROM twuanis_remates_private.publication_events e
          WHERE e.listing_id = l.id
          ORDER BY e.revision DESC
         LIMIT 1) pub ON true
     LEFT JOIN twuanis_remates_private.ingestion_results ir ON ir.id = pub.ingestion_id
     LEFT JOIN twuanis_remates_private.observations ob ON ob.id = ir.observation_id
     LEFT JOIN twuanis_remates_private.offering_events fe ON fe.id = pub.financial_event_id
     LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id = fe.selected_value_id AND (fv.kind = ANY (ARRAY['SELLING_PRICE'::text, 'AUCTION_BASE'::text]))
  WHERE COALESCE(( SELECT delivery_versions.enabled
           FROM twuanis_remates_private.delivery_versions
          ORDER BY delivery_versions.revision DESC
         LIMIT 1), false) AND (twuanis_remates_private.publication_visibility(l.id) -> 'visible'::text) = 'true'::jsonb;
COMMIT;
